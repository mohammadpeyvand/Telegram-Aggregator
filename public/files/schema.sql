-- ============================================================================
--  Telegram Aggregator Bot — D1 Database Schema (v4 — سند معماری جدید)
--  اجرا در Cloudflare D1:
--    wrangler d1 execute aggregator --file=./schema.sql
-- ============================================================================
--
--  تغییرات v4 نسبت به v3:
--    ۱) تفکیک کلیدواژه‌های Deep Classic (positive/negative) از Deep Scoring (main/complementary/peripheral)
--    ۲) پشتیبانی از چند ری‌اکشن در Viral Mode (هر ری‌اکشن آستانه مستقل — همه باید عبور کنند)
--    ۳) جدول ad_weights برای وزن‌های پویای کلمات/لینک‌ها/ایموجی‌ها/دامنه‌ها
--    ۴) جدول quarantine با وضعیت pending/clean/ad/ai_reviewed
--    ۵) جدول ai_suggestions + audit_log + feedback
--    ۶) جدول ai_responses برای ثبت پاسخ خام AI (معتبر یا نامعتبر)
--    ۷) ستون log_ttl_enabled و auto-cleanup لاگ‌های قدیمی‌تر از ۲ هفته
--    ۸) decision_breakdown در جدول logs برای ذخیره امتیازدهی بخش‌به‌بخش
-- ============================================================================

-- جدول منابع (Sources)
CREATE TABLE IF NOT EXISTS sources (
  id                       INTEGER PRIMARY KEY AUTOINCREMENT,
  channel                  TEXT    NOT NULL,
  target_chat_id           TEXT    NOT NULL,
  target_topic_id          TEXT,

  -- حالت اسکن: forward | viral | deep
  mode                     TEXT    NOT NULL DEFAULT 'forward',

  -- موضوع منبع (برای AI — برای گرفتن کلیدواژه بهتر)
  topic                    TEXT    DEFAULT '',

  -- ─── کلیدواژه‌های Deep Classic (مثبت‌کننده / منفی‌کننده) ───
  keywords_positive        TEXT    DEFAULT '[]',   -- JSON array — کلیدواژه مثبت‌کننده
  keywords_negative        TEXT    DEFAULT '[]',   -- JSON array — کلیدواژه منفی‌کننده

  -- ─── کلیدواژه‌های Deep Scoring (اصلی / مکمل / پیرامونی) ───
  keywords_main            TEXT    DEFAULT '[]',   -- JSON array — کلیدواژه اصلی (+۴۰)
  keywords_complementary   TEXT    DEFAULT '[]',   -- JSON array — کلیدواژه مکمل (+۱۵)
  keywords_peripheral      TEXT    DEFAULT '[]',   -- JSON array — کلیدواژه پیرامونی (-۲۰ تا -۴۰)

  -- ─── pending: پیشنهادهای AI در انتظار تأیید ادمین ───
  pending_keywords_positive    TEXT DEFAULT '',  -- برای Deep Classic
  pending_keywords_negative    TEXT DEFAULT '',  -- برای Deep Classic
  pending_keywords_main        TEXT DEFAULT '',  -- برای Deep Scoring
  pending_keywords_complementary TEXT DEFAULT '',-- برای Deep Scoring
  pending_keywords_peripheral  TEXT DEFAULT '', -- برای Deep Scoring

  -- ─── Deep Classic: AND/OR ───
  every_mode               INTEGER DEFAULT 0,  -- 0 = OR (حداقل یکی)، ۱ = AND (همه)
  -- ─── نوع Deep: ۰ = Classic، ۱ = Scoring ───
  deep_scoring             INTEGER DEFAULT 0,

  -- ─── Deep Scoring: آستانه امتیاز ───
  deep_threshold           INTEGER DEFAULT 50, -- حداقل امتیاز برای ارسال

  -- ─── Viral Mode: آستانه‌های چند ری‌اکشن ───
  --  فرمت JSON: [{"emoji":"🔥","threshold":100},{"emoji":"❤️","threshold":50}]
  --  اگه خالی باشد → مجموع همه ری‌اکشن‌ها >= viral_threshold
  viral_reactions          TEXT    DEFAULT '[]',  -- JSON array از {emoji, threshold}
  viral_threshold          INTEGER DEFAULT 1000,   -- fallback وقتی viral_reactions خالی است

  -- ─── سیستم ضد تبلیغات ───
  block_ads                INTEGER DEFAULT 1,    -- ۱=روشن، ۰=خاموش
  ad_threshold             INTEGER DEFAULT 70,    -- آستانه امتیاز تبلیغاتی

  active                   INTEGER DEFAULT 1,
  created_by               TEXT    DEFAULT '',   -- آیدی عددی ادمین که منبع را اضافه کرده
  created_at               INTEGER
);

CREATE INDEX IF NOT EXISTS idx_sources_active ON sources(active);
CREATE INDEX IF NOT EXISTS idx_sources_mode   ON sources(mode);
CREATE INDEX IF NOT EXISTS idx_sources_topic  ON sources(topic);

-- جدول ادمین‌های فرعی
CREATE TABLE IF NOT EXISTS admins (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      TEXT    UNIQUE NOT NULL,
  added_by     TEXT,
  permissions  TEXT    DEFAULT '{}',   -- JSON: {addsource, editsource, ...}
  created_at   INTEGER
);

-- جدول فعالیت ادمین‌ها
CREATE TABLE IF NOT EXISTS admin_activity (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id    TEXT    NOT NULL,
  action      TEXT    NOT NULL,
  detail      TEXT,
  source_id   INTEGER,
  created_at  INTEGER
);

CREATE INDEX IF NOT EXISTS idx_activity_admin   ON admin_activity(admin_id);
CREATE INDEX IF NOT EXISTS idx_activity_created ON admin_activity(created_at);

-- جدول لاگ‌ها
--  action: scanned | sent | skipped | error | decision | ai_analyze | ai_approve | ai_raw
--  detail: توضیح کوتاه (مثلاً "ارسال شد — Deep Scoring — امتیاز: ۸۲")
--  breakdown: JSON با جزئیات بخش‌به‌بخش امتیازدهی (Deep Scoring/Anti-Ad)
CREATE TABLE IF NOT EXISTS logs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id   INTEGER,
  action      TEXT,
  detail      TEXT,
  breakdown   TEXT,         -- JSON: {main_kw:'+40', comp_kw:'+15', ...}
  post_link   TEXT,
  post_text   TEXT,         -- خلاصه متن پست
  views       INTEGER DEFAULT 0,
  reactions   TEXT,         -- JSON: [{emoji, count, threshold}] — برای Viral Mode
  ad_score    INTEGER DEFAULT 0,
  ad_verdict  TEXT,         -- block | quarantine | clean
  ai_provider TEXT,         -- gemini-3.8-flash | @cf/meta/llama-3.3-70b...
  ai_raw      TEXT,         -- پاسخ خام AI (اگه نامعتبر باشد، برای دیباگ)
  created_at  INTEGER
);

CREATE INDEX IF NOT EXISTS idx_logs_action   ON logs(action);
CREATE INDEX IF NOT EXISTS idx_logs_source   ON logs(source_id);
CREATE INDEX IF NOT EXISTS idx_logs_created  ON logs(created_at);

-- جدول هش ضدتکراری — TTL ۷ روز (پاکسازی خودکار در cleanupOldHashes)
CREATE TABLE IF NOT EXISTS dedup (
  hash        TEXT    PRIMARY KEY,
  source_id   INTEGER,
  created_at  INTEGER
);

CREATE INDEX IF NOT EXISTS idx_dedup_created ON dedup(created_at);

-- جدول آخرین پست دیده‌شده هر منبع
CREATE TABLE IF NOT EXISTS lastpost (
  source_id   INTEGER PRIMARY KEY,
  msg_id      INTEGER
);

-- جدول متادیتا (scan_index, ai_scan_index, quarantine_config, ...)
CREATE TABLE IF NOT EXISTS kv_meta (
  key   TEXT PRIMARY KEY,
  value TEXT
);

-- ============================================================================
--  سیستم ضد تبلیغات — وزن‌های پویا (بخش ۶ سند معماری)
-- ============================================================================
-- type: word | link | emoji | bot_id | domain | pattern
-- weight: 1-50 (مثبت — امتیاز تبلیغاتی)
-- hits: تعداد دفعاتی که این توکن دیده شده (برای آمار پنل)
-- auto: 1 = تولید‌شده توسط AI، 0 = دستی توسط ادمین
CREATE TABLE IF NOT EXISTS ad_weights (
  token       TEXT    PRIMARY KEY,
  type        TEXT    DEFAULT 'word',
  weight      INTEGER DEFAULT 30,
  hits        INTEGER DEFAULT 0,
  auto        INTEGER DEFAULT 0,
  created_at  INTEGER
);

CREATE INDEX IF NOT EXISTS idx_adweights_type   ON ad_weights(type);
CREATE INDEX IF NOT EXISTS idx_adweights_hits   ON ad_weights(hits DESC);

-- ============================================================================
--  سیستم قرنطینه (بخش ۶ سند معماری)
-- ============================================================================
-- status: pending (منتظر بررسی) | clean (تأیید پاک) | ad (تأیید تبلیغ) | ai_reviewed (تحلیل AI)
CREATE TABLE IF NOT EXISTS quarantine (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id   INTEGER,
  post_link   TEXT,
  post_text   TEXT,
  post_msg_id INTEGER,
  channel     TEXT,
  score       INTEGER DEFAULT 0,
  verdict     TEXT,         -- quarantine | block
  reason      TEXT,         -- امتیازدهی بخش‌به‌بخش (متن)
  ai_analysis TEXT,         -- پاسخ خام AI
  status      TEXT DEFAULT 'pending',
  reviewed_by TEXT,
  reviewed_at INTEGER,
  created_at  INTEGER
);

CREATE INDEX IF NOT EXISTS idx_quar_status   ON quarantine(status);
CREATE INDEX IF NOT EXISTS idx_quar_channel ON quarantine(channel);
CREATE INDEX IF NOT EXISTS idx_quar_created ON quarantine(created_at);

-- ============================================================================
--  سیستم AI Suggestion Pipeline (بخش‌های ۲۳-۲۶ سند معماری)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_suggestions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id   INTEGER,
  type        TEXT,         -- add_keyword | remove_keyword | change_weight | negative_keyword
  keyword     TEXT,
  category    TEXT,         -- main | complementary | peripheral | positive | negative
  weight      INTEGER,
  reason      TEXT,
  status      TEXT DEFAULT 'pending',  -- pending | approved | rejected
  reviewed_by TEXT,
  created_at  INTEGER,
  reviewed_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_ai_sugg_status ON ai_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_ai_sugg_source ON ai_suggestions(source_id);

-- جدول Feedback (گزارش کاربران)
CREATE TABLE IF NOT EXISTS feedback (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id   INTEGER,
  post_link   TEXT,
  post_text   TEXT,
  feedback_type TEXT,       -- WRONG_SEND | WRONG_REJECT | MISSED_AD
  from_id     TEXT,
  ai_analyzed INTEGER DEFAULT 0,
  suggestion_id INTEGER,
  created_at  INTEGER
);

CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback(created_at);

-- جدول Audit Log
CREATE TABLE IF NOT EXISTS audit_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name  TEXT,         -- ad_weights | sources | ai_suggestions
  action      TEXT,         -- weight_changed | keyword_added | suggestion_approved
  token       TEXT,
  old_value   TEXT,
  new_value   TEXT,
  admin_id    TEXT,
  reason      TEXT,
  created_at  INTEGER
);

CREATE INDEX IF NOT EXISTS idx_audit_table ON audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);

-- ============================================================================
--  Migration (برای کاربرانی که نسخه v3 را نصب کرده‌اند):
--  این دستورات را دستی اجرا کنید تا ستون‌های جدید اضافه شوند:
-- ============================================================================
-- ALTER TABLE sources ADD COLUMN keywords_main TEXT DEFAULT '[]';
-- ALTER TABLE sources ADD COLUMN keywords_complementary TEXT DEFAULT '[]';
-- ALTER TABLE sources ADD COLUMN keywords_peripheral TEXT DEFAULT '[]';
-- ALTER TABLE sources ADD COLUMN pending_keywords_main TEXT DEFAULT '';
-- ALTER TABLE sources ADD COLUMN pending_keywords_complementary TEXT DEFAULT '';
-- ALTER TABLE sources ADD COLUMN pending_keywords_peripheral TEXT DEFAULT '';
-- ALTER TABLE sources ADD COLUMN deep_scoring INTEGER DEFAULT 0;
-- ALTER TABLE sources ADD COLUMN deep_threshold INTEGER DEFAULT 50;
-- ALTER TABLE sources ADD COLUMN viral_reactions TEXT DEFAULT '[]';
-- ALTER TABLE sources ADD COLUMN ad_threshold INTEGER DEFAULT 70;
-- ALTER TABLE logs ADD COLUMN breakdown TEXT;
-- ALTER TABLE logs ADD COLUMN reactions TEXT;
-- ALTER TABLE logs ADD COLUMN ad_score INTEGER DEFAULT 0;
-- ALTER TABLE logs ADD COLUMN ad_verdict TEXT;
-- ALTER TABLE logs ADD COLUMN ai_provider TEXT;
-- ALTER TABLE logs ADD COLUMN ai_raw TEXT;
-- CREATE TABLE IF NOT EXISTS ad_weights (token TEXT PRIMARY KEY, type TEXT DEFAULT 'word', weight INTEGER DEFAULT 30, hits INTEGER DEFAULT 0, auto INTEGER DEFAULT 0, created_at INTEGER);
-- CREATE INDEX IF NOT EXISTS idx_adweights_type ON ad_weights(type);
-- CREATE INDEX IF NOT EXISTS idx_adweights_hits ON ad_weights(hits DESC);
-- CREATE TABLE IF NOT EXISTS quarantine (id INTEGER PRIMARY KEY AUTOINCREMENT, source_id INTEGER, post_link TEXT, post_text TEXT, post_msg_id INTEGER, channel TEXT, score INTEGER DEFAULT 0, verdict TEXT, reason TEXT, ai_analysis TEXT, status TEXT DEFAULT 'pending', reviewed_by TEXT, reviewed_at INTEGER, created_at INTEGER);
-- CREATE INDEX IF NOT EXISTS idx_quar_status ON quarantine(status);
-- CREATE INDEX IF NOT EXISTS idx_quar_channel ON quarantine(channel);
-- CREATE INDEX IF NOT EXISTS idx_quar_created ON quarantine(created_at);
-- CREATE TABLE IF NOT EXISTS ai_suggestions (id INTEGER PRIMARY KEY AUTOINCREMENT, source_id INTEGER, type TEXT, keyword TEXT, category TEXT, weight INTEGER, reason TEXT, status TEXT DEFAULT 'pending', reviewed_by TEXT, created_at INTEGER, reviewed_at INTEGER);
-- CREATE INDEX IF NOT EXISTS idx_ai_sugg_status ON ai_suggestions(status);
-- CREATE INDEX IF NOT EXISTS idx_ai_sugg_source ON ai_suggestions(source_id);
-- CREATE TABLE IF NOT EXISTS feedback (id INTEGER PRIMARY KEY AUTOINCREMENT, source_id INTEGER, post_link TEXT, post_text TEXT, feedback_type TEXT, from_id TEXT, ai_analyzed INTEGER DEFAULT 0, suggestion_id INTEGER, created_at INTEGER);
-- CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(feedback_type);
-- CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback(created_at);
-- CREATE TABLE IF NOT EXISTS audit_log (id INTEGER PRIMARY KEY AUTOINCREMENT, table_name TEXT, action TEXT, token TEXT, old_value TEXT, new_value TEXT, admin_id TEXT, reason TEXT, created_at INTEGER);
-- CREATE INDEX IF NOT EXISTS idx_audit_table ON audit_log(table_name);
-- CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);
-- ============================================================================
