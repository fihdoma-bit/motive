import { GoogleGenAI, Type } from "@google/genai";
import type { Motive } from '../types';

// Use browser-compatible environment variables from Vite/Vercel.
// Fallback to an empty string to prevent crashes if the key isn't set during local development.
const apiKey = (import.meta as any).env?.VITE_API_KEY || '';

if (!apiKey) {
    console.warn("Gemini API key is not configured. AI features will not work. Please set VITE_API_KEY as a secret for deployment.");
}

const ai = new GoogleGenAI({ apiKey: apiKey });

export const generateMotiveSuggestion = async (interests: string[], budget: number): Promise<Partial<Motive> | null> => {
  if (!apiKey) {
    console.error("Cannot generate suggestion: Gemini API Key is missing.");
    return null;
  }
  
  const prompt = `
    Based on the following user preferences, generate a single, creative and fun social activity suggestion (a "motive").
    User Interests: ${interests.join(', ')}
    Remaining Monthly Budget: £${budget}
    
    The suggestion should be realistic and appealing. The cost should be reasonable considering the user's remaining budget. Do not exceed the user's budget.
    Provide the output in a JSON format that matches the specified schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'A catchy title for the activity, including an emoji.' },
            description: { type: Type.STRING, description: 'A brief, exciting description of the activity.' },
            category: { type: Type.STRING, description: 'A relevant category like "Sports", "Social", "Food & Drink", etc.' },
            location: { type: Type.STRING, description: 'A plausible location or area for the activity.' },
            cost: { type: Type.NUMBER, description: 'An estimated cost per person for the activity.' },
          },
          required: ['title', 'description', 'category', 'location', 'cost']
        },
      },
    });

    const jsonString = response.text;
    const suggestion = JSON.parse(jsonString) as Partial<Motive>;
    return suggestion;
  } catch (error) {
    console.error("Error generating motive suggestion:", error);
    return null;
  }
};
