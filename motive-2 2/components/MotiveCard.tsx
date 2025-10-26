import React from 'react';
// FIX: Replaced non-existent 'Participant' type with 'User' as participants are User objects.
import type { Motive, User } from '../types';
import { Icon } from './Icon';

interface MotiveCardProps {
  motive: Motive;
  onSelectMotive: (motiveId: string) => void;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const isToday = date.toDateString() === new Date().toDateString();
  const isTomorrow = date.toDateString() === new Date(Date.now() + 24 * 60 * 60 * 1000).toDateString();

  let dayPart;
  if (isToday) {
    dayPart = 'Today';
  } else if (isTomorrow) {
    dayPart = 'Tomorrow';
  } else {
    dayPart = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  const timePart = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  return `${dayPart} at ${timePart}`;
};

// FIX: Updated props to use 'User[]' for participants.
const ParticipantsStack: React.FC<{ participants: User[] }> = ({ participants }) => (
  <div className="flex -space-x-2">
    {participants.slice(0, 4).map((p) => (
      <img
        // FIX: The 'User' type uses 'id', not 'userId', for the unique identifier.
        key={p.id}
        className="w-8 h-8 rounded-full border-2 border-white"
        src={p.avatar}
        alt={p.name}
      />
    ))}
    {participants.length > 4 && (
      <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-bold text-gray-600">
        +{participants.length - 4}
      </div>
    )}
  </div>
);


export const MotiveCard: React.FC<MotiveCardProps> = ({ motive, onSelectMotive }) => {
  return (
    <div 
      className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer"
      onClick={() => onSelectMotive(motive.id)}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => (e.key === 'Enter' || e.key === ' ') && onSelectMotive(motive.id)}
    >
      <img src={motive.image} alt={motive.title} className="w-full h-40 object-cover" />
      <div className="p-4">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-sm font-semibold text-violet-600">{motive.category.toUpperCase()}</p>
                <h3 className="text-xl font-bold text-gray-800 mt-1">{motive.title}</h3>
            </div>
            <div className="text-right">
                <p className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-500 to-violet-500">£{motive.cost}</p>
                <p className="text-xs text-gray-500">per person</p>
            </div>
        </div>
        
        <div className="mt-4 space-y-2 text-gray-600">
          <div className="flex items-center space-x-2">
            <Icon name="calendar" className="w-5 h-5 text-gray-400" />
            <span>{formatDate(motive.date)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Icon name="location" className="w-5 h-5 text-gray-400" />
            <span>{motive.location}</span>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
          <ParticipantsStack participants={motive.participants} />
          <div className="flex items-center space-x-2 text-gray-600">
             <Icon name="users" className="w-5 h-5" />
             <span className="font-medium">{motive.participants.length} / {motive.maxParticipants}</span>
          </div>
        </div>
      </div>
    </div>
  );
};