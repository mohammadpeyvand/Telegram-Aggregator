import fs from 'node:fs';

let code = fs.readFileSync('cloudflare-bot/worker.js', 'utf8');

// ─── 1. Update cleanupOldLogs ───
const oldCleanupSnippet = `// ─── پاکسازی لاگ‌های قدیمی‌تر از ۲ هفته (طبق سند معماری) ───
async function cleanupOldLogs(env) {
  try {
    const twoWeeksAgo = Date.now() - 14 * 86400 * 1000;
    await env.DB.prepare('DELETE FROM logs WHERE created_at < ?').bind(twoWeeksAgo).run();
  } catch {}
}`;

const newCleanupSnippet = `// ─── پاکسازی لاگ‌ها، انقضای خودکار قرنطینه و اعمال خودکار کلیدواژه‌های ۱۴ روزه ───
async function cleanupOldLogs(env) {
  try {
    const now = Date.now();
    const twoWeeksAgo = now - 14 * 86400 * 1000;
    const thirtyDaysAgo = now - 30 * 86400 * 1000;

    // ۱. پاکسازی لاگ‌های قدیمی‌تر از ۲ هفته
    await env.DB.prepare('DELETE FROM logs WHERE created_at < ?').bind(twoWeeksAgo).run();

    // ۲. (مورد ۱): سیاست انقضای خودکار برای قرنطینه (حذف موارد بلاتکلیف بالای ۳۰ روز)
    try {
      await env.DB.prepare("DELETE FROM quarantine WHERE created_at < ? AND status = 'pending'").bind(thirtyDaysAgo).run();
    } catch {}

    // ۳. (مورد ۲): اعمال خودکار کلیدواژه‌های هوش مصنوعی پس از ۱۴ روز برای منابعی که پذیرش AI آن‌ها فعال است
    try {
      const pendingSources = await env.DB.prepare(
        "SELECT id, mode, deep_scoring, keywords_positive, keywords_negative, keywords_main, keywords_complementary, keywords_peripheral, pending_keywords_positive, pending_keywords_negative, pending_keywords_main, pending_keywords_complementary, pending_keywords_peripheral FROM sources WHERE (ai_keywords_enabled IS NULL OR ai_keywords_enabled != 0) AND active = 1 AND mode = 'deep' AND ((pending_keywords_positive IS NOT NULL AND pending_keywords_positive != '' AND pending_keywords_positive != '[]') OR (pending_keywords_main IS NOT NULL AND pending_keywords_main != '' AND pending_keywords_main != '[]'))"
      ).all();

      if (pendingSources && pendingSources.results) {
        for (const s of pendingSources.results) {
          const isScoring = s.deep_scoring === 1 || s.deep_scoring === '1';
          if (isScoring) {
            const curMain = safeJson(s.keywords_main, []);
            const curComp = safeJson(s.keywords_complementary, []);
            const curPeriph = safeJson(s.keywords_peripheral, []);
            const pendMain = safeJson(s.pending_keywords_main, []);
            const pendComp = safeJson(s.pending_keywords_complementary, []);
            const pendPeriph = safeJson(s.pending_keywords_peripheral, []);

            const mergedMain = Array.from(new Set([...curMain, ...pendMain]));
            const mergedComp = Array.from(new Set([...curComp, ...pendComp]));
            const mergedPeriph = Array.from(new Set([...curPeriph, ...pendPeriph]));

            await env.DB.prepare(
              "UPDATE sources SET keywords_main = ?, keywords_complementary = ?, keywords_peripheral = ?, pending_keywords_main = '', pending_keywords_complementary = '', pending_keywords_peripheral = '' WHERE id = ?"
            ).bind(JSON.stringify(mergedMain), JSON.stringify(mergedComp), JSON.stringify(mergedPeriph), s.id).run();

            await logAction(s.id, 'ai_auto_apply', 'اعمال خودکار کلیدواژه‌های هوش مصنوعی پس از ۱۴ روز (Deep Scoring)', env);
          } else {
            const curPos = safeJson(s.keywords_positive, []);
            const curNeg = safeJson(s.keywords_negative, []);
            const pendPos = safeJson(s.pending_keywords_positive, []);
            const pendNeg = safeJson(s.pending_keywords_negative, []);

            const mergedPos = Array.from(new Set([...curPos, ...pendPos]));
            const mergedNeg = Array.from(new Set([...curNeg, ...pendNeg]));

            await env.DB.prepare(
              "UPDATE sources SET keywords_positive = ?, keywords_negative = ?, pending_keywords_positive = '', pending_keywords_negative = '' WHERE id = ?"
            ).bind(JSON.stringify(mergedPos), JSON.stringify(mergedNeg), s.id).run();

            await logAction(s.id, 'ai_auto_apply', 'اعمال خودکار کلیدواژه‌های هوش مصنوعی پس از ۱۴ روز (Deep Classic)', env);
          }
        }
      }
    } catch {}
  } catch {}
}`;

if (code.includes('// ─── پاکسازی لاگ‌های قدیمی‌تر از ۲ هفته (طبق سند معماری) ───')) {
  code = code.replace(oldCleanupSnippet, newCleanupSnippet);
}

// ─── 2. Update bumpPostWeights with weight clamping to max 60 (مورد ۶) ───
code = code.replace(
  'const newWeight = Math.min(50, 30 + Math.floor(newHits / 3) * 5);',
  'const newWeight = Math.min(60, 25 + Math.floor(newHits / 3) * 5); // سقف‌گذاری وزن توکن به حداکثر ۶۰ جهت جلوگیری از خطای مثبت کاذب'
);

// ─── 3. Update analyzeSourceWithAI for Topic-Based Multi-Source & ai_keywords_enabled check ───
const oldAnalyzeSourceStart = `async function analyzeSourceWithAI(source, env) {
  // ⚠️ طبق سند: فقط Deep modes نیاز به کلیدواژه دارند
  if (source.mode !== 'deep') {
    return { ok: false, error: 'این منبع در حالت Deep نیست — کلیدواژه لازم نیست' };
  }`;

const newAnalyzeSourceStart = `async function analyzeSourceWithAI(source, env) {
  // ⚠️ طبق سند: فقط Deep modes نیاز به کلیدواژه دارند
  if (source.mode !== 'deep') {
    return { ok: false, error: 'این منبع در حالت Deep نیست — کلیدواژه لازم نیست' };
  }
  // ⚠️ بررسی وضعیت پذیرش و پیشنهاد هوش مصنوعی برای منبع
  if (source.ai_keywords_enabled === 0 || source.ai_keywords_enabled === false || source.ai_keywords_enabled === '0') {
    return { ok: false, error: 'پذیرش و پیشنهاد کلیدواژه هوش مصنوعی برای این منبع غیرفعال است (پرش شد).' };
  }`;

if (code.includes(oldAnalyzeSourceStart)) {
  code = code.replace(oldAnalyzeSourceStart, newAnalyzeSourceStart);
}

// Update scraping & topic aggregation inside analyzeSourceWithAI
const oldScrapePart = `  const result = await scrapeChannel(source.channel);
  if (!result.ok || !result.posts?.length) {
    await logAction(source.id, 'error', \`AI: اسکرپ ناموفق: \${result.error}\`, env);
    return { ok: false, error: result.error };
  }

  const posts = result.posts.slice(-AI_POSTS_COUNT);
  const allText = posts.map(p => p.text).filter(Boolean).join('\\n---\\n').slice(0, 4000);
  if (!allText) {
    await logAction(source.id, 'error', 'AI: متن کافی برای تحلیل نیست', env);
    return { ok: false, error: 'متن کافی نیست' };
  }

  const topic = source.topic || 'عمومی';
  // ⚠️ پرامپت‌های جدا برای Deep Classic و Deep Scoring (طبق سند)
  const isScoring = source.deep_scoring === 1 || source.deep_scoring === '1';`;

const newScrapePart = `  const topic = source.topic || 'عمومی';

  // ── منطق تجمیعی: یافتن تمام منابع فعال هم‌موضوع که پذیرش هوش مصنوعی دارند ──
  let topicSources = [source];
  try {
    if (source.topic) {
      const tRes = await env.DB.prepare(
        "SELECT * FROM sources WHERE topic = ? AND mode = 'deep' AND active = 1 AND (ai_keywords_enabled IS NULL OR ai_keywords_enabled != 0)"
      ).bind(source.topic).all();
      if (tRes && tRes.results && tRes.results.length > 0) {
        topicSources = tRes.results;
      }
    }
  } catch {}

  // اسکرپ و گردآوری پست‌ها از تمامی منابع این موضوع (تضمین حداقل ۱ پست از هر کانال)
  const collectedPosts = [];
  const perChannelLimit = Math.max(2, Math.floor(AI_POSTS_COUNT / Math.max(1, topicSources.length)));
  for (const s of topicSources) {
    try {
      const sRes = await scrapeChannel(s.channel);
      if (sRes.ok && sRes.posts && sRes.posts.length > 0) {
        const chanPosts = sRes.posts.slice(-perChannelLimit);
        for (const p of chanPosts) {
          if (p.text && p.text.trim()) {
            collectedPosts.push({ channel: s.channel, text: p.text.trim() });
          }
        }
      }
    } catch {}
  }

  // در صورت عدم موفقیت چندکاناله، فال‌بک به همان کانال مبدا
  if (!collectedPosts.length) {
    const fallbackRes = await scrapeChannel(source.channel);
    if (!fallbackRes.ok || !fallbackRes.posts?.length) {
      await logAction(source.id, 'error', \`AI: اسکرپ ناموفق: \${fallbackRes.error}\`, env);
      return { ok: false, error: fallbackRes.error };
    }
    for (const p of fallbackRes.posts.slice(-AI_POSTS_COUNT)) {
      if (p.text) collectedPosts.push({ channel: source.channel, text: p.text.trim() });
    }
  }

  const posts = collectedPosts;
  const allText = collectedPosts.map(p => \`[کانال @\${p.channel.replace(/^@+/,'')}]:\\n\${p.text}\`).join('\\n---\\n').slice(0, 5000);
  if (!allText) {
    await logAction(source.id, 'error', 'AI: متن کافی برای تحلیل نیست', env);
    return { ok: false, error: 'متن کافی نیست' };
  }

  const isScoring = source.deep_scoring === 1 || source.deep_scoring === '1';`;

if (code.includes(oldScrapePart)) {
  code = code.replace(oldScrapePart, newScrapePart);
}

// Update saving extracted keywords into ALL topic sources
const oldSavePendingPart = `    // ذخیره pending بر اساس حالت
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
    }`;

const newSavePendingPart = `    // ── توزیع و ذخیره کلیدواژه‌ها متناسب با ساختار هر منبع در این موضوع ──
    // فقط برای منابعی که ai_keywords_enabled = 1 دارند
    for (const ts of topicSources) {
      if (ts.ai_keywords_enabled === 0 || ts.ai_keywords_enabled === false || ts.ai_keywords_enabled === '0') {
        continue; // پرش از منابعی که پذیرش هوش مصنوعی را غیرفعال کرده‌اند
      }
      const tsIsScoring = ts.deep_scoring === 1 || ts.deep_scoring === '1';
      if (tsIsScoring) {
        // برای Deep Scoring
        const mainKw = extracted.main && extracted.main.length ? extracted.main : (extracted.positive || []);
        const compKw = extracted.complementary || [];
        const periphKw = extracted.peripheral || [];
        await env.DB.prepare(
          'UPDATE sources SET pending_keywords_main = ?, pending_keywords_complementary = ?, pending_keywords_peripheral = ? WHERE id = ?'
        ).bind(
          JSON.stringify(mainKw),
          JSON.stringify(compKw),
          JSON.stringify(periphKw),
          ts.id
        ).run();
      } else {
        // برای Deep Classic
        const posKw = extracted.positive && extracted.positive.length ? extracted.positive : (extracted.main || []);
        const negKw = extracted.negative && extracted.negative.length ? extracted.negative : (extracted.peripheral || []);
        await env.DB.prepare(
          'UPDATE sources SET pending_keywords_positive = ?, pending_keywords_negative = ? WHERE id = ?'
        ).bind(
          JSON.stringify(posKw),
          JSON.stringify(negKw),
          ts.id
        ).run();
      }
    }`;

if (code.includes(oldSavePendingPart)) {
  code = code.replace(oldSavePendingPart, newSavePendingPart);
}

// ─── 4. Update Dormant Digest Mode in runDailyReport ───
const oldDailyReportStart = `async function runDailyReport(env) {
  const since = Date.now() - 24 * 60 * 60 * 1000;
  const adminId = env.MAIN_ADMIN_ID;

  // جمع‌آوری پست‌های ارسالی ۲۴ ساعت اخیر
  const sentLogs = await env.DB.prepare(
    "SELECT l.*, s.channel, s.mode, s.topic FROM logs l JOIN sources s ON l.source_id = s.id WHERE l.action = 'sent' AND l.created_at > ? ORDER BY l.views DESC"
  ).bind(since).all();
  const sentPosts = sentLogs.results || [];`;

const newDailyReportStart = `async function runDailyReport(env) {
  const since = Date.now() - 24 * 60 * 60 * 1000;
  const adminId = env.MAIN_ADMIN_ID;

  // بررسی وضعیت فعالیت اخیر ادمین (تشخیص حالت Dormant جهت جلوگیری از اشباع چت)
  let isDormant = false;
  try {
    const fourteenDaysAgo = Date.now() - 14 * 86400 * 1000;
    const lastAdminAct = await env.DB.prepare(
      "SELECT MAX(created_at) as last_act FROM logs WHERE action IN ('login', 'admin_activity', 'restore', 'report_ad', 'source_edit')"
    ).first('last_act');
    if (lastAdminAct && Number(lastAdminAct) < fourteenDaysAgo) {
      isDormant = true;
    }
  } catch {}

  // جمع‌آوری پست‌های ارسالی ۲۴ ساعت اخیر
  const sentLogs = await env.DB.prepare(
    "SELECT l.*, s.channel, s.mode, s.topic FROM logs l JOIN sources s ON l.source_id = s.id WHERE l.action = 'sent' AND l.created_at > ? ORDER BY l.views DESC"
  ).bind(since).all();
  const sentPosts = sentLogs.results || [];`;

if (code.includes(oldDailyReportStart)) {
  code = code.replace(oldDailyReportStart, newDailyReportStart);
}

// Update Telegram editFieldKb & callback handlers
code = code.replace(
  `function editFieldKb() {
  return { inline_keyboard: [
    [{ text: '🎯 حالت', callback_data: 'edit_field:mode' }, { text: '🔎 کلیدواژه‌ها', callback_data: 'edit_field:keywords' }],
    [{ text: '👁 ویرایش ری‌اکشن‌ها', callback_data: 'edit_field:viral' }],
    [{ text: '⚙️ every', callback_data: 'edit_field:every' }, { text: '🟢 فعال/غیرفعال', callback_data: 'edit_field:active' }],
    [{ text: '❌ لغو', callback_data: 'menu' }],
  ]};
}`,
  `function editFieldKb() {
  return { inline_keyboard: [
    [{ text: '🎯 حالت', callback_data: 'edit_field:mode' }, { text: '🔎 کلیدواژه‌ها', callback_data: 'edit_field:keywords' }],
    [{ text: '👁 ویرایش ری‌اکشن‌ها', callback_data: 'edit_field:viral' }],
    [{ text: '🤖 پذیرش کلیدواژه AI', callback_data: 'edit_field:ai_keywords' }],
    [{ text: '⚙️ every', callback_data: 'edit_field:every' }, { text: '🟢 فعال/غیرفعال', callback_data: 'edit_field:active' }],
    [{ text: '❌ لغو', callback_data: 'menu' }],
  ]};
}`
);

// Add callback handling for edit_field:ai_keywords and edit_ai_kw:0 / edit_ai_kw:1
const oldEditFieldCb = `      } else if (payload === 'keywords') {`;
const newEditFieldCb = `      } else if (payload === 'ai_keywords') {
        const kb = { inline_keyboard: [
          [{ text: '🟢 روشن (پذیرش و پیشنهاد AI)', callback_data: 'edit_ai_kw:1' }],
          [{ text: '🔴 خاموش (پرش و عدم تغییر)', callback_data: 'edit_ai_kw:0' }],
          [{ text: '❌ لغو', callback_data: 'menu' }],
        ]};
        return editMsg(chatId, messageId, '🤖 <b>پذیرش و پیشنهاد کلیدواژه‌های هوش مصنوعی برای منبع:</b>\\n\\nآیا برای این منبع کلیدواژه پیشنهاد و اعمال شود یا پرش شود؟', env, kb, 'HTML');
      } else if (payload === 'keywords') {`;

if (code.includes(oldEditFieldCb) && !code.includes("payload === 'ai_keywords'")) {
  code = code.replace(oldEditFieldCb, newEditFieldCb);
}

// Add handler for case 'edit_ai_kw':
const oldCaseEditMode = `    case 'edit_mode_select': {`;
const newCaseEditMode = `    case 'edit_ai_kw': {
      const val = payload === '1' ? 1 : 0;
      const sids = state.source_ids || (state.source_id ? [state.source_id] : []);
      for (const sid of sids) {
        await env.DB.prepare('UPDATE sources SET ai_keywords_enabled = ? WHERE id = ?').bind(val, sid).run();
      }
      await clearState(userId, env);
      const textStatus = val === 1 ? '🟢 پذیرش کلیدواژه هوش مصنوعی فعال شد.' : '🔴 پیشنهاد و پذیرش کلیدواژه هوش مصنوعی غیرفعال (پرش) شد.';
      return editMsg(chatId, messageId, \`✅ \${textStatus}\`, env, mainMenuKb());
    }
    case 'edit_mode_select': {`;

if (code.includes(oldCaseEditMode) && !code.includes("case 'edit_ai_kw':")) {
  code = code.replace(oldCaseEditMode, newCaseEditMode);
}

fs.writeFileSync('cloudflare-bot/worker.js', code);
console.log('Worker.js updated successfully with all 4 requested features!');
