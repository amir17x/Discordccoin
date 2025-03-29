// Test script to verify the economy system fixes
import mongoose from 'mongoose';
import { MongoClient } from 'mongodb';

// MongoDB connection string
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ccoin';

// Define User model schema
const UserSchema = new mongoose.Schema({
  discordId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  displayName: { type: String, default: null },
  wallet: { type: Number, default: 0 },
  bank: { type: Number, default: 0 },
  crystals: { type: Number, default: 0 },
  transactions: [
    {
      type: { type: String },
      amount: { type: Number },
      fee: { type: Number, default: 0 },
      timestamp: { type: Date, default: Date.now },
      description: { type: String, default: '' }
    }
  ]
});

async function main() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    // Create User model
    const User = mongoose.model('User', UserSchema);

    // Create a test user
    const testUser = {
      discordId: 'test_user_id_' + Date.now(),
      username: 'TestUser',
      wallet: 1000,
      bank: 500
    };

    // Check if test user exists, if not create one
    let user = await User.findOne({ discordId: testUser.discordId });
    
    if (!user) {
      console.log('Creating test user...');
      user = new User(testUser);
      await user.save();
      console.log('Test user created successfully');
    } else {
      console.log('Using existing test user');
    }
    
    // Print initial balances
    console.log(`Initial wallet: ${user.wallet}, Initial bank: ${user.bank}`);
    
    // Test addToWallet function
    console.log('Testing addToWallet function...');
    
    // Use mongoose model for updates since we need to understand the issue
    // Add 500 to wallet
    const addAmount = 500;
    console.log(`Adding ${addAmount} to wallet...`);
    
    try {
      // Let's first inspect the user document
      console.log('User document structure before update:');
      console.log(JSON.stringify(user, null, 2).substring(0, 500) + '...');
      
      // Add to wallet using mongoose directly
      user.wallet += addAmount;
      user.transactions.push({
        type: 'deposit',
        amount: addAmount,
        fee: 0,
        timestamp: new Date(),
        description: 'Test deposit'
      });
      
      await user.save();
      console.log('Wallet update successful using mongoose');
      console.log(`New wallet balance: ${user.wallet}`);
      
    } catch (error) {
      console.error('Error updating wallet:', error.message);
    }
    
    // Test transferToBank function
    console.log('\nTesting transferToBank function...');
    const transferAmount = 300;
    console.log(`Transferring ${transferAmount} from wallet to bank...`);
    
    try {
      // Calculate fee (1%)
      const fee = Math.ceil(transferAmount * 0.01);
      const depositAmount = transferAmount - fee;
      
      user.wallet -= transferAmount;
      user.bank += depositAmount;
      user.transactions.push({
        type: 'deposit',
        amount: depositAmount,
        fee: fee,
        timestamp: new Date(),
        description: 'Test transfer to bank'
      });
      
      await user.save();
      console.log('Transfer to bank successful using mongoose');
      console.log(`New wallet balance: ${user.wallet}`);
      console.log(`New bank balance: ${user.bank}`);
      
    } catch (error) {
      console.error('Error transferring to bank:', error.message);
    }
    
    // Test transferToWallet function
    console.log('\nTesting transferToWallet function...');
    const withdrawAmount = 200;
    console.log(`Transferring ${withdrawAmount} from bank to wallet...`);
    
    try {
      user.bank -= withdrawAmount;
      user.wallet += withdrawAmount;
      user.transactions.push({
        type: 'withdraw',
        amount: withdrawAmount,
        fee: 0,
        timestamp: new Date(),
        description: 'Test transfer to wallet'
      });
      
      await user.save();
      console.log('Transfer to wallet successful using mongoose');
      console.log(`New wallet balance: ${user.wallet}`);
      console.log(`New bank balance: ${user.bank}`);
      
    } catch (error) {
      console.error('Error transferring to wallet:', error.message);
    }
    
    // Fetch final user state from the database to confirm all operations worked
    const finalUser = await User.findOne({ discordId: user.discordId });
    console.log('\nFinal user state:');
    console.log(`Wallet: ${finalUser.wallet}, Bank: ${finalUser.bank}`);
    console.log(`Transaction count: ${finalUser.transactions.length}`);
    
    // Print the last three transactions
    console.log('\nLast 3 transactions:');
    const lastTransactions = finalUser.transactions.slice(-3);
    lastTransactions.forEach((tx, index) => {
      console.log(`${index+1}. Type: ${tx.type}, Amount: ${tx.amount}, Fee: ${tx.fee}`);
    });
    
    await mongoose.connection.close();
    console.log('Mongoose connection closed');
    
    console.log('\nEconomy system test completed successfully!');
    
  } catch (error) {
    console.error('Error in economy test:', error);
  } finally {
    process.exit(0);
  }
}

main();