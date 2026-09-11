export const MIGRATION_SQL = `-- ============================================================================
--  Telegram Aggregator Bot — D1 Database Migration Script
--  برای کاربرانی که از قبل دیتابیس D1 دارند و می‌خواهند بدون از دست رفتن اطلاعات،
--  ساختار دیتابیس را به آخرین نسخه (v4 + اصلاحات جدید) ارتقا دهند.
--
--  نحوه اجرا در داشبورد کلودفلر:
--  1. وارد Cloudflare Dashboard شوید.
--  2. به بخش Workers & Pages -> D1 SQL Database بروید و دیتابیس خود را انتخاب کنید.
--  3. وارد تب Console شوید.
--  4. دستورات زیر را کپی کرده و در کنسول اجرا (Execute) کنید.
-- ============================================================================

-- ─── ۱. اضافه کردن ستون‌های جدید به جدول sources ───
ALTER TABLE sources ADD COLUMN keywords_main TEXT DEFAULT '[]';
ALTER TABLE sources ADD COLUMN keywords_complementary TEXT DEFAULT '[]';
ALTER TABLE sources ADD COLUMN keywords_peripheral TEXT DEFAULT '[]';
ALTER TABLE sources ADD COLUMN pending_keywords_main TEXT DEFAULT '';
ALTER TABLE sources ADD COLUMN pending_keywords_complementary TEXT DEFAULT '';
ALTER TABLE sources ADD COLUMN pending_keywords_peripheral TEXT DEFAULT '';
ALTER TABLE sources ADD COLUMN deep_scoring INTEGER DEFAULT 0;
ALTER TABLE sources ADD COLUMN deep_threshold INTEGER DEFAULT 50;
ALTER TABLE sources ADD COLUMN viral_reactions TEXT DEFAULT '[]';
ALTER TABLE sources ADD COLUMN ad_threshold INTEGER DEFAULT 70;

-- ─── ۲. اضافه کردن ستون‌های جدید به جدول logs ───
ALTER TABLE logs ADD COLUMN breakdown TEXT;
ALTER TABLE logs ADD COLUMN reactions TEXT;
ALTER TABLE logs ADD COLUMN ad_score INTEGER DEFAULT 0;
ALTER TABLE logs ADD COLUMN ad_verdict TEXT;
ALTER TABLE logs ADD COLUMN ai_provider TEXT;
ALTER TABLE logs ADD COLUMN ai_raw TEXT;

-- ─── ۳. ایجاد جدول ad_weights (سیستم وزن‌های پویای ضدتبلیغات) ───
CREATE TABLE IF NOT EXISTS ad_weights (
  token       TEXT PRIMARY KEY,
  type        TEXT DEFAULT 'word',
  weight      INTEGER DEFAULT 30,
  hits        INTEGER DEFAULT 0,
  auto        INTEGER DEFAULT 0,
  created_at  INTEGER
);
CREATE INDEX IF NOT EXISTS idx_adweights_type ON ad_weights(type);
CREATE INDEX IF NOT EXISTS idx_adweights_hits ON ad_weights(hits DESC);

-- ─── ۴. ایجاد جدول quarantine (سیستم قرنطینه پست‌های مشکوک) ───
CREATE TABLE IF NOT EXISTS quarantine (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id   INTEGER,
  post_link   TEXT,
  post_text   TEXT,
  post_msg_id INTEGER,
  channel     TEXT,
  score       INTEGER DEFAULT 0,
  verdict     TEXT,
  reason      TEXT,
  ai_analysis TEXT,
  status      TEXT DEFAULT 'pending',
  reviewed_by TEXT,
  reviewed_at INTEGER,
  created_at  INTEGER
);
CREATE INDEX IF NOT EXISTS idx_quar_status   ON quarantine(status);
CREATE INDEX IF NOT EXISTS idx_quar_channel  ON quarantine(channel);
CREATE INDEX IF NOT EXISTS idx_quar_created  ON quarantine(created_at);

-- ─── ۵. ایجاد جدول ai_suggestions (پیشنهادهای هوش مصنوعی) ───
CREATE TABLE IF NOT EXISTS ai_suggestions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id   INTEGER,
  type        TEXT,
  keyword     TEXT,
  category    TEXT,
  weight      INTEGER,
  reason      TEXT,
  status      TEXT DEFAULT 'pending',
  reviewed_by TEXT,
  created_at  INTEGER,
  reviewed_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_ai_sugg_status ON ai_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_ai_sugg_source ON ai_suggestions(source_id);

-- ─── ۶. ایجاد جدول feedback (گزارش بازخورد کاربران به ربات) ───
CREATE TABLE IF NOT EXISTS feedback (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id     INTEGER,
  post_link     TEXT,
  post_text     TEXT,
  feedback_type TEXT,
  from_id       TEXT,
  ai_analyzed   INTEGER DEFAULT 0,
  suggestion_id INTEGER,
  created_at    INTEGER
);
CREATE INDEX IF NOT EXISTS idx_feedback_type    ON feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback(created_at);

-- ─── ۷. ایجاد جدول audit_log (تاریخچه تغییرات سیستم) ───
CREATE TABLE IF NOT EXISTS audit_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name  TEXT,
  action      TEXT,
  token       TEXT,
  old_value   TEXT,
  new_value   TEXT,
  admin_id    TEXT,
  reason      TEXT,
  created_at  INTEGER
);
CREATE INDEX IF NOT EXISTS idx_audit_table   ON audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);
`;
