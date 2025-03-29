import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Failed to connect to MongoDB:', err));

// Create a simple User model with aiAssistant field
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

// This function simulates the getUserAIAssistantDetails in storage.ts
async function getUserAIAssistantDetails(userId) {
  try {
    console.log("Input userId type:", typeof userId, "value:", userId);
    
    // Handle different ID formats
    let objectId;
    if (userId instanceof ObjectId) {
      objectId = userId;
    } else if (typeof userId === 'string' && ObjectId.isValid(userId)) {
      objectId = new ObjectId(userId);
    } else {
      objectId = userId; // Use whatever was provided
    }
    
    console.log("Converted to objectId type:", typeof objectId, "value:", objectId);
    
    const user = await User.findOne({ _id: objectId });
    if (!user) {
      console.log("User not found");
      return null;
    }
    
    console.log("User found:", user.username);
    return user.aiAssistant;
  } catch (error) {
    console.error("Error in getUserAIAssistantDetails:", error);
    return null;
  }
}

// This function simulates the updateAIAssistantSubscription in storage.ts
async function updateAIAssistantSubscription(userId, tier, duration) {
  try {
    console.log("Input userId type:", typeof userId, "value:", userId);
    
    // Handle different ID formats
    let objectId;
    if (userId instanceof ObjectId) {
      objectId = userId;
    } else if (typeof userId === 'string' && ObjectId.isValid(userId)) {
      objectId = new ObjectId(userId);
    } else {
      objectId = userId; // Use whatever was provided
    }
    
    console.log("Converted to objectId type:", typeof objectId, "value:", objectId);
    
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
    
    console.log("Update result:", result);
    return result.modifiedCount > 0;
  } catch (error) {
    console.error("Error in updateAIAssistantSubscription:", error);
    return false;
  }
}

// Find a user to test with
async function runTests() {
  try {
    // Find an existing user
    let user = await User.findOne({});
    
    if (!user) {
      // Create a test user if none exists
      user = new User({
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
      console.log("Created test user");
    }
    
    console.log("Test user:", user);
    
    // Test with ObjectId
    console.log("\n--- Testing with ObjectId ---");
    const detailsWithObjectId = await getUserAIAssistantDetails(user._id);
    console.log("AI details with ObjectId:", detailsWithObjectId);
    
    // Test with String ID
    console.log("\n--- Testing with String ID ---");
    const detailsWithStringId = await getUserAIAssistantDetails(user._id.toString());
    console.log("AI details with String ID:", detailsWithStringId);
    
    // Test with invalid ID
    console.log("\n--- Testing with invalid ID ---");
    try {
      const detailsWithInvalidId = await getUserAIAssistantDetails('invalid-id');
      console.log("AI details with invalid ID:", detailsWithInvalidId);
    } catch (error) {
      console.log("Error handled gracefully for invalid ID");
    }
    
    // Test updating subscription with ObjectId
    console.log("\n--- Updating subscription with ObjectId ---");
    const updateWithObjectId = await updateAIAssistantSubscription(
      user._id,
      'premium',
      7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
    );
    console.log("Update with ObjectId result:", updateWithObjectId);
    
    // Test updating subscription with String ID
    console.log("\n--- Updating subscription with String ID ---");
    const updateWithStringId = await updateAIAssistantSubscription(
      user._id.toString(),
      'deluxe',
      30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds
    );
    console.log("Update with String ID result:", updateWithStringId);
    
    // Verify final state
    console.log("\n--- Final state ---");
    const finalDetails = await getUserAIAssistantDetails(user._id);
    console.log("Final AI details:", finalDetails);
    
  } catch (error) {
    console.error("Error running tests:", error);
  } finally {
    // Close the MongoDB connection
    mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

// Run the tests
runTests();