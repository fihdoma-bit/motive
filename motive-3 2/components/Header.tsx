
import React from 'react';

interface HeaderProps {
  title: string;
  children?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, children }) => {
  return (
    <div className="sticky top-0 bg-white/80 backdrop-blur-lg z-10 px-4 pt-4 pb-3 border-b border-gray-200">
      <div className="max-w-md mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <div>{children}</div>
      </div>
    </div>
  );
};
