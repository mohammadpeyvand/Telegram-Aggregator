/**
 * ============================================================================
 *  Telegram Content Aggregator Bot  —  Cloudflare Worker (موتور پردازشی)
 * ----------------------------------------------------------------------------
 *  نویسنده: برای انتشار در GitHub
 *  پشته: Cloudflare Workers + D1 (SQLite) + KV ( dedup / session )
 *
 *  متغیرها (Environment):
 *    BOT_TOKEN        (secret)  - توکن ربات تلگرام از BotFather
 *    MAIN_ADMIN_ID    (var)     - آیدی عددی ادمین اصلی
 *    PANEL_PASSWORD   (secret)  - رمز عبور پنل تحت وب
 *    DB               (D1)      - دیتابیس منابع/ادمین‌ها/لاگ‌ها
 *    KV               (KV)      - هش ضدتکراری + سشن پنل + ایندکس اسکن
 *
 *  مسیرها (Routes):
 *    POST /webhook            - وب‌هوک تلگرام
 *    GET  /                   - بررسی سلامت (health)
 *    /api/*                   - API پنل مدیریت (CORS فعال)
 * ============================================================================
 */

// ─── ثابت‌های پیکربندی ──────────────────────────────────────────────────────
const DEDUP_TTL = 604800;        // ۷ روز (ثانیه)
const SESSION_TTL = 86400;       // ۲۴ ساعت
const SCRAPE_TIMEOUT = 12000;    // میلی‌ثانیه
const BOT_API = 'https://api.telegram.org/bot';
const REACTION_EMOJI = '🫡';
const POSTS_PER_SCAN = 20;       // حداکثر پست بررسی‌شده در هر اسکن

// ─── ورودی اصلی ──────────────────────────────────────────────────────────────
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // پیش‌پاسخ CORS برای پنل (روی Pages)
    if (request.method === 'OPTIONS') return cors(request);

    // وب‌هوک تلگرام
    if (url.pathname === '/webhook' && request.method === 'POST') {
      return handleWebhook(request, env, ctx);
    }

    // سلامت سیستم
    if (url.pathname === '/' || url.pathname === '/health') {
      return json({ ok: true, name: 'telegram-aggregator', ts: Date.now() });
    }

    // ثبت لیست دستورات در تلگرام (برای نمایش پیشنهادات هنگام تایپ /)
    // یک‌بار بعد از دیپلوی این آدرس را در مرورگر باز کنید:
    //   https://<your-worker>.workers.dev/setup-commands
    if (url.pathname === '/setup-commands') {
      return setupCommands(env);
    }

    // API پنل
    if (url.pathname.startsWith('/api/')) {
      return handleApi(request, env, url);
    }

    return json({ error: 'Not Found' }, 404);
  },

  // ─── تریگر زمان‌بندی‌شده (Cron) ───
  async scheduled(event, env, ctx) {
    const cron = event.cron;
    if (cron === '*/2 * * * *') {
      // اسکن منظم هر ۲ دقیقه
      ctx.waitUntil(runCron(env));
    } else if (cron === '30 22 * * *') {
      // تحلیل AI هر روز ساعت ۲ بامداد ایران (۲۲:۳۰ UTC)
      ctx.waitUntil(runAIAnalysis(env));
    } else if (cron === '30 23 * * *') {
      // گزارش روزانه هر شب ساعت ۳ ایران (۲۳:۳۰ UTC)
      ctx.waitUntil(runDailyReport(env));
    }
  },
};

// ===========================================================================
//  Telegram Bot API — توابع کمکی
// ===========================================================================
async function tg(method, params, env) {
  try {
    const res = await fetch(`${BOT_API}${env.BOT_TOKEN}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return await res.json();
  } catch (e) {
    console.error('TG API error', method, e);
    return { ok: false, error: e.message };
  }
}

async function react(chatId, messageId, env) {
  await tg('setMessageReaction', { chat_id: chatId, message_id: messageId, reaction: [{ type: 'emoji', emoji: REACTION_EMOJI }] }, env);
}

// ─── ثبت لیست دستورات در تلگرام ─────────────────────────────────────────────
// این تابع setMyCommands را فراخوانی می‌کند تا وقتی کاربر / را در چات تایپ
// می‌کند، تلگرام لیست دستورات ربات را به‌صورت منوی پیشنهادی نمایش دهد.
// باید یک‌بار بعد از دیپلوی اجرا شود (از طریق مسیر /setup-commands).
async function setupCommands(env) {
  const commands = [
    { command: 'start', description: 'شروع و نمایش منو' },
    { command: 'help', description: 'راهنمای دسته‌بندی‌شده' },
    { command: 'ping', description: 'تست فعال بودن ربات در این چت' },
    { command: 'check', description: 'بررسی وضعیت نصب و ادمین بودن ربات' },
    { command: 'addsource', description: 'افزودن منبع جدید (با موضوع)' },
    { command: 'settopic', description: 'تنظیم موضوع یک منبع' },
    { command: 'settarget', description: 'تغییر مقصد یک منبع (چت + تاپیک)' },
    { command: 'delsource', description: 'حذف منبع' },
    { command: 'scansingle', description: 'اسکن یک منبع خاص' },
    { command: 'listsources', description: 'نمایش لیست منابع' },
    { command: 'scan', description: 'اسکن فوری همه منابع' },
    { command: 'aianalyze', description: 'تحلیل کلیدواژه با AI' },
    { command: 'report', description: 'گزارش روزانه هوشمند' },
    { command: 'stats', description: 'نمایش آمار کلی' },
    { command: 'adblock', description: 'مدیریت سیستم ضد تبلیغات' },
    { command: 'balancad', description: 'گزارش پست پاک — کاهش وزن' },
    { command: 'backup', description: 'دریافت فایل بکاپ' },
    { command: 'restore', description: 'بازیابی از فایل بکاپ' },
    { command: 'addadmin', description: 'افزودن ادمین فرعی' },
    { command: 'deladmin', description: 'حذف ادمین فرعی' },
    { command: 'admins', description: 'لیست ادمین‌ها' },
    { command: 'setpermissions', description: 'تنظیم دسترسی ادمین فرعی' },
    { command: 'cancel', description: 'لغو عملیات جاری' },
  ];
  const res = await tg('setMyCommands', { commands }, env);
  if (res.ok) {
    return json({
      ok: true,
      message: `✅ ${commands.length} دستور در تلگرام ثبت شد.`,
      hint: 'حالا در چات تلگرام / را تایپ کنید — منوی دستورات ظاهر می‌شود.',
      commands: commands.map(c => `/${c.command}`),
    });
  }
  return json({ ok: false, error: res.description || 'خطا در ثبت دستورات' }, 500);
}

// تمام پیام‌های ربات باید در همان تاپیکی فرستاده شوند که کاربر در آن دستور زده.
// sendMsg پارامتر threadId می‌گیرد — اگر NULL باشد، هیچ تاپیکی ست نمی‌شود.
async function sendMsg(chatId, text, env, keyboard = null, parseMode = 'HTML', threadId = null) {
  const params = { chat_id: chatId, text, parse_mode: parseMode, disable_web_page_preview: true };
  if (keyboard) params.reply_markup = keyboard;
  if (threadId) params.message_thread_id = threadId;
  return tg('sendMessage', params, env);
}

// پیام ویزارد که نیاز به پاسخ متنی دارد — از force_reply استفاده می‌کند
// تا حتی با فعال بودن Privacy Mode ربات، پیام کاربر دریافت شود.
// کاربر باید روی پیام ربات Reply بزند و متن را بنویسد.
async function sendWizardPrompt(chatId, text, env, threadId = null) {
  const params = {
    chat_id: chatId,
    text: text + '\n\n💡 برای پاسخ، روی این پیام <b>Reply</b> بزنید و متن را بنویسید.\n(برای لغو: /cancel)',
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    reply_markup: { force_reply: true, selective: true },
    allow_sending_without_reply: true,
  };
  if (threadId) params.message_thread_id = threadId;
  return tg('sendMessage', params, env);
}

async function editMsg(chatId, messageId, text, env, keyboard = null) {
  const params = { chat_id: chatId, message_id: messageId, text, parse_mode: 'HTML', disable_web_page_preview: true };
  if (keyboard) params.reply_markup = keyboard;
  return tg('editMessageText', params, env);
}

async function answerCb(cbId, text, env, showAlert = false) {
  await tg('answerCallbackQuery', { callback_query_id: cbId, text, show_alert: showAlert }, env);
}

async function sendDocument(chatId, fileContent, filename, env, threadId = null) {
  const formData = new FormData();
  formData.append('chat_id', chatId);
  if (threadId) formData.append('message_thread_id', String(threadId));
  formData.append('document', new Blob([fileContent], { type: 'application/json' }), filename);
  const res = await fetch(`${BOT_API}${env.BOT_TOKEN}/sendDocument`, { method: 'POST', body: formData });
  return res.json();
}

// ===========================================================================
//  احراز هویت ادمین‌ها
// ===========================================================================
async function isAdmin(userId, env) {
  const id = String(userId);
  if (String(env.MAIN_ADMIN_ID) === id) return true;
  const row = await env.DB.prepare('SELECT 1 FROM admins WHERE user_id = ?').bind(id).first();
  return !!row;
}

// ─── سیستم دسترسی ادمین‌ها ─────────────────────────────────────────────────
// ادمین اصلی: Full Access (همه دستورات)
// ادمین فرعی: محدود — فقط دستوراتی که در permissions فعال هستند

// لیست دستوراتی که ادمین فرعی به‌صورت پیش‌فرض محدود است (نباید دسترسی داشته باشد)
// مگر اینکه ادمین اصلی دسترسی داده باشد
const RESTRICTED_COMMANDS = [
  'addsource', 'editsource', 'settarget', 'delsource',
  'scansingle', 'scan', 'settopic',
  'addadmin', 'deladmin', 'restore',
  'report', 'aianalyze', 'ai_approve',
  'setpermissions',
];

// بررسی دسترسی ادمین به یک دستور
async function checkPermission(userId, command, env) {
  const id = String(userId);
  // ادمین اصلی = Full Access
  if (String(env.MAIN_ADMIN_ID) === id) return true;
  // اگر دستور محدود نیست (مثل help, ping, check, stats, backup, listsources, cancel, addadmin) → اجازه
  if (!RESTRICTED_COMMANDS.includes(command)) return true;
  // ادمین فرعی — بررسی permissions
  const row = await env.DB.prepare('SELECT permissions FROM admins WHERE user_id = ?').bind(id).first();
  if (!row) return false; // ادمین نیست
  let perms = {};
  try { perms = JSON.parse(row.permissions || '{}'); } catch {}
  // اگر دستور در permissions با true ست شده → اجازه
  return perms[command] === true;
}

// گرفتن لیست دسترسی‌های یک ادمین
async function getPermissions(userId, env) {
  const id = String(userId);
  if (String(env.MAIN_ADMIN_ID) === id) {
    // ادمین اصلی = همه دسترسی‌ها
    const full = {};
    RESTRICTED_COMMANDS.forEach(c => full[c] = true);
    return full;
  }
  const row = await env.DB.prepare('SELECT permissions FROM admins WHERE user_id = ?').bind(id).first();
  if (!row) return {};
  try { return JSON.parse(row.permissions || '{}'); } catch { return {}; }
}

// تنظیم دسترسی یک ادمین
async function setPermissions(userId, permissions, env) {
  await env.DB.prepare('UPDATE admins SET permissions = ? WHERE user_id = ?')
    .bind(JSON.stringify(permissions), String(userId)).run();
}

// ─── ثبت فعالیت ادمین ──────────────────────────────────────────────────────
async function logAdminActivity(adminId, action, detail, env, sourceId = null) {
  await env.DB.prepare(
    'INSERT INTO admin_activity (admin_id, action, detail, source_id, created_at) VALUES (?,?,?,?,?)'
  ).bind(String(adminId), action, detail || '', sourceId, Date.now()).run();
  // ارسال نوتیفیکیشن به ادمین اصلی
  const adminIdMain = env.MAIN_ADMIN_ID;
  const actionLabels = {
    addsource: '➕ افزودن منبع',
    delsource: '🗑 حذف منبع',
    settarget: '🔁 تغییر مقصد',
    settopic: '📝 تنظیم موضوع',
    scansingle: '🔍 اسکن تک‌منبع',
    scan: '🔄 اسکن همه',
    aianalyze: '🤖 تحلیل AI',
    ai_approve: '✅ تأیید کلیدواژه AI',
    restore: '📥 بازیابی بکاپ',
  };
  const label = actionLabels[action] || action;
  let msg = `🔔 <b>فعالیت ادمین فرعی</b>\n\n`;
  msg += `👤 ادمین: <code>${adminId}</code>\n`;
  msg += `📋 عمل: ${label}`;
  if (detail) msg += `\n📝 ${detail}`;
  if (sourceId) msg += `\n🆔 منبع: ${sourceId}`;
  // ارسال بی‌صدا — اگر خطا داد مهم نیست
  try { await sendMsg(adminIdMain, msg, env); } catch {}
}

async function addAdmin(userId, by, env) {
  await env.DB.prepare('INSERT OR IGNORE INTO admins (user_id, added_by, created_at) VALUES (?,?,?)')
    .bind(String(userId), String(by), Date.now()).run();
}

async function removeAdmin(userId, env) {
  await env.DB.prepare('DELETE FROM admins WHERE user_id = ?').bind(String(userId)).run();
}

async function listAdmins(env) {
  return env.DB.prepare('SELECT * FROM admins ORDER BY created_at').all();
}

// ===========================================================================
//  اسکرپ کردن کانال تلگرام (t.me/s/)
// ===========================================================================
async function scrapeChannel(channel) {
  const clean = channel.replace(/^@/, '').replace(/^https?:\/\/t\.me\/s?\//i, '');
  const url = `https://t.me/s/${clean}`;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), SCRAPE_TIMEOUT);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: controller.signal,
    });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    const html = await res.text();
    return { ok: true, posts: parsePosts(html), channel: clean };
  } catch (e) {
    return { ok: false, error: e.message };
  } finally {
    clearTimeout(t);
  }
}

function parsePosts(html) {
  const posts = [];
  const starts = [...html.matchAll(/class="tgme_widget_message_wrap/g)];
  for (let i = 0; i < starts.length; i++) {
    const start = starts[i].index;
    const end = i + 1 < starts.length ? starts[i + 1].index : html.length;
    const block = html.slice(start, end);
    const post = parsePostBlock(block);
    if (post) posts.push(post);
  }
  return posts;
}

function parseReactions(block) {
  const reactions = [];
  if (!block || !block.includes('reaction')) return reactions;
  const itemRegex = /<([a-z]+)[^>]*class="[^"]*tgme_widget_message_reaction\b[^"]*"[^>]*>([\s\S]*?)<\/\1>/gi;
  let match;
  while ((match = itemRegex.exec(block)) !== null) {
    const content = match[2];
    let emoji = '';
    const emojiMatch = content.match(/class="[^"]*tgme_widget_message_reaction_emoji[^"]*"[^>]*>([^<]*)<\//i);
    if (emojiMatch && emojiMatch[1].trim()) emoji = emojiMatch[1].trim();
    if (!emoji) {
      const imgMatch = content.match(/<img[^>]*alt="([^"]+)"/i);
      if (imgMatch && imgMatch[1].trim()) emoji = imgMatch[1].trim();
    }
    if (!emoji) {
      const cleanText = content.replace(/<[^>]+>/g, '').trim();
      const unicodeEmojiMatch = cleanText.match(/(\p{Extended_Pictographic}|\p{Emoji_Presentation})/u);
      if (unicodeEmojiMatch) emoji = unicodeEmojiMatch[1];
    }
    let count = 0;
    const countMatch = content.match(/class="[^"]*tgme_widget_message_reaction_count[^"]*"[^>]*>([^<]+)<\//i);
    if (countMatch) {
      count = parseViews(countMatch[1]);
    } else {
      const cleanText = content.replace(/<[^>]+>/g, ' ').trim();
      const numMatch = cleanText.match(/([\d.]+)\s*([KM]?)/i);
      if (numMatch) count = parseViews(numMatch[0]);
    }
    if (emoji) {
      reactions.push({ emoji, count });
    }
  }
  return reactions;
}

function parsePostBlock(block) {
  const idMatch = block.match(/data-post="([^"]+)"/);
  if (!idMatch) return null;
  const dataPost = idMatch[1]; // channel/123
  const parts = dataPost.split('/');
  const channel = parts[0];
  const msgId = parseInt(parts[1] || '0', 10);

  // متن پست — حفظ فرمت‌بندی تلگرام (bold, italic, spoiler, quote, ...)
  const textMatch = block.match(/class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/);
  let text = '';
  if (textMatch) {
    text = convertTelegramHtml(textMatch[1]);
  }

  // تشخیص ریپلای
  let isReply = false;
  let replyToText = '';
  let replyToAuthor = '';
  if (/tgme_widget_message_reply/.test(block)) {
    isReply = true;
    const replyTextMatch = block.match(/class="tgme_widget_message_reply_text"[^>]*>([\s\S]*?)<\/span>/);
    if (replyTextMatch) replyToText = convertTelegramHtml(replyTextMatch[1]);
    const replyAuthorMatch = block.match(/class="tgme_widget_message_reply_author"[^>]*>([\s\S]*?)<\/a>/);
    if (replyAuthorMatch) replyToAuthor = convertTelegramHtml(replyAuthorMatch[1]);
  }
  if (/quoted_inline_message|tgme_widget_message_quote/.test(block)) {
    isReply = true;
    const quoteMatch = block.match(/class="tgme_widget_message_quote_text"[^>]*>([\s\S]*?)<\/div>/);
    if (quoteMatch) replyToText = convertTelegramHtml(quoteMatch[1]);
  }
  if (!isReply && /tgme_widget_message_link_preview/.test(block)) {
    const previewMatch = block.match(/class="tgme_widget_message_link_preview[^"]*"[^>]*href="([^"]+)"/);
    if (previewMatch && previewMatch[1].includes('t.me/')) {
      isReply = true;
      replyToText = previewMatch[1];
    }
  }

  // نوع رسانه
  let mediaType = 'text';
  if (/tgme_widget_message_photo/.test(block)) mediaType = 'photo';
  else if (/tgme_widget_message_video|tgme_widget_message_video_player/.test(block)) mediaType = 'video';
  else if (/tgme_widget_message_document/.test(block)) mediaType = 'file';
  else if (/tgme_widget_message_audio/.test(block)) mediaType = 'audio';
  else if (/tgme_widget_message_sticker/.test(block)) mediaType = 'sticker';
  else if (/tgme_widget_message_poll/.test(block)) mediaType = 'poll';
  else if (/tgme_widget_message_roundvideo/.test(block)) mediaType = 'video';

  // بازدید
  const viewsMatch = block.match(/class="tgme_widget_message_views[^"]*"[^>]*>([^<]+)</);
  let views = 0;
  if (viewsMatch) views = parseViews(viewsMatch[1]);

  // لینک پست
  let link = `https://t.me/${dataPost}`;
  const linkMatch = block.match(/class="tgme_widget_message_date"[^>]*href="([^"]+)"/)
    || block.match(/class="tgme_widget_message_link"[^>]*href="([^"]+)"/);
  if (linkMatch) link = linkMatch[1];

  // زمان
  const dateMatch = block.match(/datetime="([^"]+)"/);
  const datetime = dateMatch ? dateMatch[1] : null;

  // ری‌اکشن‌ها
  const reactions = parseReactions(block);

  return { dataPost, channel, msgId, text, mediaType, views, reactions, link, datetime, isReply, replyToText, replyToAuthor };
}

function parseViews(str) {
  if (!str) return 0;
  const s = str.trim().replace(/,/g, '');
  const m = s.match(/([\d.]+)\s*([KM]?)/i);
  if (!m) return 0;
  let n = parseFloat(m[1]);
  const unit = (m[2] || '').toUpperCase();
  if (unit === 'K') n *= 1000;
  else if (unit === 'M') n *= 1000000;
  return Math.floor(n);
}

function decodeEntities(s) {
  return s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
}

// ===========================================================================
//  تبدیل HTML صفحه t.me/s به HTML مجاز تلگرام
//  تلگرام فقط این tag ها را پشتیبانی می‌کند:
//    <b> <strong> <i> <em> <u> <ins> <s> <del> <strike>
//    <a href="..."> <code> <pre> <blockquote> <blockquote expandable>
//    <tg-spoiler> (یا <span class="tg-spoiler">)
//  این تابع:
//    1. <br> → \n
//    2. spoiler span ها → <tg-spoiler>
//    3. بقیه span ها → حذف (محتوا حفظ می‌شود)
//    4. tag های مجاز → حفظ (attribute های غیرضروری حذف)
//    5. <a href> → حفظ href
//    6. بقیه tag ها → حذف (محتوا حفظ)
//    7. decode entities
//    8. بالانس کردن tag های باز/بسته
// ===========================================================================
function convertTelegramHtml(html) {
  if (!html) return '';
  let s = html;

  // ۱. <br> → \n
  s = s.replace(/<br\s*\/?>/gi, '\n');

  // ۲. spoiler span → placeholder (بعداً به <tg-spoiler> تبدیل می‌شود)
  s = s.replace(/<span[^>]*class="[^"]*tg-spoiler[^"]*"[^>]*>/gi, '\x01SPOILER_OPEN\x01');
  s = s.replace(/<span[^>]*tg-spoiler[^>]*>/gi, '\x01SPOILER_OPEN\x01');

  // ۳. بقیه span ها → حذف (فقط tag باز)
  s = s.replace(/<span[^>]*>/gi, '');

  // ۴. </span> → placeholder
  s = s.replace(/<\/span>/gi, '\x01SPAN_CLOSE\x01');

  // ۵. جفت کردن spoiler open/close
  s = s.replace(/\x01SPOILER_OPEN\x01([\s\S]*?)\x01SPAN_CLOSE\x01/g, '<tg-spoiler>$1</tg-spoiler>');

  // ۶. بقیه SPAN_CLOSE های جا‌مانده → حذف
  s = s.replace(/\x01SPAN_CLOSE\x01/g, '');
  s = s.replace(/\x01SPOILER_OPEN\x01/g, '<tg-spoiler>'); // fallback: spoiler بدون close

  // ۷. tag های مجاز با attribute اضافی → پاکسازی (فقط نام tag حفظ شود)
  //    مثلاً <i class="..."> → <i>
  s = s.replace(/<(\/?)(b|strong|i|em|u|ins|s|del|strike|code|pre)(\s[^>]*)?>/gi, '<$1$2>');

  // ۸. <a href="..."> — فقط href حفظ شود
  s = s.replace(/<a\s+[^>]*?href="([^"]*)"[^>]*>/gi, '<a href="$1">');
  s = s.replace(/<a\s+href="([^"]*)"[^>]*>/gi, '<a href="$1">');
  s = s.replace(/<a\s+[^>]*?href='([^']*)'[^>]*>/gi, '<a href="$1">');
  // <a> بدون href → حذف
  s = s.replace(/<a(?!\s+href)[^>]*>/gi, '');

  // ۹. <blockquote> — بررسی expandable
  s = s.replace(/<blockquote([^>]*)>/gi, (m, attrs) => /expandable/i.test(attrs) ? '<blockquote expandable>' : '<blockquote>');

  // ۱۰. حذف همه tag های غیرمجاز (محتوای داخلش حفظ می‌شود)
  s = s.replace(/<(?!\/?(?:b|strong|i|em|u|ins|s|del|strike|code|pre|blockquote|a|tg-spoiler)\b)[^>]+>/gi, '');

  // ۱۱. decode entities (تلگرام HTML encode نشده می‌خواهد)
  s = decodeEntities(s);

  // ۱۲. بالانس کردن tag ها (بستن tag های باز جا‌مانده)
  s = balanceHtmlTags(s);

  return s.trim();
}

// بالانس کردن tag های HTML — اطمینان از اینکه هر tag باز، بسته شده
function balanceHtmlTags(html) {
  const stack = [];
  const re = /<(\/?)(b|strong|i|em|u|ins|s|del|strike|code|pre|blockquote|a|tg-spoiler)\b[^>]*>/gi;
  let result = '';
  let lastIdx = 0;
  let match;
  while ((match = re.exec(html)) !== null) {
    result += html.slice(lastIdx, match.index);
    lastIdx = match.index + match[0].length;
    const slash = match[1];
    const tag = match[2].toLowerCase();
    if (slash) {
      // tag بسته
      const idx = stack.lastIndexOf(tag);
      if (idx >= 0) {
        // بستن همه tag های باز تا این tag
        for (let i = stack.length - 1; i > idx; i--) {
          result += `</${stack[i]}>`;
        }
        result += `</${tag}>`;
        stack.length = idx;
      }
      // اگه tag بسته بدون باز متناظر → نادیده
    } else {
      stack.push(tag);
      result += match[0];
    }
  }
  result += html.slice(lastIdx);
  // بستن tag های باز جا‌مانده
  while (stack.length) {
    result += `</${stack.pop()}>`;
  }
  return result;
}

// ===========================================================================
//  سیستم ضدتکراری (KV Hashing با SHA-256)
// ===========================================================================
async function hashPost(postId) {
  const data = new TextEncoder().encode(postId);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

// ⚠️ هش‌های ضدتکراری در D1 ذخیره می‌شوند (نه KV) برای جلوگیری از محدودیت KV write
async function isDuplicate(hash, env) {
  const row = await env.DB.prepare('SELECT 1 FROM dedup WHERE hash = ?').bind(hash).first();
  return !!row;
}

async function markSeen(hash, sourceId, env) {
  await env.DB.prepare('INSERT OR IGNORE INTO dedup (hash, source_id, created_at) VALUES (?,?,?)')
    .bind(hash, sourceId || 0, Date.now()).run();
}

// پاکسازی هش‌های قدیمی‌تر از ۷ روز (جایگزین TTL خودکار KV)
async function cleanupOldHashes(env) {
  const cutoff = Date.now() - DEDUP_TTL * 1000;
  await env.DB.prepare('DELETE FROM dedup WHERE created_at < ?').bind(cutoff).run();
}

async function getLastPost(sourceId, env) {
  const row = await env.DB.prepare('SELECT msg_id FROM lastpost WHERE source_id = ?').bind(sourceId).first();
  return row?.msg_id || 0;
}

async function setLastPost(sourceId, msgId, env) {
  await env.DB.prepare('INSERT OR REPLACE INTO lastpost (source_id, msg_id) VALUES (?,?)')
    .bind(sourceId, msgId).run();
}

// ===========================================================================
//  Normalization (بخش ۵ سند معماری) — استانداردسازی متن برای تحلیل
//  متن اصلی دست‌نخورده باقی می‌ماند — فقط کپی نرمال‌شده برای تحلیل استفاده می‌شود
// ===========================================================================
function normalizeText(text) {
  if (!text) return '';
  let s = String(text);
  // یکسان‌سازی حروف فارسی/عربی:
  // ي → ی (فارسی)
  s = s.replace(/\u064A/g, '\u06CC'); // ي عربی → ی فارسی
  // ك → ک (فارسی)
  s = s.replace(/\u0643/g, '\u06A9'); // ك عربی → ک فارسی
  // حذف اعراب
  s = s.replace(/[\u064B-\u0652\u0670]/g, '');
  // نیم‌فاصله‌ها → فاصله عادی
  s = s.replace(/\u200C/g, ' ');
  // چند فاصله → یکی
  s = s.replace(/\s+/g, ' ');
  // کنترل کاراکترهای نامرئی دیگر
  s = s.replace(/[\u2000-\u200F\u2028-\u202F]/g, '');
  // تبدیل اعداد عربی به فارسی
  s = s.replace(/[\u0660-\u0669]/g, d => '۰۱۲۳۴۵۶۷۸۹'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)]);
  // lowercase
  s = s.toLowerCase();
  return s.trim();
}

// ===========================================================================
//  حالت‌های اسکن (Scan Modes)
// ===========================================================================
/**
 * حالت deep: فیلتر بر اساس کلیدواژه مثبت + منفی
 *  - everyMode = true  => پست باید همه کلیدواژه‌های مثبت را داشته باشد (AND)
 *  - everyMode = false => کافی است حداقل یکی از کلیدواژه‌های مثبت موجود باشد (OR)
 *  - کلمات منفی: اگر حتی یکی در پست باشد، پست رد می‌شود (حتی اگر مثبت هم داشته باشد)
 */
/**
 * ─── Deep Classic (بخش ۱۲ سند معماری) ───
 * قانون‌محور با کلیدواژه‌های مثبت‌کننده / منفی‌کننده.
 *
 * منطق:
 *   اگه Negative Match → Reject (همیشه)
 *   اگه Positive Match:
 *     every_mode = OR → حداقل یکی = Send
 *     every_mode = AND → همه = Send
 *
 * خروجی: { match, reason, found_positive, found_negative, breakdown }
 */
function matchDeep(post, source, normalizedText) {
  const text = (normalizedText || post.text || '').toLowerCase();
  const pos = safeJson(source.keywords_positive, []);
  const neg = safeJson(source.keywords_negative, []);

  const foundNegative = neg.filter(kw => text.includes(String(kw).toLowerCase()));
  // ⚠️ Negative Match → همیشه Reject (حتی با وجود Positive)
  if (foundNegative.length > 0) {
    return {
      match: false,
      reason: 'negative_match',
      found_positive: [],
      found_negative: foundNegative,
      breakdown: {
        type: 'deep_classic',
        negative_match: foundNegative,
        positive_match: [],
        logic: 'negative_keywords_reject',
      },
    };
  }

  const foundPositive = pos.filter(kw => text.includes(String(kw).toLowerCase()));
  let match = false;
  let logic = '';
  if (source.every_mode) {
    // AND — همه کلیدواژه‌های مثبت باید باشند
    match = pos.length > 0 && foundPositive.length === pos.length;
    logic = `every_mode (AND): ${foundPositive.length}/${pos.length}`;
  } else {
    // OR — حداقل یکی
    match = foundPositive.length > 0;
    logic = `any_mode (OR): ${foundPositive.length}/${pos.length}`;
  }

  return {
    match,
    reason: match ? 'positive_match' : 'no_positive_match',
    found_positive: foundPositive,
    found_negative: [],
    breakdown: {
      type: 'deep_classic',
      positive_match: foundPositive,
      negative_match: [],
      logic,
    },
  };
}

/**
 * ─── Deep Scoring (بخش ۱۳ سند معماری) ───
 * امتیازدهی چندمعیاره توضیح‌پذیر.
 *
 * اجزای امتیاز:
 *   - کلیدواژه اصلی (main):       +۴۰ هر کلمه (+۱۵ position bonus اگه در ۵۰ کاراکتر اول)
 *   - کلیدواژه مکمل (complementary): +۱۵ هر کلمه
 *   - کلیدواژه پیرامونی (peripheral): -۳۰ هر کلمه  ← جایگزین negative در Deep Scoring
 *   - رسانه مناسب:                +۱۰
 *   - طول متن ۱۰۰-۲۰۰۰:           +۵
 *
 * قانون: Final Score >= deep_threshold → Send
 *
 * خروجی: { match, score, threshold, breakdown }
 */
function matchDeepScoring(post, source, normalizedText) {
  const text = (normalizedText || post.text || '').toLowerCase();
  const main = safeJson(source.keywords_main, []);
  const comp = safeJson(source.keywords_complementary, []);
  const periph = safeJson(source.keywords_peripheral, []);

  let score = 0;
  const breakdown = [];

  // ── کلیدواژه‌های اصلی — +۴۰ هر کلمه + ۱۵ position bonus ──
  for (const kw of main) {
    const k = String(kw).toLowerCase();
    if (text.includes(k)) {
      score += 40;
      breakdown.push({ kw, type: 'main', value: 40 });
      if (text.indexOf(k) < 50) {
        score += 15;
        breakdown.push({ kw, type: 'main_position', value: 15 });
      }
    }
  }

  // ── کلیدواژه‌های مکمل — +۱۵ هر کلمه ──
  for (const kw of comp) {
    const k = String(kw).toLowerCase();
    if (text.includes(k)) {
      score += 15;
      breakdown.push({ kw, type: 'complementary', value: 15 });
    }
  }

  // ── کلیدواژه‌های پیرامونی — -۳۰ هر کلمه ──
  for (const kw of periph) {
    const k = String(kw).toLowerCase();
    if (text.includes(k)) {
      score -= 30;
      breakdown.push({ kw, type: 'peripheral', value: -30 });
    }
  }

  // ── رسانه مناسب — +۱۰ ──
  if (post.mediaType && post.mediaType !== 'text') {
    score += 10;
    breakdown.push({ kw: '(media)', type: 'media_bonus', value: 10 });
  }

  // ── طول مناسب — +۵ ──
  if (text.length >= 100 && text.length <= 2000) {
    score += 5;
    breakdown.push({ kw: '(length)', type: 'length_bonus', value: 5 });
  }

  const threshold = source.deep_threshold || 50;
  const match = score >= threshold;

  return {
    match,
    score,
    threshold,
    breakdown,
    reason: match ? 'score_above_threshold' : 'score_below_threshold',
  };
}

/**
 * ─── Viral Mode (بخش ۱۰ سند معماری) ───
 * معیار: **ری‌اکشن‌های پست** (نه views).
 *
 * دو حالت (طبق سند):
 *   ۱) viral_reactions تنظیم شده (JSON array):
 *      [{"emoji":"🔥","threshold":100}, {"emoji":"❤️","threshold":50}]
 *      هر ری‌اکشن باید از آستانه خودش عبور کند — همه باید عبور کنند (AND).
 *   ۲) viral_reactions خالی:
 *      مجموع همه ری‌اکشن‌ها >= viral_threshold
 *
 * ⚠️ views هیچ‌وقت در Viral Mode معیار نیست (طبق سند).
 *    اگه پست ری‌اکشنی نداشت، match = false (معیار برآورده نشد).
 *
 * خروجی: { match, reason, reactions, viral_rules, failed_rule, total_count, threshold }
 */
function matchViral(post, source) {
  const reactions = post.reactions || [];
  const viralRules = safeJson(source.viral_reactions, []);
  const threshold = source.viral_threshold || 1000;

  // ── حالت ۱: multi-reaction با آستانه‌های جداگانه ──
  if (viralRules.length > 0) {
    const checked = [];
    let failedRule = null;
    for (const rule of viralRules) {
      const r = reactions.find(x => x.emoji === rule.emoji);
      const count = r ? r.count : 0;
      const passed = count >= (rule.threshold || 0);
      checked.push({
        emoji: rule.emoji,
        threshold: rule.threshold,
        count,
        passed,
      });
      if (!passed && !failedRule) {
        failedRule = { emoji: rule.emoji, threshold: rule.threshold, count };
      }
    }
    const allPassed = checked.every(c => c.passed);
    return {
      match: allPassed,
      reason: allPassed ? 'all_reactions_passed' : 'reaction_threshold_not_met',
      reactions,
      viral_rules: checked,
      failed_rule: failedRule,
    };
  }

  // ── حالت ۲: مجموع ری‌اکشن‌ها ─ـ (طبق سند — نه views)
  const totalCount = reactions.reduce((sum, r) => sum + (r.count || 0), 0);
  const passed = totalCount >= threshold;
  return {
    match: passed,
    reason: passed ? 'total_reactions_passed' : 'total_reactions_below_threshold',
    reactions,
    total_count: totalCount,
    threshold,
  };
}

// ===========================================================================
//  سیستم ضد تبلیغات — در هر سه حالت (forward, deep, viral) فعال است
//  ساختار: ۳ لایه تشخیص
//    1) الگوهای صریح (regex) — یک تطابق = تبلیغ قطعی
//    2) نشانگرهای کلیدواژه‌ای — امتیازگذاری: ۲+ نشانگر = تبلیغ
//    3) لینک‌های مشکوک — یک تطابق = تبلیغ قطعی
// ===========================================================================
const AD_PATTERNS = {
  // ─── لایه ۱: الگوهای صریح (تطابق یکی کافی است) ───
  textPatterns: [
    /(?:دانلود\s*با\s*کیفیت\s*(?:4k|1080|720|480|360))/i,
    /(?:برای\s*عضویت\s*(?:کلیک|بفرستید))/i,
    /(?:کانال\s*(?:ما|رسمی|پشتیبان|تلگرام))/i,
    /(?:VIP|پی‌وی|pv\s*channel)/i,
    /(?:تخفیف\s*\d+\s*٪|%\s*تخفیف|\d+\s*٪\s*تخفیف)/i,
    /(?:خرید\s*(?:نقد|اقساط|قسطی))/i,
    /(?:ثبت\s*نام\s*(?:کنید|بفرمایید|کن))/i,
    /(?:پشتیبانی\s*[\d۰-۹]{3,}|شماره\s*پشتیبانی|پشتیبانی\s*۲۴)/i,
    /(?:عضو\s*(?:شوید|بشید)\s*(?:در|تا))/i,
    /(?:دنبال\s*کنید|فالو\s*کنید|follow\s*us)/i,
    /(?:پروموشن|اسپانسر|sponsor|تبلیغاتی)/i,
    /(?:رایگان\s*دانلود|free\s*download)/i,
    /(?:لینک\s*(?:عضویت|کانال|دریافت))/i,
    /(?:جهت\s*(?:خرید|سفارش|اطلاع))/i,
    /(?:پکیج\s*(?:آموزشی|ویژه))/i,
    /(?:مشاوره\s*(?:رایگان|تلفنی))/i,
    /(?:آموزش\s*(?:رایگان|صفر|پولسازی))/i,
    /(?:درآمد\s*(?:رایگان|تضمینی|ماهانه|زرین))/i,
    /(?:سایت\s*(?:شرط|بازی|بت|bet))/i,
    /(?:اندر|اندو)\s*بت/i,
    /(?:شارژ\s*(?:حساب|اکانت))/i,
    /(?:برداشت\s*(?:تومان|ریال|\d))/i,
    /(?:مبلغ\s*(?:اولیه|برداشت|شارژ))/i,
    /(?:همین\s*حالا\s*(?:در|ثبت|خرید|سفارش))/i,
    /(?:کد\s*تخفیف\s*[:：]?\s*[A-Za-z0-9]+)/i,
    /(?:فرصت\s*(?:محدود|را\s*از\s*دست))/i,
    /(?:فقط\s*امروز|فقط\s*تا\s*فردا)/i,
    /(?:ارسال\s*(?:رایگان|فوری))/i,
    /(?:تضمین\s*(?:بازگشت|کیفیت|قیمت))/i,
    /(?:پردرآمد|درآمد\s*فوری)/i,
  ],

  // ─── لایه ۲: نشانگرهای کلیدواژه‌ای (امتیازگذاری) ───
  // هر کلمه ۱ امتیاز. اگه مجموع ≥ ۲ شد → تبلیغ.
  // این الگوها به‌تنهایی کافی نیستن ولی با هم نشون می‌دن پست تبلیغاتی‌ئه.
  keywordMarkers: [
    'تبلیغ', 'تبلیغات', 'اسپانسر', 'پروموشن',
    'فروش', 'فروشگاه', 'فروشنده', 'بفروش',
    'تخفیف', 'تخفیفات', 'آف', 'off',
    'خرید', 'بخرید', 'خریداری', 'سفارش', 'سفارش دهید',
    'رایگان', 'هدیه', 'جایزه', 'جايزه',
    'ثبت‌نام', 'ثبت نام', 'عضویت', 'عضو شوید', 'عضو بشید',
    'کد تخفیف', 'کدتخفیف',
    'فرصت محدود', 'زمان محدود', 'محدود',
    'جشنواره', 'حراج', 'حراجی', 'مناسبتی',
    'ویژه', 'استثنایی', 'فوق‌العاده', 'فوق العاده',
    'بهترین قیمت', 'ارزان', 'ارزان‌ترین', 'نصف قیمت',
    'ارسال رایگان', 'ارسال فوری',
    'پردرآمد', 'درآمد', 'سودده', 'سود', 'ثروت',
    'تضمین', 'تضمینی',
    'کیفیت بالا', 'کیفیت عالی',
    'مشتری', 'مشتریان',
    'پشتیبانی',
    'لینک بیو', 'لینک‌بیو', 'بیوگرافی',
    'کانال ما', 'کانالِ ما', 'گروه ما',
    'دنبال کنید', 'دنبال‌کنید', 'فالو کنید',
    'لایک', 'کامنت', 'اشتراک‌گذاری', 'شیر',
    'order now', 'buy now', 'shop now', 'limited time', 'sale', 'discount', 'free',
  ],

  // ─── لایه ۳: لینک‌های مشکوک (تطابق یکی کافی است) ───
  adLinkPatterns: [
    /t\.me\/\+/i,                       // لینک دعوت خصوصی
    /t\.me\/joinchat/i,                 // لینک دعوت خصوصی
    /bit\.ly\//i,                       // لینک کوتاه
    /tinyurl\//i,                       // لینک کوتاه
    /cutt\.ly\//i,                      // لینک کوتاه
    /shorturl\./i,                      // لینک کوتاه
    /is\.gd\//i,                        // لینک کوتاه
    /t\.me\/share\/url/i,               // شیر تلگرام
    /\.click\b/i,                       // دامنه مشکوک
    /\.vip\b/i,                         // دامنه مشکوک
    /\.xyz\b/i,                         // دامنه مشکوک
    /\.top\b/i,                         // دامنه مشکوک
    /\.shop\b/i,                        // دامنه فروشگاهی
    /\.store\b/i,                       // دامنه فروشگاهی
    /\.biz\b/i,                         // دامنه مشکوک
    /t\.me\/[^/\s]+\/\d+\?/i,           // لینک پست با کوئری
  ],

  multiMentionPattern: /@[\w_]{3,}/g,
};

// تعداد نشانگرهای کلیدواژه‌ای پیدا شده در متن (برای امتیازگذاری)
function countKeywordMarkers(text) {
  const lower = (text || '').toLowerCase();
  const found = [];
  for (const kw of AD_PATTERNS.keywordMarkers) {
    // تطابق کلمه کامل (با مرزهای فارسی/انگلیسی)
    // استفاده از indexOf برای سرعت — کلمات فارسی regex \b رو خوب پشتیبانی نمی‌کنن
    if (lower.includes(kw.toLowerCase())) {
      found.push(kw);
    }
  }
  return found;
}

function checkAdFilters(post) {
  const text = post.text || '';

  // ─── لایه ۱: الگوهای صریح (اولویت بالا — یک تطابق = تبلیغ قطعی) ───
  for (const pattern of AD_PATTERNS.textPatterns) {
    if (pattern.test(text)) {
      return { isAd: true, reason: `الگوی صریح: ${pattern.source.slice(0, 40)}`, layer: 1 };
    }
  }

  // ─── لایه ۳: لینک‌های مشکوک (اولویت بالا — یک تطابق = تبلیغ قطعی) ───
  for (const pattern of AD_PATTERNS.adLinkPatterns) {
    if (pattern.test(text)) {
      return { isAd: true, reason: `لینک مشکوک: ${pattern.source.slice(0, 25)}`, layer: 3 };
    }
  }

  // ─── لایه ۲: امتیازگذاری کلیدواژه‌ای (۲+ نشانگر = تبلیغ) ───
  const markers = countKeywordMarkers(text);
  if (markers.length >= 2) {
    return {
      isAd: true,
      reason: `${markers.length} نشانگر تبلیغاتی: ${markers.slice(0, 4).join('، ')}${markers.length > 4 ? '…' : ''}`,
      layer: 2,
      markers,
    };
  }

  // ─── مولتی‌فوروارد — ۲+ نام کانال متفاوت ───
  const mentions = text.match(AD_PATTERNS.multiMentionPattern) || [];
  const filteredMentions = mentions.filter(m => m.toLowerCase() !== '@' + (post.channel || '').toLowerCase());
  if (filteredMentions.length >= 2) {
    return { isAd: true, reason: `مولتی‌فوروارد: ${filteredMentions.length} کانال (${filteredMentions.join(', ')})`, layer: 4 };
  }

  // ─── پست صرفاً تبلیغاتی (کوتاه + فقط منبع) ───
  if (text.length < 50 && /^source\s*@/i.test(text.trim())) {
    return { isAd: true, reason: 'پست صرفاً تبلیغاتی (فقط منبع)', layer: 5 };
  }

  // ─── بومپ پست قدیمی ───
  if (post.isReply && text.length < 20) {
    return { isAd: true, reason: 'بومپ پست قدیمی (ریپلای بدون محتوا)', layer: 6 };
  }

  return { isAd: false, reason: '', layer: 0, markers };
}

// ===========================================================================
//  سیستم ضد تبلیغات پیشرفته — ۴ لایه با امتیازدهی ۰-۱۰۰
//  ≥۷۰: مسدود / ۴۰-۶۹: قرنطینه / <۴۰: عبور
// ===========================================================================
const AD_THRESHOLDS = { BLOCK: 70, QUARANTINE: 40 };

const HEAVY_AD_WORDS = [
  { w: 'بونوس', s: 40 }, { w: 'شارژ حساب', s: 40 }, { w: 'وینکوبت', s: 40 },
  { w: 'اندر بت', s: 40 }, { w: 'فیکس بت', s: 40 }, { w: 'بت فارسی', s: 40 },
  { w: 'پیش بینی', s: 35 }, { w: 'ضریب', s: 30 }, { w: 'کازینو', s: 40 },
  { w: 'کد هدیه', s: 35 }, { w: 'خرید فوری', s: 35 }, { w: 'تخفیف ویژه', s: 35 },
  { w: 'تخفیفات', s: 30 }, { w: 'کد تخفیف', s: 35 }, { w: 'فروشگاه', s: 30 },
  { w: 'فروشنده', s: 30 }, { w: 'پردرآمد', s: 35 }, { w: 'درآمد تضمینی', s: 40 },
  { w: 'سودده', s: 30 }, { w: 'شارژ رایگان', s: 40 }, { w: 'هدیه رایگان', s: 35 },
  { w: 'ثبت‌نام کنید', s: 35 }, { w: 'عضو شوید', s: 35 }, { w: 'عضویت ویژه', s: 35 },
  { w: 'فرصت محدود', s: 35 }, { w: 'فقط امروز', s: 30 }, { w: 'همین حالا', s: 25 },
  { w: 'کلیک کنید', s: 25 }, { w: 'دنبال کنید', s: 25 }, { w: 'فالو کنید', s: 25 },
  { w: 'پشتیبانی ۲۴', s: 30 }, { w: 'کانال ما', s: 25 }, { w: 'گروه ما', s: 25 },
  { w: 'VIP', s: 30 }, { w: 'پی‌وی', s: 30 }, { w: 'لینک بیو', s: 25 },
  { w: 'بیوگرافی', s: 25 }, { w: 'پکیج آموزشی', s: 30 }, { w: 'دوره رایگان', s: 30 },
  { w: 'آموزش صفر', s: 30 }, { w: 'تضمین بازگشت', s: 30 }, { w: 'تضمین کیفیت', s: 25 },
];

const MEDIUM_AD_WORDS = [
  { w: 'تخفیف', s: 20 }, { w: 'فروش', s: 20 }, { w: 'خرید', s: 20 },
  { w: 'رایگان', s: 20 }, { w: 'هدیه', s: 20 }, { w: 'جایزه', s: 20 },
  { w: 'اسپانسر', s: 25 }, { w: 'تبلیغ', s: 25 }, { w: 'تبلیغات', s: 25 },
  { w: 'پروموشن', s: 25 }, { w: 'sponsor', s: 25 }, { w: 'ویژه', s: 15 },
  { w: 'استثنایی', s: 15 }, { w: 'فوق‌العاده', s: 15 }, { w: 'جشنواره', s: 20 },
  { w: 'حراج', s: 20 }, { w: 'حراجی', s: 20 }, { w: 'تضمین', s: 15 },
  { w: 'تضمینی', s: 15 }, { w: 'ارسال رایگان', s: 20 }, { w: 'ارسال فوری', s: 20 },
  { w: 'بهترین قیمت', s: 20 }, { w: 'ارزان', s: 15 }, { w: 'نصف قیمت', s: 20 },
  { w: 'ثبت‌نام', s: 15 }, { w: 'عضویت', s: 15 }, { w: 'لایک', s: 15 },
  { w: 'کامنت', s: 15 }, { w: 'اشتراک‌گذاری', s: 15 }, { w: 'درآمد', s: 15 },
  { w: 'سود', s: 15 }, { w: 'ثروت', s: 15 }, { w: 'پشتیبانی', s: 15 },
  { w: 'مشاوره رایگان', s: 20 }, { w: 'order now', s: 25 }, { w: 'buy now', s: 25 },
  { w: 'shop now', s: 25 }, { w: 'limited time', s: 25 }, { w: 'sale', s: 20 },
  { w: 'discount', s: 20 }, { w: 'free', s: 15 }, { w: 'off', s: 15 },
];

const AD_EMOJIS = ['🎁','🚀','⚡️','⚡','💙','⚽️','⚽','💰','💵','🤑','🔥','💯','🎯','🏆','⭐️','⭐','🎉','🎊'];

const SUSPICIOUS_DOMAINS = ['bit.ly','tinyurl.com','cutt.ly','is.gd','shorturl','t.ly','rb.gy','albb.ir','til.ac','1xbet','melbet','bet365','.click','.vip','.xyz','.top','.shop','.store','.biz','.online'];

const TRUSTED_DOMAINS = ['t.me','telegram.org','github.com','youtube.com','youtu.be','twitter.com','x.com','instagram.com','wikipedia.org','google.com','apple.com','microsoft.com'];

function tokenizePost(text) {
  const lower = (text || '').toLowerCase();
  const tokens = { words: [], links: [], emojis: [], bots: [] };
  for (const item of [...HEAVY_AD_WORDS, ...MEDIUM_AD_WORDS]) {
    if (lower.includes(item.w.toLowerCase())) tokens.words.push(item);
  }
  const linkMatches = text.match(/https?:\/\/[^\s]+|t\.me\/[^\s]+|@[\w_]{3,}/gi) || [];
  for (const link of linkMatches) tokens.links.push(link.toLowerCase());
  const botMatches = text.match(/@[a-z0-9_]+bot/gi) || [];
  for (const bot of botMatches) tokens.bots.push(bot.toLowerCase());
  const emojiRe = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F1E6}-\u{1F1FF}]/gu;
  const allEmojis = text.match(emojiRe) || [];
  for (const e of allEmojis) { if (AD_EMOJIS.includes(e)) tokens.emojis.push(e); }
  return tokens;
}

async function scoreAdPost(post, env) {
  const text = post.text || '';
  let score = 0;
  const reasons = [];
  const tokens = tokenizePost(text);

  // لایه ۱: کلمات
  for (const item of tokens.words) { score += item.s; reasons.push(`${item.w} (+${item.s})`); }

  // لایه ۲: لینک‌ها
  for (const link of tokens.links) {
    if (/t\.me\/\+|t\.me\/joinchat/i.test(link)) { score += 35; reasons.push('لینک خصوصی (+35)'); }
    else if (link.endsWith('bot') || link.endsWith('bot@')) { score += 30; reasons.push(`ربات ${link} (+30)`); }
    else if (SUSPICIOUS_DOMAINS.some(d => link.includes(d))) { score += 25; reasons.push(`دامنه مشکوک (+25)`); }
  }

  // اموجی‌ها
  if (tokens.emojis.length >= 2) {
    const emojiBonus = Math.min(15, tokens.emojis.length * 5);
    score += emojiBonus; reasons.push(`${tokens.emojis.length} اموجی (+${emojiBonus})`);
  }

  // لایه ۳: سیگنال پیش‌درآمد (KV)
  if (env && env.KV) {
    try {
      const signal = await env.KV.get(`ad_signal:${post.channel}`);
      if (signal) { score = Math.round(score * 1.5); reasons.push('سیگنال پیش‌درآمد (×۱.۵)'); }
    } catch {}
  }

  // لایه ۴: ساختار + امتیاز منفی
  const linkChars = tokens.links.reduce((s, l) => s + l.length, 0);
  if (text.length > 50 && linkChars / text.length > 0.3) { score += 15; reasons.push('نسبت لینک بالا (+15)'); }
  if (/(━{5,}|---{3,})/.test(text)) { score += 10; reasons.push('جداکننده (+10)'); }
  if (post.isReply && text.length > 100) { score -= 15; reasons.push('ریپلای طولانی (−۱۵)'); }
  if (text.length > 500) { score -= 20; reasons.push('متن طولانی (−۲۰)'); }
  for (const trusted of TRUSTED_DOMAINS) {
    if (text.toLowerCase().includes(trusted)) { score -= 30; reasons.push(`دامنه معتبر (−۳۰)`); break; }
  }
  const mentions = text.match(/@[\w_]{3,}/g) || [];
  const filtered = mentions.filter(m => m.toLowerCase() !== '@' + (post.channel || '').toLowerCase());
  if (filtered.length >= 2) { score += 25; reasons.push(`مولتی‌فوروارد (+25)`); }

  score = Math.max(0, Math.min(100, score));
  return {
    score,
    verdict: score >= AD_THRESHOLDS.BLOCK ? 'block' : score >= AD_THRESHOLDS.QUARANTINE ? 'quarantine' : 'clean',
    reasons,
    tokens,
  };
}

async function bumpPostWeights(text, env) {
  if (!text) return;
  const tokens = tokenizePost(text);
  const allTokens = [
    ...tokens.words.map(w => ({ token: w.w, type: 'word' })),
    ...tokens.links.map(l => ({ token: l, type: 'link' })),
    ...tokens.bots.map(b => ({ token: b, type: 'bot_id' })),
  ];
  for (const t of allTokens) {
    try {
      const existing = await env.DB.prepare('SELECT token, hits FROM ad_weights WHERE token=?').bind(t.token).first();
      if (existing) {
        const newHits = existing.hits + 1;
        const newWeight = Math.min(50, 30 + Math.floor(newHits / 3) * 5);
        await env.DB.prepare('UPDATE ad_weights SET hits=?, weight=? WHERE token=?').bind(newHits, newWeight, t.token).run();
      } else {
        await env.DB.prepare('INSERT INTO ad_weights (token, type, weight, hits, auto, created_at) VALUES (?, ?, ?, 0, 1, ?)').bind(t.token, t.type, 25, Date.now()).run();
      }
    } catch {}
  }
}

async function buildAdBlockText(env) {
  async function safeCount(query, binds = []) {
    try { const r = await env.DB.prepare(query).bind(...binds).first(); return r?.cnt || 0; }
    catch { return 0; }
  }
  function fa(n) { return String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]); }
  let tb, qp, wc, rc, ac, ts;
  try {
    tb = await safeCount("SELECT COUNT(*) as cnt FROM logs WHERE action='skipped' AND detail LIKE '🚫 تبلیغ%' AND created_at > ?", [Date.now() - 86400000 * 7]);
    qp = await safeCount("SELECT COUNT(*) as cnt FROM quarantine WHERE status='pending'");
    wc = await safeCount("SELECT COUNT(*) as cnt FROM ad_weights");
    rc = await safeCount("SELECT COUNT(*) as cnt FROM user_reports WHERE created_at > ?", [Date.now() - 86400000 * 7]);
    ac = await safeCount('SELECT COUNT(*) as cnt FROM sources WHERE block_ads = 1 AND active = 1');
    ts = await safeCount('SELECT COUNT(*) as cnt FROM sources WHERE active = 1');
  } catch { tb = qp = wc = rc = ac = ts = 0; }
  const mn = (qp === 0 && wc === 0 && rc === 0 && ts > 0) ? '\n\n⚠️ <i>migration را اجرا کنید.</i>' : '';
  return `🛡 <b>سیستم ضد تبلیغات پیشرفته</b>\n\n` +
    `<blockquote>📊 مسدود قطعی: <b>${fa(tb)}</b>\n⚠️ قرنطینه: <b>${fa(qp)}</b>\n⚖️ وزن‌ها: <b>${fa(wc)}</b>\n📝 گزارش‌ها: <b>${fa(rc)}</b>\n📡 منابع روشن: <b>${fa(ac)}</b> از <b>${fa(ts)}</b></blockquote>\n\n` +
    `<b>معماری ۴ لایه:</b>\n• لایه ۱: کلمات با وزن\n• لایه ۲: لینک‌های مشکوک + اموجی\n• لایه ۳: سیگنال پیش‌درآمد (KV)\n• لایه ۴: ساختار + امتیاز منفی\n\n` +
    `<b>تصمیم:</b>\n• امتیاز ≥ ۷۰ → 🚫 مسدود\n• امتیاز ۴۰-۶۹ → ⚠️ قرنطینه\n• امتیاز کمتر از ۴۰ → ✅ عبور` + mn;
}

// ===========================================================================
//  ارسال پست به مقصد
// ===========================================================================
function mediaEmoji(t) {
  return { photo: '📷', video: '🎬', file: '📎', audio: '🎵', sticker: '🔰', poll: '📊', text: '📝' }[t] || '📝';
}

function formatPost(post, source, ctx = {}) {
  // ctx: { foundKeywords, viralInfo, dispatchBreakdown, adScore, adVerdict }
  const mediaLabel = mediaEmoji(post.mediaType);
  const viewsLabel = post.views > 0 ? `👁 ${formatViews(post.views)}` : '';
  const timeLabel = post.datetime ? `🕐 ${post.datetime}` : '';

  // ─── اطلاعات کامل در ابتدای پیام ───
  let info = `🔗 <a href="${post.link}">منبع: @${post.channel}</a>\n`;
  info += `${mediaLabel} نوع: ${mediaName(post.mediaType)}`;
  if (viewsLabel) info += `  •  ${viewsLabel}`;
  if (timeLabel) info += `  •  ${timeLabel}`;
  info += `\n🧭 حالت: ${modeName(source.mode)}`;

  // ─── اطلاعات mode-specific (طبق سند — قسمت ارسال پست) ───
  // Forward: چیزی اضافه نمی‌شود
  // Viral: نوع و تعداد ری‌اکشن + آستانه
  // Deep Classic: کلیدواژه‌های تشخیص داده شده
  // Deep Scoring: امتیاز بخش‌به‌بخش (خلاصه)
  if (source.mode === 'viral' && ctx.viralInfo) {
    const v = ctx.viralInfo;
    if (v.viral_rules && v.viral_rules.length) {
      info += `\n👁 ری‌اکشن‌ها:`;
      for (const r of v.viral_rules) {
        const status = r.passed ? '✓' : '✗';
        info += `\n  ${r.emoji} ${r.count}/${r.threshold} ${status}`;
      }
    } else if (v.total_count !== undefined) {
      info += `\n👁 مجموع ری‌اکشن: <b>${v.total_count}</b>/${v.threshold}`;
    }
  } else if (source.mode === 'deep' && ctx.dispatchBreakdown) {
    const bd = ctx.dispatchBreakdown;
    const isScoring = bd.type === 'deep_scoring';
    if (isScoring) {
      info += `\n📊 امتیاز: <b>${bd.score}</b>/${bd.threshold}`;
      // نمایش خلاصه کلیدواژه‌های تطبیق‌شده
      const mainKw = (bd.items || []).filter(i => i.type === 'main').map(i => i.kw);
      const compKw = (bd.items || []).filter(i => i.type === 'complementary').map(i => i.kw);
      if (mainKw.length) info += `\n✅ اصلی: ${mainKw.join('، ')}`;
      if (compKw.length) info += `\n➕ مکمل: ${compKw.join('، ')}`;
    } else if (bd.type === 'deep_classic') {
      if (bd.positive_match?.length) info += `\n✅ مثبت‌کننده: ${bd.positive_match.join('، ')}`;
      if (bd.negative_match?.length) info += `\n🚫 منفی‌کننده: ${bd.negative_match.join('، ')}`;
    }
  }

  // ─── اطلاعات Anti-Ad ───
  if (ctx.adVerdict && ctx.adVerdict !== 'clean' && ctx.adVerdict !== 'block') {
    info += `\n🛡 Anti-Ad: ${ctx.adScore} (${ctx.adVerdict})`;
  } else if (ctx.adScore !== undefined && ctx.adScore > 0) {
    info += `\n🛡 Anti-Ad: ${ctx.adScore}/۱۰۰ — ✅ پاک`;
  }

  // ─── نمایش ریپلای ───
  if (post.isReply) {
    info += `\n↩️ ریپلای به: `;
    if (post.replyToAuthor) info += escapeHtml(post.replyToAuthor);
    if (post.replyToText) {
      const rt = post.replyToText.length > 80 ? post.replyToText.slice(0, 80) + '…' : post.replyToText;
      info += ` «${rt}»`;
    }
    if (!post.replyToAuthor && !post.replyToText) info += 'پست دیگر';
  }

  // ─── کلیدواژه‌های پیدا شده (برای Deep Classic) ───
  if (ctx.foundKeywords && ctx.foundKeywords.length && source.mode === 'deep') {
    info += `\n🔑 کلیدواژه: ` + ctx.foundKeywords.map(k => `#${k.replace(/\s+/g, '_')}`).join(' ');
  }

  // ─── جداکننده ───
  info += '\n━━━━━━━━━━━━━';

  // ─── متن پست (با حفظ فرمت‌بندی تلگرام) ───
  let body = '';
  if (post.text) {
    const t = post.text.length > 3500 ? post.text.slice(0, 3500) + '\n…' : post.text;
    body = `\n\n${t}`;
  }

  return `${info}${body}`;
}

function mediaName(t) {
  return { photo: 'عکس', video: 'ویدیو', file: 'فایل', audio: 'صوت', sticker: 'استیکر', poll: 'نظرسنجی', text: 'متن' }[t] || 'متن';
}
function modeName(m) {
  return { forward: 'فوروارد', deep: 'عمیق', viral: 'وایرال' }[m] || m;
}
function formatViews(v) {
  if (v >= 1000000) return (v / 1000000).toFixed(1) + 'M';
  if (v >= 1000) return (v / 1000).toFixed(1) + 'K';
  return String(v);
}
function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function sendPostToTarget(post, source, ctx, env) {
  const text = formatPost(post, source, ctx);
  const keyboard = {
    inline_keyboard: [[{ text: '🔗 مشاهده در تلگرام', url: post.link }]],
  };
  const target = source.target_topic_id
    ? { chat_id: source.target_chat_id, message_thread_id: source.target_topic_id }
    : { chat_id: source.target_chat_id };
  return sendMsg(target.chat_id, text, env, keyboard).then(() => {
    if (source.target_topic_id) return sendMsg(target.chat_id, text, env, keyboard);
  });
}

// ─── ذخیره سیگنال پیش‌درآمد در KV (TTL ۵ دقیقه) ───
async function setAdSignal(channel, env, type = 'sticker') {
  if (!env.KV) return;
  try {
    await env.KV.put(`ad_signal:${channel}`, type, { expirationTtl: 300 });
  } catch {}
}

// ─── چک پست‌های قدیمی قرنطینه برای حذف (deletion detection) ───
async function checkDeletedPosts(source, env) {
  try {
    const res = await env.DB.prepare(
      "SELECT id, post_link, post_msg_id, post_text FROM quarantine WHERE status='pending' AND channel=? AND created_at < ?"
    ).bind(source.channel, Date.now() - 2 * 3600 * 1000).all();
    if (!res.results?.length) return;

    for (const q of res.results) {
      try {
        const checkRes = await fetch(`https://t.me/${source.channel}/${q.post_msg_id}`, {
          method: 'HEAD',
          headers: { 'User-Agent': 'Mozilla/5.0' },
          signal: AbortSignal.timeout(5000),
        });
        if (checkRes.status === 404 || (checkRes.url && !checkRes.url.includes(`/${q.post_msg_id}`))) {
          await env.DB.prepare("UPDATE quarantine SET status='ad' WHERE id=?").bind(q.id).run();
          await logAction(source.id, 'skipped', `🚫 تبلیغ تشخیص‌داده‌شده (حذف از منبع)`, env, q.post_link);
          try { await bumpPostWeights(q.post_text, env); } catch {}
        }
      } catch {}
    }
  } catch {}
}

// ─── ارسال پست مشکوک به قرنطینه (با دکمه‌های مدیریت) ───
async function sendToQuarantine(post, source, adResult, env) {
  const insertRes = await env.DB.prepare(
    'INSERT INTO quarantine (source_id, post_link, post_text, post_msg_id, channel, score, reason, created_at) VALUES (?,?,?,?,?,?,?,?)'
  ).bind(
    source.id, post.link, post.text || '', post.msgId || 0, source.channel,
    adResult.score, (adResult.reasons || []).join('، '), Date.now()
  ).run();
  const quarId = insertRes.meta?.last_row_id;

  // دریافت مقصد قرنطینه از پیکربندی
  let targetChatId = env.MAIN_ADMIN_ID;
  let targetTopicId = null;
  try {
    const configRow = await env.DB.prepare("SELECT value FROM kv_meta WHERE key='quarantine_config'").first();
    if (configRow?.value) {
      const config = JSON.parse(configRow.value);
      if (config.chat_id) targetChatId = config.chat_id;
      if (config.topic_id) targetTopicId = config.topic_id;
    }
  } catch {}

  const text = `⚠️ <b>پست مشکوک در قرنطینه</b>\n\n` +
    `📡 منبع: <a href="${post.link}">@${source.channel}</a>\n` +
    `📊 امتیاز: <b>${adResult.score}/۱۰۰</b>\n\n` +
    `<blockquote><b>دلیل امتیاز:</b>\n${(adResult.reasons || []).slice(0, 5).join('\n')}</blockquote>\n` +
    `━━━━━━━━━━━━━\n\n` +
    `${escapeHtml((post.text || '').slice(0, 500))}`;

  const kb = {
    inline_keyboard: [
      [
        { text: '❌ تبلیغ', callback_data: `q_ad:${quarId}` },
        { text: '✅ پاک', callback_data: `q_clean:${quarId}` },
      ],
      [
        { text: '🤖 نظر AI', callback_data: `q_ai:${quarId}` },
      ],
      [
        { text: '🔗 مشاهده در تلگرام', url: post.link },
      ],
    ],
  };

  const params = {
    chat_id: targetChatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: false,
    reply_markup: kb,
  };
  if (targetTopicId) params.message_thread_id = targetTopicId;
  return tg('sendMessage', params, env);
}

// ارسال واقعی با پشتیبانی از تاپیک و context mode-specific
async function deliverPost(post, source, ctx, env) {
  const text = formatPost(post, source, ctx);
  const keyboard = { inline_keyboard: [
    [{ text: '🔗 مشاهده در تلگرام', url: post.link }],
    [{ text: '🚫 گزارش تبلیغ', callback_data: `report_ad:${source.id}` }],
  ] };
  const params = {
    chat_id: source.target_chat_id,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: false,
    reply_markup: keyboard,
  };
  if (source.target_topic_id) params.message_thread_id = source.target_topic_id;
  return tg('sendMessage', params, env);
}

// ===========================================================================
//  لاگ‌گذاری — شامل پشتیبانی از breakdown (بخش‌به‌بخش) و فیلدهای AI
//  (طبق سند معماری جدید — بخش «توضیحات قسمت لاگ»)
// ===========================================================================
async function logAction(sourceId, action, detail, env, postLink = '', views = 0, postText = '', extra = {}) {
  // extra: { breakdown, reactions, ad_score, ad_verdict, ai_provider, ai_raw }
  try {
    await env.DB.prepare(
      `INSERT INTO logs (source_id, action, detail, breakdown, post_link, post_text, views, reactions, ad_score, ad_verdict, ai_provider, ai_raw, created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).bind(
      sourceId || 0, action, detail || '',
      extra.breakdown ? JSON.stringify(extra.breakdown) : null,
      postLink, postText || '', views,
      extra.reactions ? JSON.stringify(extra.reactions) : null,
      extra.ad_score || 0,
      extra.ad_verdict || null,
      extra.ai_provider || null,
      extra.ai_raw ? String(extra.ai_raw).slice(0, 4000) : null,
      Date.now()
    ).run();
  } catch (e) {
    // fallback: اگه ستون‌های جدید وجود نداشت (مهاجرت نشده)، بدون آن‌ها بنویس
    try {
      await env.DB.prepare(
        'INSERT INTO logs (source_id, action, detail, post_link, post_text, views, created_at) VALUES (?,?,?,?,?,?,?)'
      ).bind(sourceId || 0, action, detail || '', postLink, postText || '', views, Date.now()).run();
    } catch {}
  }
}

// ─── پاکسازی لاگ‌های قدیمی‌تر از ۲ هفته (طبق سند معماری) ───
async function cleanupOldLogs(env) {
  try {
    const twoWeeksAgo = Date.now() - 14 * 86400 * 1000;
    await env.DB.prepare('DELETE FROM logs WHERE created_at < ?').bind(twoWeeksAgo).run();
  } catch {}
}

// ─── ساخت متن قابل خواندن از breakdown (برای نمایش در پنل/گزارش) ───
function formatBreakdown(breakdown) {
  if (!breakdown) return '';
  if (typeof breakdown === 'string') {
    try { breakdown = JSON.parse(breakdown); } catch { return breakdown; }
  }
  if (!breakdown || typeof breakdown !== 'object') return '';

  // Deep Scoring breakdown
  if (breakdown.type === 'deep_scoring' || Array.isArray(breakdown)) {
    const lines = [];
    let total = 0;
    const arr = Array.isArray(breakdown) ? breakdown : breakdown.items;
    if (Array.isArray(arr)) {
      for (const item of arr) {
        const sign = item.value >= 0 ? '+' : '';
        const label = {
          main: 'اصلی',
          main_position: 'موقعیت اصلی',
          complementary: 'مکمل',
          peripheral: 'پیرامونی',
          media_bonus: 'رسانه',
          length_bonus: 'طول متن',
        }[item.type] || item.type;
        lines.push(`${label} «${item.kw}» ${sign}${item.value}`);
        total += item.value;
      }
    }
    if (breakdown.threshold) {
      lines.push('────────────────');
      lines.push(`امتیاز نهایی: ${total}`);
      lines.push(`حداقل امتیاز: ${breakdown.threshold}`);
      lines.push(total >= breakdown.threshold ? '✓ ارسال شد' : '✗ رد شد');
    }
    return lines.join('\n');
  }

  // Deep Classic breakdown
  if (breakdown.type === 'deep_classic') {
    const lines = [];
    if (breakdown.positive_match?.length) {
      lines.push(`مثبت‌کننده: ${breakdown.positive_match.join('، ')}`);
    }
    if (breakdown.negative_match?.length) {
      lines.push(`منفی‌کننده: ${breakdown.negative_match.join('، ')}`);
    }
    if (breakdown.logic) lines.push(`منطق: ${breakdown.logic}`);
    return lines.join('\n');
  }

  // Viral breakdown
  if (breakdown.type === 'viral' || breakdown.viral_rules) {
    const lines = [];
    if (breakdown.viral_rules?.length) {
      for (const r of breakdown.viral_rules) {
        const status = r.passed ? '✓' : '✗';
        lines.push(`${r.emoji} ${r.count}/${r.threshold} ${status}`);
      }
    } else if (breakdown.total_count !== undefined) {
      lines.push(`مجموع ری‌اکشن: ${breakdown.total_count}/${breakdown.threshold}`);
    }
    return lines.join('\n');
  }

  return JSON.stringify(breakdown);
}

// ===========================================================================
//  Cron — اسکن حلقه‌ای (Round-Robin) یکی‌به‌یکی
// ===========================================================================
async function runCron(env) {
  // خواندن ایندکس فعلی از D1
  let idxRow = await env.DB.prepare('SELECT value FROM kv_meta WHERE key = ?').bind('scan_index').first();
  let idx = idxRow ? parseInt(idxRow.value, 10) : 0;

  const sources = await env.DB.prepare(
    "SELECT * FROM sources WHERE active = 1 ORDER BY id ASC"
  ).all();

  if (!sources.results || sources.results.length === 0) return;

  const total = sources.results.length;
  idx = idx % total;
  const source = sources.results[idx];

  // بروزرسانی ایندکس برای اجرای بعدی (D1 به‌جای KV)
  const newIdx = String((idx + 1) % total);
  await env.DB.prepare('INSERT OR REPLACE INTO kv_meta (key, value) VALUES (?,?)').bind('scan_index', newIdx).run();

  await scanSource(source, env, false);
  // پاکسازی هش‌های قدیمی هر چند اسکن + پاکسازی لاگ‌های قدیمی هر روز
  if (idx === 0) {
    await cleanupOldHashes(env);
    await cleanupOldLogs(env);
  }
}

async function scanSource(source, env, forceAll = false) {
  const result = await scrapeChannel(source.channel);
  if (!result.ok) {
    await logAction(source.id, 'error', `اسکرپ ناموفق: ${result.error}`, env);
    return { ok: false, error: result.error, sent: 0, scanned: 0, skipped: 0, duplicates: 0 };
  }

  // ترتیب ارسال: قدیمی‌تر اول، جدیدتر آخر (ترتیب زمانی طبیعی)
  const posts = result.posts.slice(-POSTS_PER_SCAN);
  const lastSeen = await getLastPost(source.id, env);
  let sent = 0;
  let scanned = 0;
  let skipped = 0;
  let duplicates = 0;

  for (const post of posts) {
    // رد پست‌های قدیمی‌تر از آخرین پست دیده‌شده
    // ⚠️ اما در حالت viral، پست‌های قدیمی هم باید بررسی شوند چون ممکن است بعداً وایرال شوند
    if (!forceAll && source.mode !== 'viral' && post.msgId && lastSeen && post.msgId <= lastSeen) continue;

    scanned++;
    const hash = await hashPost(post.dataPost);
    if (await isDuplicate(hash, env)) {
      duplicates++;
      continue;
    }

    // ─── Normalization (بخش ۵ سند معماری) ───
    const normalizedText = normalizeText(post.text || '');

    // ═══════════════ Dispatch Engine (بخش ۸ سند معماری) ═══════════════
    // طبق سند جدید: Dispatch اول، سپس Anti-Ad
    let dispatchResult = null;
    let shouldSend = true;
    let foundKeywords = [];
    let dispatchDetail = '';
    let dispatchBreakdown = null;
    let viralInfo = null;

    if (source.mode === 'deep') {
      // Deep Scoring (deep_scoring=1) یا Deep Classic (deep_scoring=0)
      const isScoring = source.deep_scoring === 1 || source.deep_scoring === '1';
      if (isScoring) {
        dispatchResult = matchDeepScoring(post, source, normalizedText);
        shouldSend = dispatchResult.match;
        // ساخت breakdown با threshold برای نمایش
        dispatchBreakdown = {
          type: 'deep_scoring',
          items: dispatchResult.breakdown,
          threshold: dispatchResult.threshold,
          score: dispatchResult.score,
        };
        foundKeywords = dispatchResult.breakdown
          .filter(b => b.type === 'main' || b.type === 'complementary')
          .map(b => b.kw);
        dispatchDetail = `Deep Scoring — امتیاز: ${dispatchResult.score}/${dispatchResult.threshold} ${shouldSend ? '✓' : '✗'}`;
      } else {
        dispatchResult = matchDeep(post, source, normalizedText);
        shouldSend = dispatchResult.match;
        dispatchBreakdown = dispatchResult.breakdown;
        foundKeywords = dispatchResult.found_positive || [];
        dispatchDetail = `Deep Classic — ${dispatchResult.reason} ${shouldSend ? '✓' : '✗'}`;
      }
    } else if (source.mode === 'viral') {
      dispatchResult = matchViral(post, source);
      shouldSend = dispatchResult.match;
      dispatchBreakdown = {
        type: 'viral',
        viral_rules: dispatchResult.viral_rules,
        total_count: dispatchResult.total_count,
        views: dispatchResult.views,
        threshold: dispatchResult.threshold,
        failed_rule: dispatchResult.failed_rule,
      };
      viralInfo = dispatchResult;
      dispatchDetail = `Viral — ${dispatchResult.reason}`;
    } else {
      // forward
      dispatchDetail = 'Forward — همیشه ارسال';
      dispatchBreakdown = { type: 'forward' };
    }

    // ─── اگه Dispatch رد کرد → skip با breakdown کامل ───
    if (!shouldSend) {
      // در حالت وایرال، تا وقتی پست فرستاده نشده هش را ثبت نمی‌کنیم تا بعداً با افزایش ری‌اکشن شانس ارسال داشته باشد
      if (source.mode !== 'viral') {
        await markSeen(hash, source.id, env);
      }
      await logAction(
        source.id, 'skipped', dispatchDetail, env,
        post.link, post.views, post.text?.slice(0, 200),
        { breakdown: dispatchBreakdown, reactions: post.reactions }
      );
      skipped++;
      continue;
    }

    // ═══════════════ Anti-Ad (بخش ۶ سند معماری) ═══════════════
    // هم در forward، هم viral، هم deep فعال است (مگر block_ads=0)
    let adScore = 0;
    let adVerdict = 'clean';
    let adReasons = [];
    let adBreakdown = null;

    if (source.block_ads !== 0) {
      let adResult;
      try {
        adResult = await scoreAdPost({ ...post, text: normalizedText }, env);
        adScore = adResult.score;
        adVerdict = adResult.verdict;
        adReasons = adResult.reasons || [];
        // breakdown شامل reasons (امتیازدهی بخش‌به‌بخش) + tokens
        // (طبق سند: "امتیازها باید به صورت بخش به بخش نوشته شوند، نه جمع همه آن‌ها!")
        adBreakdown = {
          reasons: adReasons,
          tokens: adResult.tokens || null,
          threshold_block: source.ad_threshold || 70,
          threshold_quarantine: Math.floor((source.ad_threshold || 70) * 4 / 7),
        };
      } catch (e) {
        adResult = { verdict: 'clean', score: 0, reasons: ['خطا در امتیازدهی'] };
        adScore = 0; adVerdict = 'clean';
      }

      // threshold قابل تنظیم از source (پیش‌فرض ۷۰)
      const adThresholdBlock = source.ad_threshold || 70;
      const adThresholdQuarantine = Math.floor(adThresholdBlock * 4 / 7); // ~40

      if (adScore >= adThresholdBlock) {
        // ⛔ Block
        await markSeen(hash, source.id, env);
        const blockDetail = `🚫 تبلیغ قطعی (${adScore}/${adThresholdBlock})`;
        await logAction(
          source.id, 'skipped', blockDetail, env,
          post.link, post.views, post.text?.slice(0, 200),
          {
            breakdown: { ...dispatchBreakdown, ad_breakdown: adBreakdown, ad_reasons: adReasons },
            reactions: post.reactions,
            ad_score: adScore,
            ad_verdict: 'block',
          }
        );
        skipped++;
        continue;
      }

      if (adScore >= adThresholdQuarantine) {
        // ⚠️ Quarantine
        await markSeen(hash, source.id, env);
        try {
          await sendToQuarantine(post, source, { score: adScore, verdict: 'quarantine', reasons: adReasons }, env);
        } catch (e) {
          await logAction(source.id, 'error', `قرنطینه ناموفق: ${e.message}`, env);
        }
        const quarDetail = `⚠️ قرنطینه (${adScore}/${adThresholdQuarantine})`;
        await logAction(
          source.id, 'skipped', quarDetail, env,
          post.link, post.views, post.text?.slice(0, 200),
          {
            breakdown: { ...dispatchBreakdown, ad_breakdown: adBreakdown, ad_reasons: adReasons },
            reactions: post.reactions,
            ad_score: adScore,
            ad_verdict: 'quarantine',
          }
        );
        skipped++;
        continue;
      }

      // سیگنال پیش‌درآمد (sticker / متن کوتاه مشکوک)
      if (post.mediaType === 'sticker' || (post.text && post.text.length < 20)) {
        try { await setAdSignal(source.channel, env, post.mediaType === 'sticker' ? 'sticker' : 'short'); } catch {}
      }
    }

    // ═══════════════ ارسال پست ═══════════════
    // header شامل اطلاعات mode-specific است (طبق سند)
    const sendRes = await deliverPost(post, source, {
      foundKeywords,
      viralInfo,
      dispatchBreakdown,
      adScore,
      adVerdict,
    }, env);

    if (sendRes.ok) {
      sent++;
      await markSeen(hash, source.id, env);
      // ⚠️ طبق سند: "اگر ارسال شده و پست پاک تشخیص داده شده، باز هم امتیاز تبلیغاتیش را باید بنویسد"
      // پس در sent هم ad_breakdown را ذخیره می‌کنیم
      const sentDetail = `ارسال شد — ${source.mode} — ${dispatchDetail}${adVerdict !== 'clean' ? ` — Anti-Ad: ${adScore} (${adVerdict})` : ` — Anti-Ad: ${adScore}/۱۰۰ — ✅ پاک`}`;
      await logAction(
        source.id, 'sent', sentDetail, env,
        post.link, post.views, post.text?.slice(0, 200),
        {
          breakdown: { ...dispatchBreakdown, ad_breakdown: adBreakdown },
          reactions: post.reactions,
          ad_score: adScore,
          ad_verdict: adVerdict,
        }
      );
    } else {
      await logAction(source.id, 'error', `ارسال ناموفق: ${sendRes.description || ''}`, env, post.link, post.views);
    }

    // جلوگیری از بن شدن تلگرام
    await sleep(400);
  }

  // بروزرسانی آخرین پست دیده‌شده
  const maxId = posts.reduce((m, p) => Math.max(m, p.msgId || 0), 0);
  if (maxId > lastSeen) await setLastPost(source.id, maxId, env);

  // چک پست‌های قدیمی قرنطینه برای حذف (deletion detection)
  try { await checkDeletedPosts(source, env); } catch {}

  await logAction(source.id, 'scanned', `${scanned} بررسی / ${sent} ارسال / ${skipped} رد / ${duplicates} تکراری`, env);
  return { ok: true, sent, scanned, skipped, duplicates };
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ===========================================================================
//  سیستم هوش مصنوعی — Gemini (اصلی) + Workers AI (fallback)
//  Gemini پایدارتر، سریع‌تر و فارسی رو بهتر می‌فهمه.
//  اگه GEMINI_API_KEY تنظیم نشده باشه، خودکار به Workers AI برمی‌گرده.
// ===========================================================================

// مدل‌های Gemini کاندیدا (به ترتیب امتحان می‌شوند)
// آخرین مدل‌های Stable در API v1beta (تا شهریور ۱۴۰۵ / سپتامبر ۲۰۲۶):
//   - gemini-3.8-flash        → جدیدترین، هوشمندترین Flash (Stable) — پیشنهادی
//   - gemini-3.7-flash        → نسخه قبلی، Stable
//   - gemini-3.6-flash        → Stable، تعادل
//   - gemini-3.5-flash        → Stable، پایه
//   - gemini-3.5-flash-lite   → Stable، سبک
//   - gemini-2.5-flash        → هنوز فعال، با reasoning
// ⚠️ gemini-1.5-* و gemini-2.0-flash-lite قدیمی شده‌اند (404)
// منبع: https://ai.google.dev/gemini-api/docs/models (Sep 2026)
const GEMINI_MODELS = [
  'gemini-3.8-flash',           // جدیدترین Stable — بهترین گزینه
  'gemini-3.7-flash',           // Stable، نسخه قبلی
  'gemini-3.6-flash',           // Stable، تعادل
  'gemini-3.5-flash',           // Stable، پایه
  'gemini-3.5-flash-lite',      // Stable، سبک
  'gemini-2.5-flash',           // هنوز فعال، با reasoning
];

// مدل‌های Workers AI برای fallback (وقتی Gemini تنظیم نشده)
const CF_AI_MODELS = [
  '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
  '@cf/meta/llama-3.3-70b-instruct',
  '@cf/meta/llama-3-8b-instruct',
];

const AI_POSTS_COUNT = 30; // تعداد پست برای تحلیل AI
const AI_MODEL_CACHE_KEY = 'ai_provider_cache';

// کش provider موفق در KV
let _cachedProvider = null;

async function getCachedProvider(env) {
  if (_cachedProvider) return _cachedProvider;
  try {
    if (env.KV) {
      const m = await env.KV.get(AI_MODEL_CACHE_KEY);
      if (m) { _cachedProvider = m; return m; }
    }
  } catch {}
  return null;
}

async function setCachedProvider(env, provider) {
  _cachedProvider = provider;
  try {
    if (env.KV) await env.KV.put(AI_MODEL_CACHE_KEY, provider);
  } catch {}
}

// ─── فراخوانی Gemini API ───
// از fetch مستقیم استفاده می‌کنیم (Workers از fetch پشتیبانی می‌کند)
async function callGemini(env, prompt, maxTokens = 1000) {
  if (!env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY تنظیم نشده');
  }

  const cached = await getCachedProvider(env);
  // اگه مدل کش‌شده در لیست فعلی نیست (مثلاً gemini-1.5-pro قدیمی) → آن را نادیده بگیر
  const cachedValid = cached && cached.startsWith('gemini:')
    && GEMINI_MODELS.includes(cached.replace('gemini:', ''));
  const tryOrder = cachedValid
    ? [cached.replace('gemini:', ''), ...GEMINI_MODELS.filter(m => `gemini:${m}` !== cached)]
    : GEMINI_MODELS;

  let lastError = null;
  let firstAttemptModel = cachedValid ? cached.replace('gemini:', '') : null;
  for (const model of tryOrder) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;
      const body = {
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature: 0.7,
        },
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text();
        // 404 = مدل قدیمی → اگه اولین مدل کش‌شده بود، کش را پاک کن
        if (res.status === 404 && firstAttemptModel === model) {
          try { if (env.KV) await env.KV.delete(AI_MODEL_CACHE_KEY); } catch {}
          _cachedProvider = null;
        }
        throw new Error(`Gemini ${model}: HTTP ${res.status} — ${errText.slice(0, 200)}`);
      }

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text && text.trim()) {
        await setCachedProvider(env, `gemini:${model}`);
        return { provider: `gemini:${model}`, text: text.trim() };
      }
      lastError = new Error(`Gemini ${model}: پاسخ خالی`);
    } catch (e) {
      lastError = e;
      continue;
    }
  }
  throw lastError || new Error('همه مدل‌های Gemini ناموفق بودند');
}

// ─── فراخوانی Workers AI (fallback) ───
async function callWorkersAI(env, prompt, maxTokens = 1000) {
  if (!env.AI) {
    throw new Error('Workers AI فعال نیست');
  }

  for (const model of CF_AI_MODELS) {
    try {
      const res = await env.AI.run(model, {
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
      });

      let text = '';
      if (typeof res === 'string') text = res;
      else if (res?.response) text = res.response;
      else if (res?.result) text = res.result;
      else text = JSON.stringify(res);

      if (text && text.trim() && text !== '{}') {
        await setCachedProvider(env, `cfai:${model}`);
        return { provider: `cfai:${model}`, text: text.trim() };
      }
    } catch (e) {
      continue; // مدل بعدی امتحان شود
    }
  }
  throw new Error('همه مدل‌های Workers AI ناموفق بودند');
}

// ─── تابع اصلی — Gemini اول، Workers AI fallback ───
// options: { messages: [{role, content}], max_tokens }
async function runAIWithFallback(env, options) {
  // استخراج متن prompt از messages
  const prompt = (options.messages || [])
    .map(m => m.content || '')
    .filter(Boolean)
    .join('\n\n');

  if (!prompt) throw new Error('prompt خالی است');

  const maxTokens = options.max_tokens || 1000;
  const cached = await getCachedProvider(env);

  // تعیین ترتیب امتحان: اگه provider کش‌شده هست، اول همان
  const useGeminiFirst = env.GEMINI_API_KEY && (!cached || cached.startsWith('gemini:'));
  const useCFAIFirst = !useGeminiFirst && env.AI && cached && cached.startsWith('cfai:');

  // ۱. اگه Gemini موجود → اول Gemini
  if (useGeminiFirst) {
    try {
      return await callGemini(env, prompt, maxTokens);
    } catch (e) {
      // اگه Gemini fail شد و Workers AI موجود → fallback
      if (env.AI) {
        try {
          return await callWorkersAI(env, prompt, maxTokens);
        } catch (e2) {
          throw new Error(`Gemini: ${e.message} | Workers AI: ${e2.message}`);
        }
      }
      throw e;
    }
  }

  // ۲. اگه فقط Workers AI موجود
  if (env.AI) {
    try {
      return await callWorkersAI(env, prompt, maxTokens);
    } catch (e) {
      // اگه Gemini هم موجود → fallback
      if (env.GEMINI_API_KEY) {
        try {
          return await callGemini(env, prompt, maxTokens);
        } catch (e2) {
          throw new Error(`Workers AI: ${e.message} | Gemini: ${e2.message}`);
        }
      }
      throw e;
    }
  }

  // ۳. هیچکدام موجود نیست
  throw new Error('هیچ provider هوش مصنوعی تنظیم نشده — GEMINI_API_KEY یا Workers AI binding را اضافه کنید');
}

// ─── بررسی اینکه AI در دسترس هست یا نه ───
function isAIAvailable(env) {
  return !!(env.GEMINI_API_KEY || env.AI);
}

// ─── تحلیل روزانه: یک منبع به نوبت ───
async function runAIAnalysis(env) {
  if (!isAIAvailable(env)) return; // AI فعال نیست

  // ⚠️ طبق سند: auto keyword extraction فقط برای Deep modes (classic و scoring)
  // Forward و Viral نیاز به کلیدواژه ندارند
  const sources = await env.DB.prepare(
    "SELECT * FROM sources WHERE active = 1 AND topic != '' AND mode = 'deep' ORDER BY id ASC"
  ).all();
  if (!sources.results?.length) return;

  // خواندن ایندکس دورانی از D1
  let idxRow = await env.DB.prepare('SELECT value FROM kv_meta WHERE key = ?').bind('ai_scan_index').first();
  let idx = idxRow ? parseInt(idxRow.value, 10) : 0;
  idx = idx % sources.results.length;
  const source = sources.results[idx];
  await env.DB.prepare('INSERT OR REPLACE INTO kv_meta (key, value) VALUES (?,?)').bind('ai_scan_index', String((idx + 1) % sources.results.length)).run();

  // ⚠️ طبق سند: حداکثر ۲ تلاش در حالت خودکار
  let attempt = 0;
  const maxAttempts = 2;
  let lastError = null;
  while (attempt < maxAttempts) {
    attempt++;
    try {
      const r = await analyzeSourceWithAI(source, env);
      if (r.ok) return;
      lastError = r.error || 'unknown error';
      // اگه خطا از نوع AI بود (نه اسکرپ)، تلاش مجدد
      if (/AI|gemini|model|timeout/i.test(String(lastError)) && attempt < maxAttempts) {
        await logAction(source.id, 'error', `AI: تلاش ${attempt}/${maxAttempts} ناموفق — ${lastError} (تلاش مجدد...)`, env);
        await sleep(3000); // ۳ ثانیه صبر قبل از تلاش مجدد
        continue;
      }
      return; // اگه خطای غیر AI بود، تلاش مجدد بی‌فایده است
    } catch (e) {
      lastError = e.message;
      if (attempt < maxAttempts) {
        await logAction(source.id, 'error', `AI: تلاش ${attempt}/${maxAttempts} throw — ${e.message} (تلاش مجدد...)`, env);
        await sleep(3000);
        continue;
      }
    }
  }
  // همه تلاش‌ها ناموفق بودند
  await logAction(source.id, 'error', `AI: هوش مصنوعی فعلاً در دسترس نیست — ${lastError || 'unknown'}`, env);
}

async function analyzeSourceWithAI(source, env) {
  // ⚠️ طبق سند: فقط Deep modes نیاز به کلیدواژه دارند
  if (source.mode !== 'deep') {
    return { ok: false, error: 'این منبع در حالت Deep نیست — کلیدواژه لازم نیست' };
  }

  const result = await scrapeChannel(source.channel);
  if (!result.ok || !result.posts?.length) {
    await logAction(source.id, 'error', `AI: اسکرپ ناموفق: ${result.error}`, env);
    return { ok: false, error: result.error };
  }

  const posts = result.posts.slice(-AI_POSTS_COUNT);
  const allText = posts.map(p => p.text).filter(Boolean).join('\n---\n').slice(0, 4000);
  if (!allText) {
    await logAction(source.id, 'error', 'AI: متن کافی برای تحلیل نیست', env);
    return { ok: false, error: 'متن کافی نیست' };
  }

  const topic = source.topic || 'عمومی';
  // ⚠️ پرامپت‌های جدا برای Deep Classic و Deep Scoring (طبق سند)
  const isScoring = source.deep_scoring === 1 || source.deep_scoring === '1';

  let prompt;
  let expectedCategories;

  if (isScoring) {
    // ── Deep Scoring prompt ──
    prompt = `You are a keyword extraction API for a Telegram channel aggregation bot. The channel language is Persian (Farsi), so most keywords should be in Persian unless the channel topic is English-dominant.

Channel: @${source.channel}
Topic: "${topic}"

Below are ${posts.length} recent posts from this channel. Extract keywords for Deep Scoring (multi-criteria scoring) in 3 categories.

Keyword type definitions (CRITICAL — read carefully):
- MAIN (اصلی): A word or phrase that directly indicates the main topic and value of the post. Strongest marker. Each gives +40 score.
- COMPLEMENTARY (مکمل): A word or phrase that reinforces or confirms the main topic. Weaker than main. Each gives +15 score.
- PERIPHERAL (پیرامونی): A word or phrase that appears around the topic but does NOT indicate the main value of the content. Can reduce the score. Each gives -30 score. (Note: peripheral replaces "negative" in Deep Scoring.)

For each category, return 5-10 single words or short phrases (max 3-word phrases).

CRITICAL RULES:
1. Return ONLY a valid JSON object — no markdown, no code fences (no \`\`\`), no explanation.
2. JSON must start with { and end with }.
3. All keywords must be lowercase and trimmed.
4. No duplicate keywords across categories.
5. Include both Persian and English keywords if the channel uses both.

JSON format:
{"main":["kw1","kw2"],"complementary":["kw1","kw2"],"peripheral":["kw1","kw2"]}

Posts:
${allText}`;
    expectedCategories = ['main', 'complementary', 'peripheral'];
  } else {
    // ── Deep Classic prompt ──
    prompt = `You are a keyword extraction API for a Telegram channel aggregation bot. The channel language is Persian (Farsi), so most keywords should be in Persian unless the channel topic is English-dominant.

Channel: @${source.channel}
Topic: "${topic}"

Below are ${posts.length} recent posts from this channel. Extract keywords for Deep Classic (rule-based filtering) in 2 categories.

Keyword type definitions (CRITICAL — read carefully):
- POSITIVE (مثبت‌کننده): A word or phrase that shows the post is relevant and valuable to the topic. If present, post is sent. Each gives +score (for sending decision).
- NEGATIVE (منفی‌کننده): A word or phrase that shows the post is irrelevant or undesirable. If present (even with positive match), the post is rejected.

For each category, return 8-12 single words or short phrases (max 3-word phrases).

CRITICAL RULES:
1. Return ONLY a valid JSON object — no markdown, no code fences (no \`\`\`), no explanation.
2. JSON must start with { and end with }.
3. All keywords must be lowercase and trimmed.
4. No duplicate keywords across categories.
5. Include both Persian and English keywords if the channel uses both.

JSON format:
{"positive":["kw1","kw2"],"negative":["spam1","ad2"]}

Common Persian ad markers to include in NEGATIVE: فروش، خرید، تخفیف، رایگان، عضویت، کانال ما، عضو شوید، پشتیبانی، کد تخفیف.

Posts:
${allText}`;
    expectedCategories = ['positive', 'negative'];
  }

  let provider = null;
  try {
    const r = await runAIWithFallback(env, {
      messages: [
        { role: 'user', content: `INSTRUCTIONS: You are a keyword extraction API. You MUST respond with ONLY a valid JSON object — no markdown, no code fences, no explanation. Just the JSON object starting with { and ending with }.\n\n${prompt}` },
      ],
      max_tokens: 1000,
    });
    provider = r.provider;
    const responseText = r.text;

    // ⚠️ ثبت پاسخ خام AI (طبق سند — حتماً در لاگ ثبت شود، معتبر یا نامعتبر)
    // این کار بعد از parse انجام می‌شود تا اگه نامعتبر بود هم ثبت شود

    // responseText همیشه string است
    let cleaned = responseText.trim();
    cleaned = cleaned.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim();
    const jsonStart = cleaned.indexOf('{');
    const jsonEnd = cleaned.lastIndexOf('}');
    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      cleaned = cleaned.slice(jsonStart, jsonEnd + 1);
    }

    let parsed;
    let parseError = null;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      let fixed = cleaned.replace(/,\s*([}\]])/g, '$1');
      fixed = fixed.replace(/'/g, '"');
      fixed = fixed.replace(/\/\/.*$/gm, '');
      try {
        parsed = JSON.parse(fixed);
      } catch {
        // regex fallback برای همه دسته‌ها
        const extractKw = (key) => {
          const m = cleaned.match(new RegExp(`"${key}"\\s*:\\s*\\[([^\\]]*)\\]`, 'i'));
          if (!m) return [];
          return m[1].split(',').map(k => k.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
        };
        const extracted = {};
        for (const cat of expectedCategories) extracted[cat] = extractKw(cat);
        // برای Deep Classic: "positive" ممکن است به‌عنوان "main" بیاید (compat)
        if (!isScoring && !extracted.positive.length) extracted.positive = extractKw('main');
        const anyKeywords = Object.values(extracted).some(arr => arr.length > 0);
        if (anyKeywords) {
          parsed = extracted;
        } else {
          parseError = 'JSON نامعتبر';
          // ⚠️ ثبت پاسخ خام طبق سند (حتماً)
          await logAction(source.id, 'ai_raw', `AI: پاسخ نامعتبر`, env, '', 0, '', {
            ai_provider: provider,
            ai_raw: cleaned,
          });
          await logAction(source.id, 'error', `AI: JSON نامعتبر — پاسخ در ai_raw ذخیره شد`, env);
          return { ok: false, error: 'JSON نامعتبر — پاسخ AI ذخیره شد در لاگ' };
        }
      }
    }

    // ⚠️ ثبت پاسخ معتبر هم در ai_raw (طبق سند: «جواب هوش مصنوعی در این قسمت ثبت می‌شود»)
    await logAction(source.id, 'ai_analyze', `AI (${provider || 'unknown'}): تحلیل موفق`, env, '', 0, '', {
      ai_provider: provider,
      ai_raw: cleaned.slice(0, 2000),
    });

    // استخراج کلیدواژه‌ها از هر دسته
    const extracted = {};
    for (const cat of expectedCategories) {
      extracted[cat] = (parsed[cat] || []).filter(k => k && String(k).trim());
    }

    // برای Deep Classic: قبول "main" به‌عنوان alias برای "positive" (compat)
    if (!isScoring && !extracted.positive.length && parsed.main) {
      extracted.positive = parsed.main.filter(k => k && String(k).trim());
    }

    // حداقل یک کلیدواژه اصلی/مثبت باید موجود باشد
    const primaryList = isScoring ? extracted.main : extracted.positive;
    if (!primaryList || !primaryList.length) {
      await logAction(source.id, 'error', `AI: کلیدواژه اصلی یافت نشد`, env);
      return { ok: false, error: 'کلیدواژه یافت نشد' };
    }

    // ذخیره pending بر اساس حالت
    if (isScoring) {
      await env.DB.prepare(
        'UPDATE sources SET pending_keywords_main = ?, pending_keywords_complementary = ?, pending_keywords_peripheral = ? WHERE id = ?'
      ).bind(
        JSON.stringify(extracted.main),
        JSON.stringify(extracted.complementary || []),
        JSON.stringify(extracted.peripheral || []),
        source.id
      ).run();
    } else {
      await env.DB.prepare(
        'UPDATE sources SET pending_keywords_positive = ?, pending_keywords_negative = ? WHERE id = ?'
      ).bind(
        JSON.stringify(extracted.positive),
        JSON.stringify(extracted.negative || []),
        source.id
      ).run();
    }

    // ساخت متن گزارش و دکمه‌ها برای ادمین
    const totalKeywords = Object.values(extracted).reduce((s, arr) => s + (arr?.length || 0), 0);
    await logAction(source.id, 'ai_analyze', `AI: ${totalKeywords} کلیدواژه در ${expectedCategories.length} دسته`, env);

    const adminId = env.MAIN_ADMIN_ID;
    let msg = `🤖 <b>کلیدواژه‌های پیشنهادی AI</b>\n\n`;
    msg += `📡 منبع: @${source.channel}\n`;
    msg += `📝 موضوع: ${topic}\n`;
    msg += `🔧 نوع: ${isScoring ? 'Deep Scoring' : 'Deep Classic'}\n`;
    msg += `📊 تحلیل ${posts.length} پست اخیر\n`;
    msg += `🤖 مدل: <code>${provider || 'unknown'}</code>\n\n`;

    const kb = { inline_keyboard: [] };
    const selection = {};

    // نمایش هر دسته با toggle buttons
    const categoryLabels = isScoring
      ? { main: '✅ اصلی', complementary: '➕ مکمل', peripheral: '⚠️ پیرامونی' }
      : { positive: '✅ مثبت‌کننده', negative: '🚫 منفی‌کننده' };

    const categoryEmojis = isScoring
      ? { main: '✅', complementary: '➕', peripheral: '⚠️' }
      : { positive: '✅', negative: '🚫' };

    const categoryCallbacks = isScoring
      ? { main: 'ai_toggle_main', complementary: 'ai_toggle_comp', peripheral: 'ai_toggle_periph' }
      : { positive: 'ai_toggle_pos', negative: 'ai_toggle_neg' };

    for (const cat of expectedCategories) {
      const list = extracted[cat] || [];
      if (list.length) {
        msg += `\n<b>${categoryLabels[cat]}:</b>\n`;
        list.forEach((kw, i) => {
          msg += `• ${kw}\n`;
          kb.inline_keyboard.push([{
            text: `${categoryEmojis[cat]} ${kw}`,
            callback_data: `${categoryCallbacks[cat]}:${source.id}:${i}`,
          }]);
        });
        // ذخیره در selection
        const shortKey = isScoring
          ? { main: 'main', complementary: 'comp', peripheral: 'periph' }[cat]
          : { positive: 'pos', negative: 'neg' }[cat];
        selection[shortKey] = list.map(() => true);
        selection[`${shortKey}Kw`] = list;
      }
    }

    msg += `\n💡 برای انتخاب/لغو هر کلیدواژه روی آن کلیک کنید.\n`;
    msg += `برای اعمال، دکمه «تأیید» را بزنید.`;

    await env.KV.put(`ai_selection:${source.id}`, JSON.stringify(selection), { expirationTtl: 600 });

    // دکمه‌های اقدام — شامل retry (طبق سند: «به کاربر نشان دهد که دوباره امتحان کند»)
    kb.inline_keyboard.push(
      [{ text: '➕ اضافه به فعلی‌ها', callback_data: `ai_apply:${source.id}:add` }],
      [{ text: '🔄 جایگزین کل فعلی‌ها', callback_data: `ai_apply:${source.id}:replace` }],
      [{ text: '❌ رد همه', callback_data: `ai_reject:${source.id}` }],
      [{ text: '🔄 تحلیل مجدد', callback_data: `ai_reanalyze:${source.id}` }],
    );
    await sendMsg(adminId, msg, env, kb);
    return { ok: true, ...extracted };
  } catch (e) {
    const errMsg = e.message || String(e);
    const friendlyMsg = /5028|deprecated/i.test(errMsg)
      ? `مدل AI deprecated شده — همه مدل‌های کاندیدا امتحان شدند ولی موفق نشد.`
      : /8006/.test(errMsg)
        ? `خطای مدل AI (8006): ساختار درخواست نامعتبر.`
        : errMsg;
    // ⚠️ ثبت خطای AI در لاگ
    await logAction(source.id, 'error', `AI: ${friendlyMsg}`, env, '', 0, '', {
      ai_provider: provider,
      ai_raw: errMsg.slice(0, 2000),
    });
    return { ok: false, error: friendlyMsg };
  }
}

// ─── گزارش روزانه هوشمند ───
// طبق سند: منابع هم‌موضوع را گروه‌بندی کن، ۲۰ پست ارسالی آخر هر کانال را
// به AI بفرست، پاسخ‌ها را موقتاً ذخیره کن، سپس همه را در یک گزارش نهایی بچسبان.
// پنجره زمانی: ۳ تا ۶ صبح ایران (cron 23:30 UTC = ۳ بامداد ایران — تنظیم شده)
// کانال‌های Viral Mode نیازی به این ندارند — معیار آن‌ها ری‌اکشن است.
async function runDailyReport(env) {
  const since = Date.now() - 24 * 60 * 60 * 1000;
  const adminId = env.MAIN_ADMIN_ID;

  // جمع‌آوری پست‌های ارسالی ۲۴ ساعت اخیر
  const sentLogs = await env.DB.prepare(
    "SELECT l.*, s.channel, s.mode, s.topic FROM logs l JOIN sources s ON l.source_id = s.id WHERE l.action = 'sent' AND l.created_at > ? ORDER BY l.views DESC"
  ).bind(since).all();

  const sentPosts = sentLogs.results || [];
  if (!sentPosts.length) {
    await sendMsg(adminId, '📊 <b>گزارش روزانه</b>\n\n📭 در ۲۴ ساعت گذشته پستی ارسال نشده است.', env);
    // ⚠️ ثبت در لاگ (طبق سند: «نوع اجرا توسط Cron یا به شکلی دستی... در لاگ ثبت می‌کند»)
    await logAction(0, 'daily_report', 'گزارش روزانه: پستی ارسال نشده', env);
    return;
  }

  // گروه‌بندی بر اساس موضوع — منابع Viral جدا
  const byTopic = {};
  const viralPosts = [];
  for (const log of sentPosts) {
    const topic = log.topic || 'عمومی';
    if (log.mode === 'viral') {
      viralPosts.push(log);
    } else {
      if (!byTopic[topic]) byTopic[topic] = [];
      byTopic[topic].push(log);
    }
  }

  let report = `📊 <b>گزارش روزانه</b>\n🕐 ۲۴ ساعت گذشته\n`;
  report += `📈 مجموع ارسال: ${sentPosts.length}\n\n`;

  let aiProvider = null;
  let aiRawResponses = [];

  // ── پردازش هر موضوع به‌صورت جدا (طبق سند) ──
  for (const [topic, posts] of Object.entries(byTopic)) {
    report += `━━━━━━━━━━━━━\n`;
    report += `📂 <b>موضوع: ${topic}</b>\n`;
    report += `(${posts.length} پست)\n\n`;

    // گروه‌بندی بر اساس کانال در این موضوع
    const byChannel = {};
    for (const p of posts) {
      const ch = p.channel || 'نامشخص';
      if (!byChannel[ch]) byChannel[ch] = [];
      byChannel[ch].push(p);
    }

    const channels = Object.keys(byChannel);
    report += `📡 منابع: ${channels.map(c => '@' + c).join('، ')}\n\n`;

    // ⚠️ طبق سند: ۲۰ پست ارسالی آخر هر کانال (در این موضوع) را به AI بفرست
    // محدودیت توکن: فقط ۲۰ پست کل، نه ۲۰ تا از هر کانال
    const postsForAI = posts.slice(0, 20);

    if (isAIAvailable(env) && postsForAI.length >= 3) {
      const postsText = postsForAI.map((p, i) =>
        `${i + 1}. [@${p.channel}] ${p.post_text || p.detail || 'بدون متن'} — ${p.post_link}`
      ).join('\n');

      try {
        const r = await runAIWithFallback(env, {
          messages: [
            { role: 'user', content: `INSTRUCTIONS: You are a content summarizer. Given Telegram posts from multiple channels about topic "${topic}", create a brief daily digest in Persian. For each post, write ONE line with: a short title + channel name + link. Group by importance. Keep it concise. Use emojis. Max 20 lines.\n\nSummarize these ${postsForAI.length} posts from ${channels.length} channels:\n${postsText}` },
          ],
          max_tokens: 1000,
        });
        aiProvider = r.provider;
        aiRawResponses.push({ topic, raw: r.text });
        report += r.text.trim() + '\n\n';
      } catch (e) {
        // fallback: لیست ساده
        for (const [ch, chPosts] of Object.entries(byChannel)) {
          report += `<b>📍 @${ch}</b> (${chPosts.length} پست)\n`;
          for (const p of chPosts.slice(0, 5)) {
            report += `  • <a href="${p.post_link}">${escapeHtml((p.post_text || p.detail || 'پست').slice(0, 60))}</a>\n`;
          }
        }
        report += '\n';
      }
    } else {
      // بدون AI: لیست ساده با تفکیک کانال
      for (const [ch, chPosts] of Object.entries(byChannel)) {
        report += `<b>📍 @${ch}</b> (${chPosts.length} پست)\n`;
        for (const p of chPosts.slice(0, 5)) {
          report += `  • <a href="${p.post_link}">${escapeHtml((p.post_text || p.detail || 'پست').slice(0, 60))}</a>\n`;
        }
      }
      report += '\n';
    }
  }

  // ── بخش وایرال (مرتب بر اساس بازدید) ──
  // ⚠️ طبق سند: کانال‌های Viral Mode به AI فرستاده نمی‌شوند — معیار آن‌ها پُرری‌اکشن‌ترین پست‌هاست
  if (viralPosts.length) {
    viralPosts.sort((a, b) => (b.views || 0) - (a.views || 0));
    report += `━━━━━━━━━━━━━\n`;
    report += `🔥 <b>پست‌های وایرال</b> (${viralPosts.length} پست)\n\n`;
    for (const p of viralPosts.slice(0, 10)) {
      report += `👁 ${formatViews(p.views || 0)} • @${p.channel} • <a href="${p.post_link}">${escapeHtml((p.post_text || p.detail || 'پست وایرال').slice(0, 50))}</a>\n`;
    }
    report += '\n';
  }

  report += `━━━━━━━━━━━━━\n`;
  report += `🤖 تولیدشده توسط ${aiProvider || 'بدون AI'}`;

  await sendMsg(adminId, report, env);

  // ⚠️ ثبت در لاگ (طبق سند: «نوع اجرا توسط Cron یا به شکلی دستی... در لاگ ثبت می‌کند»)
  await logAction(0, 'daily_report', `گزارش روزانه — ${sentPosts.length} پست، ${Object.keys(byTopic).length} موضوع`, env, '', 0, '', {
    ai_provider: aiProvider,
    ai_raw: aiRawResponses.length ? JSON.stringify(aiRawResponses).slice(0, 3000) : null,
  });
}

// ===========================================================================
//  وب‌هوک تلگرام — هندلر اصلی
// ===========================================================================
async function handleWebhook(request, env, ctx) {
  let update;
  try { update = await request.json(); }
  catch { return json({ ok: false }); }

  try {
    if (update.callback_query) {
      ctx.waitUntil(handleCallback(update.callback_query, env));
    } else if (update.message) {
      ctx.waitUntil(handleMessage(update.message, env, ctx));
    } else if (update.my_chat_member) {
      // تشخیص اضافه/حذف/ارتقای ربات در گروه‌ها
      ctx.waitUntil(handleMyChatMember(update.my_chat_member, env));
    }
  } catch (e) {
    console.error('webhook error', e);
  }
  return json({ ok: true });
}

// ===========================================================================
//  هندلر my_chat_member — تشخیص نصب ربات در گروه‌ها
// ===========================================================================
async function handleMyChatMember(update, env) {
  const chat = update.chat;
  const newStatus = update.new_chat_member?.status;
  const oldStatus = update.old_chat_member?.status;

  // ربات ادمین شد (یا از ابتدا ادمین اضافه شد)
  if (newStatus === 'administrator' && oldStatus !== 'administrator') {
    const isForum = !!(chat.is_forum || (chat.type === 'supergroup' && chat.is_forum));
    let msg = '✅ نصب موفق آمیز بود!\n\n';
    msg += `📡 گروه: <b>${escHtml(chat.title || '—')}</b>\n`;
    msg += `🆔 <code>${chat.id}</code>\n`;
    msg += `👤 وضعیت ربات: <b>ادمین</b> ✅\n`;
    msg += '\n⚠️ <b>مهم — Privacy Mode:</b>\n';
    msg += 'برای اینکه ربات بتواند پیام‌های متنی شما (مثل کلیدواژه‌ها) را در گروه ببیند، ';
    msg += 'Privacy Mode باید <b>غیرفعال</b> باشد. در غیر این صورت، ربات فقط دستورات (شروع‌شده با /) را می‌بیند.\n\n';
    msg += '🔧 برای غیرفعال کردن:\n';
    msg += '۱. به <a href="https://t.me/BotFather">@BotFather</a> بروید\n';
    msg += '۲. /setprivacy را بفرستید\n';
    msg += '۳. ربات خود را انتخاب کنید\n';
    msg += '۴. <b>Disable</b> را انتخاب کنید\n\n';
    if (isForum) {
      msg += `📋 این گروه <b>تاپیک‌دار</b> است.\n`;
      msg += `⚠️ برای ارسال به تاپیک دلخواه، پس از افزودن منبع از /settarget استفاده کنید.\n\n`;
    }
    msg += 'ربات آماده‌ی کار است. منابع را با /addsource اضافه کنید.';
    await sendMsg(chat.id, msg, env, mainMenuKb());
    await logAction(0, 'installed', `ربات ادمین شد در «${chat.title}» (${chat.id})`, env);
    return;
  }

  // ربات اضافه شد اما ادمین نیست
  if (newStatus === 'member' && (oldStatus === 'left' || oldStatus === 'kicked')) {
    try {
      await sendMsg(chat.id,
        '👋 ربات به گروه اضافه شد!\n\n' +
        '⚠️ <b>ربات ادمین نیست.</b>\n' +
        'برای ارسال پیام، ربات باید ادمین گروه باشد.\n' +
        'لطفاً ربات را ادمین کنید.', env);
      await logAction(0, 'added', `ربات اضافه شد (غیرادمین) در «${chat.title}» (${chat.id})`, env);
    } catch (e) {
      // ممکن است ربات نتواند پیام بفرستد اگر محدود است
      console.error('Cannot send to added chat', e);
    }
    return;
  }

  // ربات حذف شد
  if (newStatus === 'left' || newStatus === 'kicked') {
    await logAction(0, 'removed', `ربات حذف شد از «${chat.title}» (${chat.id})`, env);
    return;
  }
}

function escHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ===========================================================================
//  پردازش پیام‌ها (دستورات + ماشین حالت)
// ===========================================================================
async function handleMessage(message, env, ctx) {
  const chatId = message.chat.id;
  const userId = message.from.id;
  const text = message.text || message.caption || '';

  // فقط ادمین‌ها
  if (!(await isAdmin(userId, env))) {
    return; // سکوت در برابر غیرادمین
  }

  // ری‌اکشن فقط روی دستورات (پیام‌هایی که با / شروع می‌شوند)
  // پیام‌های عادی در ویزارد (مثلاً نام کانال یا کلیدواژه) ری‌اکشن نمی‌گیرند
  const isCommand = text.startsWith('/');
  if (isCommand) {
    await react(chatId, message.message_id, env);
  }

  // ⚠️ اگر کاربر یک دستور فرستاده (شروع با /)، حتی در وسط ویزارد،
  // دستور جدید را اجرا کن — مگر اینکه /cancel باشد که در state هندل می‌شود.
  if (isCommand && text.trim() !== '/cancel') {
    const parsed = parseCommand(text);
    if (parsed) {
      const { cmd, args } = parsed;
      // ⚠️ بررسی دسترسی ادمین فرعی
      const hasPermission = await checkPermission(userId, cmd, env);
      if (!hasPermission) {
        const tid = message.message_thread_id || null;
        return sendMsg(chatId, `⛔ شما دسترسی به این دستور ندارید.\n\nدستور <code>/${cmd}</code> برای ادمین‌های فرعی محدود است.\nبرای دریافت دسترسی با ادمین اصلی تماس بگیرید.`, env, null, 'HTML', tid);
      }
      const cmds = {
        start: cmdStart, help: cmdHelp,
        addsource: cmdAddSource, addsource_bulk: cmdAddSourceBulk,
        settarget: cmdSetTarget,
        delsource: cmdDelSource, scansingle: cmdScanSingle,
        listsources: cmdListSources, backup: cmdBackup, restore: cmdRestore,
        addadmin: cmdAddAdmin, deladmin: cmdDelAdmin, admins: cmdAdmins,
        scan: cmdScanNow, stats: cmdStats, cancel: cmdCancel,
        ping: cmdPing, check: cmdCheck,
        settopic: cmdSetTopic, aianalyze: cmdAIAnalyze, report: cmdReport,
        setpermissions: cmdSetPermissions,
        adblock: cmdAdBlock,
        balancad: cmdBalancAd,
      };
      // پاک کردن state قبلی چون کاربر دستور جدیدی زده
      await clearState(userId, env);
      const handler = cmds[cmd];
      if (handler) return handler({ message, chatId, userId, args, text, env });
      return sendMsg(chatId, '❓ دستور ناشناخته. /help را بزنید.', env, null, 'HTML', message.message_thread_id || null);
    }
  }

  // اگر در وسط یک ویزارد (state) هستیم
  const state = await getState(userId, env);
  if (state && state.step) {
    return handleStateMessage(message, state, env);
  }

  // اگر到此جا رسید و دستور بود ولی handler نداشت
  if (isCommand) {
    return sendMsg(chatId, '❓ دستور ناشناخته. /help را بزنید.', env, null, 'HTML', message.message_thread_id || null);
  }

  // ─── فوروارد پست فقط با /balancad فعال می‌شه — خودکار نیست (جلوگیری از اشتباه) ───
  return; // پیام غیردستوری خارج از ویزارد — نادیده گرفته شود
}

function parseCommand(text) {
  if (!text || !text.startsWith('/')) return null;
  // حذف @botname
  const clean = text.replace(/@\w+\s*/, ' ');
  const parts = clean.trim().split(/\s+/);
  const cmd = parts[0].slice(1).toLowerCase();
  const args = parts.slice(1).join(' ');
  return { cmd, args };
}

// ===========================================================================
//  ماشین حالت (ویزارد مرحله‌ای با دکمه شیشه‌ای)
// ===========================================================================
async function getState(userId, env) {
  const v = await env.KV.get(`state:${userId}`);
  return v ? JSON.parse(v) : null;
}
async function setState(userId, state, env) {
  await env.KV.put(`state:${userId}`, JSON.stringify(state), { expirationTtl: 600 });
}
async function clearState(userId, env) {
  await env.KV.delete(`state:${userId}`);
}

async function handleStateMessage(message, state, env) {
  const chatId = message.chat.id;
  const userId = message.from.id;
  const text = (message.text || '').trim();
  // ⚠️ threadId = تاپیکی که کاربر در آن پیام فرستاده. همه پاسخ‌ها باید همین‌جا فرستاده شوند.
  const threadId = message.message_thread_id || state.threadId || null;
  // اگر state هنوز threadId ندارد، آن را ذخیره کن
  if (!state.threadId && threadId) {
    state.threadId = threadId;
    await setState(userId, state, env);
  }

  if (text === '/cancel' || text === 'لغو') {
    await clearState(userId, env);
    return sendMsg(chatId, '✅ عملیات لغو شد.', env, cancelKb(), 'HTML', threadId);
  }

  switch (state.step) {
    // ── افزودن منبع ──
    case 'add_channel': {
      const channels = text.split(',').map(s => s.trim()).filter(Boolean);
      if (!channels.length) return sendWizardPrompt(chatId, '⚠️ <b>خطا</b>\n\n<blockquote>لطفاً حداقل یک آیدی کانال بفرستید.</blockquote>', env, threadId);
      await setState(userId, { ...state, step: 'add_mode', channels }, env);
      return sendMsg(chatId, '🎯 <b>حالت اسکن را انتخاب کنید:</b>', env, modeKb(), 'HTML', threadId);
    }
    case 'add_topic': {
      const topic = text.trim() || 'عمومی';
      await setState(userId, { ...state, step: 'add_topic_done', topic, threadId }, env);
      // ⚠️ طبق درخواست کاربر: مرحله انتخاب مقصد حذف شد
      // مقصد = همان چت/تاپیکی که کاربر دستور را در آن داده است
      if (state.mode === 'forward') {
        await finalizeAddSource(userId, { ...state, topic, target_chat_id: String(chatId), target_topic_id: threadId || null }, env);
        return;
      } else if (state.mode === 'deep') {
        // ⚠️ ابتدا نوع Deep را بپرس (Classic یا Scoring) — طبق سند: ۲ حالت دارد
        await setState(userId, { ...state, step: 'add_deep_type', topic, threadId }, env);
        return sendMsg(chatId, '🔧 <b>نوع Deep را انتخاب کنید:</b>', env, deepTypeKb(), 'HTML', threadId);
      } else if (state.mode === 'viral') {
        // ⚠️ طبق سند: معیار Viral = ری‌اکشن (نه views)
        // ابتدا کاربر باید ری‌اکشن‌های موردنظر را انتخاب کند
        await setState(userId, { ...state, step: 'add_viral_reactions', topic, viral_reactions: [], threadId }, env);
        let msg = '👁 <b>حالت وایرال — معیار ری‌اکشن</b>\n\n';
        msg += '<blockquote>طبق سند، معیار حالت وایرال <b>ری‌اکشن‌های پست</b> است (نه بازدید).\n\n';
        msg += '۱) می‌توانید یک یا چند ری‌اکشن خاص با آستانه‌های جداگانه تنظیم کنید (همه باید عبور کنند)\n';
        msg += '۲) یا فقط آستانه‌ی <b>مجموع همه ری‌اکشن‌ها</b> را مشخص کنید\n\n';
        msg += 'ابتدا ری‌اکشن‌های موردنظر را با کلیک انتخاب کنید. سپس دکمه «تأیید» را بزنید.</blockquote>';
        return sendMsg(chatId, msg, env, reactionPickerKb({ viral_reactions: [] }), 'HTML', threadId);
      }
      return;
    }
    // ── Deep Classic: کلیدواژه‌های مثبت‌کننده ──
    case 'add_keywords_pos': {
      const kw = text.split(',').map(s => s.trim()).filter(Boolean);
      await setState(userId, { ...state, step: 'add_keywords_neg', keywords_positive: kw }, env);
      return sendWizardPrompt(chatId, '🚫 <b>کلیدواژه‌های منفی‌کننده</b>\n\n<blockquote>کلماتی که اگر در پست باشند، محتوا ارسال نشود (حتی اگه کلیدواژه مثبت هم داشته باشد).\nبا کاما جدا کنید.\n\nبرای رد شدن بفرستید: <code>-</code></blockquote>', env, threadId);
    }
    case 'add_keywords_neg': {
      const neg = text === '-' ? [] : text.split(',').map(s => s.trim()).filter(Boolean);
      // ⚠️ حذف مرحله مقصد — مستقیماً finalize با مقصد = همین چت
      await finalizeAddSource(userId, { ...state, keywords_negative: neg, target_chat_id: String(chatId), target_topic_id: threadId || null }, env);
      return;
    }

    // ── Deep Scoring: کلیدواژه‌های اصلی ──
    case 'add_keywords_main': {
      const kw = text.split(',').map(s => s.trim()).filter(Boolean);
      await setState(userId, { ...state, step: 'add_keywords_comp', keywords_main: kw }, env);
      return sendWizardPrompt(chatId, '➕ <b>کلیدواژه‌های مکمل</b>\n\n<blockquote>کلماتی که موضوع اصلی را تقویت می‌کنند.\nبا کاما جدا کنید.\n\n<b>امتیاز:</b> +۱۵ هر کلمه\n\nبرای رد شدن بفرستید: <code>-</code></blockquote>', env, threadId);
    }
    case 'add_keywords_comp': {
      const comp = text === '-' ? [] : text.split(',').map(s => s.trim()).filter(Boolean);
      await setState(userId, { ...state, step: 'add_keywords_periph', keywords_complementary: comp }, env);
      return sendWizardPrompt(chatId, '⚠️ <b>کلیدواژه‌های پیرامونی</b>\n\n<blockquote>کلماتی که در اطراف موضوع دیده می‌شوند اما ارزش اصلی را نشان نمی‌دهند — باعث کاهش امتیاز می‌شوند.\nبا کاما جدا کنید.\n\n<b>امتیاز:</b> -۳۰ هر کلمه\n\nبرای رد شدن بفرستید: <code>-</code></blockquote>', env, threadId);
    }
    case 'add_keywords_periph': {
      const periph = text === '-' ? [] : text.split(',').map(s => s.trim()).filter(Boolean);
      await setState(userId, { ...state, step: 'add_deep_threshold', keywords_peripheral: periph }, env);
      return sendWizardPrompt(chatId, '📊 <b>آستانه امتیاز Deep Scoring</b>\n\n<blockquote>حداقل امتیاز لازم برای ارسال پست.\nپیش‌فرض: <code>50</code>\n\nیک عدد بفرستید:</blockquote>', env, threadId);
    }
    case 'add_deep_threshold': {
      const n = parseInt(text, 10);
      if (isNaN(n) || n < 0) return sendWizardPrompt(chatId, '⚠️ عدد معتبر بفرستید.', env, threadId);
      // ⚠️ حذف مرحله مقصد — مستقیماً finalize با مقصد = همین چت
      await finalizeAddSource(userId, { ...state, deep_threshold: n, target_chat_id: String(chatId), target_topic_id: threadId || null }, env);
      return;
    }

    // ── Viral: آستانه برای ری‌اکشن خاص (بعد از انتخاب از reactionPickerKb) ──
    case 'add_viral_threshold': {
      const n = parseInt(text, 10);
      if (isNaN(n) || n < 0) return sendWizardPrompt(chatId, '⚠️ عدد معتبر بفرستید.', env, threadId);
      // این آستانه برای آخرین ری‌اکشن انتخاب‌شده است
      const pendingEmoji = state.pending_viral_emoji;
      if (pendingEmoji) {
        const rules = state.viral_reactions || [];
        rules.push({ emoji: pendingEmoji, threshold: n });
        await setState(userId, { ...state, step: 'add_viral_reactions', viral_reactions: rules, pending_viral_emoji: null }, env);
        let msg = `✅ ری‌اکشن ${pendingEmoji} با آستانه <b>${n}</b> ثبت شد.\n\n`;
        msg += `قوانین فعلی:\n`;
        for (const r of rules) msg += `  ${r.emoji} ≥ ${r.threshold}\n`;
        msg += `\nاگه ری‌اکشن دیگری می‌خواهید، انتخاب کنید. وگرنه «تأیید» را بزنید.`;
        return sendMsg(chatId, msg, env, reactionPickerKb({ viral_reactions: rules }), 'HTML', threadId);
      }
      // fallback اگه pending_viral_emoji نبود → این آستانه برای مجموع ری‌اکشن‌هاست
      // ⚠️ حذف مرحله مقصد — مستقیماً finalize با مقصد = همین چت
      await finalizeAddSource(userId, { ...state, viral_threshold: n, viral_reactions: [], target_chat_id: String(chatId), target_topic_id: threadId || null }, env);
      return;
    }

    // ── Viral: آستانه مجموع (وقتی کاربر «فقط مجموع» را زده) ──
    case 'add_viral_total_threshold': {
      const n = parseInt(text, 10);
      if (isNaN(n) || n < 0) return sendWizardPrompt(chatId, '⚠️ عدد معتبر بفرستید.', env, threadId);
      // ⚠️ حذف مرحله مقصد — مستقیماً finalize با مقصد = همین چت
      await finalizeAddSource(userId, { ...state, viral_threshold: n, viral_reactions: [], target_chat_id: String(chatId), target_topic_id: threadId || null }, env);
      let msg = `✅ آستانه مجموع ری‌اکشن‌ها: <b>${n}</b>\n\n`;
      msg += `پست‌هایی که مجموع ری‌اکشن‌هایشان ≥ ${n} باشد، ارسال می‌شوند.\n`;
      msg += `📍 مقصد: این چت (${threadId ? 'تاپیک ' + threadId : 'جنرال'})`;
      return sendMsg(chatId, msg, env, null, 'HTML', threadId);
    }
    case 'add_target_input': {
      const m = text.match(/^(-?\d+)(?::(\d+))?$/);
      if (!m) return sendWizardPrompt(chatId, '⚠️ فرمت اشتباه. مثال: -100123456789 یا -100123456789:45', env, threadId);
      await finalizeAddSource(userId, { ...state, target_chat_id: m[1], target_topic_id: m[2] || null }, env);
      return;
    }

    // ── ویرایش گروهی ──
    case 'edit_select': {
      const ids = text.split(',').map(s => parseInt(s.trim(), 10)).filter(Boolean);
      if (!ids.length) return sendWizardPrompt(chatId, '⚠️ آیدی‌های معتبر بفرستید.', env, threadId);
      await setState(userId, { ...state, step: 'edit_field', source_ids: ids }, env);
      return sendMsg(chatId, '🔧 چه فیلدی را ویرایش کنیم؟', env, editFieldKb(), 'HTML', threadId);
    }
    case 'edit_keywords_pos': {
      const kw = text.split(',').map(s => s.trim()).filter(Boolean);
      await setState(userId, { ...state, step: 'edit_keywords_neg', keywords_positive: kw }, env);
      return sendWizardPrompt(chatId, '🚫 کلیدواژه‌های منفی جدید (یا - برای خالی):', env, threadId);
    }
    case 'edit_keywords_neg': {
      const neg = text === '-' ? [] : text.split(',').map(s => s.trim()).filter(Boolean);
      await setState(userId, { ...state, step: 'edit_confirm', keywords_negative: neg }, env);
      return showEditConfirm(userId, { ...state, threadId }, env);
    }
    case 'edit_keywords_comp': {
      const kw = text === '-' ? [] : text.split(',').map(s => s.trim()).filter(Boolean);
      await setState(userId, { ...state, step: 'edit_confirm', keywords_complementary: kw }, env);
      return showEditConfirm(userId, { ...state, keywords_complementary: kw, threadId }, env);
    }
    case 'edit_keywords_periph': {
      const kw = text === '-' ? [] : text.split(',').map(s => s.trim()).filter(Boolean);
      await setState(userId, { ...state, step: 'edit_confirm', keywords_peripheral: kw }, env);
      return showEditConfirm(userId, { ...state, keywords_peripheral: kw, threadId }, env);
    }
    case 'edit_deep_threshold_input': {
      const n = parseInt(text, 10);
      if (isNaN(n) || n <= 0) return sendWizardPrompt(chatId, '⚠️ عدد معتبر بفرستید.', env, threadId);
      await setState(userId, { ...state, step: 'edit_confirm', deep_threshold: n }, env);
      return showEditConfirm(userId, { ...state, deep_threshold: n, threadId }, env);
    }
    case 'add_viral_reactions': {
      const n = parseInt(text, 10);
      if (!isNaN(n) && n >= 0) {
        const pendingEmoji = state.pending_viral_emoji;
        if (pendingEmoji) {
          const rules = state.viral_reactions || [];
          rules.push({ emoji: pendingEmoji, threshold: n });
          await setState(userId, { ...state, viral_reactions: rules, pending_viral_emoji: null }, env);
          let msg = `✅ ری‌اکشن ${pendingEmoji} با آستانه <b>${n}</b> ثبت شد.\n\nقوانین فعلی:\n`;
          for (const r of rules) msg += `  ${r.emoji} ≥ ${r.threshold}\n`;
          msg += `\nاگه ری‌اکشن دیگری می‌خواهید، از دکمه‌ها انتخاب کنید یا «✅ تأیید و ادامه» را بزنید.`;
          return sendMsg(chatId, msg, env, reactionPickerKb({ viral_reactions: rules }), 'HTML', threadId);
        } else {
          await setState(userId, { ...state, viral_threshold: n }, env);
          return sendMsg(chatId, `🔢 آستانه مجموع ری‌اکشن‌ها: <b>${n}</b> تنظیم شد.\nبرای ذخیره دکمه «✅ تأیید و ادامه» را بزنید.`, env, reactionPickerKb({ viral_reactions: state.viral_reactions || [] }), 'HTML', threadId);
        }
      }
      if (/^(تایید|تأیید|تمام|پایان|done|ok|بله)$/i.test(text.trim())) {
        const stateForFinalize = {
          ...state,
          viral_threshold: state.viral_threshold || 1000,
          viral_reactions: state.viral_reactions || [],
          target_chat_id: String(chatId),
          target_topic_id: threadId || null,
          chatId: String(chatId),
        };
        await finalizeAddSource(userId, stateForFinalize, env);
        return;
      }
      return sendMsg(chatId, `⚠️ لطفاً یکی از ری‌اکشن‌های زیر را انتخاب کنید یا دکمه «✅ تأیید و ادامه» را بزنید.\n(برای لغو /cancel)`, env, reactionPickerKb({ viral_reactions: state.viral_reactions || [] }), 'HTML', threadId);
    }
    case 'edit_viral_reactions': {
      const n = parseInt(text, 10);
      if (!isNaN(n) && n >= 0) {
        const pendingEmoji = state.pending_viral_emoji;
        if (pendingEmoji) {
          const rules = state.viral_reactions || [];
          rules.push({ emoji: pendingEmoji, threshold: n });
          await setState(userId, { ...state, viral_reactions: rules, pending_viral_emoji: null }, env);
          let msg = `✅ ری‌اکشن ${pendingEmoji} با آستانه <b>${n}</b> ثبت شد.\n\nقوانین فعلی:\n`;
          for (const r of rules) msg += `  ${r.emoji} ≥ ${r.threshold}\n`;
          msg += `\nاگه ری‌اکشن دیگری می‌خواهید، از دکمه‌ها انتخاب کنید یا «✅ تأیید و ادامه» را بزنید.`;
          return sendMsg(chatId, msg, env, reactionPickerKb({ viral_reactions: rules }), 'HTML', threadId);
        }
      }
      if (/^(تایید|تأیید|تمام|پایان|done|ok|بله)$/i.test(text.trim())) {
        await setState(userId, { ...state, step: 'edit_confirm' }, env);
        return showEditConfirm(userId, state, env);
      }
      return sendMsg(chatId, `⚠️ لطفاً یکی از ری‌اکشن‌های زیر را انتخاب کنید یا دکمه «✅ تأیید و ادامه» را بزنید.\n(برای لغو /cancel)`, env, reactionPickerKb({ viral_reactions: state.viral_reactions || [] }), 'HTML', threadId);
    }
    case 'add_mode':
    case 'add_deep_type':
    case 'edit_mode_select':
    case 'edit_deep_type_select': {
      return sendMsg(chatId, `⚠️ لطفاً یکی از گزینه‌ها را با لمس دکمه‌های زیر پیام انتخاب کنید.\n(برای انصراف دستور /cancel را بفرستید)`, env, null, 'HTML', threadId);
    }
    case 'edit_viral': {
      // حالا کاربر آستانه برای آخرین ری‌اکشن انتخاب‌شده را وارد می‌کند
      const n = parseInt(text, 10);
      if (isNaN(n)) return sendWizardPrompt(chatId, '⚠️ عدد معتبر.', env, threadId);
      const pendingEmoji = state.pending_viral_emoji;
      if (pendingEmoji) {
        const rules = state.viral_reactions || [];
        rules.push({ emoji: pendingEmoji, threshold: n });
        await setState(userId, { ...state, step: 'edit_viral_reactions', viral_reactions: rules, pending_viral_emoji: null }, env);
        let msg = `✅ ری‌اکشن ${pendingEmoji} با آستانه <b>${n}</b> ثبت شد.\n\n`;
        msg += `قوانین فعلی:\n`;
        for (const r of rules) msg += `  ${r.emoji} ≥ ${r.threshold}\n`;
        msg += `\nاگه ری‌اکشن دیگری می‌خواهید، انتخاب کنید. وگرنه «تأیید» را بزنید.`;
        return sendMsg(chatId, msg, env, reactionPickerKb({ viral_reactions: rules }), 'HTML', threadId);
      }
      // fallback اگه pending_viral_emoji نبود → این آستانه برای مجموع ری‌اکشن‌هاست
      await setState(userId, { ...state, step: 'edit_confirm', viral_threshold: n, viral_reactions: [] }, env);
      return showEditConfirm(userId, { ...state, threadId }, env);
    }
    case 'edit_viral_total_threshold': {
      // آستانه مجموع ری‌اکشن‌ها (وقتی کاربر «فقط مجموع» را زده)
      const n = parseInt(text, 10);
      if (isNaN(n)) return sendWizardPrompt(chatId, '⚠️ عدد معتبر.', env, threadId);
      await setState(userId, { ...state, step: 'edit_confirm', viral_threshold: n, viral_reactions: [] }, env);
      return showEditConfirm(userId, { ...state, threadId }, env);
    }

    // ── تغییر مقصد (ورودی متنی برای source_id) ──
    case 'settarget_source': {
      const id = parseInt(text, 10);
      if (!id) return sendWizardPrompt(chatId, '⚠️ آیدی منبع را بفرستید.', env, threadId);
      await setState(userId, { ...state, step: 'settarget_pick', source_id: id }, env);
      return sendMsg(chatId, `📤 انتخاب مقصد برای منبع #${id}:\n\n📍 دکمه «همین چت» را بزنید تا این چت (و تاپیک فعلی اگر در تاپیک هستید) به‌عنوان مقصد تنظیم شود.`, env, targetPickKb(), 'HTML', threadId);
    }
    case 'settarget_input': {
      const m = text.match(/^(-?\d+)(?::(\d+))?$/);
      if (!m) return sendWizardPrompt(chatId, '⚠️ فرمت اشتباه.', env, threadId);
      await env.DB.prepare('UPDATE sources SET target_chat_id=?, target_topic_id=? WHERE id=?')
        .bind(m[1], m[2] || null, state.source_id).run();
      await clearState(userId, env);
      return sendMsg(chatId, '✅ مقصد منبع تغییر کرد.', env, null, 'HTML', threadId);
    }

    // ── تنظیم موضوع ──
    case 'settopic_input': {
      const topic = text.trim() || 'عمومی';
      await env.DB.prepare('UPDATE sources SET topic=? WHERE id=?').bind(topic, state.source_id).run();
      await clearState(userId, env);
      return sendMsg(chatId, `✅ موضوع منبع #${state.source_id} تنظیم شد: ${topic}`, env, null, 'HTML', threadId);
    }

    // ── حذف منبع ──
    case 'delsource_input': {
      const ids = text.split(',').map(s => parseInt(s.trim(), 10)).filter(Boolean);
      for (const id of ids) {
        await deleteSourceCompletely(id, env);
      }
      await clearState(userId, env);
      return sendMsg(chatId, `🗑 ${ids.length} منبع حذف شد (شامل لاگ‌ها و هش‌ها).`, env, null, 'HTML', threadId);
    }

    // ── افزودن ادمین ──
    case 'addadmin_input': {
      const id = text.trim();
      if (!/^\d+$/.test(id)) return sendWizardPrompt(chatId, '⚠️ آیدی عددی معتبر بفرستید.', env, threadId);
      await addAdmin(id, userId, env);
      await clearState(userId, env);
      return sendMsg(chatId, `✅ ادمین ${id} افزوده شد.`, env, null, 'HTML', threadId);
    }
    case 'deladmin_input': {
      const id = text.trim();
      await removeAdmin(id, env);
      await clearState(userId, env);
      return sendMsg(chatId, `🗑 ادمین ${id} حذف شد.`, env, null, 'HTML', threadId);
    }

    default:
      if (!state || !state.step) {
        await clearState(userId, env);
        return sendMsg(chatId, '⏱ نشست منقضی شد یا فرمانی در جریان نیست. دوباره تلاش کنید.', env, null, 'HTML', threadId);
      }
      return sendMsg(chatId, '⚠️ ورودی نامعتبر است. لطفاً مرحله فعلی را تکمیل کنید یا دستور /cancel را ارسال کنید.', env, null, 'HTML', threadId);
  }
}

async function finalizeAddSource(userId, state, env) {
  const chatId = state.chatId;
  const threadId = state.threadId || null;
  const mode = state.mode;
  const topic = state.topic || '';
  // ⚠️ پشتیبانی از Deep Classic و Deep Scoring + viral_reactions
  let kwPos = JSON.stringify(state.keywords_positive || []);
  let kwNeg = JSON.stringify(state.keywords_negative || []);
  let kwMain = JSON.stringify(state.keywords_main || []);
  let kwComp = JSON.stringify(state.keywords_complementary || []);
  let kwPeriph = JSON.stringify(state.keywords_peripheral || []);
  let everyMode = state.every_mode ? 1 : 0;
  let deepScoring = state.deep_scoring ? 1 : 0;
  let deepThreshold = state.deep_threshold || 50;
  let viral = state.viral_threshold || 1000;
  let viralReactions = JSON.stringify(state.viral_reactions || []);
  // ⚠️ اضافه شد برای تداوم با apiAddSource (پنل)
  let blockAds = state.block_ads === undefined ? 1 : (state.block_ads ? 1 : 0);
  let adThreshold = state.ad_threshold || 70;

  for (const ch of state.channels) {
    let result;
    try {
      // ⚠️ استفاده از smartInsertSource — فقط ستون‌های موجود را ذخیره می‌کند
      result = await smartInsertSource(env, {
        channel: ch,
        target_chat_id: state.target_chat_id,
        target_topic_id: state.target_topic_id || null,
        mode: mode,
        topic: topic,
        keywords_positive: state.keywords_positive || [],
        keywords_negative: state.keywords_negative || [],
        keywords_main: state.keywords_main || [],
        keywords_complementary: state.keywords_complementary || [],
        keywords_peripheral: state.keywords_peripheral || [],
        every_mode: everyMode,
        deep_scoring: deepScoring,
        deep_threshold: deepThreshold,
        viral_threshold: viral,
        viral_reactions: state.viral_reactions || [],
        block_ads: blockAds,
        ad_threshold: adThreshold,
        created_by: String(userId),
        created_at: Date.now(),
      });
    } catch (e) {
      // اگه smartInsertSource هم خطا داد
      await logAction(0, 'error', `finalizeAddSource: ${e.message}`, env);
      throw e;
    }
    const sourceId = result.meta?.last_row_id;
    await logAdminActivity(userId, 'addsource', `@${ch} — حالت: ${mode} — موضوع: ${topic}`, env, sourceId);
  }
  await clearState(userId, env);
  // ساخت خلاصه نمایش کاربر
  const summaryParts = [`📝 موضوع: <b>${escHtml(topic || 'عمومی')}</b>`, `📡 تعداد: <b>${state.channels.length.toLocaleString('fa-IR')}</b> کانال`];
  if (mode === 'viral') {
    const rules = state.viral_reactions || [];
    if (rules.length) {
      summaryParts.push('👁 ری‌اکشن‌ها:');
      for (const r of rules) summaryParts.push(`  ${r.emoji} ≥ ${r.threshold}`);
    } else {
      summaryParts.push(`👁 مجموع ری‌اکشن‌ها ≥ ${viral}`);
    }
  } else if (mode === 'deep') {
    summaryParts.push(deepScoring ? '📊 Deep Scoring' : '📋 Deep Classic');
    if (deepScoring) {
      summaryParts.push(`📊 آستانه امتیاز: ${deepThreshold}`);
    }
  }
  return sendMsg(chatId, `✅ <b>منبع افزوده شد.</b>\n\n<blockquote>${summaryParts.join('\n')}</blockquote>`, env, mainMenuKb(), 'HTML', threadId);
}

async function showEditConfirm(userId, state, env) {
  const fields = [];
  if (state.mode) fields.push(`حالت: ${modeName(state.mode)}`);
  // Deep Classic
  if (state.keywords_positive) fields.push(`مثبت‌کننده: ${state.keywords_positive.join(', ')}`);
  if (state.keywords_negative) fields.push(`منفی‌کننده: ${state.keywords_negative.join(', ')}`);
  // Deep Scoring
  if (state.keywords_main) fields.push(`اصلی: ${state.keywords_main.join(', ')}`);
  if (state.keywords_complementary) fields.push(`مکمل: ${state.keywords_complementary.join(', ')}`);
  if (state.keywords_peripheral) fields.push(`پیرامونی: ${state.keywords_peripheral.join(', ')}`);
  if (state.deep_scoring !== undefined) fields.push(`نوع Deep: ${state.deep_scoring ? 'Scoring' : 'Classic'}`);
  if (state.deep_threshold) fields.push(`آستانه امتیاز: ${state.deep_threshold}`);
  // Viral
  if (state.viral_threshold) fields.push(`آستانه مجموع ری‌اکشن: ${state.viral_threshold}`);
  if (state.viral_reactions && state.viral_reactions.length) {
    fields.push('قوانین ری‌اکشن:');
    for (const r of state.viral_reactions) fields.push(`  ${r.emoji} ≥ ${r.threshold}`);
  }
  if (state.every_mode !== undefined) fields.push(`every: ${state.every_mode ? 'روشن' : 'خاموش'}`);
  if (state.active !== undefined) fields.push(`وضعیت: ${state.active ? 'فعال' : 'غیرفعال'}`);
  const text = `تأیید ویرایش ${state.source_ids.length} منبع:\n\n${fields.join('\n')}`;
  return sendMsg(state.chatId || userId, text, env, confirmEditKb(), 'HTML', state.threadId || null);
}

// ===========================================================================
//  کالبک‌ها (دکمه‌های شیشه‌ای)
// ===========================================================================
async function handleCallback(query, env) {
  const userId = query.from.id;
  const chatId = query.message?.chat?.id;
  const messageId = query.message?.message_id;
  const data = query.data;
  // ⚠️ threadId = تاپیکی که پیام دکمه شیشه‌ای در آن است. همه پاسخ‌ها باید همین‌جا فرستاده شوند.
  const threadId = query.message?.message_thread_id || null;

  if (!(await isAdmin(userId, env))) {
    return answerCb(query.id, '⛔ دسترسی ندارید', env);
  }
  await answerCb(query.id, '', env);

  // ⚠️ بررسی دسترسی برای کالبک‌های محدود
  const [action, payload] = data.split(':');
  const CALLBACK_PERMISSION_MAP = {
    'add_start': 'addsource',
    'del_start': 'delsource',
    'del_pick': 'delsource',
    'settarget_start': 'settarget',
    'settarget_pick': 'settarget',
    'settarget_pick_current': 'settarget',
    'settarget_pick_manual': 'settarget',
    'settopic_start': 'settopic',
    'settopic_pick': 'settopic',
    'scan_pick': 'scansingle',
    'scan_one': 'scansingle',
    'aianalyze_start': 'aianalyze',
    'aianalyze_pick': 'aianalyze',
    'ai_apply': 'ai_approve',
    'ai_approve': 'ai_approve',
    'ai_toggle_pos': 'ai_approve',
    'ai_toggle_neg': 'ai_approve',
    // ⚠️ callbackهای viral + deeptype (نقش‌های wizard) — نیاز به addsource/editsource
    'deeptype': 'addsource',
    'edit_deeptype': 'editsource',
    'viral_pick': 'addsource',           // هر دو addsource و editsource از این استفاده می‌کنند
    'viral_total_only': 'addsource',
    'viral_done': 'addsource',
    'addadmin_start': 'addadmin',       // افزودن ادمین — فقط با دسترسی
    'deladmin_start': 'deladmin',       // حذف ادمین — فقط با دسترسی
    'perm_pick': 'deladmin',            // تنظیم دسترسی — فقط ادمین اصلی
    'perm_toggle': 'deladmin',
    'perm_all': 'deladmin',
    'perm_save': 'deladmin',
  };
  const requiredPerm = CALLBACK_PERMISSION_MAP[action];
  if (requiredPerm) {
    const hasPermission = await checkPermission(userId, requiredPerm, env);
    if (!hasPermission) {
      return answerCb(query.id, '⛔ شما دسترسی به این عمل ندارید', env);
    }
  }

  const state = await getState(userId, env) || {};
  // اگر state هنوز threadId ندارد، آن را از callback ذخیره کن
  if (!state.threadId && threadId) {
    state.threadId = threadId;
    if (state.step) await setState(userId, state, env);
  }
  // action و payload قبلاً استخراج شده‌اند

  switch (action) {
    case 'menu':
      await clearState(userId, env);
      return editMsg(chatId, messageId, '🏠 منوی اصلی', env, mainMenuKb());

    case 'help':
      return editMsg(chatId, messageId, helpText('main'), env, helpKb());

    case 'help_src':
      return editMsg(chatId, messageId, helpText('sources'), env, helpKb());
    case 'help_tgt':
      return editMsg(chatId, messageId, helpText('targets'), env, helpKb());
    case 'help_ai':
      return editMsg(chatId, messageId, helpText('ai'), env, helpKb());
    case 'help_report':
      return editMsg(chatId, messageId, helpText('report'), env, helpKb());
    case 'help_admin':
      return editMsg(chatId, messageId, helpText('admins'), env, helpKb());
    case 'help_misc':
      return editMsg(chatId, messageId, helpText('misc'), env, helpKb());
    case 'help_cron':
      return editMsg(chatId, messageId, helpText('cron'), env, helpKb());
    case 'help_adblock':
      return editMsg(chatId, messageId, helpText('adblock'), env, helpKb());

    case 'add_start':
      await setState(userId, { step: 'add_channel', chatId, threadId }, env);
      await editMsg(chatId, messageId, '➕ افزودن منبع جدید', env, null);
      return sendWizardPrompt(chatId,
        '1️⃣ آیدی کانال(ها) را بفرستید.\nچند کانال را با کاما جدا کنید: @chan1,@chan2', env,
        threadId);

    case 'mode':
      // پس از انتخاب حالت، موضوع را بپرس (برای AI)
      await setState(userId, { ...state, step: 'add_topic', mode: payload, threadId }, env);
      const modeLabel = { forward: 'فوروارد', deep: 'عمیق', viral: 'وایرال' }[payload] || payload;
      await editMsg(chatId, messageId, `🎯 حالت: ${modeLabel}`, env, null);
      return sendWizardPrompt(chatId,
        '📝 موضوع این منبع چیست؟\nمثال: اخبار رمزارز، تکنولوژی، ورزش، آموزش برنامه‌نویسی\n\n(موضوع برای تحلیل AI استفاده می‌شود)', env,
        threadId);

    case 'every':
      // ⚠️ حذف مرحله مقصد — مستقیماً finalize با مقصد = همین چت
      await finalizeAddSource(userId, { ...state, every_mode: payload === 'on', target_chat_id: String(chatId), target_topic_id: threadId || null }, env);
      return editMsg(chatId, messageId, '✅ منبع ثبت شد.', env, mainMenuKb());

    // ⚠️ target_current و target_input حذف شدند — مقصد همیشه = همان چت/تاپیکی که دستور در آن داده شده

    case 'edit_start':
      await setState(userId, { step: 'edit_select', chatId, threadId }, env);
      await editMsg(chatId, messageId, '🔧 ویرایش گروهی', env, null);
      return sendWizardPrompt(chatId, 'آیدی منبع(های) موردنظر را بفرستید (با کاما):', env, threadId);

    case 'edit_field':
      if (payload === 'mode') {
        await setState(userId, { ...state, step: 'edit_mode_select', threadId }, env);
        return editMsg(chatId, messageId, '🎯 حالت جدید:', env, modeKb('edit_'));
      } else if (payload === 'keywords') {
        // ⚠️ برای Deep: پرسیدن نوع (Classic یا Scoring)
        await setState(userId, { ...state, step: 'edit_deep_type_select', threadId }, env);
        return editMsg(chatId, messageId, '🔧 نوع Deep را انتخاب کنید:', env, deepTypeKb('edit_'), 'HTML');
      } else if (payload === 'viral') {
        // ⚠️ بازنویسی: به جای پرسیدن آستانه مستقیم، reaction picker نشان بده
        await setState(userId, { ...state, step: 'edit_viral_reactions', viral_reactions: [], threadId }, env);
        let msg = '👁 <b>ویرایش حالت وایرال — معیار ری‌اکشن</b>\n\n';
        msg += '<blockquote>طبق سند، معیار وایرال <b>ری‌اکشن</b> است (نه بازدید).\n\n';
        msg += '۱) یک یا چند ری‌اکشن خاص با آستانه‌های جداگانه (همه باید عبور کنند)\n';
        msg += '۲) یا فقط آستانه‌ی مجموع همه ری‌اکشن‌ها\n\n';
        msg += 'ری‌اکشن‌های موردنظر را انتخاب کنید:</blockquote>';
        return editMsg(chatId, messageId, msg, env, reactionPickerKb({ viral_reactions: [] }), 'HTML');
      } else if (payload === 'every') {
        await setState(userId, { ...state, every_mode: !state.every_mode, step: 'edit_confirm', threadId }, env);
        return showEditConfirm(userId, { ...state, every_mode: !state.every_mode, chatId, threadId }, env);
      } else if (payload === 'active') {
        await setState(userId, { ...state, active: state.active ? 0 : 1, step: 'edit_confirm', threadId }, env);
        return showEditConfirm(userId, { ...state, active: state.active ? 0 : 1, chatId, threadId }, env);
      }
      break;

    // ─── انتخاب نوع Deep در ویزارد افزودن (/addsource) ───
    case 'deeptype': {
      const isScoring = payload === 'scoring';
      await setState(userId, { ...state, deep_scoring: isScoring ? 1 : 0, step: isScoring ? 'add_keywords_main' : 'add_keywords_pos', threadId }, env);
      if (isScoring) {
        let msg = '📊 <b>Deep Scoring — کلیدواژه‌های اصلی</b>\n\n';
        msg += '<blockquote>کلماتی که مستقیماً نشان‌دهنده موضوع اصلی پست هستند.\nبا کاما بفرستید.\n\n<b>امتیاز:</b> +۴۰ هر کلمه (+۱۵ position bonus)\n\n<b>مثال:</b> <code>بیت کوین, ارز دیجیتال</code></blockquote>';
        return editMsg(chatId, messageId, msg, env, null, 'HTML');
      } else {
        let msg = '📋 <b>Deep Classic — کلیدواژه‌های مثبت‌کننده</b>\n\n';
        msg += '<blockquote>کلماتی که نشان می‌دهند پست با موضوع مرتبط و ارزشمند است.\nبا کاما بفرستید.\n\n<b>مثال:</b> <code>بیت کوین, ارز دیجیتال</code></blockquote>';
        return editMsg(chatId, messageId, msg, env, null, 'HTML');
      }
    }

    // ─── انتخاب نوع Deep در ویرایش گروهی (/editsource) ───
    case 'edit_deeptype': {
      const isScoring = payload === 'scoring';
      await setState(userId, { ...state, deep_scoring: isScoring ? 1 : 0, step: isScoring ? 'edit_keywords_main' : 'edit_keywords_pos', threadId }, env);
      if (isScoring) {
        let msg = '📊 <b>Deep Scoring — کلیدواژه‌های اصلی جدید</b>\n\n';
        msg += '<blockquote>با کاما بفرستید. <b>امتیاز:</b> +۴۰ هر کلمه (+۱۵ position bonus)\n\nبرای پاک‌کردن: <code>-</code></blockquote>';
        return editMsg(chatId, messageId, msg, env, null, 'HTML');
      } else {
        let msg = '📋 <b>Deep Classic — کلیدواژه‌های مثبت‌کننده جدید</b>\n\n';
        msg += '<blockquote>با کاما بفرستید.\n\nبرای پاک‌کردن: <code>-</code></blockquote>';
        return editMsg(chatId, messageId, msg, env, null, 'HTML');
      }
    }
    // ─── Deep Scoring keywords در ویرایش گروهی ───
    case 'edit_keywords_main': {
      const kw = text === '-' ? [] : text.split(',').map(s => s.trim()).filter(Boolean);
      await setState(userId, { ...state, step: 'edit_keywords_comp', keywords_main: kw }, env);
      return sendWizardPrompt(chatId, '➕ کلیدواژه‌های مکمل جدید (یا -):', env, threadId);
    }
    case 'edit_keywords_comp': {
      const comp = text === '-' ? [] : text.split(',').map(s => s.trim()).filter(Boolean);
      await setState(userId, { ...state, step: 'edit_keywords_periph', keywords_complementary: comp }, env);
      return sendWizardPrompt(chatId, '⚠️ کلیدواژه‌های پیرامونی جدید (یا -):', env, threadId);
    }
    case 'edit_keywords_periph': {
      const periph = text === '-' ? [] : text.split(',').map(s => s.trim()).filter(Boolean);
      await setState(userId, { ...state, step: 'edit_deep_threshold_input', keywords_peripheral: periph }, env);
      return sendWizardPrompt(chatId, '📊 آستانه امتیاز Deep (عدد، پیش‌فرض ۵۰):', env, threadId);
    }
    case 'edit_deep_threshold_input': {
      const n = parseInt(text, 10) || 50;
      await setState(userId, { ...state, step: 'edit_confirm', deep_threshold: n }, env);
      return showEditConfirm(userId, { ...state, threadId }, env);
    }

    // ─── انتخاب ری‌اکشن از picker (هم برای addsource و هم editsource) ───
    case 'viral_pick': {
      // payload = ایموجی انتخاب‌شده
      const emoji = payload;
      const rules = state.viral_reactions || [];
      // اگه قبلاً انتخاب شده، حذفش کن (toggle)
      const existing = rules.findIndex(r => r.emoji === emoji);
      if (existing >= 0) {
        rules.splice(existing, 1);
        const newState = { ...state, viral_reactions: rules };
        await setState(userId, { ...newState, step: state.step === 'edit_viral_reactions' ? 'edit_viral_reactions' : 'add_viral_reactions' }, env);
        let msg = `❌ ری‌اکشن ${emoji} حذف شد.\n\nقوانین فعلی:\n`;
        for (const r of rules) msg += `  ${r.emoji} ≥ ${r.threshold}\n`;
        msg += `\nری‌اکشن دیگری انتخاب کنید یا «تأیید» را بزنید.`;
        return editMsg(chatId, messageId, msg, env, reactionPickerKb({ viral_reactions: rules }), 'HTML');
      }
      // اگه جدید → آستانه را بپرس
      // ⚠️ step را به 'add_viral_threshold' تغییر بده تا وقتی کاربر عدد را وارد کرد، درست هندل شود
      const newStep = state.step === 'edit_viral_reactions' ? 'edit_viral' : 'add_viral_threshold';
      await setState(userId, { ...state, pending_viral_emoji: emoji, step: newStep }, env);
      let msg = `👁 آستانه برای ری‌اکشن ${emoji} را بفرستید (عدد):`;
      return editMsg(chatId, messageId, msg, env, null, 'HTML');
    }

    case 'viral_total_only': {
      // کاربر فقط آستانه مجموع را می‌خواهد
      const step = state.step === 'edit_viral_reactions' ? 'edit_viral_total_threshold' : 'add_viral_total_threshold';
      await setState(userId, { ...state, step, viral_reactions: [] }, env);
      let msg = '⚡ <b>فقط مجموع ری‌اکشن‌ها</b>\n\n';
      msg += '<blockquote>یک عدد بفرستید. پست‌هایی که مجموع ری‌اکشن‌هایشان از این عدد عبور کند، ارسال می‌شوند.\n\nمثال: <code>1000</code></blockquote>';
      return editMsg(chatId, messageId, msg, env, null, 'HTML');
    }

    case 'viral_done': {
      // کاربر تأیید کرد → ادامه به مقصد (add) یا ویرایش (edit)
      const rules = state.viral_reactions || [];
      if (state.step === 'edit_viral_reactions') {
        await setState(userId, { ...state, step: 'edit_confirm', viral_reactions: rules }, env);
        return showEditConfirm(userId, { ...state, threadId }, env);
      }
      // addsource → حالا بپرس آستانه fallback (مجموع)
      if (rules.length === 0) {
        // اگه هیچ rule انتخاب نکرده بود، فقط آستانه مجموع را بپرس
        await setState(userId, { ...state, step: 'add_viral_total_threshold' }, env);
        let msg = '⚡ <b>آستانه مجموع ری‌اکشن‌ها</b>\n\n<blockquote>یک عدد بفرستید (مثلاً <code>1000</code>). پست‌هایی که مجموع ری‌اکشن‌هایشان ≥ این عدد باشد، ارسال می‌شوند.</blockquote>';
        return editMsg(chatId, messageId, msg, env, null, 'HTML');
      }
      // rules انتخاب شده → ⚠️ حذف مرحله مقصد — مستقیماً finalize با مقصد = همین چت
      try {
        // state را قبل از finalize ذخیره کن تا اگه خطا داد، اطلاعات از دست نرود
        const stateForFinalize = { ...state, viral_threshold: state.viral_threshold || 1000, target_chat_id: String(chatId), target_topic_id: threadId || null, chatId: String(chatId) };
        await finalizeAddSource(userId, stateForFinalize, env);
        let msg = '✅ قوانین ری‌اکشن ثبت شد.\n\n';
        for (const r of rules) msg += `  ${r.emoji} ≥ ${r.threshold}\n`;
        msg += '\n📍 مقصد: این چت';
        try { return editMsg(chatId, messageId, msg, env, mainMenuKb(), 'HTML'); } catch {}
        return;
      } catch (e) {
        // اگه finalize خطا داد، به کاربر نشان بده
        await answerCb(query.id, `❌ خطا: ${e.message}`, env, true);
        let errMsg = `❌ <b>خطا در ثبت منبع</b>\n\n<blockquote>${escHtml(e.message)}</blockquote>`;
        return editMsg(chatId, messageId, errMsg, env, mainMenuKb(), 'HTML');
      }
    }

    case 'edit_mode':
      await setState(userId, { ...state, mode: payload, step: 'edit_confirm', threadId }, env);
      return showEditConfirm(userId, { ...state, mode: payload, chatId, threadId }, env);

    case 'edit_confirm':
      if (payload === 'ok') {
        await applyEdit(state, env);
        await clearState(userId, env);
        return editMsg(chatId, messageId, '✅ ویرایش گروهی انجام شد.', env, mainMenuKb());
      } else {
        await clearState(userId, env);
        return editMsg(chatId, messageId, '❌ لغو شد.', env, mainMenuKb());
      }

    case 'settarget_start':
      return showSourcePicker(chatId, messageId, env, 'settarget_pick', threadId);

    case 'settopic_start':
      return showSourcePicker(chatId, messageId, env, 'settopic_pick', threadId);

    case 'aianalyze_start':
      if (!isAIAvailable(env)) {
        return editMsg(chatId, messageId,
          '⚠️ <b>هوش مصنوعی فعال نیست.</b>\n\n' +
          '<blockquote><b>Gemini (پیشنهادی):</b>\nکلید رایگان: <code>https://aistudio.google.com/app/apikey</code>\n<code>wrangler secret put GEMINI_API_KEY</code>\n\n<b>یا Workers AI:</b>\n<code>[ai]</code> binding در wrangler.toml</blockquote>',
          env, helpKb(), 'HTML');
      }
      return showSourcePicker(chatId, messageId, env, 'aianalyze_pick', threadId);

    case 'settarget_pick': {
      const sourceId = parseInt(payload, 10);
      if (!sourceId) return sendMsg(chatId, '⚠️ منبع نامعتبر.', env, null, 'HTML', threadId);
      await setState(userId, { ...state, step: 'settarget_pick', source_id: sourceId, threadId }, env);
      const src = await env.DB.prepare('SELECT * FROM sources WHERE id=?').bind(sourceId).first();
      if (!src) return sendMsg(chatId, '❌ منبع یافت نشد.', env, null, 'HTML', threadId);
      const curTopic = src.target_topic_id ? ` (تاپیک ${src.target_topic_id})` : ' (جنرال)';
      return editMsg(chatId, messageId,
        `🔁 تغییر مقصد منبع #${sourceId}\n` +
        `📡 @${src.channel}\n` +
        `📄 مقصد فعلی: <code>${src.target_chat_id}</code>${curTopic}\n\n` +
        `📍 دکمه «همین چت» را بزنید تا این چت + تاپیک فعلی تنظیم شود:`, env, targetPickKb());
    }
    case 'settarget_pick_current': {
      const sid = state.source_id;
      if (!sid) return sendMsg(chatId, '⚠️ منبع انتخاب نشده. دوباره /settarget را بزنید.', env, null, 'HTML', threadId);
      await env.DB.prepare('UPDATE sources SET target_chat_id=?, target_topic_id=? WHERE id=?')
        .bind(String(chatId), threadId ? String(threadId) : null, sid).run();
      await clearState(userId, env);
      const topicInfo = threadId ? ` (تاپیک ${threadId})` : ' (جنرال)';
      return editMsg(chatId, messageId,
        `✅ مقصد منبع #${sid} تغییر کرد.\n📄 چت: <code>${chatId}</code>${topicInfo}`, env, mainMenuKb());
    }
    case 'settarget_pick_manual': {
      await setState(userId, { ...state, step: 'settarget_input', threadId }, env);
      await editMsg(chatId, messageId, '📤 وارد دستی مقصد', env, null);
      return sendWizardPrompt(chatId, 'مقصد جدید را بفرستید.\nفرمت: chat_id یا chat_id:topic_id\nمثال: -100123456789 یا -100123456789:45', env, threadId);
    }

    case 'del_start':
      // نمایش لیست منابع برای انتخاب حذف
      return showSourcePicker(chatId, messageId, env, 'del_pick', threadId);

    case 'del_pick': {
      const sid = parseInt(payload, 10);
      if (!sid) return sendMsg(chatId, '⚠️ منبع نامعتبر.', env, null, 'HTML', threadId);
      const src = await env.DB.prepare('SELECT * FROM sources WHERE id=?').bind(sid).first();
      if (!src) return editMsg(chatId, messageId, '❌ منبع یافت نشد.', env);
      // بررسی مالکیت: ادمین فرعی فقط منابع خودش را حذف کند
      if (String(userId) !== String(env.MAIN_ADMIN_ID) && src.created_by && String(src.created_by) !== String(userId)) {
        return editMsg(chatId, messageId, '⛔ شما فقط منابعی که خودتان اضافه کرده‌اید را می‌توانید حذف کنید.', env, mainMenuKb());
      }
      await deleteSourceCompletely(sid, env);
      await logAdminActivity(userId, 'delsource', `@${src.channel}`, env, sid);
      return editMsg(chatId, messageId, `🗑 منبع @${src.channel} حذف شد (شامل لاگ‌ها و هش‌ها).`, env, mainMenuKb());
    }

    case 'scan_pick':
      // نمایش لیست منابع برای انتخاب
      return showSourcePicker(chatId, messageId, env, 'scan_one', threadId);

    case 'scan_one':
      return doScanSingle(parseInt(payload, 10), chatId, env, threadId);

    case 'list_sources':
      return showSourcesList(chatId, messageId, env, 0, threadId);

    case 'backup':
      return doBackup(chatId, env, threadId, String(userId));

    case 'admin_list':
      return showAdmins(chatId, messageId, env, threadId);
    case 'addadmin_start':
      await setState(userId, { step: 'addadmin_input', chatId, threadId }, env);
      await editMsg(chatId, messageId, '➕ افزودن ادمین', env, null);
      return sendWizardPrompt(chatId, 'آیدی عددی ادمین جدید را بفرستید:', env, threadId);
    case 'deladmin_start':
      await setState(userId, { step: 'deladmin_input', chatId, threadId }, env);
      await editMsg(chatId, messageId, '🗑 حذف ادمین', env, null);
      return sendWizardPrompt(chatId, 'آیدی عددی ادمین را بفرستید:', env, threadId);

    case 'stats':
      return showStats(chatId, messageId, env, threadId);

    case 'list_paged':
      return showSourcesList(chatId, messageId, env, parseInt(payload, 10) || 0, threadId);

    // ── تنظیم دسترسی ادمین از تلگرام ──
    case 'perm_pick': {
      const targetAdminId = payload;
      const perms = await getPermissions(targetAdminId, env);
      let text = `⚙️ <b>دسترسی‌های ادمین</b>\n\n`;
      text += `👤 آیدی: <code>${targetAdminId}</code>\n\n`;
      text += `برای فعال/غیرفعال کردن هر دستور، روی آن کلیک کنید:\n\n`;
      const kb = { inline_keyboard: [] };
      const PERM_LABELS = {
        addsource: '➕ افزودن منبع',
        editsource: '🔧 ویرایش منبع',
        settarget: '🔁 تغییر مقصد',
        delsource: '🗑 حذف منبع',
        settopic: '📝 تنظیم موضوع',
        scansingle: '🔍 اسکن تک‌منبع',
        scan: '🔄 اسکن همه',
        aianalyze: '🤖 تحلیل AI',
        ai_approve: '✅ تأیید کلیدواژه AI',
        restore: '📥 بازیابی بکاپ',
        deladmin: '🗑 حذف ادمین',
        report: '📋 گزارش روزانه',
      };
      for (const [key, label] of Object.entries(PERM_LABELS)) {
        const isEnabled = perms[key] === true;
        kb.inline_keyboard.push([{
          text: `${isEnabled ? '✅' : '⬜'} ${label}`,
          callback_data: `perm_toggle:${targetAdminId}:${key}`,
        }]);
      }
      kb.inline_keyboard.push([{ text: '✅ همه', callback_data: `perm_all:${targetAdminId}:on` }, { text: '❌ هیچ‌کدام', callback_data: `perm_all:${targetAdminId}:off` }]);
      kb.inline_keyboard.push([{ text: '💾 ذخیره', callback_data: `perm_save:${targetAdminId}` }, { text: '🏠 منو', callback_data: 'menu' }]);
      return editMsg(chatId, messageId, text, env, kb);
    }
    case 'perm_toggle': {
      const parts = payload.split(':');
      const targetAdminId = parts[0];
      const permKey = parts[1];
      if (!targetAdminId || !permKey) return answerCb(query.id, '⚠️ نامعتبر', env);
      const perms = await getPermissions(targetAdminId, env);
      perms[permKey] = !perms[permKey];
      await setPermissions(targetAdminId, perms, env);
      // بازنمایش صفحه دسترسی‌ها
      const PERM_LABELS = {
        addsource: '➕ افزودن منبع', editsource: '🔧 ویرایش منبع', settarget: '🔁 تغییر مقصد',
        delsource: '🗑 حذف منبع', settopic: '📝 تنظیم موضوع', scansingle: '🔍 اسکن تک‌منبع',
        scan: '🔄 اسکن همه', aianalyze: '🤖 تحلیل AI', ai_approve: '✅ تأیید کلیدواژه AI',
        restore: '📥 بازیابی بکاپ', deladmin: '🗑 حذف ادمین', report: '📋 گزارش روزانه',
      };
      let text = `⚙️ <b>دسترسی‌های ادمین</b>\n\n👤 آیدی: <code>${targetAdminId}</code>\n\n`;
      const kb = { inline_keyboard: [] };
      for (const [key, label] of Object.entries(PERM_LABELS)) {
        const isEnabled = perms[key] === true;
        kb.inline_keyboard.push([{ text: `${isEnabled ? '✅' : '⬜'} ${label}`, callback_data: `perm_toggle:${targetAdminId}:${key}` }]);
      }
      kb.inline_keyboard.push([{ text: '✅ همه', callback_data: `perm_all:${targetAdminId}:on` }, { text: '❌ هیچ‌کدام', callback_data: `perm_all:${targetAdminId}:off` }]);
      kb.inline_keyboard.push([{ text: '💾 ذخیره', callback_data: `perm_save:${targetAdminId}` }, { text: '🏠 منو', callback_data: 'menu' }]);
      return editMsg(chatId, messageId, text, env, kb);
    }
    case 'perm_all': {
      const parts = payload.split(':');
      const targetAdminId = parts[0];
      const onOff = parts[1] === 'on';
      const perms = {};
      const ALL_KEYS = ['addsource','editsource','settarget','delsource','settopic','scansingle','scan','aianalyze','ai_approve','restore','deladmin','report'];
      ALL_KEYS.forEach(k => { perms[k] = onOff; });
      await setPermissions(targetAdminId, perms, env);
      const PERM_LABELS = {
        addsource: '➕ افزودن منبع', editsource: '🔧 ویرایش منبع', settarget: '🔁 تغییر مقصد',
        delsource: '🗑 حذف منبع', settopic: '📝 تنظیم موضوع', scansingle: '🔍 اسکن تک‌منبع',
        scan: '🔄 اسکن همه', aianalyze: '🤖 تحلیل AI', ai_approve: '✅ تأیید کلیدواژه AI',
        restore: '📥 بازیابی بکاپ', deladmin: '🗑 حذف ادمین', report: '📋 گزارش روزانه',
      };
      let text = `⚙️ <b>دسترسی‌های ادمین</b>\n\n👤 آیدی: <code>${targetAdminId}</code>\n\n`;
      const kb = { inline_keyboard: [] };
      for (const [key, label] of Object.entries(PERM_LABELS)) {
        const isEnabled = perms[key] === true;
        kb.inline_keyboard.push([{ text: `${isEnabled ? '✅' : '⬜'} ${label}`, callback_data: `perm_toggle:${targetAdminId}:${key}` }]);
      }
      kb.inline_keyboard.push([{ text: '✅ همه', callback_data: `perm_all:${targetAdminId}:on` }, { text: '❌ هیچ‌کدام', callback_data: `perm_all:${targetAdminId}:off` }]);
      kb.inline_keyboard.push([{ text: '💾 ذخیره', callback_data: `perm_save:${targetAdminId}` }, { text: '🏠 منو', callback_data: 'menu' }]);
      return editMsg(chatId, messageId, text, env, kb);
    }
    case 'perm_save': {
      const targetAdminId = payload;
      const perms = await getPermissions(targetAdminId, env);
      const permCount = Object.values(perms).filter(v => v).length;
      await logAdminActivity(userId, 'setpermissions', `تنظیم دسترسی برای ${targetAdminId}: ${permCount}/۱۲ فعال`, env);
      return editMsg(chatId, messageId, `✅ <b>دسترسی‌ها ذخیره شد</b>\n\n👤 ادمین: <code>${targetAdminId}</code>\n📊 ${permCount} دستوری از ۱۲ دستور فعال است.`, env, mainMenuKb());
    }

    // ── AI keyword approval with per-keyword selection ──
    case 'ai_toggle_pos': {
      // payload: sourceId:index
      const parts = payload.split(':');
      const sid = parseInt(parts[0], 10);
      const idx = parseInt(parts[1], 10);
      const selRaw = await env.KV.get(`ai_selection:${sid}`);
      if (!selRaw) return answerCb(query.id, '⚠️ نشست منقضی شده. دوباره تحلیل کنید.', env);
      const sel = JSON.parse(selRaw);
      if (idx >= 0 && idx < sel.pos.length) {
        sel.pos[idx] = !sel.pos[idx];
        await env.KV.put(`ai_selection:${sid}`, JSON.stringify(sel), { expirationTtl: 600 });
      }
      // آپدیت دکمه — ✅ یا ⬜
      const src = await env.DB.prepare('SELECT channel FROM sources WHERE id=?').bind(sid).first();
      return editMsg(chatId, messageId, 'loading', env, null); // placeholder
      // نمی‌توانیم متن را ویرایش کنیم چون پیام در chat ادمین است، اما می‌توانیم callback را جواب دهیم
    }
    case 'ai_toggle_neg': {
      const parts = payload.split(':');
      const sid = parseInt(parts[0], 10);
      const idx = parseInt(parts[1], 10);
      const selRaw = await env.KV.get(`ai_selection:${sid}`);
      if (!selRaw) return answerCb(query.id, '⚠️ نشست منقضی شده. دوباره تحلیل کنید.', env);
      const sel = JSON.parse(selRaw);
      if (idx >= 0 && idx < sel.neg.length) {
        sel.neg[idx] = !sel.neg[idx];
        await env.KV.put(`ai_selection:${sid}`, JSON.stringify(sel), { expirationTtl: 600 });
      }
      return;
    }
    case 'ai_apply': {
      // payload: sourceId:add  یا  sourceId:replace
      const parts = payload.split(':');
      const sid = parseInt(parts[0], 10);
      const mode = parts[1] || 'replace';
      const selRaw = await env.KV.get(`ai_selection:${sid}`);
      if (!selRaw) return editMsg(chatId, messageId, '⚠️ نشست منقضی شده. دوباره تحلیل کنید.', env);
      const sel = JSON.parse(selRaw);

      const src = await env.DB.prepare('SELECT * FROM sources WHERE id=?').bind(sid).first();
      if (!src) return editMsg(chatId, messageId, '❌ منبع یافت نشد.', env);

      // کلیدواژه‌های انتخاب‌شده
      const selectedPos = sel.posKw.filter((_, i) => sel.pos[i]);
      const selectedNeg = sel.negKw.filter((_, i) => sel.neg[i]);

      if (mode === 'add') {
        // اضافه به فعلی‌ها
        const currentPos = safeJson(src.keywords_positive, []);
        const currentNeg = safeJson(src.keywords_negative, []);
        const mergedPos = [...new Set([...currentPos, ...selectedPos])];
        const mergedNeg = [...new Set([...currentNeg, ...selectedNeg])];
        await env.DB.prepare(
          'UPDATE sources SET keywords_positive = ?, keywords_negative = ?, pending_keywords_positive = ?, pending_keywords_negative = ? WHERE id = ?'
        ).bind(JSON.stringify(mergedPos), JSON.stringify(mergedNeg), '', '', sid).run();
        await logAction(sid, 'ai_approve', `AI: ${selectedPos.length} مثبت + ${selectedNeg.length} منفی اضافه شد (مجموع: ${mergedPos.length}+${mergedNeg.length})`, env);
        return editMsg(chatId, messageId,
          `✅ <b>کلیدواژه‌ها اضافه شدند</b>\n\n` +
          `📡 @${src.channel}\n` +
          `➕ اضافه شد: ${selectedPos.length} مثبت، ${selectedNeg.length} منفی\n` +
          `📊 مجموع فعلی: ${mergedPos.length} مثبت، ${mergedNeg.length} منفی`,
          env, mainMenuKb());
      } else {
        // جایگزین کل فعلی‌ها
        await env.DB.prepare(
          'UPDATE sources SET keywords_positive = ?, keywords_negative = ?, pending_keywords_positive = ?, pending_keywords_negative = ? WHERE id = ?'
        ).bind(JSON.stringify(selectedPos), JSON.stringify(selectedNeg), '', '', sid).run();
        await logAction(sid, 'ai_approve', `AI: ${selectedPos.length} مثبت + ${selectedNeg.length} منفی جایگزین شد`, env);
        return editMsg(chatId, messageId,
          `✅ <b>کلیدواژه‌ها جایگزین شدند</b>\n\n` +
          `📡 @${src.channel}\n` +
          `🔄 جدید: ${selectedPos.length} مثبت، ${selectedNeg.length} منفی`,
          env, mainMenuKb());
      }
    }
    case 'ai_reject': {
      const sid = parseInt(payload, 10);
      const src = await env.DB.prepare('SELECT * FROM sources WHERE id=?').bind(sid).first();
      await env.DB.prepare(
        'UPDATE sources SET pending_keywords_positive = ?, pending_keywords_negative = ? WHERE id = ?'
      ).bind('', '', sid).run();
      return editMsg(chatId, messageId, `❌ کلیدواژه‌های AI برای @${src?.channel || ''} رد شد.`, env, mainMenuKb());
    }
    case 'ai_reanalyze': {
      const sid = parseInt(payload, 10);
      const src = await env.DB.prepare('SELECT * FROM sources WHERE id=?').bind(sid).first();
      if (!src) return editMsg(chatId, messageId, '❌ منبع یافت نشد.', env);
      await editMsg(chatId, messageId, '🔄 در حال تحلیل مجدد...', env, null);
      return analyzeSourceWithAI(src, env);
    }
    case 'settopic_pick': {
      const sid = parseInt(payload, 10);
      if (!sid) return sendMsg(chatId, '⚠️ منبع نامعتبر.', env, null, 'HTML', threadId);
      await setState(userId, { ...state, step: 'settopic_input', source_id: sid, threadId }, env);
      const src = await env.DB.prepare('SELECT * FROM sources WHERE id=?').bind(sid).first();
      if (!src) return sendMsg(chatId, '❌ منبع یافت نشد.', env, null, 'HTML', threadId);
      return editMsg(chatId, messageId,
        `📝 تنظیم موضوع برای @${src.channel}\nموضوع فعلی: ${src.topic || '—'}\n\nموضوع جدید را بفرستید:`, env, null);
    }
    case 'aianalyze_pick': {
      const sid = parseInt(payload, 10);
      const src = await env.DB.prepare('SELECT * FROM sources WHERE id=?').bind(sid).first();
      if (!src) return editMsg(chatId, messageId, '❌ منبع یافت نشد.', env);
      await editMsg(chatId, messageId, `🤖 در حال تحلیل @${src.channel} با AI...\n\n⏳ لطفاً صبر کنید — این عملیات ۱۰-۳۰ ثانیه طول می‌کشد.`, env, null);
      // پیام «بیشتر صبر کنید» بعد از ۱۵ ثانیه
      const slowTimer = setTimeout(async () => {
        await sendMsg(chatId, '⏳ هنوز در حال تحلیل است — هوش مصنوعی در حال پردازش ۳۰ پست است. کمی بیشتر صبر کنید...', env, null, 'HTML', threadId);
      }, 15000);
      const r = await analyzeSourceWithAI(src, env);
      clearTimeout(slowTimer);
      if (!r.ok) {
        await sendMsg(chatId, `❌ تحلیل ناموفق: ${r.error || 'خطای ناشناخته'}`, env, null, 'HTML', threadId);
      }
      // اگر موفق بود، analyzeSourceWithAI خودش پیام کلیدواژه‌ها را می‌فرستد
      return;
    }
    case 'adblock_pick': {
      // انتخاب منبع برای تغییر وضعیت ضد تبلیغات
      const sid = parseInt(payload, 10);
      if (!sid) return sendMsg(chatId, '⚠️ منبع نامعتبر.', env, null, 'HTML', threadId);
      const src = await env.DB.prepare('SELECT * FROM sources WHERE id=?').bind(sid).first();
      if (!src) return editMsg(chatId, messageId, '❌ منبع یافت نشد.', env);
      const newVal = src.block_ads === 0 ? 1 : 0;
      await env.DB.prepare('UPDATE sources SET block_ads = ? WHERE id = ?').bind(newVal, sid).run();
      const status = newVal === 1 ? '🟢 روشن' : '🔴 خاموش';
      const kb = { inline_keyboard: [
        [{ text: newVal === 1 ? '🔴 خاموش کردن' : '🟢 روشن کردن', callback_data: `adblock_pick:${sid}` }],
        [{ text: '🏠 منو', callback_data: 'menu' }],
      ] };
      const msg = `🛡 <b>سیستم ضد تبلیغات</b>\n\n📡 منبع: <code>@${src.channel}</code>\nوضعیت فعلی: <b>${status}</b>\n\n`;
      const detail = newVal === 1
        ? '✅ پست‌های تبلیغاتی به‌طور خودکار شناسایی و رد می‌شوند.\nالگوها: کلمات تبلیغاتی، لینک‌های مشکوک، مولتی‌فوروارد.'
        : '⚠️ فیلتر ضد تبلیغات خاموش است — همه پست‌ها (پس از عبور از فیلتر حالت) ارسال می‌شوند.';
      return editMsg(chatId, messageId, msg + detail, env, kb, 'HTML');
    }
    case 'adblock_stats': {
      // نمایش آمار مسدودشده‌ها
      const res = await env.DB.prepare(
        "SELECT COUNT(*) as cnt FROM logs WHERE action='skipped' AND detail LIKE '🚫 تبلیغ%' AND created_at > ?"
      ).bind(Date.now() - 86400000 * 7).first();
      const cnt = res?.cnt || 0;
      return editMsg(chatId, messageId,
        `📊 <b>آمار ضد تبلیغات (۷ روز اخیر)</b>\n\n🚫 پست‌های تبلیغاتی مسدودشده: <b>${cnt.toLocaleString('fa-IR')}</b>\n\nاین پست‌ها به مقصد ارسال نشده‌اند.`,
        env, { inline_keyboard: [[{ text: '🏠 منو', callback_data: 'menu' }]] }, 'HTML');
    }
    case 'adblock_pick_start': {
      // نمایش لیست منابع برای انتخاب — هر دکمه وضعیت فعلی رو نشون می‌ده
      const res = await env.DB.prepare('SELECT id, channel, mode, block_ads FROM sources ORDER BY id DESC LIMIT 20').all();
      if (!res.results.length) {
        return editMsg(chatId, messageId, '📋 منبعی وجود ندارد.', env, mainMenuKb());
      }
      const kb = { inline_keyboard: [] };
      for (const s of res.results) {
        const icon = s.block_ads === 0 ? '🔴' : '🟢';
        kb.inline_keyboard.push([{ text: `${icon} #${s.id} @${s.channel} (${modeName(s.mode)})`, callback_data: `adblock_pick:${s.id}` }]);
      }
      kb.inline_keyboard.push([{ text: '🏠 منو', callback_data: 'menu' }]);
      return editMsg(chatId, messageId, '🛡 یک منبع را برای تغییر وضعیت ضد تبلیغات انتخاب کنید:\n\n🟢 = روشن | 🔴 = خاموش', env, kb, 'HTML');
    }

    // ─── منوی اصلی ضد تبلیغات (دکمه شیشه‌ای) ───
    case 'adblock_menu': {
      let adText;
      try { adText = await buildAdBlockText(env); }
      catch (e) { adText = '🛡 <b>سیستم ضد تبلیغات</b>\n\n<blockquote>خطا در دریافت آمار.</blockquote>'; }
      const kb = { inline_keyboard: [
        [{ text: '🔄 تغییر وضعیت یک منبع', callback_data: 'adblock_pick_start' }],
        [{ text: '📊 آمار مسدودشده‌ها (۷ روز)', callback_data: 'adblock_stats' }],
        [{ text: '🏠 منو', callback_data: 'menu' }],
      ]};
      return editMsg(chatId, messageId, adText, env, kb);
    }

    // ─── گزارش پست به‌عنوان تبلیغ (دکمه 🚫 روی پست ارسالی) ───
    case 'report_ad': {
      // متن پیام فعلی (پست ارسالی ربات) رو استخراج کن
      const postText = query.message?.text || query.message?.caption || '';
      if (!postText) {
        return answerCb(query.id, '❌ متن پست یافت نشد', env, true);
      }

      // نمایش پنجره popup (هشدار)
      await answerCb(query.id, '🚫 پست به‌عنوان تبلیغ شناسایی شد\nدر حال ارسال به هوش مصنوعی...', env, true);

      // استخراج توکن‌ها
      const tokens = tokenizePost(postText);
      const tokenList = [
        ...tokens.words.map(w => w.w),
        ...tokens.links,
        ...tokens.bots,
      ];

      // افزایش وزن کلمات (همیشه — یادگیری از گزارش کاربر)
      await bumpPostWeights(postText, env);

      // ⚠️ طبق سند: AI اول تشخیص بده تبلیغ هست یا نه
      // سپس اگه تبلیغ بود، وزن نوع کلیدواژه/کلمه/ایموجی/دامنه را بفرستد
      let aiNote = '🤖 هوش مصنوعی: غیرفعال';
      let aiProvider = null;
      let aiRawFirst = null; // پاسخ خام مرحله ۱
      let aiRawSecond = null; // پاسخ خام مرحله ۲

      if (isAIAvailable(env)) {
        try {
          // ─── مرحله ۱: تشخیص is_ad ───
          const r1 = await runAIWithFallback(env, {
            messages: [{ role: 'user', content: `INSTRUCTIONS: You are an ad detector. Analyze this Telegram post and respond with ONLY a JSON object: {"is_ad": true/false, "confidence": 0-100, "reason": "brief Persian explanation"}.\n\nPost:\n${postText}` }],
            max_tokens: 200,
          });
          aiProvider = r1.provider;
          aiRawFirst = r1.text;

          let isAd = false;
          let confidence = 0;
          let reason = '';
          try {
            const m1 = r1.text.match(/\{[\s\S]*\}/);
            if (m1) {
              const parsed = JSON.parse(m1[0]);
              isAd = parsed.is_ad === true || parsed.confidence > 60;
              confidence = parsed.confidence || 0;
              reason = parsed.reason || '';
            }
          } catch {}

          // ⚠️ ثبت پاسخ خام مرحله ۱ در لاگ (طبق سند)
          await logAction(0, 'ai_raw', `report_ad مرحله ۱ (is_ad=${isAd})`, env, '', 0, postText.slice(0, 200), {
            ai_provider: aiProvider,
            ai_raw: aiRawFirst,
          });

          if (isAd) {
            // ─── مرحله ۲: استخراج وزن‌ها ───
            aiNote = `🤖 تشخیص: تبلیغ (${confidence}٪) — در حال استخراج وزن‌ها...`;
            const r2 = await runAIWithFallback(env, {
              messages: [{ role: 'user', content: `INSTRUCTIONS: You are an ad keyword extractor. Analyze this Telegram ad post and respond with ONLY a JSON object: {"keywords":[{"word":"...","type":"word|link|emoji|domain|bot_id","weight":30}],"score":85,"reason":"brief Persian explanation"}.\n\nPost:\n${postText}` }],
              max_tokens: 500,
            });
            aiRawSecond = r2.text;

            // ⚠️ ثبت پاسخ خام مرحله ۲
            await logAction(0, 'ai_raw', `report_ad مرحله ۲ (استخراج وزن‌ها)`, env, '', 0, postText.slice(0, 200), {
              ai_provider: r2.provider,
              ai_raw: aiRawSecond,
            });

            // استخراج کلمات از AI و ذخیره در ad_weights
            let extractedCount = 0;
            const m2 = r2.text.match(/\{[\s\S]*\}/);
            if (m2) {
              try {
                const parsed2 = JSON.parse(m2[0]);
                if (parsed2.keywords && Array.isArray(parsed2.keywords)) {
                  for (const kw of parsed2.keywords) {
                    if (kw.word) {
                      const t = (kw.word || '').toLowerCase().trim();
                      const ty = kw.type || 'word';
                      const w = Math.max(1, Math.min(50, parseInt(kw.weight, 10) || 30));
                      try {
                        await env.DB.prepare(
                          'INSERT OR REPLACE INTO ad_weights (token, type, weight, hits, auto, created_at) VALUES (?, ?, ?, 0, 1, ?)'
                        ).bind(t, ty, w, Date.now()).run();
                        extractedCount++;
                      } catch {}
                    }
                  }
                }
              } catch {}
            }
            aiNote = `🤖 تشخیص: تبلیغ (${confidence}٪)\n📝 ${reason || '—'}\n📊 ${extractedCount} کلیدواژه استخراج شد`;
          } else {
            aiNote = `🤖 تشخیص: پاک (${confidence}٪) — ${reason || '—'}`;
          }
        } catch (e) {
          aiNote = `🤖 هوش مصنوعی: خطا در تحلیل — ${e.message}`;
          // ⚠️ ثبت خطای AI در لاگ
          await logAction(0, 'error', `report_ad AI error: ${e.message}`, env, '', 0, postText.slice(0, 200), {
            ai_provider: aiProvider,
            ai_raw: e.message.slice(0, 2000),
          });
        }
      }

      // محاسبه امتیاز جدید پس از یادگیری
      let newScore = 0;
      let verdict = 'clean';
      try {
        const result = await scoreAdPost({ text: postText, channel: 'report', isReply: false }, env);
        newScore = result.score;
        verdict = result.verdict;
      } catch {}

      const verdictEmoji = verdict === 'block' ? '🚫 مسدود' : verdict === 'quarantine' ? '⚠️ قرنطینه' : '✅ پاک';

      // ⚠️ ثبت نهایی در لاگ
      await logAction(0, 'report_ad', `گزارش تبلیغ — امتیاز جدید: ${newScore} (${verdict})`, env, '', 0, postText.slice(0, 200), {
        ai_provider: aiProvider,
        ad_score: newScore,
        ad_verdict: verdict,
      });

      return sendMsg(chatId, `🚫 <b>گزارش تبلیغ ثبت شد</b>\n\n<blockquote>📊 امتیاز جدید: <b>${newScore}/۱۰۰</b> — ${verdictEmoji}\n📝 توکن‌ها: <b>${tokenList.length}</b>\n${aiNote}</blockquote>`, env, null, 'HTML', threadId);
    }

    // ─── گزارش پست پاک (دکمه ✅ برای کاهش وزن) ───
    case 'report_clean': {
      const postText = query.message?.text || query.message?.caption || '';
      if (!postText) {
        return answerCb(query.id, '❌ متن پست یافت نشد', env, true);
      }

      await answerCb(query.id, '✅ در حال کاهش وزن کلمات...', env, true);

      // استخراج توکن‌ها
      const tokens = tokenizePost(postText);
      const allTokens = [
        ...tokens.words.map(w => w.w),
        ...tokens.links,
        ...tokens.bots,
      ];

      // کاهش وزن هر توکن
      let reduced = 0;
      for (const t of allTokens) {
        try {
          const existing = await env.DB.prepare('SELECT token, hits, weight FROM ad_weights WHERE token=?').bind(t).first();
          if (existing) {
            const newWeight = Math.max(0, existing.weight - 10);
            const newHits = Math.max(0, existing.hits - 1);
            if (newWeight === 0 && newHits === 0) {
              await env.DB.prepare('DELETE FROM ad_weights WHERE token=?').bind(t).run();
            } else {
              await env.DB.prepare('UPDATE ad_weights SET hits=?, weight=? WHERE token=?').bind(newHits, newWeight, t).run();
            }
            reduced++;
          }
        } catch {}
      }

      return sendMsg(chatId, `✅ <b>گزارش پاک ثبت شد</b>\n\n<blockquote>⚖️ وزن <b>${reduced}</b> توکن کاهش یافت\n📊 این پست دیگر به‌عنوان تبلیغ تشخیص داده نمی‌شود</blockquote>`, env, null, 'HTML', threadId);
    }

    // ─── قرنطینه: تأیید تبلیغ ───
    case 'q_ad': {
      const qid = parseInt(payload, 10);
      if (!qid) return;
      const q = await env.DB.prepare('SELECT * FROM quarantine WHERE id=?').bind(qid).first();
      if (!q) return editMsg(chatId, messageId, '❌ پست یافت نشد.', env);
      try { await env.DB.prepare("UPDATE quarantine SET status='ad' WHERE id=?").bind(qid).run(); } catch {}
      try { await bumpPostWeights(q.post_text, env); } catch {}
      return editMsg(chatId, messageId, `❌ <b>تبلیغ تأیید شد.</b>\n\n<blockquote>وزن کلمات افزایش یافت — دفعه بعد خودکار مسدود می‌شود.</blockquote>`, env, { inline_keyboard: [[{ text: '🏠 منو', callback_data: 'menu' }]] });
    }

    // ─── قرنطینه: تأیید پاک ───
    case 'q_clean': {
      const qid = parseInt(payload, 10);
      if (!qid) return;
      const q = await env.DB.prepare('SELECT * FROM quarantine WHERE id=?').bind(qid).first();
      if (!q) return editMsg(chatId, messageId, '❌ پست یافت نشد.', env);
      try { await env.DB.prepare("UPDATE quarantine SET status='clean' WHERE id=?").bind(qid).run(); } catch {}
      // ارسال به مقصد اصلی
      const src = q.source_id ? await env.DB.prepare('SELECT * FROM sources WHERE id=?').bind(q.source_id).first() : null;
      if (src) {
        const post = { text: q.post_text, link: q.post_link, mediaType: 'text', views: 0, channel: q.channel, datetime: null, isReply: false, replyToText: '', replyToAuthor: '' };
        try { await deliverPost(post, src, [], env); } catch {}
      }
      return editMsg(chatId, messageId, `✅ <b>پست پاک تأیید شد.</b>\n\n<blockquote>به مقصد اصلی ارسال شد.</blockquote>`, env, { inline_keyboard: [[{ text: '🏠 منو', callback_data: 'menu' }]] });
    }

    // ─── قرنطینه: تحلیل AI ───
    case 'q_ai': {
      const qid = parseInt(payload, 10);
      if (!qid) return;
      const q = await env.DB.prepare('SELECT * FROM quarantine WHERE id=?').bind(qid).first();
      if (!q) return editMsg(chatId, messageId, '❌ پست یافت نشد.', env);
      if (!isAIAvailable(env)) {
        return editMsg(chatId, messageId, '⚠️ <b>هوش مصنوعی فعال نیست.</b>\n\nGEMINI_API_KEY یا Workers AI binding را اضافه کنید.', env);
      }
      await editMsg(chatId, messageId, '🤖 <b>در حال تحلیل با هوش مصنوعی...</b>\n\n<blockquote>لطفاً صبر کنید — ۵-۱۰ ثانیه</blockquote>', env);
      try {
        const { text: aiText } = await runAIWithFallback(env, {
          messages: [{ role: 'user', content: `INSTRUCTIONS: You are an ad detector. Analyze this Telegram post and respond with ONLY a JSON object: {"is_ad": true/false, "confidence": 0-100, "reason": "brief Persian explanation"}.\n\nPost:\n${q.post_text}` }],
          max_tokens: 200,
        });
        let parsed = {};
        try { const m = aiText.match(/\{[\s\S]*\}/); if (m) parsed = JSON.parse(m[0]); } catch {}
        try { await env.DB.prepare("UPDATE quarantine SET status='ai_reviewed' WHERE id=?").bind(qid).run(); } catch {}
        const isAd = parsed.is_ad === true || parsed.confidence > 60;
        const verdict = isAd ? '🚫 تبلیغ' : '✅ پاک';
        const conf = parsed.confidence ? `${parsed.confidence}٪` : '—';
        return sendMsg(chatId, `🤖 <b>تحلیل هوش مصنوعی</b>\n\n<blockquote><b>تشخیص:</b> ${verdict}\n<b>اطمینان:</b> ${conf}\n<b>دلیل:</b> ${parsed.reason || '—'}</blockquote>`, env, {
          inline_keyboard: [
            [{ text: '❌ تأیید تبلیغ', callback_data: `q_ad:${qid}` }, { text: '✅ تأیید پاک', callback_data: `q_clean:${qid}` }],
            [{ text: '🏠 منو', callback_data: 'menu' }],
          ],
        }, 'HTML', threadId);
      } catch (e) {
        return sendMsg(chatId, `❌ خطا در تحلیل AI: ${e.message}`, env, null, 'HTML', threadId);
      }
    }
  }
}

async function applyEdit(state, env) {
  const sets = [];
  const binds = [];
  const oldMode = state.mode; // اگر حالت تغییر کرده، هش‌ها را پاک می‌کنیم
  if (state.mode) { sets.push('mode = ?'); binds.push(state.mode); }
  // Deep Classic
  if (state.keywords_positive !== undefined) { sets.push('keywords_positive = ?'); binds.push(JSON.stringify(state.keywords_positive)); }
  if (state.keywords_negative !== undefined) { sets.push('keywords_negative = ?'); binds.push(JSON.stringify(state.keywords_negative)); }
  // Deep Scoring
  if (state.keywords_main !== undefined) { sets.push('keywords_main = ?'); binds.push(JSON.stringify(state.keywords_main)); }
  if (state.keywords_complementary !== undefined) { sets.push('keywords_complementary = ?'); binds.push(JSON.stringify(state.keywords_complementary)); }
  if (state.keywords_peripheral !== undefined) { sets.push('keywords_peripheral = ?'); binds.push(JSON.stringify(state.keywords_peripheral)); }
  if (state.deep_scoring !== undefined) { sets.push('deep_scoring = ?'); binds.push(state.deep_scoring ? 1 : 0); }
  if (state.deep_threshold !== undefined) { sets.push('deep_threshold = ?'); binds.push(state.deep_threshold); }
  // Viral
  if (state.viral_threshold !== undefined) { sets.push('viral_threshold = ?'); binds.push(state.viral_threshold); }
  if (state.viral_reactions !== undefined) { sets.push('viral_reactions = ?'); binds.push(JSON.stringify(state.viral_reactions || [])); }
  // Other
  if (state.every_mode !== undefined) { sets.push('every_mode = ?'); binds.push(state.every_mode ? 1 : 0); }
  if (state.active !== undefined) { sets.push('active = ?'); binds.push(state.active); }
  // ⚠️ برای تداوم با پنل (پنل این فیلدها را در bulk edit دارد)
  if (state.block_ads !== undefined) { sets.push('block_ads = ?'); binds.push(state.block_ads ? 1 : 0); }
  if (state.ad_threshold !== undefined) { sets.push('ad_threshold = ?'); binds.push(state.ad_threshold); }
  if (!sets.length) return;
  for (const id of state.source_ids) {
    // اگر حالت تغییر کرده، lastpost را ریست کن تا اسکن از ابتدا شروع شود
    if (oldMode) {
      await env.KV.delete(`lastpost:${id}`);
      await logAction(id, 'reset', `حالت به ${oldMode} تغییر یافت — هش‌ها ریست شدند`, env);
    }
    try {
      await env.DB.prepare(`UPDATE sources SET ${sets.join(', ')} WHERE id = ?`).bind(...binds, id).run();
    } catch (e) {
      // اگه ستون ناموجود بود، fallback بدون آن ستون‌ها
      const errMsg = String(e.message || '');
      const missingMatch = errMsg.match(/no such column: (\w+)/i) || errMsg.match(/no column named "(\w+)"/i);
      if (missingMatch) {
        const missing = missingMatch[1];
        const filteredSets = [];
        const filteredBinds = [];
        for (let i = 0; i < sets.length; i++) {
          if (!sets[i].startsWith(missing + ' ')) {
            filteredSets.push(sets[i]);
            filteredBinds.push(binds[i]);
          }
        }
        if (filteredSets.length) {
          await env.DB.prepare(`UPDATE sources SET ${filteredSets.join(', ')} WHERE id = ?`).bind(...filteredBinds, id).run();
        }
        await logAction(id, 'error', `applyEdit: ستون ${missing} وجود ندارد — migration را اجرا کنید`, env);
      } else {
        await logAction(id, 'error', `applyEdit: ${errMsg}`, env);
      }
    }
  }
}

// ─── حذف کامل منبع + پاکسازی داده‌های مرتبط ───
async function deleteSourceCompletely(sourceId, env) {
  // پاک‌سازی کامل همه داده‌های مرتبط با این منبع
  await env.DB.prepare('DELETE FROM sources WHERE id=?').bind(sourceId).run();
  await env.DB.prepare('DELETE FROM logs WHERE source_id=?').bind(sourceId).run();
  await env.DB.prepare('DELETE FROM lastpost WHERE source_id=?').bind(sourceId).run();
  await env.DB.prepare('DELETE FROM dedup WHERE source_id=?').bind(sourceId).run();
  await env.DB.prepare('DELETE FROM admin_activity WHERE source_id=?').bind(sourceId).run();
  // جداول جدید
  try { await env.DB.prepare('DELETE FROM quarantine WHERE source_id=?').bind(sourceId).run(); } catch {}
  try { await env.DB.prepare('DELETE FROM ai_suggestions WHERE source_id=?').bind(sourceId).run(); } catch {}
  try { await env.DB.prepare('DELETE FROM feedback WHERE source_id=?').bind(sourceId).run(); } catch {}
}

// ===========================================================================
//  کیبوردهای شیشه‌ای (Inline Keyboards)
// ===========================================================================
function mainMenuKb() {
  return { inline_keyboard: [
    [{ text: '➕ افزودن منبع', callback_data: 'add_start' }, { text: '📝 تنظیم موضوع', callback_data: 'settopic_start' }],
    [{ text: '🔁 تغییر مقصد', callback_data: 'settarget_start' }, { text: '🗑 حذف منبع', callback_data: 'del_start' }],
    [{ text: '🔍 اسکن تک‌منبع', callback_data: 'scan_pick' }, { text: '📋 لیست منابع', callback_data: 'list_sources' }],
    [{ text: '🤖 تحلیل AI', callback_data: 'aianalyze_start' }, { text: '📊 آمار', callback_data: 'stats' }],
    [{ text: '🛡 ضد تبلیغات', callback_data: 'adblock_menu' }, { text: '🛡 ادمین‌ها', callback_data: 'admin_list' }],
    [{ text: '💾 بکاپ', callback_data: 'backup' }, { text: '❓ راهنما', callback_data: 'help' }],
  ]};
}

function cancelKb() {
  return { inline_keyboard: [[{ text: '❌ لغو', callback_data: 'menu' }]] };
}

function targetPickKb() {
  return { inline_keyboard: [
    [{ text: '📍 همین چت + تاپیک فعلی', callback_data: 'settarget_pick_current' }],
    [{ text: '✏️ وارد کردن دستی chat_id:topic_id', callback_data: 'settarget_pick_manual' }],
    [{ text: '❌ لغو', callback_data: 'menu' }],
  ]};
}

function modeKb(prefix = '') {
  const p = prefix || 'mode:';
  return { inline_keyboard: [
    [{ text: '📤 فوروارد', callback_data: `${p}forward` }],
    [{ text: '🔎 عمیق (کلیدواژه)', callback_data: `${p}deep` }],
    [{ text: '👁 وایرال (ری‌اکشن)', callback_data: `${p}viral` }],
    [{ text: '❌ لغو', callback_data: 'menu' }],
  ]};
}

// ─── کیبورد انتخاب نوع Deep (Classic یا Scoring) ───
function deepTypeKb(prefix = '') {
  const p = prefix || 'deeptype:';
  return { inline_keyboard: [
    [{ text: '📋 Deep Classic (مثبت‌کننده/منفی‌کننده)', callback_data: `${p}classic` }],
    [{ text: '📊 Deep Scoring (اصلی/مکمل/پیرامونی)', callback_data: `${p}scoring` }],
    [{ text: '↩️ بازگشت', callback_data: 'menu' }],
  ]};
}

// ─── لیست ری‌اکشن‌های پرکاربرد تلگرام (برای انتخاب سریع در ویزارد) ───
const COMMON_REACTIONS = [
  '👍', '👎', '❤', '🔥', '🎉', '🥰', '👏', '😂', '🙏', '😍',
  '😭', '😮', '🤔', '💯', '💔', '⚡', '🏆', '🤝', '🤡', '😴',
  '🆒', '🐳', '🖤', '🤷', '👀', '😇', '🤦', '🌚', '🌭', '🤣',
  '😢', '🥳', '🙈', '💩', '🤯', '😡', '😱', '🚀', '💎', '🫡',
];

// ─── کیبورد انتخاب ری‌اکشن (برای /addsource و /editsource) ───
// هر دکمه یک ایموجی است که کاربر انتخاب می‌کند تا آستانه‌اش را تنظیم کند
function reactionPickerKb(state) {
  const selectedRules = state.viral_reactions || [];
  const rows = [];
  // ۵ ایموجی در هر ردیف
  for (let i = 0; i < COMMON_REACTIONS.length; i += 5) {
    const row = [];
    for (let j = i; j < Math.min(i + 5, COMMON_REACTIONS.length); j++) {
      const emoji = COMMON_REACTIONS[j];
      const isSelected = selectedRules.some(r => r.emoji === emoji);
      row.push({
        text: `${isSelected ? '✅' : ''}${emoji}`,
        callback_data: `viral_pick:${emoji}`,
      });
    }
    rows.push(row);
  }
  rows.push([
    { text: '⚡ فقط مجموع (بدون rule خاص)', callback_data: 'viral_total_only' },
  ]);
  rows.push([
    { text: '✅ تأیید و ادامه', callback_data: 'viral_done' },
  ]);
  return { inline_keyboard: rows };
}

// ⚠️ targetKb حذف شد — مرحله انتخاب مقصد دیگر وجود ندارد
// مقصد همیشه = همان چت/تاپیکی که دستور /addsource در آن داده شده

function helpKb() {
  return { inline_keyboard: [
    [{ text: '📡 منابع', callback_data: 'help_src' }, { text: '📤 مقاصد', callback_data: 'help_tgt' }],
    [{ text: '🤖 هوش مصنوعی', callback_data: 'help_ai' }, { text: '📋 گزارش', callback_data: 'help_report' }],
    [{ text: '🛡 ادمین‌ها', callback_data: 'help_admin' }, { text: '🔧 سایر', callback_data: 'help_misc' }],
    [{ text: '⏰ زمان‌بندی', callback_data: 'help_cron' }, { text: '🛡 ضد تبلیغات', callback_data: 'help_adblock' }],
    [{ text: '🏠 منو', callback_data: 'menu' }],
  ]};
}

function editFieldKb() {
  return { inline_keyboard: [
    [{ text: '🎯 حالت', callback_data: 'edit_field:mode' }, { text: '🔎 کلیدواژه‌ها', callback_data: 'edit_field:keywords' }],
    [{ text: '👁 ویرایش ری‌اکشن‌ها', callback_data: 'edit_field:viral' }],
    [{ text: '⚙️ every', callback_data: 'edit_field:every' }, { text: '🟢 فعال/غیرفعال', callback_data: 'edit_field:active' }],
    [{ text: '❌ لغو', callback_data: 'menu' }],
  ]};
}

function confirmEditKb() {
  return { inline_keyboard: [
    [{ text: '✅ تأیید', callback_data: 'edit_confirm:ok' }, { text: '❌ لغو', callback_data: 'edit_confirm:no' }],
  ]};
}

// ===========================================================================
//  دستورات متنی
// ===========================================================================
async function cmdStart({ chatId, message, env }) {
  return sendMsg(chatId,
    '👋 <b>ربات تجمیع‌کننده محتوا فعال است.</b>\n\n<blockquote>برای شروع، منو را باز کنید و یک گزینه انتخاب کنید.</blockquote>', env, mainMenuKb(), 'HTML', message?.message_thread_id || null);
}

async function cmdHelp({ chatId, message, env }) {
  return sendMsg(chatId, helpText('main'), env, helpKb(), 'HTML', message?.message_thread_id || null);
}

async function cmdAddSource({ chatId, userId, message, env }) {
  const tid = message?.message_thread_id || null;
  await setState(userId, { step: 'add_channel', chatId, threadId: tid }, env);
  return sendWizardPrompt(chatId, '➕ <b>افزودن منبع</b>\n\n<blockquote><b>۱.</b> آیدی کانال(ها) را بفرستید.\n\nچند کانال با کاما: <code>@chan1,@chan2</code></blockquote>', env, tid);
}
const cmdAddSourceBulk = cmdAddSource;

async function cmdEditSource({ chatId, userId, message, env }) {
  const tid = message?.message_thread_id || null;
  await setState(userId, { step: 'edit_select', chatId, threadId: tid }, env);
  return sendWizardPrompt(chatId, '🔧 آیدی منبع(های) موردنظر را بفرستید (با کاما):', env, tid);
}

async function cmdSetTarget({ chatId, userId, message, env }) {
  return showSourcePicker(chatId, null, env, 'settarget_pick', message?.message_thread_id || null);
}

async function cmdDelSource({ chatId, userId, message, env }) {
  return showSourcePicker(chatId, null, env, 'del_pick', message?.message_thread_id || null);
}

async function cmdScanSingle({ chatId, message, env }) {
  return showSourcePicker(chatId, null, env, 'scan_one', message?.message_thread_id || null);
}

async function cmdListSources({ chatId, message, env }) {
  return showSourcesList(chatId, null, env, 0, message?.message_thread_id || null);
}

async function cmdBackup({ chatId, message, env, userId }) {
  return doBackup(chatId, env, message?.message_thread_id || null, String(userId));
}

async function cmdRestore({ chatId, userId, message, env }) {
  if (message.document) {
    return restoreFromFile(message, chatId, env);
  }
  return sendMsg(chatId, '📥 برای بازیابی، فایل JSON بکاپ را فوروارد کنید.\n\nدستور /backup برای گرفتن بکاپ.', env, null, 'HTML', message?.message_thread_id || null);
}

async function cmdAddAdmin({ chatId, userId, args, message, env }) {
  const tid = message?.message_thread_id || null;
  if (args && /^\d+$/.test(args.trim())) {
    await addAdmin(args.trim(), userId, env);
    return sendMsg(chatId, `✅ ادمین ${args.trim()} افزوده شد.`, env, null, 'HTML', tid);
  }
  await setState(userId, { step: 'addadmin_input', chatId, threadId: tid }, env);
  return sendWizardPrompt(chatId, '➕ آیدی عددی ادمین جدید را بفرستید:', env, tid);
}

async function cmdDelAdmin({ chatId, userId, args, message, env }) {
  const tid = message?.message_thread_id || null;
  if (args && /^\d+$/.test(args.trim())) {
    await removeAdmin(args.trim(), env);
    return sendMsg(chatId, `🗑 ادمین ${args.trim()} حذف شد.`, env, null, 'HTML', tid);
  }
  await setState(userId, { step: 'deladmin_input', chatId, threadId: tid }, env);
  return sendWizardPrompt(chatId, '🗑 آیدی عددی ادمین را بفرستید:', env, tid);
}

async function cmdAdmins({ chatId, message, env }) {
  return showAdmins(chatId, null, env, message?.message_thread_id || null);
}

// ── /setpermissions : تنظیم دسترسی ادمین فرعی از تلگرام ──
async function cmdSetPermissions({ chatId, userId, message, env }) {
  const tid = message?.message_thread_id || null;
  const res = await listAdmins(env);
  const list = res.results || [];
  if (!list.length) {
    return sendMsg(chatId, '📋 ادمین فرعی‌ای وجود ندارد.\n\nاول با /addadmin ادمین اضافه کنید.', env, null, 'HTML', tid);
  }
  let text = `⚙️ <b>تنظیم دسترسی ادمین</b>\n\n`;
  text += `یک ادمین را برای تنظیم دسترسی انتخاب کنید:\n\n`;
  const kb = { inline_keyboard: [] };
  for (const a of list) {
    // گرفتن نام
    let name = '';
    try {
      const info = await tg('getChat', { chat_id: Number(a.user_id) }, env);
      if (info.ok && info.result) {
        name = [info.result.first_name, info.result.last_name].filter(Boolean).join(' ') || info.result.username || '';
      }
    } catch {}
    const perms = safeJson(a.permissions, {});
    const permCount = Object.values(perms).filter(v => v).length;
    const badge = permCount === 0 ? '🔴 محدود' : permCount >= 11 ? '🟢 کامل' : `🟡 ${permCount}/۱۲`;
    kb.inline_keyboard.push([{
      text: `👤 ${a.user_id}${name ? ' — ' + name : ''} (${badge})`,
      callback_data: `perm_pick:${a.user_id}`,
    }]);
  }
  kb.inline_keyboard.push([{ text: '🏠 منو', callback_data: 'menu' }]);
  return sendMsg(chatId, text, env, kb, 'HTML', tid);
}

async function cmdScanNow({ chatId, message, env }) {
  const tid = message?.message_thread_id || null;
  await sendMsg(chatId, '🔄 اسکن همه منابع آغاز شد...', env, null, 'HTML', tid);
  const sources = await env.DB.prepare('SELECT * FROM sources WHERE active = 1').all();
  let totalSent = 0, totalScanned = 0, totalSkipped = 0, totalDup = 0;
  for (const s of sources.results || []) {
    const r = await scanSource(s, env, false);
    totalSent += r.sent || 0;
    totalScanned += r.scanned || 0;
    totalSkipped += r.skipped || 0;
    totalDup += r.duplicates || 0;
  }
  const summary = `✅ اسکن پایان یافت.\n\n📊 ${totalScanned} بررسی / ${totalSent} ارسال / ${totalSkipped} رد / ${totalDup} تکراری`;
  return sendMsg(chatId, summary, env, null, 'HTML', tid);
}

async function cmdStats({ chatId, message, env }) {
  return showStats(chatId, null, env, message?.message_thread_id || null);
}

async function cmdCancel({ chatId, userId, message, env }) {
  await clearState(userId, env);
  return sendMsg(chatId, '✅ <b>عملیات لغو شد.</b>\n\n<blockquote>می‌توانید دستور جدیدی بفرستید یا از منو انتخاب کنید.</blockquote>', env, mainMenuKb(), 'HTML', message?.message_thread_id || null);
}

// ── /settopic : تنظیم موضوع برای یک منبع ──
async function cmdSetTopic({ chatId, userId, message, env }) {
  return showSourcePicker(chatId, null, env, 'settopic_pick', message?.message_thread_id || null);
}

// ── /aianalyze : تحلیل دستی AI برای یک منبع ──
async function cmdAIAnalyze({ chatId, userId, message, env }) {
  const tid = message?.message_thread_id || null;
  if (!isAIAvailable(env)) {
    return sendMsg(chatId,
      '⚠️ <b>هوش مصنوعی فعال نیست.</b>\n\n' +
      '<blockquote><b>۲ راه برای فعال‌سازی:</b>\n\n<b>۱. Gemini (پیشنهادی — رایگان و پایدار):</b>\n' +
      'کلید API رایگان از: <code>https://aistudio.google.com/app/apikey</code>\n' +
      'سپس در Worker ذخیره کنید:\n' +
      '<code>wrangler secret put GEMINI_API_KEY</code>\n\n' +
      '<b>۲. Workers AI (Cloudflare):</b>\n' +
      'این خطوط را به <code>wrangler.toml</code> اضافه کنید:\n' +
      '<code>[ai]</code>\n<code>binding = "AI"</code></blockquote>', env, null, 'HTML', tid);
  }
  return showSourcePicker(chatId, null, env, 'aianalyze_pick', tid);
}

// ── /report : تولید دستی گزارش روزانه ──
async function cmdReport({ chatId, userId, message, env }) {
  const tid = message?.message_thread_id || null;
  await sendMsg(chatId, '📊 <b>در حال تولید گزارش...</b>\n\n<blockquote>⏳ لطفاً صبر کنید — جمع‌آوری و تحلیل داده‌ها ممکن است چند ثانیه طول بکشد.</blockquote>', env, null, 'HTML', tid);
  // پیام «بیشتر صبر کنید» بعد از ۱۵ ثانیه
  const slowTimer = setTimeout(async () => {
    await sendMsg(chatId, '⏳ <b>هنوز در حال تولید گزارش است...</b>\n\n<blockquote>در حال پردازش پست‌های ۲۴ ساعت اخیر. کمی بیشتر صبر کنید.</blockquote>', env, null, 'HTML', tid);
  }, 15000);
  try {
    await runDailyReport(env);
    clearTimeout(slowTimer);
    return sendMsg(chatId, '✅ <b>گزارش به ادمین اصلی ارسال شد.</b>', env, null, 'HTML', tid);
  } catch (e) {
    clearTimeout(slowTimer);
    return sendMsg(chatId, `❌ <b>خطا در تولید گزارش:</b>\n\n<blockquote><code>${escHtml(e.message)}</code></blockquote>`, env, null, 'HTML', tid);
  }
}

// ── /balancad : گزارش پست پاک — کاهش وزن (برعکس report_ad) ──
async function cmdBalancAd({ chatId, userId, message, env }) {
  const tid = message?.message_thread_id || null;

  let postText = '';
  // اگه روی پست reply زده
  if (message.reply_to_message) {
    postText = message.reply_to_message.text || message.reply_to_message.caption || '';
  }
  // اگه فوروارد کرده
  else if (message.forward_origin || message.forward_from || message.forward_from_chat) {
    postText = message.text || message.caption || '';
  }

  if (!postText) {
    return sendMsg(chatId, '📋 <b>روش استفاده:</b>\n\n<blockquote>۱. روی پستی که به‌اشتباه مسدود شده <b>Reply</b> بزن\n۲. <code>/balancad</code> را بفرست\n\nیا پست را <b>Forward</b> کن و <code>/balancad</code> بفرست</blockquote>', env, null, 'HTML', tid);
  }

  // استخراج توکن‌ها
  const tokens = tokenizePost(postText);
  const allTokens = [
    ...tokens.words.map(w => w.w),
    ...tokens.links,
    ...tokens.bots,
  ];

  // کاهش وزن هر توکن
  let reduced = 0;
  for (const t of allTokens) {
    try {
      const existing = await env.DB.prepare('SELECT token, hits, weight FROM ad_weights WHERE token=?').bind(t).first();
      if (existing) {
        const newWeight = Math.max(0, existing.weight - 10);
        const newHits = Math.max(0, existing.hits - 1);
        if (newWeight === 0 && newHits === 0) {
          await env.DB.prepare('DELETE FROM ad_weights WHERE token=?').bind(t).run();
        } else {
          await env.DB.prepare('UPDATE ad_weights SET hits=?, weight=? WHERE token=?').bind(newHits, newWeight, t).run();
        }
        reduced++;
      }
    } catch {}
  }

  // محاسبه امتیاز جدید
  let newScore = 0;
  let verdict = 'clean';
  try {
    const result = await scoreAdPost({ text: postText, channel: 'report', isReply: false }, env);
    newScore = result.score;
    verdict = result.verdict;
  } catch {}

  const verdictEmoji = verdict === 'block' ? '🚫 مسدود' : verdict === 'quarantine' ? '⚠️ قرنطینه' : '✅ پاک';

  return sendMsg(chatId, `✅ <b>گزارش پاک ثبت شد</b>\n\n<blockquote>⚖️ وزن <b>${reduced}</b> توکن کاهش یافت\n📊 امتیاز جدید: <b>${newScore}/۱۰۰</b> — ${verdictEmoji}\n✅ این پست دیگر به‌عنوان تبلیغ تشخیص داده نمی‌شود</blockquote>`, env, null, 'HTML', tid);
}

// ── /adblock : مدیریت سیستم ضد تبلیغات ──
async function cmdAdBlock({ chatId, userId, message, env }) {
  const tid = message?.message_thread_id || null;
  const kb = { inline_keyboard: [
    [{ text: '🔄 تغییر وضعیت یک منبع', callback_data: 'adblock_pick_start' }],
    [{ text: '📊 آمار مسدودشده‌ها (۷ روز)', callback_data: 'adblock_stats' }],
    [{ text: '🏠 منو', callback_data: 'menu' }],
  ] };

  // آمار کلی
  const totalRes = await env.DB.prepare(
    "SELECT COUNT(*) as cnt FROM logs WHERE action='skipped' AND detail LIKE '🚫 تبلیغ%' AND created_at > ?"
  ).bind(Date.now() - 86400000 * 7).first();
  const totalBlocked = totalRes?.cnt || 0;

  // تعداد منابع با ضد تبلیغات روشن
  const activeRes = await env.DB.prepare('SELECT COUNT(*) as cnt FROM sources WHERE block_ads = 1 AND active = 1').first();
  const activeCount = activeRes?.cnt || 0;
  const totalRes2 = await env.DB.prepare('SELECT COUNT(*) as cnt FROM sources WHERE active = 1').first();
  const totalSources = totalRes2?.cnt || 0;

  const text = `🛡 <b>سیستم ضد تبلیغات</b>\n\n` +
    `📊 پست‌های تبلیغاتی مسدودشده (۷ روز): <b>${totalBlocked.toLocaleString('fa-IR')}</b>\n` +
    `📡 منابع با فیلتر روشن: <b>${activeCount.toLocaleString('fa-IR')}</b> از <b>${totalSources.toLocaleString('fa-IR')}</b>\n\n` +
    `<b>سیستم چطور کار می‌کند؟</b>\n` +
    `• <b>لایه ۱</b>: الگوهای صریح (تخفیف N٪، کد تخفیف، فرصت محدود، لینک joinchat)\n` +
    `• <b>لایه ۲</b>: امتیازگذاری — ۲+ نشانگر تبلیغاتی (فروش، خرید، رایگان، تضمین…) = تبلیغ\n` +
    `• <b>لایه ۳</b>: لینک‌های مشکوک (bit.ly، دامنه‌های .vip/.xyz/.shop)\n` +
    `• <b>لایه ۴</b>: مولتی‌فوروارد (۲+ نام کانال در یک پست)\n\n` +
    `از دکمه زیر برای روشن/خاموش کردن روی یک منبع استفاده کنید.`;

  return sendMsg(chatId, text, env, kb, 'HTML', tid);
}

// ── /ping : تست سریع فعال بودن ربات در هر چت ──
async function cmdPing({ message, chatId, env }) {
  const threadId = message.message_thread_id;
  const chatType = message.chat.type;
  const chatTitle = message.chat.title || (chatType === 'private' ? 'چت خصوصی' : '—');
  let msg = '🏓 <b>پینگ!</b>\n\n';
  msg += `📡 چت: <b>${escHtml(chatTitle)}</b>\n`;
  msg += `🆔 <code>${chatId}</code>\n`;
  msg += `👤 نوع: <i>${chatType}</i>\n`;
  if (threadId) {
    msg += `📋 تاپیک: <code>${threadId}</code>\n`;
  } else if (chatType === 'supergroup') {
    msg += `📋 تاپیک: <i>جنرال</i>\n`;
  }
  msg += `✅ <b>ربات فعال است</b> و پیام‌ها را دریافت می‌کند.`;
  const params = { chat_id: chatId, text: msg, parse_mode: 'HTML', disable_web_page_preview: true };
  if (threadId) params.message_thread_id = threadId;
  return tg('sendMessage', params, env);
}

// ── /check : بررسی وضعیت ربات در گروه فعلی ──
async function cmdCheck({ message, chatId, env }) {
  const threadId = message.message_thread_id;
  const chatInfo = await tg('getChat', { chat_id: chatId }, env);
  if (!chatInfo.ok) {
    return sendMsg(chatId, '❌ <b>دریافت اطلاعات چت ناموفق بود.</b>', env, null, 'HTML', threadId || null);
  }
  const chat = chatInfo.result;
  const isForum = !!(chat.is_forum || (chat.type === 'supergroup' && chat.forum_topic_created));
  const meRes = await tg('getChatMember', { chat_id: chatId, user_id: Number(env.MAIN_ADMIN_ID) }, env).catch(() => null);

  let msg = '🔍 <b>بررسی وضعیت نصب</b>\n\n';
  msg += `📡 نام: <b>${escHtml(chat.title || 'چت خصوصی')}</b>\n`;
  msg += `🆔 <code>${chat.id}</code>\n`;
  msg += `👤 نوع چت: <i>${chat.type}</i>\n`;
  msg += `🤖 وضعیت ربات: `;

  // بررسی ادمین بودن ربات
  const botInfo = await tg('getMe', {}, env);
  const botId = botInfo.ok ? botInfo.result.id : null;
  let botStatus = 'نامشخص';
  if (botId) {
    const botMember = await tg('getChatMember', { chat_id: chatId, user_id: botId }, env);
    if (botMember.ok) {
      botStatus = botMember.result.status;
    }
  }
  const isAdminBot = ['administrator', 'creator'].includes(botStatus);
  msg += `<b>${botStatus}</b> ${isAdminBot ? '✅' : '⚠️'}\n`;

  if (isForum) {
    msg += `📋 گروه تاپیک‌دار: <b>بله</b>\n`;
    if (threadId) {
      msg += `📋 تاپیک فعلی: <code>${threadId}</code>\n`;
    } else {
      msg += `📋 تاپیک فعلی: <b>جنرال</b>\n`;
    }
    if (!isAdminBot) {
      msg += `\n<blockquote>⚠️ ربات ادمین نیست — در گروه‌های تاپیک‌دار، ربات باید ادمین باشد تا به تاپیک‌ها پیام بفرستد.</blockquote>`;
    }
  } else {
    msg += `📋 گروه تاپیک‌دار: <i>خیر</i>\n`;
  }

  if (isAdminBot) {
    msg += `\n✅ <b>نصب موفق آمیز است!</b> ربات می‌تواند پیام بفرستد.`;
  } else {
    msg += `\n❌ <b>ربات ادمین نیست.</b> لطفاً ربات را ادمین کنید.`;
  }

  const params = { chat_id: chatId, text: msg, parse_mode: 'HTML', disable_web_page_preview: true };
  if (threadId) params.message_thread_id = threadId;
  return tg('sendMessage', params, env);
}

// ===========================================================================
//  نمایش‌ها (لیست منابع، ادمین‌ها، آمار، اسکن تک‌منبع)
// ===========================================================================
async function showSourcesList(chatId, messageId, env, page = 0, threadId = null) {
  const perPage = 10;
  const off = page * perPage;
  const res = await env.DB.prepare('SELECT * FROM sources ORDER BY id DESC LIMIT ? OFFSET ?').bind(perPage, off).all();
  const countRes = await env.DB.prepare('SELECT COUNT(*) as c FROM sources').first();
  const total = countRes?.c || 0;

  if (!res.results.length) {
    const t = '📋 هیچ منبعی ثبت نشده است.';
    return messageId ? editMsg(chatId, messageId, t, env, mainMenuKb()) : sendMsg(chatId, t, env, mainMenuKb(), 'HTML', threadId);
  }

  let text = `📋 لیست منابع (${total}) — صفحه ${page + 1}\n\n`;
  for (const s of res.results) {
    const pos = safeJson(s.keywords_positive, []);
    const neg = safeJson(s.keywords_negative, []);
    const main = safeJson(s.keywords_main, []);
    const comp = safeJson(s.keywords_complementary, []);
    const periph = safeJson(s.keywords_peripheral, []);
    const viralRules = safeJson(s.viral_reactions, []);
    text += `🆔 ${s.id} | @${s.channel}\n`;
    text += `   ${modeName(s.mode)}${s.active ? '' : ' (غیرفعال)'} → ${s.target_chat_id}${s.target_topic_id ? ':' + s.target_topic_id : ''}\n`;
    if (s.mode === 'deep') {
      // ⚠️ نمایش بر اساس نوع Deep (Classic یا Scoring)
      const isScoring = s.deep_scoring == 1;
      if (isScoring) {
        text += `   نوع: Deep Scoring | آستانه: ${s.deep_threshold || 50}\n`;
        if (main.length) text += `   اصلی: ${main.join(', ')}\n`;
        if (comp.length) text += `   مکمل: ${comp.join(', ')}\n`;
        if (periph.length) text += `   پیرامونی: ${periph.join(', ')}\n`;
      } else {
        text += `   نوع: Deep Classic | مثبت‌کننده: ${pos.join(', ') || '—'} | منفی‌کننده: ${neg.join(', ') || '—'}${s.every_mode ? ' | every' : ''}\n`;
      }
    } else if (s.mode === 'viral') {
      // ⚠️ نمایش قوانین ری‌اکشن (طبق سند: معیار ری‌اکشن است نه views)
      if (viralRules.length) {
        text += `   قوانین ری‌اکشن:\n`;
        for (const r of viralRules) text += `     ${r.emoji} ≥ ${r.threshold}\n`;
      } else {
        text += `   مجموع ری‌اکشن‌ها ≥ ${s.viral_threshold || 1000}\n`;
      }
    }
    text += '\n';
  }

  const kb = { inline_keyboard: [] };
  const row = [];
  if (page > 0) row.push({ text: '⬅️ قبلی', callback_data: `list_paged:${page - 1}` });
  if ((page + 1) * perPage < total) row.push({ text: '➡️ بعدی', callback_data: `list_paged:${page + 1}` });
  if (row.length) kb.inline_keyboard.push(row);
  kb.inline_keyboard.push([{ text: '🏠 منو', callback_data: 'menu' }]);

  return messageId ? editMsg(chatId, messageId, text, env, kb) : sendMsg(chatId, text, env, kb, 'HTML', threadId);
}

async function showSourcePicker(chatId, messageId, env, callbackAction, threadId = null) {
  const res = await env.DB.prepare('SELECT id, channel, mode FROM sources ORDER BY id DESC LIMIT 20').all();
  if (!res.results.length) {
    const t = '📋 منبعی وجود ندارد.';
    return messageId ? editMsg(chatId, messageId, t, env, mainMenuKb()) : sendMsg(chatId, t, env, mainMenuKb(), 'HTML', threadId);
  }
  const kb = { inline_keyboard: [] };
  for (const s of res.results) {
    kb.inline_keyboard.push([{ text: `#${s.id} @${s.channel} (${modeName(s.mode)})`, callback_data: `${callbackAction}:${s.id}` }]);
  }
  kb.inline_keyboard.push([{ text: '🏠 منو', callback_data: 'menu' }]);
  const t = '🔍 یک منبع را انتخاب کنید:';
  return messageId ? editMsg(chatId, messageId, t, env, kb) : sendMsg(chatId, t, env, kb, 'HTML', threadId);
}

async function doScanSingle(sourceId, chatId, env, threadId = null) {
  const s = await env.DB.prepare('SELECT * FROM sources WHERE id = ?').bind(sourceId).first();
  if (!s) return sendMsg(chatId, '❌ منبع یافت نشد.', env, null, 'HTML', threadId);
  await sendMsg(chatId, `🔄 اسکن @${s.channel} آغاز شد...`, env, null, 'HTML', threadId);
  const r = await scanSource(s, env, false);
  const summary = `✅ ${r.scanned} بررسی / ${r.sent} ارسال / ${r.skipped} رد / ${r.duplicates} تکراری`;
  return sendMsg(chatId, summary, env, mainMenuKb(), 'HTML', threadId);
}

async function showAdmins(chatId, messageId, env, threadId = null) {
  const res = await listAdmins(env);

  // گرفتن نام ادمین اصلی از تلگرام
  let mainName = '';
  try {
    const mainInfo = await tg('getChat', { chat_id: Number(env.MAIN_ADMIN_ID) }, env);
    if (mainInfo.ok && mainInfo.result) {
      const u = mainInfo.result;
      mainName = [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username || '';
    }
  } catch {}

  let text = `🛡 ادمین‌ها\n\n`;
  text += `🟢 <b>اصلی</b>: <code>${env.MAIN_ADMIN_ID}</code>`;
  if (mainName) text += ` — ${escHtml(mainName)}`;
  text += `\n`;

  for (const a of res.results || []) {
    // گرفتن نام هر ادمین از تلگرام
    let adminName = '';
    try {
      const info = await tg('getChat', { chat_id: Number(a.user_id) }, env);
      if (info.ok && info.result) {
        const u = info.result;
        adminName = [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username || '';
      }
    } catch {}
    text += `👤 <code>${a.user_id}</code>`;
    if (adminName) text += ` — ${escHtml(adminName)}`;
    text += ` (توسط ${escHtml(a.added_by || '—')})\n`;
  }

  const kb = {
    inline_keyboard: [
      [{ text: '➕ افزودن ادمین', callback_data: 'addadmin_start' }, { text: '🗑 حذف ادمین', callback_data: 'deladmin_start' }],
      [{ text: '🏠 منو', callback_data: 'menu' }],
    ],
  };
  return messageId ? editMsg(chatId, messageId, text, env, kb) : sendMsg(chatId, text, env, kb, 'HTML', threadId);
}

async function showStats(chatId, messageId, env, threadId = null) {
  const sent = await env.DB.prepare("SELECT COUNT(*) as c FROM logs WHERE action='sent'").first();
  const scanned = await env.DB.prepare("SELECT COUNT(*) as c FROM logs WHERE action='scanned'").first();
  const skipped = await env.DB.prepare("SELECT COUNT(*) as c FROM logs WHERE action='skipped'").first();
  const errors = await env.DB.prepare("SELECT COUNT(*) as c FROM logs WHERE action='error'").first();
  const srcCount = await env.DB.prepare("SELECT COUNT(*) as c FROM sources").first();
  const adsRes = await env.DB.prepare("SELECT COUNT(*) as c FROM logs WHERE action='skipped' AND detail LIKE '🚫 تبلیغ%'").first();
  const text = `📊 <b>آمار کلی</b>\n\n<blockquote>📡 منابع: <b>${(srcCount?.c || 0).toLocaleString('fa-IR')}</b>\n✅ ارسال‌شده: <b>${(sent?.c || 0).toLocaleString('fa-IR')}</b>\n🔄 اسکن‌شده: <b>${(scanned?.c || 0).toLocaleString('fa-IR')}</b>\n⏭ ردشده: <b>${(skipped?.c || 0).toLocaleString('fa-IR')}</b>\n🚫 تبلیغ مسدود: <b>${(adsRes?.c || 0).toLocaleString('fa-IR')}</b>\n⚠️ خطا: <b>${(errors?.c || 0).toLocaleString('fa-IR')}</b></blockquote>`;
  return messageId ? editMsg(chatId, messageId, text, env, mainMenuKb()) : sendMsg(chatId, text, env, mainMenuKb(), 'HTML', threadId);
}

async function doBackup(chatId, env, threadId = null, adminId = null) {
  const sources = await env.DB.prepare('SELECT * FROM sources ORDER BY id').all();
  const admins = await listAdmins(env);
  // ⚠️ طبق سند: شامل sources + ad_weights + quarantine_config (نه logs)
  let adWeights = [];
  let quarantineConfig = null;
  try {
    const wRes = await env.DB.prepare('SELECT * FROM ad_weights ORDER BY hits DESC, weight DESC').all();
    adWeights = wRes.results || [];
  } catch {}
  try {
    const qRow = await env.DB.prepare("SELECT value FROM kv_meta WHERE key='quarantine_config'").first();
    if (qRow?.value) quarantineConfig = JSON.parse(qRow.value);
  } catch {}
  const data = {
    version: 3,
    exported_at: new Date().toISOString(),
    sources: sources.results,
    ad_weights: adWeights,
    quarantine_config: quarantineConfig,
    admins: admins.results,
  };
  await sendDocument(chatId, JSON.stringify(data, null, 2), `backup-${Date.now()}.json`, env, threadId);
  // ⚠️ طبق سند: «هنگام دریافت فایل بکاپ توسط ادمین‌ها، این فعالیت در قسمت فعالیت ادمین‌ها ثبت شود»
  if (adminId) {
    try { await logAdminActivity(adminId, 'backup', `بکاپ ${sources.results?.length || 0} منبع + ${adWeights.length} وزن`, env); } catch {}
  }
  return sendMsg(chatId, '💾 <b>فایل بکاپ ارسال شد.</b>\n\n<blockquote>برای بازیابی، همین فایل را فوروارد کنید و دستور <code>/restore</code> را بزنید.</blockquote>', env, mainMenuKb(), 'HTML', threadId);
}

async function restoreFromFile(message, chatId, env) {
  const tid = message.message_thread_id || null;
  const nowStr = new Date().toLocaleString('fa-IR', { timeZone: 'Asia/Tehran' });
  let sourcesCount = 0;
  let weightsCount = 0;
  try {
    const fileId = message.document.file_id;
    const f = await fetch(`${BOT_API}${env.BOT_TOKEN}/getFile?file_id=${fileId}`);
    const fj = await f.json();
    const file = await fetch(`${BOT_API}${env.BOT_TOKEN}/file/bot/${fj.result.file_path}`);
    const data = await file.json();

    // ۱) بازیابی منابع با تمام فیلدهای v4
    for (const s of (data.sources || [])) {
      try {
        await env.DB.prepare(
          `INSERT OR REPLACE INTO sources (
            id, channel, target_chat_id, target_topic_id, mode, topic,
            keywords_positive, keywords_negative,
            keywords_main, keywords_complementary, keywords_peripheral,
            pending_keywords_positive, pending_keywords_negative,
            pending_keywords_main, pending_keywords_complementary, pending_keywords_peripheral,
            every_mode, deep_scoring, deep_threshold,
            viral_threshold, viral_reactions,
            block_ads, ad_threshold,
            active, created_by, created_at
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
        ).bind(
          s.id, s.channel, s.target_chat_id, s.target_topic_id, s.mode, s.topic || '',
          s.keywords_positive || '[]', s.keywords_negative || '[]',
          s.keywords_main || '[]', s.keywords_complementary || '[]', s.keywords_peripheral || '[]',
          s.pending_keywords_positive || '', s.pending_keywords_negative || '',
          s.pending_keywords_main || '', s.pending_keywords_complementary || '', s.pending_keywords_peripheral || '',
          s.every_mode ? 1 : 0, s.deep_scoring ? 1 : 0, s.deep_threshold || 50,
          s.viral_threshold || 0, s.viral_reactions || '[]',
          s.block_ads === undefined ? 1 : s.block_ads, s.ad_threshold || 70,
          s.active === undefined ? 1 : s.active, s.created_by || '', s.created_at || Date.now()
        ).run();
        sourcesCount++;
      } catch (eSrc) {
        console.error('restore source error:', eSrc);
      }
    }

    // ۲) بازیابی ad_weights (کلمات، دامنه‌ها، ایموجی‌ها، وزن‌ها)
    for (const w of (data.ad_weights || [])) {
      try {
        await env.DB.prepare(
          'INSERT OR REPLACE INTO ad_weights (token, type, weight, hits, auto, created_at) VALUES (?,?,?,?,?,?)'
        ).bind(w.token, w.type || 'word', w.weight || 30, w.hits || 0, w.auto || 0, w.created_at || Date.now()).run();
        weightsCount++;
      } catch {}
    }

    // ۳) بازیابی quarantine_config
    if (data.quarantine_config) {
      try {
        await env.DB.prepare("INSERT OR REPLACE INTO kv_meta (key, value) VALUES ('quarantine_config', ?)")
          .bind(JSON.stringify(data.quarantine_config)).run();
      } catch {}
    }

    // ⚠️ طبق سند معماری:
    // «در صورت موفقیت آمیز بودن در لاگ سیستم ثبت شود: بازیابی با موفقیت انجام شد همراه با تاریخ و ساعت»
    await logAction(0, 'restore', `بازیابی با موفقیت انجام شد همراه با تاریخ و ساعت: ${nowStr} (${sourcesCount} منبع + ${weightsCount} وزن)`, env);
    return sendMsg(chatId, `✅ <b>بازیابی با موفقیت انجام شد</b>\n\n<blockquote>📅 زمان: ${nowStr}\n📡 منابع: ${sourcesCount}\n⚖️ وزن‌های ضد تبلیغ: ${weightsCount}</blockquote>`, env, mainMenuKb(), 'HTML', tid);
  } catch (e) {
    // ⚠️ طبق سند معماری:
    // «در صورت ناموفق بودن در لاگ سیستم ثبت شود: بازیابی ناموفق بود همراه با جزییات و تاریخ و ساعت»
    await logAction(0, 'restore', `بازیابی ناموفق بود همراه با جزییات و تاریخ و ساعت: ${nowStr} — خطا: ${e.message}`, env);
    return sendMsg(chatId, `❌ <b>بازیابی ناموفق بود</b>\n\n<blockquote>📅 زمان: ${nowStr}\n⚠️ خطا: ${escHtml(e.message)}</blockquote>`, env, null, 'HTML', tid);
  }
}

function safeJson(s, def) {
  if (s === null || s === undefined || s === '') return def;
  if (typeof s === 'object') return s;
  try { return JSON.parse(s); } catch { return def; }
}

// ===========================================================================
//  متن راهنما
// ===========================================================================
function helpText(section) {
  const map = {
    main: `📖 <b>راهنمای ربات</b>\n\nربات تجمیع‌کننده محتوای تلگرام — یک دسته را انتخاب کنید:`,
    sources: `📡 <b>مدیریت منابع</b>\n\n<blockquote>➕ <code>/addsource</code> — افزودن منبع (مرحله‌ای)\n📝 <code>/settopic</code> — تنظیم موضوع منبع\n📋 <code>/listsources</code> — لیست منابع\n🔍 <code>/scansingle</code> — اسکن یک منبع\n🗑 <code>/delsource</code> — حذف منبع</blockquote>\n\n<b>حالت‌ها:</b>\n<blockquote>• <b>فوروارد</b> — ارسال همه پست‌ها\n• <b>عمیق</b> — Deep Classic (مثبت/منفی) یا Deep Scoring (اصلی/مکمل/پیرامونی)\n• <b>وایرال</b> — بر اساس آستانه ری‌اکشن</blockquote>\n\n⚠️ ویرایش گروهی فقط از <i>پنل تحت وب</i> قابل انجام است.`,
    targets: `📤 <b>مقاصد و تاپیک‌ها</b>\n\n<code>/settarget</code> — تغییر مقصد منبع\n\n📍 <b>مقصد می‌تواند:</b>\n<blockquote>• یک گروه/کانال (<code>chat_id</code>)\n• یک تاپیک خاص (<code>chat_id:topic_id</code>)</blockquote>\n\nهنگام تنظیم مقصد، دکمه «همین چت + تاپیک فعلی» را بزنید تا در همان تاپیکی که هستید تنظیم شود.\n\n⚠️ در گروه‌های تاپیک‌دار، حتماً <b>در تاپیک مورد نظر</b> دستور بزنید تا ربات در همان تاپیک جواب دهد.`,
    ai: `🤖 <b>هوش مصنوعی (Gemini + Workers AI)</b>\n\n🔍 <code>/aianalyze</code> — تحلیل هوشمند کلیدواژه\n\n<blockquote>ربات ۳۰ پست اخیر کانال را بررسی می‌کند و کلیدواژه‌های مثبت + منفی پیشنهاد می‌دهد.</blockquote>\n\n✅ کلیدواژه‌های پیشنهادی <i>pending</i> می‌شوند و نیاز به تأیید ادمین دارند.\n\n📝 <b>برای فعال‌سازی AI:</b>\n<blockquote><b>گزینه ۱ (پیشنهادی): Gemini API</b>\nکلید رایگان از: <code>aistudio.google.com/app/apikey</code>\n<code>wrangler secret put GEMINI_API_KEY</code>\n\n<b>گزینه ۲: Workers AI</b>\n<code>[ai]</code> binding در <code>wrangler.toml</code>\n۲. موضوع منبع را با <code>/settopic</code> تنظیم کنید\n۳. <code>/aianalyze</code> را بزنید</blockquote>\n\n⏰ <b>تحلیل خودکار:</b> هر روز ساعت <b>۲ بامداد ایران</b> (۲۲:۳۰ UTC) — یک منبع به نوبت تحلیل می‌شود.`,
    report: `📋 <b>گزارش روزانه</b>\n\n📊 <code>/report</code> — تولید گزارش هوشمند\n\n<b>گزارش شامل:</b>\n<blockquote>• پست‌های ارسالی ۲۴ ساعت اخیر\n• گروه‌بندی بر اساس موضوع\n• پست‌های وایرال (مرتب بر اساس بازدید)\n• خلاصه هوشمند با AI</blockquote>\n\n⏰ <b>ارسال خودکار:</b> هر شب ساعت <b>۳ ایران</b> (۲۳:۳۰ UTC) — گزارش به ادمین اصلی ارسال می‌شود.\n\nهمچنین از <i>پنل تحت وب</i> قابل مشاهده است.`,
    admins: `🛡 <b>ادمین‌ها</b>\n\nادمین اصلی: از متغیر <code>MAIN_ADMIN_ID</code>\n\n<blockquote><code>/addadmin</code> — افزودن ادمین فرعی\n<code>/deladmin</code> — حذف ادمین\n<code>/admins</code> — لیست ادمین‌ها\n<code>/setpermissions</code> — تنظیم دسترسی هر ادمین</blockquote>\n\n🔒 فقط ادمین‌ها می‌توانند با ربات تعامل کنند.\n🔒 ری‌اکشن 🫡 فقط روی دستورات (شروع با <code>/</code>) زده می‌شود.\n🔒 ادمین‌های فرعی فقط به دستوراتی که دسترسی دارند می‌توانند پاسخ دهند.`,
    misc: `🔧 <b>سایر دستورات</b>\n\n<blockquote><code>/ping</code> — تست فعال بودن ربات\n<code>/check</code> — بررسی وضعیت نصب و ادمین بودن\n<code>/scan</code> — اسکن فوری همه منابع\n<code>/stats</code> — آمار کلی\n<code>/adblock</code> — مدیریت سیستم ضد تبلیغات\n<code>/backup</code> — دریافت فایل بکاپ JSON\n<code>/restore</code> — بازیابی از فایل بکاپ\n<code>/cancel</code> — لغو عملیات جاری\n<code>/help</code> — این راهنما</blockquote>\n\n🌐 پنل مدیریت: <code>your-worker.pages.dev/panel</code>`,
    cron: `⏰ <b>زمان‌بندی خودکار (Cron)</b>\n\nربات ۳ کار خودکار دارد که در زمان‌های مشخص اجرا می‌شوند:\n\n<blockquote><b>۱. اسکن منابع</b> — هر <b>۲ دقیقه</b>\n<code>*/2 * * * *</code>\nیک منبع به نوبت بررسی می‌شود (حلقه‌ای Round-Robin) — جلوگیری از Exceeded CPU limit.\n\n<b>۲. تحلیل کلیدواژه با AI</b> — هر روز <b>۲ بامداد ایران</b>\n<code>30 22 * * *</code> (UTC 22:30)\nیک منبع با موضوع انتخاب شده، به‌نوبت تحلیل می‌شود و کلیدواژه‌های پیشنهادی به ادمین ارسال می‌شود.\n\n<b>۳. گزارش روزانه</b> — هر شب <b>۳ ایران</b>\n<code>30 23 * * *</code> (UTC 23:30)\nگزارش پست‌های ارسالی ۲۴ ساعت اخیر + خلاصه هوشمند به ادمین اصلی ارسال می‌شود.</blockquote>\n\n💡 این زمان‌ها در <code>wrangler.toml</code> قابل تغییر هستند.`,
    adblock: `🛡 <b>سیستم ضد تبلیغات</b>\n\n<code>/adblock</code> — مدیریت سیستم ضد تبلیغات\n\n<b>سیستم ۴ لایه‌ای تشخیص:</b>\n<blockquote>• <b>لایه ۱</b>: الگوهای صریح (تخفیف N٪، کد تخفیف، فرصت محدود، لینک joinchat)\n• <b>لایه ۲</b>: امتیازگذاری — ۲+ نشانگر تبلیغاتی (فروش، خرید، رایگان، تضمین) = تبلیغ\n• <b>لایه ۳</b>: لینک‌های مشکوک (bit.ly، دامنه‌های .vip/.xyz/.shop)\n• <b>لایه ۴</b>: مولتی‌فوروارد (۲+ نام کانال در یک پست)</blockquote>\n\n✅ در هر منبع به‌صورت جداگانه قابل روشن/خاموش است.\n📊 آمار مسدودشده‌ها در پنل و با <code>/adblock</code> قابل مشاهده است.`,
  };
  return map[section] || map.main;
}

// ===========================================================================
//  API پنل مدیریت (CORS فعال برای Pages)
// ===========================================================================
async function handleApi(request, env, url) {
  const path = url.pathname.replace('/api/', '');
  const method = request.method;

  // احراز هویت (به‌جز login)
  if (path !== 'login') {
    const auth = await checkAuth(request, env);
    if (!auth.ok) return jsonCred({ error: 'Unauthorized' }, request, 401);
  }

  try {
    let resp;
    switch (path) {
      case 'login':
        if (method === 'POST') resp = await apiLogin(request, env);
        break;
      case 'logout':
        if (method === 'POST') resp = await apiLogout(request, env);
        break;
      case 'sources':
        if (method === 'GET') resp = await apiGetSources(env);
        if (method === 'POST') resp = await apiAddSource(request, env);
        break;
      case 'sources-bulk-delete':
        if (method === 'POST') resp = await apiBulkDelete(request, env);
        break;
      case 'sources-bulk-edit':
        if (method === 'POST') resp = await apiBulkEdit(request, env);
        break;
      case 'admins':
        if (method === 'GET') resp = await apiGetAdmins(env);
        if (method === 'POST') resp = await apiAddAdminApi(request, env);
        break;
      case 'stats':
        if (method === 'GET') resp = await apiGetStats(env);
        break;
      case 'backup':
        if (method === 'GET') resp = await apiBackup(env);
        break;
      case 'restore':
        if (method === 'POST') resp = await apiRestore(request, env);
        break;
      case 'scan':
        if (method === 'POST') resp = await apiScan(request, env);
        break;
      case 'logs':
        if (method === 'GET') resp = await apiGetLogs(request, env, url);
        break;
      case 'admin-activity':
        if (method === 'GET') resp = await apiGetAdminActivity(env, url);
        break;
      case 'admin-permissions':
        if (method === 'GET') resp = await apiGetAdminPermissions(env, url);
        if (method === 'POST') resp = await apiSetAdminPermissions(request, env);
        break;
      case 'ai-pending':
        if (method === 'GET') resp = await apiGetAIPending(env);
        break;
      case 'ai-approve':
        if (method === 'POST') resp = await apiApproveAIKeywords(request, env);
        break;
      case 'ai-apply-manual':
        if (method === 'POST') resp = await apiApplyManualAIKeywords(request, env);
        break;
      case 'ai-reject':
        if (method === 'POST') resp = await apiRejectAIKeywords(request, env);
        break;
      case 'ai-analyze':
        if (method === 'POST') resp = await apiAnalyzeSource(request, env);
        break;
      case 'report':
        if (method === 'GET') resp = await apiGetLastReport(env);
        if (method === 'POST') resp = await apiTriggerReport(env);
        break;
      case 'report-trigger':
        if (method === 'POST') resp = await apiTriggerReport(env);
        break;
      case 'settopic':
        if (method === 'POST') resp = await apiSetTopic(request, env);
        break;
      case 'quarantine':
        if (method === 'GET') resp = await apiGetQuarantine(env, url);
        if (method === 'POST') resp = await apiQuarantineAction(request, env);
        break;
      case 'ad-weights':
        if (method === 'GET') resp = await apiGetAdWeights(env, url);
        if (method === 'POST') resp = await apiAddAdWeight(request, env);
        if (method === 'DELETE') resp = await apiDeleteAdWeight(request, env);
        break;
    }

    // مسیرهای پویا: sources/:id , admins/:id
    if (path.startsWith('sources/')) {
      const id = parseInt(path.split('/')[1], 10);
      if (method === 'PUT') resp = await apiUpdateSource(request, env, id);
      if (method === 'DELETE') resp = await apiDeleteSource(env, id);
    }
    if (path.startsWith('admins/')) {
      const id = path.split('/')[1];
      if (method === 'DELETE') resp = await apiDeleteAdmin(env, id);
    }

    if (!resp) resp = json({ error: 'Not Found' }, 404);

    // ⚠️ مهم: همه پاسخ‌های API باید Origin دقیق را برگردانند (نه '*')
    // چون پنل با credentials: 'include' درخواست می‌فرستد.
    // این تابع هدر CORS پاسخ را اصلاح می‌کند و Set-Cookie را حفظ می‌کند.
    return fixCorsForCreds(resp, request);
  } catch (e) {
    console.error('API error', e);
    return jsonCred({ error: e.message }, request, 500);
  }
}

// هِلپر: بازنویسی هدر CORS روی یک Response موجود برای پشتیبانی credentials
// (نگه‌داشتن Set-Cookie و سایر هدرها، فقط ACAO را با Origin دقیق جایگزین می‌کند)
function fixCorsForCreds(resp, request) {
  const origin = getOrigin(request);
  const newHeaders = new Headers(resp.headers);
  newHeaders.set('Access-Control-Allow-Origin', origin);
  newHeaders.set('Access-Control-Allow-Credentials', 'true');
  newHeaders.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  newHeaders.set('Access-Control-Allow-Headers', 'Content-Type');
  newHeaders.set('Vary', 'Origin');
  return new Response(resp.body, {
    status: resp.status,
    statusText: resp.statusText,
    headers: newHeaders,
  });
}

async function checkAuth(request, env) {
  const cookie = request.headers.get('Cookie') || '';
  const m = cookie.match(/session=([a-f0-9]+)/);
  if (!m) return { ok: false };
  const v = await env.KV.get(`session:${m[1]}`);
  return { ok: !!v, token: m[1] };
}

async function apiLogin(request, env) {
  const { password } = await request.json();
  if (password !== env.PANEL_PASSWORD) return jsonCred({ error: 'رمز اشتباه است' }, request, 401);
  const token = randHex(32);
  await env.KV.put(`session:${token}`, '1', { expirationTtl: SESSION_TTL });
  // بررسی آیا درخواست از HTTPS آمده (Cloudflare Workers معمولاً HTTPS است)
  const isSecure = request.url.startsWith('https://');
  const cookieFlags = [
    'Path=/',
    'HttpOnly',
    `Max-Age=${SESSION_TTL}`,
    // SameSite=None فقط با Secure کار می‌کند — برای cross-site (Pages → Worker)
    ...(isSecure ? ['Secure', 'SameSite=None'] : ['SameSite=Lax']),
  ].join('; ');
  return jsonCred({ ok: true }, request, 200, {
    'Set-Cookie': `session=${token}; ${cookieFlags}`,
  });
}

async function apiLogout(request, env) {
  const auth = await checkAuth(request, env);
  if (auth.token) await env.KV.delete(`session:${auth.token}`);
  return json({ ok: true });
}

async function apiGetSources(env) {
  const res = await env.DB.prepare('SELECT * FROM sources ORDER BY id DESC').all();
  const out = (res.results || []).map(s => ({
    ...s,
    // Deep Classic keywords
    keywords_positive: safeJson(s.keywords_positive, []),
    keywords_negative: safeJson(s.keywords_negative, []),
    // Deep Scoring keywords
    keywords_main: safeJson(s.keywords_main, []),
    keywords_complementary: safeJson(s.keywords_complementary, []),
    keywords_peripheral: safeJson(s.keywords_peripheral, []),
    // pending
    pending_positive: safeJson(s.pending_keywords_positive, []),
    pending_negative: safeJson(s.pending_keywords_negative, []),
    pending_main: safeJson(s.pending_keywords_main, []),
    pending_complementary: safeJson(s.pending_keywords_complementary, []),
    pending_peripheral: safeJson(s.pending_keywords_peripheral, []),
    // viral multi-reaction
    viral_reactions: safeJson(s.viral_reactions, []),
  }));
  return json({ sources: out });
}

// ─── کش ستون‌های جدول sources (برای fallback هوشمند) ───
let _sourceColumns = null;
async function getSourceColumns(env) {
  if (_sourceColumns) return _sourceColumns;
  try {
    const res = await env.DB.prepare('PRAGMA table_info(sources)').all();
    const existing = new Set((res.results || []).map(r => r.name));
    
    // Auto-migrate missing columns so they exist in D1
    const needed = [
      ['deep_scoring', 'INTEGER DEFAULT 0'],
      ['keywords_main', "TEXT DEFAULT '[]'"],
      ['keywords_complementary', "TEXT DEFAULT '[]'"],
      ['keywords_peripheral', "TEXT DEFAULT '[]'"],
      ['pending_keywords_main', "TEXT DEFAULT ''"],
      ['pending_keywords_complementary', "TEXT DEFAULT ''"],
      ['pending_keywords_peripheral', "TEXT DEFAULT ''"],
      ['deep_threshold', 'INTEGER DEFAULT 50'],
      ['viral_reactions', "TEXT DEFAULT '[]'"],
      ['ad_threshold', 'INTEGER DEFAULT 70']
    ];
    for (const [col, def] of needed) {
      if (!existing.has(col)) {
        try {
          await env.DB.prepare(`ALTER TABLE sources ADD COLUMN ${col} ${def}`).run();
          existing.add(col);
        } catch {}
      }
    }
    _sourceColumns = existing;
  } catch {
    _sourceColumns = new Set(['id','channel','target_chat_id','target_topic_id','mode','topic','keywords_positive','keywords_negative','keywords_main','keywords_complementary','keywords_peripheral','every_mode','deep_scoring','deep_threshold','viral_reactions','viral_threshold','block_ads','ad_threshold','active','created_by','created_at']);
  }
  return _sourceColumns;
}

// ─── INSERT هوشمند: فقط ستون‌هایی که وجود دارند ───
async function smartInsertSource(env, data) {
  const cols = await getSourceColumns(env);
  // همه فیلدهای ممکن با مقادیر پیش‌فرض
  const allFields = [
    ['channel', data.channel],
    ['target_chat_id', data.target_chat_id],
    ['target_topic_id', data.target_topic_id || null],
    ['mode', data.mode || 'forward'],
    ['topic', data.topic || ''],
    ['keywords_positive', JSON.stringify(data.keywords_positive || [])],
    ['keywords_negative', JSON.stringify(data.keywords_negative || [])],
    ['keywords_main', JSON.stringify(data.keywords_main || [])],
    ['keywords_complementary', JSON.stringify(data.keywords_complementary || [])],
    ['keywords_peripheral', JSON.stringify(data.keywords_peripheral || [])],
    ['every_mode', data.every_mode ? 1 : 0],
    ['deep_scoring', data.deep_scoring ? 1 : 0],
    ['deep_threshold', data.deep_threshold || 50],
    ['viral_threshold', data.viral_threshold || 0],
    ['viral_reactions', JSON.stringify(data.viral_reactions || [])],
    ['block_ads', data.block_ads === undefined ? 1 : (data.block_ads ? 1 : 0)],
    ['ad_threshold', data.ad_threshold || 70],
    ['active', 1], // literal
    ['created_by', data.created_by || ''],
    ['created_at', data.created_at || Date.now()],
  ];
  // فقط فیلدهایی که ستون آن‌ها وجود دارد
  const present = [];
  const binds = [];
  for (const [col, val] of allFields) {
    if (cols.has(col)) {
      if (col === 'active') continue; // به صورت literal 1
      present.push(col);
      binds.push(val);
    }
  }
  // active را به عنوان literal اضافه کن (اگه ستون وجود دارد)
  const hasActive = cols.has('active');
  const colList = present.join(', ') + (hasActive ? ', active' : '');
  const placeholders = present.map(() => '?').join(', ') + (hasActive ? ', 1' : '');
  const sql = `INSERT INTO sources (${colList}) VALUES (${placeholders})`;
  const result = await env.DB.prepare(sql).bind(...binds).run();
  // کش را پاک کن چون ساختار ممکنه تغییر کنه
  _sourceColumns = null;
  return result;
}

async function apiAddSource(request, env) {
  const b = await request.json();
  const channels = (b.channels || '').split(',').map(s => s.trim()).filter(Boolean);
  for (const ch of channels) {
    try {
      await smartInsertSource(env, {
        channel: ch,
        target_chat_id: b.target_chat_id,
        target_topic_id: b.target_topic_id || null,
        mode: b.mode || 'forward',
        topic: b.topic || '',
        keywords_positive: b.keywords_positive || [],
        keywords_negative: b.keywords_negative || [],
        keywords_main: b.keywords_main || [],
        keywords_complementary: b.keywords_complementary || [],
        keywords_peripheral: b.keywords_peripheral || [],
        every_mode: b.every_mode ? 1 : 0,
        deep_scoring: b.deep_scoring ? 1 : 0,
        deep_threshold: b.deep_threshold || 50,
        viral_threshold: b.viral_threshold || 0,
        viral_reactions: b.viral_reactions || [],
        block_ads: b.block_ads === undefined ? 1 : (b.block_ads ? 1 : 0),
        ad_threshold: b.ad_threshold || 70,
        created_at: Date.now(),
      });
    } catch (e) {
      return json({ error: e.message }, 500);
    }
  }
  return json({ ok: true, count: channels.length });
}

async function apiUpdateSource(request, env, id) {
  const b = await request.json();
  // ⚠️ Patch-based update: فقط فیلدهای ارسال‌شده را تغییر بده
  // این کار باعث می‌شود اگه ستونی وجود نداشت، بقیه ذخیره شوند
  const sets = [];
  const binds = [];
  const tryField = (col, val) => {
    if (val !== undefined && val !== null) {
      sets.push(`${col}=?`);
      binds.push(val);
    }
  };

  if (b.channel !== undefined) tryField('channel', b.channel);
  if (b.target_chat_id !== undefined) tryField('target_chat_id', b.target_chat_id);
  if (b.target_topic_id !== undefined) tryField('target_topic_id', b.target_topic_id || null);
  if (b.mode !== undefined) tryField('mode', b.mode);
  if (b.topic !== undefined) tryField('topic', b.topic || '');
  // Deep Classic keywords
  if (b.keywords_positive !== undefined) tryField('keywords_positive', JSON.stringify(b.keywords_positive || []));
  if (b.keywords_negative !== undefined) tryField('keywords_negative', JSON.stringify(b.keywords_negative || []));
  // Deep Scoring keywords
  if (b.keywords_main !== undefined) tryField('keywords_main', JSON.stringify(b.keywords_main || []));
  if (b.keywords_complementary !== undefined) tryField('keywords_complementary', JSON.stringify(b.keywords_complementary || []));
  if (b.keywords_peripheral !== undefined) tryField('keywords_peripheral', JSON.stringify(b.keywords_peripheral || []));
  if (b.deep_scoring !== undefined) tryField('deep_scoring', b.deep_scoring ? 1 : 0);
  if (b.every_mode !== undefined) tryField('every_mode', b.every_mode ? 1 : 0);
  if (b.deep_threshold !== undefined) tryField('deep_threshold', b.deep_threshold || 50);
  // Viral
  if (b.viral_threshold !== undefined) tryField('viral_threshold', b.viral_threshold || 0);
  if (b.viral_reactions !== undefined) tryField('viral_reactions', JSON.stringify(b.viral_reactions || []));
  // Anti-Ad
  if (b.block_ads !== undefined) tryField('block_ads', b.block_ads ? 1 : 0);
  if (b.ad_threshold !== undefined) tryField('ad_threshold', b.ad_threshold || 70);
  if (b.active !== undefined) tryField('active', b.active ? 1 : 0);

  if (!sets.length) return json({ ok: true, message: 'هیچ فیلدی برای به‌روزرسانی نیست' });

  // سعی کن با همه فیلدها آپدیت کنی — اگه ستونی وجود نداشت، fallback به فیلدهای موجود
  try {
    await env.DB.prepare(`UPDATE sources SET ${sets.join(', ')} WHERE id=?`).bind(...binds, id).run();
  } catch (e) {
    // fallback: اگه بعضی ستون‌ها وجود ندارند، فقط فیلدهای قدیمی را آپدیت کن
    const errMsg = String(e.message || '');
    // تشخیص کدام ستون وجود ندارد
    const missingMatch = errMsg.match(/no such column: (\w+)/i) || errMsg.match(/no column named "(\w+)"/i);
    if (missingMatch) {
      const missing = missingMatch[1];
      const filteredSets = [];
      const filteredBinds = [];
      for (let i = 0; i < sets.length; i++) {
        if (!sets[i].startsWith(missing + '=')) {
          filteredSets.push(sets[i]);
          filteredBinds.push(binds[i]);
        }
      }
      if (filteredSets.length) {
        try {
          await env.DB.prepare(`UPDATE sources SET ${filteredSets.join(', ')} WHERE id=?`).bind(...filteredBinds, id).run();
          return json({ ok: true, warning: `ستون ${missing} در دیتابیس وجود ندارد — بدون آن ذخیره شد. لطفاً migration را اجرا کنید.` });
        } catch (e2) { return json({ error: e2.message }, 500); }
      }
      return json({ error: `ستون ${missing} در دیتابیس وجود ندارد` }, 500);
    }
    return json({ error: errMsg }, 500);
  }
  return json({ ok: true });
}

async function apiDeleteSource(env, id) {
  await deleteSourceCompletely(id, env);
  return json({ ok: true });
}

async function apiBulkDelete(request, env) {
  const { ids } = await request.json();
  for (const id of ids) await deleteSourceCompletely(id, env);
  return json({ ok: true, deleted: ids.length });
}

async function apiBulkEdit(request, env) {
  const {
    ids, mode,
    keywords_positive, keywords_negative,
    keywords_main, keywords_complementary, keywords_peripheral,
    every_mode, deep_threshold,
    viral_threshold, viral_reactions,
    active, block_ads, ad_threshold,
  } = await request.json();
  const sets = []; const binds = [];
  if (mode) { sets.push('mode=?'); binds.push(mode); }
  // Deep Classic
  if (keywords_positive !== undefined) { sets.push('keywords_positive=?'); binds.push(JSON.stringify(keywords_positive || [])); }
  if (keywords_negative !== undefined) { sets.push('keywords_negative=?'); binds.push(JSON.stringify(keywords_negative || [])); }
  // Deep Scoring
  if (keywords_main !== undefined) { sets.push('keywords_main=?'); binds.push(JSON.stringify(keywords_main || [])); }
  if (keywords_complementary !== undefined) { sets.push('keywords_complementary=?'); binds.push(JSON.stringify(keywords_complementary || [])); }
  if (keywords_peripheral !== undefined) { sets.push('keywords_peripheral=?'); binds.push(JSON.stringify(keywords_peripheral || [])); }
  if (every_mode !== undefined) { sets.push('every_mode=?'); binds.push(every_mode ? 1 : 0); }
  if (deep_threshold !== undefined) { sets.push('deep_threshold=?'); binds.push(deep_threshold); }
  // Viral
  if (viral_threshold !== undefined) { sets.push('viral_threshold=?'); binds.push(viral_threshold); }
  if (viral_reactions !== undefined) { sets.push('viral_reactions=?'); binds.push(JSON.stringify(viral_reactions || [])); }
  // Anti-Ad
  if (block_ads !== undefined) { sets.push('block_ads=?'); binds.push(block_ads ? 1 : 0); }
  if (ad_threshold !== undefined) { sets.push('ad_threshold=?'); binds.push(ad_threshold); }
  if (active !== undefined) { sets.push('active=?'); binds.push(active ? 1 : 0); }
  if (!sets.length) return json({ error: 'هیچ فیلدی مشخص نشده' }, 400);
  let updated = 0;
  let warning = null;
  for (const id of ids) {
    try {
      await env.DB.prepare(`UPDATE sources SET ${sets.join(',')} WHERE id=?`).bind(...binds, id).run();
      updated++;
    } catch (e) {
      const errMsg = String(e.message || '');
      const missingMatch = errMsg.match(/no such column: (\w+)/i) || errMsg.match(/no column named "(\w+)"/i);
      if (missingMatch) {
        warning = `ستون ${missingMatch[1]} در دیتابیس وجود ندارد — لطفاً migration را اجرا کنید`;
      } else {
        return json({ error: errMsg }, 500);
      }
    }
  }
  return json({ ok: true, updated, warning });
}

async function apiGetAdmins(env) {
  const res = await listAdmins(env);
  // گرفتن نام ادمین اصلی
  let mainName = '';
  try {
    const mainInfo = await tg('getChat', { chat_id: Number(env.MAIN_ADMIN_ID) }, env);
    if (mainInfo.ok && mainInfo.result) {
      const u = mainInfo.result;
      mainName = [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username || '';
    }
  } catch {}

  // گرفتن نام هر ادمین فرعی
  const admins = [];
  for (const a of res.results || []) {
    let adminName = '';
    try {
      const info = await tg('getChat', { chat_id: Number(a.user_id) }, env);
      if (info.ok && info.result) {
        const u = info.result;
        adminName = [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username || '';
      }
    } catch {}
    admins.push({
      ...a,
      permissions: safeJson(a.permissions, {}),
      display_name: adminName,
    });
  }
  return json({ main: env.MAIN_ADMIN_ID, main_name: mainName, admins });
}

async function apiAddAdminApi(request, env) {
  const { user_id, added_by } = await request.json();
  await addAdmin(user_id, added_by || 'panel', env);
  return json({ ok: true });
}

async function apiDeleteAdmin(env, id) {
  await removeAdmin(id, env);
  return json({ ok: true });
}

async function apiGetStats(env) {
  const now = Date.now();
  const dayAgo = now - 24 * 3600 * 1000;
  const weekAgo = now - 7 * 86400 * 1000;

  // آمار کلی
  const sourcesCount = await env.DB.prepare("SELECT COUNT(*) as c FROM sources").first();
  const sourcesActive = await env.DB.prepare("SELECT COUNT(*) as c FROM sources WHERE active=1").first();
  const sentToday = await env.DB.prepare("SELECT COUNT(*) as c FROM logs WHERE action='sent' AND created_at > ?").bind(dayAgo).first();
  const errorsToday = await env.DB.prepare("SELECT COUNT(*) as c FROM logs WHERE action='error' AND created_at > ?").bind(dayAgo).first();

  // آمار ضد تبلیغات (۲۴ ساعت)
  const adsRes = await env.DB.prepare(
    "SELECT COUNT(*) as c FROM logs WHERE action='skipped' AND (detail LIKE '🚫%' OR detail LIKE '%تبلیغ%') AND created_at > ?"
  ).bind(dayAgo).first();
  const adsBlocked = adsRes?.c || 0;

  // آمار روزانه ۷ روز اخیر
  const daily = await env.DB.prepare(
    `SELECT DATE(created_at/1000,'unixepoch') as date, action, COUNT(*) as c
     FROM logs WHERE created_at > ?
     GROUP BY date, action ORDER BY date`
  ).bind(weekAgo).all();

  // تجمیع روزانه: فقط پست‌های ارسالی
  const dailyAggregated = {};
  for (const row of (daily.results || [])) {
    if (!dailyAggregated[row.date]) dailyAggregated[row.date] = { date: row.date, sent: 0, skipped: 0, errors: 0, scanned: 0 };
    if (row.action === 'sent') dailyAggregated[row.date].sent = row.c;
    else if (row.action === 'skipped') dailyAggregated[row.date].skipped += row.c;
    else if (row.action === 'error') dailyAggregated[row.date].errors += row.c;
    else if (row.action === 'scanned') dailyAggregated[row.date].scanned += row.c;
  }
  const dailyList = Object.values(dailyAggregated).slice(-7);

  // آمار بر اساس action (۷ روز)
  const byAction = await env.DB.prepare(
    "SELECT action, COUNT(*) as c FROM logs WHERE created_at > ? GROUP BY action"
  ).bind(weekAgo).all();
  const byActionObj = {};
  for (const row of (byAction.results || [])) {
    byActionObj[row.action] = row.c;
  }

  return json({
    sources: sourcesActive?.c || 0,
    totalSources: sourcesCount?.c || 0,
    sentToday: sentToday?.c || 0,
    adsBlocked,
    errorsToday: errorsToday?.c || 0,
    daily: dailyList,
    byAction: byActionObj,
  });
}

async function apiBackup(env) {
  // طبق سند: فقط اطلاعات ثابت (sources + ad_weights + quarantine_config)
  // بدون logs، بدون quarantine rows، بدون feedback
  const sources = await env.DB.prepare('SELECT * FROM sources ORDER BY id').all();
  const admins = await listAdmins(env);
  let adWeights = [];
  let quarantineConfig = null;
  try {
    const wRes = await env.DB.prepare('SELECT * FROM ad_weights ORDER BY hits DESC, weight DESC').all();
    adWeights = wRes.results || [];
  } catch {}
  try {
    const qRow = await env.DB.prepare("SELECT value FROM kv_meta WHERE key='quarantine_config'").first();
    if (qRow?.value) quarantineConfig = JSON.parse(qRow.value);
  } catch {}
  return json({
    version: 3,
    exported_at: new Date().toISOString(),
    sources: sources.results,
    ad_weights: adWeights,
    quarantine_config: quarantineConfig,
    admins: admins.results,
  });
}

async function apiRestore(request, env) {
  const data = await request.json();
  let sourcesCount = 0;
  let weightsCount = 0;
  // ⚠️ طبق سند: بازیابی منابع + ad_weights + quarantine_config
  // بدون بازیابی logs (آن‌ها باید دست‌نخورده باقی بمانند)

  try {
    // ۱) بازیابی منابع
    for (const s of (data.sources || [])) {
      try {
        await env.DB.prepare(
          `INSERT OR REPLACE INTO sources (
            id, channel, target_chat_id, target_topic_id, mode, topic,
            keywords_positive, keywords_negative,
            keywords_main, keywords_complementary, keywords_peripheral,
            pending_keywords_positive, pending_keywords_negative,
            pending_keywords_main, pending_keywords_complementary, pending_keywords_peripheral,
            every_mode, deep_threshold,
            viral_threshold, viral_reactions,
            block_ads, ad_threshold,
            active, created_by, created_at
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
        ).bind(
          s.id, s.channel, s.target_chat_id, s.target_topic_id, s.mode, s.topic || '',
          s.keywords_positive || '[]', s.keywords_negative || '[]',
          s.keywords_main || '[]', s.keywords_complementary || '[]', s.keywords_peripheral || '[]',
          s.pending_keywords_positive || '', s.pending_keywords_negative || '',
          s.pending_keywords_main || '', s.pending_keywords_complementary || '', s.pending_keywords_peripheral || '',
          s.every_mode, s.deep_threshold || 50,
          s.viral_threshold || 0, s.viral_reactions || '[]',
          s.block_ads === undefined ? 1 : s.block_ads, s.ad_threshold || 70,
          s.active, s.created_by || '', s.created_at || Date.now()
        ).run();
        sourcesCount++;
      } catch (e) {
        // اگه یک منبع fail شد، بقیه را ادامه بده
        console.log('restore source error:', e.message);
      }
    }

    // ۲) بازیابی ad_weights
    for (const w of (data.ad_weights || [])) {
      try {
        await env.DB.prepare(
          'INSERT OR REPLACE INTO ad_weights (token, type, weight, hits, auto, created_at) VALUES (?,?,?,?,?,?)'
        ).bind(w.token, w.type || 'word', w.weight || 30, w.hits || 0, w.auto || 0, w.created_at || Date.now()).run();
        weightsCount++;
      } catch {}
    }

    // ۳) بازیابی quarantine_config
    if (data.quarantine_config) {
      try {
        await env.DB.prepare("INSERT OR REPLACE INTO kv_meta (key, value) VALUES ('quarantine_config', ?)")
          .bind(JSON.stringify(data.quarantine_config)).run();
      } catch {}
    }

    // ⚠️ طبق سند: «در صورت موفقیت‌آمیز بودن در لاگ سیستم ثبت شود: بازیابی با موفقیت انجام شد همراه با تاریخ و ساعت»
    const nowStr = new Date().toLocaleString('fa-IR', { timeZone: 'Asia/Tehran' });
    await logAction(0, 'restore', `بازیابی با موفقیت انجام شد همراه با تاریخ و ساعت: ${nowStr} (${sourcesCount} منبع + ${weightsCount} وزن)`, env);
    return json({ ok: true, restored: sourcesCount, weights: weightsCount });
  } catch (e) {
    // ⚠️ طبق سند: «در صورت ناموفق بودن در لاگ سیستم ثبت شود: بازیابی ناموفق بود همراه با جزییات و تاریخ و ساعت»
    const nowStr = new Date().toLocaleString('fa-IR', { timeZone: 'Asia/Tehran' });
    await logAction(0, 'restore', `بازیابی ناموفق بود همراه با جزییات و تاریخ و ساعت: ${nowStr} — خطا: ${e.message} — تا الان: ${sourcesCount} منبع + ${weightsCount} وزن`, env);
    return json({ error: e.message, restored: sourcesCount, weights: weightsCount }, 500);
  }
}

async function apiScan(request, env) {
  const { source_id } = await request.json();
  if (source_id) {
    const s = await env.DB.prepare('SELECT * FROM sources WHERE id=?').bind(source_id).first();
    if (!s) return json({ error: 'یافت نشد' }, 404);
    const r = await scanSource(s, env, false);
    return json({ ok: true, ...r });
  }
  // اسکن همه
  const sources = await env.DB.prepare('SELECT * FROM sources WHERE active=1').all();
  let total = 0;
  for (const s of sources.results || []) {
    const r = await scanSource(s, env, false);
    total += r.sent || 0;
  }
  return json({ ok: true, sent: total });
}

// ─── API: لاگ‌های سیستم ───
async function apiGetLogs(request, env, url) {
  const params = url.searchParams;
  const action = params.get('action') || '';
  const sourceId = params.get('source_id') || '';
  const search = params.get('search') || '';
  const limit = Math.min(parseInt(params.get('limit') || '50', 10), 200);
  const page = parseInt(params.get('page') || '0', 10);
  const perPage = limit;
  const off = page * perPage;

  let where = [];
  let binds = [];

  if (action && action !== 'all') {
    where.push('l.action = ?');
    binds.push(action);
  }
  if (sourceId) {
    where.push('l.source_id = ?');
    binds.push(parseInt(sourceId, 10));
  }
  if (search) {
    where.push('(l.detail LIKE ? OR l.post_link LIKE ? OR s.channel LIKE ?)');
    binds.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

  // شمارش کل
  const countRes = await env.DB.prepare(
    `SELECT COUNT(*) as c FROM logs l LEFT JOIN sources s ON l.source_id = s.id ${whereClause}`
  ).bind(...binds).first();
  const total = countRes?.c || 0;

  // گرفتن لاگ‌ها — با fallback اگه ستون‌های جدید وجود ندارند
  let res;
  try {
    res = await env.DB.prepare(
      `SELECT l.*, s.channel, s.mode, s.topic FROM logs l LEFT JOIN sources s ON l.source_id = s.id ${whereClause} ORDER BY l.created_at DESC LIMIT ? OFFSET ?`
    ).bind(...binds, perPage, off).all();
  } catch (e) {
    // fallback: فقط ستون‌های قدیمی logs + ستون‌های sources
    res = await env.DB.prepare(
      `SELECT l.id, l.source_id, l.action, l.detail, l.post_link, l.post_text, l.views, l.created_at, s.channel, s.mode, s.topic FROM logs l LEFT JOIN sources s ON l.source_id = s.id ${whereClause} ORDER BY l.created_at DESC LIMIT ? OFFSET ?`
    ).bind(...binds, perPage, off).all();
  }

  return json({
    logs: res.results || [],
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  });
}

// ─── API: فعالیت ادمین‌ها ───
async function apiGetAdminActivity(env, url) {
  const params = url.searchParams;
  const adminId = params.get('admin_id') || '';
  const page = parseInt(params.get('page') || '0', 10);
  const perPage = 50;
  const off = page * perPage;

  let where = [];
  let binds = [];
  if (adminId) { where.push('admin_id = ?'); binds.push(adminId); }
  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

  const countRes = await env.DB.prepare(`SELECT COUNT(*) as c FROM admin_activity ${whereClause}`).bind(...binds).first();
  const total = countRes?.c || 0;
  const res = await env.DB.prepare(
    `SELECT * FROM admin_activity ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`
  ).bind(...binds, perPage, off).all();

  return json({ activities: res.results || [], total, page, perPage, totalPages: Math.ceil(total / perPage) });
}

// ─── API: دسترسی ادمین‌ها ───
async function apiGetAdminPermissions(env, url) {
  const params = url.searchParams;
  const adminId = params.get('admin_id');
  if (adminId) {
    const perms = await getPermissions(adminId, env);
    return json({ admin_id: adminId, permissions: perms, is_main: String(adminId) === String(env.MAIN_ADMIN_ID) });
  }
  // لیست همه ادمین‌ها با دسترسی‌هایشان
  const res = await listAdmins(env);
  const out = (res.results || []).map(a => ({
    user_id: a.user_id,
    added_by: a.added_by,
    created_at: a.created_at,
    permissions: safeJson(a.permissions, {}),
  }));
  return json({ main: env.MAIN_ADMIN_ID, admins: out });
}

async function apiSetAdminPermissions(request, env) {
  const { admin_id, permissions } = await request.json();
  if (!admin_id) return json({ error: 'admin_id الزامی است' }, 400);
  if (String(admin_id) === String(env.MAIN_ADMIN_ID)) return json({ error: 'نمی‌توان دسترسی ادمین اصلی را تغییر داد' }, 400);
  await setPermissions(admin_id, permissions, env);
  return json({ ok: true });
}
async function apiGetAIPending(env) {
  // گرفتن منابع با هر نوع pending keywords (Deep Classic یا Deep Scoring)
  let res;
  try {
    res = await env.DB.prepare(
      "SELECT id, channel, topic, mode, deep_scoring, pending_keywords_positive, pending_keywords_negative, pending_keywords_main, pending_keywords_complementary, pending_keywords_peripheral FROM sources WHERE (pending_keywords_positive != '' AND pending_keywords_positive IS NOT NULL) OR (pending_keywords_main != '' AND pending_keywords_main IS NOT NULL) ORDER BY id DESC"
    ).all();
  } catch (e) {
    // fallback: ستون‌های قدیمی
    res = await env.DB.prepare(
      "SELECT id, channel, topic, mode, pending_keywords_positive, pending_keywords_negative FROM sources WHERE pending_keywords_positive != '' AND pending_keywords_positive IS NOT NULL ORDER BY id DESC"
    ).all();
  }
  const out = (res.results || []).map(s => ({
    ...s,
    // Deep Classic
    pending_positive: safeJson(s.pending_keywords_positive, []),
    pending_negative: safeJson(s.pending_keywords_negative, []),
    // Deep Scoring
    pending_main: safeJson(s.pending_keywords_main, []),
    pending_complementary: safeJson(s.pending_keywords_complementary, []),
    pending_peripheral: safeJson(s.pending_keywords_peripheral, []),
  }));
  return json({ pending: out });
}

// ─── API: تأیید کلیدواژه‌های AI ───
async function apiApproveAIKeywords(request, env) {
  const { source_id } = await request.json();
  const src = await env.DB.prepare('SELECT * FROM sources WHERE id=?').bind(source_id).first();
  if (!src) return json({ error: 'منبع یافت نشد' }, 404);
  const isScoring = src.deep_scoring == 1;
  if (isScoring) {
    if (!src.pending_keywords_main) return json({ error: 'کلیدواژه pending یافت نشد' }, 400);
    try {
      await env.DB.prepare(
        'UPDATE sources SET keywords_main = ?, keywords_complementary = ?, keywords_peripheral = ?, pending_keywords_main = ?, pending_keywords_complementary = ?, pending_keywords_peripheral = ? WHERE id = ?'
      ).bind(
        src.pending_keywords_main,
        src.pending_keywords_complementary || '[]',
        src.pending_keywords_peripheral || '[]',
        '', '', '',
        source_id
      ).run();
    } catch (e) {
      return json({ error: `ستون‌های Deep Scoring وجود ندارند — migration را اجرا کنید: ${e.message}` }, 500);
    }
  } else {
    if (!src.pending_keywords_positive) return json({ error: 'کلیدواژه pending یافت نشد' }, 400);
    await env.DB.prepare(
      'UPDATE sources SET keywords_positive = ?, keywords_negative = ?, pending_keywords_positive = ?, pending_keywords_negative = ? WHERE id = ?'
    ).bind(
      src.pending_keywords_positive,
      src.pending_keywords_negative || '[]',
      '', '',
      source_id
    ).run();
  }
  await logAction(source_id, 'ai_approve', 'کلیدواژه‌های AI از پنل تأیید شد', env);
  return json({ ok: true });
}

// ─── API: اعمال دستی کلیدواژه‌های انتخاب‌شده از پنل ───
async function apiApplyManualAIKeywords(request, env) {
  const { source_id, mode, positive, negative, main, complementary, peripheral } = await request.json();
  const src = await env.DB.prepare('SELECT * FROM sources WHERE id=?').bind(source_id).first();
  if (!src) return json({ error: 'منبع یافت نشد' }, 404);

  const isScoring = src.deep_scoring == 1;

  if (isScoring) {
    const selectedMain = main || [];
    const selectedComp = complementary || [];
    const selectedPeriph = peripheral || [];
    if (mode === 'add') {
      const currentMain = safeJson(src.keywords_main, []);
      const currentComp = safeJson(src.keywords_complementary, []);
      const currentPeriph = safeJson(src.keywords_peripheral, []);
      const mergedMain = [...new Set([...currentMain, ...selectedMain])];
      const mergedComp = [...new Set([...currentComp, ...selectedComp])];
      const mergedPeriph = [...new Set([...currentPeriph, ...selectedPeriph])];
      try {
        await env.DB.prepare(
          'UPDATE sources SET keywords_main = ?, keywords_complementary = ?, keywords_peripheral = ?, pending_keywords_main = ?, pending_keywords_complementary = ?, pending_keywords_peripheral = ? WHERE id = ?'
        ).bind(JSON.stringify(mergedMain), JSON.stringify(mergedComp), JSON.stringify(mergedPeriph), '', '', '', source_id).run();
      } catch (e) {
        return json({ error: `ستون‌های Deep Scoring وجود ندارند — migration: ${e.message}` }, 500);
      }
      await logAction(source_id, 'ai_approve', `پنل (Scoring): ${selectedMain.length}+${selectedComp.length}+${selectedPeriph.length} اضافه شد`, env);
    } else {
      try {
        await env.DB.prepare(
          'UPDATE sources SET keywords_main = ?, keywords_complementary = ?, keywords_peripheral = ?, pending_keywords_main = ?, pending_keywords_complementary = ?, pending_keywords_peripheral = ? WHERE id = ?'
        ).bind(JSON.stringify(selectedMain), JSON.stringify(selectedComp), JSON.stringify(selectedPeriph), '', '', '', source_id).run();
      } catch (e) {
        return json({ error: `ستون‌های Deep Scoring وجود ندارند — migration: ${e.message}` }, 500);
      }
      await logAction(source_id, 'ai_approve', `پنل (Scoring): ${selectedMain.length}+${selectedComp.length}+${selectedPeriph.length} جایگزین شد`, env);
    }
  } else {
    // Deep Classic
    const selectedPos = positive || [];
    const selectedNeg = negative || [];
    if (mode === 'add') {
      const currentPos = safeJson(src.keywords_positive, []);
      const currentNeg = safeJson(src.keywords_negative, []);
      const mergedPos = [...new Set([...currentPos, ...selectedPos])];
      const mergedNeg = [...new Set([...currentNeg, ...selectedNeg])];
      await env.DB.prepare(
        'UPDATE sources SET keywords_positive = ?, keywords_negative = ?, pending_keywords_positive = ?, pending_keywords_negative = ? WHERE id = ?'
      ).bind(JSON.stringify(mergedPos), JSON.stringify(mergedNeg), '', '', source_id).run();
      await logAction(source_id, 'ai_approve', `پنل (Classic): ${selectedPos.length}+${selectedNeg.length} اضافه شد`, env);
    } else {
      await env.DB.prepare(
        'UPDATE sources SET keywords_positive = ?, keywords_negative = ?, pending_keywords_positive = ?, pending_keywords_negative = ? WHERE id = ?'
      ).bind(JSON.stringify(selectedPos), JSON.stringify(selectedNeg), '', '', source_id).run();
      await logAction(source_id, 'ai_approve', `پنل (Classic): ${selectedPos.length}+${selectedNeg.length} جایگزین شد`, env);
    }
  }
  return json({ ok: true });
}

// ─── API: رد کلیدواژه‌های AI ───
async function apiRejectAIKeywords(request, env) {
  const { source_id } = await request.json();
  // پاک کردن همه فیلدهای pending (هم Classic و هم Scoring)
  try {
    await env.DB.prepare(
      'UPDATE sources SET pending_keywords_positive = ?, pending_keywords_negative = ?, pending_keywords_main = ?, pending_keywords_complementary = ?, pending_keywords_peripheral = ? WHERE id = ?'
    ).bind('', '', '', '', '', source_id).run();
  } catch (e) {
    // fallback: فقط ستون‌های قدیمی
    await env.DB.prepare(
      'UPDATE sources SET pending_keywords_positive = ?, pending_keywords_negative = ? WHERE id = ?'
    ).bind('', '', source_id).run();
  }
  return json({ ok: true });
}

// ─── API: تحلیل دستی AI ───
async function apiAnalyzeSource(request, env) {
  if (!isAIAvailable(env)) return json({ error: 'هوش مصنوعی فعال نیست — GEMINI_API_KEY یا Workers AI binding را اضافه کنید' }, 400);
  const { source_id } = await request.json();
  const src = await env.DB.prepare('SELECT * FROM sources WHERE id=?').bind(source_id).first();
  if (!src) return json({ error: 'منبع یافت نشد' }, 404);
  if (!src.topic) return json({ error: 'موضوع تنظیم نشده — ابتدا با /settopic یا پنل موضوع را تنظیم کنید' }, 400);
  const r = await analyzeSourceWithAI(src, env);
  // پنل انتظار دارد: ok, error, posKeywords, negKeywords (Deep Classic) یا mainKeywords, compKeywords, periphKeywords (Deep Scoring)
  return json({
    ok: r.ok,
    error: r.error,
    // Deep Classic
    posKeywords: r.positive || r.posKeywords || [],
    negKeywords: r.negative || r.negKeywords || [],
    // Deep Scoring
    mainKeywords: r.main || [],
    compKeywords: r.complementary || [],
    periphKeywords: r.peripheral || [],
  });
}

// ─── API: آخرین گزارش روزانه ───
async function apiGetLastReport(env) {
  // پست‌های ارسالی ۲۴ ساعت اخیر
  const since = Date.now() - 24 * 60 * 60 * 1000;
  let res;
  try {
    res = await env.DB.prepare(
      "SELECT l.*, s.channel, s.mode, s.topic FROM logs l JOIN sources s ON l.source_id = s.id WHERE l.action = 'sent' AND l.created_at > ? ORDER BY l.views DESC"
    ).bind(since).all();
  } catch (e) {
    // fallback: ستون‌های قدیمی
    res = await env.DB.prepare(
      "SELECT l.id, l.source_id, l.action, l.detail, l.post_link, l.post_text, l.views, l.created_at, s.channel, s.mode, s.topic FROM logs l JOIN sources s ON l.source_id = s.id WHERE l.action = 'sent' AND l.created_at > ? ORDER BY l.views DESC"
    ).bind(since).all();
  }
  const posts = (res.results || []).map(p => ({
    channel: p.channel,
    mode: p.mode,
    topic: p.topic || 'عمومی',
    link: p.post_link,
    text: (p.post_text || p.detail || '').slice(0, 100),
    views: p.views || 0,
    time: p.created_at,
  }));
  // گروه‌بندی بر اساس موضوع → سپس بر اساس کانال
  const byTopic = {};
  const viral = [];
  for (const p of posts) {
    if (p.mode === 'viral') {
      viral.push(p);
    } else {
      const t = p.topic || 'عمومی';
      if (!byTopic[t]) byTopic[t] = { posts: [], channels: {}, channelCount: 0 };
      byTopic[t].posts.push(p);
      const ch = p.channel || 'نامشخص';
      if (!byTopic[t].channels[ch]) byTopic[t].channels[ch] = 0;
      byTopic[t].channels[ch]++;
    }
  }
  // محاسبه تعداد کانال‌های هر موضوع
  for (const t of Object.keys(byTopic)) {
    byTopic[t].channelCount = Object.keys(byTopic[t].channels).length;
  }
  viral.sort((a, b) => b.views - a.views);
  return json({ total: posts.length, byTopic, viral, since });
}

// ─── API: تولید دستی گزارش ───
async function apiTriggerReport(env) {
  await runDailyReport(env);
  return json({ ok: true, message: 'گزارش به ادمین اصلی ارسال شد' });
}

// ─── API: تنظیم موضوع ───
async function apiSetTopic(request, env) {
  const { source_id, topic } = await request.json();
  if (!source_id || !topic) return json({ error: 'source_id و topic الزامی است' }, 400);
  await env.DB.prepare('UPDATE sources SET topic=? WHERE id=?').bind(topic.trim(), source_id).run();
  return json({ ok: true });
}

// ─── API: لیست قرنطینه ───
async function apiGetQuarantine(env, url) {
  const status = url.searchParams.get('status') || 'pending';
  try {
    const res = await env.DB.prepare('SELECT * FROM quarantine WHERE status=? ORDER BY created_at DESC LIMIT 50').bind(status).all();
    return json({ items: res.results || [] });
  } catch { return json({ items: [] }); }
}

// ─── API: اقدام قرنطینه (تأیید تبلیغ/پاک) ───
async function apiQuarantineAction(request, env) {
  const { id, action } = await request.json();
  if (!id || !action) return json({ error: 'id و action الزامی است' }, 400);
  try {
    const q = await env.DB.prepare('SELECT * FROM quarantine WHERE id=?').bind(id).first();
    if (!q) return json({ error: 'یافت نشد' }, 404);
    if (action === 'ad') {
      await env.DB.prepare("UPDATE quarantine SET status='ad' WHERE id=?").bind(id).run();
      try { await bumpPostWeights(q.post_text || '', env); } catch {}
      return json({ ok: true, action: 'ad' });
    } else if (action === 'clean') {
      await env.DB.prepare("UPDATE quarantine SET status='clean' WHERE id=?").bind(id).run();
      // ارسال به مقصد اصلی
      const src = q.source_id ? await env.DB.prepare('SELECT * FROM sources WHERE id=?').bind(q.source_id).first() : null;
      if (src) {
        const post = { text: q.post_text, link: q.post_link, mediaType: 'text', views: 0, channel: q.channel, datetime: null, isReply: false, replyToText: '', replyToAuthor: '' };
        try { await deliverPost(post, src, { foundKeywords: [], adScore: 0, adVerdict: 'clean' }, env); } catch {}
      }
      return json({ ok: true, action: 'clean' });
    }
    return json({ error: 'action نامعتبر' }, 400);
  } catch (e) { return json({ error: e.message }, 500); }
}

// ─── API: وزن‌های ضد تبلیغات ───
async function apiGetAdWeights(env, url) {
  const limit = parseInt(url.searchParams.get('limit') || '100', 10);
  try {
    const res = await env.DB.prepare('SELECT * FROM ad_weights ORDER BY hits DESC, weight DESC LIMIT ?').bind(limit).all();
    return json({ items: res.results || [] });
  } catch { return json({ items: [] }); }
}

async function apiAddAdWeight(request, env) {
  const { token, type, weight } = await request.json();
  if (!token) return json({ error: 'token الزامی است' }, 400);
  const t = (token || '').toLowerCase().trim();
  const ty = type || 'word';
  const w = Math.max(1, Math.min(50, parseInt(weight, 10) || 30));
  try {
    await env.DB.prepare('INSERT OR REPLACE INTO ad_weights (token, type, weight, hits, auto, created_at) VALUES (?, ?, ?, 0, 0, ?)').bind(t, ty, w, Date.now()).run();
    return json({ ok: true, token: t, weight: w });
  } catch (e) { return json({ error: e.message }, 500); }
}

async function apiDeleteAdWeight(request, env) {
  const { token } = await request.json();
  if (!token) return json({ error: 'token الزامی است' }, 400);
  try {
    await env.DB.prepare('DELETE FROM ad_weights WHERE token=?').bind((token || '').toLowerCase().trim()).run();
    return json({ ok: true });
  } catch (e) { return json({ error: e.message }, 500); }
}

// ===========================================================================
//  توابع پاسخ HTTP
// ===========================================================================

// هِلپر: استخراج Origin از درخواست (برای CORS با credentials)
// ⚠️ وقتی credentials: 'include' استفاده می‌شود، مرورگر اجازه نمی‌دهد
// سرور از '*' استفاده کند — باید دقیقاً Origin درخواست‌کننده را برگرداند.
function getOrigin(request) {
  const origin = request.headers.get('Origin');
  // اگر Origin موجود نبود (مثلاً درخواست same-origin یا غیرمرورگری)، fallback به '*'
  return origin || '*';
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',  // پاسخ‌های بدون cookie — مشکلی نیست
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// پاسخ با CORS کامل + credentials (برای مسیرهایی که cookie سشن می‌فرستند)
function jsonCred(data, request, status = 200, extraHeaders = {}) {
  const origin = getOrigin(request);
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin,  // ⚠️ نه '*' — باید origin دقیق باشد
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true',
      'Vary': 'Origin',  // کش‌گذاری صحیح بر اساس Origin
      ...extraHeaders,
    },
  });
}

function cors(request) {
  const origin = request ? getOrigin(request) : '*';
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true',
      'Vary': 'Origin',
    },
  });
}

function randHex(n) {
  const a = new Uint8Array(n);
  crypto.getRandomValues(a);
  return [...a].map(b => b.toString(16).padStart(2, '0')).join('');
}
