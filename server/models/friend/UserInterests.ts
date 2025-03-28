import mongoose, { Document, Schema } from 'mongoose';

// تعریف ساختار علایق کاربر
export interface IUserInterests extends Document {
  userId: string;
  games: string[];
  activities: string[];
  topics: string[];
  musicGenres: string[];
  movieGenres: string[];
  bookGenres: string[];
  sports: string[];
  foods: string[];
  travelDestinations: string[];
  hobbies: string[];
  languages: string[];
  updatedAt: Date;
}

// اسکیما برای علایق کاربر
const UserInterestsSchema = new Schema<IUserInterests>(
  {
    userId: { type: String, required: true, unique: true },
    games: { type: [String], default: [] },
    activities: { type: [String], default: [] },
    topics: { type: [String], default: [] },
    musicGenres: { type: [String], default: [] },
    movieGenres: { type: [String], default: [] },
    bookGenres: { type: [String], default: [] },
    sports: { type: [String], default: [] },
    foods: { type: [String], default: [] },
    travelDestinations: { type: [String], default: [] },
    hobbies: { type: [String], default: [] },
    languages: { type: [String], default: [] },
    updatedAt: { type: Date, default: Date.now }
  },
  {
    timestamps: { createdAt: false, updatedAt: true },
    versionKey: false
  }
);

// ایجاد ایندکس‌ها برای بهبود کارایی
UserInterestsSchema.index({ userId: 1 }, { unique: true });
UserInterestsSchema.index({ games: 1 });
UserInterestsSchema.index({ activities: 1 });
UserInterestsSchema.index({ topics: 1 });
UserInterestsSchema.index({ updatedAt: -1 });

// متد استاتیک برای محاسبه شباهت بین دو مجموعه علایق
UserInterestsSchema.statics.calculateJaccardSimilarity = function(
  set1: string[],
  set2: string[]
): number {
  if (set1.length === 0 && set2.length === 0) {
    return 0;
  }
  
  const set1Set = new Set(set1);
  const set2Set = new Set(set2);
  
  let intersectionSize = 0;
  
  // محاسبه اشتراک دو مجموعه
  for (const item of set1Set) {
    if (set2Set.has(item)) {
      intersectionSize++;
    }
  }
  
  // محاسبه اجتماع دو مجموعه
  const unionSize = set1Set.size + set2Set.size - intersectionSize;
  
  // محاسبه شاخص جاکارد (نسبت اشتراک به اجتماع)
  return unionSize === 0 ? 0 : intersectionSize / unionSize;
};

// متد استاتیک برای محاسبه شباهت بین دو کاربر بر اساس علایق آنها
UserInterestsSchema.statics.calculateSimilarity = function(
  interests1: IUserInterests,
  interests2: IUserInterests
): number {
  // محاسبه شباهت برای هر دسته از علایق
  const gamesSimilarity = this.calculateJaccardSimilarity(interests1.games, interests2.games);
  const activitiesSimilarity = this.calculateJaccardSimilarity(interests1.activities, interests2.activities);
  const topicsSimilarity = this.calculateJaccardSimilarity(interests1.topics, interests2.topics);
  const musicSimilarity = this.calculateJaccardSimilarity(interests1.musicGenres, interests2.musicGenres);
  const movieSimilarity = this.calculateJaccardSimilarity(interests1.movieGenres, interests2.movieGenres);
  const bookSimilarity = this.calculateJaccardSimilarity(interests1.bookGenres, interests2.bookGenres);
  const sportsSimilarity = this.calculateJaccardSimilarity(interests1.sports, interests2.sports);
  const foodsSimilarity = this.calculateJaccardSimilarity(interests1.foods, interests2.foods);
  const travelSimilarity = this.calculateJaccardSimilarity(interests1.travelDestinations, interests2.travelDestinations);
  const hobbiesSimilarity = this.calculateJaccardSimilarity(interests1.hobbies, interests2.hobbies);
  const languagesSimilarity = this.calculateJaccardSimilarity(interests1.languages, interests2.languages);
  
  // محاسبه میانگین وزن‌دار شباهت‌ها
  const weights = {
    games: 1.5,
    activities: 1.2,
    topics: 1.0,
    music: 0.8,
    movies: 0.8,
    books: 0.7,
    sports: 0.7,
    foods: 0.5,
    travel: 0.7,
    hobbies: 1.0,
    languages: 0.6
  };
  
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  
  const weightedSimilarity = (
    gamesSimilarity * weights.games +
    activitiesSimilarity * weights.activities +
    topicsSimilarity * weights.topics +
    musicSimilarity * weights.music +
    movieSimilarity * weights.movies +
    bookSimilarity * weights.books +
    sportsSimilarity * weights.sports +
    foodsSimilarity * weights.foods +
    travelSimilarity * weights.travel +
    hobbiesSimilarity * weights.hobbies +
    languagesSimilarity * weights.languages
  ) / totalWeight;
  
  return weightedSimilarity;
};

// متد استاتیک برای افزودن علاقه به یک دسته
UserInterestsSchema.statics.addInterest = async function(
  userId: string,
  category: keyof IUserInterests,
  interest: string
): Promise<IUserInterests | null> {
  // بررسی معتبر بودن دسته
  const validCategories = [
    'games', 'activities', 'topics', 'musicGenres', 'movieGenres', 
    'bookGenres', 'sports', 'foods', 'travelDestinations', 'hobbies', 'languages'
  ];
  
  if (!validCategories.includes(category)) {
    throw new Error('دسته علاقه نامعتبر است');
  }
  
  // یافتن یا ایجاد رکورد علایق کاربر
  let userInterests = await this.findOne({ userId });
  
  if (!userInterests) {
    userInterests = await this.create({
      userId,
      updatedAt: new Date()
    });
  }
  
  // اطمینان از اینکه علاقه قبلاً اضافه نشده باشد
  if (!(userInterests as any)[category].includes(interest)) {
    // افزودن علاقه به دسته مربوطه
    (userInterests as any)[category].push(interest);
    userInterests.updatedAt = new Date();
    await userInterests.save();
  }
  
  return userInterests;
};

// متد استاتیک برای حذف علاقه از یک دسته
UserInterestsSchema.statics.removeInterest = async function(
  userId: string,
  category: keyof IUserInterests,
  interest: string
): Promise<IUserInterests | null> {
  // بررسی معتبر بودن دسته
  const validCategories = [
    'games', 'activities', 'topics', 'musicGenres', 'movieGenres', 
    'bookGenres', 'sports', 'foods', 'travelDestinations', 'hobbies', 'languages'
  ];
  
  if (!validCategories.includes(category)) {
    throw new Error('دسته علاقه نامعتبر است');
  }
  
  // یافتن رکورد علایق کاربر
  const userInterests = await this.findOne({ userId });
  
  if (!userInterests) {
    return null;
  }
  
  // حذف علاقه از دسته مربوطه
  (userInterests as any)[category] = (userInterests as any)[category].filter(
    (item: string) => item !== interest
  );
  
  userInterests.updatedAt = new Date();
  await userInterests.save();
  
  return userInterests;
};

// متد استاتیک برای یافتن کاربران با علایق مشابه
UserInterestsSchema.statics.findSimilarUsers = async function(
  userId: string,
  minSimilarity: number = 0.3,
  limit: number = 10
): Promise<{ userId: string; similarity: number }[]> {
  // یافتن علایق کاربر
  const userInterests = await this.findOne({ userId });
  
  if (!userInterests) {
    return [];
  }
  
  // یافتن همه کاربران دیگر
  const allUserInterests = await this.find({ userId: { $ne: userId } });
  
  // محاسبه شباهت برای هر کاربر
  const similarities = [];
  
  for (const otherUserInterests of allUserInterests) {
    const similarity = this.calculateSimilarity(userInterests, otherUserInterests);
    
    if (similarity >= minSimilarity) {
      similarities.push({
        userId: otherUserInterests.userId,
        similarity
      });
    }
  }
  
  // مرتب‌سازی بر اساس شباهت (نزولی)
  similarities.sort((a, b) => b.similarity - a.similarity);
  
  // محدود کردن تعداد نتایج
  return similarities.slice(0, limit);
};

// متد استاتیک برای یافتن علایق محبوب در هر دسته
UserInterestsSchema.statics.getPopularInterests = async function(
  limit: number = 10
): Promise<Record<string, { interest: string; count: number }[]>> {
  // لیست همه دسته‌های علایق
  const categories = [
    'games', 'activities', 'topics', 'musicGenres', 'movieGenres', 
    'bookGenres', 'sports', 'foods', 'travelDestinations', 'hobbies', 'languages'
  ];
  
  const result: Record<string, { interest: string; count: number }[]> = {};
  
  // یافتن همه کاربران
  const allUserInterests = await this.find({});
  
  // شمارش تعداد تکرار هر علاقه در هر دسته
  for (const category of categories) {
    const interestCounts = new Map<string, number>();
    
    for (const userInterest of allUserInterests) {
      const interests = (userInterest as any)[category] as string[];
      
      for (const interest of interests) {
        const currentCount = interestCounts.get(interest) || 0;
        interestCounts.set(interest, currentCount + 1);
      }
    }
    
    // تبدیل Map به آرایه و مرتب‌سازی بر اساس تعداد تکرار (نزولی)
    const popularInterests = Array.from(interestCounts.entries())
      .map(([interest, count]) => ({ interest, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
    
    result[category] = popularInterests;
  }
  
  return result;
};

// متد استاتیک برای پیشنهاد علایق به کاربر بر اساس علایق کاربران مشابه
UserInterestsSchema.statics.suggestInterests = async function(
  userId: string,
  limit: number = 5
): Promise<Record<string, string[]>> {
  // یافتن کاربران مشابه
  const similarUsers = await this.findSimilarUsers(userId, 0.2, 20);
  
  if (similarUsers.length === 0) {
    return {};
  }
  
  // یافتن علایق کاربر فعلی
  const userInterests = await this.findOne({ userId });
  
  if (!userInterests) {
    return {};
  }
  
  // یافتن علایق کاربران مشابه
  const similarUserIds = similarUsers.map(u => u.userId);
  const similarUserInterests = await this.find({ userId: { $in: similarUserIds } });
  
  // لیست دسته‌های علایق
  const categories = [
    'games', 'activities', 'topics', 'musicGenres', 'movieGenres', 
    'bookGenres', 'sports', 'foods', 'travelDestinations', 'hobbies', 'languages'
  ];
  
  const result: Record<string, string[]> = {};
  
  // برای هر دسته، علایقی را که کاربر ندارد اما کاربران مشابه دارند پیشنهاد کن
  for (const category of categories) {
    const userInterestsSet = new Set((userInterests as any)[category]);
    const suggestedInterests = new Map<string, number>();
    
    // جمع‌آوری علایق از کاربران مشابه
    for (const similarUserInterest of similarUserInterests) {
      const similarity = similarUsers.find(
        u => u.userId === similarUserInterest.userId
      )?.similarity || 0;
      
      const interests = (similarUserInterest as any)[category] as string[];
      
      for (const interest of interests) {
        // فقط علایقی که کاربر فعلی ندارد
        if (!userInterestsSet.has(interest)) {
          const currentScore = suggestedInterests.get(interest) || 0;
          // امتیاز بیشتر برای علایق کاربران با شباهت بیشتر
          suggestedInterests.set(interest, currentScore + similarity);
        }
      }
    }
    
    // مرتب‌سازی پیشنهادات بر اساس امتیاز (نزولی) و محدود کردن تعداد
    const suggestions = Array.from(suggestedInterests.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([interest]) => interest)
      .slice(0, limit);
    
    if (suggestions.length > 0) {
      result[category] = suggestions;
    }
  }
  
  return result;
};

// متد استاتیک برای بروزرسانی همه علایق یک کاربر
UserInterestsSchema.statics.updateAllInterests = async function(
  userId: string,
  interests: Partial<IUserInterests>
): Promise<IUserInterests | null> {
  // یافتن یا ایجاد رکورد علایق کاربر
  let userInterests = await this.findOne({ userId });
  
  if (!userInterests) {
    userInterests = await this.create({
      userId,
      ...interests,
      updatedAt: new Date()
    });
    return userInterests;
  }
  
  // بروزرسانی دسته‌های علایق
  const categories = [
    'games', 'activities', 'topics', 'musicGenres', 'movieGenres', 
    'bookGenres', 'sports', 'foods', 'travelDestinations', 'hobbies', 'languages'
  ];
  
  for (const category of categories) {
    if (Array.isArray((interests as any)[category])) {
      (userInterests as any)[category] = (interests as any)[category];
    }
  }
  
  userInterests.updatedAt = new Date();
  await userInterests.save();
  
  return userInterests;
};

// متد استاتیک برای دریافت علایق کاربر
UserInterestsSchema.statics.getUserInterests = async function(
  userId: string
): Promise<IUserInterests | null> {
  return await this.findOne({ userId });
};

// متد استاتیک برای بررسی اینکه آیا کاربر علایق خود را تکمیل کرده است
UserInterestsSchema.statics.hasCompletedInterests = async function(
  userId: string,
  minInterestsPerCategory: number = 3
): Promise<{ completed: boolean; completedCategories: string[] }> {
  const userInterests = await this.findOne({ userId });
  
  if (!userInterests) {
    return { completed: false, completedCategories: [] };
  }
  
  const categories = [
    'games', 'activities', 'topics', 'musicGenres', 'movieGenres', 
    'bookGenres', 'sports', 'foods', 'travelDestinations', 'hobbies', 'languages'
  ];
  
  const completedCategories = [];
  
  for (const category of categories) {
    if ((userInterests as any)[category].length >= minInterestsPerCategory) {
      completedCategories.push(category);
    }
  }
  
  // بررسی اینکه آیا کاربر حداقل در نیمی از دسته‌ها علایق خود را وارد کرده است
  const completed = completedCategories.length >= Math.ceil(categories.length / 2);
  
  return { completed, completedCategories };
};

// ایجاد و صادر کردن مدل
export const UserInterestsModel = mongoose.model<IUserInterests>('UserInterests', UserInterestsSchema);

export default UserInterestsModel;