import React, { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Loader } from 'lucide-react';

interface Transaction {
  id: number;
  loan_id: number;
  amount: number;
  timestamp: string;
  remaining_balance: number;
}

interface TransactionHistoryProps {
  userId: string;
  isLoading?: boolean;
  transactions?: Transaction[];
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  userId,
  isLoading = false,
  transactions = [],
}) => {
  const [sorted, setSorted] = useState<Transaction[]>(transactions);
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');

  useEffect(() => {
    let sorted = [...transactions];
    if (sortBy === 'date') {
      sorted.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } else {
      sorted.sort((a, b) => b.amount - a.amount);
    }
    setSorted(sorted);
  }, [transactions, sortBy]);

  const totalRepaid = transactions.reduce((sum, t) => sum + t.amount, 0);
  const totalTransactions = transactions.length;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setSortBy('date')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              sortBy === 'date'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            By Date
          </button>
          <button
            onClick={() => setSortBy('amount')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              sortBy === 'amount'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            By Amount
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="px-6 py-12 text-center text-gray-500">
          <p>No transactions yet.</p>
        </div>
      ) : (
        <>
          <div className="px-6 py-4 bg-blue-50 border-b">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-900">{totalTransactions}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Total Repaid</p>
                <p className="text-2xl font-bold text-blue-600">{totalRepaid.toFixed(2)} USDC</p>
              </div>
            </div>
          </div>

          <div className="divide-y">
            {sorted.map((tx) => {
              const date = new Date(tx.timestamp);
              const formattedDate = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              });
              const formattedTime = date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={tx.id}
                  className="px-6 py-4 hover:bg-gray-50 transition-colors flex justify-between items-center"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full">
                      <ArrowDown className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Loan #{tx.loan_id} Repayment
                      </p>
                      <p className="text-xs text-gray-500">
                        {formattedDate} at {formattedTime}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">+{tx.amount.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">
                      Balance: {tx.remaining_balance.toFixed(2)} USDC
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
