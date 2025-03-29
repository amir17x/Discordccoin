import { 
  ButtonInteraction, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder,
  MessageComponentInteraction
} from 'discord.js';
import { storage } from '../../storage';

// Function to create and send the profile menu
export async function profileMenu(
  interaction: ButtonInteraction | MessageComponentInteraction,
  followUp: boolean = false
) {
  try {
    // Check if user exists
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      await interaction.reply({
        content: '⚠️ شما باید ابتدا یک حساب کاربری ایجاد کنید. از دستور /menu استفاده نمایید.',
        ephemeral: true
      });
      return;
    }
    
    // Get user's clan if they're in one
    const userClan = user.clanId ? await storage.getClan(user.clanId) : null;
    
    // موقتا دستاوردها غیرفعال شده‌اند
    const userAchievements: {achievement: any, userAchievement: any}[] = [];
    const completedAchievements: {achievement: any, userAchievement: any}[] = [];
    
    // بدست آوردن آمار بازی‌ها - موقتاً با مقادیر پیش‌فرض
    let userGames: any[] = [];
    try {
      // @ts-ignore - این تابع ممکن است در برخی پیاده‌سازی‌های storage موجود نباشد
      userGames = await storage.getUserGames?.(user.id) || [];
    } catch (error) {
      console.error('Error fetching user games:', error);
      userGames = [];
    }
    
    const gamesWon = userGames.filter((game: any) => game.won).length;
    const winRate = userGames.length > 0 ? Math.round((gamesWon / userGames.length) * 100) : 0;
    
    // Get active items
    let inventory: any[] = [];
    try {
      inventory = await storage.getInventoryItems(user.id);
    } catch (error) {
      console.error('Error fetching inventory items:', error);
      inventory = [];
    }
    
    const now = new Date();
    const activeRoles = inventory.filter((item: any) => {
      if (!item || !item.inventoryItem) return false;
      
      return item.inventoryItem?.active && 
             item.inventoryItem?.expires && 
             new Date(item.inventoryItem.expires) > now && 
             item.item?.type === 'role';
    });
    
    // بررسی وضعیت اشتراک دستیار هوشمند
    let aiDetails;
    try {
      aiDetails = await storage.getUserAIAssistantDetails(user.id);
    } catch (error) {
      console.error('Error fetching AI assistant details:', error);
      aiDetails = null;
    }
    
    // Create the profile embed
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('👤 پروفایل کاربر')
      .setDescription(`**${interaction.user.username}**\nعضو شده از: ${new Date(user.createdAt || Date.now()).toLocaleDateString()}`)
      .addFields(
        { name: '💰 اقتصاد', value: `**کیف پول:** ${user.wallet} Ccoin\n**بانک:** ${user.bank} Ccoin\n**کریستال:** ${user.crystals} 💎\n**سطح اقتصادی:** ${user.economyLevel}`, inline: false },
        { name: '🎮 آمار بازی‌ها', value: `**بازی‌های انجام شده:** ${user.totalGamesPlayed}\n**پیروزی‌ها:** ${user.totalGamesWon}\n**نرخ برد:** ${winRate}%`, inline: false }
      )
      .setThumbnail(interaction.user.displayAvatarURL())
      .setFooter({ text: `ID: ${interaction.user.id}` })
      .setTimestamp();
    
    // Add clan info if user is in a clan
    if (userClan) {
      embed.addFields({ name: '🏰 کلن', value: `**نام:** ${userClan.name}\n**سطح:** ${userClan.level}\n**موقعیت:** ${user.discordId === userClan.ownerId ? 'رهبر' : 'عضو'}`, inline: false });
    }
    
    // Add active roles if any
    if (activeRoles.length > 0) {
      try {
        const rolesText = activeRoles.map((role: any) => {
          if (!role.item || !role.inventoryItem || !role.inventoryItem.expires) {
            return 'آیتم نامشخص';
          }
          
          const expires = new Date(role.inventoryItem.expires);
          const hoursLeft = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60));
          return `${role.item.emoji || '🎭'} **${role.item.name || 'آیتم'}** - ${hoursLeft} ساعت باقیمانده`;
        }).join('\n');
        
        embed.addFields({ name: '🎭 نقش‌های فعال', value: rolesText || 'خطا در نمایش آیتم‌های فعال', inline: false });
      } catch (error) {
        console.error('Error displaying active roles:', error);
        embed.addFields({ name: '🎭 نقش‌های فعال', value: 'خطا در نمایش آیتم‌های فعال', inline: false });
      }
    }
    
    // Add achievements info
    if (completedAchievements.length > 0) {
      const achievementsText = completedAchievements.map(({ achievement }) => {
        return `🎖️ **${achievement.title}** - ${achievement.description}`;
      }).slice(0, 3).join('\n');
      
      embed.addFields({ name: '🏆 دستاوردها', value: `${achievementsText}\n*${completedAchievements.length} دستاورد تکمیل شده از ${userAchievements.length} دستاورد*`, inline: false });
    } else {
      embed.addFields({ name: '🏆 دستاوردها', value: 'هنوز هیچ دستاوردی کسب نکرده‌اید.', inline: false });
    }
    
    // Add AI assistant subscription info if available
    if (aiDetails) {
      // بررسی وضعیت فعال بودن اشتراک
      let subscriptionStatus = '❌ فاقد اشتراک';
      let expiryInfo = '';
      
      if (aiDetails.subscription && aiDetails.subscriptionExpires) {
        const now = new Date();
        const expiryDate = new Date(aiDetails.subscriptionExpires);
        
        if (expiryDate > now) {
          // اشتراک فعال است
          subscriptionStatus = '✅ اشتراک فعال';
          
          // محاسبه زمان باقیمانده
          const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          expiryInfo = `\n**تاریخ انقضا:** ${expiryDate.toLocaleDateString('fa-IR')} (${daysLeft} روز باقیمانده)`;
        } else {
          // اشتراک منقضی شده
          subscriptionStatus = '⏱️ اشتراک منقضی شده';
          expiryInfo = `\n**تاریخ انقضا:** ${expiryDate.toLocaleDateString('fa-IR')} (منقضی شده)`;
        }
      }
      
      // نمایش اطلاعات سوالات رایگان (در صورت عدم وجود اشتراک فعال)
      let freeQuestionsInfo = '';
      if (!aiDetails.subscription || (aiDetails.subscriptionExpires && new Date(aiDetails.subscriptionExpires) <= new Date())) {
        freeQuestionsInfo = `\n**سوالات رایگان باقیمانده:** ${aiDetails.questionsRemaining || 0} / ${aiDetails.totalQuestions || 5}`;
      }
      
      embed.addFields({ 
        name: '🧠 دستیار هوشمند جمتای',
        value: `**وضعیت:** ${subscriptionStatus}${expiryInfo}${freeQuestionsInfo}`, 
        inline: false 
      });
    }
    
    // Create colorful button rows
    const row1 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('profile_stats')
          .setLabel('📊 آمار بازی‌ها')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('profile_achievements')
          .setLabel('🎖️ دستاوردها')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('profile_items')
          .setLabel('🎒 آیتم‌ها')
          .setStyle(ButtonStyle.Danger)
      );
      
    const row2 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('profile_transactions')
          .setLabel('📝 تاریخچه تراکنش‌ها')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('menu')
          .setLabel('🔙 بازگشت')
          .setStyle(ButtonStyle.Danger)
      );
    
    // Handle profile section buttons
    if (interaction.isButton()) {
      const customId = interaction.customId;
      
      // Handle profile stats
      if (customId === 'profile_stats') {
        const statsEmbed = new EmbedBuilder()
          .setColor('#5865F2')
          .setTitle('📊 آمار بازی‌های شما')
          .setDescription(`**${interaction.user.username}**`)
          .addFields(
            { name: '🎮 آمار کلی', value: `**بازی‌های انجام شده:** ${user.totalGamesPlayed}\n**پیروزی‌ها:** ${user.totalGamesWon}\n**نرخ برد:** ${winRate}%`, inline: false }
          )
          .setFooter({ text: `ID: ${interaction.user.id}` })
          .setTimestamp();
        
        // Count games by type
        const gameTypes: Record<string, { played: number, won: number }> = {};
        
        userGames.forEach((game: any) => {
          if (!game || !game.type) return;
          
          if (!gameTypes[game.type]) {
            gameTypes[game.type] = { played: 0, won: 0 };
          }
          
          gameTypes[game.type].played += 1;
          if (game.won) {
            gameTypes[game.type].won += 1;
          }
        });
        
        // Add game type stats
        Object.entries(gameTypes).forEach(([type, stats]) => {
          const typeWinRate = Math.round((stats.won / stats.played) * 100);
          const displayName = type === 'coinflip' ? 'شیر یا خط' :
                             type === 'rps' ? 'سنگ کاغذ قیچی' :
                             type === 'numberguess' ? 'حدس عدد' : type;
          
          statsEmbed.addFields({
            name: `🎲 ${displayName}`,
            value: `**بازی‌ها:** ${stats.played}\n**برد‌ها:** ${stats.won}\n**نرخ برد:** ${typeWinRate}%`,
            inline: true
          });
        });
        
        // Back button with color
        const backRow = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('profile')
              .setLabel('🔙 بازگشت')
              .setStyle(ButtonStyle.Danger)
          );
        
        await interaction.update({ embeds: [statsEmbed], components: [backRow] });
        return;
      }
      
      // Handle profile achievements
      if (customId === 'profile_achievements') {
        const achievementsEmbed = new EmbedBuilder()
          .setColor('#5865F2')
          .setTitle('🎖️ دستاوردهای شما')
          .setDescription(`**${interaction.user.username}**\n\nسیستم دستاوردها در حال حاضر در دست توسعه است و به زودی فعال خواهد شد.`)
          .setFooter({ text: `ID: ${interaction.user.id}` })
          .setTimestamp();
        
        // این بخش به صورت موقت غیرفعال شده است
        achievementsEmbed.addFields({
          name: '🔄 در حال توسعه',
          value: 'سیستم دستاوردها در حال بروزرسانی است و به زودی با امکانات جدید در دسترس قرار خواهد گرفت.',
          inline: false
        });
        
        // Back button with color
        const backRow = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('profile')
              .setLabel('🔙 بازگشت')
              .setStyle(ButtonStyle.Danger)
          );
        
        await interaction.update({ embeds: [achievementsEmbed], components: [backRow] });
        return;
      }
      
      // Handle profile items
      if (customId === 'profile_items') {
        // This will redirect to inventory menu
        const inventoryCommand = await import('./inventoryMenu');
        await inventoryCommand.inventoryMenu(interaction);
        return;
      }
      
      // Handle transaction history
      if (customId === 'profile_transactions') {
        // Get transaction history
        const transactions = user.transactions || [];
        
        // Sort by newest first and limit to 10 most recent
        const recentTransactions = [...transactions]
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 10);
        
        const transactionsEmbed = new EmbedBuilder()
          .setColor('#5865F2')
          .setTitle('📝 تاریخچه تراکنش‌های شما')
          .setDescription(`**${interaction.user.username}**\n\nآخرین تراکنش‌های شما (10 مورد اخیر)`)
          .setFooter({ text: `ID: ${interaction.user.id}` })
          .setTimestamp();
        
        if (recentTransactions.length === 0) {
          transactionsEmbed.addFields({
            name: '❌ بدون تراکنش',
            value: 'هیچ تراکنشی در تاریخچه شما ثبت نشده است.'
          });
        } else {
          recentTransactions.forEach((transaction, index) => {
            const date = new Date(transaction.timestamp).toLocaleString();
            
            let typeDisplay = '';
            switch (transaction.type) {
              case 'deposit':
                typeDisplay = '💳 واریز به بانک';
                break;
              case 'withdraw':
                typeDisplay = '💸 برداشت از بانک';
                break;
              case 'transfer_in':
                typeDisplay = '📥 دریافت از کاربر';
                break;
              case 'transfer_out':
                typeDisplay = '📤 ارسال به کاربر';
                break;
              case 'game_win':
                typeDisplay = '🎮 برد بازی';
                break;
              case 'game_loss':
                typeDisplay = '🎮 باخت بازی';
                break;
              case 'quest_reward':
                typeDisplay = '🎯 جایزه کوئست';
                break;
              default:
                typeDisplay = transaction.type;
            }
            
            let transactionDetails = `**مقدار:** ${transaction.amount} Ccoin`;
            
            if (transaction.fee > 0) {
              transactionDetails += `\n**کارمزد:** ${transaction.fee} Ccoin`;
            }
            
            if (transaction.sourceId) {
              transactionDetails += `\n**فرستنده:** <@${transaction.sourceId}>`;
            }
            
            if (transaction.targetId) {
              transactionDetails += `\n**گیرنده:** <@${transaction.targetId}>`;
            }
            
            if (transaction.gameType) {
              const gameName = transaction.gameType === 'coinflip' ? 'شیر یا خط' :
                               transaction.gameType === 'rps' ? 'سنگ کاغذ قیچی' :
                               transaction.gameType === 'numberguess' ? 'حدس عدد' : transaction.gameType;
              transactionDetails += `\n**بازی:** ${gameName}`;
            }
            
            transactionsEmbed.addFields({
              name: `${index + 1}. ${typeDisplay} | ${date}`,
              value: transactionDetails,
              inline: false
            });
          });
        }
        
        // Add navigation buttons for transactions
        const buttonRow = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('profile')
              .setLabel('🔙 بازگشت')
              .setStyle(ButtonStyle.Danger)
          );
        
        await interaction.update({ embeds: [transactionsEmbed], components: [buttonRow] });
        return;
      }
    }
    
    // Send the profile menu
    if (followUp) {
      await interaction.followUp({ embeds: [embed], components: [row1, row2], ephemeral: true });
    } else {
      await interaction.update({ embeds: [embed], components: [row1, row2] });
    }
    
  } catch (error) {
    console.error('Error in profile menu:', error);
    
    try {
      if (followUp) {
        await interaction.followUp({
          content: '❌ متأسفانه در نمایش منوی پروفایل خطایی رخ داد!',
          ephemeral: true
        });
      } else {
        await interaction.reply({
          content: '❌ متأسفانه در نمایش منوی پروفایل خطایی رخ داد!',
          ephemeral: true
        });
      }
    } catch (e) {
      console.error('Error handling profile menu failure:', e);
    }
  }
}

// Helper function to generate progress bar
function getProgressBar(percentage: number): string {
  const filledSquares = Math.floor(percentage / 10);
  const emptySquares = 10 - filledSquares;
  
  return '█'.repeat(filledSquares) + '░'.repeat(emptySquares);
}
