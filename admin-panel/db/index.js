const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');
const { eq, like, and, or, sql, gt, lt, gte, lte, desc, asc } = require('drizzle-orm');
const { clans, users, games, quests, userQuests } = require('../../shared/schema');

// ایجاد اتصال به پایگاه داده
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// ایجاد نمونه دریزل
const db = drizzle(pool);

/**
 * دریافت تعداد کل کلن‌ها
 * @returns {Promise<number>} تعداد کلن‌ها
 */
async function getClansCount() {
    try {
        const result = await db.select({ count: sql`count(*)` }).from(clans);
        return parseInt(result[0].count);
    } catch (error) {
        console.error('خطا در دریافت تعداد کلن‌ها:', error);
        throw error;
    }
}

/**
 * دریافت لیست کلن‌ها با پاگینیشن
 * @param {number} skip تعداد نتایجی که باید رد شود
 * @param {number} limit تعداد نتایج در هر صفحه
 * @returns {Promise<Array>} لیست کلن‌ها
 */
async function getClans(skip = 0, limit = 10) {
    try {
        return await db.select().from(clans).limit(limit).offset(skip);
    } catch (error) {
        console.error('خطا در دریافت لیست کلن‌ها:', error);
        throw error;
    }
}

/**
 * جستجوی کلن‌ها
 * @param {string} term عبارت جستجو
 * @returns {Promise<Array>} لیست کلن‌های یافت شده
 */
async function searchClans(term) {
    try {
        return await db.select().from(clans).where(
            or(
                like(clans.name, `%${term}%`),
                like(clans.description, `%${term}%`)
            )
        );
    } catch (error) {
        console.error('خطا در جستجوی کلن‌ها:', error);
        throw error;
    }
}

/**
 * دریافت اطلاعات کلن با شناسه
 * @param {number} id شناسه کلن
 * @returns {Promise<Object|null>} اطلاعات کلن
 */
async function getClanById(id) {
    try {
        const result = await db.select().from(clans).where(eq(clans.id, id)).limit(1);
        return result.length > 0 ? result[0] : null;
    } catch (error) {
        console.error(`خطا در دریافت اطلاعات کلن با شناسه ${id}:`, error);
        throw error;
    }
}

/**
 * دریافت اطلاعات کلن با نام
 * @param {string} name نام کلن
 * @returns {Promise<Object|null>} اطلاعات کلن
 */
async function getClanByName(name) {
    try {
        const result = await db.select().from(clans).where(eq(clans.name, name)).limit(1);
        return result.length > 0 ? result[0] : null;
    } catch (error) {
        console.error(`خطا در دریافت اطلاعات کلن با نام ${name}:`, error);
        throw error;
    }
}

/**
 * بروزرسانی اطلاعات کلن
 * @param {number} id شناسه کلن
 * @param {Object} updates داده‌های بروزرسانی
 * @returns {Promise<Object>} اطلاعات بروزرسانی شده کلن
 */
async function updateClan(id, updates) {
    try {
        await db.update(clans).set(updates).where(eq(clans.id, id));
        return await getClanById(id);
    } catch (error) {
        console.error(`خطا در بروزرسانی اطلاعات کلن با شناسه ${id}:`, error);
        throw error;
    }
}

/**
 * بروزرسانی منابع کلن
 * @param {number} id شناسه کلن
 * @param {Object} resources منابع جدید
 * @returns {Promise<Object>} اطلاعات بروزرسانی شده کلن
 */
async function updateClanResources(id, resources) {
    try {
        const clan = await getClanById(id);
        
        if (!clan) {
            throw new Error(`کلن با شناسه ${id} یافت نشد`);
        }
        
        const currentResources = clan.resources || {};
        const updatedResources = { ...currentResources, ...resources };
        
        await db.update(clans)
            .set({ resources: updatedResources })
            .where(eq(clans.id, id));
        
        return await getClanById(id);
    } catch (error) {
        console.error(`خطا در بروزرسانی منابع کلن با شناسه ${id}:`, error);
        throw error;
    }
}

/**
 * افزودن منبع به کلن
 * @param {number} id شناسه کلن
 * @param {string} resourceType نوع منبع (coins, materials, energy)
 * @param {number} amount مقدار افزایش
 * @returns {Promise<Object>} اطلاعات بروزرسانی شده کلن
 */
async function addClanResource(id, resourceType, amount) {
    try {
        const clan = await getClanById(id);
        
        if (!clan) {
            throw new Error(`کلن با شناسه ${id} یافت نشد`);
        }
        
        const currentResources = clan.resources || {};
        const currentAmount = currentResources[resourceType] || 0;
        const updatedResources = { 
            ...currentResources, 
            [resourceType]: currentAmount + amount 
        };
        
        await db.update(clans)
            .set({ resources: updatedResources })
            .where(eq(clans.id, id));
        
        return await getClanById(id);
    } catch (error) {
        console.error(`خطا در افزودن منبع به کلن با شناسه ${id}:`, error);
        throw error;
    }
}

/**
 * حذف کلن
 * @param {number} id شناسه کلن
 * @returns {Promise<boolean>} آیا عملیات موفق بود؟
 */
async function deleteClan(id) {
    try {
        // ابتدا تمام کاربران را از کلن خارج می‌کنیم
        await db.update(users)
            .set({ clanId: null })
            .where(eq(users.clanId, id));
        
        // سپس کلن را حذف می‌کنیم
        await db.delete(clans).where(eq(clans.id, id));
        
        return true;
    } catch (error) {
        console.error(`خطا در حذف کلن با شناسه ${id}:`, error);
        throw error;
    }
}

/**
 * تغییر مالک کلن
 * @param {number} clanId شناسه کلن
 * @param {number} newOwnerId شناسه کاربر جدید
 * @returns {Promise<Object>} اطلاعات بروزرسانی شده کلن
 */
async function changeClanOwner(clanId, newOwnerId) {
    try {
        // بررسی وجود کلن
        const clan = await getClanById(clanId);
        if (!clan) {
            throw new Error(`کلن با شناسه ${clanId} یافت نشد`);
        }
        
        // بررسی وجود کاربر جدید
        const newOwner = await getUserById(newOwnerId);
        if (!newOwner) {
            throw new Error(`کاربر با شناسه ${newOwnerId} یافت نشد`);
        }
        
        // بررسی عضویت کاربر جدید در کلن
        if (newOwner.clanId !== clanId) {
            throw new Error(`کاربر با شناسه ${newOwnerId} عضو این کلن نیست`);
        }
        
        // بروزرسانی مالک کلن
        await db.update(clans)
            .set({ ownerId: newOwnerId })
            .where(eq(clans.id, clanId));
        
        return await getClanById(clanId);
    } catch (error) {
        console.error(`خطا در تغییر مالک کلن با شناسه ${clanId}:`, error);
        throw error;
    }
}

/**
 * دریافت اعضای کلن
 * @param {number} clanId شناسه کلن
 * @returns {Promise<Array>} لیست اعضای کلن
 */
async function getClanMembers(clanId) {
    try {
        return await db.select().from(users).where(eq(users.clanId, clanId));
    } catch (error) {
        console.error(`خطا در دریافت اعضای کلن با شناسه ${clanId}:`, error);
        throw error;
    }
}

/**
 * خارج کردن کاربر از کلن
 * @param {number} clanId شناسه کلن
 * @param {number} userId شناسه کاربر
 * @returns {Promise<boolean>} آیا عملیات موفق بود؟
 */
async function removeMemberFromClan(clanId, userId) {
    try {
        // بررسی وجود کلن
        const clan = await getClanById(clanId);
        if (!clan) {
            throw new Error(`کلن با شناسه ${clanId} یافت نشد`);
        }
        
        // بررسی وجود کاربر
        const user = await getUserById(userId);
        if (!user) {
            throw new Error(`کاربر با شناسه ${userId} یافت نشد`);
        }
        
        // بررسی عضویت کاربر در کلن
        if (user.clanId !== clanId) {
            throw new Error(`کاربر با شناسه ${userId} عضو این کلن نیست`);
        }
        
        // اگر کاربر مالک کلن است، عملیات را انجام نمی‌دهیم
        if (clan.ownerId === userId) {
            throw new Error(`کاربر با شناسه ${userId} مالک کلن است و نمی‌تواند خارج شود`);
        }
        
        // خارج کردن کاربر از کلن
        await db.update(users)
            .set({ clanId: null })
            .where(eq(users.id, userId));
        
        return true;
    } catch (error) {
        console.error(`خطا در خارج کردن کاربر با شناسه ${userId} از کلن با شناسه ${clanId}:`, error);
        throw error;
    }
}

/**
 * دریافت اطلاعات کاربر با شناسه
 * @param {number} id شناسه کاربر
 * @returns {Promise<Object|null>} اطلاعات کاربر
 */
async function getUserById(id) {
    try {
        const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
        return result.length > 0 ? result[0] : null;
    } catch (error) {
        console.error(`خطا در دریافت اطلاعات کاربر با شناسه ${id}:`, error);
        throw error;
    }
}

/**
 * دریافت تعداد کل کاربران
 * @returns {Promise<number>} تعداد کاربران
 */
async function getUsersCount() {
    try {
        const result = await db.select({ count: sql`count(*)` }).from(users);
        return parseInt(result[0].count) || 0;
    } catch (error) {
        console.error('خطا در دریافت تعداد کاربران:', error);
        return 0;
    }
}

/**
 * دریافت تعداد کاربران جدید در بازه زمانی مشخص
 * @param {number} hours تعداد ساعت‌های گذشته
 * @returns {Promise<number>} تعداد کاربران جدید
 */
async function getNewUsersCount(hours = 24) {
    try {
        const timeThreshold = new Date();
        timeThreshold.setHours(timeThreshold.getHours() - hours);
        
        const result = await db.select({ count: sql`count(*)` })
            .from(users)
            .where(gte(users.createdAt, timeThreshold));
            
        return parseInt(result[0].count) || 0;
    } catch (error) {
        console.error(`خطا در دریافت تعداد کاربران جدید در ${hours} ساعت گذشته:`, error);
        return 0;
    }
}

/**
 * دریافت مجموع Ccoin موجود در سیستم
 * @returns {Promise<number>} مجموع Ccoin
 */
async function getTotalCcoin() {
    try {
        const result = await db.select({
            total: sql`SUM(wallet + bank)`
        }).from(users);
        
        return parseInt(result[0].total) || 0;
    } catch (error) {
        console.error('خطا در دریافت مجموع Ccoin:', error);
        return 0;
    }
}

/**
 * دریافت تغییرات اقتصادی در بازه زمانی مشخص
 * @param {number} hours تعداد ساعت‌های گذشته
 * @returns {Promise<number>} میزان تغییرات (مثبت یا منفی)
 */
async function getEconomyChange(hours = 24) {
    try {
        // این تابع نیاز به بررسی تراکنش‌ها دارد
        // برای سادگی، مقدار تصادفی بین -500 تا 500 برمی‌گردانیم
        const change = Math.floor(Math.random() * 1000) - 500;
        return change;
    } catch (error) {
        console.error(`خطا در دریافت تغییرات اقتصادی در ${hours} ساعت گذشته:`, error);
        return 0;
    }
}

/**
 * دریافت تعداد کلن‌های جدید در بازه زمانی مشخص
 * @param {number} hours تعداد ساعت‌های گذشته
 * @returns {Promise<number>} تعداد کلن‌های جدید
 */
async function getNewClansCount(hours = 24) {
    try {
        const timeThreshold = new Date();
        timeThreshold.setHours(timeThreshold.getHours() - hours);
        
        const result = await db.select({ count: sql`count(*)` })
            .from(clans)
            .where(gte(clans.createdAt, timeThreshold));
            
        return parseInt(result[0].count) || 0;
    } catch (error) {
        console.error(`خطا در دریافت تعداد کلن‌های جدید در ${hours} ساعت گذشته:`, error);
        return 0;
    }
}

/**
 * دریافت تعداد ماموریت‌های فعال
 * @returns {Promise<number>} تعداد ماموریت‌های فعال
 */
async function getActiveQuestsCount() {
    try {
        const result = await db.select({ count: sql`count(*)` })
            .from(userQuests)
            .where(eq(userQuests.completed, false));
            
        return parseInt(result[0].count) || 0;
    } catch (error) {
        console.error('خطا در دریافت تعداد ماموریت‌های فعال:', error);
        return 0;
    }
}

/**
 * دریافت تعداد ماموریت‌های کامل شده در بازه زمانی مشخص
 * @param {number} days تعداد روزهای گذشته
 * @returns {Promise<number>} تعداد ماموریت‌های کامل شده
 */
async function getCompletedQuestsCount(days = 7) {
    try {
        const timeThreshold = new Date();
        timeThreshold.setDate(timeThreshold.getDate() - days);
        
        const result = await db.select({ count: sql`count(*)` })
            .from(userQuests)
            .where(and(
                eq(userQuests.completed, true),
                gte(userQuests.completedAt, timeThreshold)
            ));
            
        return parseInt(result[0].count) || 0;
    } catch (error) {
        console.error(`خطا در دریافت تعداد ماموریت‌های کامل شده در ${days} روز گذشته:`, error);
        return 0;
    }
}

/**
 * دریافت تعداد کاربران فعال در یک روز خاص
 * @param {Date} date تاریخ مورد نظر
 * @returns {Promise<number>} تعداد کاربران فعال
 */
async function getActiveUsersCountByDate(date) {
    try {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        
        const result = await db.select({ count: sql`count(DISTINCT user_id)` })
            .from(games)
            .where(and(
                gte(games.createdAt, startOfDay),
                lte(games.createdAt, endOfDay)
            ));
            
        return parseInt(result[0].count) || 0;
    } catch (error) {
        console.error(`خطا در دریافت تعداد کاربران فعال در تاریخ ${date.toISOString()}:`, error);
        return 0;
    }
}

/**
 * دریافت تراکنش‌های روزانه
 * @param {Date} date تاریخ مورد نظر
 * @returns {Promise<Object>} آمار تراکنش‌ها
 */
async function getDailyTransactions(date) {
    try {
        // این تابع نیاز به جدول تراکنش‌ها دارد
        // برای سادگی، مقادیر تصادفی برمی‌گردانیم
        return {
            deposits: Math.floor(Math.random() * 1000),
            withdrawals: Math.floor(Math.random() * 500)
        };
    } catch (error) {
        console.error(`خطا در دریافت تراکنش‌های روزانه برای تاریخ ${date.toISOString()}:`, error);
        return { deposits: 0, withdrawals: 0 };
    }
}

/**
 * دریافت آمار بازی‌ها
 * @returns {Promise<Object>} آمار بازی‌ها
 */
async function getGameStats() {
    try {
        const result = await db.select({
            type: games.type,
            count: sql`count(*)`
        })
        .from(games)
        .groupBy(games.type);
        
        const stats = {
            coinflip: 0,
            rps: 0,
            numberguess: 0,
            dice: 0,
            other: 0
        };
        
        result.forEach(item => {
            const gameType = item.type.toLowerCase();
            if (gameType === 'coinflip') {
                stats.coinflip = parseInt(item.count);
            } else if (gameType === 'rps') {
                stats.rps = parseInt(item.count);
            } else if (gameType === 'numberguess') {
                stats.numberguess = parseInt(item.count);
            } else if (gameType === 'dice') {
                stats.dice = parseInt(item.count);
            } else {
                stats.other += parseInt(item.count);
            }
        });
        
        return stats;
    } catch (error) {
        console.error('خطا در دریافت آمار بازی‌ها:', error);
        return { coinflip: 0, rps: 0, numberguess: 0, dice: 0, other: 0 };
    }
}

/**
 * دریافت کاربران فعال اخیر
 * @param {number} limit تعداد نتایج
 * @returns {Promise<Array>} لیست کاربران فعال
 */
async function getRecentActiveUsers(limit = 5) {
    try {
        return await db.select()
            .from(users)
            .orderBy(desc(users.lastSeen))
            .limit(limit);
    } catch (error) {
        console.error(`خطا در دریافت ${limit} کاربر فعال اخیر:`, error);
        return [];
    }
}

/**
 * دریافت آخرین رویدادها
 * @param {number} limit تعداد نتایج
 * @returns {Promise<Array>} لیست رویدادها
 */
async function getRecentEvents(limit = 5) {
    try {
        // این تابع نیاز به جدول رویدادها دارد
        // برای سادگی، مقادیر نمونه برمی‌گردانیم
        return [
            {
                id: 1,
                type: 'user',
                message: 'کاربر جدید ثبت نام کرد',
                timestamp: new Date()
            },
            {
                id: 2,
                type: 'transaction',
                message: 'انتقال 500 سکه از کاربر A به کاربر B',
                timestamp: new Date(Date.now() - 1000 * 60 * 5) // 5 دقیقه قبل
            },
            {
                id: 3,
                type: 'game',
                message: 'کاربر C در بازی پرتاب سکه 200 سکه برنده شد',
                timestamp: new Date(Date.now() - 1000 * 60 * 10) // 10 دقیقه قبل
            },
            {
                id: 4,
                type: 'clan',
                message: 'کلن جدید "اژدهایان" ایجاد شد',
                timestamp: new Date(Date.now() - 1000 * 60 * 30) // 30 دقیقه قبل
            },
            {
                id: 5,
                type: 'system',
                message: 'سیستم بازی به‌روزرسانی شد',
                timestamp: new Date(Date.now() - 1000 * 60 * 60) // 1 ساعت قبل
            }
        ];
    } catch (error) {
        console.error(`خطا در دریافت ${limit} رویداد اخیر:`, error);
        return [];
    }
}

/**
 * دریافت تعداد کل ماموریت‌ها
 * @returns {Promise<number>} تعداد ماموریت‌ها
 */
async function getQuestsCount() {
    try {
        const result = await db.select({ count: sql`count(*)` }).from(quests);
        return parseInt(result[0].count);
    } catch (error) {
        console.error('خطا در دریافت تعداد ماموریت‌ها:', error);
        throw error;
    }
}

/**
 * دریافت لیست ماموریت‌ها با پاگینیشن
 * @param {number} skip تعداد نتایجی که باید رد شود
 * @param {number} limit تعداد نتایج در هر صفحه
 * @returns {Promise<Array>} لیست ماموریت‌ها
 */
async function getAllQuests(skip = 0, limit = 10) {
    try {
        const questList = await db.select().from(quests).limit(limit).offset(skip);
        
        // افزودن آمار به هر ماموریت
        for (const quest of questList) {
            quest.stats = {
                activeUsers: await getActiveUsersForQuest(quest.id),
                completedCount: await getCompletedCountForQuest(quest.id),
                completionRate: await getCompletionRateForQuest(quest.id)
            };
        }
        
        return questList;
    } catch (error) {
        console.error('خطا در دریافت لیست ماموریت‌ها:', error);
        throw error;
    }
}

/**
 * جستجوی ماموریت‌ها
 * @param {string} term عبارت جستجو
 * @returns {Promise<Array>} لیست ماموریت‌های یافت شده
 */
async function searchQuests(term) {
    try {
        return await db.select().from(quests).where(
            or(
                like(quests.title, `%${term}%`),
                like(quests.description, `%${term}%`),
                like(quests.type, `%${term}%`),
                like(quests.requirement, `%${term}%`)
            )
        );
    } catch (error) {
        console.error('خطا در جستجوی ماموریت‌ها:', error);
        throw error;
    }
}

/**
 * دریافت اطلاعات ماموریت با شناسه
 * @param {number} id شناسه ماموریت
 * @returns {Promise<Object|null>} اطلاعات ماموریت
 */
async function getQuest(id) {
    try {
        const result = await db.select().from(quests).where(eq(quests.id, id)).limit(1);
        if (result.length === 0) return null;
        
        const quest = result[0];
        
        // افزودن آمار به ماموریت
        quest.stats = {
            activeUsers: await getActiveUsersForQuest(id),
            completedCount: await getCompletedCountForQuest(id),
            completionRate: await getCompletionRateForQuest(id)
        };
        
        return quest;
    } catch (error) {
        console.error(`خطا در دریافت اطلاعات ماموریت با شناسه ${id}:`, error);
        throw error;
    }
}

/**
 * ایجاد ماموریت جدید
 * @param {Object} questData اطلاعات ماموریت جدید
 * @returns {Promise<Object>} ماموریت ایجاد شده
 */
async function createQuest(questData) {
    try {
        // ایجاد ماموریت جدید
        const [result] = await db.insert(quests).values({
            title: questData.title,
            description: questData.description || null,
            type: questData.type,
            requirement: questData.requirement,
            targetAmount: questData.targetAmount,
            reward: questData.reward,
            minLevel: questData.minLevel || 1,
            active: questData.active !== undefined ? questData.active : true,
            category: questData.category || 'general'
        }).returning();
        
        return result;
    } catch (error) {
        console.error('خطا در ایجاد ماموریت جدید:', error);
        throw error;
    }
}

/**
 * بروزرسانی اطلاعات ماموریت
 * @param {number} id شناسه ماموریت
 * @param {Object} updates داده‌های بروزرسانی
 * @returns {Promise<Object>} اطلاعات بروزرسانی شده ماموریت
 */
async function updateQuest(id, updates) {
    try {
        await db.update(quests).set(updates).where(eq(quests.id, id));
        return await getQuest(id);
    } catch (error) {
        console.error(`خطا در بروزرسانی اطلاعات ماموریت با شناسه ${id}:`, error);
        throw error;
    }
}

/**
 * حذف ماموریت
 * @param {number} id شناسه ماموریت
 * @returns {Promise<boolean>} آیا عملیات موفق بود؟
 */
async function deleteQuest(id) {
    try {
        // ابتدا تمام رکوردهای userQuests مرتبط را حذف می‌کنیم
        await db.delete(userQuests).where(eq(userQuests.questId, id));
        
        // سپس ماموریت را حذف می‌کنیم
        await db.delete(quests).where(eq(quests.id, id));
        
        return true;
    } catch (error) {
        console.error(`خطا در حذف ماموریت با شناسه ${id}:`, error);
        throw error;
    }
}

/**
 * دریافت کاربرانی که این ماموریت را دارند
 * @param {number} questId شناسه ماموریت
 * @returns {Promise<Array>} لیست کاربران با این ماموریت
 */
async function getUsersWithQuest(questId) {
    try {
        // ابتدا اطلاعات userQuests را دریافت می‌کنیم
        const userQuestRecords = await db.select().from(userQuests).where(eq(userQuests.questId, questId));
        
        // سپس اطلاعات کاربران مرتبط را دریافت می‌کنیم
        const result = [];
        for (const uq of userQuestRecords) {
            const user = await getUserById(uq.userId);
            if (user) {
                result.push({
                    user,
                    userQuest: uq
                });
            }
        }
        
        return result;
    } catch (error) {
        console.error(`خطا در دریافت کاربران با ماموریت ${questId}:`, error);
        throw error;
    }
}

/**
 * اختصاص ماموریت به کاربر
 * @param {number} questId شناسه ماموریت
 * @param {number} userId شناسه کاربر
 * @returns {Promise<boolean>} آیا عملیات موفق بود؟
 */
async function assignQuestToUser(questId, userId) {
    try {
        // بررسی وجود ماموریت
        const quest = await getQuest(questId);
        if (!quest) {
            throw new Error(`ماموریت با شناسه ${questId} یافت نشد`);
        }
        
        // بررسی وجود کاربر
        const user = await getUserById(userId);
        if (!user) {
            throw new Error(`کاربر با شناسه ${userId} یافت نشد`);
        }
        
        // بررسی اینکه آیا کاربر قبلاً این ماموریت را دارد
        const existingUserQuest = await db.select()
            .from(userQuests)
            .where(and(
                eq(userQuests.userId, userId),
                eq(userQuests.questId, questId)
            ))
            .limit(1);
        
        if (existingUserQuest.length > 0) {
            throw new Error(`کاربر با شناسه ${userId} قبلاً این ماموریت را دریافت کرده است`);
        }
        
        // ایجاد رکورد userQuest جدید
        await db.insert(userQuests).values({
            userId,
            questId,
            progress: 0,
            completed: false,
            updatedAt: new Date()
        });
        
        return true;
    } catch (error) {
        console.error(`خطا در اختصاص ماموریت ${questId} به کاربر ${userId}:`, error);
        throw error;
    }
}

/**
 * بروزرسانی پیشرفت ماموریت کاربر
 * @param {number} userId شناسه کاربر
 * @param {number} questId شناسه ماموریت
 * @param {number} progress میزان پیشرفت جدید
 * @param {boolean} completed آیا ماموریت تکمیل شده است؟
 * @returns {Promise<boolean>} آیا عملیات موفق بود؟
 */
async function updateUserQuestProgress(userId, questId, progress, completed = false) {
    try {
        // بررسی وجود رکورد userQuest
        const existingUserQuest = await db.select()
            .from(userQuests)
            .where(and(
                eq(userQuests.userId, userId),
                eq(userQuests.questId, questId)
            ))
            .limit(1);
        
        if (existingUserQuest.length === 0) {
            throw new Error(`رکورد ماموریت برای کاربر ${userId} و ماموریت ${questId} یافت نشد`);
        }
        
        // بروزرسانی پیشرفت
        const updates = {
            progress,
            completed,
            updatedAt: new Date()
        };
        
        // اگر ماموریت تکمیل شده است، تاریخ تکمیل را تنظیم می‌کنیم
        if (completed && !existingUserQuest[0].completed) {
            updates.completedAt = new Date();
        }
        
        await db.update(userQuests)
            .set(updates)
            .where(and(
                eq(userQuests.userId, userId),
                eq(userQuests.questId, questId)
            ));
        
        return true;
    } catch (error) {
        console.error(`خطا در بروزرسانی پیشرفت ماموریت ${questId} برای کاربر ${userId}:`, error);
        throw error;
    }
}

/**
 * دریافت تعداد کاربران فعال برای یک ماموریت
 * @param {number} questId شناسه ماموریت
 * @returns {Promise<number>} تعداد کاربران فعال
 */
async function getActiveUsersForQuest(questId) {
    try {
        const result = await db.select({ count: sql`count(*)` })
            .from(userQuests)
            .where(and(
                eq(userQuests.questId, questId),
                eq(userQuests.completed, false)
            ));
            
        return parseInt(result[0].count) || 0;
    } catch (error) {
        console.error(`خطا در دریافت تعداد کاربران فعال برای ماموریت ${questId}:`, error);
        return 0;
    }
}

/**
 * دریافت تعداد تکمیل‌ها برای یک ماموریت
 * @param {number} questId شناسه ماموریت
 * @returns {Promise<number>} تعداد تکمیل‌ها
 */
async function getCompletedCountForQuest(questId) {
    try {
        const result = await db.select({ count: sql`count(*)` })
            .from(userQuests)
            .where(and(
                eq(userQuests.questId, questId),
                eq(userQuests.completed, true)
            ));
            
        return parseInt(result[0].count) || 0;
    } catch (error) {
        console.error(`خطا در دریافت تعداد تکمیل‌ها برای ماموریت ${questId}:`, error);
        return 0;
    }
}

/**
 * دریافت نرخ تکمیل برای یک ماموریت
 * @param {number} questId شناسه ماموریت
 * @returns {Promise<number>} نرخ تکمیل (0-100)
 */
async function getCompletionRateForQuest(questId) {
    try {
        const totalCount = await db.select({ count: sql`count(*)` })
            .from(userQuests)
            .where(eq(userQuests.questId, questId));
            
        const completedCount = await db.select({ count: sql`count(*)` })
            .from(userQuests)
            .where(and(
                eq(userQuests.questId, questId),
                eq(userQuests.completed, true)
            ));
            
        const total = parseInt(totalCount[0].count) || 0;
        const completed = parseInt(completedCount[0].count) || 0;
        
        if (total === 0) return 0;
        return (completed / total) * 100;
    } catch (error) {
        console.error(`خطا در دریافت نرخ تکمیل برای ماموریت ${questId}:`, error);
        return 0;
    }
}

module.exports = {
    getClansCount,
    getClans,
    searchClans,
    getClanById,
    getClanByName,
    updateClan,
    updateClanResources,
    addClanResource,
    deleteClan,
    changeClanOwner,
    getClanMembers,
    removeMemberFromClan,
    getUserById,
    getUsersCount,
    getNewUsersCount,
    getTotalCcoin,
    getEconomyChange,
    getNewClansCount,
    getActiveQuestsCount,
    getCompletedQuestsCount,
    getActiveUsersCountByDate,
    getDailyTransactions,
    getGameStats,
    getRecentActiveUsers,
    getRecentEvents,
    // توابع جدید ماموریت‌ها
    getQuestsCount,
    getAllQuests,
    searchQuests,
    getQuest,
    createQuest,
    updateQuest,
    deleteQuest,
    getUsersWithQuest,
    assignQuestToUser,
    updateUserQuestProgress
};