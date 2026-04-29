const API_BASE = '/api/lending';

export interface LoanRequest {
  borrower_id: number;
  principal: number;
  interest_rate?: number;
  duration_days: number;
  collateral: number;
}

export interface LoanResponse {
  id: number;
  borrower_id: number;
  principal: number;
  interest_rate: number;
  duration_days: number;
  collateral_amount: number;
  status: 'PENDING' | 'ACTIVE' | 'REPAID' | 'DEFAULTED';
  repaid_amount: number;
  created_at: string;
  due_date: string;
}

export interface CreditScoreResponse {
  user_id: number;
  score: number;
  loans_completed: number;
  default_count: number;
  total_repaid: number;
  last_updated: string;
}

export interface RepaymentRecordResponse {
  id: number;
  loan_id: number;
  amount: number;
  timestamp: string;
  remaining_balance: number;
}

export const lendingAPI = {
  // Request a new loan
  async requestLoan(data: LoanRequest): Promise<{ success: boolean; loan_id: number; status: string }> {
    const response = await fetch(`${API_BASE}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to request loan');
    }

    return response.json();
  },

  // Get loan details
  async getLoan(loanId: number): Promise<LoanResponse> {
    const response = await fetch(`${API_BASE}/${loanId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch loan');
    }

    return response.json();
  },

  // Get user loans
  async getUserLoans(borrowerId: number, status?: string): Promise<LoanResponse[]> {
    let url = `${API_BASE}?borrower_id=${borrowerId}`;
    if (status) url += `&status=${status}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to fetch loans');
    }

    return response.json();
  },

  // Make repayment
  async repayLoan(loanId: number, amount: number): Promise<{ success: boolean; remaining: number; fully_repaid: boolean }> {
    const response = await fetch(`${API_BASE}/${loanId}/repay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to process repayment');
    }

    return response.json();
  },

  // Get credit score
  async getCreditScore(userId: number): Promise<CreditScoreResponse> {
    const response = await fetch(`${API_BASE}/score/${userId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch credit score');
    }

    return response.json();
  },

  // Get transaction history
  async getTransactionHistory(userId: number): Promise<RepaymentRecordResponse[]> {
    const response = await fetch(`${API_BASE}/transactions/${userId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch transactions');
    }

    return response.json();
  },

  // Admin: Approve loan
  async approveLoan(loanId: number): Promise<{ success: boolean; status: string }> {
    const response = await fetch(`${API_BASE}/${loanId}/approve`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to approve loan');
    }

    return response.json();
  },

  // Admin: Mark as default
  async markDefault(loanId: number): Promise<{ success: boolean; status: string }> {
    const response = await fetch(`${API_BASE}/${loanId}/default`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to mark default');
    }

    return response.json();
  },
};
