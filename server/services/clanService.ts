import { Clan, IClan, User } from '../models';

/**
 * ایجاد کلن جدید
 * @param ownerId شناسه مالک کلن
 * @param name نام کلن
 * @param description توضیحات کلن
 * @returns اطلاعات کلن ایجاد شده
 */
export const createClan = async (
  ownerId: string,
  name: string,
  description?: string
): Promise<IClan> => {
  try {
    // بررسی وجود کاربر
    const owner = await User.findOne({ discordId: ownerId });
    if (!owner) {
      throw new Error(`User not found with Discord ID: ${ownerId}`);
    }

    // بررسی وجود کلن با همین نام
    const existingClan = await Clan.findOne({ name });
    if (existingClan) {
      throw new Error(`A clan with the name "${name}" already exists`);
    }

    // بررسی آیا کاربر قبلاً در کلن دیگری است
    const userInClan = await Clan.findOne({ members: { $elemMatch: { userId: ownerId } } });
    if (userInClan) {
      throw new Error(`User is already a member of clan "${userInClan.name}"`);
    }

    // ایجاد کلن جدید
    const clan = new Clan({
      name,
      description: description || null,
      ownerId,
      level: 1,
      experience: 0,
      bank: 0,
      missions: [],
      createdAt: new Date(),
      members: [
        {
          userId: ownerId,
          role: 'owner',
          joinedAt: new Date(),
          contribution: 0
        }
      ],
      memberCount: 1
    });

    // ذخیره کلن در دیتابیس
    await clan.save();
    return clan;
  } catch (error) {
    console.error('Error in createClan:', error);
    throw error;
  }
};

/**
 * افزودن کاربر به کلن
 * @param clanId شناسه کلن
 * @param userId شناسه کاربر
 * @returns اطلاعات به‌روز شده کلن
 */
export const addMemberToClan = async (
  clanId: string,
  userId: string
): Promise<IClan> => {
  try {
    // بررسی وجود کلن
    const clan = await Clan.findById(clanId);
    if (!clan) {
      throw new Error(`Clan not found with ID: ${clanId}`);
    }

    // بررسی وجود کاربر
    const user = await User.findOne({ discordId: userId });
    if (!user) {
      throw new Error(`User not found with Discord ID: ${userId}`);
    }

    // بررسی آیا کاربر قبلاً در این کلن است
    const isMember = clan.members.some(member => member.userId === userId);
    if (isMember) {
      throw new Error(`User is already a member of this clan`);
    }

    // بررسی آیا کاربر در کلن دیگری است
    const userInOtherClan = await Clan.findOne({ members: { $elemMatch: { userId } } });
    if (userInOtherClan) {
      throw new Error(`User is already a member of clan "${userInOtherClan.name}"`);
    }

    // افزودن کاربر به کلن
    clan.members.push({
      userId,
      role: 'member',
      joinedAt: new Date(),
      contribution: 0
    });

    // به‌روزرسانی تعداد اعضا
    clan.memberCount = clan.members.length;

    // ذخیره تغییرات
    await clan.save();
    return clan;
  } catch (error) {
    console.error('Error in addMemberToClan:', error);
    throw error;
  }
};

/**
 * حذف کاربر از کلن
 * @param clanId شناسه کلن
 * @param userId شناسه کاربر
 * @param byOwnerId شناسه کاربری که عملیات حذف را انجام می‌دهد (برای بررسی مجوز)
 * @returns اطلاعات به‌روز شده کلن
 */
export const removeMemberFromClan = async (
  clanId: string,
  userId: string,
  byOwnerId: string
): Promise<IClan> => {
  try {
    // بررسی وجود کلن
    const clan = await Clan.findById(clanId);
    if (!clan) {
      throw new Error(`Clan not found with ID: ${clanId}`);
    }

    // بررسی آیا کاربر حذف‌کننده، مالک کلن است
    if (clan.ownerId !== byOwnerId && userId !== byOwnerId) {
      throw new Error('Only the clan owner can remove members');
    }

    // بررسی آیا کاربر مورد نظر عضو کلن است
    const memberIndex = clan.members.findIndex(member => member.userId === userId);
    if (memberIndex === -1) {
      throw new Error(`User is not a member of this clan`);
    }

    // بررسی آیا کاربر مورد نظر مالک کلن است
    if (userId === clan.ownerId && byOwnerId === userId) {
      // مالک می‌خواهد کلن را ترک کند - کلن را حذف می‌کنیم
      await Clan.deleteOne({ _id: clanId });
      throw new Error('Clan has been disbanded because the owner left');
    } else if (userId === clan.ownerId) {
      throw new Error('The clan owner cannot be removed');
    }

    // حذف کاربر از لیست اعضا
    clan.members.splice(memberIndex, 1);

    // به‌روزرسانی تعداد اعضا
    clan.memberCount = clan.members.length;

    // ذخیره تغییرات
    await clan.save();
    return clan;
  } catch (error) {
    console.error('Error in removeMemberFromClan:', error);
    throw error;
  }
};

/**
 * دریافت لیست کلن‌ها
 * @param limit محدودیت تعداد نتایج
 * @param skip تعداد رکوردهای نادیده گرفته شده
 * @returns لیست کلن‌ها
 */
export const getClans = async (
  limit = 10,
  skip = 0
): Promise<IClan[]> => {
  try {
    const clans = await Clan.find()
      .sort({ memberCount: -1, level: -1 }) // مرتب‌سازی بر اساس تعداد اعضا و سطح
      .skip(skip)
      .limit(limit);
    
    return clans;
  } catch (error) {
    console.error('Error in getClans:', error);
    throw error;
  }
};

/**
 * دریافت اطلاعات یک کلن
 * @param clanId شناسه کلن
 * @returns اطلاعات کلن
 */
export const getClanById = async (
  clanId: string
): Promise<IClan> => {
  try {
    const clan = await Clan.findById(clanId);
    if (!clan) {
      throw new Error(`Clan not found with ID: ${clanId}`);
    }
    
    return clan;
  } catch (error) {
    console.error('Error in getClanById:', error);
    throw error;
  }
};