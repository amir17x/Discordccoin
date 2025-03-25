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
import { StockData, UserStockData } from '@shared/schema';

/**
 * سیستم معاملات سهام
 * امکان خرید و فروش سهام شرکت‌های مختلف با قیمت‌های متغیر
 */
export async function stocksMenu(
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

    // Get all stocks from storage
    const stocks = await storage.getAllStocks();
    
    // Get user's stock portfolio
    const userStocks = await storage.getUserStocks(user.id);

    // Calculate portfolio value
    let portfolioValue = 0;
    let totalInvestment = 0;
    let profit = 0;

    // Process based on submenu
    let embed = new EmbedBuilder()
      .setColor('#00A86B')
      .setFooter({ text: `کیف پول: ${user.wallet} Ccoin | سهام: ${userStocks.length} مورد` })
      .setTimestamp();

    let components: ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>[] = [];

    switch (subMenu) {
      case 'main':
        // Main stock market menu
        embed
          .setTitle('📈 بازار سهام Ccoin')
          .setDescription('به بازار سهام خوش آمدید! شما می‌توانید سهام خریداری کنید یا سهام موجود خود را بفروشید و سود کسب کنید.\n\n' +
                         '🔹 با خرید سهام، در شرکت‌های مختلف سرمایه‌گذاری کنید\n' +
                         '🔹 قیمت‌ها به صورت دوره‌ای تغییر می‌کنند\n' +
                         '🔹 در زمان مناسب بفروشید و سود کنید\n' +
                         '🔹 سهام بخش مالی سود سهام پرداخت می‌کنند')
          .setThumbnail('https://img.icons8.com/fluency/48/stocks-growth.png') // آیکون stocks-growth برای بخش بازار سهام

        // Calculate portfolio value and profit/loss
        if (userStocks.length > 0) {
          for (const userStock of userStocks) {
            const stock = stocks.find(s => s.id === userStock.stockId);
            if (stock) {
              const currentValue = stock.currentPrice * userStock.quantity;
              const initialValue = userStock.purchasePrice * userStock.quantity;
              
              portfolioValue += currentValue;
              totalInvestment += initialValue;
            }
          }
          
          profit = portfolioValue - totalInvestment;
          const profitPercent = totalInvestment > 0 ? ((profit / totalInvestment) * 100).toFixed(2) : '0.00';
          
          embed.addFields(
            { name: '💼 ارزش فعلی پورتفولیو', value: `${Math.floor(portfolioValue)} Ccoin`, inline: true },
            { name: '💰 سرمایه‌گذاری اولیه', value: `${Math.floor(totalInvestment)} Ccoin`, inline: true },
            { name: `${profit >= 0 ? '📈 سود' : '📉 ضرر'}`, value: `${Math.floor(profit)} Ccoin (${profitPercent}%)`, inline: true }
          );
        } else {
          embed.addFields(
            { name: '💼 پورتفولیو سهام', value: 'شما هنوز هیچ سهامی خریداری نکرده‌اید.', inline: false }
          );
        }

        // Menu buttons
        const row1 = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('stocks_market')
              .setLabel('🏢 بازار سهام')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId('stocks_portfolio')
              .setLabel('💼 پورتفولیو')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId('stocks_info')
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

      case 'market':
        // Display available stocks to buy
        embed
          .setTitle('🏢 بازار سهام')
          .setDescription('لیست سهام موجود برای خرید. برای خرید سهام، روی دکمه خرید کلیک کنید.')
          .setThumbnail('https://img.icons8.com/fluency/48/business-building.png') // آیکون business-building برای بخش بازار سهام

        // Show all available stocks
        if (stocks.length > 0) {
          // Create a select menu for the stocks
          const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('stocks_select_buy')
            .setPlaceholder('یک سهام برای خرید انتخاب کنید')
            .setMinValues(1)
            .setMaxValues(1);

          // Add options for each stock
          stocks.forEach(stock => {
            const priceTrend = stock.currentPrice > stock.previousPrice 
              ? '📈' 
              : (stock.currentPrice < stock.previousPrice ? '📉' : '📊');
            
            const priceChange = stock.previousPrice > 0 
              ? ((stock.currentPrice - stock.previousPrice) / stock.previousPrice * 100).toFixed(2) 
              : '0.00';
              
            selectMenu.addOptions(
              new StringSelectMenuOptionBuilder()
                .setLabel(`${stock.symbol} - ${stock.name}`)
                .setDescription(`${stock.currentPrice} Ccoin (${priceTrend} ${priceChange}%)`)
                .setValue(`buy_stock_${stock.id}`)
            );
            
            // Add stock details to embed
            embed.addFields({
              name: `${priceTrend} ${stock.symbol} - ${stock.name}`,
              value: `💰 قیمت: ${stock.currentPrice} Ccoin\n` +
                     `📊 تغییر: ${priceChange}%\n` +
                     `🏭 صنعت: ${getSectorName(stock.sector)}\n` +
                     `📋 موجودی: ${stock.availableShares} سهم`,
              inline: true
            });
          });

          const selectRow = new ActionRowBuilder<StringSelectMenuBuilder>()
            .addComponents(selectMenu);

          components.push(selectRow);
        } else {
          embed.setDescription('در حال حاضر هیچ سهامی برای خرید وجود ندارد.');
        }

        // Add back button
        const backRow = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('stocks')
              .setLabel('🔙 بازگشت به منوی سهام')
              .setStyle(ButtonStyle.Secondary)
          );

        components.push(backRow);
        break;

      case 'portfolio':
        // Display user's stocks
        embed
          .setTitle('💼 پورتفولیو سهام')
          .setDescription('سهام‌هایی که شما خریداری کرده‌اید. برای فروش سهام، از منوی پایین انتخاب کنید.')
          .setThumbnail('https://img.icons8.com/fluency/48/folder-invoices.png'); // آیکون folder-invoices برای پورتفولیو

        if (userStocks.length > 0) {
          // Create a select menu for selling stocks
          const sellMenu = new StringSelectMenuBuilder()
            .setCustomId('stocks_select_sell')
            .setPlaceholder('یک سهام برای فروش انتخاب کنید')
            .setMinValues(1)
            .setMaxValues(1);

          // Add each stock to the embed and menu
          for (const userStock of userStocks) {
            const stock = stocks.find(s => s.id === userStock.stockId);
            if (stock) {
              const currentValue = stock.currentPrice * userStock.quantity;
              const initialValue = userStock.purchasePrice * userStock.quantity;
              const stockProfit = currentValue - initialValue;
              const profitPercent = ((stockProfit / initialValue) * 100).toFixed(2);
              const profitIcon = stockProfit >= 0 ? '📈' : '📉';
              
              embed.addFields({
                name: `${stock.symbol} - ${stock.name}`,
                value: `🔢 تعداد: ${userStock.quantity} سهم\n` + 
                       `💵 قیمت خرید: ${userStock.purchasePrice} Ccoin\n` +
                       `💰 قیمت فعلی: ${stock.currentPrice} Ccoin\n` +
                       `${profitIcon} سود/ضرر: ${Math.floor(stockProfit)} Ccoin (${profitPercent}%)\n` +
                       `📅 تاریخ خرید: ${new Date(userStock.purchaseDate).toLocaleDateString('fa-IR')}`,
                inline: true
              });

              // Add to sell menu
              sellMenu.addOptions(
                new StringSelectMenuOptionBuilder()
                  .setLabel(`${stock.symbol} - ${userStock.quantity} سهم`)
                  .setDescription(`قیمت فعلی: ${stock.currentPrice} Ccoin (${profitIcon} ${profitPercent}%)`)
                  .setValue(`sell_stock_${stock.id}`)
              );
            }
          }

          const sellRow = new ActionRowBuilder<StringSelectMenuBuilder>()
            .addComponents(sellMenu);

          components.push(sellRow);
        } else {
          embed.setDescription('شما هیچ سهامی در پورتفولیوی خود ندارید.\n\nبرای خرید سهام به بخش بازار سهام مراجعه کنید.');
        }

        // Add back button
        const backToStocksRow = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('stocks')
              .setLabel('🔙 بازگشت به منوی سهام')
              .setStyle(ButtonStyle.Secondary)
          );

        components.push(backToStocksRow);
        break;

      case 'info':
        // Stock market information
        embed
          .setTitle('ℹ️ راهنمای بازار سهام')
          .setDescription('راهنمای استفاده از بازار سهام Ccoin:')
          .setThumbnail('https://img.icons8.com/fluency/48/help.png') // آیکون help برای راهنما
          .addFields(
            { 
              name: '📋 نحوه خرید سهام', 
              value: '1. به بخش «بازار سهام» بروید\n' +
                     '2. از منوی کشویی، سهام مورد نظر خود را انتخاب کنید\n' +
                     '3. تعداد سهام را وارد کنید\n' +
                     '4. سهام خریداری شده به پورتفولیوی شما اضافه می‌شود', 
              inline: false 
            },
            { 
              name: '💰 نحوه فروش سهام', 
              value: '1. به بخش «پورتفولیو» بروید\n' +
                     '2. از منوی کشویی، سهامی که می‌خواهید بفروشید را انتخاب کنید\n' +
                     '3. تعداد سهام برای فروش را وارد کنید\n' +
                     '4. مبلغ فروش به کیف پول شما اضافه می‌شود', 
              inline: false 
            },
            { 
              name: '📈 تغییرات قیمت', 
              value: 'قیمت سهام به طور خودکار و بر اساس عوامل زیر تغییر می‌کند:\n' +
                     '• نوسان (Volatility): میزان تغییرات قیمت\n' +
                     '• روند (Trend): جهت کلی حرکت قیمت\n' +
                     '• بخش اقتصادی (Sector): هر بخش رفتار متفاوتی دارد', 
              inline: false 
            },
            { 
              name: '💹 سود سهام', 
              value: 'سهام شرکت‌های بخش مالی (Finance) که روند مثبت دارند، به طور دوره‌ای سود سهام پرداخت می‌کنند که مستقیماً به حساب بانکی شما واریز می‌شود.', 
              inline: false 
            },
            {
              name: '🏭 بخش‌های اقتصادی',
              value: '• فناوری (Tech): نوسان بالا، پتانسیل رشد زیاد\n' +
                    '• مالی (Finance): نوسان متوسط، پرداخت سود سهام\n' +
                    '• انرژی (Energy): وابسته به شرایط اقتصادی\n' +
                    '• مصرفی (Consumer): ثبات نسبی\n' +
                    '• صنعتی (Industrial): رشد پایدار',
              inline: false
            }
          );

        // Add back button
        const backButtonRow = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('stocks')
              .setLabel('🔙 بازگشت به منوی سهام')
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
    console.error('Error in stocks menu:', error);
    try {
      await interaction.reply({ 
        content: '❌ خطایی در نمایش منوی سهام رخ داد. لطفا دوباره تلاش کنید.', 
        ephemeral: true 
      });
    } catch (e) {
      console.error('Error replying with error message:', e);
    }
  }
}

/**
 * تبدیل کد بخش اقتصادی به نام فارسی
 */
function getSectorName(sector: string): string {
  const sectorNames: Record<string, string> = {
    'tech': 'فناوری',
    'finance': 'مالی',
    'energy': 'انرژی',
    'consumer': 'مصرفی',
    'industrial': 'صنعتی'
  };
  
  return sectorNames[sector] || sector;
}

/**
 * پردازش خرید سهام
 */
export async function processBuyStock(
  interaction: MessageComponentInteraction | ModalSubmitInteraction,
  stockId: number,
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

    const stock = await storage.getStock(stockId);
    if (!stock) {
      return await interaction.reply({ 
        content: '❌ سهام مورد نظر یافت نشد.', 
        ephemeral: true 
      });
    }

    // Check if stock has enough shares available
    if (stock.availableShares < quantity) {
      return await interaction.reply({ 
        content: `❌ تعداد سهام درخواستی شما (${quantity}) بیشتر از سهام موجود (${stock.availableShares}) است.`, 
        ephemeral: true 
      });
    }

    // Calculate total cost
    const totalCost = Math.ceil(stock.currentPrice * quantity);

    // Check if user has enough money
    if (user.wallet < totalCost) {
      return await interaction.reply({ 
        content: `❌ موجودی کافی نیست. شما به ${totalCost} Ccoin نیاز دارید اما فقط ${user.wallet} Ccoin در کیف پول خود دارید.`, 
        ephemeral: true 
      });
    }

    // Buy stock
    const success = await storage.buyStock(user.id, stockId, quantity);
    
    if (success) {
      const embed = new EmbedBuilder()
        .setColor('#00A86B')
        .setTitle('✅ خرید سهام موفق')
        .setDescription(`شما با موفقیت ${quantity} سهم ${stock.symbol} خریداری کردید.`)
        .addFields(
          { name: '💰 قیمت خرید', value: `${stock.currentPrice} Ccoin`, inline: true },
          { name: '🔢 تعداد', value: `${quantity} سهم`, inline: true },
          { name: '💲 مبلغ کل', value: `${totalCost} Ccoin`, inline: true }
        )
        .setFooter({ text: `کیف پول فعلی: ${user.wallet - totalCost} Ccoin` })
        .setTimestamp();

      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('stocks_portfolio')
            .setLabel('💼 مشاهده پورتفولیو')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('stocks_market')
            .setLabel('🔙 بازگشت به بازار سهام')
            .setStyle(ButtonStyle.Secondary)
        );

      await interaction.reply({ embeds: [embed], components: [row], ephemeral: false });
    } else {
      await interaction.reply({ 
        content: '❌ خرید سهام با مشکل مواجه شد. لطفا دوباره تلاش کنید.', 
        ephemeral: true 
      });
    }
  } catch (error) {
    console.error('Error processing buy stock:', error);
    await interaction.reply({ 
      content: '❌ خطایی در خرید سهام رخ داد. لطفا دوباره تلاش کنید.', 
      ephemeral: true 
    });
  }
}

/**
 * پردازش فروش سهام
 */
export async function processSellStock(
  interaction: MessageComponentInteraction | ModalSubmitInteraction,
  stockId: number,
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

    const stock = await storage.getStock(stockId);
    if (!stock) {
      return await interaction.reply({ 
        content: '❌ سهام مورد نظر یافت نشد.', 
        ephemeral: true 
      });
    }

    // Get user's stocks
    const userStocks = await storage.getUserStocks(user.id);
    const userStock = userStocks.find(s => s.stockId === stockId);
    
    if (!userStock) {
      return await interaction.reply({ 
        content: '❌ شما این سهام را در پورتفولیوی خود ندارید.', 
        ephemeral: true 
      });
    }

    if (userStock.quantity < quantity) {
      return await interaction.reply({ 
        content: `❌ شما فقط ${userStock.quantity} سهم از این شرکت دارید.`, 
        ephemeral: true 
      });
    }

    // Calculate total value
    const totalValue = Math.floor(stock.currentPrice * quantity);
    const initialInvestment = Math.floor(userStock.purchasePrice * quantity);
    const profit = totalValue - initialInvestment;
    const profitPercent = ((profit / initialInvestment) * 100).toFixed(2);

    // Sell stock
    const success = await storage.sellStock(user.id, stockId, quantity);
    
    if (success) {
      const embed = new EmbedBuilder()
        .setColor(profit >= 0 ? '#00A86B' : '#FF4500')
        .setTitle('✅ فروش سهام موفق')
        .setDescription(`شما با موفقیت ${quantity} سهم ${stock.symbol} فروختید.`)
        .addFields(
          { name: '💰 قیمت فروش', value: `${stock.currentPrice} Ccoin`, inline: true },
          { name: '🔢 تعداد', value: `${quantity} سهم`, inline: true },
          { name: '💲 مبلغ کل', value: `${totalValue} Ccoin`, inline: true },
          { name: '💵 قیمت خرید', value: `${userStock.purchasePrice} Ccoin`, inline: true },
          { name: '📊 سرمایه اولیه', value: `${initialInvestment} Ccoin`, inline: true },
          { name: profit >= 0 ? '📈 سود' : '📉 ضرر', value: `${profit} Ccoin (${profitPercent}%)`, inline: true }
        )
        .setFooter({ text: `کیف پول فعلی: ${user.wallet + totalValue} Ccoin` })
        .setTimestamp();

      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('stocks_portfolio')
            .setLabel('💼 مشاهده پورتفولیو')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('stocks_market')
            .setLabel('🔙 بازگشت به بازار سهام')
            .setStyle(ButtonStyle.Secondary)
        );

      await interaction.reply({ embeds: [embed], components: [row], ephemeral: false });
    } else {
      await interaction.reply({ 
        content: '❌ فروش سهام با مشکل مواجه شد. لطفا دوباره تلاش کنید.', 
        ephemeral: true 
      });
    }
  } catch (error) {
    console.error('Error processing sell stock:', error);
    await interaction.reply({ 
      content: '❌ خطایی در فروش سهام رخ داد. لطفا دوباره تلاش کنید.', 
      ephemeral: true 
    });
  }
}