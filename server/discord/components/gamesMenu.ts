import { 
  ButtonInteraction, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  MessageComponentInteraction
} from 'discord.js';
import { storage } from '../../storage';

// Function to create and send the games menu
export async function gamesMenu(
  interaction: ButtonInteraction | MessageComponentInteraction,
  followUp: boolean = false
) {
  try {
    // راه‌اندازی پاسخ با تاخیر (defer) تا از خطای تایم‌اوت جلوگیری شود
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply({ ephemeral: true }); // همیشه پیام‌ها را به صورت خصوصی ارسال می‌کنیم
    }
    
    // Check if user exists
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      if (interaction.deferred) {
        await interaction.editReply({
          content: '⚠️ شما باید ابتدا یک حساب کاربری ایجاد کنید. از دستور /menu استفاده نمایید.'
        });
      } else {
        await interaction.reply({
          content: '⚠️ شما باید ابتدا یک حساب کاربری ایجاد کنید. از دستور /menu استفاده نمایید.',
          ephemeral: true
        });
      }
      return;
    }
    
    // Create the games embed - با رنگ نارنجی برای بخش اصلی بازی‌ها
    const embed = new EmbedBuilder()
      .setColor('#FF9933') // رنگ نارنجی برای بخش اصلی بازی‌ها - جذاب و پر انرژی
      .setTitle('🎮 بخش بازی‌ها')
      .setDescription('✨ به دنیای هیجان‌انگیز بازی‌ها خوش آمدید! ✨')
      .addFields(
        { name: '👤 آمار بازی‌های شما', value: `بازی‌های انجام شده: ${user.totalGamesPlayed}\nبازی‌های برنده شده: ${user.totalGamesWon}`, inline: false },
        { name: '💵 موجودی', value: `${user.wallet} Ccoin`, inline: true },
        { name: '💎 کریستال', value: `${user.crystals}`, inline: true }
      )
      .setFooter({ text: `${interaction.user.username} | نرخ برد: ${user.totalGamesPlayed > 0 ? Math.round((user.totalGamesWon / user.totalGamesPlayed) * 100) : 0}%` })
      .setTimestamp();
    
    // Create button rows - با منطق رنگی مشخص برای منوی اصلی
    const row1 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('solo_games')
          .setLabel('🎮 بازی‌های تک‌نفره')
          .setStyle(ButtonStyle.Success), // سبز برای بازی‌های تک‌نفره (مناسب برای شروع)
        new ButtonBuilder()
          .setCustomId('competitive_games')
          .setLabel('🏆 بازی‌های رقابتی')
          .setStyle(ButtonStyle.Primary), // آبی برای بازی‌های رقابتی (هیجان‌انگیز)
        new ButtonBuilder()
          .setCustomId('group_games')
          .setLabel('👥 بازی‌های گروهی')
          .setStyle(ButtonStyle.Secondary) // خاکستری برای بخش‌های در حال توسعه
          .setDisabled(true) // Not implemented yet
      );
    
    const row2 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('menu')
          .setLabel('🔙 بازگشت')
          .setStyle(ButtonStyle.Secondary)
      );
    
    // Create solo games buttons - با منطق رنگی برای بازی‌های تک‌نفره
    const soloGameRow1 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('game:coinflip:start')
          .setLabel('🪙 شیر یا خط')
          .setStyle(ButtonStyle.Primary), // آبی برای بازی‌های ساده و کلاسیک
        new ButtonBuilder()
          .setCustomId('game:rps:start')
          .setLabel('✂️ سنگ کاغذ قیچی')
          .setStyle(ButtonStyle.Success) // سبز برای بازی‌های استراتژیک
      );
      
    const soloGameRow2 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('game:numberguess:start')
          .setLabel('🔢 حدس عدد')
          .setStyle(ButtonStyle.Primary), // آبی برای بازی‌های منطقی
        new ButtonBuilder()
          .setCustomId('game:wheel:start')
          .setLabel('🎡 گردونه شانس')
          .setStyle(ButtonStyle.Secondary) // خاکستری برای بخش‌های در حال توسعه
          .setDisabled(true) // Not implemented yet
      );
      
    const soloGameRow3 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('menu')
          .setLabel('🔙 بازگشت')
          .setStyle(ButtonStyle.Secondary)
      );
    
    // Track what state we're in
    let state = 'main';
    
    // Check what custom ID we have to determine state
    const customId = interaction.customId;
    if (customId === 'solo_games') {
      state = 'solo';
    } else if (customId === 'competitive_games') {
      state = 'competitive';
    } else if (customId === 'group_games') {
      state = 'group';
    }
    
    // Send the appropriate menu based on the state
    if (state === 'solo') {
      // تغییر رنگ و توضیحات منوی بازی‌های تک‌نفره
      embed.setColor('#27AE60') // رنگ سبز برای بازی‌های تک‌نفره (ساده و سرگرم‌کننده)
        .setTitle('🎮 بازی‌های تک‌نفره')
        .setDescription('🌟 سرگرمی و هیجان بدون نیاز به رقیب! بازی کنید و Ccoin به دست آورید 🎲');

      if (interaction.deferred) {
        await interaction.editReply({ embeds: [embed], components: [soloGameRow1, soloGameRow2, soloGameRow3] });
      } else if (followUp) {
        await interaction.followUp({ embeds: [embed], components: [soloGameRow1, soloGameRow2, soloGameRow3], ephemeral: true });
      } else if ('update' in interaction && typeof interaction.update === 'function') {
        try {
          await interaction.update({ embeds: [embed], components: [soloGameRow1, soloGameRow2, soloGameRow3] });
        } catch (e) {
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ embeds: [embed], components: [soloGameRow1, soloGameRow2, soloGameRow3], ephemeral: true });
          } else {
            await interaction.followUp({ embeds: [embed], components: [soloGameRow1, soloGameRow2, soloGameRow3], ephemeral: true });
          }
        }
      } else {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ embeds: [embed], components: [soloGameRow1, soloGameRow2, soloGameRow3], ephemeral: true });
        } else {
          await interaction.followUp({ embeds: [embed], components: [soloGameRow1, soloGameRow2, soloGameRow3], ephemeral: true });
        }
      }
    } else if (state === 'competitive') {
      // Create competitive games menu - با رنگ قرمز برای بازی‌های رقابتی (هیجان و چالش)
      embed.setColor('#E74C3C') // رنگ قرمز روشن برای نشان دادن هیجان رقابت
        .setTitle('🏆 بازی‌های رقابتی')
        .setDescription('🔥 با دوستان خود رقابت کنید و در چالش‌های هیجان‌انگیز شرکت کنید! ⚔️')
        .setFields(
          { name: '📝 توضیحات', value: 'بازی‌های رقابتی به صورت دو نفره قابل انجام است. هر بازیکن باید مقدار مشخصی Ccoin را شرط‌بندی کند تا در بازی شرکت کند.', inline: false },
          { name: '💰 موجودی', value: `${user.wallet} Ccoin`, inline: true },
          { name: '💎 کریستال', value: `${user.crystals}`, inline: true }
        );
      
      // Create competitive games buttons - با منطق رنگی برای بازی‌های رقابتی
      // Row 1 (first set of 3 games)
      const competitiveGameRow1 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('game:dice_duel:start')
            .setLabel('🎲 تاس دو نفره')
            .setStyle(ButtonStyle.Primary), // آبی برای بازی‌های شانسی کلاسیک
          new ButtonBuilder()
            .setCustomId('game:duel:start')
            .setLabel('⚔️ دوئل')
            .setStyle(ButtonStyle.Danger), // قرمز برای بازی‌های مبارزه‌ای
          new ButtonBuilder()
            .setCustomId('game:quick_poker:start')
            .setLabel('🃏 پوکر سریع')
            .setStyle(ButtonStyle.Primary) // آبی برای بازی‌های کارتی
        );
        
      // Row 2 (second set of 3 games)
      const competitiveGameRow2 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('game:type_race:start')
            .setLabel('⌨️ مسابقه سرعت تایپ')
            .setStyle(ButtonStyle.Success), // سبز برای بازی‌های مهارتی
          new ButtonBuilder()
            .setCustomId('game:dart:start')
            .setLabel('🎯 دارت رقابتی')
            .setStyle(ButtonStyle.Success), // سبز برای بازی‌های دقت و مهارت
          new ButtonBuilder()
            .setCustomId('game:mafia:start')
            .setLabel('🕵️‍♂️ مافیا (جدید)')
            .setStyle(ButtonStyle.Danger) // قرمز برای بازی‌های استراتژیک و مخفی‌کاری
        );

      // Row 3 (third set of 3 games)
      const competitiveGameRow3 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('game:bomb:start')
            .setLabel('💣 بمب زمان‌دار (جدید)')
            .setStyle(ButtonStyle.Danger), // قرمز برای بازی‌های پرهیجان
          new ButtonBuilder()
            .setCustomId('game:penalty:start')
            .setLabel('⚽ پنالتی شانس (جدید)')
            .setStyle(ButtonStyle.Primary), // آبی برای بازی‌های ورزشی
          new ButtonBuilder()
            .setCustomId('game:archery:start')
            .setLabel('🏹 تیراندازی هدف (جدید)')
            .setStyle(ButtonStyle.Success) // سبز برای بازی‌های دقت
        );
      
      // Row 4 (rankings and back button)
      const competitiveGameRow4 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('game:rankings:view')
            .setLabel('📊 رتبه‌بندی بازی‌ها')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('menu')
            .setLabel('🔙 بازگشت')
            .setStyle(ButtonStyle.Secondary)
        );
      
      // Send the competitive games menu
      if (interaction.deferred) {
        await interaction.editReply({ embeds: [embed], components: [competitiveGameRow1, competitiveGameRow2, competitiveGameRow3, competitiveGameRow4] });
      } else if (followUp) {
        await interaction.followUp({ embeds: [embed], components: [competitiveGameRow1, competitiveGameRow2, competitiveGameRow3, competitiveGameRow4], ephemeral: true });
      } else if ('update' in interaction && typeof interaction.update === 'function') {
        try {
          await interaction.update({ embeds: [embed], components: [competitiveGameRow1, competitiveGameRow2, competitiveGameRow3, competitiveGameRow4] });
        } catch (e) {
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ embeds: [embed], components: [competitiveGameRow1, competitiveGameRow2, competitiveGameRow3, competitiveGameRow4], ephemeral: true });
          } else {
            await interaction.followUp({ embeds: [embed], components: [competitiveGameRow1, competitiveGameRow2, competitiveGameRow3, competitiveGameRow4], ephemeral: true });
          }
        }
      } else {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ embeds: [embed], components: [competitiveGameRow1, competitiveGameRow2, competitiveGameRow3, competitiveGameRow4], ephemeral: true });
        } else {
          await interaction.followUp({ embeds: [embed], components: [competitiveGameRow1, competitiveGameRow2, competitiveGameRow3, competitiveGameRow4], ephemeral: true });
        }
      }
    } else if (state === 'group') {
      // Group games not implemented yet
      const notImplementedMessage = '🔜 بازی‌های گروهی در به‌روزرسانی‌های آینده اضافه خواهند شد!';
      
      if (interaction.deferred) {
        await interaction.editReply({ content: notImplementedMessage });
      } else if (interaction.replied) {
        await interaction.followUp({ content: notImplementedMessage, ephemeral: true });
      } else {
        await interaction.reply({ content: notImplementedMessage, ephemeral: true });
      }
      
      // Return to main games menu
      setTimeout(async () => {
        try {
          if (interaction.deferred) {
            await interaction.editReply({ embeds: [embed], components: [row1, row2] });
          } else if (followUp) {
            await interaction.followUp({ embeds: [embed], components: [row1, row2], ephemeral: true });
          } else if ('update' in interaction && typeof interaction.update === 'function') {
            await interaction.update({ embeds: [embed], components: [row1, row2] });
          }
        } catch (e) {
          console.error("Error returning to main games menu:", e);
        }
      }, 2000);
    } else {
      // Main games menu
      if (interaction.deferred) {
        await interaction.editReply({ embeds: [embed], components: [row1, row2] });
      } else if (followUp) {
        await interaction.followUp({ embeds: [embed], components: [row1, row2], ephemeral: true });
      } else if ('update' in interaction && typeof interaction.update === 'function') {
        try {
          await interaction.update({ embeds: [embed], components: [row1, row2] });
        } catch (e) {
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ embeds: [embed], components: [row1, row2], ephemeral: true });
          } else {
            await interaction.followUp({ embeds: [embed], components: [row1, row2], ephemeral: true });
          }
        }
      } else {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ embeds: [embed], components: [row1, row2], ephemeral: true });
        } else {
          await interaction.followUp({ embeds: [embed], components: [row1, row2], ephemeral: true });
        }
      }
    }
    
  } catch (error) {
    console.error('Error in games menu:', error);
    
    try {
      const errorMessage = '❌ متأسفانه در نمایش منوی بازی‌ها خطایی رخ داد! لطفاً دوباره تلاش کنید.';
      
      if (interaction.deferred) {
        await interaction.editReply({ content: errorMessage });
      } else if (interaction.replied) {
        await interaction.followUp({ content: errorMessage, ephemeral: true });
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    } catch (e) {
      console.error('Error handling games menu failure:', e);
    }
  }
}