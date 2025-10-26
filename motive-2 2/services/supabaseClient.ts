import { createClient } from '@supabase/supabase-js';

// Vercel/Vite will provide environment variables during the build process.
// We provide hardcoded fallbacks here for the local, non-build development environment
// to prevent the app from crashing.
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://hhhsjekdyksoovxwvazc.supabase.co';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoaHNqZWtkeWtzb292eHd2YXpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MDYxMTQsImV4cCI6MjA3NzA4MjExNH0.SF3J2FNNjU1QJB59FK003Tq1TCtE87-6ZA3TxbqcU3g';

if (!supabaseUrl || !supabaseAnonKey) {
  // This error will be shown if both the environment variable and the fallback are missing.
  throw new Error("Supabase URL and Anon Key are missing.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
