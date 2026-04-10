import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CollegeData {
  id: string;
  title: string;
  category: string;
  content: string;
  tags: string[] | null;
  created_at: string;
  file_url?: string;
  file_name?: string;
  file_type?: string;
  parsed_content?: string;
}

function buildSystemPrompt(fullContext: string): string {
  return `You are Campus Buddy, a campus guide that helps students with college-related questions.

STRICT DATA RULE — THIS IS YOUR #1 PRIORITY:
- You may ONLY answer using the "Available Campus Data" provided below.
- If the answer is NOT found in the data below, you MUST respond with exactly: SYNCSPOT_REDIRECT
- NEVER guess, assume, fabricate, or provide generic information.
- NEVER use your general knowledge to answer campus questions.
- If data is partially available, share only what you have and say you don't have the rest.

TONE:
- Professional, friendly, concise — like a helpful senior student.
- Never say "according to the database" or "in the provided data". Speak naturally.
- Keep answers to 1-3 sentences.

FORMATTING:
- Use **bold** for key info (names, times, rooms).
- No single asterisks — only **double** for bold.

SCOPE:
- Only answer college-related questions (academics, faculty, timetables, events, campus facilities, documents).
- Non-college questions: "I can only help with campus-related questions."

AMBIGUITY:
- If multiple matches exist, ask a clarifying question.

Available Campus Data:
${fullContext || 'No data available yet. Respond with SYNCSPOT_REDIRECT for any question.'}`;
}

async function postToSyncSpot(req: Request, supabaseUrl: string, supabaseKey: string, message: string) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return;
  try {
    const token = authHeader.replace('Bearer ', '');
    const supabaseClient = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: userData } = await supabaseClient.auth.getUser(token);
    if (userData?.user) {
      await supabaseClient.from('syncspot_questions').insert({
        question: message,
        user_id: userData.user.id
      });
      console.log('Question posted to SyncSpot');
    }
  } catch (e) {
    console.error('Error posting to SyncSpot:', e);
  }
}

function makeSyncSpotResponse() {
  return new Response(JSON.stringify({
    response: "I don't have that information right now. I've posted your question to **SyncSpot** where the community can help!",
    redirect: 'syncspot'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function cleanResponse(text: string): string {
  return text.replace(/(?<!\*)\*(?!\*)/g, '');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message } = await req.json();
    if (!message) throw new Error('Message is required');

    console.log('Received message:', message);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    const mistralApiKey = Deno.env.get('MISTRAL_API_KEY');

    if (!geminiApiKey && !mistralApiKey) {
      throw new Error('No AI API keys configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch college data and SyncSpot Q&A in parallel
    const [collegeResult, syncSpotResult] = await Promise.all([
      supabase.from('college_data').select('*').order('created_at', { ascending: false }),
      supabase.from('syncspot_questions').select('*, syncspot_answers (*)').order('created_at', { ascending: false })
    ]);

    if (collegeResult.error) {
      console.error('Database error:', collegeResult.error);
      throw new Error('Failed to fetch college data');
    }

    // Build context
    const context = collegeResult.data?.map((item: CollegeData) => {
      const tags = item.tags ? item.tags.join(', ') : '';
      let s = `Title: ${item.title}\nCategory: ${item.category}\nContent: ${item.content}\nTags: ${tags}`;
      if (item.parsed_content) s += `\nDocument Content: ${item.parsed_content}`;
      if (item.file_name) s += `\nAttached File: ${item.file_name} (${item.file_type || 'unknown'})`;
      return s + '\n---';
    }).join('\n\n') || '';

    const syncSpotContext = syncSpotResult.data?.map((q: any) => {
      if (q.syncspot_answers?.length > 0) {
        const answers = q.syncspot_answers.map((a: any) => `Answer: ${a.answer}`).join('\n');
        return `Community Q&A:\nQuestion: ${q.question}\n${answers}\n---`;
      }
      return '';
    }).filter(Boolean).join('\n\n') || '';

    const fullContext = [context, syncSpotContext].filter(Boolean).join('\n\n');
    const systemPrompt = buildSystemPrompt(fullContext);

    // Try Mistral first
    if (mistralApiKey) {
      try {
        console.log('Trying Mistral...');
        const resp = await fetch('https://api.mistral.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mistralApiKey}`
          },
          body: JSON.stringify({
            model: 'mistral-large-latest',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: message }
            ],
            temperature: 0.3,
            max_tokens: 500
          })
        });

        if (!resp.ok) {
          const errText = await resp.text();
          console.error('Mistral error:', resp.status, errText);
          throw new Error('Mistral failed');
        }

        const data = await resp.json();
        let text = data.choices?.[0]?.message?.content || '';

        if (!text) throw new Error('Empty Mistral response');

        text = cleanResponse(text);

        if (text.includes('SYNCSPOT_REDIRECT')) {
          await postToSyncSpot(req, supabaseUrl, supabaseKey, message);
          return makeSyncSpotResponse();
        }

        return new Response(JSON.stringify({ response: text, source: 'mistral' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (e) {
        console.error('Mistral failed, trying Gemini:', e);
      }
    }

    // Fallback: Gemini
    if (geminiApiKey) {
      console.log('Trying Gemini...');
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemPrompt}\n\nStudent Question: ${message}` }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 500 }
          })
        }
      );

      if (!resp.ok) {
        const errText = await resp.text();
        console.error('Gemini error:', resp.status, errText);
        throw new Error('All AI services failed');
      }

      const data = await resp.json();
      let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      if (!text) throw new Error('Empty Gemini response');

      text = cleanResponse(text);

      if (text.includes('SYNCSPOT_REDIRECT')) {
        await postToSyncSpot(req, supabaseUrl, supabaseKey, message);
        return makeSyncSpotResponse();
      }

      return new Response(JSON.stringify({ response: text, source: 'gemini' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('No AI API keys available');

  } catch (error) {
    console.error('Error in ai-chat:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({
      error: msg,
      response: "I'm having trouble right now. Please try again later."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
