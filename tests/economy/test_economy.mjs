import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// MongoDB connection URI and database name
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ccoin';
const dbName = process.env.MONGODB_DB || 'ccoin';

async function main() {
    console.log('Starting economy system test...');
    
    // Connect to MongoDB
    const client = new MongoClient(uri);
    try {
        await client.connect();
        console.log('Connected to MongoDB successfully');
        
        const db = client.db(dbName);
        const userCollection = db.collection('users');
        
        // Get a test user ID
        const testUser = await userCollection.findOne({});
        if (!testUser) {
            console.log('No users found in the database for testing. Please make sure there are users in the database.');
            return;
        }
        
        const userId = testUser._id;
        console.log(`Using test user ID: ${userId}, username: ${testUser.username || 'Unknown'}`);
        console.log(`Initial Wallet: ${testUser.wallet}, Bank: ${testUser.bank}`);
        
        // Test adding to wallet
        const amountToAdd = 100;
        console.log(`\nTest 1: Adding ${amountToAdd} coins to wallet...`);
        const walletUpdate = await userCollection.findOneAndUpdate(
            { _id: userId },
            { 
                $inc: { wallet: amountToAdd },
                $push: { 
                    transactions: {
                        type: 'test_deposit',
                        amount: amountToAdd,
                        fee: 0,
                        timestamp: new Date(),
                        testCase: 'Direct database test'
                    }
                }
            },
            { returnDocument: 'after' }
        );
        
        const userAfterWalletUpdate = walletUpdate.value;
        console.log(`After wallet update:`);
        console.log(`Wallet: ${userAfterWalletUpdate.wallet}, Bank: ${userAfterWalletUpdate.bank}`);
        
        // Verify with a fresh fetch from database
        const verifyUser1 = await userCollection.findOne({ _id: userId });
        console.log(`Verification from DB:`);
        console.log(`Wallet: ${verifyUser1.wallet}, Bank: ${verifyUser1.bank}`);
        console.log(`Test 1 ${verifyUser1.wallet === userAfterWalletUpdate.wallet ? 'PASSED ✓' : 'FAILED ✗'}`);
        
        // Test adding to bank
        console.log(`\nTest 2: Adding ${amountToAdd} coins to bank...`);
        const bankUpdate = await userCollection.findOneAndUpdate(
            { _id: userId },
            { 
                $inc: { bank: amountToAdd },
                $push: { 
                    transactions: {
                        type: 'test_deposit',
                        amount: amountToAdd,
                        fee: 0,
                        timestamp: new Date(),
                        testCase: 'Direct database test'
                    }
                }
            },
            { returnDocument: 'after' }
        );
        
        const userAfterBankUpdate = bankUpdate.value;
        console.log(`After bank update:`);
        console.log(`Wallet: ${userAfterBankUpdate.wallet}, Bank: ${userAfterBankUpdate.bank}`);
        
        // Verify with a fresh fetch from database
        const verifyUser2 = await userCollection.findOne({ _id: userId });
        console.log(`Verification from DB:`);
        console.log(`Wallet: ${verifyUser2.wallet}, Bank: ${verifyUser2.bank}`);
        console.log(`Test 2 ${verifyUser2.bank === userAfterBankUpdate.bank ? 'PASSED ✓' : 'FAILED ✗'}`);
        
        // Test transfer to bank (simulating)
        const transferAmount = 50;
        if (verifyUser2.wallet >= transferAmount) {
            console.log(`\nTest 3: Transferring ${transferAmount} coins from wallet to bank...`);
            const fee = Math.ceil(transferAmount * 0.01); // 1% fee
            const depositAmount = transferAmount - fee;
            
            const transferToBankUpdate = await userCollection.findOneAndUpdate(
                { _id: userId },
                { 
                    $inc: { 
                        wallet: -transferAmount,
                        bank: depositAmount 
                    },
                    $push: { 
                        transactions: {
                            type: 'deposit',
                            amount: depositAmount,
                            fee: fee,
                            timestamp: new Date(),
                            testCase: 'Direct database test'
                        }
                    }
                },
                { returnDocument: 'after' }
            );
            
            const userAfterTransferToBank = transferToBankUpdate.value;
            console.log(`After transfer to bank:`);
            console.log(`Wallet: ${userAfterTransferToBank.wallet}, Bank: ${userAfterTransferToBank.bank}`);
            
            // Verify with a fresh fetch from database
            const verifyUser3 = await userCollection.findOne({ _id: userId });
            console.log(`Verification from DB:`);
            console.log(`Wallet: ${verifyUser3.wallet}, Bank: ${verifyUser3.bank}`);
            console.log(`Test 3 ${verifyUser3.wallet === userAfterTransferToBank.wallet && 
                verifyUser3.bank === userAfterTransferToBank.bank ? 'PASSED ✓' : 'FAILED ✗'}`);
        } else {
            console.log(`\nTest 3: Skipped (insufficient funds in wallet - needed ${transferAmount}, had ${verifyUser2.wallet})`);
        }
        
        // Test transfer to wallet
        const withdrawAmount = 25;
        if (verifyUser2.bank >= withdrawAmount) {
            console.log(`\nTest 4: Transferring ${withdrawAmount} coins from bank to wallet...`);
            const transferToWalletUpdate = await userCollection.findOneAndUpdate(
                { _id: userId },
                { 
                    $inc: { 
                        bank: -withdrawAmount,
                        wallet: withdrawAmount 
                    },
                    $push: { 
                        transactions: {
                            type: 'withdraw',
                            amount: withdrawAmount,
                            fee: 0, // No fee for withdrawing
                            timestamp: new Date(),
                            testCase: 'Direct database test'
                        }
                    }
                },
                { returnDocument: 'after' }
            );
            
            const userAfterTransferToWallet = transferToWalletUpdate.value;
            console.log(`After transfer to wallet:`);
            console.log(`Wallet: ${userAfterTransferToWallet.wallet}, Bank: ${userAfterTransferToWallet.bank}`);
            
            // Verify with a fresh fetch from database
            const verifyUser4 = await userCollection.findOne({ _id: userId });
            console.log(`Verification from DB:`);
            console.log(`Wallet: ${verifyUser4.wallet}, Bank: ${verifyUser4.bank}`);
            console.log(`Test 4 ${verifyUser4.wallet === userAfterTransferToWallet.wallet && 
                verifyUser4.bank === userAfterTransferToWallet.bank ? 'PASSED ✓' : 'FAILED ✗'}`);
        } else {
            console.log(`\nTest 4: Skipped (insufficient funds in bank - needed ${withdrawAmount}, had ${verifyUser2.bank})`);
        }
        
        // Show last 5 transactions for the user to verify transaction recording
        console.log('\nLast 5 transactions:');
        if (verifyUser2.transactions && Array.isArray(verifyUser2.transactions)) {
            const transactions = verifyUser2.transactions
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, 5);
                
            transactions.forEach((tx, i) => {
                console.log(`${i+1}. Type: ${tx.type}, Amount: ${tx.amount}, Fee: ${tx.fee}, Time: ${new Date(tx.timestamp).toLocaleString()}`);
            });
        } else {
            console.log('No transactions found for this user.');
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