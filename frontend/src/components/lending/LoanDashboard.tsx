import React, { useEffect, useState } from 'react';
import { TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface Loan {
  id: number;
  principal: number;
  repaid_amount: number;
  status: 'PENDING' | 'ACTIVE' | 'REPAID' | 'DEFAULTED';
  due_date: string;
  interest_rate: number;
}

export const LoanDashboard: React.FC<{ loans?: Loan[] }> = ({ loans = [] }) => {
  const [loanStats, setLoanStats] = useState({
    total_loans: 0,
    active_loans: 0,
    completed_loans: 0,
    total_borrowed: 0,
  });

  useEffect(() => {
    const stats = {
      total_loans: loans.length,
      active_loans: loans.filter(l => l.status === 'ACTIVE').length,
      completed_loans: loans.filter(l => l.status === 'REPAID').length,
      total_borrowed: loans.reduce((sum, l) => sum + l.principal, 0),
    };
    setLoanStats(stats);
  }, [loans]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'REPAID': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'ACTIVE': return <Clock className="w-5 h-5 text-blue-600" />;
      case 'DEFAULTED': return <AlertCircle className="w-5 h-5 text-red-600" />;
      default: return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'REPAID': return 'bg-green-100 text-green-800';
      case 'ACTIVE': return 'bg-blue-100 text-blue-800';
      case 'DEFAULTED': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Loans"
          value={loanStats.total_loans}
          icon={<TrendingUp className="w-6 h-6" />}
          color="blue"
        />
        <StatCard
          title="Active Loans"
          value={loanStats.active_loans}
          icon={<Clock className="w-6 h-6" />}
          color="yellow"
        />
        <StatCard
          title="Completed"
          value={loanStats.completed_loans}
          icon={<CheckCircle className="w-6 h-6" />}
          color="green"
        />
        <StatCard
          title="Total Borrowed"
          value={`${loanStats.total_borrowed.toFixed(2)} USDC`}
          icon={<TrendingUp className="w-6 h-6" />}
          color="purple"
        />
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Your Loans</h3>
        </div>
        {loans.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <p>No loans yet. Start by requesting a loan above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Loan ID</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Principal</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Repaid</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Progress</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {loans.map(loan => {
                  const progress = (loan.repaid_amount / loan.principal) * 100;
                  return (
                    <tr key={loan.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium">#{ }{loan.id}</td>
                      <td className="px-6 py-4 text-sm">{loan.principal.toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm">{loan.repaid_amount.toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold">{progress.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full w-fit ${getStatusColor(loan.status)}`}>
                          {getStatusIcon(loan.status)}
                          <span className="capitalize">{loan.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">{new Date(loan.due_date).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'blue' | 'yellow' | 'green' | 'purple';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className={`flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${colorClasses[color]}`}>
        {icon}
      </div>
      <p className="text-gray-600 text-sm font-medium mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
};
