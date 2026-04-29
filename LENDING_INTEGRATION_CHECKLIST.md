# Micro-Lending Platform - Integration Checklist

## Pre-Integration Setup

### 1. Database Migrations
```bash
# From /backend directory
npx prisma migrate dev --name add_lending_tables
npx prisma generate
```

Expected output:
```
✓ Created migration: add_lending_tables
✓ Generated Prisma Client
```

### 2. Update Environment Variables (if needed)
```bash
# backend/.env
DATABASE_URL="postgresql://..."
NODE_ENV="development"
```

---

## Integration Verification

### ✅ Smart Contract Module
- [x] File created: `contracts/src/lending.rs`
- [x] Module added to `contracts/src/lib.rs`
- [ ] Smart contract tests pass:
  ```bash
  cd contracts
  cargo test --lib lending
  ```

### ✅ Backend API Routes
- [x] File created: `backend/src/routes/lending.routes.ts`
- [x] Routes integrated in `backend/src/routes/index.ts`
- [ ] Server starts without errors:
  ```bash
  cd backend
  npm run dev
  # Should see: "Server running on port 3000"
  ```
- [ ] Test API endpoint:
  ```bash
  curl http://localhost:3000/api/lending/score/1
  # Should return credit score or 404
  ```

### ✅ Frontend Components
- [x] Components created in `frontend/src/components/lending/`
  - LoanApplicationForm.tsx
  - LoanDashboard.tsx
  - CreditScoreCard.tsx
  - RepaymentTracker.tsx
  - TransactionHistory.tsx
  - index.ts

- [x] Lending page created: `frontend/src/pages/lending.tsx`
- [x] API helper created: `frontend/src/lib/lending.ts`
- [ ] Frontend builds without errors:
  ```bash
  cd frontend
  npm run build
  ```
- [ ] Frontend starts successfully:
  ```bash
  cd frontend
  npm run dev
  # Should see: "Ready in X.XXs"
  ```

### ✅ Database Schema
- [x] Prisma schema updated with:
  - Loan model
  - RepaymentRecord model
  - CreditScore model
- [ ] Database migrations applied:
  ```bash
  cd backend
  npx prisma migrate deploy
  ```

---

## Testing Checklist

### Backend API Testing
```bash
# 1. Create a loan
curl -X POST http://localhost:3000/api/lending \
  -H "Content-Type: application/json" \
  -d '{
    "borrower_id": 1,
    "principal": 1000,
    "duration_days": 30,
    "collateral": 1500
  }'
# Expected: { "success": true, "loan_id": 1, "status": "PENDING" }

# 2. Get loan details
curl http://localhost:3000/api/lending/1
# Expected: Loan details with total_owed and remaining_balance

# 3. Get credit score
curl http://localhost:3000/api/lending/score/1
# Expected: { "user_id": 1, "score": 600, ... }

# 4. Make repayment
curl -X POST http://localhost:3000/api/lending/1/repay \
  -H "Content-Type: application/json" \
  -d '{"amount": 250}'
# Expected: { "success": true, "remaining": 750 }

# 5. Get transaction history
curl http://localhost:3000/api/lending/transactions/1
# Expected: Array of repayment records
```

### Frontend Testing
- [ ] Navigate to lending page: `http://localhost:3001/lending`
- [ ] Dashboard Tab
  - [ ] View stats cards (total loans, active, completed)
  - [ ] See loans table (if loans exist)
  - [ ] View credit score card
  - [ ] View transaction history
- [ ] Apply for Loan Tab
  - [ ] Enter principal amount
  - [ ] Enter collateral amount
  - [ ] Select duration
  - [ ] See loan estimate
  - [ ] Submit form (should show success message)
- [ ] Repayment Tab
  - [ ] See active loan details (if exists)
  - [ ] Enter repayment amount
  - [ ] Submit payment (should update progress)

---

## Post-Integration Tasks

### 1. Smart Contract Deployment (Optional)
```bash
# Compile contract
cd contracts
cargo build --release --target wasm32-unknown-unknown

# Deploy to Stellar testnet (requires soroban CLI)
soroban contract deploy --wasm target/wasm32-unknown-unknown/release/*.wasm
```

### 2. Frontend Route Registration
If not already added, add to your main routing file:
```typescript
import LendingPage from './pages/lending';

// Add to routes:
{ path: '/lending', element: <LendingPage /> }
```

### 3. API Documentation
API documentation is available in:
- `LENDING_PLATFORM_GUIDE.md` - Detailed endpoints and usage
- `MICRO_LENDING_SUMMARY.md` - Implementation overview

---

## Troubleshooting

### Error: "Database connection failed"
```bash
# Check PostgreSQL is running
psql -c "SELECT 1"

# Reset database
cd backend
npx prisma migrate reset
```

### Error: "Prisma Client not found"
```bash
# Generate Prisma Client
cd backend
npx prisma generate
```

### Error: "Cannot find module lending.routes"
```bash
# Verify file exists and import is correct
ls -la backend/src/routes/lending.routes.ts
# Check import statement in backend/src/routes/index.ts
```

### Frontend shows 404 for API calls
```bash
# Verify backend is running on port 3000
curl http://localhost:3000/api/lending/1

# Check API base URL in frontend/src/lib/lending.ts
# Default: /api/lending
```

### Smart contract compilation fails
```bash
# Update Rust and Soroban
rustup update
cargo install --force soroban-cli

# Clean and rebuild
cargo clean
cargo build --release --target wasm32-unknown-unknown
```

---

## Performance Benchmarks

After integration, verify performance metrics:

- [ ] API response time: < 500ms
  ```bash
  time curl http://localhost:3000/api/lending/1
  ```

- [ ] Cached API response: < 100ms
  ```bash
  # Make request twice, second should be cached
  ```

- [ ] Page load time: < 2s
  - Open DevTools (F12)
  - Check Network and Lighthouse

- [ ] Credit score calculation: < 100ms
  ```bash
  time curl http://localhost:3000/api/lending/score/1
  ```

---

## Security Verification

- [ ] Input validation working
  - Try sending invalid principal: `"principal": -100`
  - Should return error

- [ ] Rate limiting active
  - Make 101 requests in 15 minutes
  - 101st should return 429 (Too Many Requests)

- [ ] Collateral validation
  - Try loan with collateral < principal
  - Should return error

- [ ] Admin functions protected
  - Try approve endpoint without auth
  - Verify proper error response

---

## Documentation Review

- [ ] Read: `LENDING_PLATFORM_GUIDE.md`
- [ ] Review: `MICRO_LENDING_SUMMARY.md`
- [ ] Check: Smart contract comments in `contracts/src/lending.rs`
- [ ] Review: Component props in frontend files

---

## Sign-Off

Once all items are verified, the Micro-Lending Platform is ready for:
- [ ] Integration testing
- [ ] User acceptance testing
- [ ] Performance testing
- [ ] Security audit (optional)
- [ ] Production deployment

---

**Last Updated**: 2026-04-29
**Status**: Ready for Integration
**Questions?**: Review LENDING_PLATFORM_GUIDE.md or check inline code comments
