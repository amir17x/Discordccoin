import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config({
  path: './.env'
});

// نمایش محتوای API_KEY
const API_KEY = process.env.VORTEX_AI_API_KEY || process.env.GOOGLE_AI_API_KEY;
console.log("Available env vars:", Object.keys(process.env).filter(k => k.includes('KEY') || k.includes('AI')).join(', '));
console.log(`API Key length: ${API_KEY ? API_KEY.length : 0}`);
console.log(`API Key starts with: ${API_KEY ? API_KEY.substring(0, 5) + '...' : 'undefined'}`);

// URL ها و پارامترهای Gemini API
const MODEL_NAME = 'gemini-1.5-pro';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;
const PING_URL = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

async function pingGeminiApi() {
  console.log('\n--- Testing ping to Gemini API ---');
  try {
    const startTime = Date.now();
    const response = await axios.get(PING_URL);
    const latency = Date.now() - startTime;
    
    console.log(`Ping successful! Status: ${response.status}`);
    console.log(`Response time: ${latency}ms`);
    console.log('Model info:', response.data);
    return true;
  } catch (error) {
    console.error('Error pinging Gemini API:', error.message);
    if (axios.isAxiosError(error) && error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

async function sendPromptToGemini() {
  console.log('\n--- Testing content generation with Gemini API ---');
  try {
    const requestData = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: "سلام! خودت را معرفی کن. به فارسی پاسخ بده."
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 200,
        topP: 0.9
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    };
    
    console.log('Sending request to Gemini API...');
    const startTime = Date.now();
    const response = await axios.post(GEMINI_URL, requestData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const latency = Date.now() - startTime;
    
    const data = response.data;
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'پاسخی دریافت نشد.';
    
    console.log(`Response time: ${latency}ms`);
    console.log('\nGenerated text:');
    console.log('----------------------------');
    console.log(generatedText);
    console.log('----------------------------');
    return true;
  } catch (error) {
    console.error('Error generating content with Gemini API:', error.message);
    if (axios.isAxiosError(error) && error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

// اجرای آزمون‌ها
async function runTests() {
  console.log('Starting Gemini API tests...');
  
  if (!API_KEY) {
    console.error('No API key found! Set VORTEX_AI_API_KEY or GOOGLE_AI_API_KEY in .env file.');
    process.exit(1);
  }
  
  // تست پینگ
  const pingSuccess = await pingGeminiApi();
  
  // تست تولید محتوا
  if (pingSuccess) {
    const generationSuccess = await sendPromptToGemini();
    if (generationSuccess) {
      console.log('\nAll tests passed successfully!');
      process.exit(0);
    } else {
      console.error('\nContent generation test failed.');
      process.exit(1);
    }
  } else {
    console.error('\nPing test failed. Cannot continue.');
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('Unexpected error in tests:', error);
  process.exit(1);
});