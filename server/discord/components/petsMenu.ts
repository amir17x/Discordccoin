import { 
  MessageComponentInteraction, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle 
} from 'discord.js';
import { storage } from '../../storage';

/**
 * سیستم پت‌های Ccoin
 * امکان نگهداری، تغذیه، و بازی با پت‌های مجازی
 */
export async function petsMenu(
  interaction: MessageComponentInteraction
) {
  try {
    // دریافت اطلاعات کاربر از دیتابیس
    const userId = parseInt(interaction.user.id);
    const user = await storage.getUser(userId);
    
    if (!user) {
      if ('update' in interaction && typeof interaction.update === 'function') {
        try {
          await interaction.update({ 
            content: 'حساب شما در سیستم یافت نشد! لطفاً با دستور `/start` ثبت نام کنید.', 
            embeds: [], 
            components: [] 
          });
        } catch (e) {
          await interaction.reply({ 
            content: 'حساب شما در سیستم یافت نشد! لطفاً با دستور `/start` ثبت نام کنید.', 
            ephemeral: true 
          });
        }
      } else {
        await interaction.reply({ 
          content: 'حساب شما در سیستم یافت نشد! لطفاً با دستور `/start` ثبت نام کنید.', 
          ephemeral: true 
        });
      }
      return;
    }
    
    // در پیاده‌سازی واقعی، پت‌های کاربر از دیتابیس خوانده می‌شوند
    // اینجا برای نمونه، ما آن‌ها را هاردکد می‌کنیم
    const userPets = [
      {
        id: 'dog1',
        name: 'رکس',
        type: 'dog',
        level: 3,
        happiness: 75,
        hunger: 40,
        energy: 65,
        lastFed: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 ساعت پیش
        lastPlayed: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 ساعت پیش
        abilities: ['محافظت', 'جستجوی سکه', 'بازی توپ'],
        bonuses: ['افزایش 2% شانس روزانه', 'کاهش 5% هزینه سفر']
      }
    ];
    
    // لیست پت‌های موجود برای خرید
    const availablePets = [
      {
        id: 'cat1',
        name: 'پت گربه',
        type: 'cat',
        description: 'گربه‌ای باهوش و چابک که می‌تواند سکه‌های اضافه پیدا کند و شانس شما را افزایش دهد.',
        price: 5000,
        crystal_price: 50,
        abilities: ['یافتن سکه‌های مخفی', 'افزایش شانس در قرعه‌کشی‌ها', 'دفاع از سرقت'],
        image: '🐱'
      },
      {
        id: 'dog2',
        name: 'پت سگ وفادار',
        type: 'dog',
        description: 'سگ وفاداری که به شما در یافتن آیتم‌های کمیاب کمک می‌کند و از شما در برابر سرقت محافظت می‌کند.',
        price: 6000,
        crystal_price: 60,
        abilities: ['یافتن آیتم‌های کمیاب', 'محافظت از سکه‌ها', 'افزایش درآمد روزانه'],
        image: '🐶'
      },
      {
        id: 'dragon1',
        name: 'اژدهای کوچک',
        type: 'dragon',
        description: 'اژدهای کوچک و منحصر به فردی که بونوس‌های قدرتمندی برای فعالیت‌های اقتصادی ارائه می‌دهد.',
        price: 15000,
        crystal_price: 150,
        abilities: ['افزایش 10% درآمد از همه منابع', 'محافظت قوی', 'کاهش هزینه‌ها'],
        image: '🐉'
      },
      {
        id: 'fox1',
        name: 'روباه زیرک',
        type: 'fox',
        description: 'روباه باهوشی که به شما در معاملات و کسب سکه کمک می‌کند.',
        price: 8000,
        crystal_price: 80,
        abilities: ['افزایش 5% سود بانکی', 'یافتن آیتم‌های پنهان', 'کمک در سرقت'],
        image: '🦊'
      }
    ];
    
    // ایجاد Embed برای نمایش پت‌های کاربر
    const embed = new EmbedBuilder()
      .setColor('#FF9966')
      .setTitle('🐾 پت‌های Ccoin')
      .setDescription('پت‌های مجازی خود را نگهداری کنید، با آن‌ها بازی کنید و از مزایای آن‌ها بهره‌مند شوید!')
      .setThumbnail('https://img.icons8.com/fluency/96/pets.png')
      .addFields(
        { 
          name: '👛 موجودی شما',
          value: `سکه: ${user.wallet.toLocaleString()} | بانک: ${user.bank.toLocaleString()} | کریستال: ${user.crystals.toLocaleString()}`,
          inline: false
        }
      );
    
    // افزودن پت‌های کاربر
    if (userPets.length > 0) {
      embed.addFields({
        name: '🐾 پت‌های فعلی شما',
        value: 'لیست پت‌های شما:',
        inline: false
      });
      
      userPets.forEach(pet => {
        const happinessEmoji = pet.happiness > 70 ? '😄' : pet.happiness > 30 ? '😐' : '😢';
        const hungerEmoji = pet.hunger < 30 ? '🍗' : pet.hunger < 70 ? '🍽️' : '🍽️❗';
        const energyEmoji = pet.energy > 70 ? '⚡' : pet.energy > 30 ? '🔋' : '💤';
        
        embed.addFields({
          name: `${getPetEmoji(pet.type)} ${pet.name} (سطح ${pet.level})`,
          value: `وضعیت: ${happinessEmoji} خوشحالی: ${pet.happiness}% | ${hungerEmoji} گرسنگی: ${pet.hunger}% | ${energyEmoji} انرژی: ${pet.energy}%\n`+
                 `توانایی‌ها: ${pet.abilities.join(', ')}\n`+
                 `بونوس‌ها: ${pet.bonuses.join(', ')}`,
          inline: false
        });
      });
    } else {
      embed.addFields({
        name: '🐾 پت‌های فعلی شما',
        value: 'شما هنوز هیچ پتی ندارید! می‌توانید از فروشگاه پت، یک پت خریداری کنید.',
        inline: false
      });
    }
    
    // افزودن بخش پت‌های قابل خرید
    embed.addFields({
      name: '🛍️ فروشگاه پت',
      value: 'پت‌های زیر برای خرید در دسترس هستند:',
      inline: false
    });
    
    availablePets.forEach(pet => {
      embed.addFields({
        name: `${pet.image} ${pet.name} - ${pet.price.toLocaleString()} سکه یا ${pet.crystal_price} کریستال`,
        value: `${pet.description}\nتوانایی‌ها: ${pet.abilities.join(', ')}`,
        inline: false
      });
    });
    
    // دکمه‌های تعاملی برای پت‌های کاربر
    const petButtons = [];
    if (userPets.length > 0) {
      const row1 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`pet_feed_${userPets[0].id}`)
            .setLabel('🍖 غذا دادن')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`pet_play_${userPets[0].id}`)
            .setLabel('🎾 بازی کردن')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`pet_details_${userPets[0].id}`)
            .setLabel('📋 جزئیات')
            .setStyle(ButtonStyle.Secondary)
        );
      petButtons.push(row1);
    }
    
    // دکمه‌های خرید پت
    const row2 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`pet_shop`)
          .setLabel('🛍️ فروشگاه پت‌ها')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`pet_adopt`)
          .setLabel('🐶 پذیرش پت رایگان')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(userPets.length > 0) // اگر کاربر پت دارد، دکمه غیرفعال است
      );
    
    // دکمه‌های برگشت و راهنما
    const row3 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('pet_help')
          .setLabel('❓ راهنمای پت‌ها')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('menu')
          .setLabel('🔙 بازگشت به منوی اصلی')
          .setStyle(ButtonStyle.Danger)
      );
    
    // ترکیب همه دکمه‌ها
    const allButtons = [...petButtons, row2, row3];
    
    // ارسال یا بروزرسانی پیام
    if ('update' in interaction && typeof interaction.update === 'function') {
      try {
        await interaction.update({ 
          embeds: [embed], 
          components: allButtons 
        });
      } catch (e) {
        // اگر بروزرسانی با خطا مواجه شد، پیام جدید ارسال کن
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ 
            embeds: [embed], 
            components: allButtons, 
            ephemeral: true 
          });
        } else {
          await interaction.followUp({ 
            embeds: [embed], 
            components: allButtons, 
            ephemeral: true 
          });
        }
      }
    } else {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ 
          embeds: [embed], 
          components: allButtons, 
          ephemeral: true 
        });
      } else {
        await interaction.followUp({ 
          embeds: [embed], 
          components: allButtons, 
          ephemeral: true 
        });
      }
    }
    
  } catch (error) {
    console.error('Error in pets menu:', error);
    
    try {
      const errorMessage = 'خطایی در نمایش منوی پت‌ها رخ داد! لطفاً دوباره تلاش کنید.';
      
      if ('update' in interaction && typeof interaction.update === 'function') {
        try {
          await interaction.update({ content: errorMessage, embeds: [], components: [] });
        } catch (e) {
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: errorMessage, ephemeral: true });
          } else {
            await interaction.followUp({ content: errorMessage, ephemeral: true });
          }
        }
      } else {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: errorMessage, ephemeral: true });
        } else {
          await interaction.followUp({ content: errorMessage, ephemeral: true });
        }
      }
    } catch (e) {
      console.error('Error handling pets menu failure:', e);
    }
  }
}

/**
 * نمایش جزئیات یک پت
 */
async function showPetDetails(
  interaction: MessageComponentInteraction,
  petId: string
) {
  try {
    // دریافت اطلاعات کاربر از دیتابیس
    const userId = parseInt(interaction.user.id);
    const user = await storage.getUser(userId);
    
    if (!user) {
      await interaction.reply({ 
        content: 'حساب شما در سیستم یافت نشد!', 
        ephemeral: true 
      });
      return;
    }
    
    // در پیاده‌سازی واقعی، اطلاعات پت از دیتابیس خوانده می‌شود
    // اینجا برای نمونه، ما آن را هاردکد می‌کنیم
    const pet = {
      id: 'dog1',
      name: 'رکس',
      type: 'dog',
      level: 3,
      experience: 325,
      nextLevelExperience: 500,
      happiness: 75,
      hunger: 40,
      energy: 65,
      health: 90,
      age: '1 ماه و 5 روز',
      birthday: '1402/09/15',
      adoptionDate: '1402/09/15',
      lastFed: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      lastPlayed: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      abilities: ['محافظت', 'جستجوی سکه', 'بازی توپ'],
      bonuses: ['افزایش 2% شانس روزانه', 'کاهش 5% هزینه سفر'],
      favoriteFood: 'استخوان مرغ',
      favoriteGame: 'دنبال کردن توپ',
      stats: {
        strength: 6,
        agility: 8,
        intelligence: 4,
        loyalty: 10
      },
      achievements: [
        { title: 'اولین قدم‌ها', description: 'اولین روز پذیرش پت', awarded: '1402/09/15' },
        { title: 'دوست وفادار', description: '10 روز متوالی رسیدگی به پت', awarded: '1402/09/25' }
      ]
    };
    
    if (pet.id !== petId) {
      await interaction.reply({ 
        content: 'این پت متعلق به شما نیست!', 
        ephemeral: true 
      });
      return;
    }
    
    // محاسبه پیشرفت سطح
    const levelProgress = Math.round((pet.experience / pet.nextLevelExperience) * 100);
    const progressBar = '█'.repeat(Math.floor(levelProgress / 10)) + '░'.repeat(10 - Math.floor(levelProgress / 10));
    
    // ایجاد Embed برای نمایش جزئیات پت
    const embed = new EmbedBuilder()
      .setColor('#FF9966')
      .setTitle(`${getPetEmoji(pet.type)} ${pet.name} (${getPetTypeName(pet.type)})`)
      .setDescription(`پت ${pet.name} شما که ${pet.age} سن دارد و در تاریخ ${pet.birthday} متولد شده است.`)
      .setThumbnail('https://img.icons8.com/fluency/96/pets.png')
      .addFields(
        { 
          name: '📊 وضعیت کلی',
          value: `سلامتی: ${pet.health}% | خوشحالی: ${pet.happiness}% | گرسنگی: ${pet.hunger}% | انرژی: ${pet.energy}%`,
          inline: false
        },
        { 
          name: '📈 پیشرفت سطح',
          value: `سطح ${pet.level} | تجربه: ${pet.experience}/${pet.nextLevelExperience}\n${progressBar} ${levelProgress}%`,
          inline: false
        },
        { 
          name: '💪 مشخصات',
          value: `قدرت: ${pet.stats.strength} | چابکی: ${pet.stats.agility} | هوش: ${pet.stats.intelligence} | وفاداری: ${pet.stats.loyalty}`,
          inline: false
        },
        { 
          name: '🎖️ توانایی‌ها',
          value: pet.abilities.join('\n'),
          inline: true
        },
        { 
          name: '🎁 بونوس‌ها',
          value: pet.bonuses.join('\n'),
          inline: true
        },
        { 
          name: '❤️ علایق',
          value: `غذای محبوب: ${pet.favoriteFood}\nبازی محبوب: ${pet.favoriteGame}`,
          inline: false
        }
      );
    
    // افزودن بخش دستاوردها
    const achievementsText = pet.achievements.map(a => `🏆 ${a.title} (${a.awarded}): ${a.description}`).join('\n');
    embed.addFields({
      name: '🏆 دستاوردها',
      value: achievementsText || 'هنوز هیچ دستاوردی ندارد!',
      inline: false
    });
    
    // محاسبه زمان آخرین تغذیه و بازی
    const lastFedDate = new Date(pet.lastFed);
    const lastPlayedDate = new Date(pet.lastPlayed);
    const now = new Date();
    
    const lastFedHours = Math.floor((now.getTime() - lastFedDate.getTime()) / (1000 * 60 * 60));
    const lastPlayedHours = Math.floor((now.getTime() - lastPlayedDate.getTime()) / (1000 * 60 * 60));
    
    embed.addFields({
      name: '⏱️ آخرین فعالیت‌ها',
      value: `آخرین تغذیه: ${lastFedHours} ساعت پیش\nآخرین بازی: ${lastPlayedHours} ساعت پیش`,
      inline: false
    });
    
    // دکمه‌های تعاملی
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`pet_feed_${pet.id}`)
          .setLabel('🍖 غذا دادن')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`pet_play_${pet.id}`)
          .setLabel('🎾 بازی کردن')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('pets')
          .setLabel('🔙 بازگشت به لیست پت‌ها')
          .setStyle(ButtonStyle.Secondary)
      );
    
    await interaction.reply({ 
      embeds: [embed], 
      components: [row], 
      ephemeral: true 
    });
    
  } catch (error) {
    console.error(`Error in show pet details for ${petId}:`, error);
    
    await interaction.reply({ 
      content: 'خطایی در نمایش جزئیات پت رخ داد! لطفاً دوباره تلاش کنید.', 
      ephemeral: true 
    });
  }
}

/**
 * پردازش خرید پت
 */
async function processBuyPet(
  interaction: MessageComponentInteraction,
  petId: string,
  paymentType: 'coin' | 'crystal'
) {
  try {
    // دریافت اطلاعات کاربر از دیتابیس
    const userId = parseInt(interaction.user.id);
    const user = await storage.getUser(userId);
    
    if (!user) {
      await interaction.reply({ 
        content: 'حساب شما در سیستم یافت نشد!', 
        ephemeral: true 
      });
      return;
    }
    
    // در پیاده‌سازی واقعی، اطلاعات پت از دیتابیس خوانده می‌شود
    const availablePets = {
      'cat1': {
        name: 'پت گربه',
        type: 'cat',
        price: 5000,
        crystal_price: 50
      },
      'dog2': {
        name: 'پت سگ وفادار',
        type: 'dog',
        price: 6000,
        crystal_price: 60
      },
      'dragon1': {
        name: 'اژدهای کوچک',
        type: 'dragon',
        price: 15000,
        crystal_price: 150
      },
      'fox1': {
        name: 'روباه زیرک',
        type: 'fox',
        price: 8000,
        crystal_price: 80
      }
    };
    
    const pet = availablePets[petId as keyof typeof availablePets];
    
    if (!pet) {
      await interaction.reply({ 
        content: 'این پت در فروشگاه موجود نیست!', 
        ephemeral: true 
      });
      return;
    }
    
    // بررسی کافی بودن موجودی
    const price = paymentType === 'coin' ? pet.price : 0;
    const crystalPrice = paymentType === 'crystal' ? pet.crystal_price : 0;
    
    if (paymentType === 'coin' && user.wallet < price) {
      await interaction.reply({ 
        content: `موجودی سکه شما کافی نیست! برای خرید این پت به ${price} سکه نیاز دارید.`, 
        ephemeral: true 
      });
      return;
    }
    
    if (paymentType === 'crystal' && user.crystals < crystalPrice) {
      await interaction.reply({ 
        content: `موجودی کریستال شما کافی نیست! برای خرید این پت به ${crystalPrice} کریستال نیاز دارید.`, 
        ephemeral: true 
      });
      return;
    }
    
    // کسر هزینه از حساب کاربر
    if (paymentType === 'coin') {
      await storage.addToWallet(userId, -price);
    } else {
      await storage.addCrystals(userId, -crystalPrice);
    }
    
    // در پیاده‌سازی واقعی، پت به کاربر اضافه می‌شود
    // ...
    
    // ایجاد پاسخ به کاربر
    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('✅ خرید پت موفقیت‌آمیز')
      .setDescription(`شما با موفقیت پت ${pet.name} را خریداری کردید!`)
      .setThumbnail('https://img.icons8.com/fluency/96/pets.png')
      .addFields(
        { 
          name: '💰 هزینه پرداخت شده',
          value: paymentType === 'coin' ? `${price} سکه` : `${crystalPrice} کریستال`,
          inline: true
        },
        { 
          name: '🎮 چه باید کرد؟',
          value: 'می‌توانید به پت خود غذا دهید، با آن بازی کنید و از بونوس‌های آن بهره‌مند شوید.',
          inline: false
        }
      );
    
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('pets')
          .setLabel('🔙 بازگشت به منوی پت‌ها')
          .setStyle(ButtonStyle.Primary)
      );
    
    await interaction.reply({ 
      embeds: [embed], 
      components: [row], 
      ephemeral: true 
    });
    
  } catch (error) {
    console.error(`Error in buy pet ${petId}:`, error);
    
    await interaction.reply({ 
      content: 'خطایی در خرید پت رخ داد! لطفاً دوباره تلاش کنید.', 
      ephemeral: true 
    });
  }
}

/**
 * گرفتن ایموجی مناسب برای هر نوع پت
 */
function getPetEmoji(petType: string): string {
  switch (petType) {
    case 'dog':
      return '🐶';
    case 'cat':
      return '🐱';
    case 'dragon':
      return '🐉';
    case 'fox':
      return '🦊';
    case 'bird':
      return '🐦';
    case 'rabbit':
      return '🐰';
    case 'hamster':
      return '🐹';
    case 'fish':
      return '🐠';
    default:
      return '🐾';
  }
}

/**
 * گرفتن نام فارسی نوع پت
 */
function getPetTypeName(petType: string): string {
  switch (petType) {
    case 'dog':
      return 'سگ';
    case 'cat':
      return 'گربه';
    case 'dragon':
      return 'اژدها';
    case 'fox':
      return 'روباه';
    case 'bird':
      return 'پرنده';
    case 'rabbit':
      return 'خرگوش';
    case 'hamster':
      return 'همستر';
    case 'fish':
      return 'ماهی';
    default:
      return 'نامشخص';
  }
}