import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { rateLimit } from 'express-rate-limit';
import { cacheMiddleware } from '../middleware/cache';
import { validateInput } from '../middleware/validation';

const router = Router();
const prisma = new PrismaClient();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later'
});

router.use(limiter);

// POST /loans - Request new loan
router.post('/', validateInput(['principal', 'duration_days', 'collateral']), async (req: Request, res: Response) => {
  try {
    const { borrower_id, principal, interest_rate = 500, duration_days, collateral } = req.body;

    if (!principal || principal <= 0 || collateral < principal) {
      return res.status(400).json({ error: 'Invalid loan parameters' });
    }

    const loan = await prisma.loan.create({
      data: {
        borrower_id,
        principal,
        interest_rate,
        duration_days,
        collateral_amount: collateral,
        status: 'PENDING',
        created_at: new Date(),
        due_date: new Date(Date.now() + duration_days * 86400000),
      },
    });

    res.status(201).json({
      success: true,
      loan_id: loan.id,
      status: loan.status,
      principal: loan.principal,
    });
  } catch (error) {
    console.error('Loan creation error:', error);
    res.status(500).json({ error: 'Failed to create loan' });
  }
});

// GET /loans/:id - Get loan details with caching
router.get('/:id', cacheMiddleware(300), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const loan = await prisma.loan.findUnique({ where: { id: parseInt(id) } });

    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    const total_owed = loan.principal + (loan.principal * loan.interest_rate / 10000);
    const remaining = total_owed - loan.repaid_amount;

    res.json({
      ...loan,
      total_owed,
      remaining_balance: remaining,
      progress: ((loan.repaid_amount / total_owed) * 100).toFixed(2),
    });
  } catch (error) {
    console.error('Loan fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch loan' });
  }
});

// GET /loans - List user loans
router.get('/', cacheMiddleware(300), async (req: Request, res: Response) => {
  try {
    const { borrower_id, status } = req.query;

    const where = borrower_id ? { borrower_id: parseInt(borrower_id as string) } : {};
    if (status) (where as any).status = status;

    const loans = await prisma.loan.findMany({ where, orderBy: { created_at: 'desc' } });
    res.json(loans);
  } catch (error) {
    console.error('Loan list error:', error);
    res.status(500).json({ error: 'Failed to fetch loans' });
  }
});

// POST /loans/:id/repay - Make repayment
router.post('/:id/repay', validateInput(['amount']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    if (amount <= 0) {
      return res.status(400).json({ error: 'Invalid repayment amount' });
    }

    const loan = await prisma.loan.findUnique({ where: { id: parseInt(id) } });
    if (!loan || loan.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Loan not active' });
    }

    const total_owed = loan.principal + (loan.principal * loan.interest_rate / 10000);
    const remaining = total_owed - loan.repaid_amount;

    if (amount > remaining) {
      return res.status(400).json({ error: 'Payment exceeds debt' });
    }

    const repaid = await prisma.loan.update({
      where: { id: parseInt(id) },
      data: {
        repaid_amount: loan.repaid_amount + amount,
        status: loan.repaid_amount + amount >= total_owed ? 'REPAID' : 'ACTIVE',
      },
    });

    // Record repayment
    await prisma.repaymentRecord.create({
      data: {
        loan_id: parseInt(id),
        amount,
        timestamp: new Date(),
        remaining_balance: remaining - amount,
      },
    });

    res.json({
      success: true,
      remaining: remaining - amount,
      fully_repaid: repaid.status === 'REPAID',
    });
  } catch (error) {
    console.error('Repayment error:', error);
    res.status(500).json({ error: 'Failed to process repayment' });
  }
});

// GET /credit-score/:user_id - Get user credit score
router.get('/score/:user_id', cacheMiddleware(600), async (req: Request, res: Response) => {
  try {
    const { user_id } = req.params;

    let score = await prisma.creditScore.findUnique({
      where: { user_id: parseInt(user_id) },
    });

    if (!score) {
      score = await prisma.creditScore.create({
        data: {
          user_id: parseInt(user_id),
          score: 600,
          loans_completed: 0,
          default_count: 0,
          total_repaid: 0,
        },
      });
    }

    res.json(score);
  } catch (error) {
    console.error('Credit score error:', error);
    res.status(500).json({ error: 'Failed to fetch credit score' });
  }
});

// GET /transactions/:user_id - Get repayment history
router.get('/transactions/:user_id', cacheMiddleware(300), async (req: Request, res: Response) => {
  try {
    const { user_id } = req.params;
    const loans = await prisma.loan.findMany({ where: { borrower_id: parseInt(user_id) } });
    const loan_ids = loans.map(l => l.id);

    const transactions = await prisma.repaymentRecord.findMany({
      where: { loan_id: { in: loan_ids } },
      orderBy: { timestamp: 'desc' },
      take: 50,
    });

    res.json(transactions);
  } catch (error) {
    console.error('Transaction history error:', error);
    res.status(500).json({ error: 'Failed to fetch transaction history' });
  }
});

// ADMIN: POST /loans/:id/approve
router.post('/:id/approve', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const loan = await prisma.loan.update({
      where: { id: parseInt(id) },
      data: { status: 'ACTIVE' },
    });
    res.json({ success: true, status: loan.status });
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve loan' });
  }
});

// ADMIN: POST /loans/:id/default
router.post('/:id/default', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const loan = await prisma.loan.update({
      where: { id: parseInt(id) },
      data: { status: 'DEFAULTED' },
    });

    // Penalize credit score
    await prisma.creditScore.updateMany({
      where: { user_id: loan.borrower_id },
      data: {
        default_count: { increment: 1 },
        score: { decrement: 100 },
      },
    });

    res.json({ success: true, status: loan.status });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark default' });
  }
});

export default router;
