import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';

dotenv.config();

// Simplified User model for testing purposes
const userSchema = new mongoose.Schema({
  discordId: String,
  username: String,
  displayName: String,
  wallet: Number,
  bank: Number,
  crystals: Number,
  aiAssistant: {
    subscription: { type: Boolean, default: false },
    subscriptionTier: { type: String, default: 'free' },
    subscriptionExpires: { type: Date, default: null },
    questionsRemaining: { type: Number, default: 5 },
    totalQuestions: { type: Number, default: 5 }
  }
});

const User = mongoose.model('User', userSchema);

// Simulated storage functions that mimic the actual storage.ts functions
const storage = {
  // Function with our string ID to ObjectId conversion fix
  getUserAIAssistantDetails: async (userId) => {
    let objectId;
    
    // Handle different ID formats
    try {
      if (userId instanceof ObjectId) {
        objectId = userId;
      } else if (typeof userId === 'string' && ObjectId.isValid(userId)) {
        objectId = new ObjectId(userId);
      } else {
        objectId = userId; // Fallback to whatever was provided
      }
      
      console.log('Using ID type:', typeof objectId, 'with value:', objectId);
      
      const user = await User.findOne({ _id: objectId });
      if (!user) {
        console.log('User not found with ID:', objectId);
        return null;
      }
      
      return user.aiAssistant;
    } catch (error) {
      console.error('Error in getUserAIAssistantDetails:', error);
      return null;
    }
  },
  
  // Function that simulates updating subscription status
  updateAIAssistantSubscription: async (userId, tier, duration) => {
    let objectId;
    
    // Handle different ID formats
    try {
      if (userId instanceof ObjectId) {
        objectId = userId;
      } else if (typeof userId === 'string' && ObjectId.isValid(userId)) {
        objectId = new ObjectId(userId);
      } else {
        objectId = userId; // Fallback to whatever was provided
      }
      
      console.log('Using ID type:', typeof objectId, 'with value:', objectId);
      
      const expiresDate = new Date(Date.now() + duration);
      
      const result = await User.updateOne(
        { _id: objectId },
        { 
          $set: { 
            'aiAssistant.subscription': true,
            'aiAssistant.subscriptionTier': tier,
            'aiAssistant.subscriptionExpires': expiresDate
          }
        }
      );
      
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error in updateAIAssistantSubscription:', error);
      return false;
    }
  },
  
  // Function to decrement remaining questions
  useAIAssistantQuestion: async (userId) => {
    let objectId;
    
    // Handle different ID formats
    try {
      if (userId instanceof ObjectId) {
        objectId = userId;
      } else if (typeof userId === 'string' && ObjectId.isValid(userId)) {
        objectId = new ObjectId(userId);
      } else {
        objectId = userId; // Fallback to whatever was provided
      }
      
      console.log('Using ID type:', typeof objectId, 'with value:', objectId);
      
      // First check if the user has an active subscription
      const user = await User.findOne({ _id: objectId });
      if (!user) {
        console.log('User not found with ID:', objectId);
        return false;
      }
      
      // If user has an active subscription, don't decrement questions
      if (user.aiAssistant.subscription && 
          user.aiAssistant.subscriptionExpires && 
          user.aiAssistant.subscriptionExpires > new Date()) {
        console.log('User has active subscription - not decrementing questions');
        return true;
      }
      
      // Otherwise decrement remaining questions
      if (user.aiAssistant.questionsRemaining <= 0) {
        console.log('User has no remaining questions');
        return false;
      }
      
      const result = await User.updateOne(
        { _id: objectId },
        { $inc: { 'aiAssistant.questionsRemaining': -1 } }
      );
      
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error in useAIAssistantQuestion:', error);
      return false;
    }
  },
  
  resetAIAssistantQuestions: async (userId) => {
    let objectId;
    
    // Handle different ID formats
    try {
      if (userId instanceof ObjectId) {
        objectId = userId;
      } else if (typeof userId === 'string' && ObjectId.isValid(userId)) {
        objectId = new ObjectId(userId);
      } else {
        objectId = userId; // Fallback to whatever was provided
      }
      
      const result = await User.updateOne(
        { _id: objectId },
        { 
          $set: { 
            'aiAssistant.questionsRemaining': 5,
            'aiAssistant.subscription': false,
            'aiAssistant.subscriptionTier': 'free',
            'aiAssistant.subscriptionExpires': null
          }
        }
      );
      
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error in resetAIAssistantQuestions:', error);
      return false;
    }
  }
};

// Test functions
async function runTests() {
  // Find a test user
  const testUser = await User.findOne({});
  
  if (!testUser) {
    console.log('No test user found. Creating one...');
    
    // Create a test user
    const user = new User({
      discordId: '123456789012345678',
      username: 'TestUser',
      displayName: 'Test User',
      wallet: 1000,
      bank: 500,
      crystals: 100,
      aiAssistant: {
        subscription: false,
        subscriptionTier: 'free',
        subscriptionExpires: null,
        questionsRemaining: 5,
        totalQuestions: 5
      }
    });
    
    await user.save();
    console.log('Created test user with ID:', user._id);
    testUser = user;
  }
  
  console.log('Using test user:', testUser.username, 'with ID:', testUser._id);
  
  // Test with different ID formats
  console.log('\n=== Testing with Different ID Formats ===');
  
  // Test with ObjectId
  console.log('\nTesting with ObjectId');
  let details = await storage.getUserAIAssistantDetails(testUser._id);
  console.log('AI details with ObjectId:', details);
  
  // Test with String ID
  console.log('\nTesting with String ID');
  details = await storage.getUserAIAssistantDetails(testUser._id.toString());
  console.log('AI details with String ID:', details);
  
  // Test with invalid ID (should handle gracefully)
  console.log('\nTesting with invalid ID');
  try {
    details = await storage.getUserAIAssistantDetails('invalid-id');
    console.log('AI details with invalid ID:', details);
  } catch (error) {
    console.log('Error with invalid ID - gracefully handled');
  }
  
  // Test subscription update
  console.log('\n=== Testing Subscription Update ===');
  
  // With ObjectId
  console.log('\nUpdating subscription with ObjectId');
  let success = await storage.updateAIAssistantSubscription(
    testUser._id, 
    'weekly', 
    7 * 24 * 60 * 60 * 1000
  );
  console.log('Update result:', success ? 'Successful' : 'Failed');
  
  // Verify update
  details = await storage.getUserAIAssistantDetails(testUser._id);
  console.log('AI details after update:', details);
  
  // With String ID
  console.log('\nUpdating subscription with String ID');
  success = await storage.updateAIAssistantSubscription(
    testUser._id.toString(), 
    'monthly', 
    30 * 24 * 60 * 60 * 1000
  );
  console.log('Update result:', success ? 'Successful' : 'Failed');
  
  // Verify update
  details = await storage.getUserAIAssistantDetails(testUser._id);
  console.log('AI details after update with String ID:', details);
  
  // Test using a question
  console.log('\n=== Testing Using a Question ===');
  
  // First disable subscription to test question decrementing
  await storage.resetAIAssistantQuestions(testUser._id);
  
  // With ObjectId
  console.log('\nUsing a question with ObjectId');
  success = await storage.useAIAssistantQuestion(testUser._id);
  console.log('Question used with ObjectId:', success ? 'Successful' : 'Failed');
  
  // Verify questions remaining
  details = await storage.getUserAIAssistantDetails(testUser._id);
  console.log('Questions remaining after use:', details.questionsRemaining);
  
  // With String ID
  console.log('\nUsing a question with String ID');
  success = await storage.useAIAssistantQuestion(testUser._id.toString());
  console.log('Question used with String ID:', success ? 'Successful' : 'Failed');
  
  // Verify questions remaining
  details = await storage.getUserAIAssistantDetails(testUser._id);
  console.log('Questions remaining after use with String ID:', details.questionsRemaining);
  
  // Reset for next tests
  await storage.resetAIAssistantQuestions(testUser._id);
  console.log('\nReset AI assistant settings');
  
  // Verify reset
  details = await storage.getUserAIAssistantDetails(testUser._id);
  console.log('Final AI details:', details);
}

// Connect to MongoDB and run tests
async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB with Mongoose');
    
    await runTests();
    
    // Cleanup
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error running tests:', error);
  }
}

// Run the main function
main();