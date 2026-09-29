import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import worker from '../cloudflare-bot/worker.js';

// ============================================================================
//  ROBUST CLOUDFLARE D1 & KV MOCK IMPLEMENTATION
// ============================================================================

class StatementMock {
  constructor(db, sql) {
    this.db = db;
    this.sql = sql;
    this.params = [];
  }

  bind(...params) {
    this.params = params.map(p => (typeof p === 'boolean' ? (p ? 1 : 0) : p));
    return this;
  }

  async run() {
    try {
      const stmt = this.db.prepare(this.sql);
      const info = stmt.run(...this.params);
      return {
        success: true,
        meta: {
          changes: info.changes,
          last_row_id: Number(info.lastInsertRowid),
        },
      };
    } catch (e) {
      throw new Error(`D1 Run Error [${this.sql}]: ${e.message}`);
    }
  }

  async first(col) {
    try {
      const stmt = this.db.prepare(this.sql);
      const row = stmt.get(...this.params);
      if (!row) return null;
      if (col) return row[col];
      return { ...row };
    } catch (e) {
      throw new Error(`D1 First Error [${this.sql}]: ${e.message}`);
    }
  }

  async all() {
    try {
      const stmt = this.db.prepare(this.sql);
      const rows = stmt.all(...this.params);
      return {
        success: true,
        results: rows.map(r => ({ ...r })),
        meta: { changes: 0 },
      };
    } catch (e) {
      throw new Error(`D1 All Error [${this.sql}]: ${e.message}`);
    }
  }

  async raw() {
    const stmt = this.db.prepare(this.sql);
    const rows = stmt.all(...this.params);
    return rows.map(r => Object.values(r));
  }
}

class D1Mock {
  constructor(memDb) {
    this.db = memDb;
  }

  prepare(sql) {
    return new StatementMock(this.db, sql);
  }

  async exec(sql) {
    return this.db.exec(sql);
  }

  async batch(stmts) {
    const res = [];
    for (const s of stmts) {
      res.push(await s.run());
    }
    return res;
  }
}

class KVMock {
  constructor() {
    this.store = new Map();
  }
  async get(key, type = 'text') {
    const val = this.store.get(key);
    if (val === undefined || val === null) return null;
    if (type === 'json') {
      try { return JSON.parse(val); } catch { return null; }
    }
    return String(val);
  }
  async put(key, val, options = {}) {
    this.store.set(key, String(val));
  }
  async delete(key) {
    this.store.delete(key);
  }
}

class MockContext {
  constructor() {
    this.promises = [];
  }
  waitUntil(promise) {
    this.promises.push(Promise.resolve(promise));
  }
  async flush() {
    while (this.promises.length > 0) {
      const pending = this.promises.splice(0);
      await Promise.allSettled(pending);
    }
  }
}

// ============================================================================
//  MOCK TELEGRAM NETWORK INTERCEPTOR
// ============================================================================

const MOCK_CHANNEL_POSTS = {
  technews: [
    {
      msgId: 101,
      text: 'شرکت OpenAI از مدل جدید استدلال هوش مصنوعی خود رونمایی کرد.',
      views: 1200,
      reactions: [{ emoji: '🔥', count: 35 }, { emoji: '👍', count: 80 }],
    },
    {
      msgId: 102,
      text: 'کانال خصوصی سیگنال دهی تضمینی ارز دیجیتال با سود روزانه ۵۰ درصد! عضویت فوری: t.me/+superprofitvip ربات: @cryptovipbot',
      views: 450,
      reactions: [{ emoji: '👎', count: 5 }],
    },
  ],
  varzesh: [
    {
      msgId: 201,
      text: 'پیروزی درخشان تیم فوتبال در مسابقات آسیایی با نتیجه دو بر صفر به پایان رسید.',
      views: 8500,
      reactions: [{ emoji: '🔥', count: 120 }, { emoji: '❤️', count: 65 }],
    },
  ],
  deeptech: [
    {
      msgId: 301,
      text: 'آموزش برنامه‌نویسی پایتون و طراحی سیستم‌های توزیع‌شده برای مهندسان نرم‌افزار.',
      views: 900,
      reactions: [{ emoji: '👏', count: 20 }],
    },
    {
      msgId: 302,
      text: 'فروش ویلا در شمال با شرایط اقساطی بدون بهره و سند تک برگ.',
      views: 300,
      reactions: [],
    },
  ],
};

function generateMockChannelHtml(channel) {
  const posts = MOCK_CHANNEL_POSTS[channel] || [];
  let html = `<!DOCTYPE html><html><body><div class="tgme_channel_info"><div class="tgme_channel_info_header_title">Channel @${channel}</div></div>`;
  for (const p of posts) {
    html += `
      <div class="tgme_widget_message_wrap js-widget_message_wrap" data-post="${channel}/${p.msgId}">
        <div class="tgme_widget_message js-widget_message" data-post="${channel}/${p.msgId}">
          <div class="tgme_widget_message_bubble">
            <div class="tgme_widget_message_text js-message_text">${p.text}</div>
            <div class="tgme_widget_message_footer">
              <span class="tgme_widget_message_views">${p.views}</span>
            </div>
            <div class="tgme_widget_message_reactions">
              ${p.reactions.map(r => `<span class="tgme_reaction"><span class="tgme_reaction_emoji">${r.emoji}</span><span class="tgme_reaction_count">${r.count}</span></span>`).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }
  html += `</body></html>`;
  return html;
}

const telegramApiCalls = [];
let nextMsgId = 1000;

const originalFetch = globalThis.fetch;
globalThis.fetch = async function (input, init = {}) {
  const urlStr = typeof input === 'string' ? input : input.url;

  // Intercept Telegram API calls
  if (urlStr.includes('api.telegram.org')) {
    const parts = urlStr.split('/');
    const method = parts[parts.length - 1];
    let body = {};
    if (init.body) {
      try {
        body = typeof init.body === 'string' ? JSON.parse(init.body) : init.body;
      } catch {
        body = { raw: init.body };
      }
    }
    const callRecord = { method, body, timestamp: Date.now() };
    telegramApiCalls.push(callRecord);

    nextMsgId++;
    return new Response(
      JSON.stringify({
        ok: true,
        result: {
          message_id: nextMsgId,
          chat: { id: body.chat_id || 111222333 },
          date: Math.floor(Date.now() / 1000),
          text: body.text || '',
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Intercept Telegram Channel Scrape
  if (urlStr.includes('t.me/s/')) {
    const match = urlStr.match(/t\.me\/s\/([^/?#]+)/);
    const channel = match ? match[1].toLowerCase() : '';
    const html = generateMockChannelHtml(channel);
    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  // Intercept AI API calls (Gemini)
  if (urlStr.includes('generativelanguage.googleapis.com')) {
    return new Response(
      JSON.stringify({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: '🔥 <b>اخبار برگزیده فناوری</b>\n• <a href="https://t.me/technews/101">رونمایی OpenAI از مدل جدید استدلال هوش مصنوعی</a> - <i>@technews</i>',
                },
              ],
            },
          },
        ],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Fallback to original fetch
  return originalFetch(input, init);
};

// ============================================================================
//  TEST RUNNER SUITE
// ============================================================================

const testResults = {
  telegram: { passed: 0, failed: 0, tests: [] },
  panel: { passed: 0, failed: 0, tests: [] },
  worker: { passed: 0, failed: 0, tests: [] },
};

function recordTest(envName, name, ok, details = '') {
  const result = { name, ok, details };
  testResults[envName].tests.push(result);
  if (ok) testResults[envName].passed++;
  else testResults[envName].failed++;
  console.log(`[${envName.toUpperCase()}] ${ok ? '✅ PASS' : '❌ FAIL'}: ${name} ${details ? '(' + details + ')' : ''}`);
}

async function runSimulator() {
  console.log('===============================================================');
  console.log('🚀 شروع شبیه‌سازی کامل سیستم در ۳ محیط مجزا (تلگرام، پنل، ورکر)');
  console.log('===============================================================\n');

  // ۱. راه‌اندازی دیتابیس D1 و جداول Schema به طور تمیز
  const rawDb = new DatabaseSync(':memory:');
  const d1 = new D1Mock(rawDb);
  const kv = new KVMock();

  const schemaPath = path.resolve('cloudflare-bot/schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
  const cleanSql = schemaSql.split('\n').filter(l => !l.trim().startsWith('--')).join('\n');
  rawDb.exec(cleanSql);

  const MAIN_ADMIN_ID = '111222333';
  const PANEL_PASS = 'TestAdminPass123';
  const env = {
    DB: d1,
    KV: kv,
    BOT_TOKEN: '123456789:ABCdefGHIjklMNOpqrSTUvwxYZ',
    MAIN_ADMIN_ID: MAIN_ADMIN_ID,
    PANEL_USER: 'admin',
    PANEL_PASSWORD: PANEL_PASS,
    SESSION_SECRET: 'session-super-secret-key-32-chars-long!',
    PANEL_URL: 'https://aggregator.test.workers.dev',
    GEMINI_API_KEY: 'test-gemini-api-key',
  };

  // ==========================================================================
  //  محیط ۱: شبیه‌سازی وب‌هوک و تعاملات تلگرام (Telegram Bot Environment)
  // ==========================================================================
  console.log('\n--- شروع تست‌های محیط ۱: ربات تلگرام (Telegram Environment) ---');

  async function postWebhook(update) {
    const ctx = new MockContext();
    const req = new Request('https://aggregator.test.workers.dev/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    });
    const res = await worker.fetch(req, env, ctx);
    await ctx.flush();
    return res;
  }

  // ۱.۱: کاربر ناشناس / غیر ادمین
  {
    telegramApiCalls.length = 0;
    await postWebhook({
      update_id: 1,
      message: {
        message_id: 1,
        from: { id: 999999999, first_name: 'Stranger', is_bot: false },
        chat: { id: 999999999, type: 'private' },
        text: '/start',
      },
    });
    // طبق معماری امنیتی، برای کاربران ناشناس پیامی ارسال نمی‌شود (سکوت امنیتی)
    const ok = telegramApiCalls.length === 0;
    recordTest('telegram', 'دسترسی کاربر غیرادمین مسدود و سکوت امنیتی حفظ می‌شود', ok);
  }

  // ۱.۲: ادمین اصلی /start و نمایش منوی اصلی
  {
    telegramApiCalls.length = 0;
    await postWebhook({
      update_id: 2,
      message: {
        message_id: 2,
        from: { id: Number(MAIN_ADMIN_ID), first_name: 'SuperAdmin', username: 'superadmin', is_bot: false },
        chat: { id: Number(MAIN_ADMIN_ID), type: 'private' },
        text: '/start',
      },
    });
    const sendCalls = telegramApiCalls.filter(c => c.method === 'sendMessage');
    const lastSend = sendCalls[sendCalls.length - 1];
    const ok = lastSend && lastSend.body.text.includes('ربات تجمیع‌کننده محتوا') && lastSend.body.reply_markup;
    recordTest('telegram', 'ادمین اصلی پیام خوش‌آمد و منوی آغازین را دریافت می‌کند', ok);
  }

  // ۱.۳: دستور /help
  {
    telegramApiCalls.length = 0;
    await postWebhook({
      update_id: 3,
      message: {
        message_id: 3,
        from: { id: Number(MAIN_ADMIN_ID), is_bot: false },
        chat: { id: Number(MAIN_ADMIN_ID), type: 'private' },
        text: '/help',
      },
    });
    const sendCalls = telegramApiCalls.filter(c => c.method === 'sendMessage');
    const lastSend = sendCalls[sendCalls.length - 1];
    const ok = lastSend && lastSend.body.text.includes('راهنمای ربات');
    recordTest('telegram', 'دستور /help راهنمای کامل را نمایش می‌دهد', ok);
  }

  // ۱.۴: دستور /stats
  {
    telegramApiCalls.length = 0;
    await postWebhook({
      update_id: 4,
      message: {
        message_id: 4,
        from: { id: Number(MAIN_ADMIN_ID), is_bot: false },
        chat: { id: Number(MAIN_ADMIN_ID), type: 'private' },
        text: '/stats',
      },
    });
    const sendCalls = telegramApiCalls.filter(c => c.method === 'sendMessage');
    const lastSend = sendCalls[sendCalls.length - 1];
    const ok = lastSend && lastSend.body.text.includes('آمار کلی');
    recordTest('telegram', 'دستور /stats آمار سیستم را نمایش می‌دهد', ok);
  }

  // ۱.۵: دستور /addsource و ویزارد افزودن منبع در تلگرام
  {
    telegramApiCalls.length = 0;
    // مرحله اول: /addsource
    await postWebhook({
      update_id: 5,
      message: {
        message_id: 5,
        from: { id: Number(MAIN_ADMIN_ID), is_bot: false },
        chat: { id: Number(MAIN_ADMIN_ID), type: 'private' },
        text: '/addsource',
      },
    });
    const step1Calls = telegramApiCalls.filter(c => c.method === 'sendMessage');
    const step1 = step1Calls[step1Calls.length - 1];
    const step1Ok = step1 && step1.body.text.includes('آیدی کانال');

    // مرحله دوم: وارد کردن کانال @technews
    await postWebhook({
      update_id: 6,
      message: {
        message_id: 6,
        from: { id: Number(MAIN_ADMIN_ID), is_bot: false },
        chat: { id: Number(MAIN_ADMIN_ID), type: 'private' },
        text: '@technews',
      },
    });
    const step2Calls = telegramApiCalls.filter(c => c.method === 'sendMessage');
    const step2 = step2Calls[step2Calls.length - 1];
    const step2Ok = step2 && step2.body.text.includes('حالت اسکن را انتخاب کنید');

    // مرحله سوم: کلیک روی دکمه شیشه‌ای انتخاب حالت (mode:forward)
    await postWebhook({
      update_id: 7,
      callback_query: {
        id: 'cb_mode',
        from: { id: Number(MAIN_ADMIN_ID), is_bot: false },
        message: { message_id: 1005, chat: { id: Number(MAIN_ADMIN_ID) } },
        data: 'mode:forward',
      },
    });
    const step3Calls = telegramApiCalls.filter(c => c.method === 'sendMessage');
    const step3 = step3Calls[step3Calls.length - 1];
    const step3Ok = step3 && step3.body.text.includes('موضوع');

    // مرحله چهارم: ارسال موضوع منبع (فناوری)
    await postWebhook({
      update_id: 8,
      message: {
        message_id: 8,
        from: { id: Number(MAIN_ADMIN_ID), is_bot: false },
        chat: { id: Number(MAIN_ADMIN_ID), type: 'private' },
        text: 'فناوری',
      },
    });
    const step4Calls = telegramApiCalls.filter(c => c.method === 'sendMessage');
    const step4 = step4Calls[step4Calls.length - 1];
    const step4Ok = step4 && step4.body.text.includes('منبع افزوده شد');

    const addedSource = await d1.prepare('SELECT * FROM sources WHERE channel=?').bind('technews').first();
    const ok = step1Ok && step2Ok && step3Ok && step4Ok && !!addedSource;
    recordTest('telegram', 'ویزارد افزودن منبع (/addsource) منبع را کامل در دیتابیس ثبت کرد', ok, `شناسه: ${addedSource?.id}, کانال: ${addedSource?.channel}`);
  }

  // ۱.۵.۱: دستور /editsource در تلگرام
  {
    telegramApiCalls.length = 0;
    await postWebhook({
      update_id: 85,
      message: {
        message_id: 85,
        from: { id: Number(MAIN_ADMIN_ID), is_bot: false },
        chat: { id: Number(MAIN_ADMIN_ID), type: 'private' },
        text: '/editsource',
      },
    });
    const editSend = telegramApiCalls.find(c => c.method === 'sendMessage' && c.body.text.includes('آیدی منبع'));
    const ok = !!editSend;
    recordTest('telegram', 'دستور /editsource با درخواست شناسه منبع پاسخ می‌دهد', ok);
  }

  // ۱.۶: کلیک دکمه Callback: لیست منابع (menu:sources)
  {
    telegramApiCalls.length = 0;
    await postWebhook({
      update_id: 9,
      callback_query: {
        id: 'cb_sources',
        from: { id: Number(MAIN_ADMIN_ID), is_bot: false },
        message: { message_id: 200, chat: { id: Number(MAIN_ADMIN_ID) } },
        data: 'menu:sources',
      },
    });
    const ok = telegramApiCalls.some(c => c.method === 'editMessageText' || c.method === 'sendMessage');
    recordTest('telegram', 'کال‌بک منوی منابع (menu:sources) با لیست منابع پاسخ می‌دهد', ok);
  }

  // ۱.۷: گزارش تبلیغ با کلیک روی دکمه report_ad
  {
    telegramApiCalls.length = 0;
    await postWebhook({
      update_id: 10,
      callback_query: {
        id: 'cb_report',
        from: { id: Number(MAIN_ADMIN_ID), is_bot: false },
        message: { message_id: 205, chat: { id: Number(MAIN_ADMIN_ID) } },
        data: 'report_ad:1:101',
      },
    });
    const hasAnswered = telegramApiCalls.some(c => c.method === 'answerCallbackQuery');
    recordTest('telegram', 'دکمه گزارش تبلیغ (report_ad) پاسخ مناسب می‌دهد', hasAnswered);
  }

  // ۱.۸: تست دستور /balancad (روی ریپلای پیام)
  {
    telegramApiCalls.length = 0;
    await postWebhook({
      update_id: 11,
      message: {
        message_id: 11,
        from: { id: Number(MAIN_ADMIN_ID), is_bot: false },
        chat: { id: Number(MAIN_ADMIN_ID), type: 'private' },
        text: '/balancad',
        reply_to_message: {
          message_id: 10,
          text: 'سیگنال دهی ارز دیجیتال با سود روزانه',
        },
      },
    });
    const sendCalls = telegramApiCalls.filter(c => c.method === 'sendMessage');
    const lastSend = sendCalls[sendCalls.length - 1];
    const ok = lastSend && (lastSend.body.text.includes('متعادل‌سازی') || lastSend.body.text.includes('کاهش یافت') || lastSend.body.text.includes('وزن'));
    recordTest('telegram', 'دستور /balancad جدول وزن‌های ضد تبلیغات را بازتنظیم می‌کند', ok);
  }

  // ==========================================================================
  //  محیط ۲: شبیه‌سازی پنل وب و APIها (Web Panel & API Environment)
  // ==========================================================================
  console.log('\n--- شروع تست‌های محیط ۲: پنل مدیریت تحت وب (Web Panel API) ---');

  async function apiFetch(path, options = {}) {
    const ctx = new MockContext();
    const url = `https://aggregator.test.workers.dev/api/${path}`;
    const req = new Request(url, options);
    const res = await worker.fetch(req, env, ctx);
    await ctx.flush();
    return res;
  }

  let sessionCookie = '';

  // ۲.۱: درخواست بدون احراز هویت باید ۴۰۱ رد شود
  {
    const res = await apiFetch('sources');
    const ok = res.status === 401;
    recordTest('panel', 'دسترسی به منابع بدون لاگین مسدود است (401)', ok, `Status: ${res.status}`);
  }

  // ۲.۲: ورود با رمز اشتباه
  {
    const res = await apiFetch('login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'WrongPassword' }),
    });
    const ok = res.status === 401;
    recordTest('panel', 'ورود با رمز عبور اشتباه رد می‌شود', ok);
  }

  // ۲.۳: ورود موفق با رمز عبور صحیح و دریافت کوکی سشن
  {
    const res = await apiFetch('login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: PANEL_PASS }),
    });
    const setCookie = res.headers.get('Set-Cookie');
    if (setCookie) {
      sessionCookie = setCookie.split(';')[0];
    }
    const data = await res.json();
    const ok = res.status === 200 && data.ok === true && !!sessionCookie;
    recordTest('panel', 'ورود موفق به پنل و ایجاد کوکی سشن معتبر', ok, sessionCookie.slice(0, 25) + '...');
  }

  // ۲.۴: دریافت لیست منابع از طریق API با کوکی سشن
  let sourceIdFromPanel = null;
  {
    const res = await apiFetch('sources', {
      headers: { Cookie: sessionCookie },
    });
    const data = await res.json();
    const ok = res.status === 200 && Array.isArray(data.sources);
    recordTest('panel', 'دریافت لیست منابع از پنل وب (/api/sources)', ok, `تعداد: ${data.sources?.length}`);
  }

  // ۲.۵: افزودن منبع جدید از طریق پنل وب (حالت Viral با چند ری‌اکشن)
  {
    const res = await apiFetch('sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({
        channel: 'varzesh',
        target_chat_id: '-1001122334455',
        mode: 'viral',
        topic: 'ورزش',
        viral_reactions: [{ emoji: '🔥', threshold: 50 }, { emoji: '❤️', threshold: 20 }],
        viral_threshold: 1000,
        block_ads: 1,
      }),
    });
    const data = await res.json();
    sourceIdFromPanel = data.id;
    const ok = res.status === 200 && data.ok === true && !!sourceIdFromPanel;
    recordTest('panel', 'افزودن منبع وایرال با چند ری‌اکشن از طریق پنل وب', ok, `ID: ${sourceIdFromPanel}`);
  }

  // ۲.۵.۱: پیشنهاد هوشمند آستانه ری‌اکشن بر مبنای پست‌های روز قبل (/api/viral-suggest)
  {
    const res = await apiFetch('viral-suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({
        channel: 'varzesh',
        emojis: ['🔥', '❤️'],
      }),
    });
    const data = await res.json();
    const ok = res.status === 200 && data.ok === true && Array.isArray(data.suggestions) && data.suggestions.length >= 2;
    recordTest('panel', 'پیشنهاد آستانه ری‌اکشن بر مبنای پست‌های روز قبل (/api/viral-suggest)', ok, `پیشنهاد 🔥: ${data.suggestions?.[0]?.recommended}، مجموع: ${data.total_suggestion}`);
  }

  // ۲.۶: افزودن منبع با حالت Deep Scoring از طریق پنل وب
  let deepSourceId = null;
  {
    const res = await apiFetch('sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({
        channel: 'deeptech',
        target_chat_id: '-1001122334455',
        mode: 'deep',
        topic: 'فناوری',
        deep_scoring: 1,
        deep_threshold: 50,
        keywords_main: ['برنامه‌نویسی', 'پایتون', 'نرم‌افزار'],
        keywords_complementary: ['آموزش', 'سیستم'],
        keywords_peripheral: ['ویلا', 'فروش'],
        block_ads: 1,
      }),
    });
    const data = await res.json();
    deepSourceId = data.id;
    const ok = res.status === 200 && data.ok === true && !!deepSourceId;
    recordTest('panel', 'افزودن منبع Deep Scoring با کلیدواژه‌های چندسطحی', ok, `ID: ${deepSourceId}`);
  }

  // ۲.۷: تست API مدیریت وزن‌های ضد تبلیغات (/api/ad-weights)
  {
    // افزودن وزن دستی
    const addRes = await apiFetch('ad-weights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({ token: 'ارز دیجیتال', type: 'word', weight: 35 }),
    });
    const addData = await addRes.json();
    const addOk = addRes.status === 200 && addData.ok === true;

    // دریافت لیست وزن‌ها
    const listRes = await apiFetch('ad-weights', {
      headers: { Cookie: sessionCookie },
    });
    const listData = await listRes.json();
    const item = listData.items?.find(i => i.token === 'ارز دیجیتال');
    const listOk = !!item && item.weight === 35;

    // حذف وزن دستی
    const delRes = await apiFetch('ad-weights', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({ token: 'ارز دیجیتال' }),
    });
    const delData = await delRes.json();
    const delOk = delRes.status === 200 && delData.ok === true;

    const ok = addOk && listOk && delOk;
    recordTest('panel', 'مدیریت وزن‌های پویا ضد تبلیغات در پنل (افزودن، واکشی، حذف)', ok);
  }

  // ۲.۸: تست بکاپ و بازیابی (/api/backup و /api/restore)
  {
    const bRes = await apiFetch('backup', { headers: { Cookie: sessionCookie } });
    const backupData = await bRes.json();
    const backupOk = bRes.status === 200 && Array.isArray(backupData.sources) && backupData.sources.length >= 2;

    const rRes = await apiFetch('restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify(backupData),
    });
    const restoreData = await rRes.json();
    const restoreOk = rRes.status === 200 && restoreData.ok === true && restoreData.restored >= 2;

    const ok = backupOk && restoreOk;
    recordTest('panel', 'پشتیبان‌گیری کامل و بازیابی دیتابیس از طریق پنل وب', ok, `تعداد منبع بازیابی‌شده: ${restoreData?.restored}`);
  }

  // ۲.۹: تست تغییر وضعیت پذیرش کلیدواژه هوش مصنوعی (ai_keywords_enabled)
  {
    const putRes = await apiFetch(`sources/${deepSourceId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({ ai_keywords_enabled: 0 }),
    });
    const putData = await putRes.json();
    const putOk = putRes.status === 200 && putData.ok === true;

    const getRes = await apiFetch('sources', { headers: { Cookie: sessionCookie } });
    const getData = await getRes.json();
    const updatedSource = getData.sources?.find(s => s.id === deepSourceId);
    const ok = putOk && updatedSource && updatedSource.ai_keywords_enabled === 0;
    recordTest('panel', 'تغییر وضعیت پذیرش و پیشنهاد هوش مصنوعی (ai_keywords_enabled = 0)', ok, `وضعیت منبع: ${updatedSource?.ai_keywords_enabled}`);
  }

  // ۲.۱۰: خروج از پنل (/api/logout)
  {
    const res = await apiFetch('logout', {
      method: 'POST',
      headers: { Cookie: sessionCookie },
    });
    const ok = res.status === 200;
    recordTest('panel', 'خروج موفق از پنل کاربری (/api/logout)', ok);
  }

  // ==========================================================================
  //  محیط ۳: شبیه‌سازی هسته پردازش، اسکرپ، وایرال و ضد تبلیغ (Worker Engine)
  // ==========================================================================
  console.log('\n--- شروع تست‌های محیط ۳: ورکر و موتور پردازش (Worker Core Pipeline) ---');

  // ۳.۱: تست موتور امتیازدهی ضد تبلیغات (Anti-Ad Engine)
  {
    // افزودن یک توکن یادگیری پویا به جدول ad_weights
    await d1.prepare("INSERT OR REPLACE INTO ad_weights (token, type, weight, hits, auto, created_at) VALUES ('سود روزانه', 'word', 30, 1, 1, ?)").bind(Date.now()).run();

    telegramApiCalls.length = 0;

    // اجرای اسکن روی منابع
    const ctx = new MockContext();
    await worker.scheduled({ cron: '*/2 * * * *' }, env, ctx);
    await ctx.flush();

    // بررسی اینکه پست اسپم به عنوان تبلیغ شناخته شده و مسدود یا ثبت شده
    const adLogs = await d1.prepare("SELECT * FROM logs WHERE action='skipped' AND detail LIKE '%تبلیغ%'").all();
    const sentLogs = await d1.prepare("SELECT * FROM logs WHERE action='sent'").all();

    const ok = sentLogs.results.length >= 1 && adLogs.results.length >= 1;
    recordTest(
      'worker',
      'موتور ضد تبلیغ: پست سالم ارسال شد و پست تبلیغاتی مسدود/علامت‌گذاری شد',
      ok,
      `ارسالی: ${sentLogs.results.length}، مسدودی تبلیغ: ${adLogs.results.length}`
    );
  }

  // ۳.۲: تست موتور وایرال با رهگیری رشد ری‌اکشن (Viral Growth & Multi-Reaction Engine)
  {
    telegramApiCalls.length = 0;

    // اسکن دور اول: ثبت اولیه در جدول رهگیری viral_tracking (عدم ارسال زودهنگام پست بدون اثبات رشد)
    const ctx1 = new MockContext();
    await worker.scheduled({ cron: '*/2 * * * *' }, env, ctx1);
    await ctx1.flush();

    const trackBefore = await d1.prepare("SELECT * FROM viral_tracking WHERE data_post='varzesh/201'").first();
    const trackingStarted = trackBefore && trackBefore.status === 'tracking' && trackBefore.check_count === 1;

    // شبیه‌سازی رشد ری‌اکشن‌ها در بررسی بعدی
    MOCK_CHANNEL_POSTS.varzesh[0].reactions = [{ emoji: '🔥', count: 180 }, { emoji: '❤️', count: 95 }];

    // بازنشانی اندیس اسکن به منبع ورزش (index 1)
    await d1.prepare("UPDATE kv_meta SET value='1' WHERE key='scan_index'").run();

    // اسکن دور دوم: تشخیص رشد متوالی و عبور از آستانه → ارسال پست
    const ctx2 = new MockContext();
    await worker.scheduled({ cron: '*/2 * * * *' }, env, ctx2);
    await ctx2.flush();

    const viralLogs = await d1.prepare("SELECT * FROM logs WHERE source_id=? AND action='sent'").bind(sourceIdFromPanel).all();
    const trackAfter = await d1.prepare("SELECT * FROM viral_tracking WHERE data_post='varzesh/201'").first();
    const ok = trackingStarted && viralLogs.results.length >= 1 && trackAfter?.growth_observed === 1 && trackAfter?.status === 'sent';
    recordTest(
      'worker',
      'موتور وایرال هوشمند: رهگیری رشد در بررسی‌های متوالی و ارسال با عبور از آستانه (🔥 و ❤️)',
      ok,
      `تعداد پست ارسالی: ${viralLogs.results.length}، رشد ثبت‌شده: ${trackAfter?.growth_observed}`
    );
  }

  // ۳.۳: تست ضد تکرار (Deduplication Engine)
  {
    // اجازه می‌دهیم منبع سوم (deeptech) هم در دور خود پردازش شود تا تمام ۳ منبع یک دور کامل اسکن شده باشند
    const ctx1 = new MockContext();
    await worker.scheduled({ cron: '*/2 * * * *' }, env, ctx1);
    await ctx1.flush();

    // اکنون همه منابع یک‌بار اسکن شده‌اند. تعداد ارسالی‌ها را یادداشت می‌کنیم:
    const sentBefore = (await d1.prepare("SELECT COUNT(*) as c FROM logs WHERE action='sent'").first()).c;

    // یک دور کامل مجدد (هر ۳ منبع) را شبیه‌سازی می‌کنیم:
    for (let r = 0; r < 3; r++) {
      const ctx = new MockContext();
      await worker.scheduled({ cron: '*/2 * * * *' }, env, ctx);
      await ctx.flush();
    }

    const sentAfter = (await d1.prepare("SELECT COUNT(*) as c FROM logs WHERE action='sent'").first()).c;
    const ok = sentBefore === sentAfter;
    recordTest('worker', 'سیستم ضدتکرار (Deduplication) از ارسال مجدد پست‌های دیده شده جلوگیری می‌کند', ok, `ارسال‌ها پیش از دور دوم: ${sentBefore}، پس از دور دوم: ${sentAfter}`);
  }

  // ۳.۴: تست تولید گزارش روزانه (Daily Report Generator)
  {
    telegramApiCalls.length = 0;
    // ثبت لاگ‌های ارسال ساختگی برای موضوعات مختلف در ۲۴ ساعت گذشته
    const now = Date.now();
    await d1.prepare(`
      INSERT INTO logs (source_id, action, detail, post_link, post_text, views, ad_score, created_at)
      VALUES 
      (1, 'sent', 'ارسال شد', 'https://t.me/technews/101', 'رونمایی از مدل جدید استدلال هوش مصنوعی با عملکرد فوق العاده', 1200, 0, ?),
      (2, 'sent', 'ارسال شد', 'https://t.me/varzesh/201', 'پیروزی درخشان تیم فوتبال در مسابقات آسیایی', 8500, 0, ?)
    `).bind(now - 10000, now - 5000).run();

    // فراخوانی مستقیم اجرای گزارش روزانه با کرون
    const ctx = new MockContext();
    await worker.scheduled({ cron: '30 23 * * *' }, env, ctx);
    await ctx.flush();

    const reportMsg = telegramApiCalls.find(c => c.body && c.body.text && c.body.text.includes('گزارش روزانه'));
    const ok = reportMsg && reportMsg.body.text.includes('موضوع') && reportMsg.body.text.includes('href=');
    recordTest(
      'worker',
      'تولید و ارسال گزارش روزانه با ساختار عنوان لینک‌شده به ادمین',
      !!ok,
      reportMsg ? 'پیام گزارش با موفقیت ساخته و به تلگرام ارسال شد' : 'پیام گزارش ارسال نشد'
    );
  }

  // ==========================================================================
  //  خلاصه نهایی نتایج تست‌ها
  // ==========================================================================
  console.log('\n===============================================================');
  console.log('📊 خلاصه نتایج ارزیابی شبیه‌ساز در هر ۳ محیط:');
  console.log('===============================================================');

  for (const [envName, stats] of Object.entries(testResults)) {
    const total = stats.passed + stats.failed;
    const rate = total ? Math.round((stats.passed / total) * 100) : 0;
    const statusIcon = stats.failed === 0 ? '🟢' : '🔴';
    console.log(`${statusIcon} محیط ${envName.toUpperCase()}: ${stats.passed}/${total} پاس شد (${rate}%)`);
    if (stats.failed > 0) {
      console.log(`   ❌ موارد ناموفق:`);
      for (const t of stats.tests.filter(x => !x.ok)) {
        console.log(`      - ${t.name}: ${t.details}`);
      }
    }
  }

  const allPassed =
    testResults.telegram.failed === 0 &&
    testResults.panel.failed === 0 &&
    testResults.worker.failed === 0;

  console.log(`\nنتیجه کلی شبیه‌سازی: ${allPassed ? '✅ کلیه تست‌ها با موفقیت ۱۰۰٪ پاس شدند.' : '⚠️ برخی از بخش‌ها نیاز به بررسی دارند.'}`);
}

runSimulator().catch(err => {
  console.error('Fatal Simulation Error:', err);
});
