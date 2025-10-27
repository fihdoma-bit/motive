
import React, { useMemo } from 'react';
import type { User, Motive, Friendship } from '../types';
import { Header } from '../components/Header';
import { MotiveCard } from '../components/MotiveCard';
import { Icon } from '../components/Icon';

interface ProfileScreenProps {
  userToShow: User;
  currentUser: User;
  motives: Motive[];
  friendship: Friendship | null;
  onSelectMotive: (motiveId: string) => void;
  onStartChat: (userId: string) => void;
  onFriendAction: (targetUserId: string, action: 'add' | 'accept' | 'remove') => void;
  onBack?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ userToShow, currentUser, motives, friendship, onSelectMotive, onStartChat, onFriendAction, onBack }) => {
  const isCurrentUserProfile = userToShow.id === currentUser.id;

  const pastMotives = useMemo(() => {
    return motives
      .filter(m => m.participants.some(p => p.id === userToShow.id) && new Date(m.date) < new Date())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [motives, userToShow.id]);

  const upcomingMotives = useMemo(() => {
    return motives
      .filter(m => m.participants.some(p => p.id === userToShow.id) && new Date(m.date) >= new Date())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [motives, userToShow.id]);
  
  const renderFriendButton = () => {
    if (isCurrentUserProfile) return null;

    if (friendship?.status === 'accepted') {
      return (
        <div className="flex gap-2">
          <button onClick={() => onStartChat(userToShow.id)} className="flex-1 px-4 py-2 text-sm font-bold rounded-lg shadow-sm transition-all bg-violet-600 text-white hover:bg-violet-700">
            Message
          </button>
          <button onClick={() => onFriendAction(userToShow.id, 'remove')} className="px-4 py-2 text-sm font-bold rounded-lg shadow-sm transition-all bg-gray-200 text-gray-700 hover:bg-gray-300">
            Friends
          </button>
        </div>
      );
    }
    
    if (friendship?.status === 'pending') {
      if (friendship.action_by === currentUser.id) {
        return <button disabled className="w-full px-4 py-2 font-bold rounded-lg shadow-sm bg-gray-200 text-gray-500 cursor-not-allowed">Request Sent</button>;
      } else {
        return (
          <div className="flex gap-2">
             <button onClick={() => onFriendAction(userToShow.id, 'accept')} className="flex-1 px-4 py-2 text-sm font-bold rounded-lg shadow-sm transition-all bg-green-500 text-white hover:bg-green-600">
                Accept Request
            </button>
            <button onClick={() => onFriendAction(userToShow.id, 'remove')} className="px-4 py-2 text-sm font-bold rounded-lg shadow-sm transition-all bg-gray-200 text-gray-700 hover:bg-gray-300">
                Decline
            </button>
          </div>
        )
      }
    }
    
    return <button onClick={() => onFriendAction(userToShow.id, 'add')} className="w-full px-4 py-2 font-bold rounded-lg shadow-sm transition-all bg-gradient-to-r from-sky-500 to-violet-500 text-white hover:opacity-90">Add Friend</button>;
  };

  return (
    <div className="flex flex-col h-full">
       {isCurrentUserProfile ? (
         <Header title="Profile" />
      ) : (
        <div className="sticky top-0 bg-white/80 backdrop-blur-lg z-20 px-4 pt-4 pb-3 border-b border-gray-200">
            <div className="max-w-md mx-auto flex items-center gap-2">
                <button onClick={onBack} className="p-2 -ml-2 text-gray-600 hover:text-gray-900">
                    <Icon name="back" className="w-6 h-6" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900 truncate">{userToShow.name}</h1>
            </div>
        </div>
      )}
      <div className="flex-1 overflow-y-auto pb-24">
        <div className="max-w-md mx-auto">
          {/* Profile Header */}
          <div className="p-4 text-center">
            <img src={userToShow.avatar_url} alt={userToShow.name} className="w-24 h-24 rounded-full mx-auto mb-2 border-4 border-white shadow-lg" />
            <h2 className="text-2xl font-bold text-gray-800">{userToShow.name}</h2>
            <p className="text-md text-gray-500">@{userToShow.username}</p>
            <p className="text-gray-600 mt-3 px-4">{userToShow.bio}</p>
             <div className="mt-4 px-4">{renderFriendButton()}</div>
          </div>

          {/* Interests */}
          <div className="px-4 py-2">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {userToShow.interests.map(interest => (
                <span key={interest} className="px-3 py-1 text-sm font-medium text-violet-700 bg-violet-100 rounded-full">
                  {interest}
                </span>
              ))}
            </div>
          </div>
          
          {/* Upcoming Motives */}
          <div className="mt-6 px-4">
             <h3 className="text-lg font-bold text-gray-800 mb-3">Upcoming Motives</h3>
             {upcomingMotives.length > 0 ? (
                <div className="space-y-4">
                    {upcomingMotives.map(motive => <MotiveCard key={motive.id} motive={motive} onSelectMotive={onSelectMotive} />)}
                </div>
             ) : (
                <p className="text-gray-500 text-center py-4">No upcoming motives.</p>
             )}
          </div>

          {/* Past Motives */}
          <div className="mt-6 px-4">
             <h3 className="text-lg font-bold text-gray-800 mb-3">Past Motives</h3>
              {pastMotives.length > 0 ? (
                <div className="space-y-4">
                    {pastMotives.map(motive => <MotiveCard key={motive.id} motive={motive} onSelectMotive={onSelectMotive} />)}
                </div>
             ) : (
                <p className="text-gray-500 text-center py-4">No past motives yet.</p>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};
