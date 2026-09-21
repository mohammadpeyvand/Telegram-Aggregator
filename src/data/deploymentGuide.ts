export interface DeploymentStep {
  id: string;
  stepNumber: number;
  title: string;
  badge: string;
  description: string;
  substeps: string[];
  codeBlock?: string;
  warning?: string;
}

export const DEPLOYMENT_STEPS: DeploymentStep[] = [
  {
    id: 'd1-database',
    stepNumber: 1,
    title: 'آماده‌سازی دیتابیس Cloudflare D1',
    badge: 'D1 Database',
    description: 'اگر اولین بار است ربات را می‌سازید یک دیتابیس جدید بسازید؛ اگر از قبل دیتابیس دارید، کوئری‌های مایگریشن را اجرا کنید.',
    substeps: [
      'به داشبورد Cloudflare بروید و از منوی سمت چپ وارد Workers & Pages > D1 SQL Database شوید.',
      'روی دکمه Create database کلیک کنید و نام آن را مثلاً aggregator قرار دهید.',
      'وارد دیتابیس شده و به تب Console بروید.',
      'اگر دیتابیس جدید است: تمام محتوای فایل schema.sql را چسبانده و دکمه Execute را بزنید.',
      'اگر دیتابیس از قبل وجود دارد: فقط دستورات موجود در تب «کدهای مایگریشن» را در Console اجرا کنید تا ستون‌ها و جداول جدید بدون پاک شدن داده‌ها اضافه شوند.'
    ],
    codeBlock: `wrangler d1 execute aggregator --file=./cloudflare-bot/schema.sql`
  },
  {
    id: 'worker-code',
    stepNumber: 2,
    title: 'ساخت و بارگذاری Worker',
    badge: 'Cloudflare Worker',
    description: 'ساخت ورکر و جایگذاری کد اصلی (worker.js).',
    substeps: [
      'به بخش Workers & Pages > Overview بروید و روی Create application > Create Worker کلیک کنید.',
      'نام ورکر را تعیین کنید (مثلاً telegram-aggregator) و روی Deploy کلیک کنید.',
      'روی دکمه Edit code (یا Quick Edit) کلیک کنید تا ادیتور تحت وب باز شود.',
      'تمام محتوای فایل worker.js را کپی کرده و جایگزین محتوای ادیتور کنید.',
      'دکمه Deploy (یا Save and Deploy) در گوشه بالا سمت راست را بزنید.'
    ]
  },
  {
    id: 'bindings',
    stepNumber: 3,
    title: 'اتصال دیتابیس D1 و KV به Worker (Bindings)',
    badge: 'Bindings',
    description: 'بسیار مهم: ورکر برای دسترسی به دیتابیس نیاز به تعریف Binding به نام دقیق DB دارد.',
    substeps: [
      'در صفحه ورکر خود، به تب Settings و سپس زیرمنوی Bindings (یا Variables and Secrets) بروید.',
      'در بخش D1 Database Bindings روی Add کلیک کنید.',
      'نام Variable name را دقیقاً برابر با DB قرار دهید (با حروف بزرگ).',
      'دیتابیس D1 ساخته‌شده در مرحله اول (مثلاً aggregator) را انتخاب و ذخیره کنید.',
      'اختیاری (برای سشن‌ها و کش): در بخش KV Namespace Bindings یک بایندینگ با نام KV به فضای KV اختصاص دهید.'
    ]
  },
  {
    id: 'env-vars',
    stepNumber: 4,
    title: 'تنظیم متغیرهای محیطی و کلیدهای محرمانه (Environment Variables)',
    badge: 'Secrets & Env',
    description: 'تنظیم توکن ربات تلگرام، آیدی ادمین، آدرس پنل مینی‌اپ، رمز پنل و کلید هوش مصنوعی.',
    substeps: [
      'در صفحه ورکر به تب Settings > Variables and Secrets بروید.',
      'روی Add در بخش Environment Variables کلیک کنید و مقادیر جدول زیر را وارد کنید.',
      'متغیر PANEL_URL (بسیار مهم): آدرس ورکر خود را با پسوند /panel قرار دهید (مثلاً https://telegram-aggregator.YOUR_SUBDOMAIN.workers.dev/panel) تا دکمه Mini App در تلگرام به صورت کاملاً خودکار و تمیز فعال شود و نیازی به هیچ تنظیم دستی در چت تلگرام نباشد.',
      'متغیر MAIN_ADMIN_ID: آیدی عددی ادمین اصلی را به صورت Text وارد کنید.',
      'برای BOT_TOKEN و PANEL_PASSWORD توصیه می‌شود نوع را Secret (رمزگذاری‌شده) انتخاب کنید.'
    ]
  },
  {
    id: 'cron-triggers',
    stepNumber: 5,
    title: 'تنظیم زمان‌بندی خودکار (Cron Triggers)',
    badge: 'Cron Triggers',
    description: 'اسکن منظم کانال‌ها، تحلیل کلمات کلیدی هوش مصنوعی و ارسال گزارش روزانه.',
    substeps: [
      'در صفحه ورکر به تب Settings و سپس Triggers بروید.',
      'به بخش Cron Triggers اسکرول کرده و روی Add Cron Trigger کلیک کنید.',
      'کرون اصلی: */2 * * * * (هر ۲ دقیقه یک‌بار برای اسکن کانال‌ها)',
      'کرون هوش مصنوعی: 30 22 * * * (تحلیل شبانه موضوعات)',
      'کرون گزارش روزانه: 30 23 * * * (ارسال آمار ۲۴ ساعته به ادمین)'
    ],
    codeBlock: `*/2 * * * *\n30 22 * * *\n30 23 * * *`
  },
  {
    id: 'deploy-panel',
    stepNumber: 6,
    title: 'نحوه دسترسی به پنل مدیریت و Telegram Mini App',
    badge: 'Mini App & Web',
    description: 'پنل مدیریت به صورت پیش‌فرض درون خود ورکر در مسیر /panel تعبیه شده است و همچنین روی Cloudflare Pages نیز قابل دیپلوی است.',
    substeps: [
      'روش ۱ (مستقیم در ورکر — پیشنهادی): مسیر /panel در ورکر شما مستقیماً پنل را باز می‌کند. با ست کردن متغیر PANEL_URL به آدرس ورکر خود (مثلاً https://my-bot.workers.dev/panel)، تلگرام دکمه مینی‌اپ را به شکل مستقیم نمایش می‌دهد.',
      'روش ۲ (Cloudflare Pages): در صورت تمایل به هاست مجزا، می‌توانید فایل panel/index.html را در Cloudflare Pages با Direct Upload دیپلوی کنید و سپس آدرس Pages را در متغیر PANEL_URL قرار دهید.'
    ]
  },
  {
    id: 'activate-commands',
    stepNumber: 7,
    title: 'راه‌اندازی نهایی و ثبت دستورات در تلگرام',
    badge: 'Final Setup',
    description: 'ثبت منوی دستورات و وبهوک در تلگرام با یک کلیک.',
    substeps: [
      'آدرس ورکر خود را در مرورگر باز کرده و انتهای آن عبارت /setup-commands را اضافه کنید:',
      'مثال: https://telegram-aggregator.<subdomain>.workers.dev/setup-commands',
      'پیام تایید «✅ دستورات در تلگرام ثبت شد» نمایش داده می‌شود.',
      'اکنون در ربات تلگرام دستور /start را ارسال کنید تا ربات و دکمه Mini App شروع به کار کنند!'
    ]
  }
];

export const ENV_VARS = [
  { name: 'BOT_TOKEN', type: 'Secret', required: true, desc: 'توکن ربات تلگرام از @BotFather', example: '123456789:ABCdef...' },
  { name: 'MAIN_ADMIN_ID', type: 'Text / Env', required: true, desc: 'آیدی عددی تلگرام ادمین اصلی (از @userinfobot)', example: '987654321' },
  { name: 'PANEL_URL', type: 'Text / Env', required: false, desc: 'آدرس مستقیم پنل مینی‌اپ در ورکر (مثلاً https://my-bot.workers.dev/panel) جهت فعال‌سازی خودکار دکمه WebApp تلگرام', example: 'https://telegram-aggregator.xyz.workers.dev/panel' },
  { name: 'PANEL_PASSWORD', type: 'Secret', required: true, desc: 'رمز عبور ورود به پنل تحت وب', example: 'MyStrongPass@2026' },
  { name: 'GEMINI_API_KEY', type: 'Secret', required: false, desc: 'کلید رایگان Gemini API از Google AI Studio برای ویژگی‌های هوشمند', example: 'AIzaSy...' }
];
