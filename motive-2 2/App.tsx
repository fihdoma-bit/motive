
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { Screen, Motive, User, Friend } from './types';
import { BottomNav } from './components/BottomNav';
import { HomeScreen } from './screens/HomeScreen';
import { CreateScreen } from './screens/CreateScreen';
import { BudgetScreen } from './screens/BudgetScreen';
import { FriendsScreen } from './screens/FriendsScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { MotiveDetailScreen } from './screens/MotiveDetailScreen';
import { AuthScreen } from './screens/AuthScreen';
import { supabase } from './services/supabaseClient';
import type { Session } from '@supabase/supabase-js';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  
  const [activeScreen, setActiveScreen] = useState<Screen>('home');
  const [selectedMotiveId, setSelectedMotiveId] = useState<string | null>(null);
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [motives, setMotives] = useState<Motive[]>([]);
  
  // Handle Auth State Changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoggedIn(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      const loggedIn = !!session;
      setIsLoggedIn(loggedIn);

      if (_event === 'SIGNED_IN' && session?.user) {
        // Check if a profile exists for the new user
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', session.user.id)
          .single();

        // If no profile exists, create one. This is key for the magic link flow.
        if (!profile && session.user.user_metadata.name) {
          const { name, username } = session.user.user_metadata;
          const { data: newProfile, error } = await supabase
            .from('profiles')
            .insert({
              id: session.user.id,
              name: name,
              username: username,
              avatar_url: `https://picsum.photos/seed/${name.split(' ')[0]}/200`,
            })
            .select()
            .single();
          
          if (error) {
            console.error("Error creating profile:", error);
          } else if (newProfile) {
             setCurrentUser(newProfile as User);
          }
        }
      }
      
      if (!loggedIn) {
        setCurrentUser(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Fetch initial data on login
  useEffect(() => {
    if (isLoggedIn && session?.user) {
      const fetchInitialData = async () => {
        // Fetch current user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (profile) setCurrentUser(profile as User);
        else console.error('Error fetching profile:', profileError);

        // Fetch all motives with participants
        const { data: motivesData, error: motivesError } = await supabase
          .from('motives')
          .select('*, participants:profiles(*)')
          .order('date', { ascending: false });
        if (motivesData) setMotives(motivesData as any);
        else console.error('Error fetching motives:', motivesError);
        
        // Fetch all users
        const {data: allUsersData, error: usersError} = await supabase.from('profiles').select('*');
        if (allUsersData) setAllUsers(allUsersData as User[]);
        else console.error('Error fetching users:', usersError);

      };
      fetchInitialData();
    }
  }, [isLoggedIn, session]);
  
  // MOCK friends for now until a real friends system is in the DB
  const friends: Friend[] = useMemo(() => {
    if (!currentUser) return [];
    return allUsers
      .filter(u => u.id !== currentUser.id) // Show all other users as friends for demo
      .map(u => ({
        id: u.id,
        name: u.name,
        avatar: u.avatar,
        isOnline: Math.random() > 0.5,
      }));
  }, [currentUser, allUsers]);

  const addMotive = useCallback(async (newMotiveData: Omit<Motive, 'id' | 'createdBy' | 'participants' | 'chat'>) => {
    if (!currentUser) return;
    const { data, error } = await supabase
        .from('motives')
        .insert({ ...newMotiveData, created_by: currentUser.id })
        .select()
        .single();

    if (data && !error) {
        // Also add creator as the first participant
        await supabase.from('participants').insert({ motive_id: data.id, user_id: currentUser.id });
        setMotives(prev => [{ ...data, participants: [currentUser], chat:[] } as any, ...prev]);
        setActiveScreen('home');
    } else {
        console.error("Error creating motive:", error);
    }
  }, [currentUser]);
  
  const updateBudget = useCallback(async (newBudget: number) => {
    if (currentUser) {
        const { data, error } = await supabase
            .from('profiles')
            .update({ monthly_budget: newBudget })
            .eq('id', currentUser.id)
            .select()
            .single();
        if (data) setCurrentUser(data as User);
        else console.error("Error updating budget:", error);
    }
  }, [currentUser]);

  const toggleMotiveParticipation = useCallback(async (motiveId: string) => {
    if (!currentUser) return;
    const motive = motives.find(m => m.id === motiveId);
    if (!motive) return;

    const isParticipant = motive.participants.some(p => p.id === currentUser.id);

    if (isParticipant) {
      // Leave
      await supabase.from('participants').delete().match({ motive_id: motiveId, user_id: currentUser.id });
      setMotives(prev => prev.map(m => m.id === motiveId ? { ...m, participants: m.participants.filter(p => p.id !== currentUser!.id) } : m));
    } else {
      // Join
      await supabase.from('participants').insert({ motive_id: motiveId, user_id: currentUser.id });
       setMotives(prev => prev.map(m => m.id === motiveId ? { ...m, participants: [...m.participants, currentUser] } : m));
    }
  }, [currentUser, motives]);

  const addChatMessage = useCallback(async (motiveId: string, message: string) => {
    if (!currentUser) return;
    await supabase.from('chat_messages').insert({ motive_id: motiveId, user_id: currentUser.id, message });
    // This will be handled by realtime subscription in MotiveDetailScreen to avoid duplicate updates
  }, [currentUser]);


  const renderContent = () => {
    if (!isLoggedIn) {
      return <AuthScreen />;
    }
    
    const user = currentUser;
    if (!user) {
        // Loading state
        return <div className="flex h-full items-center justify-center"><p>Loading profile...</p></div>;
    }

    const viewingUser = allUsers.find(u => u.id === viewingProfileId);
    if (viewingUser) {
      return <ProfileScreen userToShow={viewingUser} currentUser={user} motives={motives} onSelectMotive={(id) => setSelectedMotiveId(id)} onBack={() => setViewingProfileId(null)} />;
    }
    
    const selectedMotive = motives.find(m => m.id === selectedMotiveId);
    if (selectedMotive) {
      return <MotiveDetailScreen key={selectedMotiveId} motive={selectedMotive} currentUser={user} onBack={() => setSelectedMotiveId(null)} onToggleJoin={() => toggleMotiveParticipation(selectedMotive.id)} onSendMessage={(message) => addChatMessage(selectedMotive.id, message)} onViewProfile={(id) => setViewingProfileId(id)} />;
    }

    switch (activeScreen) {
      case 'home':
        return <HomeScreen motives={motives} user={user} onSelectMotive={(id) => setSelectedMotiveId(id)} />;
      case 'create':
        const spent = motives.filter(m => m.participants.some(p => p.id === user.id)).reduce((sum, m) => sum + m.cost, 0);
        return <CreateScreen addMotive={addMotive} currentUser={user} userBudget={user.monthlyBudget - spent} />;
      case 'budget':
        return <BudgetScreen currentUser={user} motives={motives} updateBudget={updateBudget} />;
      case 'friends':
        return <FriendsScreen friends={friends} groups={[]} onViewProfile={(id) => setViewingProfileId(id)} />; // Groups NYI
      case 'profile':
        return <ProfileScreen userToShow={user} currentUser={user} motives={motives} onSelectMotive={(id) => setSelectedMotiveId(id)} />;
      default:
        return <HomeScreen motives={motives} user={user} onSelectMotive={(id) => setSelectedMotiveId(id)} />;
    }
  };

  return (
    <div className="h-screen w-screen bg-gray-900 flex items-center justify-center font-sans">
      <main className="relative w-full max-w-md h-full bg-gray-100 shadow-2xl overflow-hidden">
        <div className="h-full overflow-y-auto">
          {renderContent()}
        </div>
        {isLoggedIn && !selectedMotiveId && !viewingProfileId && <BottomNav activeScreen={activeScreen} setActiveScreen={setActiveScreen} />}
      </main>
    </div>
  );
};

export default App;
