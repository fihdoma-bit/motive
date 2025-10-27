
import React, { useState, useMemo } from 'react';
import type { User, Friendship, Conversation } from '../types';
import { Header } from '../components/Header';
import { Icon } from '../components/Icon';

interface MessagesScreenProps {
  currentUser: User;
  friendships: Friendship[];
  conversations: Conversation[];
  allUsers: User[];
  onFriendAction: (targetUserId: string, action: 'accept' | 'remove') => void;
  onViewProfile: (userId: string) => void;
  onConversationSelect: (conversation: Conversation) => void;
}

const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (date < startOfDay) {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export const MessagesScreen: React.FC<MessagesScreenProps> = ({ currentUser, friendships, conversations, allUsers, onFriendAction, onViewProfile, onConversationSelect }) => {
  const [activeTab, setActiveTab] = useState<'messages' | 'requests'>('messages');

  const incomingRequests = useMemo(() => {
    return friendships
      .filter(f => f.status === 'pending' && f.user_id_2 === currentUser.id)
      .map(f => allUsers.find(u => u.id === f.user_id_1))
      .filter((u): u is User => !!u);
  }, [friendships, currentUser.id, allUsers]);
  
  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => {
      const timeA = a.last_message ? new Date(a.last_message.created_at).getTime() : 0;
      const timeB = b.last_message ? new Date(b.last_message.created_at).getTime() : 0;
      return timeB - timeA;
    });
  }, [conversations]);

  return (
    <div className="flex flex-col h-full">
      <Header title="Messages" />
      <div className="p-4 sticky top-[73px] bg-white/80 backdrop-blur-lg z-10">
        <div className="max-w-md mx-auto">
            <div className="flex bg-gray-200 p-1 rounded-xl">
            <button
                onClick={() => setActiveTab('messages')}
                className={`w-1/2 py-2 text-sm font-bold rounded-lg transition-all relative ${
                activeTab === 'messages' ? 'bg-white text-violet-600 shadow' : 'text-gray-600'
                }`}
            >
                Messages
            </button>
            <button
                onClick={() => setActiveTab('requests')}
                className={`w-1/2 py-2 text-sm font-bold rounded-lg transition-all relative ${
                activeTab === 'requests' ? 'bg-white text-violet-600 shadow' : 'text-gray-600'
                }`}
            >
                Requests
                {incomingRequests.length > 0 && 
                    <span className="absolute top-1 right-2 block h-4 w-4 rounded-full bg-red-500 text-white text-[10px] leading-4">
                        {incomingRequests.length}
                    </span>
                }
            </button>
            </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 pt-0 pb-24">
        <div className="max-w-md mx-auto space-y-2">
          {activeTab === 'messages' && (
            sortedConversations.length > 0 ? sortedConversations.map(convo => (
              <button key={convo.id} onClick={() => onConversationSelect(convo)} className="w-full text-left bg-white p-3 rounded-2xl shadow-sm hover:bg-gray-50 flex items-center space-x-4 transition-colors">
                  <img src={convo.other_participant.avatar_url} alt={convo.other_participant.name} className="w-14 h-14 rounded-full"/>
                  <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                          <p className="font-bold text-gray-800 truncate">{convo.other_participant.name}</p>
                          <p className="text-xs text-gray-500 flex-shrink-0 ml-2">{formatTime(convo.last_message?.created_at)}</p>
                      </div>
                      <p className="text-sm text-gray-500 truncate">{convo.last_message?.content || 'No messages yet'}</p>
                  </div>
              </button>
            )) : <p className="text-center text-gray-500 pt-10">No conversations yet.</p>
          )}

          {activeTab === 'requests' && (
            incomingRequests.length > 0 ? incomingRequests.map(user => (
              <div key={user.id} className="bg-white p-3 rounded-2xl shadow-sm flex items-center justify-between">
                <button onClick={() => onViewProfile(user.id)} className="flex items-center space-x-4 text-left">
                  <img src={user.avatar_url} alt={user.name} className="w-12 h-12 rounded-full" />
                  <div>
                    <p className="font-bold text-gray-800">{user.name}</p>
                    <p className="text-sm text-gray-500">@{user.username}</p>
                  </div>
                </button>
                <div className="flex space-x-2">
                    <button onClick={() => onFriendAction(user.id, 'accept')} className="px-3 py-1.5 text-sm font-semibold bg-green-100 text-green-700 rounded-full hover:bg-green-200">Accept</button>
                    <button onClick={() => onFriendAction(user.id, 'remove')} className="px-3 py-1.5 text-sm font-semibold bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200">Decline</button>
                </div>
              </div>
            )) : <p className="text-center text-gray-500 pt-10">No new friend requests.</p>
          )}
        </div>
      </div>
    </div>
  );
};
