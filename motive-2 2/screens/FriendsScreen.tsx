import React, { useState } from 'react';
import type { Friend, FriendGroup } from '../types';
import { Header } from '../components/Header';

interface FriendsScreenProps {
  friends: Friend[];
  groups: FriendGroup[];
  onViewProfile: (userId: string) => void;
}

const FriendCard: React.FC<{ friend: Friend; onViewProfile: (userId: string) => void; }> = ({ friend, onViewProfile }) => (
  <div className="bg-white p-3 rounded-2xl shadow-md flex items-center justify-between">
    <div className="flex items-center space-x-4">
      <div className="relative">
        <img src={friend.avatar} alt={friend.name} className="w-12 h-12 rounded-full" />
        {friend.isOnline && (
          <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-400 ring-2 ring-white" />
        )}
      </div>
      <div>
        <p className="font-bold text-gray-800">{friend.name}</p>
        <p className="text-sm text-gray-500">{friend.isOnline ? 'Online' : 'Offline'}</p>
      </div>
    </div>
    <button 
      onClick={() => onViewProfile(friend.id)}
      className="px-3 py-1 text-sm font-semibold text-violet-600 bg-violet-100 rounded-full hover:bg-violet-200 transition-colors">
      View
    </button>
  </div>
);

const GroupCard: React.FC<{ group: FriendGroup }> = ({ group }) => (
  <div className="bg-white p-4 rounded-2xl shadow-md">
    <div className="flex justify-between items-start mb-3">
        <div>
            <h4 className="font-bold text-gray-800">{group.name}</h4>
            <p className="text-sm text-gray-500">{group.members.length} members</p>
        </div>
        <button className="px-3 py-1 text-sm font-semibold text-violet-600 bg-violet-100 rounded-full hover:bg-violet-200 transition-colors">
            Invite
        </button>
    </div>
    <div className="flex -space-x-2">
      {group.members.map(member => (
        <img key={member.id} src={member.avatar} alt={member.name} className="w-9 h-9 rounded-full border-2 border-white" />
      ))}
    </div>
  </div>
);

export const FriendsScreen: React.FC<FriendsScreenProps> = ({ friends, groups, onViewProfile }) => {
  const [activeTab, setActiveTab] = useState<'friends' | 'groups'>('friends');

  return (
    <div className="flex flex-col h-full">
      <Header title="Friends" />
      <div className="p-4 sticky top-[73px] bg-white/80 backdrop-blur-lg z-10">
        <div className="max-w-md mx-auto">
            <div className="flex bg-gray-200 p-1 rounded-xl">
            <button
                onClick={() => setActiveTab('friends')}
                className={`w-1/2 py-2 text-sm font-bold rounded-lg transition-all ${
                activeTab === 'friends' ? 'bg-white text-violet-600 shadow' : 'text-gray-600'
                }`}
            >
                All Friends ({friends.length})
            </button>
            <button
                onClick={() => setActiveTab('groups')}
                className={`w-1/2 py-2 text-sm font-bold rounded-lg transition-all ${
                activeTab === 'groups' ? 'bg-white text-violet-600 shadow' : 'text-gray-600'
                }`}
            >
                Groups ({groups.length})
            </button>
            </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 pt-0 pb-24">
        <div className="max-w-md mx-auto space-y-3">
          {activeTab === 'friends' && friends.map(friend => (
            <FriendCard key={friend.id} friend={friend} onViewProfile={onViewProfile} />
          ))}
          {activeTab === 'groups' && groups.map(group => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      </div>
    </div>
  );
};