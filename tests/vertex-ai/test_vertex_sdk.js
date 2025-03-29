import dotenv from 'dotenv';
import fs from 'fs';
import { VertexAI } from '@google-cloud/vertexai';

dotenv.config();

// بررسی وجود API key
const API_KEY = process.env.VORTEX_AI_API_KEY;
console.log(`API Key length: ${API_KEY ? API_KEY.length : 0}`);
console.log(`API Key starts with: ${API_KEY ? API_KEY.substring(0, 5) + '...' : 'undefined'}`);

// تنظیمات Vertex AI
const PROJECT_ID = 'your-project-id'; // نیاز به شناسه پروژه Google Cloud دارد
const LOCATION = 'us-central1';

// تنظیم اعتبارنامه‌ها 
function setupCredentials() {
  try {
    // ساخت فایل اعتبارنامه موقت برای تست
    const credentials = {
      "type": "service_account",
      "project_id": PROJECT_ID,
      "private_key_id": "temp_key_id",
      "private_key": API_KEY,
      "client_email": "temp-service@example.com",
      "client_id": "123456789",
      "auth_uri": "https://accounts.google.com/o/oauth2/auth",
      "token_uri": "https://oauth2.googleapis.com/token",
      "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
      "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/temp-service%40example.com"
    };
    
    fs.writeFileSync('temp-credentials.json', JSON.stringify(credentials, null, 2));
    console.log('Created temporary credentials file for testing');
    process.env.GOOGLE_APPLICATION_CREDENTIALS = './temp-credentials.json';
  } catch (error) {
    console.error('Error creating credentials file:', error);
  }
}

async function testVertexAI() {
  try {
    // راه‌اندازی کلاینت Vertex AI
    console.log('Initializing Vertex AI client...');
    const vertexAI = new VertexAI({
      project: PROJECT_ID,
      location: LOCATION,
    });
    
    // دسترسی به مدل Gemini Pro
    const generativeModel = vertexAI.preview.getGenerativeModel({
      model: 'gemini-pro',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 200,
        topP: 0.8,
        topK: 40,
      },
    });
    
    console.log('Sending request to Vertex AI...');
    
    // ارسال متن ورودی
    const prompt = "سلام! خودت را معرفی کن و به فارسی پاسخ بده.";
    
    const result = await generativeModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    
    console.log('Response received!');
    console.log(JSON.stringify(result.response, null, 2));
    
    // نمایش پاسخ
    const responseText = result.response.candidates[0].content.parts[0].text;
    console.log('\nGenerated text:');
    console.log('----------------------------');
    console.log(responseText);
    console.log('----------------------------');
    
    return true;
  } catch (error) {
    console.error('Error with Vertex AI:');
    console.error(error);
    return false;
  } finally {
    // حذف فایل اعتبارنامه موقت
    try {
      if (fs.existsSync('temp-credentials.json')) {
        fs.unlinkSync('temp-credentials.json');
        console.log('Removed temporary credentials file');
      }
    } catch (e) {
      console.error('Error cleaning up:', e);
    }
  }
}

// اجرای تست
console.log('Starting Vertex AI SDK test...');
setupCredentials();
testVertexAI();