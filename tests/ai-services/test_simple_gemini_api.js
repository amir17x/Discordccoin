import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

// کلید API - استفاده از کلید جدید
const API_KEY = process.env.GOOGLE_AI_API_KEY;
console.log(`API Key length: ${API_KEY ? API_KEY.length : 0}`);
console.log(`API Key starts with: ${API_KEY ? API_KEY.substring(0, 5) + '...' : 'undefined'}`);

// آدرس API مخصوص کلیدهای API (استفاده از API ورژن پروداکشن)
const API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent';

async function testGeminiApi() {
  try {
    console.log('Sending simple request to Gemini API...');
    
    const response = await axios({
      method: 'post',
      url: `${API_URL}?key=${API_KEY}`,
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        contents: [
          {
            parts: [
              {
                text: "سلام! خودت را معرفی کن و به فارسی پاسخ بده."
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 200
        }
      }
    });
    
    console.log('Response received!');
    
    // بررسی ساختار پاسخ
    if (response.data && response.data.candidates && response.data.candidates.length > 0) {
      const text = response.data.candidates[0].content.parts[0].text;
      console.log('\nGenerated text:');
      console.log('----------------------------');
      console.log(text);
      console.log('----------------------------');
    } else {
      console.log('Unexpected response structure:', JSON.stringify(response.data, null, 2));
    }
    
  } catch (error) {
    console.error('Error calling Gemini API:');
    
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Response: ${JSON.stringify(error.response.data, null, 2)}`);
      
      if (error.response.status === 400) {
        console.error('Bad request - check your prompt structure');
      } else if (error.response.status === 401) {
        console.error('Authentication error - verify your API key');
      } else if (error.response.status === 403) {
        console.error('Access forbidden - API key may not have correct permissions');
      } else if (error.response.status === 429) {
        console.error('Too many requests - rate limit exceeded');
      } else if (error.response.status >= 500) {
        console.error('Server error - try again later');
      }
    } else if (error.request) {
      console.error('No response received:', error.message);
    } else {
      console.error('Error setting up request:', error.message);
    }
  }
}

// اجرای تست
console.log('Starting Gemini API test with simple REST call...');
testGeminiApi();