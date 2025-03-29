// This is a simple verification script to check if our economy system works
// Run this script in the Discord bot to verify user coin updates

// Example command to add coins to a user's wallet
async function testAddCoinsCommand(userId, amount) {
  try {
    console.log(`Testing addToWallet with userId: ${userId}, amount: ${amount}`);
    
    // Get user before update
    const userBefore = await storage.getUser(userId);
    console.log(`Before update: Wallet=${userBefore.wallet}, Bank=${userBefore.bank}`);
    
    // Add coins to wallet
    const updatedUser = await storage.addToWallet(userId, amount, 'test', { testRun: true });
    console.log(`After update: Wallet=${updatedUser.wallet}, Bank=${updatedUser.bank}`);
    
    // Verify with a fresh fetch
    const verifyUser = await storage.getUser(userId);
    console.log(`Verification: Wallet=${verifyUser.wallet}, Bank=${verifyUser.bank}`);
    
    const success = verifyUser.wallet === updatedUser.wallet;
    console.log(`Test ${success ? 'PASSED ✓' : 'FAILED ✗'}`);
    
    return success;
  } catch (error) {
    console.error('Error in testAddCoinsCommand:', error);
    return false;
  }
}

// Usage instructions for Discord bot:
/*
1. In your Discord bot, create a test command that calls testAddCoinsCommand
2. Example command implementation:

client.on('messageCreate', async (message) => {
  if (message.content.startsWith('!testeconomy')) {
    const args = message.content.split(' ');
    const userId = message.author.id;
    const amount = parseInt(args[1] || '100');
    
    const result = await testAddCoinsCommand(userId, amount);
    message.reply(`Economy test ${result ? 'PASSED ✓' : 'FAILED ✗'}`);
  }
});

3. Run the command in Discord to test the economy functions
*/