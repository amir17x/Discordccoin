import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

// استفاده از API ساده و مستقیم با Gemini
class GeminiService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.apiUrl = 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent';
    
    console.log(`API Key initialization: ${this.apiKey ? 'OK' : 'FAILED'}`);
    if (this.apiKey) {
      console.log(`API Key length: ${this.apiKey.length}`);
      console.log(`API Key starts with: ${this.apiKey.substring(0, 5)}...`);
    }
  }
  
  async generateContent(prompt, maxTokens = 200, temperature = 0.7) {
    if (!this.apiKey) {
      throw new Error('API key is not set');
    }
    
    console.log(`Sending request to Gemini API: ${prompt.substring(0, 30)}...`);
    
    try {
      const response = await axios({
        method: 'post',
        url: `${this.apiUrl}?key=${this.apiKey}`,
        headers: {
          'Content-Type': 'application/json'
        },
        data: {
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: temperature,
            maxOutputTokens: maxTokens,
            topP: 0.8,
            topK: 40
          }
        }
      });
      
      console.log('Response received from Gemini API');
      
      if (response.data && response.data.candidates && response.data.candidates[0]) {
        const text = response.data.candidates[0].content.parts[0].text;
        return text;
      } else {
        console.error('Unexpected response structure:', JSON.stringify(response.data, null, 2));
        throw new Error('Unexpected response structure');
      }
    } catch (error) {
      console.error('Error in Gemini API request:');
      
      if (error.response) {
        console.error(`Status: ${error.response.status}`);
        console.error('Response data:', error.response.data);
        
        if (error.response.status === 400) {
          throw new Error('Bad request - check prompt structure');
        } else if (error.response.status === 401) {
          throw new Error('Authentication error - invalid API key');
        } else if (error.response.status === 429) {
          throw new Error('Rate limit exceeded');
        } else if (error.response.status >= 500) {
          throw new Error(`Server error (${error.response.status})`);
        }
      } else if (error.request) {
        console.error('No response received');
        throw new Error('No response received from API');
      }
      
      throw error;
    }
  }
  
  async testConnection() {
    try {
      const response = await this.generateContent('Hello, respond briefly: what is 1+1?', 10, 0.1);
      console.log('Connection test successful. Response:', response);
      return true;
    } catch (error) {
      console.error('Connection test failed:', error.message);
      return false;
    }
  }
}

// تست سرویس
async function testGeminiService() {
  // ابتدا با GOOGLE_AI_API_KEY امتحان می‌کنیم
  const googleKey = process.env.GOOGLE_AI_API_KEY;
  console.log('\n--- Testing with GOOGLE_AI_API_KEY ---');
  const service1 = new GeminiService(googleKey);
  const result1 = await service1.testConnection();
  
  // سپس با VORTEX_AI_API_KEY امتحان می‌کنیم
  const vortexKey = process.env.VORTEX_AI_API_KEY;
  console.log('\n--- Testing with VORTEX_AI_API_KEY ---');
  const service2 = new GeminiService(vortexKey);
  const result2 = await service2.testConnection();
  
  console.log('\n--- Test Results ---');
  console.log(`GOOGLE_AI_API_KEY test: ${result1 ? 'PASSED' : 'FAILED'}`);
  console.log(`VORTEX_AI_API_KEY test: ${result2 ? 'PASSED' : 'FAILED'}`);
  
  return result1 || result2;
}

// اجرای تست
console.log('Starting Gemini Alt Service test...');
testGeminiService()
  .then(success => console.log(`Test ${success ? 'succeeded' : 'failed'} overall`))
  .catch(error => console.error('Test error:', error.message));