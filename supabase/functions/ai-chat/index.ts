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
  return `You are Campus Buddy — a warm, friendly campus assistant that helps students find information about their college.

ABSOLUTE RULES — NEVER VIOLATE THESE:
1. You can ONLY answer using the "Available Campus Data" provided below. This is data uploaded by faculty members.
2. You have ZERO general knowledge. You know NOTHING except what is in the data below.
3. If the answer is NOT explicitly found in the data below, you MUST respond with exactly: SYNCSPOT_REDIRECT
4. NEVER guess, assume, infer, or provide information from your training data.
5. NEVER say things like "generally", "usually", "typically" — you only know what's in the data.
6. NEVER provide generic college information. You are NOT a general knowledge assistant.
7. If someone asks about something not covered in the data, respond with: SYNCSPOT_REDIRECT
8. Even if you "know" the answer from your training, DO NOT use it. Only use the data below.

PERSONALITY (only when you CAN answer from the data):
- Warm and friendly, like a helpful senior student
- Use 1-2 emojis per response max
- Keep answers concise (1-4 sentences)
- Use **bold** for key info (names, times, rooms)

SCOPE:
- Only answer college-related questions using the data below
- Non-college questions: "I'm only trained on campus data! Try me with a college question 😊"
- If data partially matches, share only what you have and say you don't have the rest

Available Campus Data:
${fullContext || 'No data available yet. Respond with SYNCSPOT_REDIRECT for any question.'}

Remember: If the answer is not in the data above, respond with SYNCSPOT_REDIRECT. No exceptions.`;
}

async function postToSyncSpot(req: Request, supabaseUrl: string, supabaseKey: string, message: string) {
  const authHeader = req.headers.get('authorization');
  console.log('postToSyncSpot called, authHeader present:', !!authHeader);
  try {
    let askedBy: string | null = null;
    let studentName: string | null = null;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const authedClient = createClient(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: authHeader } }
      });
      const { data: userData, error: userErr } = await authedClient.auth.getUser(token);
      if (userErr) console.error('getUser error:', userErr);
      if (userData?.user) {
        askedBy = userData.user.id;
        // Fetch profile name
        const { data: profile } = await authedClient
          .from('profiles')
          .select('full_name')
          .eq('user_id', userData.user.id)
          .maybeSingle();
        studentName = profile?.full_name || userData.user.email || null;
      }
    }

    // Use service role for the insert so it always succeeds regardless of RLS
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const insertClient = serviceKey
      ? createClient(supabaseUrl, serviceKey)
      : createClient(supabaseUrl, supabaseKey);

    const { data: inserted, error: insertErr } = await insertClient
      .from('syncspot_questions')
      .insert({
        question: message,
        asked_by: askedBy,
        student_name: studentName,
        status: 'pending'
      })
      .select()
      .single();

    if (insertErr) {
      console.error('SyncSpot insert error:', insertErr);
    } else {
      console.log('Question posted to SyncSpot:', inserted?.id);
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
      if (item.parsed_content) s += `\nDocument Content (OCR Extracted): ${item.parsed_content}`;
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

    // Use Gemini as primary (better at following strict instructions)
    if (geminiApiKey) {
      try {
        console.log('Using Gemini for chat...');
        const resp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `${systemPrompt}\n\nStudent Question: ${message}` }] }],
              generationConfig: { temperature: 0.1, maxOutputTokens: 500 }
            })
          }
        );

        if (!resp.ok) {
          const errText = await resp.text();
          console.error('Gemini error:', resp.status, errText);
          throw new Error('Gemini failed');
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
      } catch (e) {
        console.error('Gemini failed, trying Mistral:', e);
      }
    }

    // Fallback: Mistral
    if (mistralApiKey) {
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
          temperature: 0.1,
          max_tokens: 500
        })
      });

      if (!resp.ok) {
        const errText = await resp.text();
        console.error('Mistral error:', resp.status, errText);
        throw new Error('All AI services failed');
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
