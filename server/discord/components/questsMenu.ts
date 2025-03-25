import { 
  ButtonInteraction, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder,
  MessageComponentInteraction
} from 'discord.js';
import { storage } from '../../storage';

// Function to create and send the quests menu
export async function questsMenu(
  interaction: ButtonInteraction | MessageComponentInteraction,
  followUp: boolean = false
) {
  try {
    // Check if user exists
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      await interaction.reply({
        content: 'You need to create an account first. Use the /menu command.',
        ephemeral: true
      });
      return;
    }
    
    // Get user's quests
    const userQuests = await storage.getUserQuests(user.id);
    
    // Filter quests by type
    const dailyQuests = userQuests.filter(q => q.quest.type === 'daily');
    const weeklyQuests = userQuests.filter(q => q.quest.type === 'weekly');
    const monthlyQuests = userQuests.filter(q => q.quest.type === 'monthly');
    
    // Create the quests embed with quest scroll image
    const embed = new EmbedBuilder()
      .setColor('#E74C3C')
      .setTitle('🎯 ماموریت‌ها')
      .setDescription('ماموریت‌ها را کامل کن و جوایز دریافت کن!')
      .setThumbnail('https://cdn-icons-png.flaticon.com/512/8768/8768209.png') // آیکون fi-sr-check-circle برای بخش کوئست ها
      .setFooter({ text: `${interaction.user.username} | برای دریافت جایزه روی دکمه کلیک کنید` })
      .setTimestamp();
    
    // Add field for each quest type
    if (dailyQuests.length > 0) {
      embed.addFields({
        name: '🌅 ماموریت‌های روزانه',
        value: dailyQuests.map(q => {
          const progress = `${q.userQuest.progress}/${q.quest.targetAmount}`;
          const status = q.userQuest.completed ? '✅ تکمیل شده' : 
                          (q.userQuest.progress >= q.quest.targetAmount ? '🎁 آماده دریافت' : '⏳ در حال انجام');
          return `**${q.quest.title}**: ${q.quest.description}\n- جایزه: ${q.quest.reward} Ccoin\n- پیشرفت: ${progress} (${status})`;
        }).join('\n\n'),
        inline: false
      });
    }
    
    if (weeklyQuests.length > 0) {
      embed.addFields({
        name: '📅 ماموریت‌های هفتگی',
        value: weeklyQuests.map(q => {
          const progress = `${q.userQuest.progress}/${q.quest.targetAmount}`;
          const status = q.userQuest.completed ? '✅ تکمیل شده' : 
                          (q.userQuest.progress >= q.quest.targetAmount ? '🎁 آماده دریافت' : '⏳ در حال انجام');
          return `**${q.quest.title}**: ${q.quest.description}\n- جایزه: ${q.quest.reward} Ccoin\n- پیشرفت: ${progress} (${status})`;
        }).join('\n\n'),
        inline: false
      });
    }
    
    if (monthlyQuests.length > 0) {
      embed.addFields({
        name: '🗓️ ماموریت‌های ماهانه',
        value: monthlyQuests.map(q => {
          const progress = `${q.userQuest.progress}/${q.quest.targetAmount}`;
          const status = q.userQuest.completed ? '✅ تکمیل شده' : 
                          (q.userQuest.progress >= q.quest.targetAmount ? '🎁 آماده دریافت' : '⏳ در حال انجام');
          return `**${q.quest.title}**: ${q.quest.description}\n- جایزه: ${q.quest.reward} Ccoin\n- پیشرفت: ${progress} (${status})`;
        }).join('\n\n'),
        inline: false
      });
    }
    
    // Create claim buttons for completed quests
    const rows: ActionRowBuilder<ButtonBuilder>[] = [];
    const claimableQuests = userQuests.filter(q => 
      !q.userQuest.completed && q.userQuest.progress >= q.quest.targetAmount
    );
    
    // Group buttons into rows, max 5 buttons per row
    for (let i = 0; i < claimableQuests.length; i += 5) {
      const rowQuests = claimableQuests.slice(i, i + 5);
      const row = new ActionRowBuilder<ButtonBuilder>();
      
      rowQuests.forEach(q => {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`claim:${q.quest.id}`)
            .setLabel(`دریافت جایزه ${q.quest.title}`)
            .setStyle(ButtonStyle.Success)
        );
      });
      
      rows.push(row);
    }
    
    // Add back button
    const backRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('menu')
          .setLabel('🔙 بازگشت')
          .setStyle(ButtonStyle.Secondary)
      );
    
    rows.push(backRow);
    
    // Send the quests menu
    if (followUp) {
      await interaction.followUp({ embeds: [embed], components: rows, ephemeral: true });
    } else {
      await interaction.update({ embeds: [embed], components: rows });
    }
    
  } catch (error) {
    console.error('Error in quests menu:', error);
    
    try {
      if (followUp) {
        await interaction.followUp({
          content: 'Sorry, there was an error displaying the quests menu!',
          ephemeral: true
        });
      } else {
        await interaction.reply({
          content: 'Sorry, there was an error displaying the quests menu!',
          ephemeral: true
        });
      }
    } catch (e) {
      console.error('Error handling quests menu failure:', e);
    }
  }
}
