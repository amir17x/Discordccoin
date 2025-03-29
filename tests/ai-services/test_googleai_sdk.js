import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

// کلید API
const API_KEY = process.env.GOOGLE_AI_API_KEY;
console.log(`API Key length: ${API_KEY ? API_KEY.length : 0}`);
console.log(`API Key starts with: ${API_KEY ? API_KEY.substring(0, 5) + '...' : 'undefined'}`);

// تنظیمات API
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';

async function testGoogleAI() {
  try {
    console.log('Sending request to Gemini API...');
    
    const response = await axios.post(
      `${API_URL}?key=${API_KEY}`,
      {
        contents: [{
          parts: [{ text: "سلام! خودت را معرفی کن و به فارسی پاسخ بده." }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 200
        }
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    console.log('Response received!');
    if (response.data && response.data.candidates && response.data.candidates[0]) {
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
      // خطای سمت سرور
      console.error(`Status: ${error.response.status}`);
      console.error('Response data:', error.response.data);
      
      // بررسی خطاهای خاص
      if (error.response.status === 400) {
        console.error('Bad request - check your prompt and parameters');
      } else if (error.response.status === 401) {
        console.error('Authentication error - check your API key');
      } else if (error.response.status === 429) {
        console.error('Quota exceeded - you have reached your API limits');
      } else if (error.response.status >= 500) {
        console.error('Server error - try again later');
      }
    } else if (error.request) {
      // عدم دریافت پاسخ
      console.error('No response received:', error.message);
    } else {
      // خطای دیگر
      console.error('Error:', error.message);
    }
  }
}

// اجرای تست
console.log('Starting Google AI SDK test...');
testGoogleAI();