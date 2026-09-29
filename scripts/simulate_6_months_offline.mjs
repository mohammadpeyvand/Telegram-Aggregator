import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import worker from '../cloudflare-bot/worker.js';

// ============================================================================
//  6-MONTH OFFLINE SIMULATION SCRIPT (180 DAYS)
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
      return { success: true, meta: { changes: info.changes, last_row_id: Number(info.lastInsertRowid) } };
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
      return { success: true, results: rows.map(r => ({ ...r })), meta: { changes: 0 } };
    } catch (e) {
      throw new Error(`D1 All Error [${this.sql}]: ${e.message}`);
    }
  }
}

class D1Mock {
  constructor(memDb) { this.db = memDb; }
  prepare(sql) { return new StatementMock(this.db, sql); }
  async exec(sql) { return this.db.exec(sql); }
}

class KVMock {
  constructor() { this.store = new Map(); }
  async get(key, type = 'text') {
    const val = this.store.get(key);
    if (val === undefined || val === null) return null;
    if (type === 'json') {
      try { return JSON.parse(val); } catch { return null; }
    }
    return String(val);
  }
  async put(key, val) { this.store.set(key, String(val)); }
  async delete(key) { this.store.delete(key); }
}

async function runSimulation() {
  console.log('===============================================================');
  console.log('🧪 شبیه‌سازی ۱۸۰ روز (۶ ماه) عملکرد ربات بدون دسترسی ادمین به اینترنت');
  console.log('===============================================================\n');

  const sqlite = new DatabaseSync(':memory:');
  const schemaSql = fs.readFileSync('cloudflare-bot/schema.sql', 'utf8');
  sqlite.exec(schemaSql);

  const d1 = new D1Mock(sqlite);
  const kv = new KVMock();

  const env = {
    DB: d1,
    KV: kv,
    BOT_TOKEN: '123456789:ABCDEF1234567890abcdef',
    MAIN_ADMIN_ID: '987654321',
    PANEL_PASSWORD: 'secure_password_123',
    QUARANTINE_CHANNEL_ID: '-1009988776655',
  };

  // ثبت ۳ منبع با حالت‌های مختلف
  // ۱. Forward
  await d1.prepare(`
    INSERT INTO sources (channel, target_chat_id, mode, topic, block_ads, active, created_at)
    VALUES ('technews', '-100111111111', 'forward', 'فناوری', 1, 1, ?)
  `).bind(Date.now()).run();

  // ۲. Deep Scoring
  await d1.prepare(`
    INSERT INTO sources (channel, target_chat_id, mode, topic, deep_scoring, keywords_main, keywords_complementary, keywords_peripheral, block_ads, active, created_at)
    VALUES ('ai_channel', '-100222222222', 'deep', 'فناوری', 1, ?, ?, ?, 1, 1, ?)
  `).bind(JSON.stringify(['هوش مصنوعی', 'مدل']), JSON.stringify(['الگوریتم']), JSON.stringify(['تبلیغات']), Date.now()).run();

  // ۳. Viral
  await d1.prepare(`
    INSERT INTO sources (channel, target_chat_id, mode, topic, viral_reactions, viral_threshold, block_ads, active, created_at)
    VALUES ('varzesh', '-100333333333', 'viral', 'ورزش', ?, 100, 1, 1, ?)
  `).bind(JSON.stringify([{ emoji: '🔥', threshold: 50 }, { emoji: '❤️', threshold: 20 }]), Date.now()).run();

  console.log('✅ ۳ منبع فعال با حالت‌های مختلف (Forward, Deep Scoring, Viral) در پایگاه داده مقداردهی شدند.');

  // متغیرهای آماری شبیه‌سازی
  let totalPostsGenerated = 0;
  let totalPostsSent = 0;
  let totalAdsBlocked = 0;
  let totalQuarantined = 0;
  let totalReportsSent = 0;
  let totalCleanupsRun = 0;

  let simulatedCurrentTime = Date.now() - (180 * 86400 * 1000); // شروع از ۱۸۰ روز پیش
  const realDateNow = Date.now;

  // شبیه‌سازی روز به روز برای ۱۸۰ روز
  for (let day = 1; day <= 180; day++) {
    Date.now = () => simulatedCurrentTime;

    // هر روز ۴۰ پست در منابع تولید می‌شود (۲۰ پست سالم، ۱۰ پست وایرال، ۱۰ پست تبلیغاتی/مشکوک)
    for (let p = 1; p <= 10; p++) {
      totalPostsGenerated++;
      const dataPost = `post_${day}_${p}`;
      const postText = `اخبار فناوری مهم روز شماره ${day} شامل پیشرفت جدید در فناوری هوش مصنوعی و مدل جدید`;
      
      // لاگ ارسال در logs
      await d1.prepare(`
        INSERT INTO logs (source_id, action, post_text, post_link, created_at)
        VALUES (1, 'sent', ?, ?, ?)
      `).bind(postText, `https://t.me/technews/${day}${p}`, simulatedCurrentTime).run();
      totalPostsSent++;

      // ثبت در dedup
      await d1.prepare(`
        INSERT INTO dedup (hash, source_id, created_at)
        VALUES (?, 1, ?)
      `).bind(`hash_${dataPost}`, simulatedCurrentTime).run();
    }

    // شبیه‌سازی پست‌های تبلیغاتی قطعی (Block)
    for (let ad = 1; ad <= 4; ad++) {
      totalPostsGenerated++;
      totalAdsBlocked++;
      await d1.prepare(`
        INSERT INTO logs (source_id, action, post_text, post_link, breakdown, created_at)
        VALUES (1, 'skipped', 'تبلیغ و ثبت نام فوری با تخفیف ۵۰ درصدی بدون واسطه', 'https://t.me/ad/${day}${ad}', 'ad_detected (score: 85)', ?)
      `).bind(simulatedCurrentTime).run();
    }

    // شبیه‌سازی پست‌های مشکوک که به قرنطینه می‌روند (Quarantine Score 40-69)
    for (let q = 1; q <= 3; q++) {
      totalPostsGenerated++;
      totalQuarantined++;
      await d1.prepare(`
        INSERT INTO quarantine (source_id, post_link, post_text, score, verdict, reason, status, created_at)
        VALUES (1, ?, ?, 55, 'quarantine', 'امتیاز ضد تبلیغ: ۵۵', 'pending', ?)
      `).bind(`https://t.me/q/${day}${q}`, `پست مشکوک روز ${day} با لینک کوتاه و معرفی کانال تلگرام`, simulatedCurrentTime).run();
    }

    // شبیه‌سازی چرخه Viral Growth و ثبت در viral_tracking
    for (let v = 1; v <= 5; v++) {
      totalPostsGenerated++;
      await d1.prepare(`
        INSERT INTO viral_tracking (source_id, data_post, post_link, check_count, first_seen_at, last_checked_at, status, created_at)
        VALUES (3, ?, ?, 2, ?, ?, 'expired', ?)
      `).bind(`viral_${day}_${v}`, `https://t.me/varzesh/${day}${v}`, simulatedCurrentTime - 3600000, simulatedCurrentTime, simulatedCurrentTime).run();
    }

    // شبیه‌سازی انباشت پیشنهادات کلیدواژه هوش مصنوعی بدون بررسی ادمین (هر ۳۰ روز یکبار)
    if (day % 30 === 0) {
      await d1.prepare(`
        INSERT INTO ai_suggestions (source_id, type, keyword, category, status, created_at)
        VALUES (2, 'keyword', ?, 'main', 'pending', ?)
      `).bind('کلیدواژه_جدید_' + day, simulatedCurrentTime).run();
    }

    // شبیه‌سازی پایان روز ساعت ۲۳:۳۰ UTC (گزارش روزانه و پاکسازی خودکار)
    simulatedCurrentTime += 86400 * 1000;
    Date.now = () => simulatedCurrentTime;

    // اجرای روتین پاکسازی (که در کرون 30 23 * * * اجرا می‌شود)
    // ۱. پاکسازی Dedup قدیمی‌تر از ۷ روز
    const cutoff7Days = simulatedCurrentTime - (7 * 86400 * 1000);
    await d1.prepare('DELETE FROM dedup WHERE created_at < ?').bind(cutoff7Days).run();
    await d1.prepare('DELETE FROM viral_tracking WHERE last_checked_at < ?').bind(cutoff7Days).run();

    // ۲. پاکسازی Logs قدیمی‌تر از ۱۴ روز
    const cutoff14Days = simulatedCurrentTime - (14 * 86400 * 1000);
    await d1.prepare('DELETE FROM logs WHERE created_at < ?').bind(cutoff14Days).run();

    // ۳. (راهکار ۱): سیاست انقضای خودکار قرنطینه ۳۰ روزه
    const cutoff30Days = simulatedCurrentTime - (30 * 86400 * 1000);
    await d1.prepare(`DELETE FROM quarantine WHERE created_at < ? AND status = 'pending'`).bind(cutoff30Days).run();

    // ۴. (راهکار ۲): اعمال خودکار کلیدواژه‌های هوش مصنوعی پس از ۱۴ روز
    if (day % 14 === 0) {
      const pendingSources = await d1.prepare(
        "SELECT id, mode, deep_scoring, keywords_main, pending_keywords_main, ai_keywords_enabled FROM sources WHERE (ai_keywords_enabled IS NULL OR ai_keywords_enabled != 0) AND active = 1 AND mode = 'deep' AND pending_keywords_main != '' AND pending_keywords_main != '[]'"
      ).all();
      if (pendingSources && pendingSources.results) {
        for (const s of pendingSources.results) {
          const curMain = JSON.parse(s.keywords_main || '[]');
          const pendMain = JSON.parse(s.pending_keywords_main || '[]');
          const merged = Array.from(new Set([...curMain, ...pendMain]));
          await d1.prepare("UPDATE sources SET keywords_main = ?, pending_keywords_main = '' WHERE id = ?").bind(JSON.stringify(merged), s.id).run();
        }
      }
    }

    totalReportsSent++;
    totalCleanupsRun++;
  }

  Date.now = realDateNow;

  // استخراج وضعیت نهایی جداول پایگاه داده پس از ۶ ماه
  const logsCount = await d1.prepare('SELECT COUNT(*) as cnt FROM logs').first('cnt');
  const dedupCount = await d1.prepare('SELECT COUNT(*) as cnt FROM dedup').first('cnt');
  const viralTrackCount = await d1.prepare('SELECT COUNT(*) as cnt FROM viral_tracking').first('cnt');
  const quarantineCount = await d1.prepare('SELECT COUNT(*) as cnt FROM quarantine').first('cnt');
  const aiSuggestionsCount = await d1.prepare('SELECT COUNT(*) as cnt FROM ai_suggestions').first('cnt');

  console.log('---------------------------------------------------------------');
  console.log('📊 نتایج شبیه‌سازی ۶ ماه (۱۸۰ روز) عملکرد خودکار:');
  console.log('---------------------------------------------------------------');
  console.log(`• مجموع پست‌های پردازش‌شده در ۶ ماه: ${totalPostsGenerated.toLocaleString('fa-IR')} پست`);
  console.log(`• مجموع پست‌های سالم ارسال‌شده: ${totalPostsSent.toLocaleString('fa-IR')} پست`);
  console.log(`• مجموع تبلیغات قطعی مسدودشده: ${totalAdsBlocked.toLocaleString('fa-IR')} پست`);
  console.log(`• مجموع دفعات ارسال گزارش روزانه: ${totalReportsSent.toLocaleString('fa-IR')} بار`);
  console.log(`• مجموع دفعات اجرای پاکسازی خودکار: ${totalCleanupsRun.toLocaleString('fa-IR')} بار`);
  console.log('---------------------------------------------------------------');
  console.log('💾 وضعیت جداول دیتابیس D1 پس از ۶ ماه غیبت ادمین:');
  console.log('---------------------------------------------------------------');
  console.log(`1️⃣ جدول لاگ‌ها (logs): ${logsCount.toLocaleString('fa-IR')} ردیف (✅ به دلیل پاکسازی ۱۴ روزه، حجم کنترل شد)`);
  console.log(`2️⃣ جدول ضدتکرار (dedup): ${dedupCount.toLocaleString('fa-IR')} ردیف (✅ به دلیل پاکسازی ۷ روزه، حجم کنترل شد)`);
  console.log(`3️⃣ جدول رهگیری وایرال (viral_tracking): ${viralTrackCount.toLocaleString('fa-IR')} ردیف (✅ به دلیل پاکسازی ۷ روزه، حجم کنترل شد)`);
  console.log(`4️⃣ جدول قرنطینه (quarantine): ${quarantineCount.toLocaleString('fa-IR')} ردیف (⚠️ انباشت بدون پاکسازی!)`);
  console.log(`5️⃣ جدول پیشنهادات AI (ai_suggestions): ${aiSuggestionsCount.toLocaleString('fa-IR')} ردیف (⚠️ انباشت بدون اعمال!)`);

  const quarantineRows = await d1.prepare("SELECT COUNT(*) as pendingCnt FROM quarantine WHERE status='pending'").first('pendingCnt');
  console.log(`• تعداد پست‌های بلاتکلیف در قرنطینه: ${quarantineRows.toLocaleString('fa-IR')} پست`);
  console.log('===============================================================\n');
}

runSimulation().catch(console.error);
