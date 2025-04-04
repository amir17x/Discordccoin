// Test script for measuring AI service response time
import 'dotenv/config';
import path from 'path';

// Import services
import { pingCurrentAIService, testAIService } from './server/discord/services/aiService.js';

async function runTest() {
  console.log('Testing AI service ping...');
  const pingStart = Date.now();
  
  try {
    const pingTime = await pingCurrentAIService();
    console.log(`AI service ping time: ${pingTime}ms`);
    
    // Also test the full response generation
    console.log('\nTesting AI response generation...');
    const testStart = Date.now();
    const testResult = await testAIService('Write a very short greeting');
    
    if (testResult.success) {
      console.log(`AI response generated in ${testResult.latency}ms`);
      console.log(`Response: "${testResult.response}"`);
    } else {
      console.error(`Error testing AI service: ${testResult.error}`);
    }
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Run the test
runTest();