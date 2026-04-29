import React, { useState } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface LoanApplicationProps {
  onSubmit: (data: LoanData) => Promise<void>;
  isLoading?: boolean;
}

interface LoanData {
  principal: number;
  duration_days: number;
  collateral: number;
  interest_rate?: number;
}

export const LoanApplicationForm: React.FC<LoanApplicationProps> = ({ onSubmit, isLoading = false }) => {
  const [formData, setFormData] = useState<LoanData>({
    principal: 0,
    duration_days: 30,
    collateral: 0,
    interest_rate: 500,
  });

  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'duration_days' || name === 'interest_rate' ? parseInt(value) : parseFloat(value),
    }));
  };

  const validateForm = (): boolean => {
    if (formData.principal <= 0) {
      setError('Principal must be greater than 0');
      return false;
    }
    if (formData.collateral < formData.principal) {
      setError('Collateral must be at least equal to principal');
      return false;
    }
    if (formData.duration_days < 1 || formData.duration_days > 365) {
      setError('Duration must be between 1 and 365 days');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    try {
      await onSubmit(formData);
      setSuccess(true);
      setFormData({ principal: 0, duration_days: 30, collateral: 0, interest_rate: 500 });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Application failed');
    }
  };

  const calculatedInterest = (formData.principal * formData.interest_rate) / 10000;
  const totalRepay = formData.principal + calculatedInterest;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Request a Loan</h2>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-green-700 text-sm">Application submitted successfully!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Principal (USDC)</label>
          <input
            type="number"
            name="principal"
            value={formData.principal}
            onChange={handleChange}
            placeholder="1000"
            min="1"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
            aria-label="Loan principal amount"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Collateral (USDC)</label>
          <input
            type="number"
            name="collateral"
            value={formData.collateral}
            onChange={handleChange}
            placeholder="1500"
            min={formData.principal || 0}
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
            aria-label="Collateral amount"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Duration (days)</label>
          <input
            type="number"
            name="duration_days"
            value={formData.duration_days}
            onChange={handleChange}
            min="1"
            max="365"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
            aria-label="Loan duration in days"
          />
        </div>

        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-2">Estimate</div>
          <div className="flex justify-between mb-1">
            <span>Interest Rate:</span>
            <span>{formData.interest_rate / 100}%</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Total Repay:</span>
            <span>{totalRepay.toFixed(2)} USDC</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-md transition-colors"
          aria-busy={isLoading}
        >
          {isLoading ? 'Submitting...' : 'Submit Application'}
        </button>
      </form>
    </div>
  );
};
