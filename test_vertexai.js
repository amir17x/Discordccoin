import dotenv from 'dotenv';
import { VertexAI } from '@google-cloud/vertexai';
import fs from 'fs';

dotenv.config();

// نمایش محتوای API_KEY
const API_KEY = process.env.VORTEX_AI_API_KEY;
console.log(`API Key length: ${API_KEY ? API_KEY.length : 0}`);
console.log(`API Key starts with: ${API_KEY ? API_KEY.substring(0, 5) + '...' : 'undefined'}`);

// تنظیم GOOGLE_APPLICATION_CREDENTIALS به مسیر فایل اعتبارنامه اگر وجود داشته باشد
const credPath = './google-credentials.json';
console.log(`Using credentials path: ${credPath}`);

// ایجاد فایل موقت اعتبارنامه با استفاده از API_KEY
function setupCredentials() {
  if (!API_KEY) {
    console.error('No VORTEX_AI_API_KEY found in environment variables');
    return false;
  }

  try {
    // ایجاد فایل اعتبارنامه ساده با API_KEY
    const credentials = {
      "type": "service_account",
      "private_key": API_KEY.replace(/\\n/g, '\n'),
      "client_email": "vertexai-test@test-project.iam.gserviceaccount.com",
      "token_uri": "https://oauth2.googleapis.com/token",
      "project_id": "test-project"
    };
    
    fs.writeFileSync(credPath, JSON.stringify(credentials, null, 2));
    console.log('Credentials file created successfully');
    
    // تنظیم متغیر محیطی برای استفاده از این فایل
    process.env.GOOGLE_APPLICATION_CREDENTIALS = credPath;
    return true;
  } catch (error) {
    console.error('Error creating credentials file:', error);
    return false;
  }
}

// تست ارتباط با Vertex AI
async function testVertexAI() {
  console.log('Starting Vertex AI test...');
  
  if (!setupCredentials()) {
    console.error('Failed to setup credentials');
    return;
  }
  
  try {
    // تعریف Vertex AI با تنظیمات
    const vertexai = new VertexAI({
      project: 'test-project',
      location: 'us-central1',
    });
    
    console.log('Vertex AI client created');
    
    // استفاده از مدل generative
    const generativeModel = vertexai.getGenerativeModel({
      model: 'gemini-1.5-pro',
    });
    
    console.log('Attempting to generate content...');
    
    // تلاش برای تولید محتوا
    const result = await generativeModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: 'سلام، حالت چطوره؟' }] }]
    });
    
    console.log('Content generation successful:', result.response.candidates[0].content.parts[0].text);
    
    console.log('Testing token counting...');
    
    // تست شمارش توکن
    const tokenResult = await generativeModel.countTokens({
      contents: [{ role: 'user', parts: [{ text: 'سلام، حالت چطوره؟' }] }]
    });
    
    console.log('Token count successful:', tokenResult);
    
    return true;
  } catch (error) {
    console.error('Error testing Vertex AI:', error);
    return false;
  } finally {
    // پاکسازی فایل موقت
    try {
      if (fs.existsSync(credPath)) {
        fs.unlinkSync(credPath);
        console.log('Temporary credentials file removed');
      }
    } catch (cleanupError) {
      console.error('Error cleaning up:', cleanupError);
    }
  }
}

// اجرای تست
testVertexAI()
  .then(result => {
    console.log(`Test ${result ? 'PASSED' : 'FAILED'}`);
    process.exit(result ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });