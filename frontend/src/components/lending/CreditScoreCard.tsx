import React from 'react';
import { TrendingUp } from 'lucide-react';

interface CreditScoreProps {
  score: number;
  loansCompleted: number;
  defaultCount: number;
  totalRepaid: number;
}

export const CreditScoreCard: React.FC<CreditScoreProps> = ({
  score = 600,
  loansCompleted = 0,
  defaultCount = 0,
  totalRepaid = 0,
}) => {
  const getScoreColor = (s: number) => {
    if (s >= 750) return 'text-green-600';
    if (s >= 650) return 'text-blue-600';
    if (s >= 550) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (s: number) => {
    if (s >= 750) return 'bg-green-50';
    if (s >= 650) return 'bg-blue-50';
    if (s >= 550) return 'bg-yellow-50';
    return 'bg-red-50';
  };

  const getScoreRange = (s: number) => {
    if (s >= 750) return 'Excellent';
    if (s >= 650) return 'Good';
    if (s >= 550) return 'Fair';
    return 'Poor';
  };

  return (
    <div className={`rounded-lg shadow-md p-6 ${getScoreBg(score)}`}>
      <h2 className="text-xl font-bold text-gray-900 mb-6">Credit Score</h2>

      <div className="flex items-center justify-between mb-8">
        <div>
          <div className={`text-5xl font-bold ${getScoreColor(score)}`}>{score}</div>
          <div className="text-sm text-gray-600 mt-1">{getScoreRange(score)} Credit</div>
        </div>
        <TrendingUp className={`w-12 h-12 ${getScoreColor(score)}`} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900">{loansCompleted}</div>
          <div className="text-xs text-gray-600 mt-1">Loans Completed</div>
        </div>
        <div className="bg-white rounded-lg p-4">
          <div className="text-2xl font-bold text-red-600">{defaultCount}</div>
          <div className="text-xs text-gray-600 mt-1">Defaults</div>
        </div>
        <div className="bg-white rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900">{totalRepaid.toFixed(0)}</div>
          <div className="text-xs text-gray-600 mt-1">USDC Repaid</div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-white rounded-lg">
        <p className="text-xs text-gray-600 leading-relaxed">
          Your credit score is based on loan completion history, repayment records, and default incidents.
          Maintain a good score to access better loan terms and higher amounts.
        </p>
      </div>

      <div className="mt-6">
        <div className="mb-2 flex justify-between text-sm">
          <span className="text-gray-600">Score Range</span>
          <span className="text-gray-600">300 - 850</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all`}
            style={{
              width: `${((score - 300) / 550) * 100}%`,
              backgroundColor: score >= 750 ? '#10b981' : score >= 650 ? '#3b82f6' : score >= 550 ? '#f59e0b' : '#ef4444',
            }}
          />
        </div>
      </div>
    </div>
  );
};
