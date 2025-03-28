import { huggingFaceService } from './discord/services/huggingface';

async function testHuggingFace() {
  try {
    const status = await huggingFaceService.checkConnectionStatus();
    console.log('Connection status:', status);
    
    if (status.isAvailable) {
      const response = await huggingFaceService.getAIResponse('سلام، حالت چطوره؟');
      console.log('AI Response:', response);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testHuggingFace();