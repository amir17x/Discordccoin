import { 
  ButtonInteraction, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder,
  MessageComponentInteraction,
  ModalSubmitInteraction,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder
} from 'discord.js';
import { storage } from '../../storage';
import { LotteryData } from '@shared/schema';

/**
 * سیستم لاتاری Ccoin
 * امکان خرید بلیط قرعه‌کشی و شرکت در قرعه‌کشی‌های مختلف
 */
export async function lotteryMenu(
  interaction: ButtonInteraction | MessageComponentInteraction,
  subMenu: string = 'main'
) {
  try {
    // بررسی وجود کاربر
    const user = await storage.getUserByDiscordId(interaction.user.id);
    if (!user) {
      return await interaction.reply({ 
        content: '❌ حساب کاربری شما یافت نشد. لطفا از منوی اصلی دوباره شروع کنید.', 
        ephemeral: true 
      });
    }

    // Get all active lotteries
    const allLotteries = await storage.getAllLotteries();
    const activeLotteries = allLotteries.filter(lottery => lottery.status === 'active' && new Date(lottery.endTime) > new Date());
    
    // Count total tickets the user has bought
    let totalTickets = 0;
    if (user.lotteryTickets && user.lotteryTickets.length > 0) {
      for (const ticket of user.lotteryTickets) {
        // Only count tickets for active lotteries
        if (activeLotteries.some(lottery => lottery.id.toString() === ticket.lotteryId)) {
          totalTickets += ticket.tickets;
        }
      }
    }

    // Process based on submenu
    let embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setFooter({ text: `کیف پول: ${user.wallet} Ccoin | بلیط‌های لاتاری: ${totalTickets}` })
      .setTimestamp();

    let components: ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>[] = [];

    switch (subMenu) {
      case 'main':
        // Main lottery menu
        embed
          .setTitle('🎟️ قرعه‌کشی Ccoin')
          .setDescription('به سیستم قرعه‌کشی Ccoin خوش آمدید! شما می‌توانید با خرید بلیط در قرعه‌کشی‌ها شرکت کنید و شانس خود را برای بردن جوایز بزرگ امتحان کنید.\n\n' +
                         '🔹 هر بلیط شانس برنده شدن شما را افزایش می‌دهد\n' +
                         '🔹 در هر قرعه‌کشی فقط یک برنده خواهد بود\n' +
                         '🔹 80% از مبلغ فروش بلیط‌ها به جایزه اضافه می‌شود\n' +
                         '🔹 پس از اتمام مهلت، قرعه‌کشی به صورت خودکار انجام و برنده مشخص می‌شود')
          .setThumbnail('https://img.icons8.com/fluency/48/lottery.png'); // آیکون lottery برای قرعه‌کشی

        // Show active lotteries count
        embed.addFields(
          { name: '🎯 قرعه‌کشی‌های فعال', value: `${activeLotteries.length} قرعه‌کشی`, inline: true },
          { name: '🎟️ بلیط‌های من', value: `${totalTickets} بلیط`, inline: true }
        );

        // If user has tickets in any active lottery, show their chances
        if (totalTickets > 0) {
          embed.addFields(
            { name: '\u200B', value: '\u200B', inline: false }, // Spacer
            { name: '🎮 شانس برنده شدن شما', value: 'قرعه‌کشی‌های فعال که در آن‌ها بلیط دارید:', inline: false }
          );

          for (const lottery of activeLotteries) {
            const userTicket = user.lotteryTickets?.find(t => t.lotteryId === lottery.id.toString());
            if (userTicket && userTicket.tickets > 0) {
              // Calculate total tickets in this lottery
              let totalLotteryTickets = 0;
              for (const participant of lottery.participants) {
                totalLotteryTickets += participant.ticketCount;
              }
              
              // Calculate win chance
              const winChance = ((userTicket.tickets / totalLotteryTickets) * 100).toFixed(2);
              
              embed.addFields({
                name: lottery.name,
                value: `🎟️ بلیط‌های شما: ${userTicket.tickets}\n` +
                       `🎯 شانس برنده شدن: ${winChance}%\n` +
                       `💰 جایزه فعلی: ${lottery.jackpot} Ccoin\n` +
                       `⏱️ زمان باقی‌مانده: ${getTimeRemaining(lottery.endTime)}`,
                inline: true
              });
            }
          }
        }

        // Menu buttons
        const row1 = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('lottery_active')
              .setLabel('🎯 قرعه‌کشی‌های فعال')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId('lottery_history')
              .setLabel('📜 تاریخچه')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId('lottery_info')
              .setLabel('ℹ️ راهنما')
              .setStyle(ButtonStyle.Secondary)
          );

        const row2 = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('menu')
              .setLabel('🔙 بازگشت به منوی اصلی')
              .setStyle(ButtonStyle.Danger)
          );

        components = [row1, row2];
        break;

      case 'active':
        // Display active lotteries
        embed
          .setTitle('🎯 قرعه‌کشی‌های فعال')
          .setDescription('لیست قرعه‌کشی‌های فعال که می‌توانید در آن‌ها شرکت کنید:')
          .setThumbnail('https://img.icons8.com/fluency/48/lottery.png'); // آیکون lottery برای قرعه‌کشی‌های فعال

        if (activeLotteries.length > 0) {
          // Create a select menu for the lotteries
          const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('lottery_select_buy')
            .setPlaceholder('یک قرعه‌کشی انتخاب کنید')
            .setMinValues(1)
            .setMaxValues(1);

          // Add each active lottery to the embed and menu
          activeLotteries.forEach(lottery => {
            // Get user's tickets for this lottery
            const userTicket = user.lotteryTickets?.find(t => t.lotteryId === lottery.id.toString());
            const userTicketCount = userTicket ? userTicket.tickets : 0;
            
            // Calculate total participants and tickets
            let totalParticipants = lottery.participants.length;
            let totalTickets = 0;
            for (const participant of lottery.participants) {
              totalTickets += participant.ticketCount;
            }
            
            embed.addFields({
              name: lottery.name,
              value: `📝 ${lottery.description}\n` +
                     `💰 جایزه فعلی: ${lottery.jackpot} Ccoin\n` +
                     `🎟️ قیمت بلیط: ${lottery.ticketPrice} Ccoin\n` +
                     `👥 شرکت‌کنندگان: ${totalParticipants}\n` +
                     `🎯 کل بلیط‌ها: ${totalTickets}\n` +
                     `🎮 بلیط‌های شما: ${userTicketCount}\n` +
                     `⏱️ زمان باقی‌مانده: ${getTimeRemaining(lottery.endTime)}`,
              inline: false
            });
            
            // Add option to select menu
            selectMenu.addOptions(
              new StringSelectMenuOptionBuilder()
                .setLabel(lottery.name)
                .setDescription(`قیمت بلیط: ${lottery.ticketPrice} Ccoin | جایزه: ${lottery.jackpot} Ccoin`)
                .setValue(`buy_lottery_${lottery.id}`)
            );
          });

          const selectRow = new ActionRowBuilder<StringSelectMenuBuilder>()
            .addComponents(selectMenu);

          components.push(selectRow);
        } else {
          embed.setDescription('در حال حاضر هیچ قرعه‌کشی فعالی وجود ندارد. به زودی قرعه‌کشی‌های جدید اضافه خواهند شد.');
        }

        // Add back button
        const backRow = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('lottery')
              .setLabel('🔙 بازگشت به منوی قرعه‌کشی')
              .setStyle(ButtonStyle.Secondary)
          );

        components.push(backRow);
        break;

      case 'history':
        // Display lottery history (completed lotteries)
        const completedLotteries = allLotteries.filter(lottery => lottery.status === 'completed');
        
        embed
          .setTitle('📜 تاریخچه قرعه‌کشی‌ها')
          .setDescription('نتایج قرعه‌کشی‌های گذشته:')
          .setThumbnail('https://img.icons8.com/fluency/48/transaction-list.png'); // آیکون transaction-list برای تاریخچه

        if (completedLotteries.length > 0) {
          for (const lottery of completedLotteries) {
            // Find winner's username
            let winnerName = "نامشخص";
            if (lottery.winnerId) {
              const winner = await storage.getUser(lottery.winnerId);
              if (winner) {
                winnerName = winner.username;
              }
            }
            
            // Check if user participated
            const userParticipated = lottery.participants.some((p: {userId: number, ticketCount: number}) => p.userId === user.id);
            const userWon = lottery.winnerId === user.id;
            
            let statusEmoji = "❌";
            if (userParticipated) {
              statusEmoji = userWon ? "🏆" : "⭐";
            }
            
            embed.addFields({
              name: `${statusEmoji} ${lottery.name}`,
              value: `💰 جایزه: ${lottery.jackpot} Ccoin\n` +
                     `👑 برنده: ${winnerName}\n` +
                     `📅 تاریخ قرعه‌کشی: ${new Date(lottery.endTime).toLocaleDateString('fa-IR')}\n` +
                     `${userParticipated ? (userWon ? "🎊 شما برنده شدید!" : "🎮 شما شرکت کردید") : "❓ شما شرکت نکردید"}`,
              inline: true
            });
          }
        } else {
          embed.setDescription('هنوز هیچ قرعه‌کشی کامل نشده است.');
        }

        // Add back button
        const backToLotteryRow = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('lottery')
              .setLabel('🔙 بازگشت به منوی قرعه‌کشی')
              .setStyle(ButtonStyle.Secondary)
          );

        components.push(backToLotteryRow);
        break;

      case 'info':
        // Lottery information
        embed
          .setTitle('ℹ️ راهنمای قرعه‌کشی')
          .setDescription('راهنمای استفاده از سیستم قرعه‌کشی Ccoin:')
          .setThumbnail('https://img.icons8.com/fluency/48/help.png') // آیکون help برای راهنما
          .addFields(
            { 
              name: '🎟️ نحوه خرید بلیط', 
              value: '1. به بخش «قرعه‌کشی‌های فعال» بروید\n' +
                     '2. از منوی کشویی، قرعه‌کشی مورد نظر خود را انتخاب کنید\n' +
                     '3. تعداد بلیط‌هایی که می‌خواهید را وارد کنید\n' +
                     '4. مبلغ بلیط‌ها از کیف پول شما کسر می‌شود', 
              inline: false 
            },
            { 
              name: '🎯 نحوه برنده شدن', 
              value: '• هر بلیط یک شانس برنده شدن است\n' +
                     '• قرعه‌کشی به صورت کاملاً تصادفی انجام می‌شود\n' +
                     '• هر چه تعداد بلیط‌های شما بیشتر باشد، شانس برنده شدن شما بیشتر است\n' +
                     '• در هر قرعه‌کشی فقط یک نفر برنده می‌شود\n' +
                     '• مبلغ جایزه به طور خودکار به کیف پول برنده واریز می‌شود', 
              inline: false 
            },
            { 
              name: '💰 جایزه', 
              value: '• هر قرعه‌کشی با یک جایزه اولیه شروع می‌شود\n' +
                     '• 80% از مبلغ فروش بلیط‌ها به جایزه اضافه می‌شود\n' +
                     '• جایزه هر قرعه‌کشی به طور مداوم افزایش می‌یابد\n' +
                     '• جایزه بزرگتر = خرید بلیط بیشتر = شانس برنده شدن بیشتر', 
              inline: false 
            },
            { 
              name: '⏱️ زمان قرعه‌کشی', 
              value: '• هر قرعه‌کشی یک زمان پایان مشخص دارد\n' +
                     '• پس از پایان زمان، قرعه‌کشی به صورت خودکار انجام می‌شود\n' +
                     '• نتیجه قرعه‌کشی در بخش «تاریخچه» قابل مشاهده است\n' +
                     '• قرعه‌کشی‌های جدید به طور مرتب اضافه می‌شوند', 
              inline: false 
            }
          );

        // Add back button
        const backButtonRow = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('lottery')
              .setLabel('🔙 بازگشت به منوی قرعه‌کشی')
              .setStyle(ButtonStyle.Secondary)
          );

        components = [backButtonRow];
        break;
    }

    // Send or update the message
    if ('update' in interaction && typeof interaction.update === 'function') {
      await interaction.update({ embeds: [embed], components });
    } else {
      await interaction.reply({ embeds: [embed], components, ephemeral: false });
    }
  } catch (error) {
    console.error('Error in lottery menu:', error);
    try {
      await interaction.reply({ 
        content: '❌ خطایی در نمایش منوی قرعه‌کشی رخ داد. لطفا دوباره تلاش کنید.', 
        ephemeral: true 
      });
    } catch (e) {
      console.error('Error replying with error message:', e);
    }
  }
}

/**
 * محاسبه زمان باقی‌مانده تا پایان قرعه‌کشی
 */
function getTimeRemaining(endTimeStr: Date | string): string {
  const endTime = new Date(endTimeStr);
  const now = new Date();
  
  if (endTime <= now) {
    return 'اتمام زمان';
  }
  
  const diffMs = endTime.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffDays > 0) {
    return `${diffDays} روز و ${diffHours} ساعت`;
  } else if (diffHours > 0) {
    return `${diffHours} ساعت و ${diffMinutes} دقیقه`;
  } else {
    return `${diffMinutes} دقیقه`;
  }
}

/**
 * پردازش خرید بلیط لاتاری
 */
export async function processBuyLotteryTicket(
  interaction: MessageComponentInteraction | ModalSubmitInteraction,
  lotteryId: number,
  quantity: number
) {
  try {
    const user = await storage.getUserByDiscordId(interaction.user.id);
    if (!user) {
      return await interaction.reply({ 
        content: '❌ حساب کاربری شما یافت نشد.', 
        ephemeral: true 
      });
    }

    const lottery = await storage.getLottery(lotteryId);
    if (!lottery) {
      return await interaction.reply({ 
        content: '❌ قرعه‌کشی مورد نظر یافت نشد.', 
        ephemeral: true 
      });
    }

    // Check if lottery is still active
    if (lottery.status !== 'active' || new Date(lottery.endTime) < new Date()) {
      return await interaction.reply({ 
        content: '❌ این قرعه‌کشی به پایان رسیده است و دیگر نمی‌توانید در آن شرکت کنید.', 
        ephemeral: true 
      });
    }

    // Calculate total cost
    const totalCost = lottery.ticketPrice * quantity;

    // Check if user has enough money
    if (user.wallet < totalCost) {
      return await interaction.reply({ 
        content: `❌ موجودی کافی نیست. شما به ${totalCost} Ccoin نیاز دارید اما فقط ${user.wallet} Ccoin در کیف پول خود دارید.`, 
        ephemeral: true 
      });
    }

    // Buy lottery tickets
    const success = await storage.buyLotteryTicket(user.id, lotteryId, quantity);
    
    if (success) {
      // Get updated lottery and user data
      const updatedLottery = await storage.getLottery(lotteryId);
      const updatedUser = await storage.getUserByDiscordId(interaction.user.id);
      
      if (!updatedLottery || !updatedUser) {
        return await interaction.reply({ 
          content: '❌ خطایی در به‌روزرسانی اطلاعات رخ داد.', 
          ephemeral: true 
        });
      }
      
      // Calculate user's total tickets for this lottery
      const userTicket = updatedUser.lotteryTickets?.find(t => t.lotteryId === lotteryId.toString());
      const userTicketCount = userTicket ? userTicket.tickets : 0;
      
      // Calculate win chance
      let totalLotteryTickets = 0;
      for (const participant of updatedLottery.participants) {
        totalLotteryTickets += participant.ticketCount;
      }
      
      const winChance = ((userTicketCount / totalLotteryTickets) * 100).toFixed(2);
      
      const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('✅ خرید بلیط موفق')
        .setDescription(`شما با موفقیت ${quantity} بلیط برای قرعه‌کشی ${updatedLottery.name} خریداری کردید.`)
        .setThumbnail('https://img.icons8.com/fluency/48/task-completed.png') // آیکون task-completed برای موفقیت
        .addFields(
          { name: '💰 قیمت هر بلیط', value: `${updatedLottery.ticketPrice} Ccoin`, inline: true },
          { name: '🔢 تعداد', value: `${quantity} بلیط`, inline: true },
          { name: '💲 مبلغ کل', value: `${totalCost} Ccoin`, inline: true },
          { name: '🎯 کل بلیط‌های شما', value: `${userTicketCount} بلیط`, inline: true },
          { name: '🎮 شانس برنده شدن', value: `${winChance}%`, inline: true },
          { name: '💰 جایزه فعلی', value: `${updatedLottery.jackpot} Ccoin`, inline: true },
          { name: '⏱️ زمان باقی‌مانده', value: getTimeRemaining(updatedLottery.endTime), inline: false }
        )
        .setFooter({ text: `کیف پول فعلی: ${updatedUser.wallet} Ccoin` })
        .setTimestamp();

      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('lottery_active')
            .setLabel('🎯 قرعه‌کشی‌های فعال')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('lottery')
            .setLabel('🔙 بازگشت به منوی قرعه‌کشی')
            .setStyle(ButtonStyle.Secondary)
        );

      await interaction.reply({ embeds: [embed], components: [row], ephemeral: false });
    } else {
      await interaction.reply({ 
        content: '❌ خرید بلیط با مشکل مواجه شد. لطفا دوباره تلاش کنید.', 
        ephemeral: true 
      });
    }
  } catch (error) {
    console.error('Error processing buy lottery ticket:', error);
    await interaction.reply({ 
      content: '❌ خطایی در خرید بلیط رخ داد. لطفا دوباره تلاش کنید.', 
      ephemeral: true 
    });
  }
}