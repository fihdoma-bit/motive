
import React, { useState, useRef, useEffect } from 'react';
import type { Motive, User, ChatMessage } from '../types';
import { Icon } from '../components/Icon';
import { supabase } from '../services/supabaseClient';

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) + ' at ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

const formatTimeAgo = (timestamp: string) => {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - new Date(timestamp).getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "m ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "min ago";
  return "just now";
}

interface MotiveDetailScreenProps {
  motive: Motive;
  currentUser: User;
  onBack: () => void;
  onToggleJoin: () => void;
  onSendMessage: (message: string) => void;
  onViewProfile: (userId: string) => void;
}

export const MotiveDetailScreen: React.FC<MotiveDetailScreenProps> = ({ motive, currentUser, onBack, onToggleJoin, onSendMessage, onViewProfile }) => {
  const [newMessage, setNewMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isParticipantsExpanded, setIsParticipantsExpanded] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const isParticipant = motive.participants.some(p => p.id === currentUser.id);

  useEffect(() => {
    const fetchChat = async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*, author:profiles(*)')
        .eq('motive_id', motive.id)
        .order('created_at', { ascending: true });
      if (data) {
        const formattedMessages = data.map(msg => ({
            userId: msg.author.id,
            name: msg.author.name,
            avatar_url: msg.author.avatar_url,
            message: msg.message,
            timestamp: msg.created_at,
        }));
        setChatMessages(formattedMessages);
      } else {
        console.error("Error fetching chat:", error);
      }
    };
    fetchChat();

    const subscription = supabase
      .channel(`chat:${motive.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `motive_id=eq.${motive.id}` }, 
      async (payload) => {
        const { data: newMsgData } = await supabase.from('profiles').select('*').eq('id', payload.new.user_id).single();
        if(newMsgData) {
            const newMessage: ChatMessage = {
                userId: newMsgData.id, name: newMsgData.name, avatar_url: newMsgData.avatar_url,
                message: payload.new.message, timestamp: payload.new.created_at,
            };
            setChatMessages(current => [...current, newMessage]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [motive.id]);


  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const SHOW_COLLAPSED_LIMIT = 10;
  const shouldCollapseParticipants = motive.participants.length > SHOW_COLLAPSED_LIMIT;
  const visibleParticipants = shouldCollapseParticipants && !isParticipantsExpanded
    ? motive.participants.slice(0, SHOW_COLLAPSED_LIMIT)
    : motive.participants;

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="sticky top-0 bg-white/80 backdrop-blur-lg z-20 px-4 pt-4 pb-3 border-b border-gray-200">
        <div className="max-w-md mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <button onClick={onBack} className="p-2 -ml-2 text-gray-600 hover:text-gray-900 flex-shrink-0">
              <Icon name="back" className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-gray-900 truncate">{motive.title}</h1>
          </div>
          {isParticipant && (
            <button
              onClick={onToggleJoin}
              className="px-3 py-1.5 text-sm font-bold rounded-full shadow-sm transition-all bg-red-100 text-red-600 hover:bg-red-200 flex-shrink-0"
            >
              Leave
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <img src={motive.image_url} alt={motive.title} className="w-full h-52 object-cover" />
        
        <div className="p-4 max-w-md mx-auto space-y-6 pb-24">
          <div>
            <p className="font-semibold text-violet-600">{motive.category.toUpperCase()}</p>
            <h2 className="text-3xl font-bold text-gray-800 mt-1">{motive.title}</h2>
          </div>
          
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-md">
            <div className="flex items-center space-x-3 text-gray-600">
              <Icon name="calendar" className="w-6 h-6 text-gray-400" />
              <span className="font-medium">{formatDate(motive.date)}</span>
            </div>
             <div className="text-right">
                <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-500 to-violet-500">£{motive.cost}</p>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-2xl shadow-md">
            <h3 className="font-bold text-lg text-gray-800 mb-2">Details</h3>
            <p className="text-gray-600 whitespace-pre-wrap">{motive.description}</p>
            <div className="flex items-center space-x-2 mt-4 text-gray-700">
              <Icon name="location" className="w-5 h-5 text-gray-400" />
              <span className="font-medium">{motive.location}</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-md">
            <h3 className="font-bold text-lg text-gray-800 mb-3">Participants ({motive.participants.length}/{motive.max_participants})</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1">
              {visibleParticipants.map(p => (
                 <button 
                    key={p.id} 
                    onClick={() => onViewProfile(p.id)}
                    className="flex items-center space-x-2 text-left p-1 -ml-1 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-300">
                    <img src={p.avatar_url} alt={p.name} className="w-10 h-10 rounded-full" />
                    <div className="flex items-center gap-1">
                        <span className="font-medium text-gray-700 truncate">@{p.username}</span>
                        {motive.created_by && p.id === motive.created_by.id && (
                            <Icon name="crown" className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                        )}
                    </div>
                </button>
              ))}
            </div>
             {shouldCollapseParticipants && (
                <button 
                    onClick={() => setIsParticipantsExpanded(!isParticipantsExpanded)}
                    className="w-full mt-4 py-2 text-sm font-semibold text-violet-600 bg-violet-100 rounded-lg hover:bg-violet-200 transition-colors"
                >
                    {isParticipantsExpanded ? 'Show Less' : `View All ${motive.participants.length} Participants`}
                </button>
            )}
          </div>

          {isParticipant && (
            <div className="bg-white p-4 rounded-2xl shadow-md">
              <h3 className="font-bold text-lg text-gray-800 mb-3">Chat</h3>
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {(chatMessages && chatMessages.length > 0) ? chatMessages.map((msg, index) => (
                  <div key={index} className={`flex items-end gap-2 ${msg.userId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                    {msg.userId !== currentUser.id && <img src={msg.avatar_url} className="w-8 h-8 rounded-full" />}
                    <div className={`max-w-xs p-3 rounded-2xl ${msg.userId === currentUser.id ? 'bg-violet-500 text-white rounded-br-lg' : 'bg-gray-200 text-gray-800 rounded-bl-lg'}`}>
                      <p className="text-sm">{msg.message}</p>
                       <p className={`text-xs mt-1 ${msg.userId === currentUser.id ? 'text-violet-200' : 'text-gray-500'}`}>{formatTimeAgo(msg.timestamp)}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-center text-gray-500 py-4">No messages yet. Be the first to say something!</p>
                )}
                <div ref={chatEndRef} />
              </div>
            </div>
          )}

        </div>
      </div>
      
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-gray-200 z-20">
        <div className="max-w-md mx-auto p-2">
           {isParticipant ? (
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <input 
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Send a message..."
                className="w-full px-4 py-3 bg-gray-100 border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <button type="submit" className="p-3 bg-violet-600 text-white rounded-full hover:bg-violet-700 transition-colors disabled:opacity-50 flex-shrink-0" disabled={!newMessage.trim()}>
                <Icon name="send" className="w-6 h-6" />
              </button>
            </form>
           ) : (
            <button 
              onClick={onToggleJoin}
              className="w-full px-4 py-3 font-bold rounded-lg shadow-md transition-all bg-gradient-to-r from-sky-500 to-violet-500 text-white hover:opacity-90"
            >
              Join Motive
            </button>
           )}
        </div>
      </div>

    </div>
  );
};
