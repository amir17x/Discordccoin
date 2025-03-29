import { MongoClient } from 'mongodb';
import { MongoStorage } from './server/storage.js';

// MongoDB connection URI and database name
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_DB || 'ccoin';

async function main() {
    console.log('Starting economy system test...');
    
    // Connect to MongoDB
    const client = new MongoClient(uri, { useUnifiedTopology: true });
    try {
        await client.connect();
        console.log('Connected to MongoDB successfully');
        
        const db = client.db(dbName);
        const mongoStorage = new MongoStorage();
        
        // Test user ID (use an existing user ID from your system)
        const testUserId = 1343951143625293867; // Replace with a real user ID
        
        // Get initial user state
        const initialUser = await mongoStorage.getUser(testUserId);
        if (!initialUser) {
            console.log('Test user not found. Please use a valid user ID.');
            return;
        }
        
        console.log(`Initial user state: ${initialUser.username}`);
        console.log(`Wallet: ${initialUser.wallet}, Bank: ${initialUser.bank}`);
        
        // Test adding to wallet
        const amountToAdd = 100;
        console.log(`\nTest 1: Adding ${amountToAdd} coins to wallet...`);
        const userAfterAddToWallet = await mongoStorage.addToWallet(
            testUserId, 
            amountToAdd, 
            'test_deposit', 
            { testCase: 'test_economy.js' }
        );
        
        console.log(`After addToWallet:`);
        console.log(`Wallet: ${userAfterAddToWallet.wallet}, Bank: ${userAfterAddToWallet.bank}`);
        
        // Verify with a fresh fetch from database
        const verifyUser1 = await mongoStorage.getUser(testUserId);
        console.log(`Verification from DB:`);
        console.log(`Wallet: ${verifyUser1.wallet}, Bank: ${verifyUser1.bank}`);
        console.log(`Test 1 ${verifyUser1.wallet === userAfterAddToWallet.wallet ? 'PASSED ✓' : 'FAILED ✗'}`);
        
        // Test adding to bank
        console.log(`\nTest 2: Adding ${amountToAdd} coins to bank...`);
        const userAfterAddToBank = await mongoStorage.addToBank(
            testUserId, 
            amountToAdd, 
            'test_deposit', 
            { testCase: 'test_economy.js' }
        );
        
        console.log(`After addToBank:`);
        console.log(`Wallet: ${userAfterAddToBank.wallet}, Bank: ${userAfterAddToBank.bank}`);
        
        // Verify with a fresh fetch from database
        const verifyUser2 = await mongoStorage.getUser(testUserId);
        console.log(`Verification from DB:`);
        console.log(`Wallet: ${verifyUser2.wallet}, Bank: ${verifyUser2.bank}`);
        console.log(`Test 2 ${verifyUser2.bank === userAfterAddToBank.bank ? 'PASSED ✓' : 'FAILED ✗'}`);
        
        // Test transfer to bank
        const transferAmount = 50;
        if (verifyUser2.wallet >= transferAmount) {
            console.log(`\nTest 3: Transferring ${transferAmount} coins from wallet to bank...`);
            const userAfterTransferToBank = await mongoStorage.transferToBank(testUserId, transferAmount);
            
            console.log(`After transferToBank:`);
            console.log(`Wallet: ${userAfterTransferToBank.wallet}, Bank: ${userAfterTransferToBank.bank}`);
            
            // Verify with a fresh fetch from database
            const verifyUser3 = await mongoStorage.getUser(testUserId);
            console.log(`Verification from DB:`);
            console.log(`Wallet: ${verifyUser3.wallet}, Bank: ${verifyUser3.bank}`);
            console.log(`Test 3 ${verifyUser3.wallet === userAfterTransferToBank.wallet && 
                verifyUser3.bank === userAfterTransferToBank.bank ? 'PASSED ✓' : 'FAILED ✗'}`);
        } else {
            console.log(`\nTest 3: Skipped (insufficient funds in wallet)`);
        }
        
        // Test transfer to wallet
        const withdrawAmount = 25;
        if (verifyUser2.bank >= withdrawAmount) {
            console.log(`\nTest 4: Transferring ${withdrawAmount} coins from bank to wallet...`);
            const userAfterTransferToWallet = await mongoStorage.transferToWallet(testUserId, withdrawAmount);
            
            console.log(`After transferToWallet:`);
            console.log(`Wallet: ${userAfterTransferToWallet.wallet}, Bank: ${userAfterTransferToWallet.bank}`);
            
            // Verify with a fresh fetch from database
            const verifyUser4 = await mongoStorage.getUser(testUserId);
            console.log(`Verification from DB:`);
            console.log(`Wallet: ${verifyUser4.wallet}, Bank: ${verifyUser4.bank}`);
            console.log(`Test 4 ${verifyUser4.wallet === userAfterTransferToWallet.wallet && 
                verifyUser4.bank === userAfterTransferToWallet.bank ? 'PASSED ✓' : 'FAILED ✗'}`);
        } else {
            console.log(`\nTest 4: Skipped (insufficient funds in bank)`);
        }
        
        console.log('\nEconomy system tests completed!');
        
    } catch (error) {
        console.error('Error during economy test:', error);
    } finally {
        await client.close();
        console.log('MongoDB connection closed');
    }
}

main().catch(console.error);