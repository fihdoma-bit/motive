
import React, { useState } from 'react';
import { Icon } from '../components/Icon';
import { supabase } from '../services/supabaseClient';

export const AuthScreen: React.FC = () => {
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) {
      setError(error.message);
      setIsLoading(false);
    }
  };

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      // This method works for both sign-up and sign-in.
      // If the user is new, the 'data' option will attach metadata to the new user object,
      // which we can then use to create their profile after they click the link.
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          // Send user details along with the magic link request.
          // This will be used in App.tsx to create a profile if the user is new.
          data: {
            name: name,
            username: username.toLowerCase(),
          }
        }
      });
      
      if (error) {
        setError(error.message);
      } else {
        setMessage('Success! Check your email for the magic sign-in link.');
      }
    } catch (e: any) {
        setError(e.message || 'An unexpected error occurred.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 p-4 justify-center">
      <div className="w-full max-w-sm mx-auto text-center">
        <div className="flex justify-center items-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-sky-500 to-violet-500 rounded-2xl flex items-center justify-center">
            <Icon name="friends" className="w-10 h-10 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-800">Welcome to Motive</h1>
        <p className="text-gray-600 mt-2">Sign in or create an account with a magic link.</p>

        <div className="mt-8">
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 font-semibold hover:bg-gray-50 transition-all disabled:opacity-70"
            >
              <svg className="w-5 h-5" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path>
                <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path>
                <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.222 0-9.618-3.229-11.383-7.582l-6.61 5.241C9.032 39.579 16.022 44 24 44z"></path>
                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.021 35.596 44 30.138 44 24c0-1.341-.138-2.65-.389-3.917z"></path>
              </svg>
              Continue with Google
            </button>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t border-gray-300" /></div>
              <div className="relative flex justify-center"><span className="bg-gray-50 px-2 text-sm text-gray-500">or with email</span></div>
            </div>
            
            {message ? (
              <div className="p-4 bg-green-100 text-green-800 rounded-lg">
                {message}
              </div>
            ) : (
              <form onSubmit={handleMagicLinkSubmit} className="space-y-4">
                <p className="text-sm text-gray-500 text-left">
                  If you're new, fill in all fields. If you're returning, just enter your email.
                </p>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full Name (for new users)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username (for new users)"
                  pattern="^[a-z0-9_]{3,15}$"
                  title="Username must be 3-15 characters, lowercase, and can only contain letters, numbers, and underscores."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                
                {error && <p className="text-red-500 text-sm">{error}</p>}
                
                <button
                  type="submit"
                  className="w-full px-4 py-3 text-white font-bold rounded-lg shadow-md bg-gradient-to-r from-sky-500 to-violet-500 hover:from-sky-600 hover:to-violet-600 transition-all disabled:opacity-70"
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending...' : 'Send Sign-in Link'}
                </button>
              </form>
            )}
        </div>
      </div>
    </div>
  );
};
