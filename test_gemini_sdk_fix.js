// تست سرویس Gemini SDK با استفاده از فرمت صحیح درخواست

import { GoogleGenerativeAI } from '@google/generative-ai';

// کلید API
const API_KEY = process.env.GOOGLE_AI_API_KEY;

async function testGeminiSDK() {
  try {
    console.log('Starting Gemini SDK test...');

    if (!API_KEY) {
      console.error('API key is not set. Please set GOOGLE_AI_API_KEY environment variable.');
      return;
    }

    // ایجاد نمونه از GoogleGenerativeAI
    const genAI = new GoogleGenerativeAI(API_KEY);
    console.log('Initialized GoogleGenerativeAI instance.');

    // انتخاب مدل
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    console.log('Selected gemini-1.5-pro model.');

    // تست ساده تولید متن با فرمت جدید
    console.log('Testing text generation with new format...');
    const result = await model.generateContent('سلام! به من بگو امروز چه روزی است؟', {
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 100,
        topP: 0.8,
        topK: 40
      }
    });

    const response = await result.response;
    const text = response.text();

    console.log('Response received:');
    console.log('----------------------------');
    console.log(text);
    console.log('----------------------------');
    console.log('Test completed successfully!');

  } catch (error) {
    console.error('Error in Gemini SDK test:', error);
  }
}

// اجرای تست
testGeminiSDK();