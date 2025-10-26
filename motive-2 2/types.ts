
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
  avatar: string;
  bio: string;
  interests: string[];
  monthlyBudget: number;
  friends: string[]; // array of user ids
}

export interface ChatMessage {
  userId: string;
  name: string;
  avatar: string;
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
  maxParticipants: number;
  privacy: MotivePrivacy;
  participants: User[];
  createdBy: string; // user id
  image: string;
  chat?: ChatMessage[];
}

export interface Friend {
    id: string;
    name: string;
    avatar: string;
    isOnline: boolean;
}

export interface FriendGroup {
    id: string;
    name: string;
    members: Friend[];
}

export type Screen = 'home' | 'create' | 'budget' | 'friends' | 'profile';