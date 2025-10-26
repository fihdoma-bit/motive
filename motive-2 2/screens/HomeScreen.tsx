
import React, { useState } from 'react';
import type { Motive, User } from '../types';
import { MotiveCard } from '../components/MotiveCard';
import { Header } from '../components/Header';
import { CATEGORIES } from '../constants';

interface HomeScreenProps {
  motives: Motive[];
  user: User;
  onSelectMotive: (motiveId: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ motives, user, onSelectMotive }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const filteredMotives = motives.filter(motive => {
    // For now, let's assume friends-only motives created by the user or friends are visible in a real app
    // Here we'll just show public ones for simplicity in the feed
    const isVisible = motive.privacy === 'Public';
    const matchesCategory = selectedCategory === 'All' || motive.category === selectedCategory;
    const isUpcoming = new Date(motive.date) >= new Date();
    return isVisible && matchesCategory && isUpcoming;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="flex flex-col h-full">
      <Header title={`Hi, @${user.username}!`}>
        <div className="w-10 h-10 bg-gray-200 rounded-full bg-gradient-to-r from-sky-400 to-violet-500" />
      </Header>
      
      <div className="px-4 py-3 sticky top-[73px] bg-white/80 backdrop-blur-lg z-10">
        <div className="max-w-md mx-auto">
            <h2 className="text-lg font-bold text-gray-800 mb-3">Inspiration Feed</h2>
            <div className="flex space-x-2 overflow-x-auto pb-2 -mx-4 px-4">
            {['All', ...CATEGORIES].map(category => (
                <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 text-sm font-semibold rounded-full whitespace-nowrap transition-colors duration-200 ${
                    selectedCategory === category
                    ? 'bg-gradient-to-r from-sky-500 to-violet-500 text-white shadow-md'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                >
                {category}
                </button>
            ))}
            </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto pb-24 px-4">
        <div className="max-w-md mx-auto space-y-4">
          {filteredMotives.length > 0 ? (
            filteredMotives.map(motive => <MotiveCard key={motive.id} motive={motive} onSelectMotive={onSelectMotive} />)
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-500">No public motives found for this category.</p>
              <p className="text-gray-400 text-sm mt-1">Why not create one?</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
