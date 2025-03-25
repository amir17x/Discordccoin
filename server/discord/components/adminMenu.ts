import { 
  ButtonInteraction, 
  CommandInteraction, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder, 
  Message,
  ChatInputCommandInteraction,
  MessageComponentInteraction,
  ModalSubmitInteraction,
  PermissionFlagsBits,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  User,
  UserResolvable
} from 'discord.js';
import { storage } from '../../storage';
import { botConfig } from '../utils/config';

// Admin Panel Menu
export async function adminMenu(
  interaction: CommandInteraction | ButtonInteraction | MessageComponentInteraction | ModalSubmitInteraction,
  category: string = 'main'
) {
  try {
    // Check if user has permission
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({
        content: '⛔ شما دسترسی لازم برای استفاده از پنل ادمین را ندارید!',
        ephemeral: true
      });
      return;
    }

    // Create the admin embed
    const embed = new EmbedBuilder()
      .setColor('#FF5733')
      .setTitle('⚙️ پنل مدیریت ربات Ccoin')
      .setDescription('به پنل مدیریت ربات خوش آمدید! لطفاً بخش مورد نظر را انتخاب کنید')
      .setFooter({ text: `مدیر: ${interaction.user.username} | ${new Date().toLocaleString()}` })
      .setThumbnail('https://img.icons8.com/fluency/48/user-shield.png') // آیکون user-shield برای پنل ادمین
      .setTimestamp();

    let components = [];

    if (category === 'main') {
      // Main admin menu
      const row1 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('admin_economy')
            .setLabel('💰 مدیریت اقتصاد')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('admin_users')
            .setLabel('👥 مدیریت کاربران')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('admin_items')
            .setLabel('🛒 مدیریت آیتم‌ها')
            .setStyle(ButtonStyle.Danger),
        );

      const row2 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('admin_quests')
            .setLabel('🎯 مدیریت ماموریت‌ها')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('admin_clans')
            .setLabel('🏰 مدیریت کلن‌ها')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('admin_stats')
            .setLabel('📊 آمار ربات')
            .setStyle(ButtonStyle.Secondary),
        );

      const row3 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('admin_settings')
            .setLabel('⚙️ تنظیمات')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('admin_broadcast')
            .setLabel('📢 اطلاع‌رسانی')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId('admin_backup')
            .setLabel('💾 پشتیبان‌گیری')
            .setStyle(ButtonStyle.Success),
        );

      components = [row1, row2, row3];
      
      // Add stats to the embed
      const totalUsers = await getTotalUsers();
      const totalCoins = await getTotalCoins();
      const totalItems = await getTotalItems();
      
      embed.addFields(
        { name: '👥 تعداد کاربران', value: `${totalUsers}`, inline: true },
        { name: '💰 مجموع سکه‌ها', value: `${totalCoins} Ccoin`, inline: true },
        { name: '🛒 تعداد آیتم‌ها', value: `${totalItems}`, inline: true }
      );
      
    } else if (category === 'economy') {
      // Economy management
      embed.setTitle('💰 مدیریت اقتصاد')
        .setDescription('در این بخش می‌توانید اقتصاد ربات را مدیریت کنید');
      
      const row1 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('admin_add_coin')
            .setLabel('➕ افزودن سکه')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('admin_remove_coin')
            .setLabel('➖ کاهش سکه')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId('admin_distribute')
            .setLabel('🔄 توزیع سکه')
            .setStyle(ButtonStyle.Primary),
        );
        
      const row2 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('admin_set_interest')
            .setLabel('📈 تنظیم نرخ سود')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('admin_set_tax')
            .setLabel('💸 تنظیم مالیات')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('admin_reset_economy')
            .setLabel('🔄 ریست اقتصاد')
            .setStyle(ButtonStyle.Danger),
        );
        
      const row3 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('admin_menu')
            .setLabel('🔙 بازگشت')
            .setStyle(ButtonStyle.Secondary),
        );
        
      components = [row1, row2, row3];
      
    } else if (category === 'users') {
      // User management
      embed.setTitle('👥 مدیریت کاربران')
        .setDescription('در این بخش می‌توانید کاربران ربات را مدیریت کنید');
      
      const row1 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('admin_search_user')
            .setLabel('🔍 جستجوی کاربر')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('admin_ban_user')
            .setLabel('🚫 مسدود کردن کاربر')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId('admin_reset_user')
            .setLabel('🔄 ریست کاربر')
            .setStyle(ButtonStyle.Primary),
        );
        
      const row2 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('admin_top_users')
            .setLabel('🏆 کاربران برتر')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('admin_inactive_users')
            .setLabel('⏰ کاربران غیرفعال')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('admin_user_logs')
            .setLabel('📝 لاگ کاربران')
            .setStyle(ButtonStyle.Secondary),
        );
        
      const row3 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('admin_menu')
            .setLabel('🔙 بازگشت')
            .setStyle(ButtonStyle.Secondary),
        );
        
      components = [row1, row2, row3];
      
    } else if (category === 'items') {
      // Item management
      embed.setTitle('🛒 مدیریت آیتم‌ها')
        .setDescription('در این بخش می‌توانید آیتم‌های فروشگاه را مدیریت کنید');
      
      const row1 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('admin_add_item')
            .setLabel('➕ افزودن آیتم')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('admin_edit_item')
            .setLabel('✏️ ویرایش آیتم')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('admin_remove_item')
            .setLabel('🗑️ حذف آیتم')
            .setStyle(ButtonStyle.Danger),
        );
        
      const row2 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('admin_list_items')
            .setLabel('📋 لیست آیتم‌ها')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('admin_item_stats')
            .setLabel('📊 آمار فروش')
            .setStyle(ButtonStyle.Primary),
        );
        
      const row3 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('admin_menu')
            .setLabel('🔙 بازگشت')
            .setStyle(ButtonStyle.Secondary),
        );
        
      components = [row1, row2, row3];
      
    } else if (category === 'stats') {
      // Bot statistics
      // Calculate statistics
      const totalUsers = await getTotalUsers();
      const totalCoins = await getTotalCoins();
      const totalItems = await getTotalItems();
      const activePlayers = await getActivePlayers(); // Users active in last 7 days
      const topGames = await getTopGames(); // Most played games
      
      embed.setTitle('📊 آمار ربات')
        .setDescription('آمار و اطلاعات ربات')
        .addFields(
          { name: '👥 تعداد کاربران', value: `${totalUsers}`, inline: true },
          { name: '💰 مجموع سکه‌ها', value: `${totalCoins} Ccoin`, inline: true },
          { name: '🛒 تعداد آیتم‌ها', value: `${totalItems}`, inline: true },
          { name: '🎮 کاربران فعال (7 روز اخیر)', value: `${activePlayers}`, inline: true },
          { name: '🎯 محبوب‌ترین بازی‌ها', value: topGames, inline: true },
          { name: '⏱️ آپتایم ربات', value: getBotUptime(), inline: true }
        );
      
      const row1 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('admin_economy_stats')
            .setLabel('💰 آمار اقتصادی')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('admin_game_stats')
            .setLabel('🎮 آمار بازی‌ها')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('admin_user_stats')
            .setLabel('👥 آمار کاربران')
            .setStyle(ButtonStyle.Danger),
        );
        
      const row2 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('admin_export_stats')
            .setLabel('📤 خروجی آمار')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('admin_menu')
            .setLabel('🔙 بازگشت')
            .setStyle(ButtonStyle.Secondary),
        );
        
      components = [row1, row2];
    } else if (category === 'settings') {
      // Settings menu
      embed.setTitle('⚙️ تنظیمات')
        .setDescription('در این بخش می‌توانید تنظیمات ربات را مدیریت کنید');
      
      const row1 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('admin_logs_settings')
            .setLabel('📝 تنظیمات لاگ‌ها')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('admin_bot_settings')
            .setLabel('🤖 تنظیمات ربات')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('admin_economy_settings')
            .setLabel('💰 تنظیمات اقتصادی')
            .setStyle(ButtonStyle.Danger),
        );
        
      const row2 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('admin_permissions')
            .setLabel('🔒 دسترسی‌ها')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('admin_menu')
            .setLabel('🔙 بازگشت')
            .setStyle(ButtonStyle.Secondary),
        );
        
      components = [row1, row2];
    } else if (category === 'logs_settings') {
      // Logs settings menu
      embed.setTitle('📝 تنظیمات لاگ‌ها')
        .setDescription('در این بخش می‌توانید کانال‌های مختلف لاگ را تنظیم کنید')
        .addFields(
          { name: '💰 لاگ تراکنش‌ها', value: 'مشاهده تمام تراکنش‌های مالی کاربران', inline: true },
          { name: '🎮 لاگ بازی‌ها', value: 'مشاهده تمام بازی‌های انجام شده', inline: true },
          { name: '👤 لاگ کاربران', value: 'فعالیت‌های کاربران (ورود، خروج، و غیره)', inline: true },
          { name: '⚙️ لاگ ادمین', value: 'عملیات‌های انجام شده توسط مدیران', inline: true },
          { name: '🔒 لاگ امنیتی', value: 'هشدارهای امنیتی و فعالیت‌های مشکوک', inline: true },
          { name: '⚠️ لاگ خطاها', value: 'خطاهای سیستمی ربات', inline: true }
        );
      
      const row1 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('admin_set_transaction_log')
            .setLabel('💰 تنظیم لاگ تراکنش‌ها')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('admin_set_game_log')
            .setLabel('🎮 تنظیم لاگ بازی‌ها')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('admin_set_user_log')
            .setLabel('👤 تنظیم لاگ کاربران')
            .setStyle(ButtonStyle.Primary),
        );
        
      const row2 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('admin_set_admin_log')
            .setLabel('⚙️ تنظیم لاگ ادمین')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('admin_set_security_log')
            .setLabel('🔒 تنظیم لاگ امنیتی')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('admin_set_error_log')
            .setLabel('⚠️ تنظیم لاگ خطاها')
            .setStyle(ButtonStyle.Primary),
        );
        
      const row3 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('admin_set_default_log')
            .setLabel('📌 تنظیم کانال پیش‌فرض')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('admin_test_logs')
            .setLabel('🧪 تست لاگ‌ها')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('admin_settings')
            .setLabel('🔙 بازگشت')
            .setStyle(ButtonStyle.Secondary),
        );
        
      components = [row1, row2, row3];
    } else {
      // Default to main menu if category not recognized
      return adminMenu(interaction, 'main');
    }

    // Send or update the message
    if (interaction.deferred) {
      await interaction.editReply({ embeds: [embed], components: components });
    } else if (interaction instanceof ChatInputCommandInteraction) {
      if (!interaction.replied) {
        await interaction.reply({ embeds: [embed], components: components, ephemeral: true });
      } else {
        await interaction.followUp({ embeds: [embed], components: components, ephemeral: true });
      }
    } else if ('update' in interaction && typeof interaction.update === 'function') {
      try {
        await interaction.update({ embeds: [embed], components: components });
      } catch (e) {
        // If update fails (might be due to deferred interaction), send a new message
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ embeds: [embed], components: components, ephemeral: true });
        } else {
          await interaction.followUp({ embeds: [embed], components: components, ephemeral: true });
        }
      }
    } else {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ embeds: [embed], components: components, ephemeral: true });
      } else {
        await interaction.followUp({ embeds: [embed], components: components, ephemeral: true });
      }
    }
  } catch (error) {
    console.error('Error in admin menu:', error);
    
    try {
      const errorMessage = 'متاسفانه در نمایش پنل ادمین خطایی رخ داد! لطفاً دوباره تلاش کنید.';
      
      if (interaction.deferred) {
        await interaction.editReply({ content: errorMessage });
      } else if (interaction.replied) {
        await interaction.followUp({ content: errorMessage, ephemeral: true });
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    } catch (e) {
      console.error('Error handling admin menu failure:', e);
    }
  }
}

// Helper functions for statistics
async function getTotalUsers(): Promise<number> {
  try {
    const users = await storage.getAllUsers();
    return users.length;
  } catch (error) {
    console.error('Error getting total users:', error);
    return 0;
  }
}

async function getTotalCoins(): Promise<number> {
  try {
    const users = await storage.getAllUsers();
    let total = 0;
    
    for (const user of users) {
      total += user.wallet + user.bank;
    }
    
    return total;
  } catch (error) {
    console.error('Error getting total coins:', error);
    return 0;
  }
}

async function getTotalItems(): Promise<number> {
  try {
    const items = await storage.getAllItems();
    return items.length;
  } catch (error) {
    console.error('Error getting total items:', error);
    return 0;
  }
}

async function getActivePlayers(): Promise<number> {
  try {
    const users = await storage.getAllUsers();
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    let activeCount = 0;
    
    for (const user of users) {
      const lastActive = user.lastDaily ? new Date(user.lastDaily) : null;
      if (lastActive && lastActive > sevenDaysAgo) {
        activeCount++;
      }
    }
    
    return activeCount;
  } catch (error) {
    console.error('Error getting active players:', error);
    return 0;
  }
}

async function getTopGames(): Promise<string> {
  try {
    const users = await storage.getAllUsers();
    // This is a placeholder - actual implementation would involve tracking game plays
    // and retrieving the most popular ones
    return "شیر یا خط، تاس، سنگ کاغذ قیچی";
  } catch (error) {
    console.error('Error getting top games:', error);
    return "داده‌ای موجود نیست";
  }
}

function getBotUptime(): string {
  const uptime = process.uptime();
  const days = Math.floor(uptime / (24 * 60 * 60));
  const hours = Math.floor((uptime % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((uptime % (60 * 60)) / 60);
  
  if (days > 0) {
    return `${days} روز، ${hours} ساعت`;
  } else {
    return `${hours} ساعت، ${minutes} دقیقه`;
  }
}

// Additional helper functions for admin operations can be added here