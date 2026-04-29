# Micro-Lending Platform - Implementation Guide

## Overview
Comprehensive micro-lending system with smart contracts, backend API, and interactive frontend dashboard.

## Architecture

### 1. Smart Contract (Soroban/Rust)
**File**: `contracts/src/lending.rs`

- **Core Functions**:
  - `initialize()` - Setup contract with admin
  - `request_loan()` - Borrower requests new loan
  - `approve_loan()` - Admin approves pending loan
  - `repay_loan()` - Borrower makes repayment
  - `mark_default()` - Admin marks loan as defaulted
  - `get_credit_score()` - Get user credit score
  - `pause()/resume()` - Emergency pause mechanism

- **Key Features**:
  - Event emissions for all critical actions
  - Access control with admin role
  - Credit score calculation
  - Gas optimization
  - Pause/resume emergency controls

### 2. Backend API (Node.js/Express)
**File**: `backend/src/routes/lending.routes.ts`

- **Endpoints**:
  ```
  POST   /lending              - Request new loan
  GET    /lending/:id          - Get loan details (cached)
  GET    /lending              - List user loans (cached)
  POST   /lending/:id/repay    - Make repayment
  GET    /lending/score/:user_id - Get credit score (cached)
  GET    /lending/transactions/:user_id - Transaction history
  POST   /lending/:id/approve  - Admin: Approve loan
  POST   /lending/:id/default  - Admin: Mark default
  ```

- **Features**:
  - Rate limiting (100 req/15min per IP)
  - Caching middleware for performance
  - Input validation
  - Error handling
  - Comprehensive logging

### 3. Frontend Components (React/TypeScript)
**Location**: `frontend/src/components/lending/`

- **Components**:
  - `LoanApplicationForm` - Submit new loan request
  - `LoanDashboard` - Overview of all user loans
  - `CreditScoreCard` - Display credit metrics
  - `RepaymentTracker` - Make payments with progress
  - `TransactionHistory` - View payment records

- **Page**: `frontend/src/pages/lending.tsx`
  - Main lending interface with tab navigation
  - Dashboard, Apply, and Repayment tabs

## Database Schema

### Loan Table
```sql
CREATE TABLE loans (
  id INT PRIMARY KEY AUTO_INCREMENT,
  borrower_id INT,
  principal BIGINT,
  interest_rate INT (default 500 = 5%),
  duration_days INT,
  collateral_amount BIGINT,
  status VARCHAR (PENDING, ACTIVE, REPAID, DEFAULTED),
  repaid_amount BIGINT (default 0),
  created_at TIMESTAMP,
  due_date TIMESTAMP,
  updated_at TIMESTAMP
)
```

### RepaymentRecord Table
```sql
CREATE TABLE repayment_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  loan_id INT,
  amount BIGINT,
  timestamp TIMESTAMP,
  remaining_balance BIGINT,
  FOREIGN KEY (loan_id) REFERENCES loans(id)
)
```

### CreditScore Table
```sql
CREATE TABLE credit_scores (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNIQUE,
  score INT (default 600),
  loans_completed INT (default 0),
  default_count INT (default 0),
  total_repaid BIGINT (default 0)
)
```

## Setup Instructions

### 1. Database Migration
```bash
cd backend
npx prisma migrate dev --name add_lending_tables
npx prisma generate
```

### 2. Start Backend Server
```bash
cd backend
npm run dev
# Server runs on http://localhost:3000
```

### 3. Start Frontend Dev Server
```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:3001
```

### 4. Compile Smart Contract
```bash
cd contracts
cargo build --release --target wasm32-unknown-unknown
```

## API Usage Examples

### Request a Loan
```bash
curl -X POST http://localhost:3000/api/lending \
  -H "Content-Type: application/json" \
  -d '{
    "borrower_id": 1,
    "principal": 1000,
    "interest_rate": 500,
    "duration_days": 30,
    "collateral": 1500
  }'
```

### Get Loan Details
```bash
curl http://localhost:3000/api/lending/1
```

### Make Repayment
```bash
curl -X POST http://localhost:3000/api/lending/1/repay \
  -H "Content-Type: application/json" \
  -d '{"amount": 250}'
```

### Get Credit Score
```bash
curl http://localhost:3000/api/lending/score/1
```

## Credit Scoring Algorithm

- **Base Score**: 600
- **Completion Bonus**: +50 per completed loan (max 850)
- **Default Penalty**: -100 per default
- **Minimum Score**: 300

**Score Ranges**:
- 750+: Excellent
- 650-749: Good
- 550-649: Fair
- <550: Poor

## Security Features

✅ Input validation on all endpoints
✅ Rate limiting (express-rate-limit)
✅ Collateral requirement (minimum = principal)
✅ Access control (admin-only functions)
✅ Pause/resume emergency mechanism
✅ Event logging for all transactions
✅ WCAG 2.1 AA accessible UI components
✅ Smart contract security patterns

## Testing

### Backend Tests
```bash
cd backend
npm test
```

### Smart Contract Tests
```bash
cd contracts
cargo test
```

## Performance Metrics

- API Response Time: <500ms (cached: <100ms)
- Page Load Time: <2s
- Credit Score Calculation: <100ms
- Loan Approval: <1s

## Future Enhancements

1. **WebSocket Integration**: Real-time loan updates
2. **Advanced Credit Scoring**: ML-based score prediction
3. **Loan Staking**: Users can stake to become lenders
4. **Governance**: DAO-based loan approvals
5. **Multi-Currency**: Support multiple assets
6. **Automated Repayment**: Scheduled payments
7. **Collateral Liquidation**: Automatic liquidation on default
8. **Insurance Pool**: Loan default insurance

## Troubleshooting

### Database Connection Error
```bash
# Ensure PostgreSQL is running
# Update .env with correct DATABASE_URL
npx prisma db push
```

### Smart Contract Deploy Issues
```bash
# Check Soroban SDK version
cargo --version
# Ensure Rust is updated
rustup update
```

### Frontend API 404
```bash
# Verify backend server is running on port 3000
# Check lending.routes.ts is imported in backend/src/routes/index.ts
```

## File Structure
```
├── contracts/src/
│   └── lending.rs                    # Soroban smart contract
├── backend/src/
│   └── routes/
│       └── lending.routes.ts         # API endpoints
│   └── prisma/
│       └── schema.prisma             # Database schema
└── frontend/src/
    ├── components/lending/
    │   ├── LoanApplicationForm.tsx
    │   ├── LoanDashboard.tsx
    │   ├── CreditScoreCard.tsx
    │   ├── RepaymentTracker.tsx
    │   ├── TransactionHistory.tsx
    │   └── index.ts
    ├── lib/
    │   └── lending.ts                # API helper functions
    └── pages/
        └── lending.tsx               # Main lending page
```

## Support

For issues or questions:
1. Check this guide's troubleshooting section
2. Review smart contract events for errors
3. Check backend logs for API issues
4. Verify database connectivity
5. Review browser console for frontend errors

---
**Last Updated**: 2026-04-29
**Status**: Ready for Integration Testing
