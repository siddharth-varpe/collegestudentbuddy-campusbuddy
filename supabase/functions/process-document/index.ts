import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileUrl, fileName, fileType, recordId } = await req.json();
    
    if (!fileUrl || !fileName || !fileType || !recordId) {
      throw new Error('Missing required parameters');
    }

    console.log('Processing document:', { fileName, fileType, recordId });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const mistralApiKey = Deno.env.get('MISTRAL_API_KEY');
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    
    if (!mistralApiKey && !geminiApiKey) {
      console.log('No AI API keys configured, skipping OCR processing');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Document uploaded successfully. OCR processing not configured.',
        parsedLength: 0,
        aiProcessed: false
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract the file path from the public URL
    // The bucket is called "documents"
    const bucketName = 'documents';
    let filePath = '';
    
    // Try different URL patterns
    const patterns = [
      `/storage/v1/object/public/${bucketName}/`,
      `/storage/v1/object/public/college-documents/`,
    ];
    
    for (const pattern of patterns) {
      const idx = fileUrl.indexOf(pattern);
      if (idx !== -1) {
        filePath = fileUrl.substring(idx + pattern.length);
        break;
      }
    }
    
    if (!filePath) {
      // Fallback: take everything after the last bucket-like path
      const urlObj = new URL(fileUrl);
      const pathParts = urlObj.pathname.split('/');
      // Find 'public' in path and take everything after the bucket name
      const publicIdx = pathParts.indexOf('public');
      if (publicIdx !== -1 && publicIdx + 2 < pathParts.length) {
        filePath = pathParts.slice(publicIdx + 2).join('/');
      } else {
        throw new Error('Could not extract file path from URL: ' + fileUrl);
      }
    }

    console.log('Downloading file from bucket:', bucketName, 'path:', filePath);

    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from(bucketName)
      .download(filePath);
    
    if (downloadError || !fileData) {
      console.error('Download error:', downloadError);
      throw new Error('Failed to download file from storage: ' + (downloadError?.message || 'unknown'));
    }

    console.log('File downloaded successfully, size:', fileData.size, 'type:', fileType);

    let extractedText = '';

    // Handle plain text files directly
    if (fileType === 'text/plain') {
      extractedText = await fileData.text();
      console.log('Text file read directly, length:', extractedText.length);
    } else {
      // For all other files (PDF, Word, Excel, PPT, images), use AI OCR
      extractedText = await extractWithAI(fileData, fileType, fileName, mistralApiKey, geminiApiKey);
    }

    if (!extractedText || extractedText.length < 10) {
      console.warn('Extraction yielded minimal content');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Document uploaded but could not extract meaningful content.',
        parsedLength: extractedText?.length || 0,
        aiProcessed: false
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Limit to reasonable size
    extractedText = extractedText.slice(0, 50000);

    // Save parsed content to database
    const { error: updateError } = await supabase
      .from('college_data')
      .update({ parsed_content: extractedText })
      .eq('id', recordId);

    if (updateError) {
      console.error('Failed to update parsed content:', updateError);
      throw new Error('Failed to save OCR results');
    }

    console.log('Successfully saved parsed content, length:', extractedText.length);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Document processed successfully.',
      parsedLength: extractedText.length,
      aiProcessed: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in process-document function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function extractWithAI(
  fileData: Blob, 
  fileType: string, 
  fileName: string,
  mistralApiKey: string | undefined, 
  geminiApiKey: string | undefined
): Promise<string> {
  const base64Data = await blobToBase64(fileData);
  
  const extractionPrompt = `You are a document text extraction engine. Extract ALL text content from this document accurately.

RULES:
- Extract every piece of text visible in the document
- Preserve structure: headings, tables, lists, paragraphs
- For tables, use markdown table format
- For lists, use bullet points or numbered lists
- Include ALL names, dates, times, numbers, codes exactly as they appear
- Do NOT add any commentary, summary, or interpretation
- Do NOT skip any content
- Output ONLY the extracted text in clean markdown format`;

  // Try Gemini first for document processing (handles PDFs natively)
  if (geminiApiKey) {
    try {
      console.log('Trying Gemini for document extraction...');
      
      // Gemini can process PDFs and images directly
      const mimeType = fileType || 'application/octet-stream';
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: extractionPrompt },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Data,
                  },
                },
              ],
            }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 8000 }
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (text && text.length > 20) {
          console.log('Gemini extraction successful, length:', text.length);
          return text;
        }
        console.log('Gemini returned insufficient content, trying Mistral...');
      } else {
        const errText = await response.text();
        console.error('Gemini extraction error:', response.status, errText);
      }
    } catch (e) {
      console.error('Gemini extraction failed:', e);
    }
  }

  // Fallback to Mistral Pixtral for images
  if (mistralApiKey) {
    try {
      console.log('Trying Mistral for document extraction...');
      
      const isImage = fileType.startsWith('image/');
      const dataUrl = `data:${fileType};base64,${base64Data}`;
      
      const messages: any[] = [{
        role: 'user',
        content: isImage ? [
          { type: 'text', text: extractionPrompt },
          { type: 'image_url', image_url: { url: dataUrl } }
        ] : [
          { type: 'text', text: `${extractionPrompt}\n\nDocument filename: ${fileName}\nDocument type: ${fileType}\n\nPlease extract all text from this document.` },
          { type: 'image_url', image_url: { url: dataUrl } }
        ]
      }];

      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mistralApiKey}`
        },
        body: JSON.stringify({
          model: 'pixtral-12b-2409',
          messages,
          max_tokens: 8000
        })
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || '';
        if (text && text.length > 20) {
          console.log('Mistral extraction successful, length:', text.length);
          return text;
        }
      } else {
        const errText = await response.text();
        console.error('Mistral extraction error:', response.status, errText);
      }
    } catch (e) {
      console.error('Mistral extraction failed:', e);
    }
  }

  throw new Error('All AI extraction methods failed for this document');
}

// Convert blob to raw base64 string (without data URL prefix)
async function blobToBase64(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
