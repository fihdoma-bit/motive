
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import type { Conversation, User, DirectMessage } from '../types';
import { Icon } from '../components/Icon';

interface DirectMessageScreenProps {
  conversation: Conversation;
  currentUser: User;
  onSendMessage: (conversationId: number, content: string) => void;
  onBack: () => void;
  onViewProfile: (userId: string) => void;
}

const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

export const DirectMessageScreen: React.FC<DirectMessageScreenProps> = ({ conversation, currentUser, onSendMessage, onBack, onViewProfile }) => {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('direct_messages')
        .select('*')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true });
      if (data) setMessages(data);
    };
    fetchMessages();

    const subscription = supabase
      .channel(`dm:${conversation.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages', filter: `conversation_id=eq.${conversation.id}` },
        (payload) => {
          setMessages(current => [...current, payload.new as DirectMessage]);
        }
      ).subscribe();
      
    return () => {
        supabase.removeChannel(subscription);
    }
  }, [conversation.id]);
  
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onSendMessage(conversation.id, newMessage.trim());
      setNewMessage('');
    }
  };

  const otherParticipant = conversation.other_participant;

  return (
    <div className="flex flex-col h-full bg-gray-100">
      <div className="sticky top-0 bg-white/80 backdrop-blur-lg z-20 px-4 pt-4 pb-3 border-b border-gray-200">
        <div className="max-w-md mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <button onClick={onBack} className="p-2 -ml-2 text-gray-600 hover:text-gray-900 flex-shrink-0">
              <Icon name="back" className="w-6 h-6" />
            </button>
            <button onClick={() => onViewProfile(otherParticipant.id)} className="flex items-center gap-2 text-left">
              <img src={otherParticipant.avatar_url} alt={otherParticipant.name} className="w-10 h-10 rounded-full"/>
              <div>
                <h1 className="font-bold text-gray-900 truncate">{otherParticipant.name}</h1>
                <p className="text-xs text-gray-500">@{otherParticipant.username}</p>
              </div>
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex items-end gap-2 ${msg.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}>
            {msg.sender_id !== currentUser.id && <img src={otherParticipant.avatar_url} className="w-8 h-8 rounded-full" />}
            <div className={`max-w-xs p-3 rounded-2xl ${msg.sender_id === currentUser.id ? 'bg-violet-500 text-white rounded-br-lg' : 'bg-white text-gray-800 rounded-bl-lg shadow-sm'}`}>
              <p className="text-sm">{msg.content}</p>
              <p className={`text-xs mt-1 ${msg.sender_id === currentUser.id ? 'text-violet-200' : 'text-gray-500'}`}>{formatTime(msg.created_at)}</p>
            </div>
          </div>
        ))}
         <div ref={chatEndRef} />
      </div>
      
       <div className="bg-white/80 backdrop-blur-lg border-t border-gray-200 z-20">
        <div className="max-w-md mx-auto p-2">
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
        </div>
      </div>
    </div>
  );
};
