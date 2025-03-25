import { 
  ButtonInteraction, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder,
  MessageComponentInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} from 'discord.js';
import { storage } from '../../storage';
import { log } from '../../vite';
import { getLogger, LogType } from '../utils/logger';
import { Pet } from '../../../shared/schema';

/**
 * سیستم پت‌ها (حیوانات خانگی) برای کاربران
 * امکان خرید، مراقبت و رشد حیوانات خانگی مجازی
 */
export async function petMenu(
  interaction: ButtonInteraction | MessageComponentInteraction,
  followUp: boolean = false
) {
  try {
    // بررسی وجود کاربر
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      if ('update' in interaction && typeof interaction.update === 'function') {
        try {
          await interaction.update({
            content: '⚠️ شما باید ابتدا یک حساب کاربری ایجاد کنید. از دستور /menu استفاده نمایید.',
            components: [],
            embeds: []
          });
        } catch (e) {
          await interaction.reply({
            content: '⚠️ شما باید ابتدا یک حساب کاربری ایجاد کنید. از دستور /menu استفاده نمایید.',
            ephemeral: true
          });
        }
      } else {
        await interaction.reply({
          content: '⚠️ شما باید ابتدا یک حساب کاربری ایجاد کنید. از دستور /menu استفاده نمایید.',
          ephemeral: true
        });
      }
      return;
    }
    
    // دریافت پت‌های کاربر
    const pets = await storage.getUserPets(user.id);
    
    // ساخت امبد مناسب
    const embed = new EmbedBuilder()
      .setColor('#4CAF50')
      .setTitle('🐾 حیوانات خانگی شما 🐾')
      .setThumbnail('https://img.icons8.com/fluency/48/pet.png') // آیکون fluency پت
      .setFooter({ 
        text: `${interaction.user.username} | Ccoin Pet System`, 
        iconURL: interaction.user.displayAvatarURL() 
      })
      .setTimestamp();
    
    // بررسی حالت نمایش (اگر کاربر پتی ندارد یا دارد)
    if (pets.length === 0) {
      // نمایش منوی خرید پت
      embed.setDescription(`
**${interaction.user.username}** عزیز، شما هنوز هیچ حیوان خانگی ندارید!

با حیوانات خانگی می‌توانید:
• افزایش بونوس روزانه دریافت کنید
• شانس برد در بازی‌ها و چرخ شانس را افزایش دهید
• در برابر سرقت محافظت شوید
• تجربه بیشتری کسب کنید

**انواع حیوانات خانگی:**
🐶 **سگ** - قیمت: 2000 Ccoin - بونوس اقتصادی
🐱 **گربه** - قیمت: 2000 Ccoin - افزایش شانس
🐰 **خرگوش** - قیمت: 2000 Ccoin - بونوس تجربه

**حیوانات ویژه (خرید با کریستال):**
🐉 **اژدها** - قیمت: 50 کریستال - بونوس اقتصادی و دفاعی
🦅 **ققنوس** - قیمت: 50 کریستال - بونوس شانس و تجربه

**یک حیوان خانگی انتخاب کنید:**
      `);
      
      // دکمه‌های خرید پت
      const row1 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('pet_buy_dog')
            .setLabel('🐶 سگ')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('pet_buy_cat')
            .setLabel('🐱 گربه')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('pet_buy_rabbit')
            .setLabel('🐰 خرگوش')
            .setStyle(ButtonStyle.Primary)
        );
      
      const row2 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('pet_buy_dragon')
            .setLabel('🐉 اژدها')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId('pet_buy_phoenix')
            .setLabel('🦅 ققنوس')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId('menu')
            .setLabel('🔙 بازگشت')
            .setStyle(ButtonStyle.Secondary)
        );
      
      // ارسال یا آپدیت پاسخ
      if (followUp) {
        await interaction.followUp({ embeds: [embed], components: [row1, row2], ephemeral: true });
      } else if ('update' in interaction && typeof interaction.update === 'function') {
        try {
          await interaction.update({ embeds: [embed], components: [row1, row2] });
        } catch (e) {
          await interaction.reply({ embeds: [embed], components: [row1, row2], ephemeral: true });
        }
      } else {
        await interaction.reply({ embeds: [embed], components: [row1, row2], ephemeral: true });
      }
    } else {
      // نمایش پت‌های موجود کاربر
      let activePet: Pet | null = null;
      
      // پیدا کردن پت فعال
      for (const pet of pets) {
        if (pet.active) {
          activePet = pet;
          break;
        }
      }
      
      // اگر هیچ پت فعالی نیست، اولین پت را به عنوان فعال در نظر بگیریم
      if (!activePet && pets.length > 0) {
        activePet = pets[0];
      }
      
      // آماده‌سازی توضیحات
      let description = `**${interaction.user.username}** عزیز، شما ${pets.length} حیوان خانگی دارید!\n\n`;
      
      if (activePet) {
        // نمایش اطلاعات پت فعال
        const petEmoji = getPetEmoji(activePet.type);
        description += `**${petEmoji} پت فعال: ${activePet.name}**\n`;
        description += `نوع: ${getPetTypeName(activePet.type)} | سطح: ${activePet.level} | تجربه: ${activePet.experience}/${activePet.level * 100}\n`;
        description += `خوشحالی: ${getProgressBar(activePet.happiness)} (${activePet.happiness}%)\n`;
        description += `گرسنگی: ${getProgressBar(activePet.hunger)} (${activePet.hunger}%)\n`;
        description += `سلامتی: ${getProgressBar(activePet.health)} (${activePet.health}%)\n\n`;
        
        // نمایش قابلیت‌های پت
        description += `**قابلیت‌های فعال:**\n`;
        
        if (activePet.abilities.economyBoost) {
          description += `• 💰 بونوس اقتصادی: +${activePet.abilities.economyBoost}%\n`;
        }
        if (activePet.abilities.luckBoost) {
          description += `• 🍀 بونوس شانس: +${activePet.abilities.luckBoost}%\n`;
        }
        if (activePet.abilities.expBoost) {
          description += `• ⭐ بونوس تجربه: +${activePet.abilities.expBoost}%\n`;
        }
        if (activePet.abilities.defenseBoost) {
          description += `• 🛡️ بونوس دفاعی: +${activePet.abilities.defenseBoost}%\n`;
        }
        
        description += `\n**آمار پت:**\n`;
        description += `• 🎮 بازی‌ها: ${activePet.stats.gamesPlayed}\n`;
        description += `• 🍖 تشویقی‌ها: ${activePet.stats.treats}\n`;
        description += `• 🏆 پیروزی‌ها: ${activePet.stats.wins}\n`;
        
        // نمایش وضعیت
        const lastFedDate = new Date(activePet.lastFed);
        const lastPlayedDate = new Date(activePet.lastPlayed);
        const now = new Date();
        
        const hoursSinceLastFed = Math.floor((now.getTime() - lastFedDate.getTime()) / (1000 * 60 * 60));
        const hoursSinceLastPlayed = Math.floor((now.getTime() - lastPlayedDate.getTime()) / (1000 * 60 * 60));
        
        description += `\n**وضعیت:**\n`;
        
        if (hoursSinceLastFed > 6) {
          description += `• 🍽️ گرسنه است! آخرین غذا: ${hoursSinceLastFed} ساعت پیش\n`;
        } else {
          description += `• 🍽️ آخرین غذا: ${hoursSinceLastFed} ساعت پیش\n`;
        }
        
        if (hoursSinceLastPlayed > 8) {
          description += `• 🎯 نیاز به بازی دارد! آخرین بازی: ${hoursSinceLastPlayed} ساعت پیش\n`;
        } else {
          description += `• 🎯 آخرین بازی: ${hoursSinceLastPlayed} ساعت پیش\n`;
        }
      }
      
      // تنظیم توضیحات در امبد
      embed.setDescription(description);
      
      // دکمه‌های تعامل با پت
      const petRows: ActionRowBuilder<ButtonBuilder>[] = [];
      
      // سطر اول: دکمه‌های اصلی برای پت فعال
      if (activePet) {
        const row1 = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(`pet_feed_${activePet.id}`)
              .setLabel('🍖 غذا دادن')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId(`pet_play_${activePet.id}`)
              .setLabel('🎾 بازی کردن')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId(`pet_rename_${activePet.id}`)
              .setLabel('✏️ تغییر نام')
              .setStyle(ButtonStyle.Secondary)
          );
        
        petRows.push(row1);
      }
      
      // سطر دوم: انتخاب پت‌های دیگر
      if (pets.length > 1) {
        const row2 = new ActionRowBuilder<ButtonBuilder>();
        
        // دکمه‌ها برای تغییر پت فعال (حداکثر 5 دکمه)
        for (let i = 0; i < Math.min(pets.length, 4); i++) {
          const pet = pets[i];
          if (pet.id !== activePet?.id) {
            row2.addComponents(
              new ButtonBuilder()
                .setCustomId(`pet_activate_${pet.id}`)
                .setLabel(`${getPetEmoji(pet.type)} ${pet.name}`)
                .setStyle(ButtonStyle.Secondary)
            );
          }
        }
        
        if (row2.components.length > 0) {
          petRows.push(row2);
        }
      }
      
      // سطر سوم: دکمه‌های مدیریت و خرید پت جدید
      const row3 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('pet_shop')
            .setLabel('🛒 خرید پت جدید')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('menu')
            .setLabel('🔙 بازگشت')
            .setStyle(ButtonStyle.Secondary)
        );
      
      petRows.push(row3);
      
      // ارسال یا آپدیت پاسخ
      if (followUp) {
        await interaction.followUp({ embeds: [embed], components: petRows, ephemeral: true });
      } else if ('update' in interaction && typeof interaction.update === 'function') {
        try {
          await interaction.update({ embeds: [embed], components: petRows });
        } catch (e) {
          await interaction.reply({ embeds: [embed], components: petRows, ephemeral: true });
        }
      } else {
        await interaction.reply({ embeds: [embed], components: petRows, ephemeral: true });
      }
    }
    
  } catch (error) {
    console.error('Error in pet menu:', error);
    
    try {
      if (followUp) {
        await interaction.followUp({
          content: '❌ متأسفانه در نمایش منوی پت خطایی رخ داد!',
          ephemeral: true
        });
      } else {
        if ('update' in interaction && typeof interaction.update === 'function') {
          try {
            await interaction.update({
              content: '❌ متأسفانه در نمایش منوی پت خطایی رخ داد!',
              components: [],
              embeds: []
            });
          } catch (e) {
            await interaction.reply({
              content: '❌ متأسفانه در نمایش منوی پت خطایی رخ داد!',
              ephemeral: true
            });
          }
        } else {
          await interaction.reply({
            content: '❌ متأسفانه در نمایش منوی پت خطایی رخ داد!',
            ephemeral: true
          });
        }
      }
    } catch (e) {
      console.error('Error handling pet menu failure:', e);
    }
  }
}

/**
 * پردازش خرید پت جدید
 */
export async function buyNewPet(
  interaction: ButtonInteraction | MessageComponentInteraction,
  petType: string
) {
  try {
    // بررسی نوع پت
    if (!['dog', 'cat', 'rabbit', 'dragon', 'phoenix'].includes(petType)) {
      if ('update' in interaction && typeof interaction.update === 'function') {
        try {
          await interaction.update({
            content: '❌ نوع پت انتخابی نامعتبر است!',
            components: [],
            embeds: []
          });
        } catch (e) {
          await interaction.reply({
            content: '❌ نوع پت انتخابی نامعتبر است!',
            ephemeral: true
          });
        }
      } else {
        await interaction.reply({
          content: '❌ نوع پت انتخابی نامعتبر است!',
          ephemeral: true
        });
      }
      return;
    }
    
    // نمایش مدال برای وارد کردن نام پت
    const modal = new ModalBuilder()
      .setCustomId(`pet_name_modal_${petType}`)
      .setTitle(`نام پت ${getPetTypeName(petType)} خود را وارد کنید`);
    
    const nameInput = new TextInputBuilder()
      .setCustomId('pet_name')
      .setLabel('نام پت')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder(`مثال: فیفی، گربه ناز، اژدهای آتشین...`)
      .setRequired(true)
      .setMinLength(2)
      .setMaxLength(20);
    
    const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput);
    modal.addComponents(firstActionRow);
    
    await interaction.showModal(modal);
    
  } catch (error) {
    console.error('Error in buy pet:', error);
    
    if ('update' in interaction && typeof interaction.update === 'function') {
      try {
        await interaction.update({
          content: '❌ متأسفانه در خرید پت خطایی رخ داد!',
          components: [],
          embeds: []
        });
      } catch (e) {
        await interaction.reply({
          content: '❌ متأسفانه در خرید پت خطایی رخ داد!',
          ephemeral: true
        });
      }
    } else {
      await interaction.reply({
        content: '❌ متأسفانه در خرید پت خطایی رخ داد!',
        ephemeral: true
      });
    }
  }
}

/**
 * پردازش خرید پت جدید بعد از دریافت نام
 */
export async function processBuyPet(
  interaction: MessageComponentInteraction,
  petType: string,
  petName: string
) {
  try {
    // دریافت کاربر
    const user = await storage.getUserByDiscordId(interaction.user.id);
    if (!user) {
      await interaction.reply({
        content: '❌ حساب کاربری شما یافت نشد!',
        ephemeral: true
      });
      return;
    }
    
    // خرید پت
    const newPet = await storage.buyPet(user.id, petType, petName);
    
    if (!newPet) {
      await interaction.reply({
        content: '❌ خرید پت با مشکل مواجه شد! موجودی کافی ندارید یا مشکل دیگری وجود دارد.',
        ephemeral: true
      });
      return;
    }
    
    // اعلام موفقیت‌آمیز بودن خرید
    await interaction.reply({
      content: `✅ تبریک! شما یک ${getPetTypeName(petType)} به نام **${petName}** خریدید! 🎉`,
      ephemeral: true
    });
    
    // نمایش منوی پت با تاخیر
    setTimeout(async () => {
      try {
        await petMenu(interaction, true);
      } catch (error) {
        console.error('Error showing pet menu after purchase:', error);
      }
    }, 2000);
    
  } catch (error) {
    console.error('Error in process buy pet:', error);
    await interaction.reply({
      content: '❌ متأسفانه در خرید پت خطایی رخ داد!',
      ephemeral: true
    });
  }
}

/**
 * غذا دادن به پت
 */
export async function feedPet(
  interaction: ButtonInteraction | MessageComponentInteraction,
  petId: string
) {
  try {
    // دریافت کاربر
    const user = await storage.getUserByDiscordId(interaction.user.id);
    if (!user) {
      if ('update' in interaction && typeof interaction.update === 'function') {
        try {
          await interaction.update({
            content: '❌ حساب کاربری شما یافت نشد!',
            components: [],
            embeds: []
          });
        } catch (e) {
          await interaction.reply({
            content: '❌ حساب کاربری شما یافت نشد!',
            ephemeral: true
          });
        }
      } else {
        await interaction.reply({
          content: '❌ حساب کاربری شما یافت نشد!',
          ephemeral: true
        });
      }
      return;
    }
    
    // غذا دادن به پت
    const pet = await storage.feedPet(user.id, petId);
    
    if (!pet) {
      if ('update' in interaction && typeof interaction.update === 'function') {
        try {
          await interaction.update({
            content: '❌ غذا دادن به پت با مشکل مواجه شد! شاید موجودی کافی ندارید یا پت یافت نشد.',
            components: [],
            embeds: []
          });
        } catch (e) {
          await interaction.reply({
            content: '❌ غذا دادن به پت با مشکل مواجه شد! شاید موجودی کافی ندارید یا پت یافت نشد.',
            ephemeral: true
          });
        }
      } else {
        await interaction.reply({
          content: '❌ غذا دادن به پت با مشکل مواجه شد! شاید موجودی کافی ندارید یا پت یافت نشد.',
          ephemeral: true
        });
      }
      return;
    }
    
    // اعلام موفقیت‌آمیز بودن عملیات
    let message = '';
    if (pet.hunger <= 0) {
      message = `🍖 شما به ${pet.name} غذا دادید! پت شما سیر شده و خیلی خوشحال است! 😊`;
    } else if (pet.hunger <= 30) {
      message = `🍖 شما به ${pet.name} غذا دادید! پت شما تقریباً سیر شده است. 😊`;
    } else {
      message = `🍖 شما به ${pet.name} غذا دادید! پت شما هنوز کمی گرسنه است.`;
    }
    
    if ('update' in interaction && typeof interaction.update === 'function') {
      try {
        await interaction.update({
          content: message,
          components: [],
          embeds: []
        });
      } catch (e) {
        await interaction.reply({
          content: message,
          ephemeral: true
        });
      }
    } else {
      await interaction.reply({
        content: message,
        ephemeral: true
      });
    }
    
    // نمایش منوی پت با تاخیر
    setTimeout(async () => {
      try {
        await petMenu(interaction, true);
      } catch (error) {
        console.error('Error showing pet menu after feeding:', error);
      }
    }, 2000);
    
  } catch (error) {
    console.error('Error in feed pet:', error);
    
    if ('update' in interaction && typeof interaction.update === 'function') {
      try {
        await interaction.update({
          content: '❌ متأسفانه در غذا دادن به پت خطایی رخ داد!',
          components: [],
          embeds: []
        });
      } catch (e) {
        await interaction.reply({
          content: '❌ متأسفانه در غذا دادن به پت خطایی رخ داد!',
          ephemeral: true
        });
      }
    } else {
      await interaction.reply({
        content: '❌ متأسفانه در غذا دادن به پت خطایی رخ داد!',
        ephemeral: true
      });
    }
  }
}

/**
 * بازی کردن با پت
 */
export async function playWithPet(
  interaction: ButtonInteraction | MessageComponentInteraction,
  petId: string
) {
  try {
    // دریافت کاربر
    const user = await storage.getUserByDiscordId(interaction.user.id);
    if (!user) {
      if ('update' in interaction && typeof interaction.update === 'function') {
        try {
          await interaction.update({
            content: '❌ حساب کاربری شما یافت نشد!',
            components: [],
            embeds: []
          });
        } catch (e) {
          await interaction.reply({
            content: '❌ حساب کاربری شما یافت نشد!',
            ephemeral: true
          });
        }
      } else {
        await interaction.reply({
          content: '❌ حساب کاربری شما یافت نشد!',
          ephemeral: true
        });
      }
      return;
    }
    
    // بازی کردن با پت
    const pet = await storage.playWithPet(user.id, petId);
    
    if (!pet) {
      if ('update' in interaction && typeof interaction.update === 'function') {
        try {
          await interaction.update({
            content: '❌ بازی کردن با پت با مشکل مواجه شد! شاید پت یافت نشد.',
            components: [],
            embeds: []
          });
        } catch (e) {
          await interaction.reply({
            content: '❌ بازی کردن با پت با مشکل مواجه شد! شاید پت یافت نشد.',
            ephemeral: true
          });
        }
      } else {
        await interaction.reply({
          content: '❌ بازی کردن با پت با مشکل مواجه شد! شاید پت یافت نشد.',
          ephemeral: true
        });
      }
      return;
    }
    
    // اعلام موفقیت‌آمیز بودن عملیات
    let message = '';
    if (pet.happiness >= 90) {
      message = `🎾 شما با ${pet.name} بازی کردید! پت شما بسیار خوشحال و پر انرژی است! 🥳`;
    } else if (pet.happiness >= 70) {
      message = `🎾 شما با ${pet.name} بازی کردید! پت شما خوشحال است! 😊`;
    } else {
      message = `🎾 شما با ${pet.name} بازی کردید! پت شما کمی خوشحال‌تر شد.`;
    }
    
    if ('update' in interaction && typeof interaction.update === 'function') {
      try {
        await interaction.update({
          content: message,
          components: [],
          embeds: []
        });
      } catch (e) {
        await interaction.reply({
          content: message,
          ephemeral: true
        });
      }
    } else {
      await interaction.reply({
        content: message,
        ephemeral: true
      });
    }
    
    // نمایش منوی پت با تاخیر
    setTimeout(async () => {
      try {
        await petMenu(interaction, true);
      } catch (error) {
        console.error('Error showing pet menu after playing:', error);
      }
    }, 2000);
    
  } catch (error) {
    console.error('Error in play with pet:', error);
    
    if ('update' in interaction && typeof interaction.update === 'function') {
      try {
        await interaction.update({
          content: '❌ متأسفانه در بازی کردن با پت خطایی رخ داد!',
          components: [],
          embeds: []
        });
      } catch (e) {
        await interaction.reply({
          content: '❌ متأسفانه در بازی کردن با پت خطایی رخ داد!',
          ephemeral: true
        });
      }
    } else {
      await interaction.reply({
        content: '❌ متأسفانه در بازی کردن با پت خطایی رخ داد!',
        ephemeral: true
      });
    }
  }
}

/**
 * فعال کردن یک پت
 */
export async function activatePet(
  interaction: ButtonInteraction | MessageComponentInteraction,
  petId: string
) {
  try {
    // دریافت کاربر
    const user = await storage.getUserByDiscordId(interaction.user.id);
    if (!user) {
      if ('update' in interaction && typeof interaction.update === 'function') {
        try {
          await interaction.update({
            content: '❌ حساب کاربری شما یافت نشد!',
            components: [],
            embeds: []
          });
        } catch (e) {
          await interaction.reply({
            content: '❌ حساب کاربری شما یافت نشد!',
            ephemeral: true
          });
        }
      } else {
        await interaction.reply({
          content: '❌ حساب کاربری شما یافت نشد!',
          ephemeral: true
        });
      }
      return;
    }
    
    // فعال کردن پت
    const success = await storage.activatePet(user.id, petId);
    
    if (!success) {
      if ('update' in interaction && typeof interaction.update === 'function') {
        try {
          await interaction.update({
            content: '❌ فعال‌سازی پت با مشکل مواجه شد! شاید پت یافت نشد.',
            components: [],
            embeds: []
          });
        } catch (e) {
          await interaction.reply({
            content: '❌ فعال‌سازی پت با مشکل مواجه شد! شاید پت یافت نشد.',
            ephemeral: true
          });
        }
      } else {
        await interaction.reply({
          content: '❌ فعال‌سازی پت با مشکل مواجه شد! شاید پت یافت نشد.',
          ephemeral: true
        });
      }
      return;
    }
    
    // دریافت اطلاعات پت‌ها
    const pets = await storage.getUserPets(user.id);
    const activePet = pets.find(p => p.id === petId);
    
    // اعلام موفقیت‌آمیز بودن عملیات
    let message = `✅ پت ${activePet?.name} با موفقیت فعال شد! قابلیت‌های این پت اکنون روی حساب شما اعمال می‌شود.`;
    
    if ('update' in interaction && typeof interaction.update === 'function') {
      try {
        await interaction.update({
          content: message,
          components: [],
          embeds: []
        });
      } catch (e) {
        await interaction.reply({
          content: message,
          ephemeral: true
        });
      }
    } else {
      await interaction.reply({
        content: message,
        ephemeral: true
      });
    }
    
    // نمایش منوی پت با تاخیر
    setTimeout(async () => {
      try {
        await petMenu(interaction, true);
      } catch (error) {
        console.error('Error showing pet menu after activation:', error);
      }
    }, 2000);
    
  } catch (error) {
    console.error('Error in activate pet:', error);
    
    if ('update' in interaction && typeof interaction.update === 'function') {
      try {
        await interaction.update({
          content: '❌ متأسفانه در فعال‌سازی پت خطایی رخ داد!',
          components: [],
          embeds: []
        });
      } catch (e) {
        await interaction.reply({
          content: '❌ متأسفانه در فعال‌سازی پت خطایی رخ داد!',
          ephemeral: true
        });
      }
    } else {
      await interaction.reply({
        content: '❌ متأسفانه در فعال‌سازی پت خطایی رخ داد!',
        ephemeral: true
      });
    }
  }
}

/**
 * ایجاد مدال برای تغییر نام پت
 */
export async function renamePetModal(
  interaction: ButtonInteraction | MessageComponentInteraction,
  petId: string
) {
  try {
    // نمایش مدال برای وارد کردن نام جدید پت
    const modal = new ModalBuilder()
      .setCustomId(`pet_rename_modal_${petId}`)
      .setTitle(`نام جدید پت خود را وارد کنید`);
    
    const nameInput = new TextInputBuilder()
      .setCustomId('pet_new_name')
      .setLabel('نام جدید پت')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder(`مثال: فیفی، گربه ناز، اژدهای آتشین...`)
      .setRequired(true)
      .setMinLength(2)
      .setMaxLength(20);
    
    const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput);
    modal.addComponents(firstActionRow);
    
    await interaction.showModal(modal);
    
  } catch (error) {
    console.error('Error in rename pet modal:', error);
    
    if ('update' in interaction && typeof interaction.update === 'function') {
      try {
        await interaction.update({
          content: '❌ متأسفانه در تغییر نام پت خطایی رخ داد!',
          components: [],
          embeds: []
        });
      } catch (e) {
        await interaction.reply({
          content: '❌ متأسفانه در تغییر نام پت خطایی رخ داد!',
          ephemeral: true
        });
      }
    } else {
      await interaction.reply({
        content: '❌ متأسفانه در تغییر نام پت خطایی رخ داد!',
        ephemeral: true
      });
    }
  }
}

/**
 * پردازش تغییر نام پت
 */
export async function processRenamePet(
  interaction: MessageComponentInteraction,
  petId: string,
  newName: string
) {
  try {
    // دریافت کاربر
    const user = await storage.getUserByDiscordId(interaction.user.id);
    if (!user) {
      await interaction.reply({
        content: '❌ حساب کاربری شما یافت نشد!',
        ephemeral: true
      });
      return;
    }
    
    // تغییر نام پت
    const pet = await storage.renamePet(user.id, petId, newName);
    
    if (!pet) {
      await interaction.reply({
        content: '❌ تغییر نام پت با مشکل مواجه شد! شاید پت یافت نشد یا نام جدید نامعتبر است.',
        ephemeral: true
      });
      return;
    }
    
    // اعلام موفقیت‌آمیز بودن عملیات
    await interaction.reply({
      content: `✅ نام پت شما با موفقیت به **${newName}** تغییر یافت!`,
      ephemeral: true
    });
    
    // نمایش منوی پت با تاخیر
    setTimeout(async () => {
      try {
        await petMenu(interaction, true);
      } catch (error) {
        console.error('Error showing pet menu after rename:', error);
      }
    }, 2000);
    
  } catch (error) {
    console.error('Error in process rename pet:', error);
    await interaction.reply({
      content: '❌ متأسفانه در تغییر نام پت خطایی رخ داد!',
      ephemeral: true
    });
  }
}

/**
 * دریافت emoji مربوط به هر نوع پت
 */
function getPetEmoji(petType: string): string {
  switch (petType) {
    case 'dog':
      return '🐶';
    case 'cat':
      return '🐱';
    case 'rabbit':
      return '🐰';
    case 'dragon':
      return '🐉';
    case 'phoenix':
      return '🦅';
    default:
      return '🐾';
  }
}

/**
 * دریافت نام فارسی هر نوع پت
 */
function getPetTypeName(petType: string): string {
  switch (petType) {
    case 'dog':
      return 'سگ';
    case 'cat':
      return 'گربه';
    case 'rabbit':
      return 'خرگوش';
    case 'dragon':
      return 'اژدها';
    case 'phoenix':
      return 'ققنوس';
    default:
      return 'حیوان خانگی';
  }
}

/**
 * ایجاد نوار پیشرفت برای نمایش وضعیت پت
 */
function getProgressBar(percent: number): string {
  const filledCount = Math.floor(percent / 10);
  const emptyCount = 10 - filledCount;
  
  return '█'.repeat(filledCount) + '░'.repeat(emptyCount);
}