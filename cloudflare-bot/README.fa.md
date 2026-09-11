# 🤖 ربات تجمیع‌کننده محتوای تلگرام

رباتی که کانال‌های عمومی تلگرام را می‌خواند، محتوای جدید را فیلتر می‌کند و به مقصد شما ارسال می‌کند. کاملاً رایگان، بدون سرور، مبتنی بر Cloudflare Workers.

## ✨ امکانات

- **اسکن هوشمند** کانال‌های عمومی از `t.me/s/`
- **سه حالت فیلتر**: فوروارد، عمیق (کلیدواژه)، وایرال (بازدید)
- **سیستم ضد تبلیغات** خودکار — تشخیص و رد پست‌های تبلیغاتی
- **ضدتکراری SHA-256** — هیچ پستی دو بار ارسال نمی‌شود
- **هوش مصنوعی** — تحلیل کلیدواژه با Gemini API (یا Workers AI به‌عنوان fallback)
- **گزارش روزانه** هوشمند با هوش مصنوعی
- **پنل مدیریت تحت وب** با نمودار و آمار
- **سیستم ادمین فرعی** با دسترسی‌های قابل تنظیم
- **بکاپ و بازیابی** با یک کلیک

## 🚀 نصب

### پیش‌نیازها
- حساب Cloudflare (رایگان)
- ربات تلگرام (از [@BotFather](https://t.me/BotFather))
- کلید API Gemini (رایگان از [Google AI Studio](https://aistudio.google.com/app/apikey))

### مراحل

۱. فایل `wrangler.toml.example` را به `wrangler.toml` تغییر نام دهید و مقادیر را پر کنید.

۲. منابع Cloudflare را بسازید:
```bash
wrangler d1 create aggregator
wrangler kv namespace create AGGREGATOR
wrangler d1 execute aggregator --file=./schema.sql
```

۳. متغیرهای حساس را تنظیم کنید:
```bash
wrangler secret put BOT_TOKEN
wrangler secret put PANEL_PASSWORD
wrangler secret put GEMINI_API_KEY
```

۴. دیپلوی کنید:
```bash
wrangler deploy
```

۵. آدرس `https://your-worker.workers.dev/setup-commands` را در مرورگر باز کنید تا دستورات در تلگرام ثبت شوند.

## 📋 دستورات

| دستور | توضیح |
|------|--------|
| `/start` | شروع و نمایش منو |
| `/addsource` | افزودن منبع جدید |
| `/listsources` | لیست منابع |
| `/scansingle` | اسکن یک منبع |
| `/scan` | اسکن همه منابع |
| `/adblock` | مدیریت سیستم ضد تبلیغات |
| `/aianalyze` | تحلیل کلیدواژه با هوش مصنوعی |
| `/report` | گزارش روزانه |
| `/stats` | آمار کلی |
| `/backup` | دریافت فایل بکاپ |
| `/restore` | بازیابی از بکاپ |
| `/help` | راهنما |

## 🌐 پنل مدیریت

پس از دیپلوی، به آدرس `https://your-worker.workers.dev/panel` بروید و با رمز عبور وارد شوید.

## 🛠 تکنولوژی‌ها

- **Cloudflare Workers** — محیط اجرا
- **D1** — دیتابیس SQLite
- **Workers KV** — کش و سشن
- **Gemini API** — هوش مصنوعی
- **Telegram Bot API** — ربات

## 📄 لایسنس

MIT
