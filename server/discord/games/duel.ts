import { 
  ButtonInteraction, 
  MessageComponentInteraction, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder,
  Collection,
  User as DiscordUser 
} from 'discord.js';
import { storage } from '../../storage';
import { gamesMenu } from '../components/gamesMenu';

/**
 * تابع کمکی برای پاسخ به تعامل با توجه به وضعیت آن
 * @param interaction تعامل
 * @param options گزینه‌های پاسخ
 */
async function safeReply(interaction: MessageComponentInteraction, options: any) {
  try {
    if (interaction.deferred) {
      return await interaction.editReply(options);
    } else if (interaction.replied) {
      return await interaction.followUp(options);
    } else {
      return await interaction.reply(options);
    }
  } catch (error) {
    console.error("Error responding to interaction:", error);
    
    // در صورت خطا، تلاش برای ارسال پیام به کانال
    try {
      if (options.content && interaction.channelId) {
        // سعی می‌کنیم پیام را در کانال ارسال کنیم
        const channel = await interaction.client.channels.fetch(interaction.channelId);
        if (channel && 'send' in channel) {
          // فقط محتوای متنی را ارسال می‌کنیم
          // اگر پیام خصوصی است، ذکر می‌کنیم که برای چه کسی است
          const contentToSend = options.ephemeral 
            ? `${interaction.user}: ${options.content} (پیام خصوصی)`
            : options.content;
            
          return await channel.send({
            content: contentToSend,
            embeds: options.embeds,
            components: options.components
          });
        }
      }
    } catch (e) {
      console.error('Failed to send fallback message to channel:', e);
    }
    
    return null;
  }
}

// تنظیمات بازی
export const BET_AMOUNT = 50; // مقدار سکه برای شرکت در بازی
export const REWARD_AMOUNT = 80; // مقدار جایزه برای برنده
export const WEAPON_DAMAGE = {
  sword: { min: 15, max: 25 }, // شمشیر
  axe: { min: 10, max: 30 }, // تبر
  dagger: { min: 5, max: 40 }, // خنجر
  hammer: { min: 20, max: 20 } // چکش
};
export const PLAYER_HEALTH = 100; // سلامتی اولیه بازیکنان

// ذخیره‌سازی بازی‌های فعال
export interface DuelGame {
  player1: string;
  player2: string;
  health1: number;
  health2: number;
  weapon1?: string;
  weapon2?: string;
  round: number;
  channel: string;
  message: string;
  timestamp: number;
  lastAction: number;
}

// ذخیره بازی‌های فعال
const activeGames = new Collection<string, DuelGame>();

/**
 * افزودن بازی جدید به لیست بازی‌های فعال
 * @param gameId شناسه بازی
 * @param gameData اطلاعات بازی
 */
export function addActiveGame(gameId: string, gameData: DuelGame): void {
  activeGames.set(gameId, gameData);
}

/**
 * ایجاد شناسه منحصر به فرد برای بازی
 * @param player1 شناسه بازیکن اول
 * @param player2 شناسه بازیکن دوم
 * @returns شناسه بازی
 */
function createGameId(player1: string, player2: string): string {
  return `duel_${player1}_${player2}`;
}

/**
 * بررسی آیا کاربر در حال حاضر مشغول بازی است
 * @param userId شناسه کاربر
 * @returns true اگر کاربر در حال بازی باشد
 */
function isUserPlaying(userId: string): boolean {
  return Array.from(activeGames.values()).some(
    game => (game.player1 === userId || game.player2 === userId) && 
    (Date.now() - game.lastAction < 5 * 60 * 1000) // زمان غیرفعال 5 دقیقه
  );
}

/**
 * مدیریت بازی دوئل
 * @param interaction تعامل با کاربر
 * @param action عملیات مورد نظر
 * @param targetId شناسه کاربر هدف یا شناسه بازی (بسته به عملیات)
 */
export async function handleDuel(
  interaction: MessageComponentInteraction,
  action: string,
  targetId?: string
): Promise<void> {
  try {
    const user = await storage.getUserByDiscordId(interaction.user.id);
    if (!user) {
      await safeReply(interaction, {
        content: '❌ حساب کاربری شما یافت نشد! لطفا از منوی اصلی شروع کنید.',
        ephemeral: true
      });
      return;
    }

    // اطمینان از اینکه تعامل در یک سرور رخ داده است
    if (!interaction.guild) {
      await safeReply(interaction, {
        content: '❌ این بازی فقط در سرورها قابل انجام است.',
        ephemeral: true
      });
      return;
    }

    switch (action) {
      case 'match':
        // شروع بازی بین دو بازیکن (از طریق matchmaking)
        if (!targetId) {
          await safeReply(interaction, {
            content: '❌ خطا: بازیکن دوم مشخص نشده است.',
            ephemeral: true
          });
          return;
        }

        // ایجاد بازی جدید
        const gameId = createGameId(interaction.user.id, targetId);
        activeGames.set(gameId, {
          player1: interaction.user.id,
          player2: targetId,
          health1: PLAYER_HEALTH,
          health2: PLAYER_HEALTH,
          round: 1,
          channel: interaction.channelId,
          message: '',
          timestamp: Date.now(),
          lastAction: Date.now()
        });

        // کسر هزینه شرکت در بازی از هر دو بازیکن
        const player1 = user;
        const player2 = await storage.getUserByDiscordId(targetId);

        if (!player2) {
          try {
            await safeReply(interaction, {
              content: '❌ حساب کاربری بازیکن دوم یافت نشد!',
              ephemeral: true
            });
          } catch (error) {
            console.error("Error responding to interaction:", error);
          }
          activeGames.delete(gameId);
          return;
        }

        // بررسی موجودی کافی
        if (player1.wallet < BET_AMOUNT) {
          try {
            await safeReply(interaction, {
              content: `❌ موجودی کیف پول شما کافی نیست! شما به ${BET_AMOUNT} Ccoin نیاز دارید.`,
              ephemeral: true
            });
          } catch (error) {
            console.error("Error responding to interaction:", error);
          }
          activeGames.delete(gameId);
          return;
        }

        if (player2.wallet < BET_AMOUNT) {
          try {
            await safeReply(interaction, {
              content: `❌ موجودی کیف پول بازیکن دوم کافی نیست!`,
              ephemeral: true
            });
          } catch (error) {
            console.error("Error responding to interaction:", error);
          }
          activeGames.delete(gameId);
          return;
        }

        // کسر هزینه از بازیکنان
        await storage.addToWallet(player1.id, -BET_AMOUNT, 'game_bet', { gameType: 'duel' });
        await storage.addToWallet(player2.id, -BET_AMOUNT, 'game_bet', { gameType: 'duel' });

        // ایجاد رابط بازی
        const gameEmbed = new EmbedBuilder()
          .setColor('#F1C40F')
          .setTitle('⚔️ بازی دوئل')
          .setDescription(`بازی بین <@${interaction.user.id}> و <@${targetId}> شروع شد!`)
          .addFields(
            { name: '📊 وضعیت', value: 'انتخاب اسلحه توسط بازیکنان', inline: false },
            { name: `❤️ <@${interaction.user.id}>`, value: `${PLAYER_HEALTH} / ${PLAYER_HEALTH}`, inline: true },
            { name: `❤️ <@${targetId}>`, value: `${PLAYER_HEALTH} / ${PLAYER_HEALTH}`, inline: true },
            { name: '🔄 دور', value: '1', inline: false }
          )
          .setFooter({ text: 'هر بازیکن باید یک اسلحه انتخاب کند!' })
          .setTimestamp();

        // دکمه‌های انتخاب اسلحه
        const weaponButtonsRow = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(`game:duel:weapon:${gameId}:sword`)
              .setLabel('🗡️ شمشیر')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId(`game:duel:weapon:${gameId}:axe`)
              .setLabel('🪓 تبر')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId(`game:duel:weapon:${gameId}:dagger`)
              .setLabel('🔪 خنجر')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId(`game:duel:weapon:${gameId}:hammer`)
              .setLabel('🔨 چکش')
              .setStyle(ButtonStyle.Primary)
          );

        // ارسال پیام با تگ هر دو بازیکن
        const reply = await safeReply(interaction, {
          content: `<@${interaction.user.id}> <@${targetId}>`,
          embeds: [gameEmbed],
          components: [weaponButtonsRow],
          fetchReply: true
        });

        // ذخیره شناسه پیام برای بروزرسانی آن در ادامه
        const game = activeGames.get(gameId);
        if (game && reply) {
          // بررسی نوع پاسخ و استخراج شناسه پیام
          let messageId = '';
          if ('id' in reply) {
            messageId = reply.id;
          } else if (reply instanceof Object) {
            // سعی در استخراج شناسه پیام از شیء با متدهای مختلف
            const message = reply as any;
            if (message.id) {
              messageId = message.id;
            }
          }
          
          game.message = messageId;
          activeGames.set(gameId, game);
        }
        break;

      case 'weapon':
        // انتخاب اسلحه
        if (!targetId) {
          await safeReply(interaction, {
            content: '❌ خطا: شناسه بازی نامعتبر است.',
            ephemeral: true
          });
          return;
        }

        // پارس شناسه بازی و اسلحه
        const [fullGameId, weapon] = targetId.split(':');
        const duelGame = activeGames.get(fullGameId);

        if (!duelGame) {
          await safeReply(interaction, {
            content: '❌ بازی یافت نشد یا به پایان رسیده است.',
            ephemeral: true
          });
          return;
        }

        // بررسی آیا کاربر از بازیکنان این بازی است
        const isPlayer1 = interaction.user.id === duelGame.player1;
        const isPlayer2 = interaction.user.id === duelGame.player2;

        if (!isPlayer1 && !isPlayer2) {
          await safeReply(interaction, {
            content: '❌ شما بازیکن این بازی نیستید!',
            ephemeral: true
          });
          return;
        }

        // ثبت انتخاب اسلحه
        if (isPlayer1 && !duelGame.weapon1) {
          duelGame.weapon1 = weapon;
          await safeReply(interaction, {
            content: `✅ شما ${getWeaponName(weapon)} را انتخاب کردید. منتظر بازیکن دیگر باشید...`,
            ephemeral: true
          });
        } else if (isPlayer2 && !duelGame.weapon2) {
          duelGame.weapon2 = weapon;
          await safeReply(interaction, {
            content: `✅ شما ${getWeaponName(weapon)} را انتخاب کردید. منتظر بازیکن دیگر باشید...`,
            ephemeral: true
          });
        } else {
          await safeReply(interaction, {
            content: '❌ شما قبلاً اسلحه خود را انتخاب کرده‌اید!',
            ephemeral: true
          });
          return;
        }

        activeGames.set(fullGameId, duelGame);

        // اگر هر دو بازیکن اسلحه انتخاب کردند، شروع دور بازی
        if (duelGame.weapon1 && duelGame.weapon2) {
          await startDuelRound(interaction, fullGameId);
        }
        break;

      case 'attack':
        // حمله در دور بازی
        if (!targetId) {
          await safeReply(interaction, {
            content: '❌ خطا: شناسه بازی نامعتبر است.',
            ephemeral: true
          });
          return;
        }

        const attackGame = activeGames.get(targetId);
        if (!attackGame) {
          await safeReply(interaction, {
            content: '❌ بازی یافت نشد یا به پایان رسیده است.',
            ephemeral: true
          });
          return;
        }

        // بررسی آیا کاربر نوبتش است
        const playerTurn = attackGame.round % 2 === 1 ? attackGame.player1 : attackGame.player2;
        if (interaction.user.id !== playerTurn) {
          await safeReply(interaction, {
            content: '❌ نوبت شما نیست!',
            ephemeral: true
          });
          return;
        }

        // محاسبه آسیب
        const attackerWeapon = playerTurn === attackGame.player1 ? attackGame.weapon1 : attackGame.weapon2;
        if (!attackerWeapon) {
          await safeReply(interaction, {
            content: '❌ شما هنوز اسلحه انتخاب نکرده‌اید!',
            ephemeral: true
          });
          return;
        }

        const damage = calculateDamage(attackerWeapon);
        if (playerTurn === attackGame.player1) {
          attackGame.health2 = Math.max(0, attackGame.health2 - damage);
        } else {
          attackGame.health1 = Math.max(0, attackGame.health1 - damage);
        }

        // افزایش شماره دور
        attackGame.round++;
        attackGame.lastAction = Date.now();
        activeGames.set(targetId, attackGame);

        // نمایش پیام حمله
        await safeReply(interaction, {
          content: `⚔️ شما با ${getWeaponName(attackerWeapon)} حمله کردید و ${damage} آسیب وارد کردید!`,
          ephemeral: true
        });

        // بررسی پایان بازی یا ادامه دور بعدی
        if (attackGame.health1 <= 0 || attackGame.health2 <= 0) {
          await endDuelGame(interaction, targetId);
        } else {
          await updateDuelGame(interaction, targetId);
        }
        break;

      default:
        await safeReply(interaction, {
          content: '❌ عملیات نامعتبر!',
          ephemeral: true
        });
    }
  } catch (error) {
    console.error('Error in duel game:', error);
    await safeReply(interaction, {
      content: '❌ خطایی در اجرای بازی رخ داد! لطفاً دوباره تلاش کنید.',
      ephemeral: true
    });
  }
}

/**
 * محاسبه میزان آسیب بر اساس اسلحه
 * @param weapon نوع اسلحه
 * @returns میزان آسیب
 */
function calculateDamage(weapon: string): number {
  const weaponStats = WEAPON_DAMAGE[weapon as keyof typeof WEAPON_DAMAGE];
  if (!weaponStats) return 10; // مقدار پیش‌فرض اگر اسلحه نامعتبر باشد
  
  const { min, max } = weaponStats;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * دریافت نام نمایشی اسلحه
 * @param weapon کد اسلحه
 * @returns نام نمایشی
 */
function getWeaponName(weapon: string): string {
  switch (weapon) {
    case 'sword':
      return '🗡️ شمشیر';
    case 'axe':
      return '🪓 تبر';
    case 'dagger':
      return '🔪 خنجر';
    case 'hammer':
      return '🔨 چکش';
    default:
      return weapon;
  }
}

/**
 * شروع دور بازی دوئل
 * @param interaction تعامل با کاربر
 * @param gameId شناسه بازی
 */
async function startDuelRound(
  interaction: MessageComponentInteraction,
  gameId: string
): Promise<void> {
  try {
    const game = activeGames.get(gameId);
    if (!game) return;

    // بازیکنی که شروع می‌کند (دور اول: بازیکن 1)
    const firstPlayer = game.player1;

    // بروزرسانی امبد با وضعیت جدید
    const updatedEmbed = new EmbedBuilder()
      .setColor('#F1C40F')
      .setTitle('⚔️ بازی دوئل')
      .setDescription(`بازی بین <@${game.player1}> و <@${game.player2}> در جریان است!`)
      .addFields(
        { name: '📊 وضعیت', value: `نوبت <@${firstPlayer}> برای حمله`, inline: false },
        { name: `❤️ <@${game.player1}>`, value: `${game.health1} / ${PLAYER_HEALTH}`, inline: true },
        { name: `❤️ <@${game.player2}>`, value: `${game.health2} / ${PLAYER_HEALTH}`, inline: true },
        { name: '🔄 دور', value: `${game.round}`, inline: false },
        { name: `🗡️ <@${game.player1}>`, value: `${getWeaponName(game.weapon1 || 'نامشخص')}`, inline: true },
        { name: `🗡️ <@${game.player2}>`, value: `${getWeaponName(game.weapon2 || 'نامشخص')}`, inline: true }
      )
      .setFooter({ text: 'نوبت به نوبت حمله کنید و سلامتی حریف را کاهش دهید!' })
      .setTimestamp();

    // دکمه حمله برای بازیکنان
    const attackButtonRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`game:duel:attack:${gameId}`)
          .setLabel('⚔️ حمله')
          .setStyle(ButtonStyle.Danger)
      );

    // بروزرسانی پیام بازی
    if (interaction.message) {
      await interaction.message.edit({
        content: `<@${game.player1}> <@${game.player2}>`,
        embeds: [updatedEmbed],
        components: [attackButtonRow]
      });
    }
  } catch (error) {
    console.error('Error starting duel round:', error);
  }
}

/**
 * بروزرسانی وضعیت بازی دوئل
 * @param interaction تعامل با کاربر
 * @param gameId شناسه بازی
 */
async function updateDuelGame(
  interaction: MessageComponentInteraction,
  gameId: string
): Promise<void> {
  try {
    const game = activeGames.get(gameId);
    if (!game) return;

    // تعیین نوبت بعدی
    const nextPlayer = game.round % 2 === 1 ? game.player1 : game.player2;

    // بروزرسانی امبد با وضعیت جدید
    const updatedEmbed = new EmbedBuilder()
      .setColor('#F1C40F')
      .setTitle('⚔️ بازی دوئل')
      .setDescription(`بازی بین <@${game.player1}> و <@${game.player2}> در جریان است!`)
      .addFields(
        { name: '📊 وضعیت', value: `نوبت <@${nextPlayer}> برای حمله`, inline: false },
        { name: `❤️ <@${game.player1}>`, value: `${game.health1} / ${PLAYER_HEALTH}`, inline: true },
        { name: `❤️ <@${game.player2}>`, value: `${game.health2} / ${PLAYER_HEALTH}`, inline: true },
        { name: '🔄 دور', value: `${game.round}`, inline: false },
        { name: `🗡️ <@${game.player1}>`, value: `${getWeaponName(game.weapon1 || 'نامشخص')}`, inline: true },
        { name: `🗡️ <@${game.player2}>`, value: `${getWeaponName(game.weapon2 || 'نامشخص')}`, inline: true }
      )
      .setFooter({ text: 'نوبت به نوبت حمله کنید و سلامتی حریف را کاهش دهید!' })
      .setTimestamp();

    // دکمه حمله برای بازیکنان
    const attackButtonRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`game:duel:attack:${gameId}`)
          .setLabel('⚔️ حمله')
          .setStyle(ButtonStyle.Danger)
      );

    // بروزرسانی پیام بازی
    if (interaction.message) {
      await interaction.message.edit({
        content: `<@${game.player1}> <@${game.player2}>`,
        embeds: [updatedEmbed],
        components: [attackButtonRow]
      });
    }
  } catch (error) {
    console.error('Error updating duel game:', error);
  }
}

/**
 * پایان بازی دوئل و تعیین برنده
 * @param interaction تعامل با کاربر
 * @param gameId شناسه بازی
 */
async function endDuelGame(
  interaction: MessageComponentInteraction,
  gameId: string
): Promise<void> {
  try {
    const game = activeGames.get(gameId);
    if (!game) return;

    // تعیین برنده و بازنده
    let winner: string;
    let loser: string;

    if (game.health2 <= 0) {
      winner = game.player1;
      loser = game.player2;
    } else {
      winner = game.player2;
      loser = game.player1;
    }

    // جایزه برنده
    const totalReward = BET_AMOUNT * 2; // مجموع شرط هر دو بازیکن

    // افزودن جایزه به کیف پول برنده
    const winningUser = await storage.getUserByDiscordId(winner);
    const losingUser = await storage.getUserByDiscordId(loser);

    if (winningUser) {
      await storage.addToWallet(winningUser.id, totalReward, 'game_win', { gameType: 'duel' });
      await storage.recordGame(winningUser.id, 'duel', BET_AMOUNT, true, totalReward - BET_AMOUNT);
    }

    if (losingUser) {
      await storage.recordGame(losingUser.id, 'duel', BET_AMOUNT, false, 0);
    }

    // بروزرسانی امبد با نتیجه
    const finalEmbed = new EmbedBuilder()
      .setColor('#2ECC71')
      .setTitle('⚔️ پایان بازی دوئل')
      .setDescription(`بازی به پایان رسید! <@${winner}> برنده شد!`)
      .addFields(
        { name: '📊 نتیجه', value: `<@${winner}> برنده ${totalReward} Ccoin شد!`, inline: false },
        { name: `❤️ <@${game.player1}>`, value: `${game.health1} / ${PLAYER_HEALTH}`, inline: true },
        { name: `❤️ <@${game.player2}>`, value: `${game.health2} / ${PLAYER_HEALTH}`, inline: true },
        { name: '🔄 دور', value: `${game.round}`, inline: false }
      )
      .setFooter({ text: 'برای بازی جدید، از منوی بازی‌ها استفاده کنید' })
      .setTimestamp();

    // دکمه برای بازی مجدد
    const endButtonsRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('competitive_games')
          .setLabel('🎮 بازگشت به منوی بازی‌ها')
          .setStyle(ButtonStyle.Primary)
      );

    // بروزرسانی پیام بازی
    if (interaction.message) {
      await interaction.message.edit({
        content: `<@${game.player1}> <@${game.player2}>`,
        embeds: [finalEmbed],
        components: [endButtonsRow]
      });
    }

    // حذف بازی از لیست بازی‌های فعال
    setTimeout(() => {
      activeGames.delete(gameId);
    }, 60000); // پاکسازی بعد از یک دقیقه

  } catch (error) {
    console.error('Error ending duel game:', error);
  }
}

/**
 * ایجاد مستقیم یک بازی دوئل بدون نیاز به interaction
 * @param player1Id شناسه بازیکن اول
 * @param player2Id شناسه بازیکن دوم
 * @param channelId شناسه کانال
 */
export async function createDuelGameDirectly(
  player1Id: string,
  player2Id: string,
  channelId: string
): Promise<string | null> {
  try {
    // بررسی کاربران در دیتابیس
    const player1 = await storage.getUserByDiscordId(player1Id);
    const player2 = await storage.getUserByDiscordId(player2Id);
    
    if (!player1 || !player2) {
      console.error('یکی از بازیکنان در دیتابیس پیدا نشد');
      return null;
    }
    
    // بررسی موجودی کافی
    if (player1.wallet < BET_AMOUNT || player2.wallet < BET_AMOUNT) {
      console.error('یکی از بازیکنان موجودی کافی ندارد');
      return null;
    }
    
    // ایجاد شناسه بازی
    const gameId = createGameId(player1Id, player2Id);
    
    // اضافه کردن بازی به لیست بازی‌های فعال
    activeGames.set(gameId, {
      player1: player1Id,
      player2: player2Id,
      health1: PLAYER_HEALTH,
      health2: PLAYER_HEALTH,
      round: 1,
      channel: channelId,
      message: '',
      timestamp: Date.now(),
      lastAction: Date.now()
    });
    
    // کسر هزینه از بازیکنان
    await storage.addToWallet(player1.id, -BET_AMOUNT, 'game_bet', { gameType: 'duel' });
    await storage.addToWallet(player2.id, -BET_AMOUNT, 'game_bet', { gameType: 'duel' });
    
    // سعی می‌کنیم پیام را در کانال ارسال کنیم
    const client = (await import('../client')).client;
    const channel = await client.channels.fetch(channelId);
    
    if (channel && 'send' in channel) {
      // ایجاد رابط بازی
      const gameEmbed = new EmbedBuilder()
        .setColor('#F1C40F')
        .setTitle('⚔️ بازی دوئل')
        .setDescription(`بازی بین <@${player1Id}> و <@${player2Id}> شروع شد!`)
        .addFields(
          { name: '📊 وضعیت', value: 'انتخاب اسلحه توسط بازیکنان', inline: false },
          { name: `❤️ <@${player1Id}>`, value: `${PLAYER_HEALTH} / ${PLAYER_HEALTH}`, inline: true },
          { name: `❤️ <@${player2Id}>`, value: `${PLAYER_HEALTH} / ${PLAYER_HEALTH}`, inline: true },
          { name: '🔄 دور', value: '1', inline: false }
        )
        .setFooter({ text: 'هر بازیکن باید یک اسلحه انتخاب کند!' })
        .setTimestamp();

      // دکمه‌های انتخاب اسلحه
      const weaponButtonsRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`game:duel:weapon:${gameId}:sword`)
            .setLabel('🗡️ شمشیر')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`game:duel:weapon:${gameId}:axe`)
            .setLabel('🪓 تبر')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`game:duel:weapon:${gameId}:dagger`)
            .setLabel('🔪 خنجر')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`game:duel:weapon:${gameId}:hammer`)
            .setLabel('🔨 چکش')
            .setStyle(ButtonStyle.Primary)
        );
        
      // ارسال پیام
      const message = await channel.send({
        content: `<@${player1Id}> <@${player2Id}> لطفاً یک اسلحه انتخاب کنید!`,
        embeds: [gameEmbed],
        components: [weaponButtonsRow]
      });
      
      // ذخیره شناسه پیام
      const game = activeGames.get(gameId);
      if (game && message) {
        game.message = message.id;
        activeGames.set(gameId, game);
      }
      
      return gameId;
    }
    
    return null;
  } catch (error) {
    console.error('Error in createDuelGameDirectly:', error);
    return null;
  }
}

/**
 * تمیز کردن بازی‌های قدیمی
 * این تابع بازی‌های غیرفعال را از حافظه حذف می‌کند
 */
export function cleanupOldGames(): void {
  const currentTime = Date.now();
  const timeLimit = 30 * 60 * 1000; // 30 دقیقه

  activeGames.forEach((game, gameId) => {
    if (currentTime - game.lastAction > timeLimit) {
      activeGames.delete(gameId);
    }
  });
}