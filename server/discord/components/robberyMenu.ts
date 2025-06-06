import { 
  ButtonInteraction, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder,
  MessageComponentInteraction,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} from 'discord.js';
import { storage } from '../../storage';
import { botConfig } from '../utils/config';

// Constants - با توجه به مستندات بخش دزدی
const ROB_COOLDOWN = 4 * 60 * 60 * 1000; // 4 hours
const MAX_ROB_AMOUNT = 100; // حداکثر مقدار دزدی (100 سکه)
const PENALTY_AMOUNT = 200; // مقدار جریمه در صورت شکست (200 سکه)
const BASE_SUCCESS_RATE = 0.4; // نرخ موفقیت پایه (40%)

// Function to create and send the robbery menu
export async function robberyMenu(
  interaction: ButtonInteraction | MessageComponentInteraction,
  followUp: boolean = false
) {
  try {
    // Check if user exists
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      await interaction.reply({
        content: 'شما ابتدا باید یک حساب ایجاد کنید. از دستور /menu استفاده کنید.',
        ephemeral: true
      });
      return;
    }
    
    // Check cooldown
    const now = new Date();
    const lastRob = user.lastRob ? new Date(user.lastRob) : null;
    const canRob = !lastRob || (now.getTime() - lastRob.getTime() >= ROB_COOLDOWN);
    
    // Calculate cooldown time if applicable
    let cooldownText = '';
    if (!canRob && lastRob) {
      const nextRob = new Date(lastRob.getTime() + ROB_COOLDOWN);
      const hours = Math.floor((nextRob.getTime() - now.getTime()) / (60 * 60 * 1000));
      const minutes = Math.floor(((nextRob.getTime() - now.getTime()) % (60 * 60 * 1000)) / (60 * 1000));
      
      cooldownText = `⏳ زمان باقیمانده تا سرقت بعدی: ${hours}h ${minutes}m`;
    }
    
    // Get all users for target selection
    const allUsers = await storage.getAllUsers();
    
    // Filter out the current user and empty wallets
    const possibleTargets = allUsers.filter(u => 
      u.id !== user.id && 
      u.wallet > 0
    ).sort((a, b) => b.wallet - a.wallet).slice(0, 10); // Top 10 richest users
    
    // Create the robbery embed with thief image
    const embed = new EmbedBuilder()
      .setColor('#800080') // رنگ بنفش طبق مستندات
      .setTitle('🕵️ بخش دزدی')
      .setDescription('از کاربران دیگر سکه بدزدید و موجودی خود را افزایش دهید!\nاما مراقب باشید، اگر دستگیر شوید، جریمه خواهید شد!')
      .setThumbnail('https://img.icons8.com/fluency/48/radar.png') // آیکون radar برای بخش دزدی
      .addFields(
        { name: '✨ نرخ موفقیت پایه', value: `${BASE_SUCCESS_RATE * 100}%`, inline: true },
        { name: '🔒 قفل زمانی', value: `${canRob ? '✅ آماده برای دزدی!' : cooldownText}`, inline: true },
        { name: '👛 موجودی شما', value: `${user.wallet} Ccoin`, inline: true }
      )
      .setFooter({ text: `توجه: در صورت شکست، ${PENALTY_AMOUNT} Ccoin جریمه خواهید شد!` })
      .setTimestamp();
    
    // Create action buttons for robbery menu with simplified mechanism
    const row1 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('rob_radar')
          .setLabel('📡 رادار')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(!canRob),
        new ButtonBuilder()
          .setCustomId('rob_stats')
          .setLabel('📊 آماردزدی')
          .setStyle(ButtonStyle.Secondary)
      );
      
    // Add help and items buttons in another row  
    const rowMechanisms = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('rob_help')
          .setLabel('📘 راهنمای دزدی')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('rob_items')
          .setLabel('🛡️ آیتم‌های دزدی')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('rob_disguise')
          .setLabel('🎭 تغییر چهره')
          .setStyle(ButtonStyle.Danger)
          .setDisabled(!canRob)
      );
    
    // Create back button
    const row2 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('economy')
          .setLabel('🔙 بازگشت')
          .setStyle(ButtonStyle.Secondary)
      );
    
    // Components to show - simplified to only necessary buttons
    const components: ActionRowBuilder<ButtonBuilder>[] = [row1, rowMechanisms, row2];
    
    // Send the robbery menu
    if (followUp) {
      await interaction.followUp({ embeds: [embed], components, ephemeral: true });
    } else {
      await interaction.update({ embeds: [embed], components });
    }
    
  } catch (error) {
    console.error('Error in robbery menu:', error);
    
    try {
      if (followUp) {
        await interaction.followUp({
          content: 'متأسفانه در نمایش منوی سرقت خطایی رخ داد!',
          ephemeral: true
        });
      } else {
        if ('update' in interaction && typeof interaction.update === 'function') {
          try {
            await interaction.update({
              content: 'متأسفانه در نمایش منوی سرقت خطایی رخ داد!',
              components: [],
              embeds: []
            });
          } catch (e) {
            await interaction.reply({
              content: 'متأسفانه در نمایش منوی سرقت خطایی رخ داد!',
              ephemeral: true
            });
          }
        } else {
          await interaction.reply({
            content: 'متأسفانه در نمایش منوی سرقت خطایی رخ داد!',
            ephemeral: true
          });
        }
      }
    } catch (e) {
      console.error('Error handling robbery menu failure:', e);
    }
  }
}

// تابع نمایش مودال انتخاب هدف برای دزدی - مشابه انتقال سکه
export async function selectRobberyTarget(interaction: ButtonInteraction | MessageComponentInteraction) {
  try {
    // Check if user exists
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      if ('update' in interaction && typeof interaction.update === 'function') {
        try {
          await interaction.update({
            content: '⚠️ حساب کاربری شما یافت نشد!',
            components: [],
            embeds: []
          });
        } catch (e) {
          await interaction.reply({
            content: '⚠️ حساب کاربری شما یافت نشد!',
            ephemeral: true
          });
        }
      } else {
        await interaction.reply({
          content: '⚠️ حساب کاربری شما یافت نشد!',
          ephemeral: true
        });
      }
      return;
    }
    
    // بررسی کولدان دزدی
    const now = new Date();
    const lastRob = user.lastRob ? new Date(user.lastRob) : null;
    const canRob = !lastRob || (now.getTime() - lastRob.getTime() >= ROB_COOLDOWN);
    
    if (!canRob) {
      const nextRob = new Date(lastRob!.getTime() + ROB_COOLDOWN);
      const hours = Math.floor((nextRob.getTime() - now.getTime()) / (60 * 60 * 1000));
      const minutes = Math.floor(((nextRob.getTime() - now.getTime()) % (60 * 60 * 1000)) / (60 * 1000));
      
      if ('update' in interaction && typeof interaction.update === 'function') {
        try {
          await interaction.update({
            content: `⏳ باید ${hours}h ${minutes}m صبر کنید تا بتوانید دوباره سرقت کنید.`,
            components: [],
            embeds: []
          });
        } catch (e) {
          await interaction.reply({
            content: `⏳ باید ${hours}h ${minutes}m صبر کنید تا بتوانید دوباره سرقت کنید.`,
            ephemeral: true
          });
        }
      } else {
        await interaction.reply({
          content: `⏳ باید ${hours}h ${minutes}m صبر کنید تا بتوانید دوباره سرقت کنید.`,
          ephemeral: true
        });
      }
      return;
    }
    
    // محاسبه شانس موفقیت دزدی بر اساس آیتم‌های کاربر و عوامل دیگر
    let successRate = BASE_SUCCESS_RATE;
    
    // بررسی آیتم‌های انبار کاربر که روی شانس دزدی تأثیر می‌گذارند
    const inventory = await storage.getInventoryItems(user.id);
    for (const item of inventory) {
      // @ts-ignore - This is a valid property in ItemEffects
      if (item.item.effects?.robberyChance) {
        // @ts-ignore - This is a valid property in ItemEffects
        successRate += item.item.effects.robberyChance;
      }
    }
    
    // ایجاد مودال انتخاب هدف دزدی
    const modal = new ModalBuilder()
      .setCustomId('robbery_target_modal')
      .setTitle('🎯 انتخاب هدف دزدی');
    
    // فیلد وارد کردن آی‌دی دیسکورد کاربر هدف
    const targetIdInput = new TextInputBuilder()
      .setCustomId('target_id')
      .setLabel('آی‌دی دیسکورد کاربر هدف')
      .setPlaceholder('مثال: 123456789012345678')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMinLength(5)
      .setMaxLength(20);
    
    // فیلد نمایش اطلاعات (فقط نمایشی، غیرقابل ویرایش)
    const infoInput = new TextInputBuilder()
      .setCustomId('info')
      .setLabel('اطلاعات دزدی')
      .setValue(`مقدار قابل دزدی: حداکثر ${MAX_ROB_AMOUNT} Ccoin\nشانس موفقیت: ${Math.floor(successRate * 100)}%\nجریمه شکست: ${PENALTY_AMOUNT} Ccoin`)
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false)
      .setMinLength(1)
      .setMaxLength(200);
    
    // اضافه کردن فیلدها به مودال
    const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(targetIdInput);
    const secondRow = new ActionRowBuilder<TextInputBuilder>().addComponents(infoInput);
    
    modal.addComponents(firstRow, secondRow);
    
    // نمایش مودال به کاربر
    await interaction.showModal(modal);
    
  } catch (error) {
    console.error('Error in robbery target modal:', error);
    
    if ('update' in interaction && typeof interaction.update === 'function') {
      try {
        await interaction.update({
          content: '❌ متأسفانه در نمایش فرم انتخاب هدف دزدی خطایی رخ داد!',
          components: [],
          embeds: []
        });
      } catch (e) {
        await interaction.reply({
          content: '❌ متأسفانه در نمایش فرم انتخاب هدف دزدی خطایی رخ داد!',
          ephemeral: true
        });
      }
    } else {
      await interaction.reply({
        content: '❌ متأسفانه در نمایش فرم انتخاب هدف دزدی خطایی رخ داد!',
        ephemeral: true
      });
    }
  }
}

// Function to handle the robbery attempt
export async function handleRobbery(
  interaction: MessageComponentInteraction,
  targetId: number
) {
  try {
    // Check if user exists
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      if (interaction.update && typeof interaction.update === 'function') {
        try {
          await interaction.update({
            content: 'شما ابتدا باید یک حساب ایجاد کنید. از دستور /menu استفاده کنید.',
            components: [],
            embeds: []
          });
        } catch (e) {
          await interaction.reply({
            content: 'شما ابتدا باید یک حساب ایجاد کنید. از دستور /menu استفاده کنید.',
            ephemeral: true
          });
        }
      } else {
        await interaction.reply({
          content: 'شما ابتدا باید یک حساب ایجاد کنید. از دستور /menu استفاده کنید.',
          ephemeral: true
        });
      }
      return;
    }
    
    // Check cooldown
    const now = new Date();
    const lastRob = user.lastRob ? new Date(user.lastRob) : null;
    const canRob = !lastRob || (now.getTime() - lastRob.getTime() >= ROB_COOLDOWN);
    
    if (!canRob) {
      const nextRob = new Date(lastRob!.getTime() + ROB_COOLDOWN);
      const hours = Math.floor((nextRob.getTime() - now.getTime()) / (60 * 60 * 1000));
      const minutes = Math.floor(((nextRob.getTime() - now.getTime()) % (60 * 60 * 1000)) / (60 * 1000));
      
      if ('update' in interaction && typeof interaction.update === 'function') {
        try {
          await interaction.update({
            content: `باید ${hours}h ${minutes}m صبر کنید تا بتوانید دوباره سرقت کنید.`,
            components: [],
            embeds: []
          });
        } catch (e) {
          await interaction.reply({
            content: `باید ${hours}h ${minutes}m صبر کنید تا بتوانید دوباره سرقت کنید.`,
            ephemeral: true
          });
        }
      } else {
        await interaction.reply({
          content: `باید ${hours}h ${minutes}m صبر کنید تا بتوانید دوباره سرقت کنید.`,
          ephemeral: true
        });
      }
      return;
    }
    
    // Get target user
    const targetUser = await storage.getUser(targetId);
    
    if (!targetUser) {
      if (interaction.update && typeof interaction.update === 'function') {
        try {
          await interaction.update({
            content: 'کاربر هدف پیدا نشد.',
            components: [],
            embeds: []
          });
        } catch (e) {
          await interaction.reply({
            content: 'کاربر هدف پیدا نشد.',
            ephemeral: true
          });
        }
      } else {
        await interaction.reply({
          content: 'کاربر هدف پیدا نشد.',
          ephemeral: true
        });
      }
      return;
    }
    
    // Check if target has money
    if (targetUser.wallet <= 0) {
      if (interaction.update && typeof interaction.update === 'function') {
        try {
          await interaction.update({
            content: `${targetUser.username} هیچ سکه‌ای در کیف پول خود ندارد!`,
            components: [],
            embeds: []
          });
        } catch (e) {
          await interaction.reply({
            content: `${targetUser.username} هیچ سکه‌ای در کیف پول خود ندارد!`,
            ephemeral: true
          });
        }
      } else {
        await interaction.reply({
          content: `${targetUser.username} هیچ سکه‌ای در کیف پول خود ندارد!`,
          ephemeral: true
        });
      }
      return;
    }
    
    // Calculate success rate based on user's items and other factors
    let successRate = BASE_SUCCESS_RATE;
    
    // Check inventory for items that affect robbery chance
    const inventory = await storage.getInventoryItems(user.id);
    for (const item of inventory) {
      // @ts-ignore - This is a valid property in ItemEffects
      if (item.item.effects?.robberyChance) {
        // @ts-ignore - This is a valid property in ItemEffects
        successRate += item.item.effects.robberyChance;
      }
    }
    
    // طبق مستندات، حداکثر مقدار دزدی 100 Ccoin یا کل موجودی کیف پول (هرکدام کمتر باشد)
    const robAmount = Math.min(targetUser.wallet, MAX_ROB_AMOUNT);
    const isSuccessful = Math.random() < successRate;
    
    // Update last rob time
    await storage.updateUser(user.id, { lastRob: now });
    
    if (isSuccessful) {
      // Robbery successful
      await storage.addToWallet(user.id, robAmount, 'steal_success', {
        targetId: targetUser.id,
        targetName: targetUser.username
      });
      
      await storage.addToWallet(targetUser.id, -robAmount, 'steal_victim', {
        sourceId: user.id,
        sourceName: user.username
      });
      
      const successEmbed = new EmbedBuilder()
        .setColor('#4CAF50')
        .setTitle('✅ دزدی موفق!')
        .setDescription(`شما با موفقیت ${robAmount} Ccoin از ${targetUser.username} دزدیدید!`)
        .setThumbnail('https://img.icons8.com/fluency/48/money-transfer.png') // آیکون money-transfer برای دزدی موفق
        .addFields(
          { name: '💰 مقدار دزدیده شده', value: `${robAmount} Ccoin`, inline: true },
          { name: '👛 موجودی جدید شما', value: `${user.wallet + robAmount} Ccoin`, inline: true }
        )
        .setFooter({ text: `${new Date().toLocaleTimeString()}` })
        .setTimestamp();
      
      try {
        await interaction.update({ embeds: [successEmbed], components: [] });
      } catch (updateError) {
        console.error('Error updating robbery success message:', updateError);
        await interaction.followUp({ embeds: [successEmbed], ephemeral: true });
      }
      
      // اطلاع‌رسانی به کاربر هدف
      try {
        const targetMember = await interaction.guild?.members.fetch(targetUser.discordId);
        if (targetMember) {
          const victimEmbed = new EmbedBuilder()
            .setColor('#FF5733')
            .setTitle('⚠️ دزدی!')
            .setDescription(`🕵️ ${interaction.user.username} از کیف پول شما ${robAmount} Ccoin دزدید!`)
            .addFields(
              { name: '👛 موجودی جدید شما', value: `${targetUser.wallet - robAmount} Ccoin`, inline: true },
              { name: '🛡️ محافظت', value: 'برای جلوگیری از دزدی، محافظ دزدی را از فروشگاه بخرید!', inline: false }
            )
            .setTimestamp();
          
          targetMember.send({ embeds: [victimEmbed] }).catch(() => {
            // پیام‌های خصوصی ممکن است برای کاربر غیرفعال باشند، در این صورت خطا را نادیده می‌گیریم
          });
        }
      } catch (notificationError) {
        console.error('Error notifying victim:', notificationError);
      }
      
    } else {
      // Robbery failed - user gets fined with PENALTY_AMOUNT
      await storage.addToWallet(user.id, -PENALTY_AMOUNT, 'steal_failed', {
        targetId: targetUser.id,
        targetName: targetUser.username
      });
      
      const failedEmbed = new EmbedBuilder()
        .setColor('#F44336')
        .setTitle('❌ دزدی ناموفق!')
        .setDescription(`شما هنگام دزدی از ${targetUser.username} دستگیر شدید!`)
        .setThumbnail('https://img.icons8.com/fluency/48/heart-with-pulse.png') // آیکون heart-with-pulse برای دزدی ناموفق
        .addFields(
          { name: '💸 جریمه', value: `${PENALTY_AMOUNT} Ccoin`, inline: true },
          { name: '👛 موجودی جدید شما', value: `${user.wallet - PENALTY_AMOUNT} Ccoin`, inline: true }
        )
        .setFooter({ text: `${new Date().toLocaleTimeString()}` })
        .setTimestamp();
      
      try {
        await interaction.update({ embeds: [failedEmbed], components: [] });
      } catch (updateError) {
        console.error('Error updating robbery failure message:', updateError);
        await interaction.followUp({ embeds: [failedEmbed], ephemeral: true });
      }
    }
    
    // After a delay, return to the robbery menu
    setTimeout(async () => {
      try {
        await robberyMenu(interaction, true);
      } catch (e) {
        console.error('Error returning to robbery menu:', e);
      }
    }, 3000);
    
  } catch (error) {
    console.error('Error in robbery handler:', error);
    
    if (interaction.update && typeof interaction.update === 'function') {
      try {
        await interaction.update({
          content: 'متأسفانه در انجام سرقت خطایی رخ داد!',
          components: [],
          embeds: []
        });
      } catch (e) {
        await interaction.reply({
          content: 'متأسفانه در انجام سرقت خطایی رخ داد!',
          ephemeral: true
        });
      }
    } else {
      await interaction.reply({
        content: 'متأسفانه در انجام سرقت خطایی رخ داد!',
        ephemeral: true
      });
    }
  }
}