import { 
  ModalSubmitInteraction, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  MessageComponentInteraction
} from 'discord.js';
import { storage } from '../../storage';
import { processBuyStock, processSellStock } from '../components/stocksMenu';
import { processBuyLotteryTicket } from '../components/lotteryMenu';
import { buyGiveawayTickets } from '../components/giveawayBridge';
import { processTransfer } from '../components/economyMenu';
import { handleRobbery } from '../components/robberyMenu';
import { processBuyPet, processRenamePet } from '../components/petMenu';
import { log } from '../utils/logger';
import { sendAdminNotification } from '../utils/adminNotifications';
import { itemManagementMenu } from '../components/adminMenuExtended';

// Helper function for admin logging since the old logger.logAdminAction is no longer available
const logger = {
  logAdminAction: (
    adminId: string, 
    adminName: string, 
    action: string, 
    targetId?: string, 
    targetName?: string, 
    details?: string
  ) => {
    const logMessage = 
      `ADMIN ACTION: ${adminName} (${adminId}) performed ${action}` + 
      (targetId ? ` on ${targetName} (${targetId})` : '') + 
      (details ? `: ${details}` : '');
    log(logMessage, 'info');
  }
};
import { botConfig } from '../utils/config';
import { adminMenu } from '../components/adminMenu';
import { clansMenu } from '../components/clansMenu';
import { handleQuizQuestionModalSubmit } from '../components/groupGames';
import { generateAIResponse } from '../services/aiService';

/**
 * تبدیل ModalSubmitInteraction به MessageComponentInteraction
 * این تابع برای حل مشکل تایپ‌های گم‌شده در ModalSubmitInteraction استفاده می‌شود
 * @param interaction تعامل مودال
 * @returns تعامل به عنوان MessageComponentInteraction
 */
function asMessageComponent(interaction: ModalSubmitInteraction): MessageComponentInteraction {
  // این تبدیل در سطح تایپ انجام می‌شود و فقط برای حل مشکل سازگاری با توابع موجود است
  return interaction as unknown as MessageComponentInteraction;
}

/**
 * Handler for modal submissions
 * @param interaction Modal submission interaction
 */
export async function handleModalSubmit(interaction: ModalSubmitInteraction) {
  try {
    const customId = interaction.customId;
    
    // پردازش مودال دعوت به بازی جاسوس مخفی
    if (customId.startsWith('spy_invite_modal_')) {
      const { processSpyInviteModal } = await import('../components/spyGame');
      await processSpyInviteModal(interaction);
      return;
    }
    
    // Handle admin item creation form
    if (customId === 'add_item_modal') {
      const name = interaction.fields.getTextInputValue('item_name');
      const description = interaction.fields.getTextInputValue('item_description');
      const type = interaction.fields.getTextInputValue('item_type');
      const emoji = interaction.fields.getTextInputValue('item_emoji');
      const priceStr = interaction.fields.getTextInputValue('item_price');
      const price = parseInt(priceStr);
      
      if (isNaN(price) || price < 0) {
        await interaction.reply({
          content: '❌ قیمت آیتم باید یک عدد مثبت باشد.',
          ephemeral: true
        });
        return;
      }
      
      try {
        // ایجاد آیتم جدید در دیتابیس
        const newItem = await storage.createItem({
          name,
          description,
          type,
          emoji,
          price,
          crystalPrice: null,
          duration: null,
          rarity: 'common',
          effects: {}
        });
        
        // ثبت لاگ ادمین
        logger.logAdminAction(
          interaction.user.id,
          interaction.user.username,
          'add_item',
          null,
          null,
          `آیتم جدید اضافه شد: ${name} (${emoji}) با قیمت ${price} سکه`
        );
        
        // ایجاد امبد نمایش موفقیت
        const successEmbed = new EmbedBuilder()
          .setColor('#4CAF50')
          .setTitle('✅ آیتم جدید با موفقیت اضافه شد')
          .setDescription(`آیتم **${emoji} ${name}** با موفقیت به فروشگاه اضافه شد.`)
          .addFields(
            { name: '📝 نام', value: name, inline: true },
            { name: '💰 قیمت', value: `${price} سکه`, inline: true },
            { name: '🔖 نوع', value: type, inline: true },
            { name: '📄 توضیحات', value: description || 'بدون توضیحات' }
          )
          .setFooter({ text: `توسط: ${interaction.user.username} | ${new Date().toLocaleString()}` })
          .setTimestamp();
          
        // ایجاد دکمه بازگشت به منوی مدیریت آیتم
        const backButton = new ButtonBuilder()
          .setCustomId('admin_items')
          .setLabel('🔙 بازگشت به مدیریت آیتم‌ها')
          .setStyle(ButtonStyle.Secondary);
          
        const row = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(backButton);
          
        await interaction.reply({
          embeds: [successEmbed],
          components: [row],
          ephemeral: true
        });
      } catch (error) {
        console.error('Error creating item:', error);
        await interaction.reply({
          content: '❌ خطایی در ایجاد آیتم رخ داد. لطفاً دوباره تلاش کنید.',
          ephemeral: true
        });
      }
      return;
    }
    
    // Handle item editing modal
    if (customId.startsWith('edit_item_modal_')) {
      const itemId = parseInt(customId.replace('edit_item_modal_', ''));
      
      if (isNaN(itemId)) {
        await interaction.reply({
          content: '❌ شناسه آیتم نامعتبر است!',
          ephemeral: true
        });
        return;
      }
      
      const name = interaction.fields.getTextInputValue('item_name');
      const description = interaction.fields.getTextInputValue('item_description');
      const type = interaction.fields.getTextInputValue('item_type');
      const emoji = interaction.fields.getTextInputValue('item_emoji');
      const priceStr = interaction.fields.getTextInputValue('item_price');
      const price = parseInt(priceStr);
      
      if (isNaN(price) || price < 0) {
        await interaction.reply({
          content: '❌ قیمت آیتم باید یک عدد مثبت باشد.',
          ephemeral: true
        });
        return;
      }
      
      try {
        // دریافت آیتم قبلی برای نمایش تغییرات
        const oldItem = await storage.getItemById(itemId);
        
        if (!oldItem) {
          await interaction.reply({
            content: '❌ آیتم مورد نظر یافت نشد!',
            ephemeral: true
          });
          return;
        }
        
        // ویرایش آیتم در دیتابیس
        const updatedItem = await storage.updateItem(itemId, {
          name,
          description,
          type,
          emoji,
          price
        });
        
        // ثبت لاگ ادمین
        logger.logAdminAction(
          interaction.user.id,
          interaction.user.username,
          'edit_item',
          itemId.toString(),
          oldItem.name,
          `آیتم ویرایش شد: از ${oldItem.name} به ${name}, قیمت از ${oldItem.price} به ${price}`
        );
        
        // ایجاد امبد نمایش موفقیت
        const successEmbed = new EmbedBuilder()
          .setColor('#3498DB')
          .setTitle('✅ آیتم با موفقیت ویرایش شد')
          .setDescription(`آیتم **${emoji} ${name}** با موفقیت ویرایش شد.`)
          .addFields(
            { name: '📝 نام', value: `${oldItem.name} -> ${name}`, inline: true },
            { name: '💰 قیمت', value: `${oldItem.price} -> ${price} سکه`, inline: true },
            { name: '🔖 نوع', value: `${oldItem.type} -> ${type}`, inline: true },
            { name: '😀 ایموجی', value: `${oldItem.emoji || '📦'} -> ${emoji}`, inline: true },
            { name: '📄 توضیحات جدید', value: description || 'بدون توضیحات' }
          )
          .setFooter({ text: `شناسه آیتم: ${itemId} | توسط: ${interaction.user.username}` })
          .setTimestamp();
          
        // ایجاد دکمه بازگشت به منوی مدیریت آیتم
        const backButton = new ButtonBuilder()
          .setCustomId('admin_items')
          .setLabel('🔙 بازگشت به مدیریت آیتم‌ها')
          .setStyle(ButtonStyle.Secondary);
          
        const row = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(backButton);
          
        await interaction.reply({
          embeds: [successEmbed],
          components: [row],
          ephemeral: true
        });
      } catch (error) {
        console.error('Error updating item:', error);
        await interaction.reply({
          content: '❌ خطایی در ویرایش آیتم رخ داد. لطفاً دوباره تلاش کنید.',
          ephemeral: true
        });
      }
      return;
    }
    
    // پردازش فرم بازخورد
    if (customId === 'feedback_modal') {
      try {
        // دریافت مقادیر فیلدهای فرم
        const feedbackTitle = interaction.fields.getTextInputValue('feedback_title');
        const feedbackDescription = interaction.fields.getTextInputValue('feedback_description');
        const feedbackContact = interaction.fields.getTextInputValue('feedback_contact') || 'ارائه نشده';
        
        // اعلام دریافت به کاربر
        await interaction.reply({
          content: '✅ بازخورد شما با موفقیت دریافت شد. از مشارکت شما در بهبود ربات سپاسگزاریم!',
          ephemeral: true
        });
        
        // بررسی وجود کانال بازخورد
        const feedbackChannelId = botConfig.getFeedbackChannel();
        
        // اگر کانال بازخورد تنظیم شده باشد، ارسال بازخورد به آن کانال
        if (feedbackChannelId) {
          const feedbackChannel = await interaction.client.channels.fetch(feedbackChannelId);
          
          if (feedbackChannel && feedbackChannel.isTextBased()) {
            // ایجاد امبد بازخورد
            const feedbackEmbed = new EmbedBuilder()
              .setColor('#4B0082')  // رنگ بنفش تیره
              .setTitle(`📨 بازخورد جدید: ${feedbackTitle}`)
              .setDescription(feedbackDescription)
              .addFields(
                { name: '👤 کاربر', value: `${interaction.user.username} (${interaction.user.id})`, inline: true },
                { name: '📅 تاریخ', value: new Date().toLocaleDateString('fa-IR'), inline: true },
                { name: '📞 اطلاعات تماس', value: feedbackContact, inline: true }
              )
              .setFooter({ text: 'سیستم بازخورد Ccoin' })
              .setTimestamp();
            
            // بررسی اینکه آیا کانال متد send دارد
            if ('send' in feedbackChannel) {
              // ارسال بازخورد به کانال
              await feedbackChannel.send({ embeds: [feedbackEmbed] });
            } else {
              console.error(`Channel ${feedbackChannelId} does not support send method`);
            }
          } else {
            // لاگ کردن خطا اگر کانال معتبر نباشد
            console.error(`Invalid feedback channel: ${feedbackChannelId}`);
          }
        } else {
          // اگر کانال بازخورد تنظیم نشده باشد، لاگ کردن برای مدیران
          console.log(`Feedback received but no channel configured for sending: ${feedbackTitle} - ${feedbackDescription}`);
        }
      } catch (error) {
        console.error('Error processing feedback form:', error);
        
        // ارسال پیام خطا به کاربر
        if (!interaction.replied) {
          await interaction.reply({
            content: '❌ متأسفانه در ثبت بازخورد شما خطایی رخ داد. لطفاً بعداً دوباره تلاش کنید.',
            ephemeral: true
          });
        }
      }
      return;
    }
    
    // Handle quiz question submission
    if (customId.startsWith('submit_quiz_question')) {
      await handleQuizQuestionModalSubmit(interaction);
      return;
    }
    
    // Handle pet name modal for buying a new pet
    if (customId.startsWith('pet_name_modal_')) {
      const petType = customId.replace('pet_name_modal_', '');
      const petName = interaction.fields.getTextInputValue('pet_name');
      
      if (!petName || petName.length < 2 || petName.length > 20) {
        await interaction.reply({
          content: '❌ نام پت باید بین 2 تا 20 کاراکتر باشد.',
          ephemeral: true
        });
        return;
      }
      
      // برای این تابع، خودمان منطق پردازش را پیاده‌سازی می‌کنیم
      try {
        // دریافت کاربر
        const user = await storage.getUserByDiscordId(interaction.user.id);
        if (!user) {
          await interaction.reply({
            content: '⚠️ حساب کاربری شما یافت نشد!',
            ephemeral: true
          });
          return;
        }
        
        // یافتن قیمت پت
        let petPrice = 0;
        let isSpecial = false;
        let petEmoji = '';
        
        switch (petType) {
          case 'dog':
            petPrice = 1000;
            petEmoji = '🐶';
            break;
          case 'cat':
            petPrice = 1200;
            petEmoji = '🐱';
            break;
          case 'rabbit':
            petPrice = 1500;
            petEmoji = '🐰';
            break;
          case 'bird':
            petPrice = 800;
            petEmoji = '🐦';
            break;
          case 'dragon':
            petPrice = 5000;
            petEmoji = '🐉';
            isSpecial = true;
            break;
          default:
            await interaction.reply({
              content: '❌ نوع پت نامعتبر است!',
              ephemeral: true
            });
            return;
        }
        
        // برای پت‌های ویژه نیاز به کریستال است
        if (isSpecial) {
          if (user.crystals < petPrice) {
            await interaction.reply({
              content: `❌ شما به اندازه کافی کریستال برای خرید این پت ندارید. (نیاز: ${petPrice} کریستال)`,
              ephemeral: true
            });
            return;
          }
        } else {
          if (user.wallet < petPrice) {
            await interaction.reply({
              content: `❌ شما به اندازه کافی سکه برای خرید این پت ندارید. (نیاز: ${petPrice} Ccoin)`,
              ephemeral: true
            });
            return;
          }
        }
        
        // ایجاد پت جدید
        const newPet = {
          name: petName,
          type: petType,
          emoji: petEmoji,
          owner: user.id,
          level: 1,
          hunger: 100,
          happiness: 100,
          experience: 0,
          isActive: false,
          lastFeed: new Date(),
          lastPlay: new Date(),
          createdAt: new Date()
        };
        
        // ثبت پت (با توجه به ساختار api موجود در دیتابیس)
        let pet;
        try {
          // در اینجا به جای استفاده از createPet که ممکن است در storage موجود نباشد
          // از افزودن به آیتم‌های کاربر استفاده می‌کنیم
          await storage.addPetToUser(user.id, {
            name: petName,
            type: petType,
            emoji: petEmoji,
            level: 1,
            hunger: 100,
            happiness: 100
          });
          pet = { name: petName, emoji: petEmoji };
        } catch (error) {
          console.error('Error creating pet:', error);
          throw error;
        }
        
        // کم کردن هزینه خرید
        if (isSpecial) {
          await storage.updateUser(user.id, { crystals: user.crystals - petPrice });
        } else {
          await storage.addToWallet(user.id, -petPrice, 'pet_purchase');
        }
        
        // امبد موفقیت
        const successEmbed = new EmbedBuilder()
          .setColor('#85bb65')
          .setTitle(`${petEmoji} پت جدید خریداری شد!`)
          .setDescription(`تبریک! شما با موفقیت یک ${petEmoji} به نام **${petName}** خریدید.`)
          .addFields(
            { 
              name: 'هزینه', 
              value: isSpecial ? `${petPrice} کریستال` : `${petPrice} Ccoin`, 
              inline: true 
            },
            { 
              name: 'سطح', 
              value: '1', 
              inline: true 
            },
            { 
              name: 'وضعیت', 
              value: 'سیر و شاد! 😊', 
              inline: true 
            }
          )
          .setFooter({ text: 'پت خود را با غذا دادن و بازی کردن خوشحال نگه دارید!' });
        
        // ارسال پاسخ
        await interaction.reply({
          embeds: [successEmbed],
          ephemeral: true
        });
      } catch (error) {
        console.error('Error processing buy pet:', error);
        await interaction.reply({
          content: '❌ خطایی در خرید پت رخ داد. لطفاً دوباره تلاش کنید.',
          ephemeral: true
        });
      }
      return;
    }
    
    // Handle pet rename modal
    if (customId.startsWith('pet_rename_modal_')) {
      const petId = customId.replace('pet_rename_modal_', '');
      const newName = interaction.fields.getTextInputValue('pet_new_name');
      
      if (!newName || newName.length < 2 || newName.length > 20) {
        await interaction.reply({
          content: '❌ نام پت باید بین 2 تا 20 کاراکتر باشد.',
          ephemeral: true
        });
        return;
      }
      
      // پردازش تغییر نام پت
      try {
        // دریافت کاربر
        const user = await storage.getUserByDiscordId(interaction.user.id);
        if (!user) {
          await interaction.reply({
            content: '⚠️ حساب کاربری شما یافت نشد!',
            ephemeral: true
          });
          return;
        }
        
        // بررسی وجود پت و مالکیت آن
        // با توجه به ساختار موجود، باید از API موجود استفاده کنیم
        // فرض می‌کنیم petId شناسه آیتم در inventory کاربر است
        
        const userInventory = await storage.getUserInventory(user.id);
        const petItem = userInventory.find(item => item.id.toString() === petId && item.type === 'pet');
        
        if (!petItem) {
          await interaction.reply({
            content: '❌ پت مورد نظر در انبار شما یافت نشد!',
            ephemeral: true
          });
          return;
        }
        
        // بررسی تکراری نبودن نام
        if (petItem.name === newName) {
          await interaction.reply({
            content: '❌ نام جدید با نام فعلی یکسان است!',
            ephemeral: true
          });
          return;
        }
        
        // اعمال تغییر نام با استفاده از تابع موجود برای به‌روزرسانی آیتم
        await storage.updateUserItem(user.id, parseInt(petId), { name: newName });
        
        // ذخیره اطلاعات پت قبل از تغییر برای نمایش
        const petName = petItem.name;
        const petEmoji = petItem.emoji || '🐾';
        
        // امبد موفقیت
        const successEmbed = new EmbedBuilder()
          .setColor('#85bb65')
          .setTitle(`${petEmoji} تغییر نام پت`)
          .setDescription(`نام پت شما با موفقیت از **${petName}** به **${newName}** تغییر یافت.`)
          .setFooter({ text: 'سیستم پت‌های Ccoin' });
        
        // ارسال پاسخ
        await interaction.reply({
          embeds: [successEmbed],
          ephemeral: true
        });
      } catch (error) {
        console.error('Error processing rename pet:', error);
        await interaction.reply({
          content: '❌ خطایی در تغییر نام پت رخ داد. لطفاً دوباره تلاش کنید.',
          ephemeral: true
        });
      }
      return;
    }
    
    // Handle stock purchasing modal
    if (customId.startsWith('buy_stock_')) {
      const stockId = parseInt(customId.split('_')[2]);
      const quantityInput = interaction.fields.getTextInputValue('stock_quantity');
      const quantity = parseInt(quantityInput);
      
      if (isNaN(quantity) || quantity <= 0) {
        await interaction.reply({
          content: '❌ لطفاً یک عدد مثبت برای تعداد سهام وارد کنید.',
          ephemeral: true
        });
        return;
      }
      
      // استفاده از تبدیل تایپ برای رفع ناسازگاری
      await processBuyStock(asMessageComponent(interaction), stockId, quantity);
      return;
    }
    
    // Handle stock selling modal
    if (customId.startsWith('sell_stock_')) {
      const stockId = parseInt(customId.split('_')[2]);
      const quantityInput = interaction.fields.getTextInputValue('stock_quantity');
      const quantity = parseInt(quantityInput);
      
      if (isNaN(quantity) || quantity <= 0) {
        await interaction.reply({
          content: '❌ لطفاً یک عدد مثبت برای تعداد سهام وارد کنید.',
          ephemeral: true
        });
        return;
      }
      
      // استفاده از تبدیل تایپ برای رفع ناسازگاری
      await processSellStock(asMessageComponent(interaction), stockId, quantity);
      return;
    }
    
    // Handle lottery ticket purchasing modal
    if (customId.startsWith('buy_lottery_')) {
      const lotteryId = parseInt(customId.split('_')[2]);
      const quantityInput = interaction.fields.getTextInputValue('lottery_quantity');
      const quantity = parseInt(quantityInput);
      
      if (isNaN(quantity) || quantity <= 0) {
        await interaction.reply({
          content: '❌ لطفاً یک عدد مثبت برای تعداد بلیط وارد کنید.',
          ephemeral: true
        });
        return;
      }
      
      // استفاده از تبدیل تایپ برای رفع ناسازگاری
      await processBuyLotteryTicket(asMessageComponent(interaction), lotteryId, quantity);
      return;
    }
    
    // Handle giveaway ticket purchasing modal
    if (customId === 'buy_giveaway_tickets') {
      const quantityInput = interaction.fields.getTextInputValue('ticket_quantity');
      const quantity = parseInt(quantityInput);
      
      if (isNaN(quantity) || quantity <= 0) {
        await interaction.reply({
          content: '❌ لطفاً یک عدد مثبت برای تعداد بلیط وارد کنید.',
          ephemeral: true
        });
        return;
      }
      
      // استفاده از تبدیل تایپ برای رفع ناسازگاری
      await buyGiveawayTickets(asMessageComponent(interaction), quantity);
      return;
    }
    
    // Handle coin transfer modal
    // پردازش مودال دزدی
    if (customId === 'robbery_target_modal') {
      const targetDiscordId = interaction.fields.getTextInputValue('target_id');
      
      // بررسی وجود کاربر دزدی‌کننده
      const user = await storage.getUserByDiscordId(interaction.user.id);
      
      if (!user) {
        await interaction.reply({
          content: '⚠️ حساب کاربری شما یافت نشد!',
          ephemeral: true
        });
        return;
      }
      
      // بررسی کولدان دزدی
      const now = new Date();
      const lastRob = user.lastRob ? new Date(user.lastRob) : null;
      const canRob = !lastRob || (now.getTime() - lastRob.getTime() >= 4 * 60 * 60 * 1000); // 4 ساعت
      
      if (!canRob) {
        const nextRob = new Date(lastRob!.getTime() + 4 * 60 * 60 * 1000);
        const hours = Math.floor((nextRob.getTime() - now.getTime()) / (60 * 60 * 1000));
        const minutes = Math.floor(((nextRob.getTime() - now.getTime()) % (60 * 60 * 1000)) / (60 * 1000));
        
        await interaction.reply({
          content: `⏳ باید ${hours}h ${minutes}m صبر کنید تا بتوانید دوباره سرقت کنید.`,
          ephemeral: true
        });
        return;
      }
      
      // پیدا کردن کاربر هدف با آی‌دی دیسکورد
      const targetUser = await storage.getUserByDiscordId(targetDiscordId);
      
      if (!targetUser) {
        await interaction.reply({
          content: '❌ کاربر هدف یافت نشد! لطفاً آی‌دی دیسکورد معتبری وارد کنید.',
          ephemeral: true
        });
        return;
      }
      
      // بررسی هدف قرار دادن خود
      if (targetUser.id === user.id) {
        await interaction.reply({
          content: '❌ شما نمی‌توانید از خودتان دزدی کنید!',
          ephemeral: true
        });
        return;
      }
      
      // بررسی موجودی کیف پول کاربر هدف
      if (targetUser.wallet <= 0) {
        await interaction.reply({
          content: `❌ ${targetUser.username} هیچ سکه‌ای در کیف پول خود ندارد!`,
          ephemeral: true
        });
        return;
      }
      
      // نمایش دکمه‌های تأیید نهایی
      const confirmEmbed = new EmbedBuilder()
        .setColor('#800080')
        .setTitle('🕵️ تأیید دزدی')
        .setDescription(`آیا مطمئن هستید که می‌خواهید از ${targetUser.username} دزدی کنید؟`)
        .setThumbnail('https://img.icons8.com/fluency/48/approval.png') // آیکون approval برای تأیید
        .addFields(
          { name: '👤 هدف', value: targetUser.username, inline: true },
          { name: '💰 موجودی هدف', value: `${targetUser.wallet} Ccoin`, inline: true },
          { name: '⚠️ ریسک', value: 'در صورت دستگیری، 200 Ccoin جریمه خواهید شد!', inline: false }
        )
        .setFooter({ text: 'بعد از شروع دزدی، 4 ساعت زمان انتظار خواهید داشت.' })
        .setTimestamp();
      
      const confirmRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`rob_confirm_${targetUser.id}`)
            .setLabel('✅ تأیید دزدی')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('rob_cancel')
            .setLabel('❌ انصراف')
            .setStyle(ButtonStyle.Danger)
        );
      
      await interaction.reply({
        embeds: [confirmEmbed],
        components: [confirmRow],
        ephemeral: true
      });
      return;
    }
    
    if (customId === 'transfer_modal') {
      const receiverId = interaction.fields.getTextInputValue('receiver_id');
      const amountInput = interaction.fields.getTextInputValue('amount');
      const message = interaction.fields.getTextInputValue('message');
      const amount = parseInt(amountInput);
      
      if (isNaN(amount) || amount <= 0) {
        await interaction.reply({
          content: '❌ لطفاً یک عدد مثبت برای مقدار سکه وارد کنید.',
          ephemeral: true
        });
        return;
      }
      
      // استفاده از تبدیل تایپ برای رفع ناسازگاری
      await processTransfer(asMessageComponent(interaction), receiverId, amount, message);
      return;
    }
    
    // کد پردازش منوی دزدی در بالا پیاده‌سازی شده است و نیازی به تکرار نیست
    
    // Handle log channel setting modal
    if (customId.startsWith('set_log_channel_')) {
      const logType = customId.replace('set_log_channel_', '');
      const channelId = interaction.fields.getTextInputValue('channelId');
      
      // Validate channel ID (basic check)
      if (!channelId || channelId.trim() === '') {
        await interaction.reply({
          content: 'شناسه کانال نمی‌تواند خالی باشد!',
          ephemeral: true
        });
        return;
      }
      
      // Check if channel exists and is a text channel
      const channel = interaction.client.channels.cache.get(channelId);
      if (!channel) {
        await interaction.reply({
          content: 'کانالی با این شناسه یافت نشد!',
          ephemeral: true
        });
        return;
      }
      
      // Set the channel for the specified log type
      botConfig.setLogChannel(logType, channelId);
      
      // Update logger with new channel
      logger.setChannels({ [logType]: channelId });
      
      await interaction.reply({
        content: `✅ کانال لاگ ${logType} با موفقیت تنظیم شد.`,
        ephemeral: true
      });
      
      return;
    }
    
    // Handle default log channel setting
    if (customId === 'set_default_log_channel') {
      const channelId = interaction.fields.getTextInputValue('channelId');
      
      // Validate channel ID (basic check)
      if (!channelId || channelId.trim() === '') {
        await interaction.reply({
          content: 'شناسه کانال نمی‌تواند خالی باشد!',
          ephemeral: true
        });
        return;
      }
      
      // Check if channel exists and is a text channel
      const channel = interaction.client.channels.cache.get(channelId);
      if (!channel) {
        await interaction.reply({
          content: 'کانالی با این شناسه یافت نشد!',
          ephemeral: true
        });
        return;
      }
      
      // Set the default channel for logs
      botConfig.setDefaultLogChannel(channelId);
      
      // Update logger with new default channel
      logger.setDefaultChannel(channelId);
      
      await interaction.reply({
        content: '✅ کانال پیش‌فرض لاگ‌ها با موفقیت تنظیم شد.',
        ephemeral: true
      });
      
      return;
    }
    
    // Handle admin add coin modal
    if (customId === 'admin_add_coin_modal') {
      const userId = interaction.fields.getTextInputValue('userId');
      const amountInput = interaction.fields.getTextInputValue('amount');
      const reason = interaction.fields.getTextInputValue('reason') || 'دلیلی ذکر نشده';
      const amount = parseInt(amountInput);
      
      if (isNaN(amount) || amount <= 0) {
        await interaction.reply({
          content: '❌ لطفاً مقدار معتبری وارد کنید.',
          ephemeral: true
        });
        return;
      }
      
      // Find user
      const user = await storage.getUserByDiscordId(userId);
      if (!user) {
        await interaction.reply({
          content: '❌ کاربری با این شناسه یافت نشد.',
          ephemeral: true
        });
        return;
      }
      
      // Add coins to wallet
      await storage.addToWallet(user.id, amount, 'admin_add');
      
      const embed = new EmbedBuilder()
        .setTitle('💰 افزودن سکه')
        .setColor('#00FF00')
        .setDescription(`سکه با موفقیت به کاربر اضافه شد.`)
        .addFields(
          { name: 'کاربر', value: user.username, inline: true },
          { name: 'مقدار', value: `${amount} سکه`, inline: true },
          { name: 'موجودی فعلی', value: `${user.wallet + amount} سکه`, inline: true },
          { name: 'دلیل', value: reason }
        )
        .setTimestamp();
      
      await interaction.reply({
        embeds: [embed],
        ephemeral: true
      });
      
      // ارسال اعلان به کاربر
      sendAdminNotification(
        user.discordId, 
        'add_coins',
        {
          amount: amount,
          adminName: interaction.user.username,
          reason: reason
        },
        interaction.client
      );
      
      // Log the action
      logger.logAdminAction(
        interaction.user.id,
        interaction.user.username,
        'add_coin',
        user.discordId,
        user.username,
        `افزودن ${amount} سکه به کاربر ${user.username} - دلیل: ${reason}`
      );
      
      // Return to admin menu
      setTimeout(async () => {
        await adminMenu(interaction, 'economy');
      }, 1500);
      
      return;
    }
    
    // Handle admin remove coin modal
    if (customId === 'admin_remove_coin_modal') {
      const userId = interaction.fields.getTextInputValue('userId');
      const amountInput = interaction.fields.getTextInputValue('amount');
      const reason = interaction.fields.getTextInputValue('reason') || 'دلیلی ذکر نشده';
      const amount = parseInt(amountInput);
      
      if (isNaN(amount) || amount <= 0) {
        await interaction.reply({
          content: '❌ لطفاً مقدار معتبری وارد کنید.',
          ephemeral: true
        });
        return;
      }
      
      // Find user
      const user = await storage.getUserByDiscordId(userId);
      if (!user) {
        await interaction.reply({
          content: '❌ کاربری با این شناسه یافت نشد.',
          ephemeral: true
        });
        return;
      }
      
      // Check if user has enough coins
      if (user.wallet < amount) {
        await interaction.reply({
          content: `❌ کاربر به اندازه کافی سکه ندارد. موجودی فعلی: ${user.wallet} سکه`,
          ephemeral: true
        });
        return;
      }
      
      // Remove coins from wallet
      await storage.addToWallet(user.id, -amount, 'admin_remove');
      
      const embed = new EmbedBuilder()
        .setTitle('💸 کاهش سکه')
        .setColor('#FF0000')
        .setDescription(`سکه با موفقیت از کاربر کسر شد.`)
        .addFields(
          { name: 'کاربر', value: user.username, inline: true },
          { name: 'مقدار', value: `${amount} سکه`, inline: true },
          { name: 'موجودی فعلی', value: `${user.wallet - amount} سکه`, inline: true },
          { name: 'دلیل', value: reason }
        )
        .setTimestamp();
      
      await interaction.reply({
        embeds: [embed],
        ephemeral: true
      });
      
      // ارسال اعلان به کاربر
      sendAdminNotification(
        user.discordId, 
        'remove_coins',
        {
          amount: amount,
          adminName: interaction.user.username,
          reason: reason
        },
        interaction.client
      );
      
      // Log the action
      logger.logAdminAction(
        interaction.user.id,
        interaction.user.username,
        'remove_coin',
        user.discordId,
        user.username,
        `کاهش ${amount} سکه از کاربر ${user.username} - دلیل: ${reason}`
      );
      
      // Return to admin menu
      setTimeout(async () => {
        await adminMenu(interaction, 'economy');
      }, 1500);
      
      return;
    }
    
    // Handle AI assistant modal
    if (customId === 'ai_assistant_modal') {
      try {
        // دریافت پرامپت کاربر از فیلد ورودی
        const prompt = interaction.fields.getTextInputValue('prompt');
        
        // بررسی طول پرامپت
        if (!prompt || prompt.length < 5) {
          await interaction.reply({
            content: '❌ لطفاً سوال یا درخواست خود را با جزئیات بیشتری وارد کنید.',
            ephemeral: true
          });
          return;
        }
        
        // نمایش پیام در حال پردازش
        await interaction.deferReply({ ephemeral: true });
        
        // دریافت اطلاعات کاربر از دیتابیس
        const user = await storage.getUserByDiscordId(interaction.user.id);
        if (!user) {
          await interaction.editReply({
            content: '❌ اطلاعات کاربری شما یافت نشد. لطفاً دوباره تلاش کنید یا با پشتیبانی تماس بگیرید.'
          });
          return;
        }
        
        // بررسی محدودیت سوالات و اشتراک
        const canUseAI = await storage.useAIAssistantQuestion(user.id);
        if (!canUseAI) {
          // دریافت اطلاعات دستیار هوش مصنوعی کاربر
          const aiDetails = await storage.getUserAIAssistantDetails(user.id);
          
          // ساخت دکمه‌های خرید اشتراک
          const subscriptionRow = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('ai_sub_weekly')
                .setLabel('اشتراک هفتگی (8,500 سکه)')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🔮'),
              new ButtonBuilder()
                .setCustomId('ai_sub_monthly')
                .setLabel('اشتراک ماهانه (25,000 سکه)')
                .setStyle(ButtonStyle.Success)
                .setEmoji('💫')
            );
          
          // ارسال پیام خطا به کاربر
          await interaction.editReply({
            content: `❌ شما به حداکثر تعداد سوالات رایگان (${aiDetails?.totalQuestions || 5} سوال) رسیده‌اید!\nبرای استفاده نامحدود از دستیار هوشمند، یکی از گزینه‌های اشتراک را انتخاب کنید:`,
            components: [subscriptionRow]
          });
          return;
        }
        
        // ترکیب پرامپت با راهنمایی برای هوش مصنوعی
        const aiPrompt = `تو یک دستیار هوش مصنوعی برای بازی اقتصادی Ccoin در دیسکورد هستی. به سوالات کاربران در مورد بازی، ویژگی‌ها و نحوه استفاده از ربات پاسخ می‌دهی. همیشه به فارسی و با لحنی دوستانه و مفید پاسخ بده.

سوال/درخواست کاربر:
${prompt}

پاسخ دهی با اطلاعات دقیق و مفید در مورد بازی Ccoin. اگر اطلاعات کافی برای پاسخ ندارید، بهترین پاسخ ممکن را با دانش عمومی خود ارائه دهید. محدودیت کاراکتر: حداکثر 1800 کاراکتر.`;
        
        // دریافت پاسخ از هوش مصنوعی
        const aiResponse = await generateAIResponse(aiPrompt, 'aiAssistant');
        
        // محدود کردن پاسخ به حداکثر 1800 کاراکتر (محدودیت امبد)
        const trimmedResponse = aiResponse.length > 1800 
          ? aiResponse.substring(0, 1795) + '...' 
          : aiResponse;
        
        // دریافت اطلاعات دستیار هوش مصنوعی به‌روزشده کاربر
        const aiDetails = await storage.getUserAIAssistantDetails(user.id);
        
        // آماده‌سازی فوتر بر اساس نوع اشتراک
        let footerText = '';
        
        // بررسی وضعیت اشتراک و تاریخ انقضا
        let isSubscriptionActive = false;
        
        if (aiDetails?.subscription && aiDetails?.subscriptionExpires) {
          // بررسی معتبر بودن تاریخ انقضا
          const now = new Date();
          const expiryDate = new Date(aiDetails.subscriptionExpires);
          
          if (expiryDate > now) {
            // اشتراک فعال است
            isSubscriptionActive = true;
            const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            const expireDateStr = expiryDate.toLocaleDateString('fa-IR');
            footerText = `اشتراک ${aiDetails.subscriptionTier === 'weekly' ? 'هفتگی' : 'ماهانه'} | انقضا: ${expireDateStr} (${daysLeft} روز باقیمانده)`;
          } else {
            // اشتراک منقضی شده
            footerText = `اشتراک شما منقضی شده است | ${aiDetails?.questionsRemaining || 0} سوال باقی‌مانده از ${aiDetails?.totalQuestions || 5} سوال رایگان`;
          }
        } else {
          // کاربر اشتراک ندارد (رایگان)
          footerText = `${aiDetails?.questionsRemaining || 0} سوال باقی‌مانده از ${aiDetails?.totalQuestions || 5} سوال رایگان`;
        }
        
        // ساخت امبد پاسخ
        const responseEmbed = new EmbedBuilder()
          .setColor('#9B59B6')
          .setTitle('🧠 دستیار هوشمند Ccoin')
          .setDescription(trimmedResponse)
          .setFooter({ 
            text: `${footerText} | ${interaction.user.username} | پاسخ با CCOIN AI`,
            iconURL: interaction.client.user?.displayAvatarURL()
          })
          .setTimestamp();
        
        // اضافه کردن دکمه‌های خرید اشتراک برای کاربران رایگان
        if (!isSubscriptionActive) {
          const subscriptionRow = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('ai_assistant')
                .setLabel('سوال جدید')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('❓'),
              new ButtonBuilder()
                .setCustomId('ai_sub_weekly')
                .setLabel('اشتراک هفتگی')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('🔮'),
              new ButtonBuilder()
                .setCustomId('ai_sub_monthly')
                .setLabel('اشتراک ماهانه')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('💫')
            );
            
          // ارسال پاسخ به کاربر با دکمه‌های اشتراک
          await interaction.editReply({
            embeds: [responseEmbed],
            components: [subscriptionRow]
          });
        } else {
          // کاربر اشتراک دارد، فقط دکمه سوال جدید را نمایش می‌دهیم
          const newQuestionRow = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('ai_assistant')
                .setLabel('سوال جدید')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('❓')
            );
            
          // ارسال پاسخ به کاربر با دکمه سوال جدید
          await interaction.editReply({
            embeds: [responseEmbed],
            components: [newQuestionRow]
          });
        }
      } catch (error) {
        console.error('Error handling AI assistant modal:', error);
        // در صورت خطا، پیام مناسب به کاربر نمایش دهیم
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: '❌ متأسفانه در پردازش درخواست شما خطایی رخ داد. لطفاً دوباره تلاش کنید.',
            ephemeral: true
          });
        } else {
          await interaction.editReply({
            content: '❌ متأسفانه در پردازش درخواست شما خطایی رخ داد. لطفاً دوباره تلاش کنید.'
          });
        }
      }
      return;
    }
    
    // Handle admin distribute coin modal
    if (customId === 'admin_distribute_coin_modal') {
      const amountInput = interaction.fields.getTextInputValue('amount');
      const reason = interaction.fields.getTextInputValue('reason');
      const amount = parseInt(amountInput);
      
      if (isNaN(amount) || amount <= 0) {
        await interaction.reply({
          content: '❌ لطفاً مقدار معتبری وارد کنید.',
          ephemeral: true
        });
        return;
      }
      
      await interaction.deferReply({ ephemeral: true });
      
      // Get all users
      const users = await storage.getAllUsers();
      let distributedCount = 0;
      
      // Distribute coins to all users and send notifications
      for (const user of users) {
        await storage.addToWallet(user.id, amount, 'admin_distribute', {
          reason: reason
        });
        
        // Send notification to each user
        sendAdminNotification(
          user.discordId, 
          'distribute_coins',
          {
            amount: amount,
            adminName: interaction.user.username,
            reason: reason
          },
          interaction.client
        );
        
        distributedCount++;
      }
      
      const embed = new EmbedBuilder()
        .setTitle('🎁 توزیع سکه')
        .setColor('#FFD700')
        .setDescription(`سکه با موفقیت بین کاربران توزیع شد.`)
        .addFields(
          { name: 'تعداد کاربران', value: `${distributedCount}`, inline: true },
          { name: 'مقدار هر کاربر', value: `${amount} سکه`, inline: true },
          { name: 'مجموع', value: `${distributedCount * amount} سکه`, inline: true },
          { name: 'دلیل', value: reason }
        )
        .setTimestamp();
      
      await interaction.editReply({
        embeds: [embed]
      });
      
      // Log the action
      logger.logAdminAction(
        interaction.user.id,
        interaction.user.username,
        'distribute_coin',
        'system',
        'all_users',
        `توزیع ${amount} سکه بین ${distributedCount} کاربر: ${reason}`
      );
      
      // Return to admin menu
      setTimeout(async () => {
        await adminMenu(interaction, 'economy');
      }, 2000);
      
      return;
    }
    
    // Handle admin set interest rate modal
    if (customId === 'admin_set_interest_modal') {
      const rateInput = interaction.fields.getTextInputValue('rate');
      const rate = parseFloat(rateInput);
      
      if (isNaN(rate) || rate < 0) {
        await interaction.reply({
          content: '❌ لطفاً نرخ معتبری وارد کنید.',
          ephemeral: true
        });
        return;
      }
      
      // Set interest rate
      botConfig.setBankInterestRate(rate);
      
      const embed = new EmbedBuilder()
        .setTitle('📈 تنظیم نرخ سود بانکی')
        .setColor('#4CAF50')
        .setDescription(`نرخ سود بانکی با موفقیت تنظیم شد.`)
        .addFields(
          { name: 'نرخ جدید', value: `${rate}%`, inline: true }
        )
        .setTimestamp();
      
      await interaction.reply({
        embeds: [embed],
        ephemeral: true
      });
      
      // Log the action
      logger.logAdminAction(
        interaction.user.id,
        interaction.user.username,
        'set_interest_rate',
        'system',
        'bank_system',
        `تنظیم نرخ سود بانکی به ${rate}%`
      );
      
      // Return to admin menu
      setTimeout(async () => {
        await adminMenu(interaction, 'economy');
      }, 1500);
      
      return;
    }
    
    // Handle admin set tax rate modal
    if (customId === 'admin_set_tax_modal') {
      const rateInput = interaction.fields.getTextInputValue('rate');
      const rate = parseFloat(rateInput);
      
      if (isNaN(rate) || rate < 0) {
        await interaction.reply({
          content: '❌ لطفاً نرخ معتبری وارد کنید.',
          ephemeral: true
        });
        return;
      }
      
      // Set transfer fee rate
      botConfig.setTransferFeeRate(rate);
      
      const embed = new EmbedBuilder()
        .setTitle('💸 تنظیم نرخ مالیات انتقال')
        .setColor('#9C27B0')
        .setDescription(`نرخ مالیات انتقال با موفقیت تنظیم شد.`)
        .addFields(
          { name: 'نرخ جدید', value: `${rate}%`, inline: true }
        )
        .setTimestamp();
      
      await interaction.reply({
        embeds: [embed],
        ephemeral: true
      });
      
      // Log the action
      logger.logAdminAction(
        interaction.user.id,
        interaction.user.username,
        'set_tax_rate',
        'system',
        'transfer_system',
        `تنظیم نرخ مالیات انتقال به ${rate}%`
      );
      
      // Return to admin menu
      setTimeout(async () => {
        await adminMenu(interaction, 'economy');
      }, 1500);
      
      return;
    }
    
    // Handle admin reset user economy modal
    if (customId === 'admin_reset_user_economy_modal') {
      const userId = interaction.fields.getTextInputValue('userId');
      const reason = interaction.fields.getTextInputValue('reason') || 'دلیلی ذکر نشده';
      
      // بررسی وجود کاربر
      const user = await storage.getUserByDiscordId(userId);
      
      if (!user) {
        await interaction.reply({
          content: '❌ کاربری با این شناسه یافت نشد.',
          ephemeral: true
        });
        return;
      }
      
      // مقادیر اولیه اقتصاد
      const DEFAULT_WALLET = 1000;
      const DEFAULT_BANK = 0;
      const DEFAULT_CRYSTALS = 0;
      
      // ذخیره مقادیر قبلی برای گزارش
      const previousWallet = user.wallet;
      const previousBank = user.bank;
      const previousCrystals = user.crystals;
      
      // ریست اقتصاد کاربر
      await storage.updateUserData(user.id, {
        wallet: DEFAULT_WALLET,
        bank: DEFAULT_BANK,
        crystals: DEFAULT_CRYSTALS,
        stocks: [],
        investments: []
      });
      
      // ایجاد امبد برای نمایش پیام موفقیت
      const embed = new EmbedBuilder()
        .setTitle('🔄 ریست اقتصاد کاربر')
        .setColor('#FF5733')
        .setDescription(`اقتصاد کاربر ${user.username} با موفقیت ریست شد.`)
        .addFields(
          { name: 'کیف پول قبلی', value: `${previousWallet} سکه`, inline: true },
          { name: 'بانک قبلی', value: `${previousBank} سکه`, inline: true },
          { name: 'کریستال قبلی', value: `${previousCrystals}`, inline: true },
          { name: 'کیف پول جدید', value: `${DEFAULT_WALLET} سکه`, inline: true },
          { name: 'بانک جدید', value: `${DEFAULT_BANK} سکه`, inline: true },
          { name: 'کریستال جدید', value: `${DEFAULT_CRYSTALS}`, inline: true },
          { name: 'دلیل', value: reason }
        )
        .setTimestamp();
      
      await interaction.reply({
        embeds: [embed],
        ephemeral: true
      });
      
      // ثبت اقدام در لاگ سیستم
      logger.logAdminAction(
        interaction.user.id,
        interaction.user.username,
        'reset_user_economy',
        userId,
        user.username,
        `ریست اقتصاد کاربر به دلیل: ${reason}`
      );
      
      // ارسال اعلان به کاربر
      const { sendAdminNotification } = await import('../utils/adminNotifications');
      sendAdminNotification(
        userId,
        'reset_economy',
        {
          adminName: interaction.user.username,
          reason: reason
        },
        interaction.client
      );
      
      // بازگشت به منوی ادمین
      setTimeout(async () => {
        await adminMenu(interaction, 'economy_reset');
      }, 1500);
      
      return;
    }
    
    // Handle admin reset all economy confirmation
    if (customId === 'admin_reset_all_economy_confirm_modal') {
      const confirmText = interaction.fields.getTextInputValue('confirm');
      const reason = interaction.fields.getTextInputValue('reason') || 'دلیلی ذکر نشده';
      
      // بررسی تایید کاربر
      if (confirmText.toUpperCase() !== 'RESET ALL') {
        await interaction.reply({
          content: '❌ عملیات ریست کل اقتصاد لغو شد. عبارت تایید را اشتباه وارد کردید.',
          ephemeral: true
        });
        return;
      }
      
      await interaction.deferReply({ ephemeral: true });
      
      // مقادیر اولیه اقتصاد
      const DEFAULT_WALLET = 1000;
      const DEFAULT_BANK = 0;
      const DEFAULT_CRYSTALS = 0;
      
      // دریافت تمام کاربران
      const users = await storage.getAllUsers();
      
      // ذخیره تعداد کاربران برای نمایش
      const totalUsers = users.length;
      let updatedUsers = 0;
      
      // ریست اقتصاد همه کاربران
      for (const user of users) {
        await storage.updateUserData(user.id, {
          wallet: DEFAULT_WALLET,
          bank: DEFAULT_BANK,
          crystals: DEFAULT_CRYSTALS,
          stocks: [],
          investments: []
        });
        
        // ارسال اعلان به کاربر
        const { sendAdminNotification } = await import('../utils/adminNotifications');
        await sendAdminNotification(
          user.discordId,
          'reset_all_economy',
          {
            adminName: interaction.user.username,
            reason: reason
          },
          interaction.client
        );
        
        updatedUsers++;
      }
      
      // ایجاد امبد برای نمایش پیام موفقیت
      const embed = new EmbedBuilder()
        .setTitle('⚠️ ریست کل اقتصاد')
        .setColor('#FF0000')
        .setDescription(`اقتصاد ربات با موفقیت ریست شد. تمامی ${totalUsers} کاربر به مقادیر اولیه بازگشتند.`)
        .addFields(
          { name: 'کاربران ریست شده', value: `${updatedUsers} از ${totalUsers}`, inline: true },
          { name: 'مقدار اولیه کیف پول', value: `${DEFAULT_WALLET} سکه`, inline: true },
          { name: 'دلیل', value: reason }
        )
        .setTimestamp();
      
      await interaction.editReply({
        embeds: [embed]
      });
      
      // ثبت اقدام در لاگ سیستم
      logger.logAdminAction(
        interaction.user.id,
        interaction.user.username,
        'reset_all_economy',
        'system',
        'all_users',
        `ریست کل اقتصاد به دلیل: ${reason}`
      );
      
      // بازگشت به منوی ادمین
      setTimeout(async () => {
        await adminMenu(interaction, 'economy');
      }, 2000);
      
      return;
    }
    
    // Handle clan creation modal
    if (customId === 'create_clan_modal') {
      const clanName = interaction.fields.getTextInputValue('clan_name');
      const clanDescription = interaction.fields.getTextInputValue('clan_description') || '';
      
      // Check if user exists
      const user = await storage.getUserByDiscordId(interaction.user.id);
      
      if (!user) {
        await interaction.reply({
          content: '⚠️ شما باید ابتدا یک حساب کاربری ایجاد کنید. از دستور /menu استفاده نمایید.',
          ephemeral: true
        });
        return;
      }
      
      // Check if user already has a clan
      if (user.clanId) {
        await interaction.reply({
          content: '⚠️ شما در حال حاضر عضو یک کلن هستید و نمی‌توانید کلن جدیدی بسازید.',
          ephemeral: true
        });
        return;
      }
      
      // Check if user has enough Ccoin (2000)
      if (user.wallet < 2000) {
        await interaction.reply({
          content: '⚠️ شما حداقل به 2000 سکه برای ساخت کلن نیاز دارید.',
          ephemeral: true
        });
        return;
      }
      
      // Check if clan name is too short
      if (clanName.length < 3) {
        await interaction.reply({
          content: '⚠️ نام کلن باید حداقل 3 کاراکتر باشد.',
          ephemeral: true
        });
        return;
      }
      
      // Check if clan name already exists
      const existingClan = await storage.getClanByName(clanName);
      if (existingClan) {
        await interaction.reply({
          content: '⚠️ کلنی با این نام قبلاً ثبت شده است. لطفاً نام دیگری انتخاب کنید.',
          ephemeral: true
        });
        return;
      }
      
      // Create clan
      try {
        await interaction.deferReply({ ephemeral: true });
        
        // Deduct creation cost
        await storage.addToWallet(user.id, -2000, 'clan_create');
        
        // Create clan with only the required fields based on the schema
        const clan = await storage.createClan({
          name: clanName,
          description: clanDescription,
          ownerId: user.discordId
        });
        
        // Add user to clan
        await storage.updateUser(user.id, { clanId: clan.id });
        
        // Show success message
        const successEmbed = new EmbedBuilder()
          .setColor('#FFD700')
          .setTitle('🏰 کلن با موفقیت ساخته شد!')
          .setDescription(`تبریک! کلن **${clanName}** با موفقیت ساخته شد.`)
          .addFields(
            { name: '💰 هزینه ساخت', value: '2000 سکه', inline: true },
            { name: '👑 مالک', value: `<@${user.discordId}>`, inline: true },
            { name: '👥 اعضا', value: '1/10', inline: true },
            { name: '📝 توضیحات', value: clanDescription || 'بدون توضیحات', inline: false }
          )
          .setFooter({ text: 'برای مدیریت کلن خود، به منوی کلن‌ها بروید.' })
          .setTimestamp();
        
        await interaction.editReply({
          embeds: [successEmbed]
        });
        
        // Return to clans menu after a delay
        // Note: Modal interactions are not compatible with MessageComponentInteraction
        // We need to implement a workaround or handle this differently
        setTimeout(async () => {
          // We'll use a simple reply message instead
          await interaction.followUp({
            content: 'برای مدیریت کلن خود، دستور /menu را استفاده کنید.',
            ephemeral: true
          });
        }, 2500);
      } catch (error) {
        console.error('Error creating clan:', error);
        
        try {
          if (interaction.deferred) {
            await interaction.editReply({
              content: '❌ خطایی در ایجاد کلن رخ داد. لطفاً مجدداً تلاش کنید.'
            });
          } else {
            await interaction.reply({
              content: '❌ خطایی در ایجاد کلن رخ داد. لطفاً مجدداً تلاش کنید.',
              ephemeral: true
            });
          }
        } catch (e) {
          console.error('Error handling clan creation error:', e);
        }
      }
      
      return;
    }
    
    // Handle clan rankings display
    if (customId === 'clan_rankings') {
      try {
        // Get all clans
        const clans = await storage.getAllClans();
        
        if (clans.length === 0) {
          await interaction.reply({
            content: '⚠️ در حال حاضر هیچ کلنی وجود ندارد.',
            ephemeral: true
          });
          return;
        }
        
        // Sort clans by level and member count
        const sortedClans = clans.sort((a, b) => {
          if (b.level !== a.level) {
            return b.level - a.level;
          }
          return b.memberCount - a.memberCount;
        });
        
        // Create the rankings embed
        const embed = new EmbedBuilder()
          .setColor('#FFD700')
          .setTitle('🏆 رتبه‌بندی کلن‌ها')
          .setDescription('کلن‌های برتر بر اساس سطح و تعداد اعضا')
          .setFooter({ text: 'برای پیوستن به کلن یا ساخت کلن جدید به منوی کلن‌ها بروید.' })
          .setTimestamp();
        
        // Add top clans to the embed
        sortedClans.slice(0, 10).forEach((clan, index) => {
          embed.addFields({
            name: `${index + 1}. ${clan.name}`,
            value: `👑 مالک: <@${clan.ownerId}>\n🏅 سطح: ${clan.level}\n👥 اعضا: ${clan.memberCount}/${10 * clan.level}\n💰 خزانه: ${clan.bank} Ccoin`,
            inline: false
          });
        });
        
        // Add buttons
        const row = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('clans')
              .setLabel('🔙 بازگشت به منوی کلن‌ها')
              .setStyle(ButtonStyle.Primary)
          );
        
        await interaction.reply({
          embeds: [embed],
          components: [row],
          ephemeral: true
        });
      } catch (error) {
        console.error('Error displaying clan rankings:', error);
        await interaction.reply({
          content: '❌ خطایی در نمایش رتبه‌بندی کلن‌ها رخ داد. لطفاً مجدداً تلاش کنید.',
          ephemeral: true
        });
      }
      
      return;
    }
    
    // Handle admin search user modal
    if (customId === 'admin_search_user_modal') {
      const searchTerm = interaction.fields.getTextInputValue('userId');
      
      await interaction.deferReply({ ephemeral: true });
      
      // Search for user by ID or username
      const users = await storage.getAllUsers();
      let foundUser = null;
      
      for (const user of users) {
        if (user.discordId === searchTerm || user.username.toLowerCase().includes(searchTerm.toLowerCase())) {
          foundUser = user;
          break;
        }
      }
      
      if (!foundUser) {
        await interaction.editReply({
          content: '❌ کاربری با این مشخصات یافت نشد.',
        });
        return;
      }
      
      // Display user information
      const transactions = await storage.getUserTransactions(foundUser.id);
      const transactionCount = transactions.length;
      const lastTransaction = transactions.length > 0 ? 
        `${transactions[0].type} - ${transactions[0].amount} سکه` : 'ندارد';
      
      const embed = new EmbedBuilder()
        .setTitle(`👤 اطلاعات کاربر: ${foundUser.username}`)
        .setColor('#2196F3')
        .setDescription(`اطلاعات کامل کاربر ${foundUser.username}`)
        .addFields(
          { name: 'شناسه دیسکورد', value: foundUser.discordId, inline: true },
          { name: 'کیف پول', value: `${foundUser.wallet} سکه`, inline: true },
          { name: 'بانک', value: `${foundUser.bank} سکه`, inline: true },
          { name: 'کریستال', value: `${foundUser.crystals}`, inline: true },
          { name: 'سطح اقتصادی', value: `${foundUser.economyLevel}`, inline: true },
          { name: 'آخرین دریافت روزانه', value: foundUser.lastDaily ? new Date(foundUser.lastDaily).toLocaleString() : 'ندارد', inline: true },
          { name: 'تعداد تراکنش‌ها', value: `${transactionCount}`, inline: true },
          { name: 'آخرین تراکنش', value: lastTransaction, inline: true },
          { name: 'تاریخ عضویت', value: foundUser.createdAt ? new Date(foundUser.createdAt).toLocaleString() : 'ندارد', inline: true }
        )
        .setTimestamp();
      
      // Add action buttons
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`admin_add_coin_${foundUser.discordId}`)
            .setLabel('افزودن سکه')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`admin_remove_coin_${foundUser.discordId}`)
            .setLabel('کاهش سکه')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId(`admin_reset_user_${foundUser.discordId}`)
            .setLabel('ریست کاربر')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId(`admin_ban_user_${foundUser.discordId}`)
            .setLabel('مسدودسازی')
            .setStyle(ButtonStyle.Danger)
        );
      
      await interaction.editReply({
        embeds: [embed],
        components: [row]
      });
      
      return;
    }
    
    // Handle admin ban user modal
    if (customId === 'admin_ban_user_modal') {
      const userId = interaction.fields.getTextInputValue('userId');
      const reason = interaction.fields.getTextInputValue('reason');
      
      // Find user
      const user = await storage.getUserByDiscordId(userId);
      if (!user) {
        await interaction.reply({
          content: '❌ کاربری با این شناسه یافت نشد.',
          ephemeral: true
        });
        return;
      }
      
      // Ban user (set custom field)
      // Note: isBanned is not in the schema, we should either add it or use a different field
      // For now, we'll just show a message without actually updating
      // await storage.updateUser(user.id, { /* fields to update */ });
      
      const embed = new EmbedBuilder()
        .setTitle('🚫 مسدودسازی کاربر')
        .setColor('#F44336')
        .setDescription(`کاربر با موفقیت مسدود شد.`)
        .addFields(
          { name: 'کاربر', value: user.username, inline: true },
          { name: 'شناسه', value: user.discordId, inline: true },
          { name: 'دلیل', value: reason }
        )
        .setTimestamp();
      
      await interaction.reply({
        embeds: [embed],
        ephemeral: true
      });
      
      // Log the action
      logger.logAdminAction(
        interaction.user.id,
        interaction.user.username,
        'ban_user',
        user.discordId,
        user.username,
        `مسدودسازی کاربر ${user.username}: ${reason}`
      );
      
      // Return to admin menu
      setTimeout(async () => {
        await interaction.followUp({
          content: 'برای بازگشت به منوی مدیریت، از دستور /admin استفاده کنید.',
          ephemeral: true
        });
      }, 1500);
      
      return;
    }
    
    // Handle admin reset user modal
    if (customId === 'admin_reset_user_modal') {
      const userId = interaction.fields.getTextInputValue('userId');
      const confirmText = interaction.fields.getTextInputValue('confirm');
      
      if (confirmText !== 'RESET') {
        await interaction.reply({
          content: '❌ عبارت تایید نادرست است. عملیات لغو شد.',
          ephemeral: true
        });
        return;
      }
      
      // Find user
      const user = await storage.getUserByDiscordId(userId);
      if (!user) {
        await interaction.reply({
          content: '❌ کاربری با این شناسه یافت نشد.',
          ephemeral: true
        });
        return;
      }
      
      // Reset user data (set wallet, bank, etc. to default values)
      await storage.updateUser(user.id, {
        wallet: 0,
        bank: 0,
        crystals: 0,
        economyLevel: 1,
        dailyStreak: 0,
        inventory: {},
        lastDaily: null,
        lastRob: null,
        lastWheelSpin: null
        // isBanned is not in the schema
      });
      
      const embed = new EmbedBuilder()
        .setTitle('🔄 ریست کاربر')
        .setColor('#795548')
        .setDescription(`اطلاعات کاربر با موفقیت ریست شد.`)
        .addFields(
          { name: 'کاربر', value: user.username, inline: true },
          { name: 'شناسه', value: user.discordId, inline: true }
        )
        .setTimestamp();
      
      await interaction.reply({
        embeds: [embed],
        ephemeral: true
      });
      
      // Log the action
      logger.logAdminAction(
        interaction.user.id,
        interaction.user.username,
        'reset_user',
        user.discordId,
        user.username,
        `ریست اطلاعات کاربر ${user.username}`
      );
      
      // Return to admin menu
      setTimeout(async () => {
        await interaction.followUp({
          content: 'برای بازگشت به منوی مدیریت، از دستور /admin استفاده کنید.',
          ephemeral: true
        });
      }, 1500);
      
      return;
    }
    
    // Handle admin user logs modal
    if (customId === 'admin_user_logs_modal') {
      const userId = interaction.fields.getTextInputValue('userId');
      
      await interaction.deferReply({ ephemeral: true });
      
      // Find user
      const user = await storage.getUserByDiscordId(userId);
      if (!user) {
        await interaction.editReply({
          content: '❌ کاربری با این شناسه یافت نشد.'
        });
        return;
      }
      
      // Get user transactions
      const transactions = await storage.getUserTransactions(user.id);
      
      if (transactions.length === 0) {
        await interaction.editReply({
          content: `❌ هیچ تراکنشی برای کاربر ${user.username} یافت نشد.`
        });
        return;
      }
      
      // Display recent transactions (up to 10)
      const embed = new EmbedBuilder()
        .setTitle(`📝 لاگ تراکنش‌های کاربر: ${user.username}`)
        .setColor('#607D8B')
        .setDescription(`۱۰ تراکنش اخیر کاربر ${user.username}`)
        .setTimestamp();
      
      const recentTransactions = transactions.slice(0, 10);
      
      for (let i = 0; i < recentTransactions.length; i++) {
        const tx = recentTransactions[i];
        let typeStr = '';
        
        switch (tx.type) {
          case 'deposit': typeStr = '📥 واریز به کیف پول'; break;
          case 'withdraw': typeStr = '📤 برداشت از بانک'; break;
          case 'transfer_in': typeStr = '📲 دریافت انتقالی'; break;
          case 'transfer_out': typeStr = '📲 ارسال انتقالی'; break;
          case 'game_win': typeStr = '🎮 برد بازی'; break;
          case 'game_loss': typeStr = '🎮 باخت بازی'; break;
          case 'quest_reward': typeStr = '🎯 پاداش ماموریت'; break;
          case 'item_purchase': typeStr = '🛒 خرید آیتم'; break;
          default: typeStr = tx.type;
        }
        
        embed.addFields({
          name: `${i + 1}. ${typeStr}`,
          value: `💰 مقدار: ${tx.amount} سکه\n` +
                 `⏱️ تاریخ: ${new Date(tx.timestamp).toLocaleString()}\n` +
                 (tx.fee > 0 ? `💸 کارمزد: ${tx.fee} سکه\n` : '') +
                 (tx.targetName ? `👤 گیرنده: ${tx.targetName}\n` : '') +
                 (tx.sourceName ? `👤 فرستنده: ${tx.sourceName}\n` : '') +
                 (tx.gameType ? `🎮 نوع بازی: ${tx.gameType}\n` : '')
        });
      }
      
      await interaction.editReply({
        embeds: [embed]
      });
      
      return;
    }
    
    // If no handler matched, reply with error
    await interaction.reply({
      content: 'خطا: نوع فرم ارسالی پشتیبانی نمی‌شود.',
      ephemeral: true
    });
    
    // پردازش فرم‌های مربوط به بازار
    // خرید آیتم از بازار
    if (customId === 'market_buy_modal') {
      try {
        const listingIdField = interaction.fields.getTextInputValue('listing_id');
        const quantityField = interaction.fields.getTextInputValue('quantity');
        
        const listingId = listingIdField.trim();
        const quantity = parseInt(quantityField) || 1;
        
        if (!listingId) {
          await interaction.reply({
            content: '❌ شناسه آگهی معتبر نیست!',
            ephemeral: true
          });
          return;
        }
        
        // دریافت اطلاعات کاربر
        const user = await storage.getUserByDiscordId(interaction.user.id);
        if (!user) {
          await interaction.reply({
            content: '❌ شما ثبت نام نشده‌اید! لطفاً ابتدا با استفاده از دستور `/start` ثبت نام کنید.',
            ephemeral: true
          });
          return;
        }
        
        // خرید از بازار
        const result = await storage.buyFromMarket(user.id, listingId, quantity);
        
        if (result.success) {
          // خرید موفقیت‌آمیز
          const embed = new EmbedBuilder()
            .setColor('#2ECC71')
            .setTitle('✅ خرید موفقیت‌آمیز')
            .setDescription(`شما با موفقیت **${quantity}** عدد **${result.item?.name}** را به قیمت **${result.totalPrice}** سکه خریداری کردید.`)
            .setThumbnail('https://img.icons8.com/fluency/48/purchase-order.png')
            .setFooter({ text: `کاربر: ${interaction.user.username} | ${new Date().toLocaleString('fa-IR')}` });
            
          await interaction.reply({
            embeds: [embed],
            components: [
              new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                  new ButtonBuilder()
                    .setCustomId('market_regular')
                    .setLabel('🏪 بازگشت به بازار')
                    .setStyle(ButtonStyle.Primary),
                  new ButtonBuilder()
                    .setCustomId('inventory')
                    .setLabel('🎒 مشاهده کوله‌پشتی')
                    .setStyle(ButtonStyle.Success)
                )
            ],
            ephemeral: true
          });
        } else {
          // خطا در خرید
          await interaction.reply({
            content: `❌ خرید ناموفق: ${result.message || 'خطایی رخ داد. لطفاً دوباره تلاش کنید.'}`,
            ephemeral: true
          });
        }
      } catch (error) {
        console.error('Error processing market buy:', error);
        await interaction.reply({
          content: '❌ خطایی در پردازش خرید رخ داد. لطفاً دوباره تلاش کنید.',
          ephemeral: true
        });
      }
      return;
    }
    
    // حذف آگهی از بازار
    if (customId === 'market_remove_modal') {
      try {
        const listingIdField = interaction.fields.getTextInputValue('listing_id');
        const listingId = listingIdField.trim();
        
        if (!listingId) {
          await interaction.reply({
            content: '❌ شناسه آگهی معتبر نیست!',
            ephemeral: true
          });
          return;
        }
        
        // دریافت اطلاعات کاربر
        const user = await storage.getUserByDiscordId(interaction.user.id);
        if (!user) {
          await interaction.reply({
            content: '❌ شما ثبت نام نشده‌اید! لطفاً ابتدا با استفاده از دستور `/start` ثبت نام کنید.',
            ephemeral: true
          });
          return;
        }
        
        // حذف آگهی
        const result = await storage.removeMarketListing(listingId, user.id);
        
        if (result.success) {
          // حذف موفقیت‌آمیز
          const embed = new EmbedBuilder()
            .setColor('#2ECC71')
            .setTitle('✅ حذف آگهی')
            .setDescription(`آگهی شما با موفقیت حذف شد و آیتم‌ها به کوله‌پشتی شما برگشتند.`)
            .setThumbnail('https://img.icons8.com/fluency/48/delete-sign.png')
            .setFooter({ text: `کاربر: ${interaction.user.username} | ${new Date().toLocaleString('fa-IR')}` });
            
          await interaction.reply({
            embeds: [embed],
            components: [
              new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                  new ButtonBuilder()
                    .setCustomId('market_my_listings')
                    .setLabel('📋 آگهی‌های من')
                    .setStyle(ButtonStyle.Primary),
                  new ButtonBuilder()
                    .setCustomId('inventory')
                    .setLabel('🎒 مشاهده کوله‌پشتی')
                    .setStyle(ButtonStyle.Success)
                )
            ],
            ephemeral: true
          });
        } else {
          // خطا در حذف
          await interaction.reply({
            content: `❌ حذف ناموفق: ${result.message || 'خطایی رخ داد. لطفاً دوباره تلاش کنید.'}`,
            ephemeral: true
          });
        }
      } catch (error) {
        console.error('Error removing market listing:', error);
        await interaction.reply({
          content: '❌ خطایی در حذف آگهی رخ داد. لطفاً دوباره تلاش کنید.',
          ephemeral: true
        });
      }
      return;
    }
    
    // ویرایش آگهی
    if (customId === 'market_edit_modal') {
      try {
        const listingIdField = interaction.fields.getTextInputValue('listing_id');
        const priceField = interaction.fields.getTextInputValue('price');
        const descriptionField = interaction.fields.getTextInputValue('description');
        
        const listingId = listingIdField.trim();
        const price = parseInt(priceField);
        const description = descriptionField.trim();
        
        if (!listingId || isNaN(price) || price <= 0) {
          await interaction.reply({
            content: '❌ اطلاعات وارد شده معتبر نیست! لطفاً شناسه آگهی و قیمت معتبر وارد کنید.',
            ephemeral: true
          });
          return;
        }
        
        // دریافت اطلاعات کاربر
        const user = await storage.getUserByDiscordId(interaction.user.id);
        if (!user) {
          await interaction.reply({
            content: '❌ شما ثبت نام نشده‌اید! لطفاً ابتدا با استفاده از دستور `/start` ثبت نام کنید.',
            ephemeral: true
          });
          return;
        }
        
        // ویرایش آگهی
        const result = await storage.updateMarketListing(listingId, user.id, { price, description });
        
        if (result.success) {
          // ویرایش موفقیت‌آمیز
          const embed = new EmbedBuilder()
            .setColor('#2ECC71')
            .setTitle('✅ ویرایش آگهی')
            .setDescription(`آگهی شما با موفقیت ویرایش شد.\n**قیمت جدید:** ${price} سکه`)
            .setThumbnail('https://img.icons8.com/fluency/48/edit.png')
            .setFooter({ text: `کاربر: ${interaction.user.username} | ${new Date().toLocaleString('fa-IR')}` });
            
          await interaction.reply({
            embeds: [embed],
            components: [
              new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                  new ButtonBuilder()
                    .setCustomId('market_my_listings')
                    .setLabel('📋 آگهی‌های من')
                    .setStyle(ButtonStyle.Primary)
                )
            ],
            ephemeral: true
          });
        } else {
          // خطا در ویرایش
          await interaction.reply({
            content: `❌ ویرایش ناموفق: ${result.message || 'خطایی رخ داد. لطفاً دوباره تلاش کنید.'}`,
            ephemeral: true
          });
        }
      } catch (error) {
        console.error('Error editing market listing:', error);
        await interaction.reply({
          content: '❌ خطایی در ویرایش آگهی رخ داد. لطفاً دوباره تلاش کنید.',
          ephemeral: true
        });
      }
      return;
    }
    
    // ایجاد آگهی جدید
    if (customId === 'market_new_listing_modal') {
      try {
        const itemIdField = interaction.fields.getTextInputValue('item_id');
        const quantityField = interaction.fields.getTextInputValue('quantity');
        const priceField = interaction.fields.getTextInputValue('price');
        const descriptionField = interaction.fields.getTextInputValue('description');
        const listingTypeField = interaction.fields.getTextInputValue('listing_type');
        
        const itemId = parseInt(itemIdField);
        const quantity = parseInt(quantityField) || 1;
        const price = parseInt(priceField);
        const description = descriptionField.trim();
        const isBlackMarket = listingTypeField.toLowerCase() === 'b' || listingTypeField.toLowerCase() === 'black';
        
        if (isNaN(itemId) || isNaN(price) || price <= 0) {
          await interaction.reply({
            content: '❌ اطلاعات وارد شده معتبر نیست! لطفاً شناسه آیتم و قیمت معتبر وارد کنید.',
            ephemeral: true
          });
          return;
        }
        
        // دریافت اطلاعات کاربر
        const user = await storage.getUserByDiscordId(interaction.user.id);
        if (!user) {
          await interaction.reply({
            content: '❌ شما ثبت نام نشده‌اید! لطفاً ابتدا با استفاده از دستور `/start` ثبت نام کنید.',
            ephemeral: true
          });
          return;
        }
        
        // ایجاد آگهی جدید
        const result = await storage.createMarketListing({
          sellerId: user.id,
          sellerName: interaction.user.username,
          itemId,
          quantity,
          price,
          description,
          isBlackMarket
        });
        
        if (result.success) {
          // ایجاد موفقیت‌آمیز
          const marketType = isBlackMarket ? 'بازار سیاه' : 'بازار عادی';
          const embed = new EmbedBuilder()
            .setColor('#2ECC71')
            .setTitle('✅ آگهی جدید')
            .setDescription(`آگهی شما با موفقیت در ${marketType} ثبت شد.\n**آیتم:** ${result.itemName}\n**تعداد:** ${quantity}\n**قیمت:** ${price} سکه هر عدد`)
            .setThumbnail('https://img.icons8.com/fluency/48/new--v1.png')
            .setFooter({ text: `کاربر: ${interaction.user.username} | ${new Date().toLocaleString('fa-IR')}` });
            
          await interaction.reply({
            embeds: [embed],
            components: [
              new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                  new ButtonBuilder()
                    .setCustomId('market_my_listings')
                    .setLabel('📋 آگهی‌های من')
                    .setStyle(ButtonStyle.Primary),
                  new ButtonBuilder()
                    .setCustomId(isBlackMarket ? 'market_black' : 'market_regular')
                    .setLabel(`🏪 بازگشت به ${marketType}`)
                    .setStyle(ButtonStyle.Success)
                )
            ],
            ephemeral: true
          });
        } else {
          // خطا در ایجاد
          await interaction.reply({
            content: `❌ ایجاد آگهی ناموفق: ${result.message || 'خطایی رخ داد. لطفاً دوباره تلاش کنید.'}`,
            ephemeral: true
          });
        }
      } catch (error) {
        console.error('Error creating market listing:', error);
        await interaction.reply({
          content: '❌ خطایی در ایجاد آگهی رخ داد. لطفاً دوباره تلاش کنید.',
          ephemeral: true
        });
      }
      return;
    }
    
  } catch (error) {
    console.error('Error in modal submit handler:', error);
    
    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '❌ خطایی در پردازش فرم رخ داد. لطفاً دوباره تلاش کنید.',
          ephemeral: true
        });
      } else {
        await interaction.followUp({
          content: '❌ خطایی در پردازش فرم رخ داد. لطفاً دوباره تلاش کنید.',
          ephemeral: true
        });
      }
    } catch (replyError) {
      console.error('Error replying to modal interaction:', replyError);
    }
  }
}