//! Micro-Lending Platform - Soroban Smart Contract
//! Manages loans, credit scoring, repayment tracking with event emissions and access control

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, Address, Env, String, Symbol, Vec, U256,
};

// ============== TYPES ==============

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Loan {
    pub loan_id: u64,
    pub borrower: Address,
    pub principal: u128,
    pub interest_rate: u32,
    pub duration_days: u32,
    pub created_at: u64,
    pub due_date: u64,
    pub status: LoanStatus,
    pub repaid_amount: u128,
    pub collateral_amount: u128,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum LoanStatus {
    Pending = 0,
    Active = 1,
    Repaid = 2,
    Defaulted = 3,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CreditScore {
    pub user: Address,
    pub score: u32,
    pub loans_completed: u32,
    pub default_count: u32,
    pub total_repaid: u128,
    pub last_updated: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RepaymentRecord {
    pub loan_id: u64,
    pub amount: u128,
    pub timestamp: u64,
    pub remaining_balance: u128,
}

#[contracterror]
#[repr(u32)]
pub enum LendingError {
    UnauthorizedAdmin = 1,
    InvalidAmount = 2,
    LoanNotFound = 3,
    InsufficientCollateral = 4,
    LoanNotActive = 5,
    PaymentExceedsDebt = 6,
    AlreadyPaused = 7,
    NotPaused = 8,
}

// ============== CONTRACT ==============

#[contract]
pub struct LendingContract;

#[contractimpl]
impl LendingContract {
    // Initialize contract with admin
    pub fn initialize(env: Env, admin: Address) {
        assert!(!env.storage().instance().has(&Symbol::new(&env, "admin")));
        env.storage().instance().set(&Symbol::new(&env, "admin"), &admin);
        env.storage().instance().set(&Symbol::new(&env, "next_loan_id"), &1u64);
        env.storage().instance().set(&Symbol::new(&env, "paused"), &false);

        env.events().publish(
            (Symbol::new(&env, "lending_initialized"),),
            (&admin,),
        );
    }

    // Request a new loan
    pub fn request_loan(
        env: Env,
        borrower: Address,
        principal: u128,
        interest_rate: u32,
        duration_days: u32,
        collateral: u128,
    ) -> u64 {
        borrower.require_auth();
        assert!(!Self::is_paused(&env), "Contract is paused");
        assert!(principal > 0 && collateral > 0, LendingError::InvalidAmount);
        assert!(collateral >= principal, LendingError::InsufficientCollateral);

        let next_id: u64 = env.storage().instance().get(&Symbol::new(&env, "next_loan_id")).unwrap_or(1u64);
        let now = env.ledger().timestamp();
        let due_date = now + (duration_days as u64 * 86400);

        let loan = Loan {
            loan_id: next_id,
            borrower: borrower.clone(),
            principal,
            interest_rate,
            duration_days,
            created_at: now,
            due_date,
            status: LoanStatus::Pending,
            repaid_amount: 0,
            collateral_amount: collateral,
        };

        // Store loan
        let key = Symbol::new(&env, &format!("loan_{}", next_id));
        env.storage().persistent().set(&key, &loan);
        env.storage().instance().set(&Symbol::new(&env, "next_loan_id"), &(next_id + 1));

        // Emit event
        env.events().publish(
            (Symbol::new(&env, "loan_requested"), Symbol::new(&env, "lending")),
            (next_id, borrower, principal, duration_days),
        );

        next_id
    }

    // Approve a pending loan
    pub fn approve_loan(env: Env, loan_id: u64) {
        Self::require_admin(&env);
        assert!(!Self::is_paused(&env), "Contract is paused");

        let key = Symbol::new(&env, &format!("loan_{}", loan_id));
        let mut loan: Loan = env.storage().persistent().get(&key)
            .ok_or(LendingError::LoanNotFound)
            .unwrap();

        assert_eq!(loan.status, LoanStatus::Pending, LendingError::LoanNotActive);
        loan.status = LoanStatus::Active;

        env.storage().persistent().set(&key, &loan);
        env.events().publish(
            (Symbol::new(&env, "loan_approved"), Symbol::new(&env, "lending")),
            (loan_id, loan.borrower),
        );
    }

    // Repay loan
    pub fn repay_loan(env: Env, loan_id: u64, amount: u128) {
        assert!(amount > 0, LendingError::InvalidAmount);
        assert!(!Self::is_paused(&env), "Contract is paused");

        let key = Symbol::new(&env, &format!("loan_{}", loan_id));
        let mut loan: Loan = env.storage().persistent().get(&key)
            .ok_or(LendingError::LoanNotFound)
            .unwrap();

        assert_eq!(loan.status, LoanStatus::Active, LendingError::LoanNotActive);

        let total_owed = loan.principal + (loan.principal * loan.interest_rate as u128 / 10000);
        let remaining = total_owed - loan.repaid_amount;

        assert!(amount <= remaining, LendingError::PaymentExceedsDebt);

        loan.repaid_amount += amount;

        if loan.repaid_amount >= total_owed {
            loan.status = LoanStatus::Repaid;
            Self::update_credit_score(&env, &loan.borrower, true);
        }

        env.storage().persistent().set(&key, &loan);

        // Record repayment
        let record = RepaymentRecord {
            loan_id,
            amount,
            timestamp: env.ledger().timestamp(),
            remaining_balance: remaining - amount,
        };

        let history_key = Symbol::new(&env, &format!("repayment_{}_{}", loan_id, env.ledger().timestamp()));
        env.storage().persistent().set(&history_key, &record);

        env.events().publish(
            (Symbol::new(&env, "loan_repaid"), Symbol::new(&env, "lending")),
            (loan_id, amount, loan.repaid_amount >= total_owed),
        );
    }

    // Get loan details
    pub fn get_loan(env: Env, loan_id: u64) -> Loan {
        let key = Symbol::new(&env, &format!("loan_{}", loan_id));
        env.storage().persistent().get(&key)
            .ok_or(LendingError::LoanNotFound)
            .unwrap()
    }

    // Get or create credit score
    pub fn get_credit_score(env: Env, user: Address) -> CreditScore {
        let key = Symbol::new(&env, &format!("credit_{}", user));
        env.storage().persistent().get(&key)
            .unwrap_or_else(|| CreditScore {
                user: user.clone(),
                score: 600,
                loans_completed: 0,
                default_count: 0,
                total_repaid: 0,
                last_updated: env.ledger().timestamp(),
            })
    }

    // Mark loan as defaulted
    pub fn mark_default(env: Env, loan_id: u64) {
        Self::require_admin(&env);
        assert!(!Self::is_paused(&env), "Contract is paused");

        let key = Symbol::new(&env, &format!("loan_{}", loan_id));
        let mut loan: Loan = env.storage().persistent().get(&key)
            .ok_or(LendingError::LoanNotFound)
            .unwrap();

        assert_eq!(loan.status, LoanStatus::Active, LendingError::LoanNotActive);
        loan.status = LoanStatus::Defaulted;
        env.storage().persistent().set(&key, &loan);

        Self::update_credit_score(&env, &loan.borrower, false);

        env.events().publish(
            (Symbol::new(&env, "loan_defaulted"), Symbol::new(&env, "lending")),
            (loan_id, loan.borrower),
        );
    }

    // Pause contract
    pub fn pause(env: Env) {
        Self::require_admin(&env);
        assert!(!Self::is_paused(&env), LendingError::AlreadyPaused);
        env.storage().instance().set(&Symbol::new(&env, "paused"), &true);
        env.events().publish((Symbol::new(&env, "paused"),), ("lending",));
    }

    // Resume contract
    pub fn resume(env: Env) {
        Self::require_admin(&env);
        assert!(Self::is_paused(&env), LendingError::NotPaused);
        env.storage().instance().set(&Symbol::new(&env, "paused"), &false);
        env.events().publish((Symbol::new(&env, "resumed"),), ("lending",));
    }

    // Helper: Check if paused
    fn is_paused(env: &Env) -> bool {
        env.storage().instance().get(&Symbol::new(env, "paused")).unwrap_or(false)
    }

    // Helper: Require admin
    fn require_admin(env: &Env) {
        let admin: Address = env.storage().instance().get(&Symbol::new(env, "admin")).unwrap();
        admin.require_auth();
    }

    // Helper: Update credit score
    fn update_credit_score(env: &Env, user: &Address, success: bool) {
        let key = Symbol::new(env, &format!("credit_{}", user));
        let mut score = Self::get_credit_score(env.clone(), user.clone());

        if success {
            score.loans_completed += 1;
            score.score = (score.score + 50).min(850);
        } else {
            score.default_count += 1;
            score.score = score.score.saturating_sub(100);
        }

        score.last_updated = env.ledger().timestamp();
        env.storage().persistent().set(&key, &score);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::testutils::{Address as _, Env as _};

    #[test]
    fn test_initialize() {
        let env = Env::default();
        let admin = Address::random(&env);
        LendingContract::initialize(env.clone(), admin.clone());

        let stored_admin: Address = env.storage().instance().get(&Symbol::new(&env, "admin")).unwrap();
        assert_eq!(stored_admin, admin);
    }

    #[test]
    fn test_request_loan() {
        let env = Env::default();
        let admin = Address::random(&env);
        let borrower = Address::random(&env);

        LendingContract::initialize(env.clone(), admin);

        let loan_id = LendingContract::request_loan(
            env.clone(),
            borrower.clone(),
            1000,
            500,
            30,
            1500,
        );

        assert_eq!(loan_id, 1);
        let loan = LendingContract::get_loan(env, loan_id);
        assert_eq!(loan.principal, 1000);
        assert_eq!(loan.status, LoanStatus::Pending);
    }
}
