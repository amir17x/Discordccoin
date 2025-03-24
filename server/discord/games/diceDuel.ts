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

// Game constants
const BET_AMOUNT = 50;
const REWARD_AMOUNT = 80;

// Store active game invites
interface DiceGameInvite {
  inviterId: string;
  targetId: string;
  channel: string;
  message: string;
  timestamp: number;
}

interface DiceGame {
  player1: string;
  player2: string;
  p1Roll?: number;
  p2Roll?: number;
  channel: string;
  message: string;
  timestamp: number;
}

// Maps to track invites and games
const activeInvites = new Collection<string, DiceGameInvite>();
const activeGames = new Collection<string, DiceGame>();

// Function to create a unique game ID
function createGameId(player1: string, player2: string): string {
  return `dice_duel_${player1}_${player2}`;
}

/**
 * پیاده‌سازی بازی تاس دو نفره
 * @param interaction تعامل دکمه
 * @param action عملیات مورد نظر (start, invite, accept, reject, roll)
 * @param targetId شناسه کاربر هدف (برای دعوت به بازی)
 */
export async function handleDiceDuel(
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

    // Ensure the interaction is in a server
    if (!interaction.guild) {
      await interaction.reply({
        content: '❌ این بازی فقط در سرورها قابل انجام است.',
        ephemeral: true
      });
      return;
    }

    switch (action) {
      case 'start':
        // Show the selection menu for players
        const memberOptions = new ActionRowBuilder<ButtonBuilder>();
        const onlineMembers = interaction.guild.members.cache
          .filter(member => 
            !member.user.bot && 
            member.user.id !== interaction.user.id && 
            member.presence?.status !== 'offline'
          )
          .first(4); // Show maximum 4 options

        if (onlineMembers.length === 0) {
          await interaction.reply({
            content: '❌ هیچ کاربر آنلاینی برای بازی یافت نشد!',
            ephemeral: true
          });
          return;
        }

        for (const member of onlineMembers) {
          memberOptions.addComponents(
            new ButtonBuilder()
              .setCustomId(`game:dice_duel:invite:${member.id}`)
              .setLabel(member.displayName)
              .setStyle(ButtonStyle.Primary)
          );
        }

        const backButton = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('competitive_games')
              .setLabel('🔙 بازگشت')
              .setStyle(ButtonStyle.Secondary)
          );

        await interaction.reply({
          content: `🎲 برای بازی تاس دو نفره، حریف خود را انتخاب کنید. هزینه شرکت در بازی: ${BET_AMOUNT} Ccoin`,
          components: [memberOptions, backButton],
          ephemeral: true
        });
        break;

      case 'invite':
        if (!targetId) {
          await interaction.reply({
            content: '❌ خطا: کاربر هدف مشخص نشده است.',
            ephemeral: true
          });
          return;
        }

        // Check if player has enough money
        if (user.wallet < BET_AMOUNT) {
          await interaction.reply({
            content: `❌ موجودی کیف پول شما کافی نیست! شما به ${BET_AMOUNT} Ccoin نیاز دارید.`,
            ephemeral: true
          });
          return;
        }

        // Create the invitation
        const targetUser = await interaction.guild.members.fetch(targetId);
        if (!targetUser) {
          await interaction.reply({
            content: '❌ کاربر مورد نظر یافت نشد!',
            ephemeral: true
          });
          return;
        }

        const inviteEmbed = new EmbedBuilder()
          .setColor('#F1C40F')
          .setTitle('🎲 دعوت به بازی تاس دو نفره')
          .setDescription(`${interaction.user} شما را به بازی تاس دو نفره دعوت کرده است!`)
          .addFields(
            { name: '💰 هزینه شرکت', value: `${BET_AMOUNT} Ccoin`, inline: true },
            { name: '🏆 جایزه برنده', value: `${REWARD_AMOUNT} Ccoin`, inline: true },
            { name: '⏱️ مهلت پاسخ', value: '60 ثانیه', inline: true }
          )
          .setFooter({ text: 'بازی تاس دو نفره - هر کسی که عدد بالاتری بیاره، برنده است!' })
          .setTimestamp();

        const buttonsRow = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(`game:dice_duel:accept:${interaction.user.id}`)
              .setLabel('✅ قبول دعوت')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId(`game:dice_duel:reject:${interaction.user.id}`)
              .setLabel('❌ رد دعوت')
              .setStyle(ButtonStyle.Danger)
          );

        const inviteResponse = await interaction.reply({
          content: `${targetUser}`,
          embeds: [inviteEmbed],
          components: [buttonsRow],
          fetchReply: true
        });

        // Store the invitation
        const inviteId = createGameId(interaction.user.id, targetId);
        activeInvites.set(inviteId, {
          inviterId: interaction.user.id,
          targetId: targetId,
          channel: interaction.channelId,
          message: inviteResponse.id,
          timestamp: Date.now()
        });

        // Auto-expire invite after 60 seconds
        setTimeout(async () => {
          const invite = activeInvites.get(inviteId);
          if (invite) {
            activeInvites.delete(inviteId);
            
            try {
              const channel = await interaction.client.channels.fetch(invite.channel);
              if (channel && channel.isTextBased()) {
                const message = await channel.messages.fetch(invite.message);
                if (message) {
                  const expiredEmbed = EmbedBuilder.from(message.embeds[0])
                    .setColor('#808080')
                    .setTitle('🎲 دعوت منقضی شده')
                    .setDescription('این دعوت به بازی منقضی شده است.');
                  
                  await message.edit({
                    embeds: [expiredEmbed],
                    components: []
                  });
                }
              }
            } catch (error) {
              console.error('Error removing expired invite:', error);
            }
          }
        }, 60000);
        
        break;

      case 'accept':
        if (!targetId) {
          await interaction.reply({
            content: '❌ خطا: کاربر دعوت‌کننده مشخص نشده است.',
            ephemeral: true
          });
          return;
        }

        const acceptingUser = await storage.getUserByDiscordId(interaction.user.id);
        if (!acceptingUser) {
          await interaction.reply({
            content: '❌ شما باید یک حساب کاربری داشته باشید. لطفا با /menu شروع کنید.',
            ephemeral: true
          });
          return;
        }

        // Check if accepting player has enough money
        if (acceptingUser.wallet < BET_AMOUNT) {
          await interaction.reply({
            content: `❌ موجودی کیف پول شما کافی نیست! شما به ${BET_AMOUNT} Ccoin نیاز دارید.`,
            ephemeral: true
          });
          return;
        }

        // Find the invite
        const inviteIdToAccept = createGameId(targetId, interaction.user.id);
        const invite = activeInvites.get(inviteIdToAccept);
        
        if (!invite) {
          await interaction.reply({
            content: '❌ دعوتی برای پذیرش یافت نشد یا منقضی شده است.',
            ephemeral: true
          });
          return;
        }

        // Remove the invite
        activeInvites.delete(inviteIdToAccept);

        // Create the game
        const gameId = createGameId(targetId, interaction.user.id);
        activeGames.set(gameId, {
          player1: targetId,
          player2: interaction.user.id,
          channel: interaction.channelId,
          message: interaction.message.id,
          timestamp: Date.now()
        });

        // Deduct bet amount from both players
        const initiatingUser = await storage.getUserByDiscordId(targetId);
        if (!initiatingUser || initiatingUser.wallet < BET_AMOUNT) {
          // Refund the accepting player if the initiator can't pay
          await interaction.reply({
            content: '❌ دعوت‌کننده موجودی کافی ندارد. بازی لغو شد.',
            ephemeral: true
          });
          return;
        }

        // Deduct the bet amounts
        await storage.addToWallet(initiatingUser.id, -BET_AMOUNT, 'game_bet', { gameType: 'dice_duel' });
        await storage.addToWallet(acceptingUser.id, -BET_AMOUNT, 'game_bet', { gameType: 'dice_duel' });

        // Create the game interface
        const gameEmbed = new EmbedBuilder()
          .setColor('#F1C40F')
          .setTitle('🎲 بازی تاس دو نفره')
          .setDescription(`بازی بین <@${targetId}> و ${interaction.user} شروع شد!`)
          .addFields(
            { name: '📊 وضعیت', value: 'در انتظار پرتاب تاس توسط هر دو بازیکن', inline: false },
            { name: `🎲 <@${targetId}>`, value: 'هنوز پرتاب نکرده', inline: true },
            { name: `🎲 ${interaction.user}`, value: 'هنوز پرتاب نکرده', inline: true }
          )
          .setFooter({ text: 'هر بازیکن یک بار تاس میندازه و عدد بالاتر برنده است!' })
          .setTimestamp();

        const rollButtonsRow = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(`game:dice_duel:roll:${gameId}`)
              .setLabel('🎲 پرتاب تاس')
              .setStyle(ButtonStyle.Primary)
          );

        await interaction.update({
          content: `<@${targetId}> ${interaction.user}`,
          embeds: [gameEmbed],
          components: [rollButtonsRow]
        });
        break;

      case 'reject':
        if (!targetId) {
          await interaction.reply({
            content: '❌ خطا: کاربر دعوت‌کننده مشخص نشده است.',
            ephemeral: true
          });
          return;
        }

        // Find the invite
        const inviteIdToReject = createGameId(targetId, interaction.user.id);
        const inviteToReject = activeInvites.get(inviteIdToReject);
        
        if (!inviteToReject) {
          await interaction.reply({
            content: '❌ دعوتی برای رد کردن یافت نشد یا منقضی شده است.',
            ephemeral: true
          });
          return;
        }

        // Remove the invite
        activeInvites.delete(inviteIdToReject);

        // Update the message
        const rejectedEmbed = EmbedBuilder.from(interaction.message.embeds[0])
          .setColor('#E74C3C')
          .setTitle('🎲 دعوت رد شد')
          .setDescription(`${interaction.user} دعوت به بازی را رد کرد.`);

        await interaction.update({
          embeds: [rejectedEmbed],
          components: []
        });
        break;

      case 'roll':
        // This is the game ID format: dice_duel_player1Id_player2Id
        const fullGameId = targetId; // This is actually the gameId in this context
        if (!fullGameId) {
          await interaction.reply({
            content: '❌ خطا: شناسه بازی نامعتبر است.',
            ephemeral: true
          });
          return;
        }

        const game = activeGames.get(fullGameId);
        if (!game) {
          await interaction.reply({
            content: '❌ بازی یافت نشد یا به پایان رسیده است.',
            ephemeral: true
          });
          return;
        }

        // Check if the user is a player in this game
        if (game.player1 !== interaction.user.id && game.player2 !== interaction.user.id) {
          await interaction.reply({
            content: '❌ شما در این بازی شرکت نکرده‌اید.',
            ephemeral: true
          });
          return;
        }

        // Check if player has already rolled
        const isPlayer1 = game.player1 === interaction.user.id;
        if ((isPlayer1 && game.p1Roll !== undefined) || (!isPlayer1 && game.p2Roll !== undefined)) {
          await interaction.reply({
            content: '❌ شما قبلاً تاس انداخته‌اید!',
            ephemeral: true
          });
          return;
        }

        // Roll the dice (1-6)
        const roll = Math.floor(Math.random() * 6) + 1;
        
        // Update the game state
        if (isPlayer1) {
          game.p1Roll = roll;
        } else {
          game.p2Roll = roll;
        }

        // Update the UI
        const updatedEmbed = new EmbedBuilder()
          .setColor('#F1C40F')
          .setTitle('🎲 بازی تاس دو نفره')
          .setDescription(`بازی بین <@${game.player1}> و <@${game.player2}> در جریان است!`)
          .setFooter({ text: 'هر بازیکن یک بار تاس میندازه و عدد بالاتر برنده است!' })
          .setTimestamp();

        // Update fields based on who has rolled
        const player1Status = game.p1Roll !== undefined 
          ? `عدد ${game.p1Roll} 🎲` 
          : 'هنوز پرتاب نکرده';
        
        const player2Status = game.p2Roll !== undefined 
          ? `عدد ${game.p2Roll} 🎲` 
          : 'هنوز پرتاب نکرده';

        updatedEmbed.addFields(
          { name: '📊 وضعیت', value: 'در انتظار پرتاب تاس توسط هر دو بازیکن', inline: false },
          { name: `🎲 <@${game.player1}>`, value: player1Status, inline: true },
          { name: `🎲 <@${game.player2}>`, value: player2Status, inline: true }
        );

        // If both players have rolled, determine the winner
        if (game.p1Roll !== undefined && game.p2Roll !== undefined) {
          let winner: string;
          let loser: string;
          
          if (game.p1Roll > game.p2Roll) {
            winner = game.player1;
            loser = game.player2;
          } else if (game.p2Roll > game.p1Roll) {
            winner = game.player2;
            loser = game.player1;
          } else {
            // It's a tie!
            updatedEmbed.setColor('#808080')
              .setTitle('🎲 تساوی در بازی تاس')
              .setDescription(`بازی بین <@${game.player1}> و <@${game.player2}> با تساوی به پایان رسید!`)
              .spliceFields(0, 1, { name: '📊 نتیجه', value: '**تساوی!** هر دو بازیکن مقدار مساوی آوردند. شرط‌ها برگردانده می‌شود.', inline: false });

            // Return bets to both players
            const player1 = await storage.getUserByDiscordId(game.player1);
            const player2 = await storage.getUserByDiscordId(game.player2);
            
            if (player1) {
              await storage.addToWallet(player1.id, BET_AMOUNT, 'game_refund', { gameType: 'dice_duel' });
            }
            
            if (player2) {
              await storage.addToWallet(player2.id, BET_AMOUNT, 'game_refund', { gameType: 'dice_duel' });
            }

            // Remove game from active games
            activeGames.delete(fullGameId);

            // Show the updated UI with tie result
            const tieButtonsRow = new ActionRowBuilder<ButtonBuilder>()
              .addComponents(
                new ButtonBuilder()
                  .setCustomId('competitive_games')
                  .setLabel('🎮 بازگشت به منوی بازی‌ها')
                  .setStyle(ButtonStyle.Secondary)
              );

            await interaction.update({
              embeds: [updatedEmbed],
              components: [tieButtonsRow]
            });
            return;
          }

          // Handle winner/loser
          const winningUser = await storage.getUserByDiscordId(winner);
          const losingUser = await storage.getUserByDiscordId(loser);
          
          if (winningUser) {
            // Award the winner
            const totalReward = BET_AMOUNT * 2; // Both players' bets
            await storage.addToWallet(winningUser.id, totalReward, 'game_win', { gameType: 'dice_duel' });
            
            // Record the game
            await storage.recordGame(winningUser.id, 'dice_duel', BET_AMOUNT, true, totalReward - BET_AMOUNT);
          }

          if (losingUser) {
            // Record the loss
            await storage.recordGame(losingUser.id, 'dice_duel', BET_AMOUNT, false, 0);
          }

          // Update the UI with the result
          updatedEmbed.setColor('#2ECC71')
            .setTitle('🎲 پایان بازی تاس')
            .setDescription(`بازی به پایان رسید! <@${winner}> برنده شد!`)
            .spliceFields(0, 1, { name: '📊 نتیجه', value: `<@${winner}> برنده ${BET_AMOUNT * 2} Ccoin شد!`, inline: false });

          // Remove game from active games
          activeGames.delete(fullGameId);

          // Show the updated UI with result
          const endButtonsRow = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('game:dice_duel:start')
                .setLabel('🎲 بازی جدید')
                .setStyle(ButtonStyle.Primary),
              new ButtonBuilder()
                .setCustomId('competitive_games')
                .setLabel('🎮 بازگشت به منوی بازی‌ها')
                .setStyle(ButtonStyle.Secondary)
            );

          await interaction.update({
            embeds: [updatedEmbed],
            components: [endButtonsRow]
          });
          return;
        }

        // If we get here, the game is still ongoing
        await interaction.update({
          embeds: [updatedEmbed],
          components: [
            new ActionRowBuilder<ButtonBuilder>()
              .addComponents(
                new ButtonBuilder()
                  .setCustomId(`game:dice_duel:roll:${fullGameId}`)
                  .setLabel('🎲 پرتاب تاس')
                  .setStyle(ButtonStyle.Primary)
              )
          ]
        });
        break;

      default:
        await interaction.reply({
          content: '❌ عملیات نامشخص.',
          ephemeral: true
        });
    }
  } catch (error) {
    console.error('Error in dice duel game:', error);
    try {
      await interaction.reply({
        content: '❌ خطایی رخ داد. لطفا دوباره تلاش کنید.',
        ephemeral: true
      });
    } catch (replyError) {
      console.error('Failed to send error message:', replyError);
    }
  }
}