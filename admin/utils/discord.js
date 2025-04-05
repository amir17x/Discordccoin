/**
 * ابزارهای کار با دیسکورد
 * 
 * این فایل شامل توابع کمکی برای دسترسی به کلاینت دیسکورد و اطلاعات آن است.
 */

let discordClient = null;

/**
 * تنظیم کلاینت دیسکورد
 * 
 * @param {Object} client کلاینت دیسکورد
 */
export function setDiscordClient(client) {
  discordClient = client;
  console.log('Discord client set for admin panel.');
}

/**
 * دریافت کلاینت دیسکورد
 * 
 * @returns {Object|null} کلاینت دیسکورد یا null در صورت عدم وجود
 */
export function getDiscordClient() {
  return discordClient;
}

/**
 * دریافت سرور دیسکورد با شناسه مشخص
 * 
 * @param {string} guildId شناسه سرور
 * @returns {Object|null} سرور یا null در صورت عدم وجود
 */
export function getGuild(guildId) {
  if (!discordClient) {
    return null;
  }
  
  return discordClient.guilds.cache.get(guildId);
}

/**
 * دریافت تمام سرورها
 * 
 * @returns {Array} لیست سرورها
 */
export function getAllGuilds() {
  if (!discordClient) {
    return [];
  }
  
  return [...discordClient.guilds.cache.values()];
}

/**
 * دریافت کاربر با شناسه مشخص
 * 
 * @param {string} userId شناسه کاربر
 * @returns {Object|null} کاربر یا null در صورت عدم وجود
 */
export function getUser(userId) {
  if (!discordClient) {
    return null;
  }
  
  return discordClient.users.cache.get(userId);
}

/**
 * دریافت کانال با شناسه مشخص
 * 
 * @param {string} channelId شناسه کانال
 * @returns {Object|null} کانال یا null در صورت عدم وجود
 */
export function getChannel(channelId) {
  if (!discordClient) {
    return null;
  }
  
  return discordClient.channels.cache.get(channelId);
}

/**
 * بررسی وضعیت اتصال کلاینت دیسکورد
 * 
 * @returns {boolean} آیا کلاینت متصل است؟
 */
export function isClientConnected() {
  return discordClient !== null && discordClient.ws.status === 0;
}

/**
 * ارسال پیام به یک کانال
 * 
 * @param {string} channelId شناسه کانال
 * @param {string|Object} message متن یا آبجکت پیام
 * @returns {Promise<Object|null>} پیام ارسال شده یا null در صورت خطا
 */
export async function sendMessage(channelId, message) {
  try {
    const channel = getChannel(channelId);
    
    if (!channel) {
      throw new Error(`Channel not found: ${channelId}`);
    }
    
    return await channel.send(message);
  } catch (error) {
    console.error('Error sending Discord message:', error);
    return null;
  }
}

/**
 * ارسال پیام خصوصی به یک کاربر
 * 
 * @param {string} userId شناسه کاربر
 * @param {string|Object} message متن یا آبجکت پیام
 * @returns {Promise<Object|null>} پیام ارسال شده یا null در صورت خطا
 */
export async function sendDirectMessage(userId, message) {
  try {
    const user = await discordClient.users.fetch(userId);
    
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }
    
    const dmChannel = await user.createDM();
    return await dmChannel.send(message);
  } catch (error) {
    console.error('Error sending Discord DM:', error);
    return null;
  }
}