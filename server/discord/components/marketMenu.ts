import { ActionRowBuilder, ButtonBuilder, EmbedBuilder, StringSelectMenuBuilder } from 'discord.js';
import { storage } from '../../storage';
import { formatNumber } from '../utils/formatters';
import { getUserByDiscordId } from '../utils/userUtils';
import { config } from '../../config';

// تابع برای بازکردن فهرست اصلی بازار
export async function showMarketMenu(discordId: string, username: string) {
  try {
    // بررسی اینکه کاربر ثبت‌نام کرده است
    const user = await storage.getUserByDiscordId(discordId);
    if (!user) {
      return {
        content: '❌ شما هنوز ثبت‌نام نکرده‌اید! برای ثبت‌نام از دستور `/register` استفاده کنید.',
        ephemeral: true
      };
    }

    // ساخت صفحه اصلی بازار
    const embed = new EmbedBuilder()
      .setTitle('🛒 بازار سکه - جایی برای خرید و فروش')
      .setDescription('به بازار سکه خوش آمدید! در اینجا می‌توانید آیتم‌های خود را بفروشید و یا از آیتم‌های دیگران خرید کنید.')
      .setColor('#FFA500')
      .addFields(
        { name: '💰 موجودی کیف پول', value: `${formatNumber(user.wallet)} سکه`, inline: true },
        { name: '📊 وضعیت بازار', value: 'فعال', inline: true },
        { name: '\u200B', value: '\u200B' },
        { name: '📋 راهنما', value: 'می‌توانید با انتخاب یک گزینه به بخش‌های مختلف بازار دسترسی داشته باشید.' }
      )
      .setFooter({ text: `${username} | درخواست شده توسط` })
      .setTimestamp();

    // دکمه‌های بازار
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('market_regular')
          .setLabel('🏪 بازار عادی')
          .setStyle(1), // PRIMARY

        new ButtonBuilder()
          .setCustomId('market_black')
          .setLabel('🕶️ بازار سیاه')
          .setStyle(4), // DANGER
          
        new ButtonBuilder()
          .setCustomId('market_my_listings')
          .setLabel('📦 آگهی‌های من')
          .setStyle(2), // SECONDARY
          
        new ButtonBuilder()
          .setCustomId('market_new_listing')
          .setLabel('➕ ثبت آگهی جدید')
          .setStyle(3) // SUCCESS
      );

    const secondRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('main_menu')
          .setLabel('🏠 بازگشت به منوی اصلی')
          .setStyle(2) // SECONDARY
      );

    return {
      embeds: [embed],
      components: [row, secondRow]
    };
  } catch (error) {
    console.error('خطا در نمایش منوی بازار:', error);
    return {
      content: '❌ مشکلی در بارگذاری منوی بازار پیش آمد. لطفاً دوباره تلاش کنید.',
      ephemeral: true
    };
  }
}

// تابع برای نمایش آگهی‌های بازار عادی
export async function showRegularMarket(discordId: string, username: string, page = 0) {
  try {
    // دریافت آگهی‌های بازار عادی
    const listings = await storage.getMarketListings('regular');
    
    if (listings.length === 0) {
      return {
        embeds: [
          new EmbedBuilder()
            .setTitle('🏪 بازار عادی - آیتم‌ها')
            .setDescription('در حال حاضر هیچ آگهی فعالی در بازار عادی وجود ندارد.')
            .setColor('#FFA500')
            .setFooter({ text: `${username} | صفحه 1/1` })
            .setTimestamp()
        ],
        components: [
          new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('market_menu')
                .setLabel('🔙 بازگشت به بازار')
                .setStyle(2) // SECONDARY
            )
        ]
      };
    }

    // تعداد آیتم در هر صفحه
    const itemsPerPage = 5;
    const maxPage = Math.ceil(listings.length / itemsPerPage);
    
    // محدود کردن شماره صفحه
    if (page < 0) page = 0;
    if (page >= maxPage) page = maxPage - 1;
    
    // آیتم‌های صفحه فعلی
    const pageListings = listings.slice(page * itemsPerPage, (page + 1) * itemsPerPage);
    
    // ساخت امبد برای نمایش آیتم‌ها
    const embed = new EmbedBuilder()
      .setTitle('🏪 بازار عادی - آیتم‌ها')
      .setDescription('لیست آیتم‌های موجود در بازار عادی:')
      .setColor('#FFA500')
      .setFooter({ text: `${username} | صفحه ${page + 1}/${maxPage}` })
      .setTimestamp();
      
    // اضافه کردن آیتم‌ها به امبد
    for (const listing of pageListings) {
      const expiresIn = Math.max(0, Math.floor((new Date(listing.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
      embed.addFields({
        name: `${listing.itemEmoji} ${listing.itemName} (${listing.quantity} عدد)`,
        value: `💰 قیمت: ${formatNumber(listing.price)} سکه\n👤 فروشنده: ${listing.sellerName}\n⏱️ انقضا: ${expiresIn} روز دیگر\n🔖 شناسه: \`${listing._id}\``
      });
    }
    
    // دکمه‌های صفحه‌بندی و خرید
    const navRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`market_regular_page_${page - 1}`)
          .setLabel('◀️ قبلی')
          .setStyle(2) // SECONDARY
          .setDisabled(page <= 0),
          
        new ButtonBuilder()
          .setCustomId('market_menu')
          .setLabel('🔙 بازگشت به بازار')
          .setStyle(2), // SECONDARY
          
        new ButtonBuilder()
          .setCustomId(`market_regular_page_${page + 1}`)
          .setLabel('بعدی ▶️')
          .setStyle(2) // SECONDARY
          .setDisabled(page >= maxPage - 1)
      );
      
    // دکمه خرید
    const buyRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('market_buy_item')
          .setLabel('🛒 خرید آیتم')
          .setStyle(3) // SUCCESS
      );
      
    return {
      embeds: [embed],
      components: [navRow, buyRow]
    };
  } catch (error) {
    console.error('خطا در نمایش بازار عادی:', error);
    return {
      content: '❌ مشکلی در بارگذاری بازار عادی پیش آمد. لطفاً دوباره تلاش کنید.',
      ephemeral: true
    };
  }
}

// تابع برای نمایش آگهی‌های بازار سیاه
export async function showBlackMarket(discordId: string, username: string, page = 0) {
  try {
    // دریافت آگهی‌های بازار سیاه
    const listings = await storage.getMarketListings('black_market');
    
    if (listings.length === 0) {
      return {
        embeds: [
          new EmbedBuilder()
            .setTitle('🕶️ بازار سیاه - آیتم‌های کمیاب')
            .setDescription('در حال حاضر هیچ آگهی فعالی در بازار سیاه وجود ندارد.')
            .setColor('#800020') // Burgundy color
            .setFooter({ text: `${username} | صفحه 1/1` })
            .setTimestamp()
        ],
        components: [
          new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('market_menu')
                .setLabel('🔙 بازگشت به بازار')
                .setStyle(2) // SECONDARY
            )
        ]
      };
    }

    // تعداد آیتم در هر صفحه
    const itemsPerPage = 5;
    const maxPage = Math.ceil(listings.length / itemsPerPage);
    
    // محدود کردن شماره صفحه
    if (page < 0) page = 0;
    if (page >= maxPage) page = maxPage - 1;
    
    // آیتم‌های صفحه فعلی
    const pageListings = listings.slice(page * itemsPerPage, (page + 1) * itemsPerPage);
    
    // ساخت امبد برای نمایش آیتم‌ها
    const embed = new EmbedBuilder()
      .setTitle('🕶️ بازار سیاه - آیتم‌های کمیاب')
      .setDescription('لیست آیتم‌های موجود در بازار سیاه:')
      .setColor('#800020') // Burgundy color
      .setFooter({ text: `${username} | صفحه ${page + 1}/${maxPage}` })
      .setTimestamp();
      
    // اضافه کردن آیتم‌ها به امبد
    for (const listing of pageListings) {
      const expiresIn = Math.max(0, Math.floor((new Date(listing.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
      embed.addFields({
        name: `${listing.itemEmoji} ${listing.itemName} (${listing.quantity} عدد)`,
        value: `💰 قیمت: ${formatNumber(listing.price)} سکه\n👤 فروشنده: ${listing.sellerName}\n⏱️ انقضا: ${expiresIn} روز دیگر\n💯 کیفیت: عالی\n🔖 شناسه: \`${listing._id}\``
      });
    }
    
    // دکمه‌های صفحه‌بندی و خرید
    const navRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`market_black_page_${page - 1}`)
          .setLabel('◀️ قبلی')
          .setStyle(2) // SECONDARY
          .setDisabled(page <= 0),
          
        new ButtonBuilder()
          .setCustomId('market_menu')
          .setLabel('🔙 بازگشت به بازار')
          .setStyle(2), // SECONDARY
          
        new ButtonBuilder()
          .setCustomId(`market_black_page_${page + 1}`)
          .setLabel('بعدی ▶️')
          .setStyle(2) // SECONDARY
          .setDisabled(page >= maxPage - 1)
      );
      
    // دکمه خرید
    const buyRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('market_buy_item')
          .setLabel('🛒 خرید آیتم')
          .setStyle(3) // SUCCESS
      );
      
    return {
      embeds: [embed],
      components: [navRow, buyRow]
    };
  } catch (error) {
    console.error('خطا در نمایش بازار سیاه:', error);
    return {
      content: '❌ مشکلی در بارگذاری بازار سیاه پیش آمد. لطفاً دوباره تلاش کنید.',
      ephemeral: true
    };
  }
}

// تابع برای نمایش آگهی‌های کاربر
export async function showMyListings(discordId: string, username: string, page = 0) {
  try {
    // دریافت آگهی‌های کاربر
    const listings = await storage.getUserMarketListings(discordId);
    
    if (listings.length === 0) {
      return {
        embeds: [
          new EmbedBuilder()
            .setTitle('📦 آگهی‌های من')
            .setDescription('شما هیچ آگهی فعالی در بازار ندارید.')
            .setColor('#4682B4') // Steel Blue
            .setFooter({ text: username })
            .setTimestamp()
        ],
        components: [
          new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('market_menu')
                .setLabel('🔙 بازگشت به بازار')
                .setStyle(2), // SECONDARY
                
              new ButtonBuilder()
                .setCustomId('market_new_listing')
                .setLabel('➕ ثبت آگهی جدید')
                .setStyle(3) // SUCCESS
            )
        ]
      };
    }

    // تعداد آیتم در هر صفحه
    const itemsPerPage = 5;
    const maxPage = Math.ceil(listings.length / itemsPerPage);
    
    // محدود کردن شماره صفحه
    if (page < 0) page = 0;
    if (page >= maxPage) page = maxPage - 1;
    
    // آیتم‌های صفحه فعلی
    const pageListings = listings.slice(page * itemsPerPage, (page + 1) * itemsPerPage);
    
    // ساخت امبد برای نمایش آیتم‌ها
    const embed = new EmbedBuilder()
      .setTitle('📦 آگهی‌های من')
      .setDescription('لیست آگهی‌های فعال شما در بازار:')
      .setColor('#4682B4') // Steel Blue
      .setFooter({ text: `${username} | صفحه ${page + 1}/${maxPage}` })
      .setTimestamp();
      
    // اضافه کردن آیتم‌ها به امبد
    for (const listing of pageListings) {
      const expiresIn = Math.max(0, Math.floor((new Date(listing.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
      const marketType = listing.listingType === 'regular' ? '🏪 بازار عادی' : '🕶️ بازار سیاه';
      
      embed.addFields({
        name: `${listing.itemEmoji} ${listing.itemName} (${listing.quantity} عدد)`,
        value: `💰 قیمت: ${formatNumber(listing.price)} سکه\n📊 نوع بازار: ${marketType}\n⏱️ انقضا: ${expiresIn} روز دیگر\n🔖 شناسه: \`${listing._id}\``
      });
    }
    
    // دکمه‌های صفحه‌بندی و مدیریت
    const navRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`market_mylistings_page_${page - 1}`)
          .setLabel('◀️ قبلی')
          .setStyle(2) // SECONDARY
          .setDisabled(page <= 0),
          
        new ButtonBuilder()
          .setCustomId('market_menu')
          .setLabel('🔙 بازگشت به بازار')
          .setStyle(2), // SECONDARY
          
        new ButtonBuilder()
          .setCustomId(`market_mylistings_page_${page + 1}`)
          .setLabel('بعدی ▶️')
          .setStyle(2) // SECONDARY
          .setDisabled(page >= maxPage - 1)
      );
      
    // دکمه‌های مدیریت
    const actionRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('market_remove_listing')
          .setLabel('🗑️ حذف آگهی')
          .setStyle(4), // DANGER
          
        new ButtonBuilder()
          .setCustomId('market_edit_listing')
          .setLabel('✏️ ویرایش آگهی')
          .setStyle(2), // SECONDARY
          
        new ButtonBuilder()
          .setCustomId('market_new_listing')
          .setLabel('➕ آگهی جدید')
          .setStyle(3) // SUCCESS
      );
      
    return {
      embeds: [embed],
      components: [navRow, actionRow]
    };
  } catch (error) {
    console.error('خطا در نمایش آگهی‌های کاربر:', error);
    return {
      content: '❌ مشکلی در بارگذاری آگهی‌های شما پیش آمد. لطفاً دوباره تلاش کنید.',
      ephemeral: true
    };
  }
}

// تابع برای شروع فرآیند ثبت آگهی جدید
export async function startNewListing(discordId: string, username: string) {
  try {
    const user = await storage.getUserByDiscordId(discordId);
    if (!user) {
      return {
        content: '❌ شما هنوز ثبت‌نام نکرده‌اید! برای ثبت‌نام از دستور `/register` استفاده کنید.',
        ephemeral: true
      };
    }
    
    // دریافت آیتم‌های موجود در کیف کاربر
    const inventoryItems = await storage.getInventoryItems(user.id);
    
    if (!inventoryItems || inventoryItems.length === 0) {
      return {
        embeds: [
          new EmbedBuilder()
            .setTitle('➕ ثبت آگهی جدید')
            .setDescription('شما هیچ آیتمی در کیف خود ندارید که بتوانید بفروشید.')
            .setColor('#ff6b6b')
            .setFooter({ text: username })
            .setTimestamp()
        ],
        components: [
          new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('market_menu')
                .setLabel('🔙 بازگشت به بازار')
                .setStyle(2) // SECONDARY
            )
        ]
      };
    }
    
    // ساخت امبد برای انتخاب آیتم
    const embed = new EmbedBuilder()
      .setTitle('➕ ثبت آگهی جدید')
      .setDescription('لطفاً آیتمی که می‌خواهید بفروشید را انتخاب کنید:')
      .setColor('#43b581')
      .setFooter({ text: username })
      .setTimestamp();
    
    // ساخت منوی انتخاب آیتم
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('market_select_item')
      .setPlaceholder('یک آیتم انتخاب کنید')
      .setMaxValues(1);
    
    // حداکثر 25 آیتم در منو (محدودیت دیسکورد)
    const maxItems = Math.min(inventoryItems.length, 25);
    
    for (let i = 0; i < maxItems; i++) {
      const item = inventoryItems[i];
      selectMenu.addOptions({
        label: `${item.item.name} (${item.inventoryItem.quantity} عدد)`,
        value: `${item.item.id}`,
        emoji: item.item.emoji,
        description: `قیمت خرید: ${formatNumber(item.item.price)} سکه`
      });
    }
    
    const row = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(selectMenu);
      
    const buttonRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('market_menu')
          .setLabel('🔙 انصراف')
          .setStyle(4) // DANGER
      );
      
    return {
      embeds: [embed],
      components: [row, buttonRow],
      ephemeral: true
    };
  } catch (error) {
    console.error('خطا در شروع فرآیند ثبت آگهی:', error);
    return {
      content: '❌ مشکلی در فرآیند ثبت آگهی پیش آمد. لطفاً دوباره تلاش کنید.',
      ephemeral: true
    };
  }
}

// تابع برای فرآیند خرید آیتم
export async function buyItem(discordId: string, username: string, listingId: string, quantity: number) {
  try {
    const result = await storage.buyFromMarket(discordId, listingId, quantity);
    
    if (!result.success) {
      return {
        content: `❌ ${result.message}`,
        ephemeral: true
      };
    }
    
    // ساخت امبد برای نمایش نتیجه خرید
    const embed = new EmbedBuilder()
      .setTitle('🛒 خرید موفقیت‌آمیز')
      .setDescription(result.message)
      .setColor('#43b581')
      .addFields(
        { name: '🏷️ آیتم', value: `${result.listing.itemEmoji} ${result.listing.itemName}`, inline: true },
        { name: '🔢 تعداد', value: `${quantity} عدد`, inline: true },
        { name: '💰 قیمت کل', value: `${formatNumber(result.listing.price * quantity)} سکه`, inline: true }
      )
      .setFooter({ text: username })
      .setTimestamp();
      
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('market_menu')
          .setLabel('🔙 بازگشت به بازار')
          .setStyle(2), // SECONDARY
          
        new ButtonBuilder()
          .setCustomId('inventory_menu')
          .setLabel('🎒 مشاهده کیف')
          .setStyle(2) // SECONDARY
      );
      
    return {
      embeds: [embed],
      components: [row],
      ephemeral: true
    };
  } catch (error) {
    console.error('خطا در خرید آیتم:', error);
    return {
      content: '❌ مشکلی در فرآیند خرید پیش آمد. لطفاً دوباره تلاش کنید.',
      ephemeral: true
    };
  }
}