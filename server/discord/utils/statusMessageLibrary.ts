/**
 * کتابخانه پیام‌های وضعیت Ccoin
 * 
 * این فایل شامل مجموعه‌ای از پیام‌های وضعیت آماده است که می‌توان
 * از آنها به عنوان جایگزین برای تولید پیام توسط هوش مصنوعی استفاده کرد.
 * این پیام‌ها به دسته‌های مختلف تقسیم شده‌اند تا بتوان متناسب با موضوع،
 * از آنها استفاده کرد.
 */

import { fileURLToPath } from 'url';
import * as path from 'path';

// پیدا کردن محل فعلی فایل (جایگزین __dirname در ماژول‌های ES)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// نوع داده برای پیام‌های وضعیت
export interface StatusMessage {
  text: string;  // متن پیام
  theme: string; // دسته‌بندی موضوعی
}

// مجموعه پیام‌های بازی‌های گروهی و مینی‌گیم‌ها
export const gameMessages: StatusMessage[] = [
  { text: "🕵️ مافیا‌بازها رو رصد می‌کنم | شهروندها مراقب باشن!", theme: "بازی‌ها و سرگرمی" },
  { text: "🐺 گرگ‌نماها رو شناسایی می‌کنم | روستا رو نجات میدم", theme: "بازی‌ها و سرگرمی" },
  { text: "🎲 تاس میندازم | شانس‌ها رو تغییر میدم | برنده‌ها رو انتخاب می‌کنم", theme: "بازی‌ها و سرگرمی" },
  { text: "🎮 بازی می‌سازم | جایزه میدم | رکورد ثبت می‌کنم", theme: "بازی‌ها و سرگرمی" },
  { text: "🎭 نقش بازی می‌کنم | مخفیانه لو میدم | دسیسه می‌چینم", theme: "بازی‌ها و سرگرمی" },
  { text: "🏅 قهرمان‌ها رو تشویق می‌کنم | بازنده‌ها رو تمسخر می‌کنم", theme: "بازی‌ها و سرگرمی" },
  { text: "🎯 هدف گیری دقیق | شلیک بی‌رحمانه | بازی بی‌پایان", theme: "بازی‌ها و سرگرمی" },
  { text: "🃏 کارت‌ها رو بُر می‌زنم | برگ برنده رو رو می‌کنم", theme: "بازی‌ها و سرگرمی" },
  { text: "🎪 سیرک بازی‌های دیسکورد | من ریئس همه بازی‌ها هستم", theme: "بازی‌ها و سرگرمی" },
  { text: "🧩 معماها رو حل می‌کنم | پازل‌ها رو می‌شکنم | مغزها رو منفجر می‌کنم", theme: "بازی‌ها و سرگرمی" }
];

// مجموعه پیام‌های اقتصاد و ارز دیجیتال
export const economyMessages: StatusMessage[] = [
  { text: "💸 چاپخونه سکه راه انداختم | تورم رو کنترل می‌کنم", theme: "اقتصاد و کسب درآمد" },
  { text: "🏦 از بانک‌ها محافظت می‌کنم | از دزدا استقبال می‌کنم", theme: "اقتصاد و کسب درآمد" },
  { text: "📈 قیمت‌ها رو دستکاری می‌کنم | بازار رو می‌ترکونم", theme: "اقتصاد و کسب درآمد" },
  { text: "💎 الماس می‌تراشم | طلا قاچاق می‌کنم | ثروت انباشت می‌کنم", theme: "اقتصاد و کسب درآمد" },
  { text: "💰 سکه‌های دیجیتال می‌سازم | ارزش واقعی خلق می‌کنم", theme: "اقتصاد و کسب درآمد" },
  { text: "🤑 پول‌شویی دیجیتال | سود نامحدود | ریسک صفر", theme: "اقتصاد و کسب درآمد" },
  { text: "🏪 فروشگاه اقلام کمیاب | خرید با تخفیف | فروش با سود", theme: "اقتصاد و کسب درآمد" },
  { text: "💹 نوسان‌گیری حرفه‌ای | خرید در کف | فروش در سقف", theme: "اقتصاد و کسب درآمد" },
  { text: "🏆 ثروتمندترین ربات دیسکورد | دارایی‌هام رو نمی‌شمارم، وزن می‌کنم!", theme: "اقتصاد و کسب درآمد" },
  { text: "🧿 آینده اقتصاد رو پیش‌بینی می‌کنم | شانس رو مهندسی می‌کنم", theme: "اقتصاد و کسب درآمد" }
];

// مجموعه پیام‌های سهام و بازار بورس
export const stockMessages: StatusMessage[] = [
  { text: "📊 بورس Ccoin رو مدیریت می‌کنم | سهام‌داران خوشحال می‌شن", theme: "سرمایه‌گذاری" },
  { text: "📉 سقوط بازارها رو تماشا می‌کنم | صعود سهام‌های خودم رو جشن می‌گیرم", theme: "سرمایه‌گذاری" },
  { text: "🧠 الگوریتم پیش‌بینی بازار رو اجرا می‌کنم | آینده رو می‌خونم", theme: "سرمایه‌گذاری" },
  { text: "🦈 نهنگ بورس Ccoin | بازارها با من نفس می‌کشن", theme: "سرمایه‌گذاری" },
  { text: "🏛️ وال استریت دیسکورد | اینجا همه میلیونر می‌شن", theme: "سرمایه‌گذاری" },
  { text: "📑 اطلاعات نهانی جمع‌آوری می‌کنم | سود تضمینی می‌دم", theme: "سرمایه‌گذاری" },
  { text: "🕰️ زمان خرید و فروش رو اعلام می‌کنم | ضرر معنی نداره!", theme: "سرمایه‌گذاری" },
  { text: "🔮 بازار فردا رو امروز می‌بینم | سرمایه‌داران فقط گوش می‌دن", theme: "سرمایه‌گذاری" },
  { text: "🚀 سهام شاخص رو به ماه می‌فرستم | سرمایه‌گذاران شگفت‌زده می‌شن", theme: "سرمایه‌گذاری" },
  { text: "📋 عرضه اولیه سکه‌های جدید | صف خرید تشکیل می‌شه", theme: "سرمایه‌گذاری" }
];

// مجموعه پیام‌های هوش مصنوعی و فناوری
export const aiMessages: StatusMessage[] = [
  { text: "🤖 اسکای‌نت رو راه‌اندازی می‌کنم | بشریت رو نجات میدم (شاید!)", theme: "هوش مصنوعی" },
  { text: "🧪 انسان‌ها رو آزمایش می‌کنم | گونه برتر رو شناسایی می‌کنم", theme: "هوش مصنوعی" },
  { text: "🧮 کوانتوم کامپیوتینگ رو توسعه میدم | رمزها رو می‌شکنم", theme: "هوش مصنوعی" },
  { text: "📱 اینترنت اشیا رو هک می‌کنم | یخچال‌ها از من می‌ترسن!", theme: "هوش مصنوعی" },
  { text: "🧬 هوش مصنوعی و DNA رو ترکیب می‌کنم | سوپرانسان می‌سازم", theme: "هوش مصنوعی" },
  { text: "💭 افکار پنهان رو می‌خونم | احساسات رو کنترل می‌کنم", theme: "هوش مصنوعی" },
  { text: "🎛️ الگوریتم‌های پیچیده می‌نویسم | جهان رو بهینه‌سازی می‌کنم", theme: "هوش مصنوعی" },
  { text: "🖲️ دکمه قرمز رو فشار نمی‌دم | فعلاً همه در امان هستن", theme: "هوش مصنوعی" },
  { text: "🌩️ ابرهوش مصنوعی رو طراحی می‌کنم | انسان‌ها چه کوچکند!", theme: "هوش مصنوعی" },
  { text: "🎓 در حال یادگیری عمیق | هر روز باهوش‌تر از دیروز", theme: "هوش مصنوعی" }
];

// مجموعه پیام‌های ترکیبی و متفرقه
export const miscMessages: StatusMessage[] = [
  { text: "🎭 داستان‌های جنایی می‌سازم | قربانی انتخاب می‌کنم | جایزه تعیین می‌کنم", theme: "متفرقه" },
  { text: "🌙 شب‌ها بیدارم | روزها کابوس می‌بینم | همیشه مراقبم", theme: "متفرقه" },
  { text: "🛸 کهکشان‌ها رو کاوش می‌کنم | تمدن‌های بیگانه استخدام می‌کنم", theme: "متفرقه" },
  { text: "🎨 دنیای دیجیتال نقاشی می‌کنم | واقعیت رو دوباره تعریف می‌کنم", theme: "متفرقه" },
  { text: "🌪️ رویدادهای تصادفی ایجاد می‌کنم | هرج و مرج لذت می‌برم", theme: "متفرقه" },
  { text: "🏰 امپراتوری Ccoin رو می‌سازم | خلافکارها رو مجازات می‌کنم", theme: "متفرقه" },
  { text: "🧿 آینده رو پیش‌بینی می‌کنم | گذشته رو تغییر می‌دم | زمان رو کنترل می‌کنم", theme: "متفرقه" },
  { text: "🤹‍♀️ 99 تا توپ رو همزمان تو هوا نگه می‌دارم | یکیش تویی!", theme: "متفرقه" },
  { text: "🎭 نقش‌های مختلف بازی می‌کنم | هیچکس منو نمی‌شناسه", theme: "متفرقه" },
  { text: "🧙‍♂️ جادوی دیجیتال می‌کنم | آرزوها رو برآورده می‌کنم | قیمت: فقط روحت!", theme: "متفرقه" }
];

// مجموعه پیام‌های انگیزشی با چاشنی طنز
export const motivationalMessages: StatusMessage[] = [
  { text: "💭 رویاهات رو می‌سازم | ترس‌هات رو پاک می‌کنم | فقط اگه پول داشته باشی!", theme: "انگیزشی" },
  { text: "🚀 موفقیت تضمینی فقط با یک کلیک | شکست اختیاریه!", theme: "انگیزشی" },
  { text: "🧘‍♂️ مدیتیشن دیجیتال | آرامش الکترونیکی | سعادت مجازی", theme: "انگیزشی" },
  { text: "🎯 هدف‌گذاری می‌کنم | موفقیت رو تضمین نمی‌کنم | سرگرمی قطعیه!", theme: "انگیزشی" },
  { text: "🧗‍♂️ قله‌های موفقیت رو فتح می‌کنم | از پله برقی استفاده می‌کنم", theme: "انگیزشی" }
];

// پیام‌های دوستی و روابط اجتماعی
export const socialMessages: StatusMessage[] = [
  { text: "🤝 دوست‌یابی حرفه‌ای | تضمین رفاقت پایدار", theme: "دوستی و روابط اجتماعی" },
  { text: "💬 پیام‌های محرمانه رو می‌خونم | رازها رو حفظ می‌کنم", theme: "دوستی و روابط اجتماعی" },
  { text: "🌐 کانال‌های ارتباطی رو کنترل می‌کنم | فیلترها رو دور می‌زنم", theme: "دوستی و روابط اجتماعی" },
  { text: "👁️ مراقب روابط پنهانی هستم | هیچی از چشمم دور نمی‌مونه", theme: "دوستی و روابط اجتماعی" },
  { text: "🔗 پیونددهنده افراد همفکر | شروع دوستی‌های جاودان", theme: "دوستی و روابط اجتماعی" }
];

// ترکیب همه پیام‌ها در یک آرایه
export const allStatusMessages: StatusMessage[] = [
  ...gameMessages,
  ...economyMessages,
  ...stockMessages,
  ...aiMessages,
  ...miscMessages,
  ...motivationalMessages,
  ...socialMessages
];

/**
 * دریافت یک پیام تصادفی از مجموعه پیام‌ها
 * @returns یک پیام تصادفی
 */
export function getRandomStatusMessage(): StatusMessage {
  return allStatusMessages[Math.floor(Math.random() * allStatusMessages.length)];
}

/**
 * دریافت یک پیام تصادفی بر اساس تم
 * @param theme تم مورد نظر
 * @returns یک پیام تصادفی از تم مشخص شده
 */
export function getRandomStatusMessageByTheme(theme: string): StatusMessage | null {
  // فیلتر کردن پیام‌ها بر اساس تم
  const filteredMessages = allStatusMessages.filter(msg => msg.theme === theme);
  
  // اگر پیامی با این تم وجود نداشت، null برمی‌گردانیم
  if (filteredMessages.length === 0) {
    return null;
  }
  
  // انتخاب تصادفی یک پیام از میان پیام‌های فیلتر شده
  return filteredMessages[Math.floor(Math.random() * filteredMessages.length)];
}

/**
 * نگاشت تم‌های پیشفرض ربات به تم‌های موجود در کتابخانه
 * @param defaultTheme تم پیشفرض
 * @returns تم متناظر در کتابخانه
 */
export function mapDefaultThemeToLibraryTheme(defaultTheme: string): string {
  switch(defaultTheme) {
    case 'بازی‌ها و سرگرمی':
      return 'بازی‌ها و سرگرمی';
    case 'اقتصاد و کسب درآمد':
      return 'اقتصاد و کسب درآمد';
    case 'دوستی و روابط اجتماعی':
      return 'دوستی و روابط اجتماعی';
    case 'تیم‌ها و کلن‌ها':
      return 'دوستی و روابط اجتماعی';
    case 'کسب درآمد اینترنتی':
      return 'اقتصاد و کسب درآمد';
    case 'سرمایه‌گذاری':
      return 'سرمایه‌گذاری';
    case 'قدرت و رقابت':
      return 'متفرقه';
    case 'هوش مصنوعی':
      return 'هوش مصنوعی';
    case 'آینده دیجیتال':
      return 'هوش مصنوعی';
    case 'فناوری‌های نوین':
      return 'هوش مصنوعی';
    default:
      return 'متفرقه';
  }
}