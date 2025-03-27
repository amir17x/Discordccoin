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

// تنظیمات بازی
const BET_AMOUNT = 50; // مقدار سکه برای شرکت در بازی
const REWARD_AMOUNT = 80; // مقدار جایزه برای برنده
const WEAPON_DAMAGE = {
  sword: { min: 15, max: 25 }, // شمشیر
  axe: { min: 10, max: 30 }, // تبر
  dagger: { min: 5, max: 40 }, // خنجر
  hammer: { min: 20, max: 20 } // چکش
};
const PLAYER_HEALTH = 100; // سلامتی اولیه بازیکنان

// ذخیره‌سازی بازی‌های فعال
interface DuelGame {
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
 * ایجاد شناسه منحصر به فرد برای بازی
 * @param player1 شناسه بازیکن اول
 * @param player2 شناسه بازیکن دوم
 * @returns شناسه بازی
 */
function createGameId(player1: string, player2: string): string {
  return `duel_${player1}_${player2}`;
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
      await interaction.reply({
        content: '❌ حساب کاربری شما یافت نشد! لطفا از منوی اصلی شروع کنید.',
        ephemeral: true
      });
      return;
    }

    // اطمینان از اینکه تعامل در یک سرور رخ داده است
    if (!interaction.guild) {
      await interaction.reply({
        content: '❌ این بازی فقط در سرورها قابل انجام است.',
        ephemeral: true
      });
      return;
    }

    switch (action) {
      case 'match':
        // شروع بازی بین دو بازیکن (از طریق matchmaking)
        if (!targetId) {
          await interaction.reply({
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
          await interaction.reply({
            content: '❌ حساب کاربری بازیکن دوم یافت نشد!',
            ephemeral: true
          });
          activeGames.delete(gameId);
          return;
        }

        // بررسی موجودی کافی
        if (player1.wallet < BET_AMOUNT) {
          await interaction.reply({
            content: `❌ موجودی کیف پول شما کافی نیست! شما به ${BET_AMOUNT} Ccoin نیاز دارید.`,
            ephemeral: true
          });
          activeGames.delete(gameId);
          return;
        }

        if (player2.wallet < BET_AMOUNT) {
          await interaction.reply({
            content: `❌ موجودی کیف پول بازیکن دوم کافی نیست!`,
            ephemeral: true
          });
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
        const reply = await interaction.reply({
          content: `<@${interaction.user.id}> <@${targetId}>`,
          embeds: [gameEmbed],
          components: [weaponButtonsRow],
          fetchReply: true
        });

        // ذخیره شناسه پیام برای بروزرسانی آن در ادامه
        const game = activeGames.get(gameId);
        if (game) {
          game.message = reply.id;
          activeGames.set(gameId, game);
        }
        break;

      case 'weapon':
        // انتخاب اسلحه
        if (!targetId) {
          await interaction.reply({
            content: '❌ خطا: شناسه بازی نامعتبر است.',
            ephemeral: true
          });
          return;
        }

        // پارس شناسه بازی و اسلحه
        const [fullGameId, weapon] = targetId.split(':');
        const duelGame = activeGames.get(fullGameId);

        if (!duelGame) {
          await interaction.reply({
            content: '❌ بازی یافت نشد یا به پایان رسیده است.',
            ephemeral: true
          });
          return;
        }

        // بررسی آیا کاربر از بازیکنان این بازی است
        const isPlayer1 = interaction.user.id === duelGame.player1;
        const isPlayer2 = interaction.user.id === duelGame.player2;

        if (!isPlayer1 && !isPlayer2) {
          await interaction.reply({
            content: '❌ شما بازیکن این بازی نیستید!',
            ephemeral: true
          });
          return;
        }

        // ثبت انتخاب اسلحه
        if (isPlayer1 && !duelGame.weapon1) {
          duelGame.weapon1 = weapon;
          await interaction.reply({
            content: `✅ شما ${getWeaponName(weapon)} را انتخاب کردید. منتظر بازیکن دیگر باشید...`,
            ephemeral: true
          });
        } else if (isPlayer2 && !duelGame.weapon2) {
          duelGame.weapon2 = weapon;
          await interaction.reply({
            content: `✅ شما ${getWeaponName(weapon)} را انتخاب کردید. منتظر بازیکن دیگر باشید...`,
            ephemeral: true
          });
        } else {
          await interaction.reply({
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
          await interaction.reply({
            content: '❌ خطا: شناسه بازی نامعتبر است.',
            ephemeral: true
          });
          return;
        }

        const attackGame = activeGames.get(targetId);
        if (!attackGame) {
          await interaction.reply({
            content: '❌ بازی یافت نشد یا به پایان رسیده است.',
            ephemeral: true
          });
          return;
        }

        // بررسی آیا کاربر نوبتش است
        const playerTurn = attackGame.round % 2 === 1 ? attackGame.player1 : attackGame.player2;
        if (interaction.user.id !== playerTurn) {
          await interaction.reply({
            content: '❌ نوبت شما نیست!',
            ephemeral: true
          });
          return;
        }

        // محاسبه آسیب
        const attackerWeapon = playerTurn === attackGame.player1 ? attackGame.weapon1 : attackGame.weapon2;
        if (!attackerWeapon) {
          await interaction.reply({
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
        await interaction.reply({
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
        await interaction.reply({
          content: '❌ عملیات نامعتبر!',
          ephemeral: true
        });
    }
  } catch (error) {
    console.error('Error in duel game:', error);
    await interaction.reply({
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
    await interaction.message.edit({
      content: `<@${game.player1}> <@${game.player2}>`,
      embeds: [updatedEmbed],
      components: [attackButtonRow]
    });
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
    await interaction.message.edit({
      content: `<@${game.player1}> <@${game.player2}>`,
      embeds: [updatedEmbed],
      components: [attackButtonRow]
    });
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
    await interaction.message.edit({
      content: `<@${game.player1}> <@${game.player2}>`,
      embeds: [finalEmbed],
      components: [endButtonsRow]
    });

    // حذف بازی از لیست بازی‌های فعال
    activeGames.delete(gameId);
  } catch (error) {
    console.error('Error ending duel game:', error);
  }
}

// تنظیم تایمر برای بررسی و حذف بازی‌های غیرفعال
setInterval(() => {
  const now = Date.now();
  const GAME_TIMEOUT = 300000; // 5 دقیقه
  
  activeGames.forEach((game, gameId) => {
    // اگر بیش از 5 دقیقه از آخرین اقدام گذشته باشد
    if (now - game.lastAction > GAME_TIMEOUT) {
      activeGames.delete(gameId);
    }
  });
}, 60000); // بررسی هر یک دقیقه