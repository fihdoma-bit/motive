
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { Screen, Motive, User, Friendship, Conversation, DirectMessage } from './types';
import { BottomNav } from './components/BottomNav';
import { HomeScreen } from './screens/HomeScreen';
import { CreateScreen } from './screens/CreateScreen';
import { BudgetScreen } from './screens/BudgetScreen';
import { MessagesScreen } from './screens/MessagesScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { MotiveDetailScreen } from './screens/MotiveDetailScreen';
import { DirectMessageScreen } from './screens/DirectMessageScreen';
import { AuthScreen } from './screens/AuthScreen';
import { supabase } from './services/supabaseClient';
import type { Session } from '@supabase/supabase-js';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  const [activeScreen, setActiveScreen] = useState<Screen>('home');
  const [selectedMotiveId, setSelectedMotiveId] = useState<string | null>(null);
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);
  const [viewingConversation, setViewingConversation] = useState<Conversation | null>(null);
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [motives, setMotives] = useState<Motive[]>([]);
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  
  const fetchAllData = useCallback(async (currentSession: Session) => {
    if (!currentSession) return;
    setIsLoading(true);
    
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', currentSession.user.id).single();
    if (profile) setCurrentUser(profile as User);

    const { data: motivesData } = await supabase.from('motives').select('*, participants:profiles(*), created_by:profiles(*)').order('date', { ascending: false });
    if (motivesData) setMotives(motivesData as any);
    
    const { data: allUsersData } = await supabase.from('profiles').select('*');
    if (allUsersData) setAllUsers(allUsersData as User[]);
    
    // --- NEW: Fetch Social Data ---
    const { data: friendshipsData } = await supabase.from('friendships').select('*');
    if (friendshipsData) setFriendships(friendshipsData as Friendship[]);
    
    const { data: convosData } = await supabase.rpc('get_conversations_with_details', { p_user_id: currentSession.user.id });
    if (convosData) setConversations(convosData as Conversation[]);
    
    setIsLoading(false);
  }, []);
  
  // Handle Auth State Changes & Fix "Hi @null" bug
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);

      if (_event === 'SIGNED_IN' && session?.user) {
        const { data: profile } = await supabase.from('profiles').select('id, username').eq('id', session.user.id).single();
        
        // If user profile doesn't exist, create it.
        if (!profile) {
          let newUsername = session.user.user_metadata.username || null;
          // FIX "Hi @null" bug for Google sign-ins
          if (!newUsername) {
            const baseName = session.user.user_metadata.name.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
            newUsername = `${baseName}${Math.floor(Math.random() * 999)}`;
          }
          
          await supabase.from('profiles').insert({
            id: session.user.id,
            name: session.user.user_metadata.name,
            username: newUsername,
            avatar_url: session.user.user_metadata.avatar_url || `https://picsum.photos/seed/${newUsername}/200`,
          });
        }
      }
      if (!session) setCurrentUser(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Fetch initial data on login
  useEffect(() => {
    if (session?.user) fetchAllData(session);
  }, [session, fetchAllData]);
  
  // --- NEW: Real-time Subscriptions ---
  useEffect(() => {
    if (!currentUser) return;
    
    // Listen for new/updated friendships
    const friendshipSub = supabase
      .channel('public:friendships')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, 
        () => fetchAllData(session!)
      ).subscribe();
      
    // Listen for new messages
    const messageSub = supabase
        .channel('public:direct_messages')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages'},
        async (payload) => {
            const { data: convosData } = await supabase.rpc('get_conversations_with_details', { p_user_id: currentUser.id });
            if (convosData) setConversations(convosData as Conversation[]);
        }).subscribe();

    return () => {
      supabase.removeChannel(friendshipSub);
      supabase.removeChannel(messageSub);
    }
  }, [currentUser, session, fetchAllData]);
  
  // --- Handlers for New Social Features ---
  const handleFriendAction = async (targetUserId: string, action: 'add' | 'accept' | 'remove') => {
    if (!currentUser) return;
    const currentUserId = currentUser.id;
    // Ensure consistent order for primary key
    const [user_id_1, user_id_2] = [currentUserId, targetUserId].sort();

    if (action === 'add') {
      await supabase.from('friendships').insert({ user_id_1, user_id_2, status: 'pending', action_by: currentUserId });
    } else if (action === 'accept') {
      await supabase.from('friendships').update({ status: 'accepted', action_by: currentUserId }).match({ user_id_1, user_id_2 });
    } else if (action === 'remove') {
      await supabase.from('friendships').delete().match({ user_id_1, user_id_2 });
    }
  };
  
  const handleStartChat = async (targetUserId: string) => {
    if (!currentUser) return;
    const { data: existingConvo } = await supabase.rpc('find_conversation_by_users', { user1_id: currentUser.id, user2_id: targetUserId });
    
    if (existingConvo && existingConvo.length > 0) {
      const fullConvo = conversations.find(c => c.id === existingConvo[0].id);
      if(fullConvo) setViewingConversation(fullConvo);
    } else {
      const { data: newConvo, error } = await supabase.from('conversations').insert({}).select().single();
      if (newConvo && !error) {
        await supabase.from('conversation_participants').insert([
          { conversation_id: newConvo.id, user_id: currentUser.id },
          { conversation_id: newConvo.id, user_id: targetUserId },
        ]);
        const otherUser = allUsers.find(u => u.id === targetUserId);
        if (otherUser) {
           const newConversationObject: Conversation = {
             id: newConvo.id,
             created_at: newConvo.created_at,
             other_participant: otherUser,
           };
           setConversations(prev => [...prev, newConversationObject]);
           setViewingConversation(newConversationObject);
        }
      }
    }
  };
  
  const handleSendMessage = async (conversationId: number, content: string) => {
    if (!currentUser) return;
    await supabase.from('direct_messages').insert({ conversation_id: conversationId, sender_id: currentUser.id, content });
  };


  const addMotive = useCallback(async (newMotiveData: Omit<Motive, 'id' | 'created_by' | 'participants' | 'chat'>) => {
    if (!currentUser || !session) return false;
    const { data, error } = await supabase.from('motives').insert({ ...newMotiveData, created_by: currentUser.id }).select('id').single();

    if (data && !error) {
        const { error: participantError } = await supabase.from('participants').insert({ motive_id: data.id, user_id: currentUser.id });
        if(participantError) {
          alert(`Motive created, but failed to add you as participant: ${participantError.message}`);
          return false;
        }
        await fetchAllData(session);
        setActiveScreen('home');
        return true;
    } else {
        alert(`Error creating motive: ${error?.message || 'Unknown error'}`);
        return false;
    }
  }, [currentUser, session, fetchAllData]);
  
  const updateBudget = useCallback(async (newBudget: number) => {
    if (currentUser) {
        const { data } = await supabase.from('profiles').update({ monthly_budget: newBudget }).eq('id', currentUser.id).select().single();
        if (data) setCurrentUser(data as User);
    }
  }, [currentUser]);

  const toggleMotiveParticipation = useCallback(async (motiveId: string) => {
    if (!currentUser || !session) return;
    const motive = motives.find(m => m.id === motiveId);
    if (!motive) return;
    const isParticipant = motive.participants.some(p => p.id === currentUser.id);
    if (isParticipant) {
      await supabase.from('participants').delete().match({ motive_id: motiveId, user_id: currentUser.id });
    } else {
      await supabase.from('participants').insert({ motive_id: motiveId, user_id: currentUser.id });
    }
    await fetchAllData(session);
  }, [currentUser, motives, session, fetchAllData]);

  const addChatMessage = useCallback(async (motiveId: string, message: string) => {
    if (!currentUser) return;
    await supabase.from('chat_messages').insert({ motive_id: motiveId, user_id: currentUser.id, message });
  }, [currentUser]);
  
  const memoizedScreens = useMemo(() => {
    if (!currentUser) return {};
    const spent = motives.filter(m => m.participants.some(p => p.id === currentUser.id)).reduce((sum, m) => sum + m.cost, 0);
    return {
      home: <HomeScreen motives={motives} user={currentUser} onSelectMotive={(id) => setSelectedMotiveId(id)} />,
      create: <CreateScreen addMotive={addMotive} currentUser={currentUser} userBudget={currentUser.monthly_budget - spent} />,
      budget: <BudgetScreen currentUser={currentUser} motives={motives} updateBudget={updateBudget} />,
      messages: <MessagesScreen currentUser={currentUser} friendships={friendships} conversations={conversations} allUsers={allUsers} onFriendAction={handleFriendAction} onViewProfile={setViewingProfileId} onConversationSelect={setViewingConversation} />,
      profile: <ProfileScreen userToShow={currentUser} currentUser={currentUser} motives={motives} friendship={null} onSelectMotive={(id) => setSelectedMotiveId(id)} onStartChat={handleStartChat} onFriendAction={handleFriendAction} />,
    };
  }, [currentUser, motives, friendships, conversations, allUsers, addMotive, updateBudget]);

  const renderContent = () => {
    if (isLoading) {
       return <div className="flex h-full items-center justify-center bg-gray-100"><p className="text-gray-500">Loading...</p></div>;
    }

    if (!session || !currentUser) {
      return <AuthScreen />;
    }
    
    if (viewingConversation) {
      return <DirectMessageScreen key={viewingConversation.id} conversation={viewingConversation} currentUser={currentUser} onSendMessage={handleSendMessage} onBack={() => setViewingConversation(null)} onViewProfile={setViewingProfileId} />;
    }

    const viewingUser = allUsers.find(u => u.id === viewingProfileId);
    if (viewingUser) {
      const friendship = friendships.find(f => (f.user_id_1 === viewingUser.id && f.user_id_2 === currentUser.id) || (f.user_id_1 === currentUser.id && f.user_id_2 === viewingUser.id)) || null;
      return <ProfileScreen userToShow={viewingUser} currentUser={currentUser} motives={motives} friendship={friendship} onSelectMotive={(id) => setSelectedMotiveId(id)} onStartChat={handleStartChat} onFriendAction={handleFriendAction} onBack={() => setViewingProfileId(null)} />;
    }
    
    const selectedMotive = motives.find(m => m.id === selectedMotiveId);
    if (selectedMotive) {
      return <MotiveDetailScreen key={selectedMotiveId} motive={selectedMotive} currentUser={currentUser} onBack={() => setSelectedMotiveId(null)} onToggleJoin={() => toggleMotiveParticipation(selectedMotive.id)} onSendMessage={(message) => addChatMessage(selectedMotive.id, message)} onViewProfile={(id) => setViewingProfileId(id)} />;
    }
    
    return memoizedScreens[activeScreen] || memoizedScreens['home'];
  };

  const showNav = !isLoading && !!session && !selectedMotiveId && !viewingProfileId && !viewingConversation;

  return (
    <div className="h-screen w-screen bg-gray-900 flex items-center justify-center font-sans">
      <main className="relative w-full max-w-md h-full bg-gray-100 shadow-2xl overflow-hidden flex flex-col">
        <div className="flex-1 h-full overflow-y-auto">
          {renderContent()}
        </div>
        {showNav && <BottomNav activeScreen={activeScreen as Screen} setActiveScreen={setActiveScreen} />}
      </main>
    </div>
  );
};

export default App;
