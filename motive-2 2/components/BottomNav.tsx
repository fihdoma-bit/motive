
import React from 'react';
import type { Screen } from '../types';
import { Icon } from './Icon';

interface BottomNavProps {
  activeScreen: Screen;
  setActiveScreen: (screen: Screen) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeScreen, setActiveScreen }) => {
  const navItems: { screen: Screen; label: string; icon: React.ComponentProps<typeof Icon>['name'] }[] = [
    { screen: 'home', label: 'Home', icon: 'home' },
    { screen: 'create', label: 'Create', icon: 'create' },
    { screen: 'budget', label: 'Budget', icon: 'budget' },
    { screen: 'messages', label: 'Messages', icon: 'send' },
    { screen: 'profile', label: 'Profile', icon: 'profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-lg border-t border-gray-200 shadow-t-lg">
      <div className="max-w-md mx-auto h-full flex justify-around items-center px-2">
        {navItems.map((item) => {
          const isActive = activeScreen === item.screen;
          return (
            <button
              key={item.screen}
              onClick={() => setActiveScreen(item.screen)}
              className={`flex flex-col items-center justify-center space-y-1 w-16 transition-all duration-200 ease-in-out ${
                isActive ? 'text-violet-600' : 'text-gray-500 hover:text-violet-500'
              }`}
            >
              <div className={`p-2 rounded-full transition-colors ${isActive ? 'bg-violet-100' : ''}`}>
                 <Icon name={item.icon} className="w-7 h-7" />
              </div>
              <span className={`text-xs font-medium ${isActive ? 'font-bold' : ''}`}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
