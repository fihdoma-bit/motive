import React, { useMemo } from 'react';
import type { Motive, User } from '../types';
import { Header } from '../components/Header';
import { BudgetTracker } from '../components/BudgetTracker';

interface BudgetScreenProps {
  currentUser: User;
  motives: Motive[];
  updateBudget: (newBudget: number) => void;
}

export const BudgetScreen: React.FC<BudgetScreenProps> = ({ currentUser, motives, updateBudget }) => {
  const [newBudget, setNewBudget] = React.useState(currentUser.monthlyBudget.toString());

  const joinedMotives = useMemo(() => {
    return motives
      .filter(motive => motive.participants.some(p => p.userId === currentUser.id))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [motives, currentUser.id]);

  const totalSpent = useMemo(() => {
    return joinedMotives.reduce((sum, motive) => sum + motive.cost, 0);
  }, [joinedMotives]);
  
  const handleBudgetUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const budgetValue = parseFloat(newBudget);
    if (!isNaN(budgetValue) && budgetValue >= 0) {
        updateBudget(budgetValue);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="My Budget" />
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        <div className="max-w-md mx-auto space-y-6">
          <BudgetTracker budget={currentUser.monthlyBudget} spent={totalSpent} />
          
          <div className="bg-white p-4 rounded-2xl shadow-md">
            <h3 className="font-bold text-gray-800 mb-2">Set Monthly Budget</h3>
            <form onSubmit={handleBudgetUpdate} className="flex items-center space-x-2">
              <span className="text-gray-500 font-semibold text-lg">£</span>
              <input 
                type="number" 
                value={newBudget}
                onChange={(e) => setNewBudget(e.target.value)}
                className="flex-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="e.g., 500"
                min="0"
                step="10"
              />
              <button type="submit" className="px-4 py-2 bg-violet-600 text-white font-semibold rounded-lg shadow-sm hover:bg-violet-700 transition-colors">Set</button>
            </form>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-3 px-2">Recent Motives</h3>
            <div className="space-y-3">
              {joinedMotives.map(motive => (
                <div key={motive.id} className="bg-white p-4 rounded-2xl shadow-md flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <img src={motive.image} alt={motive.title} className="w-12 h-12 object-cover rounded-lg" />
                    <div>
                      <p className="font-semibold text-gray-800">{motive.title}</p>
                      <p className="text-sm text-gray-500">{new Date(motive.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <p className="font-bold text-red-500">-£{motive.cost.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
