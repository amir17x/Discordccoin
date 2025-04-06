/**
 * سرویس ارتباط با بات دیسکورد
 * 
 * این سرویس برای ارتباط بین پنل ادمین وب و بات دیسکورد استفاده می‌شود.
 * از طریق این سرویس، تغییرات اعمال شده در پنل ادمین تحت وب به بات دیسکورد منتقل می‌شود و بالعکس.
 */

/**
 * افزودن سکه به کاربر
 * @param {string} userId شناسه دیسکورد کاربر
 * @param {number} amount مقدار سکه
 * @param {string} reason دلیل افزودن سکه
 * @returns {Promise<Object>} نتیجه عملیات
 */
export async function addUserCoins(userId, amount, reason = 'افزودن سکه توسط ادمین') {
  try {
    // واردات سرویس‌های لازم
    const { getUserByDiscordId, updateUserBalance } = await import('../services/mongoService.js');
    
    // دریافت اطلاعات کاربر
    const user = await getUserByDiscordId(userId);
    
    if (!user) {
      return {
        success: false,
        message: 'کاربر مورد نظر یافت نشد'
      };
    }
    
    // محاسبه مقدار جدید سکه‌ها
    const newWalletBalance = user.wallet + amount;
    
    // به‌روزرسانی موجودی کاربر
    const updateResult = await updateUserBalance(userId, newWalletBalance, user.bank);
    
    if (!updateResult) {
      return {
        success: false,
        message: 'خطا در به‌روزرسانی موجودی کاربر'
      };
    }
    
    // ثبت تراکنش
    const { Transaction } = await import('../services/modelHelpers.js');
    await Transaction.create({
      userId,
      amount,
      type: 'admin_add',
      description: reason,
      timestamp: new Date()
    });
    
    // دریافت اطلاعات به‌روز شده کاربر
    const updatedUser = await getUserByDiscordId(userId);
    
    return {
      success: true,
      user: updatedUser
    };
  } catch (error) {
    console.error('Error in addUserCoins:', error);
    return {
      success: false,
      message: 'خطا در افزودن سکه به کاربر',
      error: error.message
    };
  }
}

/**
 * کاهش سکه کاربر
 * @param {string} userId شناسه دیسکورد کاربر
 * @param {number} amount مقدار سکه
 * @param {string} reason دلیل کاهش سکه
 * @returns {Promise<Object>} نتیجه عملیات
 */
export async function removeUserCoins(userId, amount, reason = 'کاهش سکه توسط ادمین') {
  try {
    // واردات سرویس‌های لازم
    const { getUserByDiscordId, updateUserBalance } = await import('../services/mongoService.js');
    
    // دریافت اطلاعات کاربر
    const user = await getUserByDiscordId(userId);
    
    if (!user) {
      return {
        success: false,
        message: 'کاربر مورد نظر یافت نشد'
      };
    }
    
    // بررسی کافی بودن موجودی
    if (user.wallet < amount) {
      // اگر موجودی کیف پول کافی نباشد، از بانک برداشت می‌کنیم
      const remainingAmount = amount - user.wallet;
      
      if (user.bank < remainingAmount) {
        return {
          success: false,
          message: 'موجودی کاربر کافی نیست'
        };
      }
      
      // محاسبه مقدار جدید سکه‌ها
      const newWalletBalance = 0;
      const newBankBalance = user.bank - remainingAmount;
      
      // به‌روزرسانی موجودی کاربر
      const updateResult = await updateUserBalance(userId, newWalletBalance, newBankBalance);
      
      if (!updateResult) {
        return {
          success: false,
          message: 'خطا در به‌روزرسانی موجودی کاربر'
        };
      }
    } else {
      // محاسبه مقدار جدید سکه‌ها
      const newWalletBalance = user.wallet - amount;
      
      // به‌روزرسانی موجودی کاربر
      const updateResult = await updateUserBalance(userId, newWalletBalance, user.bank);
      
      if (!updateResult) {
        return {
          success: false,
          message: 'خطا در به‌روزرسانی موجودی کاربر'
        };
      }
    }
    
    // ثبت تراکنش
    const { Transaction } = await import('../services/modelHelpers.js');
    await Transaction.create({
      userId,
      amount: -amount,
      type: 'admin_remove',
      description: reason,
      timestamp: new Date()
    });
    
    // دریافت اطلاعات به‌روز شده کاربر
    const updatedUser = await getUserByDiscordId(userId);
    
    return {
      success: true,
      user: updatedUser
    };
  } catch (error) {
    console.error('Error in removeUserCoins:', error);
    return {
      success: false,
      message: 'خطا در کاهش سکه کاربر',
      error: error.message
    };
  }
}

/**
 * افزودن آیتم جدید به فروشگاه
 * @param {Object} itemData اطلاعات آیتم
 * @returns {Promise<Object>} نتیجه عملیات
 */
export async function addShopItem(itemData) {
  try {
    // واردات سرویس‌های لازم
    const { MarketListing } = await import('../services/modelHelpers.js');
    
    // ایجاد آیتم جدید
    const newItem = await MarketListing.create({
      name: itemData.name,
      description: itemData.description,
      type: itemData.type,
      emoji: itemData.emoji,
      price: itemData.price,
      isActive: true,
      addedBy: itemData.addedBy,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    if (!newItem) {
      return {
        success: false,
        message: 'خطا در افزودن آیتم به فروشگاه'
      };
    }
    
    return {
      success: true,
      item: newItem
    };
  } catch (error) {
    console.error('Error in addShopItem:', error);
    return {
      success: false,
      message: 'خطا در افزودن آیتم به فروشگاه',
      error: error.message
    };
  }
}

/**
 * ویرایش آیتم فروشگاه
 * @param {string} itemId شناسه آیتم
 * @param {Object} itemData اطلاعات جدید آیتم
 * @returns {Promise<Object>} نتیجه عملیات
 */
export async function editShopItem(itemId, itemData) {
  try {
    // واردات سرویس‌های لازم
    const { MarketListing } = await import('../services/modelHelpers.js');
    
    // بررسی وجود آیتم
    const item = await MarketListing.findById(itemId);
    
    if (!item) {
      return {
        success: false,
        message: 'آیتم مورد نظر یافت نشد'
      };
    }
    
    // به‌روزرسانی آیتم
    item.name = itemData.name || item.name;
    item.description = itemData.description || item.description;
    item.type = itemData.type || item.type;
    item.emoji = itemData.emoji || item.emoji;
    item.price = itemData.price || item.price;
    item.updatedAt = new Date();
    item.updatedBy = itemData.editedBy;
    
    await item.save();
    
    return {
      success: true,
      item
    };
  } catch (error) {
    console.error('Error in editShopItem:', error);
    return {
      success: false,
      message: 'خطا در ویرایش آیتم فروشگاه',
      error: error.message
    };
  }
}

/**
 * حذف آیتم از فروشگاه
 * @param {string} itemId شناسه آیتم
 * @param {string} deletedBy کاربر حذف کننده
 * @returns {Promise<Object>} نتیجه عملیات
 */
export async function deleteShopItem(itemId, deletedBy) {
  try {
    // واردات سرویس‌های لازم
    const { MarketListing } = await import('../services/modelHelpers.js');
    
    // بررسی وجود آیتم
    const item = await MarketListing.findById(itemId);
    
    if (!item) {
      return {
        success: false,
        message: 'آیتم مورد نظر یافت نشد'
      };
    }
    
    // حذف آیتم
    await MarketListing.deleteOne({ _id: itemId });
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Error in deleteShopItem:', error);
    return {
      success: false,
      message: 'خطا در حذف آیتم از فروشگاه',
      error: error.message
    };
  }
}

/**
 * ارسال پیام همگانی
 * @param {Object} messageData اطلاعات پیام
 * @returns {Promise<Object>} نتیجه عملیات
 */
export async function sendBroadcastMessage(messageData) {
  try {
    // در حالت واقعی، اینجا از Client دیسکورد برای ارسال پیام استفاده می‌شود
    console.log('Sending broadcast message:', messageData);
    
    // شبیه‌سازی ارسال به کاربران
    const recipients = {
      success: 10,
      failed: 0,
      total: 10
    };
    
    return {
      success: true,
      recipients
    };
  } catch (error) {
    console.error('Error in sendBroadcastMessage:', error);
    return {
      success: false,
      message: 'خطا در ارسال پیام',
      error: error.message
    };
  }
}

/**
 * به‌روزرسانی تنظیمات بات
 * @param {string} section بخش تنظیمات
 * @param {Object} settings تنظیمات جدید
 * @param {string} updatedBy کاربر به‌روزرسان
 * @returns {Promise<Object>} نتیجه عملیات
 */
export async function updateBotSettings(section, settings, updatedBy) {
  try {
    // واردات سرویس‌های لازم
    const { GlobalSettings } = await import('../services/modelHelpers.js');
    
    // بررسی تنظیمات فعلی
    let globalSettings = await GlobalSettings.findOne();
    
    // اگر تنظیمات وجود نداشته باشد، یک نمونه جدید ایجاد می‌کنیم
    if (!globalSettings) {
      globalSettings = new GlobalSettings({
        general: {},
        economy: {},
        games: {},
        clans: {},
        levels: {},
        ai: {}
      });
    }
    
    // به‌روزرسانی بخش مورد نظر
    switch (section) {
      case 'general':
        globalSettings.general = { ...globalSettings.general, ...settings };
        break;
      case 'economy':
        globalSettings.economy = { ...globalSettings.economy, ...settings };
        break;
      case 'games':
        globalSettings.games = { ...globalSettings.games, ...settings };
        break;
      case 'clans':
        globalSettings.clans = { ...globalSettings.clans, ...settings };
        break;
      case 'levels':
        globalSettings.levels = { ...globalSettings.levels, ...settings };
        break;
      case 'ai':
        globalSettings.ai = { ...globalSettings.ai, ...settings };
        break;
      default:
        return {
          success: false,
          message: 'بخش تنظیمات نامعتبر است'
        };
    }
    
    // ذخیره تنظیمات
    globalSettings.updatedAt = new Date();
    globalSettings.updatedBy = updatedBy;
    await globalSettings.save();
    
    return {
      success: true,
      settings: globalSettings
    };
  } catch (error) {
    console.error('Error in updateBotSettings:', error);
    return {
      success: false,
      message: 'خطا در به‌روزرسانی تنظیمات',
      error: error.message
    };
  }
}

/**
 * به‌روزرسانی قیمت سهام
 * @param {string} symbol نماد سهام
 * @param {string} updatedBy کاربر به‌روزرسان
 * @returns {Promise<Object>} نتیجه عملیات
 */
export async function updateStockPrice(symbol, updatedBy) {
  try {
    // واردات سرویس‌های لازم
    const { Stock } = await import('../services/modelHelpers.js');
    
    // بررسی وجود سهام
    const stock = await Stock.findOne({ symbol });
    
    if (!stock) {
      return {
        success: false,
        message: 'سهام مورد نظر یافت نشد'
      };
    }
    
    // محاسبه قیمت جدید با نوسان تصادفی بین -15% تا +15%
    const volatility = Math.random() * 0.3 - 0.15; // بین -0.15 تا 0.15
    const newPrice = Math.round(stock.currentPrice * (1 + volatility));
    
    // محاسبه درصد تغییر
    const percentChange = Math.round((newPrice - stock.currentPrice) / stock.currentPrice * 100 * 100) / 100;
    
    // ذخیره قیمت قبلی
    const previousPrice = stock.currentPrice;
    
    // به‌روزرسانی قیمت سهام
    stock.previousPrice = previousPrice;
    stock.currentPrice = newPrice;
    stock.percentChange = percentChange;
    stock.lastUpdatedBy = updatedBy;
    stock.updatedAt = new Date();
    
    await stock.save();
    
    return {
      success: true,
      stock,
      previousPrice,
      newPrice,
      percentChange
    };
  } catch (error) {
    console.error('Error in updateStockPrice:', error);
    return {
      success: false,
      message: 'خطا در به‌روزرسانی قیمت سهام',
      error: error.message
    };
  }
}

/**
 * ایجاد نسخه پشتیبان
 * @param {string} type نوع نسخه پشتیبان (full, partial)
 * @param {string} description توضیحات
 * @param {string} createdBy کاربر ایجاد کننده
 * @returns {Promise<Object>} نتیجه عملیات
 */
export async function createBackupFile(type, description, createdBy) {
  try {
    // در حالت واقعی، اینجا از یک روش مناسب برای تهیه نسخه پشتیبان استفاده می‌شود
    console.log('Creating backup:', { type, description, createdBy });
    
    // شبیه‌سازی ایجاد نسخه پشتیبان
    const backup = {
      id: Date.now().toString(),
      type,
      description,
      size: '2.5 MB',
      createdAt: new Date(),
      createdBy
    };
    
    return {
      success: true,
      backup
    };
  } catch (error) {
    console.error('Error in createBackupFile:', error);
    return {
      success: false,
      message: 'خطا در ایجاد نسخه پشتیبان',
      error: error.message
    };
  }
}

/**
 * بازیابی نسخه پشتیبان
 * @param {string} backupId شناسه نسخه پشتیبان
 * @param {string} restoredBy کاربر بازیابی کننده
 * @returns {Promise<Object>} نتیجه عملیات
 */
export async function restoreBackupFile(backupId, restoredBy) {
  try {
    // در حالت واقعی، اینجا از یک روش مناسب برای بازیابی نسخه پشتیبان استفاده می‌شود
    console.log('Restoring backup:', { backupId, restoredBy });
    
    // شبیه‌سازی بازیابی نسخه پشتیبان
    const details = {
      restoredAt: new Date(),
      restoredBy,
      affectedCollections: ['users', 'transactions', 'items', 'quests', 'clans']
    };
    
    return {
      success: true,
      details
    };
  } catch (error) {
    console.error('Error in restoreBackupFile:', error);
    return {
      success: false,
      message: 'خطا در بازیابی نسخه پشتیبان',
      error: error.message
    };
  }
}

/**
 * افزودن ماموریت جدید
 * @param {Object} questData اطلاعات ماموریت
 * @returns {Promise<Object>} نتیجه عملیات
 */
export async function addQuestItem(questData) {
  try {
    // در حالت واقعی، اینجا از یک مدل مناسب برای افزودن ماموریت استفاده می‌شود
    console.log('Adding quest:', questData);
    
    // شبیه‌سازی افزودن ماموریت
    const quest = {
      id: Date.now().toString(),
      ...questData,
      createdAt: new Date()
    };
    
    return {
      success: true,
      quest
    };
  } catch (error) {
    console.error('Error in addQuestItem:', error);
    return {
      success: false,
      message: 'خطا در افزودن ماموریت',
      error: error.message
    };
  }
}

/**
 * ویرایش ماموریت
 * @param {string} questId شناسه ماموریت
 * @param {Object} questData اطلاعات جدید ماموریت
 * @returns {Promise<Object>} نتیجه عملیات
 */
export async function editQuestItem(questId, questData) {
  try {
    // در حالت واقعی، اینجا از یک مدل مناسب برای ویرایش ماموریت استفاده می‌شود
    console.log('Editing quest:', { questId, questData });
    
    // شبیه‌سازی ویرایش ماموریت
    const quest = {
      id: questId,
      ...questData,
      updatedAt: new Date()
    };
    
    return {
      success: true,
      quest
    };
  } catch (error) {
    console.error('Error in editQuestItem:', error);
    return {
      success: false,
      message: 'خطا در ویرایش ماموریت',
      error: error.message
    };
  }
}

/**
 * حذف ماموریت
 * @param {string} questId شناسه ماموریت
 * @param {string} deletedBy کاربر حذف کننده
 * @returns {Promise<Object>} نتیجه عملیات
 */
export async function deleteQuestItem(questId, deletedBy) {
  try {
    // در حالت واقعی، اینجا از یک مدل مناسب برای حذف ماموریت استفاده می‌شود
    console.log('Deleting quest:', { questId, deletedBy });
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Error in deleteQuestItem:', error);
    return {
      success: false,
      message: 'خطا در حذف ماموریت',
      error: error.message
    };
  }
}

/**
 * افزودن کلن جدید
 * @param {Object} clanData اطلاعات کلن
 * @returns {Promise<Object>} نتیجه عملیات
 */
export async function addClanItem(clanData) {
  try {
    // در حالت واقعی، اینجا از یک مدل مناسب برای افزودن کلن استفاده می‌شود
    console.log('Adding clan:', clanData);
    
    // شبیه‌سازی افزودن کلن
    const clan = {
      id: Date.now().toString(),
      ...clanData,
      members: [clanData.owner],
      roles: [],
      createdAt: new Date()
    };
    
    return {
      success: true,
      clan
    };
  } catch (error) {
    console.error('Error in addClanItem:', error);
    return {
      success: false,
      message: 'خطا در افزودن کلن',
      error: error.message
    };
  }
}

/**
 * ویرایش کلن
 * @param {string} clanId شناسه کلن
 * @param {Object} clanData اطلاعات جدید کلن
 * @returns {Promise<Object>} نتیجه عملیات
 */
export async function editClanItem(clanId, clanData) {
  try {
    // در حالت واقعی، اینجا از یک مدل مناسب برای ویرایش کلن استفاده می‌شود
    console.log('Editing clan:', { clanId, clanData });
    
    // شبیه‌سازی ویرایش کلن
    const clan = {
      id: clanId,
      ...clanData,
      updatedAt: new Date()
    };
    
    return {
      success: true,
      clan
    };
  } catch (error) {
    console.error('Error in editClanItem:', error);
    return {
      success: false,
      message: 'خطا در ویرایش کلن',
      error: error.message
    };
  }
}

/**
 * حذف کلن
 * @param {string} clanId شناسه کلن
 * @param {string} deletedBy کاربر حذف کننده
 * @returns {Promise<Object>} نتیجه عملیات
 */
export async function deleteClanItem(clanId, deletedBy) {
  try {
    // در حالت واقعی، اینجا از یک مدل مناسب برای حذف کلن استفاده می‌شود
    console.log('Deleting clan:', { clanId, deletedBy });
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Error in deleteClanItem:', error);
    return {
      success: false,
      message: 'خطا در حذف کلن',
      error: error.message
    };
  }
}

/**
 * به‌روزرسانی تنظیمات هوش مصنوعی
 * @param {Object} settings تنظیمات جدید
 * @param {string} updatedBy کاربر به‌روزرسان
 * @returns {Promise<Object>} نتیجه عملیات
 */
export async function updateAISettings(settings, updatedBy) {
  try {
    // واردات سرویس‌های لازم
    const { GlobalSettings } = await import('../services/modelHelpers.js');
    
    // بررسی تنظیمات فعلی
    let globalSettings = await GlobalSettings.findOne();
    
    // اگر تنظیمات وجود نداشته باشد، یک نمونه جدید ایجاد می‌کنیم
    if (!globalSettings) {
      globalSettings = new GlobalSettings({
        general: {},
        economy: {},
        games: {},
        clans: {},
        levels: {},
        ai: {}
      });
    }
    
    // به‌روزرسانی تنظیمات هوش مصنوعی
    globalSettings.ai = { ...globalSettings.ai, ...settings };
    globalSettings.updatedAt = new Date();
    globalSettings.updatedBy = updatedBy;
    
    await globalSettings.save();
    
    return {
      success: true,
      settings: globalSettings.ai
    };
  } catch (error) {
    console.error('Error in updateAISettings:', error);
    return {
      success: false,
      message: 'خطا در به‌روزرسانی تنظیمات هوش مصنوعی',
      error: error.message
    };
  }
}
