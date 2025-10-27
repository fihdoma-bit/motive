import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { GoogleGenAI, Type } from 'npm:@google/genai';

// Add a CORS header to the response to allow requests from your Vercel app
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// FIX: Add type declaration for Deno to resolve "Cannot find name 'Deno'" error.
// Supabase Edge Functions run in a Deno environment where `Deno` is a global object.
declare const Deno: {
  env: {
    get: (key: string) => string | undefined;
  };
};

serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { interests, budget } = await req.json();
    const apiKey = Deno.env.get('GEMINI_API_KEY');

    if (!apiKey) {
      throw new Error("Missing GEMINI_API_KEY secret in Supabase Edge Function.");
    }
    
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      Based on the following user preferences, generate a single, creative and fun social activity suggestion (a "motive").
      User Interests: ${interests.join(', ')}
      Remaining Monthly Budget: £${budget}
      
      The suggestion should be realistic and appealing. The cost should be reasonable considering the user's remaining budget. Do not exceed the user's budget.
      Provide the output in a JSON format that matches the specified schema.
    `;

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

    // FIX: Trim whitespace from the response before parsing as JSON.
    const jsonString = response.text.trim();
    const suggestion = JSON.parse(jsonString);

    return new Response(JSON.stringify(suggestion), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
