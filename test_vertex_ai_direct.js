import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

// کلید API Vertex AI
const API_KEY = process.env.VORTEX_AI_API_KEY;
console.log(`API Key length: ${API_KEY ? API_KEY.length : 0}`);
console.log(`API Key starts with: ${API_KEY ? API_KEY.substring(0, 5) + '...' : 'undefined'}`);

// تنظیمات Vertex AI
const PROJECT_ID = 'your-project-id'; // نیاز به شناسه پروژه Google Cloud دارد
const LOCATION = 'us-central1';
const MODEL_ID = 'gemini-pro';
const VERTEX_API_URL = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL_ID}:predict`;

async function testVertexAI() {
  try {
    console.log('Sending request to Vertex AI...');
    
    const response = await axios({
      method: 'post',
      url: VERTEX_API_URL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      data: {
        instances: [
          {
            content: "سلام! خودت را معرفی کن و به فارسی پاسخ بده."
          }
        ],
        parameters: {
          temperature: 0.7,
          maxOutputTokens: 200,
          topK: 40,
          topP: 0.8
        }
      }
    });
    
    console.log('Response received!');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('Error calling Vertex AI:');
    
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response data:', error.response.data);
      
      if (error.response.status === 400) {
        console.error('Bad request - check your prompt and parameters');
      } else if (error.response.status === 401) {
        console.error('Authentication error - check your API key');
      } else if (error.response.status === 403) {
        console.error('Access forbidden - API key may not have correct permissions');
      } else if (error.response.status === 404) {
        console.error('Resource not found - check project ID, location, and model ID');
      } else if (error.response.status === 429) {
        console.error('Quota exceeded - you have reached your API limits');
      } else if (error.response.status >= 500) {
        console.error('Server error - try again later');
      }
    } else if (error.request) {
      console.error('No response received:', error.message);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// اجرای تست
console.log('Starting Vertex AI test...');
testVertexAI();