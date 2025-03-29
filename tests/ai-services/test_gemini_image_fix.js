// تست سرویس Gemini SDK با تصویر

import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

// کلید API
const API_KEY = process.env.GOOGLE_AI_API_KEY;

// کمک‌کننده برای تبدیل فایل تصویر به base64
function fileToGenerativePart(path, mimeType) {
  const fileContent = fs.readFileSync(path);
  return {
    inlineData: {
      data: Buffer.from(fileContent).toString('base64'),
      mimeType
    }
  };
}

async function testGeminiWithImage() {
  try {
    console.log('Starting Gemini SDK test with image...');

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

    // نمونه تصویر - بررسی کنید مسیر درست باشد
    const imagePath = 'attached_assets/image_1743256366800.png'; 
    
    // بررسی وجود فایل
    if (!fs.existsSync(imagePath)) {
      console.error(`Image file not found at ${imagePath}`);
      return;
    }

    console.log(`Using image from ${imagePath}`);
    const imagePart = fileToGenerativePart(imagePath, 'image/png');

    // تست تولید محتوا با تصویر با فرمت جدید
    console.log('Testing content generation with image using new format...');
    
    // مطابق با ساختار اصلاح شده
    const result = await model.generateContent(
      [
        { text: 'توضیح بده این تصویر چیست؟' },
        imagePart
      ],
      {
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
          topP: 0.8,
          topK: 40
        }
      }
    );

    const response = await result.response;
    const text = response.text();

    console.log('Response received:');
    console.log('----------------------------');
    console.log(text);
    console.log('----------------------------');
    console.log('Test completed successfully!');

  } catch (error) {
    console.error('Error in Gemini SDK test with image:', error);
  }
}

// اجرای تست
testGeminiWithImage();