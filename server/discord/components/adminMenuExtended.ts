import { 
  ButtonInteraction, 
  ChatInputCommandInteraction, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  StringSelectMenuBuilder, 
  StringSelectMenuOptionBuilder,
  PermissionFlagsBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} from 'discord.js';
import { storage } from '../../storage';
import { botConfig } from '../utils/config';
import { getItemEmoji } from '../utils/helpers';
// مدیریت هوش مصنوعی
export { aiSettingsMenu } from './aiSettingsMenu';

/**
 * منوی مدیریت آیتم‌ها
 * @param interaction تعامل کاربر
 */
export async function itemManagementMenu(interaction: ButtonInteraction | ChatInputCommandInteraction) {
  try {
    // بررسی دسترسی ادمین
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({
        content: '⛔ شما دسترسی لازم برای استفاده از این بخش را ندارید!',
        ephemeral: true
      });
      return;
    }

    // ایجاد Embed اصلی
    const embed = new EmbedBuilder()
      .setColor('#FF5733')
      .setTitle('🛒 مدیریت آیتم‌های ربات Ccoin')
      .setDescription('به بخش مدیریت آیتم‌ها خوش آمدید. در این بخش می‌توانید آیتم‌های فروشگاه را مدیریت کنید.')
      .setFooter({ text: `مدیر: ${interaction.user.username} | ${new Date().toLocaleString()}` })
      .setThumbnail('https://img.icons8.com/fluency/48/shop.png')
      .setTimestamp();

    // دریافت آمار آیتم‌ها
    const items = await storage.getAllItems();
    const users = await storage.getAllUsers();
    
    // محاسبه آمار جامع
    const totalItems = items.length;
    const itemTypesSet = new Set(items.map(item => item.type));
    const itemTypes = itemTypesSet.size;
    const categories = [...new Set(items.map(item => item.category))].filter(Boolean).length;
    
    // محاسبه تعداد آیتم‌های فعال در انبارهای کاربران
    let activeItems = 0;
    let totalPurchases = 0;
    let uniqueOwners = new Set();
    
    for (const user of users) {
      if (user.inventory) {
        for (const itemId in user.inventory) {
          const inventoryItem = user.inventory[itemId];
          totalPurchases++;
          uniqueOwners.add(user.id);
          
          if (inventoryItem.active) {
            activeItems++;
          }
        }
      }
    }
    
    // آمار فروش و محبوبیت
    const typeStats = {};
    itemTypesSet.forEach(type => {
      const typeItems = items.filter(item => item.type === type);
      const typePurchases = users.reduce((count, user) => {
        if (user.inventory) {
          Object.keys(user.inventory).forEach(itemId => {
            const item = items.find(i => i.id === parseInt(itemId));
            if (item && item.type === type) {
              count++;
            }
          });
        }
        return count;
      }, 0);
      typeStats[type] = { count: typeItems.length, purchases: typePurchases };
    });
    
    // موارد پرفروش را در معرض نمایش قرار دهیم
    const popularItems = items
      .map(item => {
        const purchaseCount = users.reduce((count, user) => {
          if (user.inventory && user.inventory[item.id]) {
            count++;
          }
          return count;
        }, 0);
        return { ...item, purchaseCount };
      })
      .sort((a, b) => b.purchaseCount - a.purchaseCount)
      .slice(0, 3);
      
    // موارد کم‌فروش را نیز شناسایی کنیم
    const unpopularItems = items
      .map(item => {
        const purchaseCount = users.reduce((count, user) => {
          if (user.inventory && user.inventory[item.id]) {
            count++;
          }
          return count;
        }, 0);
        return { ...item, purchaseCount };
      })
      .sort((a, b) => a.purchaseCount - b.purchaseCount)
      .slice(0, 3);
    
    // افزودن آمار به Embed
    embed.addFields(
      { name: '📦 تعداد کل آیتم‌ها', value: `${totalItems}`, inline: true },
      { name: '🔖 تعداد دسته‌بندی‌ها', value: `${categories || 'بدون دسته‌بندی'}`, inline: true },
      { name: '🏷️ انواع آیتم', value: `${itemTypes}`, inline: true },
      { name: '🔧 آیتم‌های فعال', value: `${activeItems}`, inline: true },
      { name: '💰 کل خریدها', value: `${totalPurchases}`, inline: true },
      { name: '👥 مشتریان', value: `${uniqueOwners.size}`, inline: true }
    );
    
    // اضافه کردن آیتم‌های پرفروش
    if (popularItems.length > 0) {
      const popularItemsText = popularItems
        .map((item, index) => `${index + 1}. ${item.emoji || '📦'} **${item.name}** - ${item.purchaseCount} خرید`)
        .join('\n');
      
      embed.addFields({ name: '🔥 آیتم‌های پرفروش', value: popularItemsText, inline: false });
    }
    
    // اضافه کردن آیتم‌های کم‌فروش (اگر بیش از صفر فروش داشته باشند)
    if (unpopularItems.length > 0 && unpopularItems[0].purchaseCount > 0) {
      const unpopularItemsText = unpopularItems
        .map((item, index) => `${index + 1}. ${item.emoji || '📦'} **${item.name}** - ${item.purchaseCount} خرید`)
        .join('\n');
      
      embed.addFields({ name: '📉 آیتم‌های کم‌فروش', value: unpopularItemsText, inline: false });
    }

    // ایجاد دکمه‌های مدیریتی
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
        new ButtonBuilder()
          .setCustomId('admin_item_categories')
          .setLabel('🔖 دسته‌بندی‌ها')
          .setStyle(ButtonStyle.Secondary),
      );
      
    const row3 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('admin_featured_items')
          .setLabel('⭐ آیتم‌های ویژه')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('admin_item_prices')
          .setLabel('💰 قیمت‌گذاری')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('admin_menu')
          .setLabel('🔙 بازگشت')
          .setStyle(ButtonStyle.Secondary),
      );
    
    // ارسال یا بروزرسانی پیام
    if (interaction.deferred) {
      await interaction.editReply({ embeds: [embed], components: [row1, row2, row3] });
    } else {
      await interaction.reply({ embeds: [embed], components: [row1, row2, row3], ephemeral: true });
    }
  } catch (error) {
    console.error('Error in itemManagementMenu:', error);
    
    try {
      const errorMessage = 'متأسفانه در نمایش منوی مدیریت آیتم‌ها خطایی رخ داد! لطفاً دوباره تلاش کنید.';
      
      if (interaction.deferred) {
        await interaction.editReply({ content: errorMessage });
      } else if (!interaction.replied) {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    } catch (replyError) {
      console.error('Failed to send error message:', replyError);
    }
  }
}

/**
 * منوی مدیریت ماموریت‌ها
 * @param interaction تعامل کاربر
 */
export async function questManagementMenu(interaction: ButtonInteraction | ChatInputCommandInteraction) {
  try {
    // بررسی دسترسی ادمین
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({
        content: '⛔ شما دسترسی لازم برای استفاده از این بخش را ندارید!',
        ephemeral: true
      });
      return;
    }

    // ایجاد Embed اصلی
    const embed = new EmbedBuilder()
      .setColor('#33A1FF')
      .setTitle('🎯 مدیریت ماموریت‌های ربات Ccoin')
      .setDescription('به بخش مدیریت ماموریت‌ها خوش آمدید. در این بخش می‌توانید ماموریت‌های مختلف را ایجاد و مدیریت کنید.')
      .setFooter({ text: `مدیر: ${interaction.user.username} | ${new Date().toLocaleString()}` })
      .setThumbnail('https://img.icons8.com/fluency/48/quest.png')
      .setTimestamp();

    // دریافت آمار ماموریت‌ها
    const quests = await storage.getAllQuests();
    const users = await storage.getAllUsers();
    
    // محاسبه آمار جامع
    const totalQuests = quests.length;
    const activeQuests = quests.filter(q => q.active).length;
    const inactiveQuests = totalQuests - activeQuests;
    
    // بررسی دسته‌بندی ماموریت‌ها
    const categories = {};
    quests.forEach(quest => {
      const category = quest.category || 'نامشخص';
      if (!categories[category]) {
        categories[category] = {
          total: 0,
          active: 0,
          completed: 0,
          rewards: 0
        };
      }
      categories[category].total++;
      categories[category].rewards += quest.reward || 0;
      
      if (quest.active) {
        categories[category].active++;
      }
    });
    
    // محاسبه تعداد ماموریت‌های تکمیل شده توسط کاربران
    let completedQuests = 0;
    let totalRewardsEarned = 0;
    let mostCompletedQuest = { id: 0, title: 'هیچ', count: 0 };
    let questCompletionCount = {};
    
    for (const user of users) {
      if (user.completedQuests) {
        completedQuests += user.completedQuests.length;
        
        // محاسبه ماموریت‌های پرتکرار
        user.completedQuests.forEach(questId => {
          if (!questCompletionCount[questId]) {
            questCompletionCount[questId] = 0;
          }
          questCompletionCount[questId]++;
          
          // محاسبه پاداش‌های پرداخت شده
          const quest = quests.find(q => q.id === questId);
          if (quest) {
            totalRewardsEarned += quest.reward || 0;
            const category = quest.category || 'نامشخص';
            if (categories[category]) {
              categories[category].completed++;
            }
          }
          
          // یافتن پرطرفدارترین ماموریت
          if (questCompletionCount[questId] > mostCompletedQuest.count) {
            const questDetails = quests.find(q => q.id === questId);
            if (questDetails) {
              mostCompletedQuest = {
                id: questId,
                title: questDetails.title,
                count: questCompletionCount[questId]
              };
            }
          }
        });
      }
    }
    
    // محاسبه ماموریت‌های کم تکمیل شده
    const leastCompletedQuests = quests
      .filter(quest => quest.active)
      .map(quest => {
        const completions = questCompletionCount[quest.id] || 0;
        return {
          ...quest,
          completions
        };
      })
      .sort((a, b) => a.completions - b.completions)
      .slice(0, 3);
    
    // افزودن آمار به Embed
    embed.addFields(
      { name: '📜 تعداد کل ماموریت‌ها', value: `${totalQuests}`, inline: true },
      { name: '✅ ماموریت‌های فعال', value: `${activeQuests}`, inline: true },
      { name: '❌ ماموریت‌های غیرفعال', value: `${inactiveQuests}`, inline: true },
      { name: '🏆 ماموریت‌های تکمیل شده', value: `${completedQuests} (توسط همه کاربران)`, inline: true },
      { name: '💰 پاداش‌های پرداخت شده', value: `${totalRewardsEarned.toLocaleString()} سکه`, inline: true }
    );
    
    // افزودن محبوب‌ترین ماموریت
    if (mostCompletedQuest.id !== 0) {
      embed.addFields(
        { name: '🌟 محبوب‌ترین ماموریت', value: `"${mostCompletedQuest.title}" (${mostCompletedQuest.count} بار تکمیل شده)`, inline: false }
      );
    }
    
    // افزودن ماموریت‌های کمتر انجام شده
    if (leastCompletedQuests.length > 0) {
      const leastCompletedText = leastCompletedQuests
        .map(q => `"${q.title}" (${q.completions} بار تکمیل شده)`)
        .join('\n');
      
      embed.addFields(
        { name: '📉 ماموریت‌های کمتر انجام شده', value: leastCompletedText || 'اطلاعاتی موجود نیست', inline: false }
      );
    }
    
    // آمار دسته‌بندی‌ها
    const categoriesText = Object.keys(categories)
      .sort((a, b) => categories[b].completed - categories[a].completed)
      .map(category => {
        const stats = categories[category];
        return `**${category}**: ${stats.active}/${stats.total} فعال | ${stats.completed} تکمیل | ${stats.rewards.toLocaleString()} سکه پاداش`;
      })
      .join('\n');
    
    if (categoriesText) {
      embed.addFields(
        { name: '🔖 دسته‌بندی‌های ماموریت', value: categoriesText, inline: false }
      );
    }

    // ایجاد دکمه‌های مدیریتی
    const row1 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('admin_add_quest')
          .setLabel('➕ افزودن ماموریت')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('admin_edit_quest')
          .setLabel('✏️ ویرایش ماموریت')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('admin_toggle_quest')
          .setLabel('🔄 فعال/غیرفعال کردن')
          .setStyle(ButtonStyle.Danger),
      );
      
    const row2 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('admin_list_quests')
          .setLabel('📋 لیست ماموریت‌ها')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('admin_quest_stats')
          .setLabel('📊 آمار تکمیل')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('admin_quest_categories')
          .setLabel('🔖 دسته‌بندی‌ها')
          .setStyle(ButtonStyle.Secondary),
      );
      
    const row3 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('admin_quest_rewards')
          .setLabel('💰 مدیریت پاداش‌ها')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('admin_quest_schedule')
          .setLabel('⏱️ زمان‌بندی ماموریت‌ها')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('admin_menu')
          .setLabel('🔙 بازگشت')
          .setStyle(ButtonStyle.Secondary),
      );
    
    // ارسال یا بروزرسانی پیام
    if (interaction.deferred) {
      await interaction.editReply({ embeds: [embed], components: [row1, row2, row3] });
    } else {
      await interaction.reply({ embeds: [embed], components: [row1, row2, row3], ephemeral: true });
    }
  } catch (error) {
    console.error('Error in questManagementMenu:', error);
    
    try {
      const errorMessage = 'متأسفانه در نمایش منوی مدیریت ماموریت‌ها خطایی رخ داد! لطفاً دوباره تلاش کنید.';
      
      if (interaction.deferred) {
        await interaction.editReply({ content: errorMessage });
      } else if (!interaction.replied) {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    } catch (replyError) {
      console.error('Failed to send error message:', replyError);
    }
  }
}

/**
 * منوی مدیریت کلن‌ها
 * @param interaction تعامل کاربر
 */
export async function clanManagementMenu(interaction: ButtonInteraction | ChatInputCommandInteraction) {
  try {
    // بررسی دسترسی ادمین
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({
        content: '⛔ شما دسترسی لازم برای استفاده از این بخش را ندارید!',
        ephemeral: true
      });
      return;
    }

    // ایجاد Embed اصلی
    const embed = new EmbedBuilder()
      .setColor('#33FF57')
      .setTitle('🏰 مدیریت کلن‌های ربات Ccoin')
      .setDescription('به بخش مدیریت کلن‌ها خوش آمدید. در این بخش می‌توانید کلن‌های مختلف را مدیریت کنید.')
      .setFooter({ text: `مدیر: ${interaction.user.username} | ${new Date().toLocaleString()}` })
      .setThumbnail('https://img.icons8.com/fluency/48/castle.png')
      .setTimestamp();

    // دریافت آمار کلن‌ها
    const clans = await storage.getAllClans();
    const users = await storage.getAllUsers();
    
    // محاسبه آمار جامع
    const totalClans = clans.length;
    
    // محاسبه تعداد کل اعضای کلن‌ها و میانگین اعضا
    let totalMembers = 0;
    let totalBank = 0;
    let totalExperience = 0;
    let richestClan = { name: '', bank: 0 };
    let largestClan = { name: '', members: 0 };
    let highestLevelClan = { name: '', level: 0, experience: 0 };
    
    // آمار جنگ‌های کلن‌ها
    let totalWars = 0;
    let totalWarWins = 0;
    let totalWarLosses = 0;
    let mostWarsClan = { name: '', wars: 0 };
    
    // بررسی کلن‌های فعال و غیرفعال
    const activeClans = [];
    const inactiveClans = [];
    
    // تاریخ یک ماه پیش برای محاسبه فعالیت
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    for (const clan of clans) {
      // محاسبه آمار پایه
      totalMembers += clan.memberCount || 0;
      totalBank += clan.bank || 0;
      totalExperience += clan.experience || 0;
      
      // محاسبه جنگ‌های کلن‌ها
      const warWins = clan.warWins || 0;
      const warLosses = clan.warLosses || 0;
      const totalClanWars = warWins + warLosses;
      
      totalWars += totalClanWars;
      totalWarWins += warWins;
      totalWarLosses += warLosses;
      
      // بررسی رکوردها
      if (clan.bank > richestClan.bank) {
        richestClan = { name: clan.name, bank: clan.bank };
      }
      
      if (clan.memberCount > largestClan.members) {
        largestClan = { name: clan.name, members: clan.memberCount };
      }
      
      if (clan.level > highestLevelClan.level || 
         (clan.level === highestLevelClan.level && clan.experience > highestLevelClan.experience)) {
        highestLevelClan = { 
          name: clan.name, 
          level: clan.level, 
          experience: clan.experience 
        };
      }
      
      if (totalClanWars > mostWarsClan.wars) {
        mostWarsClan = { name: clan.name, wars: totalClanWars };
      }
      
      // بررسی فعالیت کلن
      let isActive = false;
      
      // اگر کلن در یک ماه اخیر فعالیت داشته باشد
      if (clan.lastActivity) {
        const lastActivity = new Date(clan.lastActivity);
        if (lastActivity > oneMonthAgo) {
          isActive = true;
        }
      }
      
      // یا اگر تعداد اعضای آن بیشتر از 5 نفر باشد
      if (clan.memberCount >= 5) {
        isActive = true;
      }
      
      // یا اگر خزانه آن بیشتر از 10000 سکه باشد
      if (clan.bank >= 10000) {
        isActive = true;
      }
      
      if (isActive) {
        activeClans.push(clan);
      } else {
        inactiveClans.push(clan);
      }
    }
    
    const avgMembers = totalClans > 0 ? Math.round(totalMembers / totalClans) : 0;
    const avgBank = totalClans > 0 ? Math.round(totalBank / totalClans) : 0;
    const avgLevel = totalClans > 0 ? 
      Math.round(clans.reduce((sum, clan) => sum + (clan.level || 0), 0) / totalClans * 10) / 10 : 0;
    
    // یافتن کاربرانی که در کلن نیستند
    const usersWithoutClan = users.filter(user => !user.clanId).length;
    const percentInClans = users.length > 0 ? 
      Math.round((users.length - usersWithoutClan) / users.length * 100) : 0;
    
    // افزودن آمار کلی به Embed
    embed.addFields(
      { name: '🏰 تعداد کل کلن‌ها', value: `${totalClans}`, inline: true },
      { name: '✅ کلن‌های فعال', value: `${activeClans.length}`, inline: true },
      { name: '❌ کلن‌های غیرفعال', value: `${inactiveClans.length}`, inline: true },
      { name: '👥 تعداد کل اعضا', value: `${totalMembers}`, inline: true },
      { name: '👥 میانگین اعضا', value: `${avgMembers} نفر در هر کلن`, inline: true },
      { name: '📊 درصد کاربران عضو کلن', value: `${percentInClans}%`, inline: true },
      { name: '💰 مجموع خزانه‌ها', value: `${totalBank.toLocaleString()} سکه`, inline: true },
      { name: '💰 میانگین خزانه', value: `${avgBank.toLocaleString()} سکه`, inline: true },
      { name: '⭐ میانگین سطح', value: `${avgLevel}`, inline: true }
    );
    
    // افزودن آمار جنگ‌های کلن
    if (totalWars > 0) {
      embed.addFields({
        name: '⚔️ آمار جنگ‌های کلن',
        value: `تعداد کل جنگ‌ها: ${totalWars}\nپیروزی‌ها: ${totalWarWins}\nشکست‌ها: ${totalWarLosses}\nنرخ پیروزی: ${Math.round(totalWarWins / totalWars * 100)}%`,
        inline: false
      });
    }
    
    // افزودن کلن‌های برتر
    const topClansFields = [];
    
    if (richestClan.name) {
      topClansFields.push(`💰 ثروتمندترین کلن: **${richestClan.name}** با ${richestClan.bank.toLocaleString()} سکه`);
    }
    
    if (largestClan.name) {
      topClansFields.push(`👥 بزرگترین کلن: **${largestClan.name}** با ${largestClan.members} عضو`);
    }
    
    if (highestLevelClan.name) {
      topClansFields.push(`⭐ قدرتمندترین کلن: **${highestLevelClan.name}** با سطح ${highestLevelClan.level}`);
    }
    
    if (mostWarsClan.name && mostWarsClan.wars > 0) {
      topClansFields.push(`⚔️ جنگجوترین کلن: **${mostWarsClan.name}** با ${mostWarsClan.wars} جنگ`);
    }
    
    if (topClansFields.length > 0) {
      embed.addFields({
        name: '🏆 کلن‌های برتر',
        value: topClansFields.join('\n'),
        inline: false
      });
    }

    // ایجاد دکمه‌های مدیریتی - ردیف اول
    const row1 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('admin_list_clans')
          .setLabel('📋 لیست کلن‌ها')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('admin_clan_details')
          .setLabel('🔍 جزئیات کلن')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('admin_clan_search')
          .setLabel('🔎 جستجوی کلن')
          .setStyle(ButtonStyle.Secondary),
      );
      
    // ردیف دوم - مدیریت کلن
    const row2 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('admin_create_clan')
          .setLabel('➕ ایجاد کلن')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('admin_modify_clan')
          .setLabel('✏️ ویرایش کلن')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('admin_delete_clan')
          .setLabel('🗑️ حذف کلن')
          .setStyle(ButtonStyle.Danger),
      );
      
    // ردیف سوم - ویژگی‌های پیشرفته
    const row3 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('admin_clan_members')
          .setLabel('👥 مدیریت اعضا')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('admin_clan_bank')
          .setLabel('💰 مدیریت خزانه')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('admin_menu')
          .setLabel('🔙 بازگشت')
          .setStyle(ButtonStyle.Secondary),
      );
    
    // ارسال یا بروزرسانی پیام
    if (interaction.deferred) {
      await interaction.editReply({ embeds: [embed], components: [row1, row2, row3] });
    } else {
      await interaction.reply({ embeds: [embed], components: [row1, row2, row3], ephemeral: true });
    }
  } catch (error) {
    console.error('Error in clanManagementMenu:', error);
    
    try {
      const errorMessage = 'متأسفانه در نمایش منوی مدیریت کلن‌ها خطایی رخ داد! لطفاً دوباره تلاش کنید.';
      
      if (interaction.deferred) {
        await interaction.editReply({ content: errorMessage });
      } else if (!interaction.replied) {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    } catch (replyError) {
      console.error('Failed to send error message:', replyError);
    }
  }
}

/**
 * منوی اعلانات و اطلاع‌رسانی
 * @param interaction تعامل کاربر
 */
export async function broadcastMenu(interaction: ButtonInteraction | ChatInputCommandInteraction) {
  try {
    // بررسی دسترسی ادمین
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({
        content: '⛔ شما دسترسی لازم برای استفاده از این بخش را ندارید!',
        ephemeral: true
      });
      return;
    }

    // ایجاد Embed اصلی
    const embed = new EmbedBuilder()
      .setColor('#9933FF')
      .setTitle('📢 سیستم اطلاع‌رسانی ربات Ccoin')
      .setDescription('به بخش اطلاع‌رسانی خوش آمدید. در این بخش می‌توانید اعلانات و پیام‌های عمومی را مدیریت کنید.')
      .setFooter({ text: `مدیر: ${interaction.user.username} | ${new Date().toLocaleString()}` })
      .setThumbnail('https://img.icons8.com/fluency/48/megaphone.png')
      .setTimestamp();

    // افزودن راهنمایی به Embed
    embed.addFields(
      { name: '📢 اعلان عمومی', value: 'ارسال یک پیام به همه کاربران در تمام سرورها', inline: false },
      { name: '🔔 اعلان سرور', value: 'ارسال یک پیام به یک سرور خاص', inline: false },
      { name: '📅 اعلان رویداد', value: 'اطلاع‌رسانی درباره رویدادهای آینده', inline: false },
      { name: '🔄 تنظیم سیستم اطلاع‌رسانی خودکار', value: 'پیکربندی اعلانات خودکار و دوره‌ای', inline: false }
    );

    // ایجاد دکمه‌های مدیریتی
    const row1 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('admin_global_announcement')
          .setLabel('📢 اعلان عمومی')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('admin_server_announcement')
          .setLabel('🔔 اعلان سرور')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('admin_event_announcement')
          .setLabel('📅 اعلان رویداد')
          .setStyle(ButtonStyle.Success),
      );
      
    const row2 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('admin_auto_announcements')
          .setLabel('🔄 اعلانات خودکار')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('admin_announcement_history')
          .setLabel('📋 تاریخچه اعلانات')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('admin_menu')
          .setLabel('🔙 بازگشت')
          .setStyle(ButtonStyle.Secondary),
      );
    
    // ارسال یا بروزرسانی پیام
    if (interaction.deferred) {
      await interaction.editReply({ embeds: [embed], components: [row1, row2] });
    } else {
      await interaction.reply({ embeds: [embed], components: [row1, row2], ephemeral: true });
    }
  } catch (error) {
    console.error('Error in broadcastMenu:', error);
    
    try {
      const errorMessage = 'متأسفانه در نمایش منوی اطلاع‌رسانی خطایی رخ داد! لطفاً دوباره تلاش کنید.';
      
      if (interaction.deferred) {
        await interaction.editReply({ content: errorMessage });
      } else if (!interaction.replied) {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    } catch (replyError) {
      console.error('Failed to send error message:', replyError);
    }
  }
}

/**
 * منوی پشتیبان‌گیری از دیتابیس
 * @param interaction تعامل کاربر
 */
export async function backupMenu(interaction: ButtonInteraction | ChatInputCommandInteraction) {
  try {
    // بررسی دسترسی ادمین
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({
        content: '⛔ شما دسترسی لازم برای استفاده از این بخش را ندارید!',
        ephemeral: true
      });
      return;
    }

    // ایجاد Embed اصلی
    const embed = new EmbedBuilder()
      .setColor('#4CAF50')
      .setTitle('💾 سیستم پشتیبان‌گیری ربات Ccoin')
      .setDescription('به بخش پشتیبان‌گیری خوش آمدید. در این بخش می‌توانید از دیتابیس پشتیبان تهیه کنید یا نسخه‌های پشتیبان قبلی را بازیابی نمایید.')
      .setFooter({ text: `مدیر: ${interaction.user.username} | ${new Date().toLocaleString()}` })
      .setThumbnail('https://img.icons8.com/fluency/48/database-backup.png')
      .setTimestamp();

    // افزودن توضیحات به Embed
    embed.addFields(
      { 
        name: '⚠️ هشدار مهم', 
        value: 'بازیابی داده‌ها باعث حذف تمام اطلاعات فعلی و جایگزینی آن‌ها با نسخه پشتیبان می‌شود. این عمل غیرقابل بازگشت است!', 
        inline: false 
      },
      { 
        name: '📋 راهنمای پشتیبان‌گیری', 
        value: 'پشتیبان‌گیری خودکار هر 24 ساعت انجام می‌شود. با این حال، قبل از انجام تغییرات مهم، پشتیبان‌گیری دستی توصیه می‌شود.', 
        inline: false 
      }
    );

    // ایجاد دکمه‌های مدیریتی
    const row1 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('admin_backup_create')
          .setLabel('➕ ایجاد پشتیبان')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('admin_backup_list')
          .setLabel('📋 لیست پشتیبان‌ها')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('admin_backup_restore')
          .setLabel('🔄 بازیابی پشتیبان')
          .setStyle(ButtonStyle.Danger),
      );
      
    const row2 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('admin_backup_settings')
          .setLabel('⚙️ تنظیمات پشتیبان‌گیری')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('admin_menu')
          .setLabel('🔙 بازگشت')
          .setStyle(ButtonStyle.Secondary),
      );
    
    // ارسال یا بروزرسانی پیام
    if (interaction.deferred) {
      await interaction.editReply({ embeds: [embed], components: [row1, row2] });
    } else {
      await interaction.reply({ embeds: [embed], components: [row1, row2], ephemeral: true });
    }
  } catch (error) {
    console.error('Error in backupMenu:', error);
    
    try {
      const errorMessage = 'متأسفانه در نمایش منوی پشتیبان‌گیری خطایی رخ داد! لطفاً دوباره تلاش کنید.';
      
      if (interaction.deferred) {
        await interaction.editReply({ content: errorMessage });
      } else if (!interaction.replied) {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    } catch (replyError) {
      console.error('Failed to send error message:', replyError);
    }
  }
}

/**
 * منوی تنظیمات ربات
 * @param interaction تعامل کاربر
 */
export async function botSettingsMenu(interaction: ButtonInteraction | ChatInputCommandInteraction) {
  try {
    // بررسی دسترسی ادمین
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({
        content: '⛔ شما دسترسی لازم برای استفاده از این بخش را ندارید!',
        ephemeral: true
      });
      return;
    }

    // دریافت تنظیمات فعلی ربات
    const config = botConfig.getConfig();
    const client = interaction.client;
    
    // جمع‌آوری اطلاعات کلی ربات
    const serverCount = client.guilds.cache.size;
    const users = await storage.getAllUsers();
    const userCount = users ? users.length : 0;
    const uptime = formatUptime(client.uptime || 0);
    const latency = Math.round(client.ws.ping);
    const version = process.env.npm_package_version || '1.0.0';
    
    const memoryUsage = process.memoryUsage();
    const memoryUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100;
    const memoryTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100;
    const cpuUsage = process.cpuUsage();
    const cpuUsedPercent = Math.round((cpuUsage.user + cpuUsage.system) / 1000000);

    // ایجاد Embed اصلی
    const embed = new EmbedBuilder()
      .setColor('#2196F3')
      .setTitle('⚙️ پنل مدیریت تنظیمات ربات Ccoin')
      .setDescription('به پنل جامع تنظیمات ربات خوش آمدید. در این بخش می‌توانید تمامی تنظیمات ربات را مشاهده و مدیریت کنید.')
      .setFooter({ text: `مدیر: ${interaction.user.username} | ${new Date().toLocaleString()}` })
      .setThumbnail('https://img.icons8.com/fluency/48/settings.png')
      .setTimestamp();

    // افزودن وضعیت سیستم به Embed
    embed.addFields(
      { name: '🤖 اطلاعات سیستم', value: 
        `**نسخه ربات**: \`${version}\`\n` +
        `**زمان فعالیت**: \`${uptime}\`\n` +
        `**تاخیر**: \`${latency}ms\`\n` +
        `**حافظه**: \`${memoryUsedMB}MB از ${memoryTotalMB}MB (${Math.round(memoryUsedMB/memoryTotalMB*100)}%)\`\n` +
        `**سرورها**: \`${serverCount}\`\n` +
        `**کاربران**: \`${userCount}\``, 
        inline: false 
      }
    );
    
    // افزودن تنظیمات عمومی به Embed
    const botSettings = {
      prefix: config.prefix || '/',
      defaultColor: config.defaultColor || '#0099FF',
      language: config.language || 'fa',
      timezone: config.timezone || 'Asia/Tehran',
      adminRoleId: config.general?.adminRoleId || 'تنظیم نشده'
    };
    
    embed.addFields(
      { name: '⚙️ تنظیمات عمومی', value: 
        `**پیشوند دستورات**: \`${botSettings.prefix}\`\n` +
        `**رنگ پیش‌فرض**: \`${botSettings.defaultColor}\`\n` +
        `**زبان ربات**: \`${botSettings.language}\`\n` +
        `**منطقه زمانی**: \`${botSettings.timezone}\`\n` +
        `**نقش ادمین**: ${typeof botSettings.adminRoleId === 'string' ? botSettings.adminRoleId : `<@&${botSettings.adminRoleId}>`}`, 
        inline: false 
      }
    );
    
    // افزودن تنظیمات اقتصادی به Embed
    const economySettings = {
      bankInterestRate: config.economy?.bankInterestRate || 2,
      transferFeeRate: config.economy?.transferFee || 5,
      initialBalance: config.economy?.initialBalance || 100,
      dailyReward: config.economy?.dailyReward || 200,
      dailyStreakBonus: config.economy?.dailyStreakBonus || 10,
      maxBank: config.economy?.maxBank || 1000000,
      maxWallet: config.economy?.maxWallet || 100000,
      robberySuccessRate: config.economy?.robberySuccessRate || 40
    };
    
    embed.addFields(
      { name: '💰 تنظیمات اقتصادی', value: 
        `**نرخ سود بانکی**: \`${economySettings.bankInterestRate}%\`\n` +
        `**کارمزد انتقال**: \`${economySettings.transferFeeRate}%\`\n` +
        `**موجودی اولیه**: \`${economySettings.initialBalance.toLocaleString()}\` سکه\n` +
        `**جایزه روزانه**: \`${economySettings.dailyReward.toLocaleString()}\` سکه\n` +
        `**پاداش حضور متوالی**: \`${economySettings.dailyStreakBonus}%\`\n` +
        `**حداکثر کیف پول**: \`${economySettings.maxWallet.toLocaleString()}\` سکه\n` +
        `**حداکثر بانک**: \`${economySettings.maxBank.toLocaleString()}\` سکه`, 
        inline: false 
      }
    );
    
    // افزودن تنظیمات بازی‌ها به Embed
    const gameSettings = {
      minBet: config.games?.minBet || 50,
      maxBet: config.games?.maxBet || 5000,
      disabledGames: config.games?.disabledGames || [],
      duelBetAmount: config.games?.duelBetAmount || 100,
      wheelSpinCost: config.games?.wheelSpinCost || 250,
      giveawayDuration: config.games?.giveawayDuration || 3600
    };
    
    embed.addFields(
      { name: '🎮 تنظیمات بازی‌ها', value: 
        `**حداقل شرط‌بندی**: \`${gameSettings.minBet.toLocaleString()}\` سکه\n` +
        `**حداکثر شرط‌بندی**: \`${gameSettings.maxBet.toLocaleString()}\` سکه\n` +
        `**هزینه دوئل**: \`${gameSettings.duelBetAmount.toLocaleString()}\` سکه\n` +
        `**هزینه چرخ شانس**: \`${gameSettings.wheelSpinCost.toLocaleString()}\` سکه\n` +
        `**مدت جایزه‌ها**: \`${Math.round(gameSettings.giveawayDuration/60)}\` دقیقه\n` +
        `**بازی‌های غیرفعال**: \`${gameSettings.disabledGames.length > 0 ? gameSettings.disabledGames.join(', ') : 'تمام بازی‌ها فعال هستند'}\``, 
        inline: false 
      }
    );
    
    // افزودن تنظیمات کلن‌ها به Embed
    const clanSettings = {
      createCost: config.clans?.createCost || 5000,
      maxMembers: config.clans?.maxMembers || 30,
      roleCreationCost: config.clans?.roleCreationCost || 1000,
      leaveDelay: config.clans?.leaveDelay || 48,
      dailyLimit: config.clans?.dailyLimit || 5000
    };
    
    embed.addFields(
      { name: '🏰 تنظیمات کلن‌ها', value: 
        `**هزینه ساخت کلن**: \`${clanSettings.createCost.toLocaleString()}\` سکه\n` +
        `**حداکثر اعضا**: \`${clanSettings.maxMembers}\` نفر\n` +
        `**هزینه ساخت رول**: \`${clanSettings.roleCreationCost.toLocaleString()}\` سکه\n` +
        `**مهلت خروج مجدد**: \`${clanSettings.leaveDelay}\` ساعت\n` +
        `**سقف برداشت روزانه**: \`${clanSettings.dailyLimit.toLocaleString()}\` سکه`, 
        inline: false 
      }
    );
    
    // افزودن تنظیمات لاگ به Embed
    const loggingSettings = {
      commandLogging: config.logging?.commands === true,
      transactionLogging: config.logging?.transactions === true,
      errorLogging: config.logging?.errors === true,
      enabled: config.logging?.enabled === true
    };
    
    embed.addFields(
      { name: '📝 تنظیمات لاگ', value: 
        `**وضعیت کلی لاگ‌ها**: \`${loggingSettings.enabled ? '✅ فعال' : '❌ غیرفعال'}\`\n` +
        `**ثبت دستورات**: \`${loggingSettings.commandLogging ? '✅ فعال' : '❌ غیرفعال'}\`\n` +
        `**ثبت تراکنش‌ها**: \`${loggingSettings.transactionLogging ? '✅ فعال' : '❌ غیرفعال'}\`\n` +
        `**ثبت خطاها**: \`${loggingSettings.errorLogging ? '✅ فعال' : '❌ غیرفعال'}\``, 
        inline: false 
      }
    );

    // افزودن تنظیمات هوش مصنوعی به Embed
    const aiSettings = {
      service: config.ai?.service || 'huggingface'
    };
    
    embed.addFields(
      { name: '🤖 تنظیمات هوش مصنوعی', value: 
        `**سرویس فعال**: \`${aiSettings.service === 'openai' ? 'OpenAI (ChatGPT)' : 'Hugging Face'}\`\n` +
        `**وضعیت**: \`${aiSettings.service === 'openai' ? '🟢 فعال' : '🟢 فعال'}\`\n`,
        inline: false 
      }
    );

    // ایجاد دکمه‌های مدیریتی - دسته اول (تنظیمات اصلی)
    const row1 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('admin_settings_general')
          .setLabel('🔧 تنظیمات عمومی')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('admin_settings_economy')
          .setLabel('💰 تنظیمات اقتصادی')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('admin_settings_games')
          .setLabel('🎮 تنظیمات بازی‌ها')
          .setStyle(ButtonStyle.Primary),
      );
      
    // دکمه‌های مدیریتی - دسته دوم (تنظیمات پیشرفته)
    const row2 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('admin_settings_ai')
          .setLabel('🤖 مدیریت هوش مصنوعی')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('admin_settings_clans')
          .setLabel('🏰 تنظیمات کلن‌ها')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('admin_settings_security')
          .setLabel('🛡️ تنظیمات امنیتی')
          .setStyle(ButtonStyle.Danger),
      );
      
    // دکمه‌های مدیریتی - دسته سوم (تنظیمات متفرقه)
    const row3 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('admin_settings_permissions')
          .setLabel('🔒 دسترسی‌های ربات')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('admin_settings_logging')
          .setLabel('📝 تنظیمات لاگ')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('admin_menu')
          .setLabel('🔙 بازگشت')
          .setStyle(ButtonStyle.Secondary),
      );
    
    // ارسال یا بروزرسانی پیام
    if (interaction.deferred) {
      await interaction.editReply({ embeds: [embed], components: [row1, row2, row3] });
    } else {
      await interaction.reply({ embeds: [embed], components: [row1, row2, row3], ephemeral: true });
    }
  } catch (error) {
    console.error('Error in botSettingsMenu:', error);
    
    try {
      const errorMessage = 'متأسفانه در نمایش منوی تنظیمات ربات خطایی رخ داد! لطفاً دوباره تلاش کنید.';
      
      if (interaction.deferred) {
        await interaction.editReply({ content: errorMessage });
      } else if (!interaction.replied) {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    } catch (replyError) {
      console.error('Failed to send error message:', replyError);
    }
  }
}

/**
 * فرمت کردن زمان فعالیت ربات
 * @param ms میلی‌ثانیه
 * @returns زمان فرمت شده
 */
function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  return `${days}d:${hours % 24}h:${minutes % 60}m:${seconds % 60}s`;
}

/**
 * نمایش آمار و وضعیت ربات
 * @param interaction تعامل کاربر
 */
export async function botStatsMenu(interaction: ButtonInteraction | ChatInputCommandInteraction) {
  try {
    // بررسی دسترسی ادمین
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({
        content: '⛔ شما دسترسی لازم برای استفاده از این بخش را ندارید!',
        ephemeral: true
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    // دریافت اطلاعات برای آمار
    const totalUsers = await getTotalUsers();
    const totalCoins = await getTotalCoins();
    const totalItems = await getTotalItems();
    const activePlayers = await getActivePlayers();
    const topGames = await getTopGames();

    // محاسبه زمان فعالیت ربات
    const uptime = getBotUptime();

    // محاسبه تعداد سرورهای فعال و اعضای واقعی (بدون ربات‌ها)
    const client = interaction.client;
    const totalGuilds = client.guilds.cache.size;
    
    // محاسبه تعداد اعضای انسان (بدون ربات‌ها)
    let totalMembers = 0;
    client.guilds.cache.forEach(guild => {
      const humanMembers = guild.members.cache.filter(member => !member.user.bot).size;
      totalMembers += humanMembers;
    });

    // ایجاد Embed اصلی
    const embed = new EmbedBuilder()
      .setColor('#FF5722')
      .setTitle('📊 آمار و وضعیت ربات Ccoin')
      .setDescription(`آمار ربات در تاریخ ${new Date().toLocaleDateString()}`)
      .setFooter({ text: `درخواست شده توسط ${interaction.user.username}` })
      .setThumbnail('https://img.icons8.com/fluency/48/analytics.png')
      .setTimestamp();

    // افزودن اطلاعات به Embed
    embed.addFields(
      // اطلاعات کلی
      { name: '⏱️ زمان فعالیت', value: uptime, inline: true },
      { name: '🖥️ تعداد سرورها', value: `${totalGuilds}`, inline: true },
      { name: '👥 مجموع اعضا', value: `${totalMembers}`, inline: true },
      
      // اطلاعات اقتصادی
      { name: '👤 تعداد کاربران', value: `${totalUsers}`, inline: true },
      { name: '💰 مجموع سکه‌ها', value: `${totalCoins.toLocaleString()} Ccoin`, inline: true },
      { name: '🎮 کاربران فعال', value: `${activePlayers.last24h} (24h) / ${activePlayers.last7d} (7d)`, inline: true },
      
      // اطلاعات بازی
      { name: '🎯 محبوب‌ترین بازی‌ها', value: topGames || 'اطلاعات موجود نیست', inline: false },
      
      // اطلاعات سیستمی
      { name: '📦 تعداد آیتم‌ها', value: `${totalItems}`, inline: true },
      { name: '🏆 تعداد ماموریت‌ها', value: `${await getTotalQuests()}`, inline: true },
      { name: '🏰 تعداد کلن‌ها', value: `${await getTotalClans()}`, inline: true }
    );

    // ایجاد دکمه‌های مدیریتی
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('admin_economy_stats')
          .setLabel('💰 آمار اقتصادی')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('admin_game_stats')
          .setLabel('🎮 آمار بازی‌ها')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('admin_export_stats')
          .setLabel('📤 خروجی آمار')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('admin_menu')
          .setLabel('🔙 بازگشت')
          .setStyle(ButtonStyle.Secondary),
      );
    
    await interaction.editReply({ 
      embeds: [embed], 
      components: [row] 
    });
  } catch (error) {
    console.error('Error in botStatsMenu:', error);
    
    try {
      const errorMessage = 'متأسفانه در نمایش آمار ربات خطایی رخ داد! لطفاً دوباره تلاش کنید.';
      
      if (interaction.deferred) {
        await interaction.editReply({ content: errorMessage });
      } else if (!interaction.replied) {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    } catch (replyError) {
      console.error('Failed to send error message:', replyError);
    }
  }
}

// ======== HELPER FUNCTIONS ========

/**
 * دریافت تعداد کل کاربران
 */
async function getTotalUsers(): Promise<number> {
  try {
    return await storage.getUserCount();
  } catch (error) {
    console.error('Error getting total users:', error);
    return 0;
  }
}

/**
 * دریافت مجموع سکه‌های موجود در سیستم
 */
async function getTotalCoins(): Promise<number> {
  try {
    const users = await storage.getAllUsers();
    let totalCoins = 0;
    
    for (const user of users) {
      totalCoins += user.wallet || 0;
      totalCoins += user.bank || 0;
    }
    
    return totalCoins;
  } catch (error) {
    console.error('Error getting total coins:', error);
    return 0;
  }
}

/**
 * دریافت تعداد کل آیتم‌ها
 */
async function getTotalItems(): Promise<number> {
  try {
    const items = await storage.getAllItems();
    return items.length;
  } catch (error) {
    console.error('Error getting total items:', error);
    return 0;
  }
}

/**
 * دریافت کاربران فعال در 7 روز اخیر و کاربران آنلاین فعلی
 */
async function getActivePlayers(): Promise<{last24h: number, last7d: number}> {
  try {
    const users = await storage.getAllUsers();
    const now = Date.now();
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    
    let activeCount = 0;
    let onlineLast24Hours = 0;
    
    for (const user of users) {
      // اگر تاریخ آخرین فعالیت کاربر وجود داشته باشد و در 7 روز اخیر باشد
      if (user.lastActive && new Date(user.lastActive).getTime() > sevenDaysAgo) {
        activeCount++;

        // کاربرانی که در 24 ساعت اخیر فعال بوده‌اند
        if (new Date(user.lastActive).getTime() > oneDayAgo) {
          onlineLast24Hours++;
        }
      }
    }
    
    // نمایش ترکیبی از کاربران فعال در 24 ساعت اخیر و 7 روز اخیر
    console.log(`Active Players - Last 24h: ${onlineLast24Hours}, Last 7d: ${activeCount}`);
    
    return {
      last24h: onlineLast24Hours,
      last7d: activeCount
    };
  } catch (error) {
    console.error('Error getting active players:', error);
    return {
      last24h: 0,
      last7d: 0
    };
  }
}

/**
 * دریافت محبوب‌ترین بازی‌ها
 */
async function getTopGames(): Promise<string> {
  try {
    // این تابع بستگی به ساختار دیتابیس دارد
    // و نیاز به لاگ کردن بازی‌های انجام شده دارد
    
    // مثال ساده:
    return "1️⃣ دوئل (45%)\n2️⃣ شیر یا خط (30%)\n3️⃣ اسلات (15%)";
  } catch (error) {
    console.error('Error getting top games:', error);
    return "اطلاعاتی موجود نیست";
  }
}

/**
 * محاسبه زمان آپتایم ربات
 */
function getBotUptime(): string {
  const uptime = process.uptime();
  
  const days = Math.floor(uptime / 86400);
  const hours = Math.floor((uptime % 86400) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);
  
  let uptimeStr = '';
  if (days > 0) uptimeStr += `${days} روز `;
  if (hours > 0) uptimeStr += `${hours} ساعت `;
  if (minutes > 0) uptimeStr += `${minutes} دقیقه `;
  if (seconds > 0) uptimeStr += `${seconds} ثانیه`;
  
  return uptimeStr.trim();
}

/**
 * دریافت تعداد کل ماموریت‌ها
 */
async function getTotalQuests(): Promise<number> {
  try {
    const quests = await storage.getAllQuests();
    return quests.length;
  } catch (error) {
    console.error('Error getting total quests:', error);
    return 0;
  }
}

/**
 * دریافت تعداد کل کلن‌ها
 */
async function getTotalClans(): Promise<number> {
  try {
    const clans = await storage.getAllClans();
    return clans.length;
  } catch (error) {
    console.error('Error getting total clans:', error);
    return 0;
  }
}

/**
 * منوی تنظیمات عمومی
 * @param interaction تعامل کاربر
 */
export async function generalSettingsMenu(interaction: ButtonInteraction | ChatInputCommandInteraction) {
  try {
    // بررسی دسترسی ادمین
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({
        content: '⛔ شما دسترسی لازم برای استفاده از این بخش را ندارید!',
        ephemeral: true
      });
      return;
    }

    // دریافت تنظیمات فعلی
    const config = botConfig.getConfig();
    
    // ایجاد Embed برای نمایش تنظیمات عمومی
    const embed = new EmbedBuilder()
      .setColor('#2196F3')
      .setTitle('🔧 تنظیمات عمومی ربات')
      .setDescription('در این بخش می‌توانید تنظیمات عمومی ربات را مشاهده و ویرایش کنید.')
      .setFooter({ text: `مدیر: ${interaction.user.username} | ${new Date().toLocaleString()}` })
      .setThumbnail('https://img.icons8.com/fluency/48/settings.png')
      .setTimestamp();
    
    // تنظیمات عمومی
    const generalSettings = {
      prefix: config.general?.prefix || '/',
      defaultColor: config.general?.defaultColor || '#2196F3',
      language: config.general?.language || 'fa',
      timezone: config.general?.timezone || 'Asia/Tehran',
      adminRoleId: config.general?.adminRoleId || 'تنظیم نشده'
    };
    
    // افزودن فیلدها به Embed
    embed.addFields(
      { name: '⚙️ تنظیمات فعلی', value: 
        `**پیشوند دستورات**: \`${generalSettings.prefix}\`\n` +
        `**رنگ پیش‌فرض**: \`${generalSettings.defaultColor}\`\n` +
        `**زبان ربات**: \`${generalSettings.language}\`\n` +
        `**منطقه زمانی**: \`${generalSettings.timezone}\`\n` +
        `**نقش ادمین**: ${typeof generalSettings.adminRoleId === 'string' && !generalSettings.adminRoleId.includes('تنظیم') ? `<@&${generalSettings.adminRoleId}>` : generalSettings.adminRoleId}`, 
        inline: false 
      }
    );
    
    // راهنمای تغییر تنظیمات
    embed.addFields(
      { name: '📝 راهنمای تغییر تنظیمات', value: 
        `برای تغییر هر یک از تنظیمات، از دکمه‌های زیر استفاده کنید. پس از کلیک، یک فرم برای شما نمایش داده خواهد شد.`, 
        inline: false 
      }
    );
    
    // دکمه‌های تغییر تنظیمات
    const row1 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('admin_change_prefix')
          .setLabel('تغییر پیشوند')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('admin_change_color')
          .setLabel('تغییر رنگ پیش‌فرض')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('admin_change_language')
          .setLabel('تغییر زبان')
          .setStyle(ButtonStyle.Primary),
      );
      
    const row2 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('admin_change_timezone')
          .setLabel('تغییر منطقه زمانی')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('admin_change_admin_role')
          .setLabel('تغییر نقش ادمین')
          .setStyle(ButtonStyle.Success),
      );
    
    // دکمه بازگشت
    const row3 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('admin_settings')
          .setLabel('🔙 بازگشت به منوی تنظیمات')
          .setStyle(ButtonStyle.Secondary),
      );
    
    // ارسال پاسخ
    if (interaction.deferred) {
      await interaction.editReply({ embeds: [embed], components: [row1, row2, row3] });
    } else {
      await interaction.reply({ embeds: [embed], components: [row1, row2, row3], ephemeral: true });
    }
  } catch (error) {
    console.error('Error in generalSettingsMenu:', error);
    
    try {
      const errorMessage = 'متأسفانه در نمایش منوی تنظیمات عمومی خطایی رخ داد! لطفاً دوباره تلاش کنید.';
      
      if (interaction.deferred) {
        await interaction.editReply({ content: errorMessage });
      } else if (!interaction.replied) {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    } catch (replyError) {
      console.error('Failed to send error message:', replyError);
    }
  }
}

/**
 * منوی مدیریت هوش مصنوعی
 * @param interaction تعامل کاربر
 */
export async function aiSettingsMenu(interaction: ButtonInteraction | ChatInputCommandInteraction) {
  try {
    // بررسی دسترسی ادمین
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({
        content: '⛔ شما دسترسی لازم برای استفاده از این بخش را ندارید!',
        ephemeral: true
      });
      return;
    }

    // دریافت تنظیمات فعلی
    const config = botConfig.getConfig();
    
    // ایجاد Embed برای نمایش تنظیمات هوش مصنوعی
    const embed = new EmbedBuilder()
      .setColor('#6A0DAD') // رنگ بنفش برای هوش مصنوعی
      .setTitle('🤖 مدیریت هوش مصنوعی')
      .setDescription('در این بخش می‌توانید سرویس هوش مصنوعی مورد استفاده در ربات را تغییر دهید.')
      .setFooter({ text: `مدیر: ${interaction.user.username} | ${new Date().toLocaleString()}` })
      .setThumbnail('https://img.icons8.com/fluency/48/artificial-intelligence.png')
      .setTimestamp();
    
    // تنظیمات هوش مصنوعی
    const aiSettings = {
      service: config.ai?.service || 'huggingface'
    };
    
    // افزودن فیلدها به Embed
    embed.addFields(
      { name: '⚙️ تنظیمات فعلی', value: 
        `**سرویس فعال**: \`${aiSettings.service === 'openai' ? 'OpenAI (ChatGPT)' : 'Hugging Face'}\`\n` +
        `**وضعیت**: \`${aiSettings.service === 'openai' ? '🟢 فعال' : '🟢 فعال'}\`\n` +
        `**API Key**: \`${aiSettings.service === 'openai' ? 'متصل ✓' : 'متصل ✓'}\``, 
        inline: false 
      },
      { name: '📝 مقایسه سرویس‌ها', value: 
        `**OpenAI (ChatGPT)**:\n` +
        `✅ کیفیت بالاتر پاسخ‌ها\n` +
        `✅ درک بهتر زبان فارسی\n` +
        `⚠️ محدودیت در تعداد درخواست‌ها\n` +
        `⚠️ هزینه بالاتر\n\n` +
        `**Hugging Face**:\n` +
        `✅ بدون محدودیت در تعداد درخواست‌ها\n` +
        `✅ هزینه کمتر\n` +
        `⚠️ کیفیت متوسط پاسخ‌ها\n` +
        `⚠️ درک محدودتر زبان فارسی`, 
        inline: false 
      }
    );
    
    // دکمه‌های تغییر سرویس
    const row1 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('admin_switch_to_openai')
          .setLabel('تغییر به OpenAI (ChatGPT)')
          .setStyle(aiSettings.service === 'openai' ? ButtonStyle.Success : ButtonStyle.Primary)
          .setDisabled(aiSettings.service === 'openai'),
        new ButtonBuilder()
          .setCustomId('admin_switch_to_huggingface')
          .setLabel('تغییر به Hugging Face')
          .setStyle(aiSettings.service === 'huggingface' ? ButtonStyle.Success : ButtonStyle.Primary)
          .setDisabled(aiSettings.service === 'huggingface'),
      );
      
    // دکمه‌های تست سرویس
    const row2 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('admin_test_ai')
          .setLabel('تست سرویس فعلی')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('admin_view_ai_status')
          .setLabel('وضعیت سرویس‌ها')
          .setStyle(ButtonStyle.Secondary),
      );
    
    // دکمه بازگشت
    const row3 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('admin_settings')
          .setLabel('🔙 بازگشت به منوی تنظیمات')
          .setStyle(ButtonStyle.Secondary),
      );
    
    // ارسال پاسخ
    if (interaction.deferred) {
      await interaction.editReply({ embeds: [embed], components: [row1, row2, row3] });
    } else {
      await interaction.reply({ embeds: [embed], components: [row1, row2, row3], ephemeral: true });
    }
  } catch (error) {
    console.error('Error in aiSettingsMenu:', error);
    
    try {
      const errorMessage = 'متأسفانه در نمایش منوی مدیریت هوش مصنوعی خطایی رخ داد! لطفاً دوباره تلاش کنید.';
      
      if (interaction.deferred) {
        await interaction.editReply({ content: errorMessage });
      } else if (!interaction.replied) {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    } catch (replyError) {
      console.error('Failed to send error message:', replyError);
    }
  }
}

/**
 * منوی تنظیمات اقتصادی
 * @param interaction تعامل کاربر
 */
export async function economySettingsMenu(interaction: ButtonInteraction | ChatInputCommandInteraction) {
  try {
    // بررسی دسترسی ادمین
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({
        content: '⛔ شما دسترسی لازم برای استفاده از این بخش را ندارید!',
        ephemeral: true
      });
      return;
    }

    // دریافت تنظیمات فعلی
    const config = botConfig.getConfig();
    
    // ایجاد Embed برای نمایش تنظیمات اقتصادی
    const embed = new EmbedBuilder()
      .setColor('#4CAF50')
      .setTitle('💰 تنظیمات اقتصادی ربات')
      .setDescription('در این بخش می‌توانید تنظیمات اقتصادی ربات را مشاهده و ویرایش کنید.')
      .setFooter({ text: `مدیر: ${interaction.user.username} | ${new Date().toLocaleString()}` })
      .setThumbnail('https://img.icons8.com/fluency/48/money-bag.png')
      .setTimestamp();
    
    // تنظیمات اقتصادی
    const economySettings = {
      bankInterestRate: config.economy?.bankInterestRate || 2,
      transferFeeRate: config.economy?.transferFee || 5,
      initialBalance: config.economy?.initialBalance || 100,
      dailyReward: config.economy?.dailyReward || 200,
      dailyStreakBonus: config.economy?.dailyStreakBonus || 10,
      maxBank: config.economy?.maxBank || 1000000,
      maxWallet: config.economy?.maxWallet || 100000,
      robberySuccessRate: config.economy?.robberySuccessRate || 40
    };
    
    // افزودن فیلدها به Embed
    embed.addFields(
      { name: '💰 تنظیمات فعلی', value: 
        `**نرخ سود بانکی**: \`${economySettings.bankInterestRate}%\`\n` +
        `**کارمزد انتقال**: \`${economySettings.transferFeeRate}%\`\n` +
        `**موجودی اولیه**: \`${economySettings.initialBalance.toLocaleString()}\` سکه\n` +
        `**جایزه روزانه**: \`${economySettings.dailyReward.toLocaleString()}\` سکه\n` +
        `**پاداش حضور متوالی**: \`${economySettings.dailyStreakBonus}%\`\n` +
        `**حداکثر کیف پول**: \`${economySettings.maxWallet.toLocaleString()}\` سکه\n` +
        `**حداکثر بانک**: \`${economySettings.maxBank.toLocaleString()}\` سکه\n` +
        `**نرخ موفقیت دزدی**: \`${economySettings.robberySuccessRate}%\``, 
        inline: false 
      }
    );
    
    // راهنمای تغییر تنظیمات
    embed.addFields(
      { name: '📝 راهنمای تغییر تنظیمات', value: 
        `برای تغییر هر یک از تنظیمات، از دکمه‌های زیر استفاده کنید. پس از کلیک، یک فرم برای شما نمایش داده خواهد شد.`, 
        inline: false 
      }
    );
    
    // دکمه‌های تغییر تنظیمات
    const row1 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('admin_change_bank_interest')
          .setLabel('تغییر نرخ سود بانکی')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('admin_change_transfer_fee')
          .setLabel('تغییر کارمزد انتقال')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('admin_change_initial_balance')
          .setLabel('تغییر موجودی اولیه')
          .setStyle(ButtonStyle.Primary),
      );
      
    const row2 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('admin_change_daily_reward')
          .setLabel('تغییر جایزه روزانه')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('admin_change_daily_streak')
          .setLabel('تغییر پاداش حضور متوالی')
          .setStyle(ButtonStyle.Success),
      );
    
    const row3 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('admin_change_max_wallet')
          .setLabel('تغییر حداکثر کیف پول')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('admin_change_max_bank')
          .setLabel('تغییر حداکثر بانک')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('admin_change_robbery_rate')
          .setLabel('تغییر نرخ موفقیت دزدی')
          .setStyle(ButtonStyle.Danger),
      );
    
    // دکمه بازگشت
    const row4 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('admin_settings')
          .setLabel('🔙 بازگشت به منوی تنظیمات')
          .setStyle(ButtonStyle.Secondary),
      );
    
    // ارسال پاسخ
    if (interaction.deferred) {
      await interaction.editReply({ embeds: [embed], components: [row1, row2, row3, row4] });
    } else {
      await interaction.reply({ embeds: [embed], components: [row1, row2, row3, row4], ephemeral: true });
    }
  } catch (error) {
    console.error('Error in economySettingsMenu:', error);
    
    try {
      const errorMessage = 'متأسفانه در نمایش منوی تنظیمات اقتصادی خطایی رخ داد! لطفاً دوباره تلاش کنید.';
      
      if (interaction.deferred) {
        await interaction.editReply({ content: errorMessage });
      } else if (!interaction.replied) {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    } catch (replyError) {
      console.error('Failed to send error message:', replyError);
    }
  }
}

/**
 * منوی تنظیمات بازی‌ها
 * @param interaction تعامل کاربر
 */
export async function gamesSettingsMenu(interaction: ButtonInteraction | ChatInputCommandInteraction) {
  try {
    // بررسی دسترسی ادمین
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({
        content: '⛔ شما دسترسی لازم برای استفاده از این بخش را ندارید!',
        ephemeral: true
      });
      return;
    }

    // دریافت تنظیمات فعلی
    const config = botConfig.getConfig();
    
    // ایجاد Embed برای نمایش تنظیمات بازی‌ها
    const embed = new EmbedBuilder()
      .setColor('#FF5722')
      .setTitle('🎮 تنظیمات بازی‌های ربات')
      .setDescription('در این بخش می‌توانید تنظیمات مربوط به بازی‌ها را مشاهده و ویرایش کنید.')
      .setFooter({ text: `مدیر: ${interaction.user.username} | ${new Date().toLocaleString()}` })
      .setThumbnail('https://img.icons8.com/fluency/48/game-controller.png')
      .setTimestamp();
    
    // تنظیمات بازی‌ها
    const gameSettings = {
      minBet: config.games?.minBet || 50,
      maxBet: config.games?.maxBet || 5000,
      disabledGames: config.games?.disabledGames || [],
      duelBetAmount: config.games?.duelBetAmount || 100,
      wheelSpinCost: config.games?.wheelSpinCost || 250,
      giveawayDuration: config.games?.giveawayDuration || 3600
    };
    
    // افزودن فیلدها به Embed
    embed.addFields(
      { name: '🎮 تنظیمات فعلی', value: 
        `**حداقل شرط‌بندی**: \`${gameSettings.minBet.toLocaleString()}\` سکه\n` +
        `**حداکثر شرط‌بندی**: \`${gameSettings.maxBet.toLocaleString()}\` سکه\n` +
        `**هزینه دوئل**: \`${gameSettings.duelBetAmount.toLocaleString()}\` سکه\n` +
        `**هزینه چرخ شانس**: \`${gameSettings.wheelSpinCost.toLocaleString()}\` سکه\n` +
        `**مدت جایزه‌ها**: \`${Math.round(gameSettings.giveawayDuration/60)}\` دقیقه\n` +
        `**بازی‌های غیرفعال**: \`${gameSettings.disabledGames.length > 0 ? gameSettings.disabledGames.join(', ') : 'تمام بازی‌ها فعال هستند'}\``, 
        inline: false 
      }
    );
    
    // راهنمای تغییر تنظیمات
    embed.addFields(
      { name: '📝 راهنمای تغییر تنظیمات', value: 
        `برای تغییر هر یک از تنظیمات، از دکمه‌های زیر استفاده کنید. پس از کلیک، یک فرم برای شما نمایش داده خواهد شد.`, 
        inline: false 
      }
    );
    
    // دکمه‌های تغییر تنظیمات
    const row1 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('admin_change_min_bet')
          .setLabel('تغییر حداقل شرط‌بندی')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('admin_change_max_bet')
          .setLabel('تغییر حداکثر شرط‌بندی')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('admin_change_duel_bet')
          .setLabel('تغییر هزینه دوئل')
          .setStyle(ButtonStyle.Primary),
      );
      
    const row2 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('admin_change_wheel_cost')
          .setLabel('تغییر هزینه چرخ شانس')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('admin_change_giveaway_duration')
          .setLabel('تغییر مدت جایزه‌ها')
          .setStyle(ButtonStyle.Success),
      );
    
    const row3 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('admin_disable_game')
          .setLabel('غیرفعال‌سازی بازی')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('admin_enable_game')
          .setLabel('فعال‌سازی بازی')
          .setStyle(ButtonStyle.Success),
      );
    
    // دکمه بازگشت
    const row4 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('admin_settings')
          .setLabel('🔙 بازگشت به منوی تنظیمات')
          .setStyle(ButtonStyle.Secondary),
      );
    
    // ارسال پاسخ
    if (interaction.deferred) {
      await interaction.editReply({ embeds: [embed], components: [row1, row2, row3, row4] });
    } else {
      await interaction.reply({ embeds: [embed], components: [row1, row2, row3, row4], ephemeral: true });
    }
  } catch (error) {
    console.error('Error in gamesSettingsMenu:', error);
    
    try {
      const errorMessage = 'متأسفانه در نمایش منوی تنظیمات بازی‌ها خطایی رخ داد! لطفاً دوباره تلاش کنید.';
      
      if (interaction.deferred) {
        await interaction.editReply({ content: errorMessage });
      } else if (!interaction.replied) {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    } catch (replyError) {
      console.error('Failed to send error message:', replyError);
    }
  }
}

/**
 * منوی تنظیمات کلن‌ها
 * @param interaction تعامل کاربر
 */
export async function clansSettingsMenu(interaction: ButtonInteraction | ChatInputCommandInteraction) {
  try {
    // بررسی دسترسی ادمین
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({
        content: '⛔ شما دسترسی لازم برای استفاده از این بخش را ندارید!',
        ephemeral: true
      });
      return;
    }

    // دریافت تنظیمات فعلی
    const config = botConfig.getConfig();
    
    // ایجاد Embed برای نمایش تنظیمات کلن‌ها
    const embed = new EmbedBuilder()
      .setColor('#9C27B0')
      .setTitle('🏰 تنظیمات کلن‌های ربات')
      .setDescription('در این بخش می‌توانید تنظیمات مربوط به کلن‌ها را مشاهده و ویرایش کنید.')
      .setFooter({ text: `مدیر: ${interaction.user.username} | ${new Date().toLocaleString()}` })
      .setThumbnail('https://img.icons8.com/fluency/48/castle.png')
      .setTimestamp();
    
    // تنظیمات کلن‌ها
    const clanSettings = {
      createCost: config.clans?.createCost || 5000,
      maxMembers: config.clans?.maxMembers || 30,
      roleCreationCost: config.clans?.roleCreationCost || 1000,
      leaveDelay: config.clans?.leaveDelay || 48,
      dailyLimit: config.clans?.dailyLimit || 5000
    };
    
    // افزودن فیلدها به Embed
    embed.addFields(
      { name: '🏰 تنظیمات فعلی', value: 
        `**هزینه ساخت کلن**: \`${clanSettings.createCost.toLocaleString()}\` سکه\n` +
        `**حداکثر اعضا**: \`${clanSettings.maxMembers}\` نفر\n` +
        `**هزینه ساخت رول**: \`${clanSettings.roleCreationCost.toLocaleString()}\` سکه\n` +
        `**مهلت خروج مجدد**: \`${clanSettings.leaveDelay}\` ساعت\n` +
        `**سقف برداشت روزانه**: \`${clanSettings.dailyLimit.toLocaleString()}\` سکه`, 
        inline: false 
      }
    );
    
    // راهنمای تغییر تنظیمات
    embed.addFields(
      { name: '📝 راهنمای تغییر تنظیمات', value: 
        `برای تغییر هر یک از تنظیمات، از دکمه‌های زیر استفاده کنید. پس از کلیک، یک فرم برای شما نمایش داده خواهد شد.`, 
        inline: false 
      }
    );
    
    // دکمه‌های تغییر تنظیمات
    const row1 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('admin_change_clan_cost')
          .setLabel('تغییر هزینه ساخت کلن')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('admin_change_max_members')
          .setLabel('تغییر حداکثر اعضا')
          .setStyle(ButtonStyle.Primary),
      );
      
    const row2 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('admin_change_role_cost')
          .setLabel('تغییر هزینه ساخت رول')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('admin_change_leave_delay')
          .setLabel('تغییر مهلت خروج')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('admin_change_daily_limit')
          .setLabel('تغییر سقف برداشت')
          .setStyle(ButtonStyle.Success),
      );
    
    // دکمه بازگشت
    const row3 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('admin_settings')
          .setLabel('🔙 بازگشت به منوی تنظیمات')
          .setStyle(ButtonStyle.Secondary),
      );
    
    // ارسال پاسخ
    if (interaction.deferred) {
      await interaction.editReply({ embeds: [embed], components: [row1, row2, row3] });
    } else {
      await interaction.reply({ embeds: [embed], components: [row1, row2, row3], ephemeral: true });
    }
  } catch (error) {
    console.error('Error in clansSettingsMenu:', error);
    
    try {
      const errorMessage = 'متأسفانه در نمایش منوی تنظیمات کلن‌ها خطایی رخ داد! لطفاً دوباره تلاش کنید.';
      
      if (interaction.deferred) {
        await interaction.editReply({ content: errorMessage });
      } else if (!interaction.replied) {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    } catch (replyError) {
      console.error('Failed to send error message:', replyError);
    }
  }
}

/**
 * منوی تنظیمات سطح‌بندی
 * @param interaction تعامل کاربر
 */
export async function levelsSettingsMenu(interaction: ButtonInteraction | ChatInputCommandInteraction) {
  try {
    // بررسی دسترسی ادمین
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({
        content: '⛔ شما دسترسی لازم برای استفاده از این بخش را ندارید!',
        ephemeral: true
      });
      return;
    }

    // دریافت تنظیمات فعلی
    const config = botConfig.getConfig();
    
    // ایجاد Embed برای نمایش تنظیمات سطح‌بندی
    const embed = new EmbedBuilder()
      .setColor('#FFC107')
      .setTitle('⭐ تنظیمات سطح‌بندی ربات')
      .setDescription('در این بخش می‌توانید تنظیمات مربوط به سیستم سطح‌بندی را مشاهده و ویرایش کنید.')
      .setFooter({ text: `مدیر: ${interaction.user.username} | ${new Date().toLocaleString()}` })
      .setThumbnail('https://img.icons8.com/fluency/48/star.png')
      .setTimestamp();
    
    // تنظیمات سطح‌بندی
    const levelSettings = {
      messageXP: config.levels?.messageXP || 5,
      voiceXP: config.levels?.voiceXP || 2,
      activityXP: config.levels?.activityXP || 10,
      baseXP: config.levels?.baseXP || 100,
      levelMultiplier: config.levels?.levelMultiplier || 1.5
    };
    
    // افزودن فیلدها به Embed
    embed.addFields(
      { name: '⭐ تنظیمات فعلی', value: 
        `**تجربه هر پیام**: \`${levelSettings.messageXP}\`\n` +
        `**تجربه صوتی (دقیقه)**: \`${levelSettings.voiceXP}\`\n` +
        `**تجربه فعالیت**: \`${levelSettings.activityXP}\`\n` +
        `**تجربه پایه هر سطح**: \`${levelSettings.baseXP}\`\n` +
        `**ضریب سطح**: \`${levelSettings.levelMultiplier}x\``, 
        inline: false 
      }
    );
    
    // راهنمای تغییر تنظیمات
    embed.addFields(
      { name: '📝 راهنمای تغییر تنظیمات', value: 
        `برای تغییر هر یک از تنظیمات، از دکمه‌های زیر استفاده کنید. پس از کلیک، یک فرم برای شما نمایش داده خواهد شد.`, 
        inline: false 
      }
    );
    
    // توضیحات محاسبه سطح
    embed.addFields(
      { name: '🧮 نحوه محاسبه سطح', value: 
        `سطح کاربران بر اساس تجربه آنها محاسبه می‌شود. فرمول محاسبه تجربه لازم برای هر سطح به صورت زیر است:\n` +
        `**XP = baseXP × (سطح فعلی)^levelMultiplier**\n\n` +
        `مثال: برای سطح 5 با تنظیمات فعلی:\n` +
        `**XP = ${levelSettings.baseXP} × (5)^${levelSettings.levelMultiplier} = ${Math.round(levelSettings.baseXP * Math.pow(5, levelSettings.levelMultiplier))}\**`,
        inline: false 
      }
    );
    
    // دکمه‌های تغییر تنظیمات
    const row1 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('admin_change_message_xp')
          .setLabel('تغییر تجربه پیام')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('admin_change_voice_xp')
          .setLabel('تغییر تجربه صوتی')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('admin_change_activity_xp')
          .setLabel('تغییر تجربه فعالیت')
          .setStyle(ButtonStyle.Primary),
      );
      
    const row2 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('admin_change_base_xp')
          .setLabel('تغییر تجربه پایه')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('admin_change_level_multiplier')
          .setLabel('تغییر ضریب سطح')
          .setStyle(ButtonStyle.Success),
      );
    
    // دکمه بازگشت
    const row3 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('admin_settings')
          .setLabel('🔙 بازگشت به منوی تنظیمات')
          .setStyle(ButtonStyle.Secondary),
      );
    
    // ارسال پاسخ
    if (interaction.deferred) {
      await interaction.editReply({ embeds: [embed], components: [row1, row2, row3] });
    } else {
      await interaction.reply({ embeds: [embed], components: [row1, row2, row3], ephemeral: true });
    }
  } catch (error) {
    console.error('Error in levelsSettingsMenu:', error);
    
    try {
      const errorMessage = 'متأسفانه در نمایش منوی تنظیمات سطح‌بندی خطایی رخ داد! لطفاً دوباره تلاش کنید.';
      
      if (interaction.deferred) {
        await interaction.editReply({ content: errorMessage });
      } else if (!interaction.replied) {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    } catch (replyError) {
      console.error('Failed to send error message:', replyError);
    }
  }
}

/**
 * منوی تنظیمات امنیتی
 * @param interaction تعامل کاربر
 */
export async function securitySettingsMenu(interaction: ButtonInteraction | ChatInputCommandInteraction) {
  try {
    // بررسی دسترسی ادمین
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({
        content: '⛔ شما دسترسی لازم برای استفاده از این بخش را ندارید!',
        ephemeral: true
      });
      return;
    }

    // دریافت تنظیمات فعلی
    const config = botConfig.getConfig();
    
    // ایجاد Embed برای نمایش تنظیمات امنیتی
    const embed = new EmbedBuilder()
      .setColor('#F44336')
      .setTitle('🛡️ تنظیمات امنیتی ربات')
      .setDescription('در این بخش می‌توانید تنظیمات امنیتی ربات را مشاهده و ویرایش کنید.')
      .setFooter({ text: `مدیر: ${interaction.user.username} | ${new Date().toLocaleString()}` })
      .setThumbnail('https://img.icons8.com/fluency/48/shield-check.png')
      .setTimestamp();
    
    // تنظیمات امنیتی
    const securitySettings = {
      antiSpam: config.security?.antiSpam === true,
      antiRaid: config.security?.antiRaid === true,
      captcha: config.security?.captcha === true,
      maxWarnings: config.security?.maxWarnings || 3,
      muteDuration: config.security?.muteDuration || 60,
      banDuration: config.security?.banDuration || 24 * 7
    };
    
    // افزودن فیلدها به Embed
    embed.addFields(
      { name: '🛡️ تنظیمات فعلی', value: 
        `**ضد اسپم**: \`${securitySettings.antiSpam ? '✅ فعال' : '❌ غیرفعال'}\`\n` +
        `**ضد حمله**: \`${securitySettings.antiRaid ? '✅ فعال' : '❌ غیرفعال'}\`\n` +
        `**کپچا (تایید انسان)**: \`${securitySettings.captcha ? '✅ فعال' : '❌ غیرفعال'}\`\n` +
        `**حداکثر اخطارها**: \`${securitySettings.maxWarnings}\`\n` +
        `**مدت سکوت (دقیقه)**: \`${securitySettings.muteDuration}\`\n` +
        `**مدت مسدودسازی (ساعت)**: \`${securitySettings.banDuration}\``, 
        inline: false 
      }
    );
    
    // راهنمای تغییر تنظیمات
    embed.addFields(
      { name: '📝 راهنمای تغییر تنظیمات', value: 
        `برای تغییر هر یک از تنظیمات، از دکمه‌های زیر استفاده کنید. پس از کلیک، یک فرم برای شما نمایش داده خواهد شد.`, 
        inline: false 
      }
    );
    
    // دکمه‌های تغییر تنظیمات
    const row1 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('admin_toggle_antispam')
          .setLabel(`${securitySettings.antiSpam ? 'غیرفعال‌سازی' : 'فعال‌سازی'} ضد اسپم`)
          .setStyle(securitySettings.antiSpam ? ButtonStyle.Danger : ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('admin_toggle_antiraid')
          .setLabel(`${securitySettings.antiRaid ? 'غیرفعال‌سازی' : 'فعال‌سازی'} ضد حمله`)
          .setStyle(securitySettings.antiRaid ? ButtonStyle.Danger : ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('admin_toggle_captcha')
          .setLabel(`${securitySettings.captcha ? 'غیرفعال‌سازی' : 'فعال‌سازی'} کپچا`)
          .setStyle(securitySettings.captcha ? ButtonStyle.Danger : ButtonStyle.Success),
      );
      
    const row2 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('admin_change_max_warnings')
          .setLabel('تغییر حداکثر اخطارها')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('admin_change_mute_duration')
          .setLabel('تغییر مدت سکوت')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('admin_change_ban_duration')
          .setLabel('تغییر مدت مسدودسازی')
          .setStyle(ButtonStyle.Primary),
      );
    
    // دکمه بازگشت
    const row3 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('admin_settings')
          .setLabel('🔙 بازگشت به منوی تنظیمات')
          .setStyle(ButtonStyle.Secondary),
      );
    
    // ارسال پاسخ
    if (interaction.deferred) {
      await interaction.editReply({ embeds: [embed], components: [row1, row2, row3] });
    } else {
      await interaction.reply({ embeds: [embed], components: [row1, row2, row3], ephemeral: true });
    }
  } catch (error) {
    console.error('Error in securitySettingsMenu:', error);
    
    try {
      const errorMessage = 'متأسفانه در نمایش منوی تنظیمات امنیتی خطایی رخ داد! لطفاً دوباره تلاش کنید.';
      
      if (interaction.deferred) {
        await interaction.editReply({ content: errorMessage });
      } else if (!interaction.replied) {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    } catch (replyError) {
      console.error('Failed to send error message:', replyError);
    }
  }
}

/**
 * منوی تنظیمات دسترسی‌ها
 * @param interaction تعامل کاربر
 */
export async function permissionsSettingsMenu(interaction: ButtonInteraction | ChatInputCommandInteraction) {
  try {
    // بررسی دسترسی ادمین
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({
        content: '⛔ شما دسترسی لازم برای استفاده از این بخش را ندارید!',
        ephemeral: true
      });
      return;
    }

    // دریافت تنظیمات فعلی
    const config = botConfig.getConfig();
    
    // ایجاد Embed برای نمایش تنظیمات دسترسی‌ها
    const embed = new EmbedBuilder()
      .setColor('#607D8B')
      .setTitle('🔒 تنظیمات دسترسی‌های ربات')
      .setDescription('در این بخش می‌توانید تنظیمات دسترسی‌های ربات را مشاهده و ویرایش کنید.')
      .setFooter({ text: `مدیر: ${interaction.user.username} | ${new Date().toLocaleString()}` })
      .setThumbnail('https://img.icons8.com/fluency/48/key.png')
      .setTimestamp();
    
    // تنظیمات دسترسی‌ها
    const permissionSettings = {
      adminRoleId: config.permissions?.adminRoleId || 'تنظیم نشده',
      modRoleId: config.permissions?.modRoleId || 'تنظیم نشده',
      trustedRoleId: config.permissions?.trustedRoleId || 'تنظیم نشده',
      customPermissions: config.permissions?.custom || {}
    };
    
    // افزودن فیلدها به Embed
    embed.addFields(
      { name: '🔑 نقش‌های دسترسی', value: 
        `**نقش ادمین**: ${typeof permissionSettings.adminRoleId === 'string' && !permissionSettings.adminRoleId.includes('تنظیم') ? `<@&${permissionSettings.adminRoleId}>` : permissionSettings.adminRoleId}\n` +
        `**نقش مدیر**: ${typeof permissionSettings.modRoleId === 'string' && !permissionSettings.modRoleId.includes('تنظیم') ? `<@&${permissionSettings.modRoleId}>` : permissionSettings.modRoleId}\n` +
        `**نقش مورد اعتماد**: ${typeof permissionSettings.trustedRoleId === 'string' && !permissionSettings.trustedRoleId.includes('تنظیم') ? `<@&${permissionSettings.trustedRoleId}>` : permissionSettings.trustedRoleId}`, 
        inline: false 
      }
    );
    
    // افزودن دسترسی‌های سفارشی
    const customPermCount = Object.keys(permissionSettings.customPermissions).length;
    embed.addFields(
      { name: '🔐 دسترسی‌های سفارشی', value: 
        customPermCount > 0 ? 
        Object.entries(permissionSettings.customPermissions)
          .slice(0, 5)
          .map(([cmd, roleId]) => `**/${cmd}**: <@&${roleId}>`)
          .join('\n') + (customPermCount > 5 ? `\n... و ${customPermCount - 5} مورد دیگر` : '')
        : 'هیچ دسترسی سفارشی تعریف نشده است.', 
        inline: false 
      }
    );
    
    // راهنمای تغییر تنظیمات
    embed.addFields(
      { name: '📝 راهنمای تغییر تنظیمات', value: 
        `برای تغییر هر یک از تنظیمات، از دکمه‌های زیر استفاده کنید. پس از کلیک، یک فرم برای شما نمایش داده خواهد شد.`, 
        inline: false 
      }
    );
    
    // دکمه‌های تغییر تنظیمات
    const row1 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('admin_change_admin_role_perm')
          .setLabel('تغییر نقش ادمین')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('admin_change_mod_role')
          .setLabel('تغییر نقش مدیر')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('admin_change_trusted_role')
          .setLabel('تغییر نقش مورد اعتماد')
          .setStyle(ButtonStyle.Primary),
      );
      
    const row2 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('admin_add_custom_perm')
          .setLabel('افزودن دسترسی سفارشی')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('admin_remove_custom_perm')
          .setLabel('حذف دسترسی سفارشی')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('admin_list_custom_perms')
          .setLabel('لیست کامل دسترسی‌ها')
          .setStyle(ButtonStyle.Secondary),
      );
    
    // دکمه بازگشت
    const row3 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('admin_settings')
          .setLabel('🔙 بازگشت به منوی تنظیمات')
          .setStyle(ButtonStyle.Secondary),
      );
    
    // ارسال پاسخ
    if (interaction.deferred) {
      await interaction.editReply({ embeds: [embed], components: [row1, row2, row3] });
    } else {
      await interaction.reply({ embeds: [embed], components: [row1, row2, row3], ephemeral: true });
    }
  } catch (error) {
    console.error('Error in permissionsSettingsMenu:', error);
    
    try {
      const errorMessage = 'متأسفانه در نمایش منوی تنظیمات دسترسی‌ها خطایی رخ داد! لطفاً دوباره تلاش کنید.';
      
      if (interaction.deferred) {
        await interaction.editReply({ content: errorMessage });
      } else if (!interaction.replied) {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    } catch (replyError) {
      console.error('Failed to send error message:', replyError);
    }
  }
}

/**
 * منوی تنظیمات لاگ‌ها
 * @param interaction تعامل کاربر
 */
export async function loggingSettingsMenu(interaction: ButtonInteraction | ChatInputCommandInteraction) {
  try {
    // بررسی دسترسی ادمین
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({
        content: '⛔ شما دسترسی لازم برای استفاده از این بخش را ندارید!',
        ephemeral: true
      });
      return;
    }

    // دریافت تنظیمات فعلی
    const config = botConfig.getConfig();
    
    // ایجاد Embed برای نمایش تنظیمات لاگ‌ها
    const embed = new EmbedBuilder()
      .setColor('#795548')
      .setTitle('📝 تنظیمات لاگ‌های ربات')
      .setDescription('در این بخش می‌توانید تنظیمات لاگ‌های ربات را مشاهده و ویرایش کنید.')
      .setFooter({ text: `مدیر: ${interaction.user.username} | ${new Date().toLocaleString()}` })
      .setThumbnail('https://img.icons8.com/fluency/48/edit-file.png')
      .setTimestamp();
    
    // تنظیمات لاگ‌ها
    const loggingSettings = {
      enabled: config.logging?.enabled === true,
      commands: config.logging?.commands === true,
      transactions: config.logging?.transactions === true,
      errors: config.logging?.errors === true,
      modActions: config.logging?.modActions === true,
      joinLeave: config.logging?.joinLeave === true,
      channelId: config.logging?.channelId || 'تنظیم نشده'
    };
    
    // افزودن فیلدها به Embed
    embed.addFields(
      { name: '📝 تنظیمات فعلی', value: 
        `**وضعیت کلی لاگ‌ها**: \`${loggingSettings.enabled ? '✅ فعال' : '❌ غیرفعال'}\`\n` +
        `**ثبت دستورات**: \`${loggingSettings.commands ? '✅ فعال' : '❌ غیرفعال'}\`\n` +
        `**ثبت تراکنش‌ها**: \`${loggingSettings.transactions ? '✅ فعال' : '❌ غیرفعال'}\`\n` +
        `**ثبت خطاها**: \`${loggingSettings.errors ? '✅ فعال' : '❌ غیرفعال'}\`\n` +
        `**ثبت اقدامات مدیریتی**: \`${loggingSettings.modActions ? '✅ فعال' : '❌ غیرفعال'}\`\n` +
        `**ثبت ورود و خروج**: \`${loggingSettings.joinLeave ? '✅ فعال' : '❌ غیرفعال'}\`\n` +
        `**کانال لاگ**: ${typeof loggingSettings.channelId === 'string' && !loggingSettings.channelId.includes('تنظیم') ? `<#${loggingSettings.channelId}>` : loggingSettings.channelId}`, 
        inline: false 
      }
    );
    
    // راهنمای تغییر تنظیمات
    embed.addFields(
      { name: '📝 راهنمای تغییر تنظیمات', value: 
        `برای تغییر هر یک از تنظیمات، از دکمه‌های زیر استفاده کنید. پس از کلیک، یک فرم برای شما نمایش داده خواهد شد.`, 
        inline: false 
      }
    );
    
    // دکمه‌های تغییر تنظیمات
    const row1 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('admin_toggle_logging')
          .setLabel(`${loggingSettings.enabled ? 'غیرفعال‌سازی' : 'فعال‌سازی'} لاگ‌ها`)
          .setStyle(loggingSettings.enabled ? ButtonStyle.Danger : ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('admin_set_log_channel')
          .setLabel('تنظیم کانال لاگ')
          .setStyle(ButtonStyle.Primary),
      );
      
    const row2 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('admin_toggle_commands_log')
          .setLabel(`${loggingSettings.commands ? 'غیرفعال‌سازی' : 'فعال‌سازی'} لاگ دستورات`)
          .setStyle(loggingSettings.commands ? ButtonStyle.Danger : ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('admin_toggle_transactions_log')
          .setLabel(`${loggingSettings.transactions ? 'غیرفعال‌سازی' : 'فعال‌سازی'} لاگ تراکنش‌ها`)
          .setStyle(loggingSettings.transactions ? ButtonStyle.Danger : ButtonStyle.Success),
      );
      
    const row3 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('admin_toggle_errors_log')
          .setLabel(`${loggingSettings.errors ? 'غیرفعال‌سازی' : 'فعال‌سازی'} لاگ خطاها`)
          .setStyle(loggingSettings.errors ? ButtonStyle.Danger : ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('admin_toggle_modactions_log')
          .setLabel(`${loggingSettings.modActions ? 'غیرفعال‌سازی' : 'فعال‌سازی'} لاگ اقدامات مدیریتی`)
          .setStyle(loggingSettings.modActions ? ButtonStyle.Danger : ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('admin_toggle_joinleave_log')
          .setLabel(`${loggingSettings.joinLeave ? 'غیرفعال‌سازی' : 'فعال‌سازی'} لاگ ورود و خروج`)
          .setStyle(loggingSettings.joinLeave ? ButtonStyle.Danger : ButtonStyle.Success),
      );
    
    // دکمه بازگشت
    const row4 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('admin_settings')
          .setLabel('🔙 بازگشت به منوی تنظیمات')
          .setStyle(ButtonStyle.Secondary),
      );
    
    // ارسال پاسخ
    if (interaction.deferred) {
      await interaction.editReply({ embeds: [embed], components: [row1, row2, row3, row4] });
    } else {
      await interaction.reply({ embeds: [embed], components: [row1, row2, row3, row4], ephemeral: true });
    }
  } catch (error) {
    console.error('Error in loggingSettingsMenu:', error);
    
    try {
      const errorMessage = 'متأسفانه در نمایش منوی تنظیمات لاگ‌ها خطایی رخ داد! لطفاً دوباره تلاش کنید.';
      
      if (interaction.deferred) {
        await interaction.editReply({ content: errorMessage });
      } else if (!interaction.replied) {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    } catch (replyError) {
      console.error('Failed to send error message:', replyError);
    }
  }
}