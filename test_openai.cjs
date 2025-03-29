/**
 * اسکریپت تست سرویس OpenAI - با فرمت CommonJS
 */

require('dotenv').config();
const OpenAI = require('openai');

async function testOpenAI() {
  // بررسی وجود کلید API
  console.log('API Key status:', process.env.OPENAI_API_KEY ? 'Available' : 'Not available');
  
  try {
    // ایجاد نمونه از کلاینت OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    console.log('Successfully created OpenAI client');
    console.log('Testing connection...');
    
    // تست اتصال با یک درخواست ساده
    const result = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Hello, how are you?" }
      ],
      max_tokens: 5 // تنها 5 توکن درخواست می‌کنیم تا اعتبار کمتری مصرف شود
    });
    
    console.log('OpenAI API response received');
    console.log('Response content (truncated):', result.choices[0]?.message?.content || 'No content');
    console.log('API connection test: SUCCESSFUL');
    
  } catch (error) {
    console.error('Error testing OpenAI API:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Message: ${error.response.data?.error?.message || 'Unknown error'}`);
      
      // بررسی انواع خطاهای رایج
      if (error.response.status === 401) {
        console.error('This is likely due to an invalid API key');
      } else if (error.response.status === 429) {
        console.error('This is due to rate limiting or quota limits - your account might be out of credits');
      } else if (error.response.status === 404) {
        console.error('The requested resource was not found');
      } else if (error.response.status >= 500) {
        console.error('This is an issue with OpenAI servers');
      }
    } else {
      console.error(`Error: ${error.message}`);
      if (error.message.includes('net::ERR_INTERNET_DISCONNECTED') || 
          error.message.includes('connect ETIMEDOUT') || 
          error.message.includes('connect ECONNREFUSED')) {
        console.error('This appears to be a network or connection issue');
      }
    }
  }
}

// اجرای تست
testOpenAI().catch(err => {
  console.error('Unexpected error:', err);
});