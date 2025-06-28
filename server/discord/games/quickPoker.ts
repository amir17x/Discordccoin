import { 
  ButtonInteraction, 
  MessageComponentInteraction, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder 
} from 'discord.js';
import { storage } from '../../storage';

// Game constants
const BET_AMOUNT = 50;
const REWARD_AMOUNT = 150;

// Card values and suits
const SUITS = ['♠️', '♥️', '♦️', '♣️'];
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

interface Card {
  suit: string;
  value: string;
  numValue: number;
}

interface PokerGame {
  deck: Card[];
  playerHand: Card[];
  computerHand: Card[];
  gameState: 'betting' | 'playing' | 'finished';
}

// Store active games
const activeGames: Record<string, PokerGame> = {};

// Create a deck of cards
function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (let i = 0; i < VALUES.length; i++) {
      const value = VALUES[i];
      const numValue = value === 'A' ? 14 : value === 'K' ? 13 : value === 'Q' ? 12 : value === 'J' ? 11 : parseInt(value);
      deck.push({ suit, value, numValue });
    }
  }
  return deck;
}

// Shuffle deck
function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Deal cards
function dealCards(deck: Card[]): { playerHand: Card[], computerHand: Card[], remainingDeck: Card[] } {
  const playerHand = [deck[0], deck[1], deck[2]];
  const computerHand = [deck[3], deck[4], deck[5]];
  const remainingDeck = deck.slice(6);
  return { playerHand, computerHand, remainingDeck };
}

// Evaluate hand strength
function evaluateHand(hand: Card[]): { strength: number, name: string } {
  const sortedHand = hand.sort((a, b) => b.numValue - a.numValue);
  
  // Check for three of a kind
  if (sortedHand[0].numValue === sortedHand[1].numValue && sortedHand[1].numValue === sortedHand[2].numValue) {
    return { strength: 7, name: 'سه تایی ' + sortedHand[0].value };
  }
  
  // Check for straight
  const values = sortedHand.map(card => card.numValue).sort((a, b) => a - b);
  if (values[2] - values[0] === 2 && values[1] - values[0] === 1) {
    return { strength: 6, name: 'پشت سر هم تا ' + sortedHand[0].value };
  }
  
  // Check for flush
  if (sortedHand[0].suit === sortedHand[1].suit && sortedHand[1].suit === sortedHand[2].suit) {
    return { strength: 5, name: 'هم رنگ ' + sortedHand[0].suit };
  }
  
  // Check for pair
  if (sortedHand[0].numValue === sortedHand[1].numValue || 
      sortedHand[1].numValue === sortedHand[2].numValue || 
      sortedHand[0].numValue === sortedHand[2].numValue) {
    const pairValue = sortedHand[0].numValue === sortedHand[1].numValue ? sortedHand[0].value :
                     sortedHand[1].numValue === sortedHand[2].numValue ? sortedHand[1].value :
                     sortedHand[0].value;
    return { strength: 4, name: 'جفت ' + pairValue };
  }
  
  // High card
  return { strength: sortedHand[0].numValue, name: 'کارت بالا ' + sortedHand[0].value };
}

// Format hand display
function formatHand(hand: Card[]): string {
  return hand.map(card => `${card.value}${card.suit}`).join(' ');
}

// Function to handle quick poker game
export async function handleQuickPoker(
  interaction: MessageComponentInteraction,
  action: string
) {
  try {
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferUpdate();
    }
    
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      const errorMessage = '⚠️ شما باید ابتدا یک حساب کاربری ایجاد کنید. از دستور /menu استفاده نمایید.';
      if (interaction.deferred) {
        await interaction.editReply({ content: errorMessage });
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
      return;
    }
    
    if (action === 'start') {
      // Check if user has enough money
      if (user.wallet < BET_AMOUNT) {
        const embed = new EmbedBuilder()
          .setColor('#E74C3C')
          .setTitle('🃏 پوکر سریع - خطا')
          .setDescription('💰 موجودی شما کافی نیست!')
          .addFields(
            { name: '💵 هزینه بازی', value: `${BET_AMOUNT} Ccoin`, inline: true },
            { name: '👛 موجودی شما', value: `${user.wallet} Ccoin`, inline: true }
          )
          .setFooter({ text: 'برای کسب درآمد، از سایر بازی‌ها یا کارها استفاده کنید!' });
        
        const row = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('games')
              .setLabel('🔙 بازگشت به بازی‌ها')
              .setStyle(ButtonStyle.Secondary)
          );
        
        if (interaction.deferred) {
          await interaction.editReply({ embeds: [embed], components: [row] });
        } else {
          await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
        }
        return;
      }
      
      // Start new game
      const deck = shuffleDeck(createDeck());
      const { playerHand, computerHand, remainingDeck } = dealCards(deck);
      
      activeGames[interaction.user.id] = {
        deck: remainingDeck,
        playerHand,
        computerHand,
        gameState: 'playing'
      };
      
      // Deduct bet amount
      await storage.addToWallet(user.id, -BET_AMOUNT);
      
      const embed = new EmbedBuilder()
        .setColor('#3498DB')
        .setTitle('🃏 پوکر سریع - شروع بازی')
        .setDescription('🎲 کارت‌ها پخش شد! آیا می‌خواهید ادامه دهید یا انصراف؟')
        .addFields(
          { name: '🎴 کارت‌های شما', value: formatHand(playerHand), inline: false },
          { name: '💰 شرط', value: `${BET_AMOUNT} Ccoin`, inline: true },
          { name: '🏆 جایزه', value: `${BET_AMOUNT * 2} Ccoin`, inline: true }
        )
        .setFooter({ text: 'باید دست بهتری از کامپیوتر داشته باشید!' });
      
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('game:quick_poker:play')
            .setLabel('🎮 ادامه بازی')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('game:quick_poker:fold')
            .setLabel('🏳️ انصراف')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId('games')
            .setLabel('🔙 بازگشت')
            .setStyle(ButtonStyle.Secondary)
        );
      
      if (interaction.deferred) {
        await interaction.editReply({ embeds: [embed], components: [row] });
      } else {
        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
      }
      
    } else if (action === 'play') {
      const game = activeGames[interaction.user.id];
      
      if (!game) {
        await interaction.editReply({
          content: '❌ بازی‌ای یافت نشد! لطفاً دوباره شروع کنید.'
        });
        return;
      }
      
      // Evaluate hands
      const playerEval = evaluateHand(game.playerHand);
      const computerEval = evaluateHand(game.computerHand);
      
      let won = false;
      let resultText = '';
      let rewardAmount = 0;
      
      if (playerEval.strength > computerEval.strength) {
        won = true;
        rewardAmount = BET_AMOUNT * 2;
        resultText = '🎉 شما برنده شدید!';
        await storage.addToWallet(user.id, rewardAmount);
      } else if (playerEval.strength < computerEval.strength) {
        resultText = '😔 شما باختید!';
      } else {
        // Draw - return bet
        rewardAmount = BET_AMOUNT;
        resultText = '🤝 مساوی! شرط برگشت داده شد.';
        await storage.addToWallet(user.id, BET_AMOUNT);
      }
      
      const resultEmbed = new EmbedBuilder()
        .setColor(won ? '#2ECC71' : playerEval.strength === computerEval.strength ? '#F1C40F' : '#E74C3C')
        .setTitle('🃏 پوکر سریع - نتیجه')
        .setDescription(resultText)
        .addFields(
          { name: '🎴 کارت‌های شما', value: `${formatHand(game.playerHand)}\n**${playerEval.name}**`, inline: true },
          { name: '🤖 کارت‌های کامپیوتر', value: `${formatHand(game.computerHand)}\n**${computerEval.name}**`, inline: true },
          { name: '💰 نتیجه مالی', value: won ? `+${rewardAmount - BET_AMOUNT} Ccoin` : playerEval.strength === computerEval.strength ? `±0 Ccoin` : `-${BET_AMOUNT} Ccoin`, inline: false }
        )
        .setFooter({ text: 'آیا می‌خواهید دوباره بازی کنید?' });
      
      // Record game
      await storage.recordGame(
        user.id,
        'quick_poker',
        BET_AMOUNT,
        won,
        won ? rewardAmount - BET_AMOUNT : 0
      );
      
      // Update quest progress if won
      if (won) {
        const quests = await storage.getUserQuests(user.id);
        for (const { quest, userQuest } of quests) {
          if (quest.requirement === 'win' && !userQuest.completed) {
            await storage.updateQuestProgress(
              user.id,
              quest.id,
              userQuest.progress + 1
            );
          }
        }
      }
      
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('game:quick_poker:start')
            .setLabel('🔄 بازی مجدد')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('games')
            .setLabel('🔙 بازگشت به بازی‌ها')
            .setStyle(ButtonStyle.Secondary)
        );
      
      // Clean up game
      delete activeGames[interaction.user.id];
      
      if (interaction.deferred) {
        await interaction.editReply({ embeds: [resultEmbed], components: [row] });
      } else {
        await interaction.reply({ embeds: [resultEmbed], components: [row], ephemeral: true });
      }
      
    } else if (action === 'fold') {
      // User folded - return half bet
      const returnAmount = Math.floor(BET_AMOUNT / 2);
      await storage.addToWallet(user.id, returnAmount);
      
      const embed = new EmbedBuilder()
        .setColor('#F39C12')
        .setTitle('🃏 پوکر سریع - انصراف')
        .setDescription('🏳️ شما از بازی انصراف دادید.')
        .addFields(
          { name: '💰 برگشت', value: `${returnAmount} Ccoin`, inline: true },
          { name: '💸 ضرر', value: `${BET_AMOUNT - returnAmount} Ccoin`, inline: true }
        )
        .setFooter({ text: 'آیا می‌خواهید دوباره بازی کنید?' });
      
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('game:quick_poker:start')
            .setLabel('🔄 بازی مجدد')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('games')
            .setLabel('🔙 بازگشت به بازی‌ها')
            .setStyle(ButtonStyle.Secondary)
        );
      
      // Clean up game
      delete activeGames[interaction.user.id];
      
      if (interaction.deferred) {
        await interaction.editReply({ embeds: [embed], components: [row] });
      } else {
        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
      }
    }
    
  } catch (error) {
    console.error('Error in quick poker game:', error);
    
    try {
      const errorMessage = '❌ خطایی در بازی پوکر رخ داد! لطفاً دوباره تلاش کنید.';
      
      if (interaction.deferred) {
        await interaction.editReply({ content: errorMessage });
      } else if (interaction.replied) {
        await interaction.followUp({ content: errorMessage, ephemeral: true });
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    } catch (e) {
      console.error('Error handling quick poker failure:', e);
    }
  }
}