/**
 * سرویس مدیریت سرورها
 * 
 * این سرویس مسئول مدیریت سرورهای دیسکورد و تنظیمات آن‌ها است.
 */

// فعلاً از داده‌های استاتیک استفاده می‌کنیم
// در محیط واقعی، این داده‌ها از API دیسکورد و پایگاه داده دریافت می‌شوند

// لیست سرورها
let serversList = [
  {
    id: '1343951143625293867',
    name: 'CCOIN Official Server',
    icon: 'https://cdn.discordapp.com/icons/1343951143625293867/12345abcdef.png',
    memberCount: 1245,
    ownerID: '123456789012345678',
    ownerName: 'Admin',
    isPremium: true,
    isActive: true,
    joinedAt: '2024-01-15T12:30:45Z',
    features: {
      economy: true,
      games: true,
      moderation: true,
      ai: true,
      tips: true
    },
    settings: {
      prefix: '!',
      language: 'fa',
      defaultCurrency: 'coins',
      welcomeMessageEnabled: true,
      welcomeChannelId: '123456789012345678',
      loggingEnabled: true,
      loggingChannelId: '123456789012345678'
    }
  },
  {
    id: '987654321098765432',
    name: 'Gaming Community',
    icon: 'https://cdn.discordapp.com/icons/987654321098765432/98765abcdef.png',
    memberCount: 756,
    ownerID: '876543210987654321',
    ownerName: 'GameMaster',
    isPremium: false,
    isActive: true,
    joinedAt: '2024-02-20T08:15:30Z',
    features: {
      economy: true,
      games: true,
      moderation: false,
      ai: false,
      tips: true
    },
    settings: {
      prefix: '!',
      language: 'en',
      defaultCurrency: 'coins',
      welcomeMessageEnabled: false,
      welcomeChannelId: null,
      loggingEnabled: false,
      loggingChannelId: null
    }
  },
  {
    id: '567890123456789012',
    name: 'Tech Support',
    icon: 'https://cdn.discordapp.com/icons/567890123456789012/56789abcdef.png',
    memberCount: 342,
    ownerID: '234567890123456789',
    ownerName: 'TechGuru',
    isPremium: true,
    isActive: true,
    joinedAt: '2024-03-05T14:22:10Z',
    features: {
      economy: false,
      games: false,
      moderation: true,
      ai: true,
      tips: false
    },
    settings: {
      prefix: '!',
      language: 'fa',
      defaultCurrency: 'coins',
      welcomeMessageEnabled: true,
      welcomeChannelId: '234567890123456789',
      loggingEnabled: true,
      loggingChannelId: '234567890123456789'
    }
  }
];

/**
 * دریافت لیست سرورها
 * 
 * @param {Object} options گزینه‌های فیلتر و مرتب‌سازی
 * @returns {Promise<Array>} لیست سرورها
 */
export async function getServersList(options = {}) {
  // پارامترهای فیلتر
  const { search, sortBy = 'name', order = 'asc', page = 1, limit = 20 } = options;
  
  // کپی از لیست سرورها
  let filteredServers = [...serversList];
  
  // اعمال فیلتر جستجو
  if (search) {
    const searchLower = search.toLowerCase();
    filteredServers = filteredServers.filter(server => 
      server.name.toLowerCase().includes(searchLower) || 
      server.id.includes(search) ||
      server.ownerName.toLowerCase().includes(searchLower)
    );
  }
  
  // مرتب‌سازی
  filteredServers.sort((a, b) => {
    let valueA = a[sortBy];
    let valueB = b[sortBy];
    
    // اگر مقادیر رشته هستند، به صورت حروف الفبا مقایسه می‌شوند
    if (typeof valueA === 'string' && typeof valueB === 'string') {
      valueA = valueA.toLowerCase();
      valueB = valueB.toLowerCase();
    }
    
    // مقایسه بر اساس جهت مرتب‌سازی
    if (order.toLowerCase() === 'asc') {
      return valueA < valueB ? -1 : (valueA > valueB ? 1 : 0);
    } else {
      return valueA > valueB ? -1 : (valueA < valueB ? 1 : 0);
    }
  });
  
  // صفحه‌بندی
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const pagedServers = filteredServers.slice(startIndex, endIndex);
  
  return pagedServers;
}

/**
 * دریافت جزئیات سرور
 * 
 * @param {string} serverId شناسه سرور
 * @returns {Promise<Object|null>} جزئیات سرور یا null در صورت عدم وجود
 */
export async function getServerDetails(serverId) {
  const server = serversList.find(s => s.id === serverId);
  
  if (!server) {
    return null;
  }
  
  // در یک محیط واقعی، اطلاعات بیشتری از API دیسکورد و پایگاه داده دریافت می‌شود
  
  return {
    ...server,
    channels: [
      {
        id: '123456789012345678',
        name: 'general',
        type: 'text',
        position: 0
      },
      {
        id: '123456789012345679',
        name: 'welcome',
        type: 'text',
        position: 1
      },
      {
        id: '123456789012345680',
        name: 'logs',
        type: 'text',
        position: 2
      },
      {
        id: '123456789012345681',
        name: 'voice-chat',
        type: 'voice',
        position: 3
      }
    ],
    roles: [
      {
        id: '123456789012345690',
        name: 'Admin',
        color: '#FF0000',
        position: 1,
        permissions: ['ADMINISTRATOR']
      },
      {
        id: '123456789012345691',
        name: 'Moderator',
        color: '#00FF00',
        position: 2,
        permissions: ['KICK_MEMBERS', 'BAN_MEMBERS', 'MANAGE_MESSAGES']
      },
      {
        id: '123456789012345692',
        name: 'Member',
        color: '#0000FF',
        position: 3,
        permissions: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY']
      }
    ],
    commandUsage: {
      economy: 4215,
      games: 3189,
      moderation: 528,
      ai: 1673,
      help: 987
    },
    activity: {
      daily: [152, 184, 210, 176, 198, 241, 187],
      commandsPerHour: [12, 8, 5, 3, 2, 4, 10, 25, 45, 60, 72, 85, 80, 75, 82, 90, 95, 87, 76, 65, 52, 43, 35, 20]
    }
  };
}

/**
 * بروزرسانی سرور
 * 
 * @param {string} serverId شناسه سرور
 * @param {Object} updateData داده‌های بروزرسانی
 * @returns {Promise<Object|null>} سرور بروزرسانی شده یا null در صورت عدم وجود
 */
export async function updateServer(serverId, updateData) {
  const index = serversList.findIndex(s => s.id === serverId);
  
  if (index === -1) {
    return null;
  }
  
  // بروزرسانی داده‌های سرور
  serversList[index] = {
    ...serversList[index],
    ...updateData,
    // مطمئن می‌شویم که شناسه سرور تغییر نمی‌کند
    id: serverId
  };
  
  // اگر features یا settings وجود داشته باشند، آن‌ها را به صورت عمیق ادغام می‌کنیم
  if (updateData.features) {
    serversList[index].features = {
      ...serversList[index].features,
      ...updateData.features
    };
  }
  
  if (updateData.settings) {
    serversList[index].settings = {
      ...serversList[index].settings,
      ...updateData.settings
    };
  }
  
  // در یک محیط واقعی، داده‌ها در پایگاه داده ذخیره می‌شوند
  // و در صورت نیاز، تغییرات از طریق API دیسکورد اعمال می‌شوند
  
  return serversList[index];
}

/**
 * حذف سرور
 * 
 * @param {string} serverId شناسه سرور
 * @returns {Promise<boolean>} نتیجه عملیات
 */
export async function removeServer(serverId) {
  const index = serversList.findIndex(s => s.id === serverId);
  
  if (index === -1) {
    return false;
  }
  
  // حذف سرور از لیست
  serversList.splice(index, 1);
  
  // در یک محیط واقعی، داده‌ها از پایگاه داده حذف می‌شوند
  
  return true;
}

/**
 * افزودن سرور جدید
 * 
 * @param {Object} serverData اطلاعات سرور
 * @returns {Promise<Object>} سرور ایجاد شده
 */
export async function addServer(serverData) {
  // ایجاد سرور جدید
  const newServer = {
    id: serverData.id,
    name: serverData.name,
    icon: serverData.icon || null,
    memberCount: serverData.memberCount || 0,
    ownerID: serverData.ownerID,
    ownerName: serverData.ownerName,
    isPremium: serverData.isPremium || false,
    isActive: serverData.isActive || true,
    joinedAt: serverData.joinedAt || new Date().toISOString(),
    features: serverData.features || {
      economy: true,
      games: true,
      moderation: true,
      ai: false,
      tips: false
    },
    settings: serverData.settings || {
      prefix: '!',
      language: 'fa',
      defaultCurrency: 'coins',
      welcomeMessageEnabled: false,
      welcomeChannelId: null,
      loggingEnabled: false,
      loggingChannelId: null
    }
  };
  
  // افزودن به لیست سرورها
  serversList.push(newServer);
  
  // در یک محیط واقعی، داده‌ها در پایگاه داده ذخیره می‌شوند
  
  return newServer;
}