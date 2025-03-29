/**
 * اسکریپت تست سرویس Gemini (جایگزین OpenAI)
 */

import 'dotenv/config';
import geminiAltService from './server/discord/services/geminiAltService.js';

async function testGeminiAlt() {
  // خروجی کلید API
  console.log('API Key status:', process.env.GOOGLE_AI_API_KEY ? 'Available' : 'Not available');

  // تست اتصال
  console.log('\n--- Testing Connection ---');
  try {
    const connectionResult = await geminiAltService.testConnection();
    console.log('Connection test:', connectionResult ? 'Success' : 'Failed');
  } catch (error) {
    console.error('Connection error:', error.message);
    // بررسی عدم وجود API Key
    if (error.message.includes('API key')) {
      console.error('\nERROR: Google AI API key is missing. Please add GOOGLE_AI_API_KEY to your .env file');
      return;
    }
  }

  // تست تولید محتوا
  console.log('\n--- Testing Content Generation ---');
  try {
    // پرامپت ساده برای تست
    const prompt = 'سلام، لطفاً خودت را معرفی کن.';
    
    console.log('Prompt:', prompt);
    console.log('Generating response...');
    
    const start = Date.now();
    const response = await geminiAltService.generateContent(prompt, 100, 0.7);
    const duration = Date.now() - start;
    
    console.log('\nResponse:');
    console.log(response);
    console.log(`\nGeneration time: ${duration}ms`);
  } catch (error) {
    console.error('Generation error:', error.message);
  }
}

// اجرای تست
testGeminiAlt().catch(console.error);