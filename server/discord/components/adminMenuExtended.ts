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

    // ایجاد Embed اصلی
    const embed = new EmbedBuilder()
      .setColor('#2196F3')
      .setTitle('⚙️ تنظیمات ربات Ccoin')
      .setDescription('به بخش تنظیمات ربات خوش آمدید. در این بخش می‌توانید تنظیمات مختلف ربات را تغییر دهید.')
      .setFooter({ text: `مدیر: ${interaction.user.username} | ${new Date().toLocaleString()}` })
      .setThumbnail('https://img.icons8.com/fluency/48/settings.png')
      .setTimestamp();

    // افزودن تنظیمات فعلی به Embed
    embed.addFields(
      { name: '📝 پیشوند دستورات', value: `\`${config.prefix || '/'}\``, inline: true },
      { name: '🎨 رنگ پیش‌فرض', value: `\`${config.defaultColor || '#FFFFFF'}\``, inline: true },
      { name: '👑 نقش ادمین', value: config.general?.adminRoleId ? `<@&${config.general.adminRoleId}>` : 'تنظیم نشده', inline: true },
      { name: '💰 نرخ سود بانکی', value: `${config.economy?.bankInterestRate || 2}% روزانه`, inline: true },
      { name: '💸 کارمزد انتقال', value: `${config.economy?.transferFee || 5}%`, inline: true },
      { name: '⚔️ هزینه دوئل', value: `${config.games?.duelBetAmount || 50} سکه`, inline: true },
      { name: '👥 حداکثر اعضای کلن', value: `${config.clans?.maxMembers || 30} نفر`, inline: true },
      { name: '📊 وضعیت لاگ‌ها', value: config.logging?.enabled ? '✅ فعال' : '❌ غیرفعال', inline: true }
    );

    // ایجاد دکمه‌های مدیریتی
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
      
    const row2 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('admin_settings_levels')
          .setLabel('⭐ تنظیمات سطح‌بندی')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('admin_settings_permissions')
          .setLabel('🔒 دسترسی‌های ربات')
          .setStyle(ButtonStyle.Primary),
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

    // محاسبه تعداد سرورهای فعال
    const client = interaction.client;
    const totalGuilds = client.guilds.cache.size;
    const totalMembers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);

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
      { name: '🎮 کاربران فعال (7 روز)', value: `${activePlayers}`, inline: true },
      
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
    const users = await storage.getAllUsers();
    return users.length;
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
 * دریافت کاربران فعال در 7 روز اخیر
 */
async function getActivePlayers(): Promise<number> {
  try {
    const users = await storage.getAllUsers();
    const now = Date.now();
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
    
    let activeCount = 0;
    
    for (const user of users) {
      // اگر تاریخ آخرین فعالیت کاربر وجود داشته باشد و در 7 روز اخیر باشد
      if (user.lastActive && new Date(user.lastActive).getTime() > sevenDaysAgo) {
        activeCount++;
      }
    }
    
    return activeCount;
  } catch (error) {
    console.error('Error getting active players:', error);
    return 0;
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