
import React from 'react';

interface BudgetTrackerProps {
  budget: number;
  spent: number;
}

export const BudgetTracker: React.FC<BudgetTrackerProps> = ({ budget, spent }) => {
  const remaining = budget - spent;
  const percentageSpent = budget > 0 ? (spent / budget) * 100 : 0;

  const getBarColor = (percentage: number) => {
    if (percentage > 90) return 'bg-red-500';
    if (percentage > 70) return 'bg-yellow-500';
    return 'bg-gradient-to-r from-sky-400 to-violet-500';
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md">
      <div className="flex justify-between items-baseline mb-2">
        <span className="text-gray-600 font-medium">Monthly Social Budget</span>
        <span className="text-2xl font-bold text-gray-800">£{budget.toFixed(2)}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-4 my-2 overflow-hidden">
        <div
          className={`h-4 rounded-full transition-all duration-500 ${getBarColor(percentageSpent)}`}
          style={{ width: `${Math.min(percentageSpent, 100)}%` }}
        ></div>
      </div>
      <div className="flex justify-between items-center text-sm mt-3">
        <div className="text-left">
          <p className="text-gray-500">Spent</p>
          <p className="font-bold text-lg text-red-600">£{spent.toFixed(2)}</p>
        </div>
        <div className="text-right">
          <p className="text-gray-500">Remaining</p>
          <p className="font-bold text-lg text-green-600">£{remaining.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
};
