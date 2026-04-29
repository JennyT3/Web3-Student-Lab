import React, { useState, useEffect } from 'react';
import {
  LoanApplicationForm,
  LoanDashboard,
  CreditScoreCard,
  RepaymentTracker,
  TransactionHistory,
} from '../components/lending';

interface LoanData {
  principal: number;
  duration_days: number;
  collateral: number;
  interest_rate?: number;
}

const LendingPage: React.FC = () => {
  const [userId] = useState('1'); // Mock user ID
  const [loans, setLoans] = useState([]);
  const [creditScore, setCreditScore] = useState({
    score: 650,
    loans_completed: 2,
    default_count: 0,
    total_repaid: 2500,
  });
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'apply' | 'repay'>('dashboard');

  useEffect(() => {
    fetchLoans();
    fetchCreditScore();
    fetchTransactions();
  }, []);

  const fetchLoans = async () => {
    try {
      const response = await fetch(`/api/lending?borrower_id=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setLoans(data);
      }
    } catch (error) {
      console.error('Failed to fetch loans:', error);
    }
  };

  const fetchCreditScore = async () => {
    try {
      const response = await fetch(`/api/lending/score/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setCreditScore(data);
      }
    } catch (error) {
      console.error('Failed to fetch credit score:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch(`/api/lending/transactions/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    }
  };

  const handleLoanApplication = async (data: LoanData) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/lending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          borrower_id: userId,
          ...data,
        }),
      });

      if (response.ok) {
        await fetchLoans();
        await fetchCreditScore();
        setActiveTab('dashboard');
      } else {
        throw new Error('Failed to create loan');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRepayment = async (loanId: number, amount: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/lending/${loanId}/repay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });

      if (response.ok) {
        await fetchLoans();
        await fetchCreditScore();
        await fetchTransactions();
      } else {
        throw new Error('Failed to process repayment');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const activeLoan = loans.find((l: any) => l.status === 'ACTIVE');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Micro-Lending Platform</h1>
          <p className="text-gray-600">Borrow, repay, and build your credit score</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8 border-b border-gray-200">
          {(['dashboard', 'apply', 'repay'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-600 border-transparent hover:text-gray-900'
              }`}
              aria-selected={activeTab === tab}
            >
              {tab === 'dashboard' && 'Dashboard'}
              {tab === 'apply' && 'Apply for Loan'}
              {tab === 'repay' && 'Make Repayment'}
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <LoanDashboard loans={loans} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <CreditScoreCard
                  score={creditScore.score}
                  loansCompleted={creditScore.loans_completed}
                  defaultCount={creditScore.default_count}
                  totalRepaid={creditScore.total_repaid}
                />
              </div>
              <div className="lg:col-span-2">
                <TransactionHistory
                  userId={userId}
                  transactions={transactions}
                  isLoading={isLoading}
                />
              </div>
            </div>
          </div>
        )}

        {/* Apply for Loan Tab */}
        {activeTab === 'apply' && (
          <div className="max-w-2xl">
            <LoanApplicationForm
              onSubmit={handleLoanApplication}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* Repayment Tab */}
        {activeTab === 'repay' && (
          <div className="space-y-6">
            {activeLoan ? (
              <RepaymentTracker
                loanId={activeLoan.id}
                principal={activeLoan.principal}
                repaidAmount={activeLoan.repaid_amount}
                interestRate={activeLoan.interest_rate}
                onRepay={(amount) => handleRepayment(activeLoan.id, amount)}
                isLoading={isLoading}
              />
            ) : (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-600 mb-4">No active loans to repay</p>
                <button
                  onClick={() => setActiveTab('apply')}
                  className="text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Apply for a loan
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LendingPage;
