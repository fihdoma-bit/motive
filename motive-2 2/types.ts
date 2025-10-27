
export enum MotivePrivacy {
  PUBLIC = "Public",
  FRIENDS_ONLY = "Friends Only",
  PRIVATE = "Private",
}

export interface User {
  id: string;
  name: string;
  username: string | null; // Can be null for new users
  email: string;
  avatar_url: string; 
  bio: string;
  interests: string[];
  monthly_budget: number;
}

export interface ChatMessage {
  userId: string;
  name: string;
  avatar_url: string;
  message: string;
  timestamp: string;
}

export interface Motive {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  date: string;
  cost: number;
  max_participants: number;
  privacy: MotivePrivacy;
  participants: User[];
  created_by: User;
  image_url: string;
  chat?: ChatMessage[];
}

// --- NEW SOCIAL FEATURES ---

export type FriendshipStatus = 'pending' | 'accepted' | 'blocked';

export interface Friendship {
  user_id_1: string;
  user_id_2: string;
  status: FriendshipStatus;
  action_by: string;
  // We'll join the user profiles in the app
  user_1_profile?: User;
  user_2_profile?: User;
}

export interface Conversation {
  id: number;
  created_at: string;
  // This will be populated by the app
  other_participant: User;
  last_message?: DirectMessage;
}

export interface DirectMessage {
  id: number;
  conversation_id: number;
  sender_id: string;
  content: string;
  created_at: string;
}


export type Screen = 'home' | 'create' | 'budget' | 'messages' | 'profile';
