import pkg from '@google/genai';
const { GoogleGenerativeAI } = pkg;
import dotenv from 'dotenv';
dotenv.config();

// API key
const API_KEY = process.env.GOOGLE_AI_API_KEY;
console.log(`API Key length: ${API_KEY ? API_KEY.length : 0}`);
console.log(`API Key starts with: ${API_KEY ? API_KEY.substring(0, 5) + '...' : 'undefined'}`);

// Initialize the Google Generative AI
const genAI = new GoogleGenerativeAI(API_KEY);

async function run() {
  try {
    console.log("Testing Google GenerativeAI SDK with CommonJS...");
    
    // For text-only input, use the gemini-pro model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    console.log("Sending prompt to Gemini...");
    
    const prompt = "سلام! خودت را معرفی کن و به فارسی پاسخ بده.";
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('\nGenerated text:');
    console.log('----------------------------');
    console.log(text);
    console.log('----------------------------');
    
    return true;
  } catch (error) {
    console.error("Error in Google GenerativeAI:");
    console.error(error);
    
    if (error.message.includes("401")) {
      console.error("Authentication error - check your API key");
    } else if (error.message.includes("429")) {
      console.error("Rate limit exceeded - slow down your requests");
    } else if (error.message.includes("500")) {
      console.error("Server error - try again later");
    }
    
    return false;
  }
}

// Run the test
console.log("Starting test with Google GenerativeAI SDK (CommonJS)...");
run().then(success => {
  console.log(`Test ${success ? "succeeded" : "failed"}`);
});