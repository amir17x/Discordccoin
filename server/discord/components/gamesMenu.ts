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
import { getActiveGamesCount, getActivePlayers } from './groupGames';

// Function to create and send the games menu
export async function gamesMenu(
  interaction: ButtonInteraction | MessageComponentInteraction,
  followUp: boolean = false,
  state: string = 'main'
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
      .setThumbnail('https://img.icons8.com/fluency/48/joystick.png') // آیکون joystick برای بخش بازی ها
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
          .setCustomId('wheel')
          .setLabel('🎡 گردونه شانس')
          .setStyle(ButtonStyle.Secondary) // خاکستری برای بخش‌های در حال توسعه
      );
      
    const soloGameRow3 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('menu')
          .setLabel('🔙 بازگشت')
          .setStyle(ButtonStyle.Secondary)
      );
    
    // اگر حالت از پارامتر ورودی تعیین نشده باشد، بر اساس customId آن را تعیین کن
    // در غیر این صورت از پارامتر وارد شده استفاده کن
    if (state === 'main') {
      // Check what custom ID we have to determine state
      const customId = interaction.customId;
      if (customId === 'solo_games') {
        state = 'solo';
      } else if (customId === 'competitive_games') {
        state = 'competitive';
      } else if (customId === 'group_games') {
        state = 'group';
      }
    }
    
    // Send the appropriate menu based on the state
    if (state === 'solo') {
      // تغییر رنگ و توضیحات منوی بازی‌های تک‌نفره
      embed.setColor('#27AE60') // رنگ سبز برای بازی‌های تک‌نفره (ساده و سرگرم‌کننده)
        .setTitle('🎮 بازی‌های تک‌نفره')
        .setDescription('🌟 سرگرمی و هیجان بدون نیاز به رقیب! بازی کنید و Ccoin به دست آورید 🎲')
        .setThumbnail('https://img.icons8.com/fluency/48/joystick.png'); // آیکون joystick برای بازی‌های تک‌نفره

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
        .setThumbnail('https://img.icons8.com/fluency/48/joystick.png') // آیکون joystick برای بازی‌های رقابتی
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
            .setCustomId('game:quiz:start')
            .setLabel('❓ اطلاعات عمومی')
            .setStyle(ButtonStyle.Primary) // آبی برای بازی‌های دانشی رقابتی
        );

      // Row 3 (third set of 3 games)
      const competitiveGameRow3 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('game:bomb:start')
            .setLabel('💣 بمب زمان‌دار')
            .setStyle(ButtonStyle.Danger), // قرمز برای بازی‌های پرهیجان
          new ButtonBuilder()
            .setCustomId('game:penalty:start')
            .setLabel('⚽ پنالتی شانس')
            .setStyle(ButtonStyle.Primary), // آبی برای بازی‌های ورزشی
          new ButtonBuilder()
            .setCustomId('game:archery:start')
            .setLabel('🏹 تیراندازی هدف')
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
      // Group games menu - با رنگ بنفش برای بازی‌های گروهی (دوستانه و جمعی)
      // تعداد کل جلسات فعال بازی و بازیکنان حاضر
      const activeSessions = getActiveGamesCount();
      const activePlayerCount = getActivePlayers().length;
      
      embed.setColor('#9B59B6') // رنگ بنفش برای بازی‌های گروهی
        .setTitle('👥 بازی‌های گروهی')
        .setDescription('🎮 سرگرمی دسته‌جمعی با دوستان و اعضای سرور! 🎉')
        .setThumbnail('https://img.icons8.com/fluency/48/joystick.png') // آیکون joystick برای بازی‌های گروهی
        .setFields(
          { name: '📝 توضیحات', value: 'بازی‌های گروهی برای 3 تا 10 نفر طراحی شده‌اند. هیچ هزینه‌ای برای شرکت در این بازی‌ها نیاز نیست و هدف اصلی سرگرمی است.', inline: false },
          { name: '💰 موجودی', value: `${user.wallet} Ccoin`, inline: true },
          { name: '👥 بازیکنان حاضر', value: `${activePlayerCount} بازیکن`, inline: true },
          { name: '🎲 کل جلسات فعال', value: `${activeSessions} جلسه`, inline: true }
        );
      
      // Create group games buttons - با منطق رنگی برای بازی‌های گروهی
      const groupGameRow1 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('mafia')
            .setLabel('🕵️‍♂️ مافیا')
            .setStyle(ButtonStyle.Danger), // قرمز برای بازی‌های مبارزه‌ای
          new ButtonBuilder()
            .setCustomId('game:werewolf:create')
            .setLabel('🐺 گرگینه')
            .setStyle(ButtonStyle.Danger), // قرمز برای بازی‌های مبارزه‌ای
          new ButtonBuilder()
            .setCustomId('game:spyfall:create')
            .setLabel('🕴️ جاسوس مخفی')
            .setStyle(ButtonStyle.Primary) // آبی برای بازی‌های کارتی
        );
        
      const groupGameRow2 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('game:quiz:create')
            .setLabel('❓ مسابقه اطلاعات عمومی')
            .setStyle(ButtonStyle.Success), // سبز برای بازی‌های دانشی
          new ButtonBuilder()
            .setCustomId('kings')
            .setLabel('👑 کوییز آو کینگز')
            .setStyle(ButtonStyle.Success), // سبز برای بازی‌های دانشی
          new ButtonBuilder()
            .setCustomId('game:uno:create')
            .setLabel('🃏 اونو')
            .setStyle(ButtonStyle.Primary) // آبی برای بازی‌های کارتی
        );
      
      const groupGameRow3 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('truth_or_dare')
            .setLabel('🎯 جرات یا حقیقت')
            .setStyle(ButtonStyle.Primary), // آبی برای بازی‌های اجتماعی
          new ButtonBuilder()
            .setCustomId('word_chain')
            .setLabel('📝 زنجیره کلمات')
            .setStyle(ButtonStyle.Success), // سبز برای بازی‌های فکری
          new ButtonBuilder()
            .setCustomId('game:pictionary:create')
            .setLabel('🎨 نقاشی حدس بزن')
            .setStyle(ButtonStyle.Success) // سبز برای بازی‌های خلاقانه
        );
      
      const groupGameRow4 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('game:active_sessions')
            .setLabel('🎮 جلسات فعال')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('menu')
            .setLabel('🔙 بازگشت')
            .setStyle(ButtonStyle.Secondary)
        );
      
      // Send the group games menu
      if (interaction.deferred) {
        await interaction.editReply({ embeds: [embed], components: [groupGameRow1, groupGameRow2, groupGameRow3, groupGameRow4] });
      } else if (followUp) {
        await interaction.followUp({ embeds: [embed], components: [groupGameRow1, groupGameRow2, groupGameRow3, groupGameRow4], ephemeral: true });
      } else if ('update' in interaction && typeof interaction.update === 'function') {
        try {
          await interaction.update({ embeds: [embed], components: [groupGameRow1, groupGameRow2, groupGameRow3, groupGameRow4] });
        } catch (e) {
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ embeds: [embed], components: [groupGameRow1, groupGameRow2, groupGameRow3, groupGameRow4], ephemeral: true });
          } else {
            await interaction.followUp({ embeds: [embed], components: [groupGameRow1, groupGameRow2, groupGameRow3, groupGameRow4], ephemeral: true });
          }
        }
      } else {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ embeds: [embed], components: [groupGameRow1, groupGameRow2, groupGameRow3, groupGameRow4], ephemeral: true });
        } else {
          await interaction.followUp({ embeds: [embed], components: [groupGameRow1, groupGameRow2, groupGameRow3, groupGameRow4], ephemeral: true });
        }
      }
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