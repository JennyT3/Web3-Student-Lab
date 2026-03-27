use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, panic_with_error, Address, Env, Vec,
};

#[contracttype]
#[derive(Clone)]
enum DataKey {
    CertificateContract,
    Balance(Address, u32),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum TokenError {
    AlreadyInitialized = 1,
    NotAuthorized = 2,
    InvalidAmount = 3,
}

#[contract]
pub struct RsTokenContract;

#[contractimpl]
impl RsTokenContract {
    /// Stores the certificate contract address allowed to mint RS-Tokens.
    pub fn init(env: Env, certificate_contract: Address) {
        if env.storage().instance().has(&DataKey::CertificateContract) {
            panic_with_error!(&env, TokenError::AlreadyInitialized);
        }

        env.storage()
            .instance()
            .set(&DataKey::CertificateContract, &certificate_contract);
    }

    /// Mints non-transferable RS-Tokens to a student for a specific token ID.
    /// Only the configured certificate contract address may call this.
    pub fn mint(env: Env, caller: Address, student: Address, token_id: u32, amount: i128) {
        caller.require_auth();

        let certificate_contract: Address = env
            .storage()
            .instance()
            .get(&DataKey::CertificateContract)
            .unwrap();

        if caller != certificate_contract {
            panic_with_error!(&env, TokenError::NotAuthorized);
        }

        if amount <= 0 {
            panic_with_error!(&env, TokenError::InvalidAmount);
        }

        let balance_key = DataKey::Balance(student, token_id);
        let current_balance: i128 = env.storage().instance().get(&balance_key).unwrap_or(0);
        env.storage()
            .instance()
            .set(&balance_key, &(current_balance + amount));
    }

    /// Gets the balance of a specific token ID for a student.
    pub fn get_balance(env: Env, student: Address, token_id: u32) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::Balance(student, token_id))
            .unwrap_or(0)
    }

    /// Gets the balances of multiple token IDs for multiple students in a batch.
    /// Returns a vector of balances in the same order as the input.
    pub fn balance_of_batch(
        env: Env,
        students: Vec<Address>,
        token_ids: Vec<u32>,
    ) -> Vec<i128> {
        let student_count = students.len();
        let token_id_count = token_ids.len();

        // If counts don't match, we can't pair them properly
        // For simplicity, we require equal counts and pair them by index
        if student_count != token_id_count {
            // Return empty vector if counts don't match
            return Vec::new(&env);
        }

        let mut balances: Vec<i128> = Vec::new(&env);

        for i in 0..student_count {
            let student = students.get(i).unwrap();
            let token_id = token_ids.get(i).unwrap();
            let balance = Self::get_balance(env.clone(), student, token_id);
            balances.push_back(balance);
        }

        balances
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{testutils::Address as _, vec, Address, Env};

    #[test]
    fn mints_balance_for_student_when_called_by_certificate_contract() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(RsTokenContract, ());
        let client = RsTokenContractClient::new(&env, &contract_id);

        let certificate_contract = Address::generate(&env);
        let student = Address::generate(&env);

        client.init(&certificate_contract);
        client.mint(&certificate_contract, &student, &1, &25);

        assert_eq!(client.get_balance(&student, &1), 25);
    }

    #[test]
    #[should_panic]
    fn rejects_mint_from_non_certificate_contract() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(RsTokenContract, ());
        let client = RsTokenContractClient::new(&env, &contract_id);

        let certificate_contract = Address::generate(&env);
        let unauthorized = Address::generate(&env);
        let student = Address::generate(&env);

        client.init(&certificate_contract);
        client.mint(&unauthorized, &student, &1, &10);
    }

    #[test]
    fn mints_different_token_ids_for_same_student() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(RsTokenContract, ());
        let client = RsTokenContractClient::new(&env, &contract_id);

        let certificate_contract = Address::generate(&env);
        let student = Address::generate(&env);

        client.init(&certificate_contract);

        // Mint badge (token_id = 1) and credits (token_id = 2)
        client.mint(&certificate_contract, &student, &1, &1); // Badge
        client.mint(&certificate_contract, &student, &2, &100); // Credits

        assert_eq!(client.get_balance(&student, &1), 1);
        assert_eq!(client.get_balance(&student, &2), 100);
    }

    #[test]
    fn balance_of_batch_returns_multiple_balances() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(RsTokenContract, ());
        let client = RsTokenContractClient::new(&env, &contract_id);

        let certificate_contract = Address::generate(&env);
        let student1 = Address::generate(&env);
        let student2 = Address::generate(&env);

        client.init(&certificate_contract);

        // Mint different tokens for different students
        client.mint(&certificate_contract, &student1, &1, &10);
        client.mint(&certificate_contract, &student1, &2, &20);
        client.mint(&certificate_contract, &student2, &1, &30);
        client.mint(&certificate_contract, &student2, &2, &40);

        // Query batch balances
        let students = vec![&env, student1.clone(), student2.clone()];
        let token_ids = vec![&env, 1u32, 2u32];

        let balances = client.balance_of_batch(&students, &token_ids);

        assert_eq!(balances.len(), 2);
        assert_eq!(balances.get(0).unwrap(), 10); // student1, token_id 1
        assert_eq!(balances.get(1).unwrap(), 40); // student2, token_id 2
    }
}
