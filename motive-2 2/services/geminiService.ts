import type { Motive } from '../types';
import { supabase } from './supabaseClient';

export const generateMotiveSuggestion = async (interests: string[], budget: number): Promise<Partial<Motive> | null> => {
  try {
    const { data, error } = await supabase.functions.invoke('generate-suggestion', {
      body: { interests, budget },
    });

    if (error) {
      throw new Error(`Supabase function error: ${error.message}`);
    }

    // The invoked function returns the parsed JSON object directly
    return data as Partial<Motive>;
  } catch (error) {
    console.error("Error generating motive suggestion:", error);
    return null;
  }
};
