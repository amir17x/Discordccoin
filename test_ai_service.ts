// Test script for measuring AI service response time
import { config } from 'dotenv';
config();

// Import services
import { pingCurrentAIService, testAIService } from './server/discord/services/aiService';

async function runTest() {
  console.log('Testing AI service ping...');
  
  try {
    const pingTime = await pingCurrentAIService();
    console.log(`AI service ping time: ${pingTime}ms`);
    
    // Also test the full response generation
    console.log('\nTesting AI response generation...');
    const testResult = await testAIService('What is the current time in Farsi?');
    
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