# 🤖 Telegram Content Aggregator Bot (Cloudflare Workers)

[فارسی (Persian)](#فارسی) | [English](#english)

---

<a name="فارسی"></a>
## 🇮🇷 راهنمای فارسی

این مخزن شامل کد کامل ربات هوشمند تلگرام برای تجمیع و بازنشر محتوا از کانال‌های عمومی تلگرام بدون نیاز به سرور مجازی و بر پایه **Cloudflare Workers** می‌باشد.

### 📁 کدام فایل‌ها برای گیت‌هاب و دیپلوی اصلی ربات لازم است؟
تمامی فایل‌های عملیاتی ربات در پوشه **`cloudflare-bot/`** قرار دارند:
- `cloudflare-bot/worker.js`: کد اصلی ورکر و منطق ربات
- `cloudflare-bot/wrangler.toml`: فایل تنظیمات دیپلوی کلادفلد
- `cloudflare-bot/schema.sql`: ساختار جداول دیتابیس D1
- `cloudflare-bot/panel/index.html`: پنل مدیریت وب مستقل با تم تاریک/روشن و بهینه برای موبایل
- `cloudflare-bot/ARCHITECTURE.md`: مستندات ساختار فنی و دیتابیس نسخه ۴
- `cloudflare-bot/DEPLOYMENT.md`: راهنمای دیپلوی دستی در داشبورد کلادفلد
- `cloudflare-bot/README.fa.md`: راهنمای کامل فارسی
- `cloudflare-bot/README.en.md`: راهنمای کامل انگلیسی

> **نکته:** فایل‌های روت پروژه (`src/`، `package.json` اصلی، `index.html` اصلی و ...) مربوط به محیط پیش‌نمایش است و برای استقرار ربات در کلادفلد نیازی به آن‌ها ندارید. می‌توانید در گیت‌هاب تنها محتویات پوشه `cloudflare-bot/` را در شاخه اصلی (Root) قرار دهید.

برای مطالعه توضیحات کامل و مراحل راه‌اندازی، لطفاً **[cloudflare-bot/README.fa.md](cloudflare-bot/README.fa.md)** را مطالعه فرمایید.

---

<a name="english"></a>
## 🇬🇧 English Documentation

A serverless, production-grade Telegram bot that scrapes public channels, filters posts, checks for duplicate content using SHA-256 hashes, filters out advertisements, applies AI-driven keywords, and forwards curated posts to your channel or group.

### 📁 Which files are needed for the Bot deployment?
All core bot files reside in the **`cloudflare-bot/`** folder:
- `cloudflare-bot/worker.js`: Cloudflare Worker logic, Telegram bot handlers, Cron trigger, and Admin API
- `cloudflare-bot/wrangler.toml`: Wrangler deployment configuration
- `cloudflare-bot/schema.sql`: D1 SQLite database schema (v4)
- `cloudflare-bot/panel/index.html`: Standalone Web Admin Panel with Dark/Light theme and mobile responsive UI
- `cloudflare-bot/ARCHITECTURE.md`: Architecture specification
- `cloudflare-bot/DEPLOYMENT.md`: Step-by-step Cloudflare Dashboard deployment manual
- `cloudflare-bot/README.fa.md`: Persian documentation
- `cloudflare-bot/README.en.md`: English documentation

For setup instructions, please see **[cloudflare-bot/README.en.md](cloudflare-bot/README.en.md)**.
