import React, { useState } from 'react';
import { Send, AlertCircle, CheckCircle } from 'lucide-react';

interface RepaymentTrackerProps {
  loanId: number;
  principal: number;
  repaidAmount: number;
  interestRate: number;
  onRepay: (amount: number) => Promise<void>;
  isLoading?: boolean;
}

export const RepaymentTracker: React.FC<RepaymentTrackerProps> = ({
  loanId,
  principal,
  repaidAmount,
  interestRate,
  onRepay,
  isLoading = false,
}) => {
  const [repayAmount, setRepayAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const totalOwed = principal + (principal * interestRate) / 10000;
  const remaining = totalOwed - repaidAmount;
  const progress = (repaidAmount / totalOwed) * 100;

  const handleRepay = async () => {
    setError('');
    const amount = parseFloat(repayAmount);

    if (isNaN(amount) || amount <= 0) {
      setError('Enter a valid amount');
      return;
    }
    if (amount > remaining) {
      setError(`Amount exceeds remaining balance (${remaining.toFixed(2)} USDC)`);
      return;
    }

    try {
      await onRepay(amount);
      setSuccess(true);
      setRepayAmount('');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Repayment failed');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-6">Loan #{loanId} Repayment</h3>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-green-700 text-sm">Payment processed successfully!</span>
        </div>
      )}

      <div className="space-y-4 mb-6">
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-600">Repayment Progress</span>
            <span className="text-sm font-semibold">{progress.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-600 mb-1">Total Owed</p>
            <p className="text-2xl font-bold text-gray-900">{totalOwed.toFixed(2)}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-600 mb-1">Remaining</p>
            <p className="text-2xl font-bold text-blue-600">{remaining.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-xs text-gray-600 mb-2">Repaid: {repaidAmount.toFixed(2)} / {totalOwed.toFixed(2)} USDC</p>
          <div className="space-y-2">
            <p className="text-xs text-gray-600">
              <span className="font-semibold">Principal:</span> {principal.toFixed(2)} USDC
            </p>
            <p className="text-xs text-gray-600">
              <span className="font-semibold">Interest:</span> {((principal * interestRate) / 10000).toFixed(2)} USDC
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <input
          type="number"
          value={repayAmount}
          onChange={(e) => setRepayAmount(e.target.value)}
          placeholder="Enter repayment amount"
          step="0.01"
          max={remaining}
          disabled={isLoading || remaining <= 0}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          aria-label="Repayment amount"
        />
        <button
          onClick={handleRepay}
          disabled={isLoading || remaining <= 0 || !repayAmount}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-md flex items-center gap-2 transition-colors"
          aria-busy={isLoading}
        >
          <Send className="w-4 h-4" />
          {isLoading ? 'Sending...' : 'Pay'}
        </button>
      </div>
    </div>
  );
};
