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

// Auto-generated panel HTML export
const PANEL_HTML = "<!DOCTYPE html>\n<html lang=\"fa\" dir=\"rtl\">\n<head>\n<meta charset=\"UTF-8\" />\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n<title>پنل مدیریت ربات تجمیع‌کننده</title>\n<script src=\"https://telegram.org/js/telegram-web-app.js\"></script>\n<script src=\"https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js\"></script>\n<style>\n  /* ─── متغیرهای رنگ ─── */\n  :root{\n    --bg: #0a0e1a;\n    --bg2: #0f172a;\n    --bg3: #131c33;\n    --card: rgba(22, 28, 45, 0.7);\n    --card-solid: #161c2d;\n    --card-hover: rgba(34, 211, 238, 0.08);\n    --border: rgba(99, 102, 241, 0.15);\n    --border-strong: rgba(99, 102, 241, 0.35);\n    --text: #f1f5f9;\n    --muted: #94a3b8;\n    --accent: #06b6d4;\n    --accent2: #a78bfa;\n    --accent-glow: rgba(6, 182, 212, 0.4);\n    --green: #10b981;\n    --red: #ef4444;\n    --yellow: #f59e0b;\n    --blue: #3b82f6;\n    --purple: #a855f7;\n    --pink: #ec4899;\n    --shadow-sm: 0 1px 2px rgba(0,0,0,0.2);\n    --shadow: 0 4px 16px rgba(0,0,0,0.3);\n    --shadow-lg: 0 12px 32px rgba(0,0,0,0.4);\n    --radius-sm: 8px;\n    --radius: 12px;\n    --radius-lg: 16px;\n    --gradient: linear-gradient(135deg, #06b6d4 0%, #a78bfa 100%);\n    --gradient-card: linear-gradient(135deg, rgba(6,182,212,0.05) 0%, rgba(167,139,250,0.05) 100%);\n  }\n\n  *{box-sizing:border-box;margin:0;padding:0}\n  html,body{height:100%}\n  body{\n    font-family:'Vazirmatn',system-ui,-apple-system,BlinkMacSystemFont,sans-serif;\n    background: var(--bg);\n    background-image:\n      radial-gradient(at 20% 0%, rgba(6,182,212,0.12) 0px, transparent 50%),\n      radial-gradient(at 80% 100%, rgba(167,139,250,0.12) 0px, transparent 50%),\n      radial-gradient(at 100% 0%, rgba(236,72,153,0.08) 0px, transparent 50%);\n    background-attachment: fixed;\n    color: var(--text);\n    min-height: 100vh;\n    line-height: 1.6;\n    -webkit-font-smoothing: antialiased;\n  }\n  a{color:var(--accent);text-decoration:none}\n  ::selection{background:var(--accent);color:#fff}\n\n  /* ─── Scrollbar ─── */\n  ::-webkit-scrollbar{width:10px;height:10px}\n  ::-webkit-scrollbar-track{background:transparent}\n  ::-webkit-scrollbar-thumb{background:var(--border-strong);border-radius:5px}\n  ::-webkit-scrollbar-thumb:hover{background:var(--accent)}\n\n  /* ─── Login ─── */\n  .login-wrap{\n    display:flex;align-items:center;justify-content:center;min-height:100vh;padding:1rem;\n    background: radial-gradient(at center, rgba(6,182,212,0.15), transparent 70%);\n  }\n  .login-card{\n    background: rgba(22, 28, 45, 0.85);\n    backdrop-filter: blur(20px);\n    border:1px solid var(--border-strong);\n    border-radius: var(--radius-lg);\n    padding:2.5rem 2rem;\n    width:100%;max-width:400px;\n    box-shadow: var(--shadow-lg);\n    text-align:center;\n  }\n  .login-logo{\n    width:64px;height:64px;margin:0 auto 1.5rem;\n    background:var(--gradient);\n    border-radius:16px;\n    display:flex;align-items:center;justify-content:center;\n    box-shadow:0 0 40px var(--accent-glow);\n  }\n  .login-card h1{font-size:1.25rem;margin-bottom:.5rem}\n  .login-card p{color:var(--muted);font-size:.85rem;margin-bottom:1.5rem}\n  .login-card .field{margin-bottom:1rem;text-align:right}\n  .login-card .field label{display:block;font-size:.8rem;color:var(--muted);margin-bottom:.4rem;font-weight:500}\n  .login-card .field input{width:100%}\n\n  /* ─── Layout ─── */\n  .app{display:none;flex-direction:column;min-height:100vh}\n  .app.active{display:flex}\n\n  /* Header */\n  .header{\n    position:sticky;top:0;z-index:50;\n    background: rgba(10,14,26,0.85);\n    backdrop-filter: blur(20px);\n    border-bottom:1px solid var(--border);\n    padding:.75rem 1.25rem;\n    display:flex;align-items:center;justify-content:space-between;\n    gap:1rem;\n  }\n  .header-left{display:flex;align-items:center;gap:.75rem}\n  .logo-mini{\n    width:36px;height:36px;\n    background:var(--gradient);\n    border-radius:10px;\n    display:flex;align-items:center;justify-content:center;\n    box-shadow:0 0 20px var(--accent-glow);\n  }\n  .header h1{font-size:1rem;font-weight:700}\n  .header h1 .sub{color:var(--muted);font-weight:400;font-size:.7rem;display:block}\n  .header-right{display:flex;align-items:center;gap:.5rem}\n  .worker-url-input{\n    background:var(--bg2);border:1px solid var(--border);color:var(--text);\n    padding:.4rem .6rem;border-radius:var(--radius-sm);font-size:.75rem;width:200px;\n    font-family:inherit;\n  }\n  .icon-btn{\n    width:36px;height:36px;display:inline-flex;align-items:center;justify-content:center;\n    background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius-sm);\n    color:var(--muted);cursor:pointer;transition:all .2s;\n  }\n  .icon-btn:hover{color:var(--accent);border-color:var(--border-strong);background:var(--card-hover)}\n  .icon-btn svg{width:18px;height:18px}\n  .icon-btn.del:hover{color:var(--red);border-color:var(--red)}\n  .icon-btn.success:hover{color:var(--green);border-color:var(--green)}\n\n  /* Nav */\n  .nav{\n    background: rgba(15,23,42,0.6);\n    border-bottom:1px solid var(--border);\n    padding:.5rem 1.25rem;\n    display:flex;gap:.25rem;overflow-x:auto;\n  }\n  .nav-btn{\n    padding:.5rem 1rem;border:none;background:transparent;\n    color:var(--muted);cursor:pointer;border-radius:var(--radius-sm);\n    font-family:inherit;font-size:.85rem;font-weight:500;\n    display:flex;align-items:center;gap:.4rem;white-space:nowrap;\n    transition: all .2s;\n  }\n  .nav-btn:hover{color:var(--text);background:var(--card-hover)}\n  .nav-btn.active{color:var(--accent);background:rgba(6,182,212,0.12)}\n  .nav-btn svg{width:16px;height:16px}\n\n  /* Main */\n  .main{padding:1.5rem;flex:1;max-width:1400px;margin:0 auto;width:100%}\n  .page{display:none;animation:fadeIn .3s ease}\n  .page.active{display:block}\n  @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}\n\n  .page-header{\n    display:flex;align-items:center;justify-content:space-between;\n    margin-bottom:1.25rem;flex-wrap:wrap;gap:.5rem;\n  }\n  .page-title{font-size:1.5rem;font-weight:700}\n  .page-title .count{color:var(--muted);font-size:.85rem;font-weight:400;margin-inline-start:.5rem}\n\n  /* ─── Components ─── */\n  .btn{\n    display:inline-flex;align-items:center;justify-content:center;gap:.4rem;\n    padding:.55rem 1rem;border-radius:var(--radius-sm);font-family:inherit;\n    font-size:.85rem;font-weight:500;cursor:pointer;border:1px solid transparent;\n    transition: all .2s;white-space:nowrap;\n  }\n  .btn svg{width:16px;height:16px}\n  .btn-primary{background:var(--gradient);color:#fff;box-shadow:0 4px 12px var(--accent-glow)}\n  .btn-primary:hover{opacity:.9;transform:translateY(-1px)}\n  .btn-ghost{background:var(--bg2);color:var(--text);border:1px solid var(--border)}\n  .btn-ghost:hover{border-color:var(--border-strong);background:var(--card-hover)}\n  .btn-danger{background:rgba(239,68,68,0.1);color:var(--red);border:1px solid rgba(239,68,68,0.3)}\n  .btn-danger:hover{background:rgba(239,68,68,0.2)}\n  .btn-sm{padding:.35rem .65rem;font-size:.75rem}\n  .btn:disabled{opacity:.5;cursor:not-allowed}\n\n  .field{margin-bottom:1rem}\n  .field label{display:block;font-size:.8rem;color:var(--muted);margin-bottom:.4rem;font-weight:500}\n  .field input,.field select,.field textarea{\n    width:100%;background:var(--bg2);border:1px solid var(--border);color:var(--text);\n    padding:.55rem .75rem;border-radius:var(--radius-sm);font-family:inherit;font-size:.85rem;\n    transition:all .2s;\n  }\n  .field input:focus,.field select:focus,.field textarea:focus{\n    outline:none;border-color:var(--accent);box-shadow:0 0 0 3px rgba(6,182,212,0.15);\n  }\n  .field input[type=checkbox]{width:auto;margin-inline-start:.4rem}\n  .field .hint{font-size:.7rem;color:var(--muted);margin-top:.3rem}\n\n  .search{\n    background:var(--bg2);border:1px solid var(--border);color:var(--text);\n    padding:.55rem .75rem .55rem 2rem;border-radius:var(--radius-sm);\n    font-family:inherit;font-size:.85rem;width:100%;transition:all .2s;\n    background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='11' cy='11' r='8'%3E%3C/circle%3E%3Cpath d='m21 21-4.35-4.35'%3E%3C/path%3E%3C/svg%3E\");\n    background-repeat:no-repeat;background-position:right .75rem center;\n  }\n  .search:focus{outline:none;border-color:var(--accent)}\n\n  /* Cards */\n  .card{\n    background:var(--card);\n    backdrop-filter:blur(10px);\n    border:1px solid var(--border);\n    border-radius:var(--radius);\n    padding:1.25rem;\n    transition:all .2s;\n  }\n  .card:hover{border-color:var(--border-strong)}\n  .grid{display:grid;gap:1rem}\n  .grid-2{grid-template-columns:repeat(auto-fit,minmax(280px,1fr))}\n  .grid-3{grid-template-columns:repeat(auto-fit,minmax(220px,1fr))}\n  .grid-4{grid-template-columns:repeat(auto-fit,minmax(180px,1fr))}\n\n  /* Stats */\n  .stat-card{\n    background:var(--gradient-card);\n    border:1px solid var(--border);\n    border-radius:var(--radius);\n    padding:1.25rem;\n    position:relative;overflow:hidden;\n  }\n  .stat-card::before{\n    content:'';position:absolute;top:0;right:0;width:60px;height:60px;\n    background:var(--gradient);opacity:.15;border-radius:50%;\n    transform:translate(20px,-20px);\n  }\n  .stat-card .stat-icon{\n    width:36px;height:36px;border-radius:10px;\n    display:flex;align-items:center;justify-content:center;\n    margin-bottom:.75rem;\n  }\n  .stat-card .stat-icon svg{width:20px;height:20px}\n  .stat-card .stat-label{font-size:.75rem;color:var(--muted);margin-bottom:.25rem}\n  .stat-card .stat-value{font-size:1.75rem;font-weight:700}\n  .stat-card .stat-sub{font-size:.7rem;color:var(--muted);margin-top:.25rem}\n\n  /* Table */\n  .table-wrap{overflow-x:auto;border-radius:var(--radius);border:1px solid var(--border)}\n  table{width:100%;border-collapse:collapse;font-size:.85rem}\n  th{background:var(--bg2);padding:.75rem 1rem;text-align:right;font-weight:600;color:var(--muted);font-size:.75rem;text-transform:uppercase;letter-spacing:.05em;white-space:nowrap}\n  td{padding:.75rem 1rem;border-top:1px solid var(--border);vertical-align:middle}\n  tr:hover td{background:var(--card-hover)}\n  td.empty{text-align:center;color:var(--muted);padding:2rem}\n\n  /* Badges */\n  .badge{\n    display:inline-flex;align-items:center;gap:.25rem;\n    padding:.2rem .55rem;border-radius:999px;font-size:.7rem;font-weight:500;\n  }\n  .b-forward{background:rgba(59,130,246,.15);color:var(--blue)}\n  .b-deep{background:rgba(168,85,247,.15);color:var(--purple)}\n  .b-viral{background:rgba(245,158,11,.15);color:var(--yellow)}\n  .b-on{background:rgba(16,185,129,.15);color:var(--green)}\n  .b-off{background:rgba(239,68,68,.15);color:var(--red)}\n  .b-warn{background:rgba(245,158,11,.15);color:var(--yellow)}\n\n  .check-list{max-height:300px;overflow-y:auto;border:1px solid var(--border);border-radius:var(--radius-sm);padding:.5rem}\n  .check-item{display:flex;align-items:center;gap:.5rem;padding:.5rem;border-radius:6px;cursor:pointer;transition:background .15s}\n  .check-item:hover{background:var(--card-hover)}\n  .check-item input{margin:0}\n\n  /* Modal */\n  .modal-overlay{\n    position:fixed;inset:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(4px);\n    display:none;align-items:flex-start;justify-content:center;z-index:100;\n    padding:2rem 1rem;overflow-y:auto;\n  }\n  .modal-overlay.active{display:flex}\n  .modal{\n    background:var(--card-solid);border:1px solid var(--border-strong);\n    border-radius:var(--radius-lg);width:100%;max-width:560px;margin:auto;\n    box-shadow:var(--shadow-lg);animation:modalIn .2s ease;\n  }\n  @keyframes modalIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}\n  .modal-header{\n    padding:1rem 1.25rem;border-bottom:1px solid var(--border);\n    display:flex;align-items:center;justify-content:space-between;\n  }\n  .modal-header h2{font-size:1.05rem;font-weight:600}\n  .modal-body{padding:1.25rem;max-height:60vh;overflow-y:auto}\n  .modal-actions{\n    padding:1rem 1.25rem;border-top:1px solid var(--border);\n    display:flex;justify-content:flex-end;gap:.5rem;\n  }\n\n  /* Toast */\n  .toast{\n    position:fixed;bottom:1.5rem;left:50%;transform:translateX(-50%);\n    background:var(--card-solid);border:1px solid var(--border-strong);\n    padding:.75rem 1.25rem;border-radius:var(--radius);\n    box-shadow:var(--shadow-lg);color:var(--text);font-size:.85rem;\n    z-index:1000;opacity:0;pointer-events:none;transition:all .3s;\n  }\n  .toast.show{opacity:1;bottom:2rem}\n  .toast.ok{border-color:var(--green)}\n  .toast.err{border-color:var(--red)}\n\n  /* Empty state */\n  .empty{\n    text-align:center;padding:2rem;color:var(--muted);\n    display:flex;flex-direction:column;align-items:center;gap:.5rem;\n  }\n  .empty svg{width:32px;height:32px;opacity:.5}\n\n  /* Log entries */\n  .log-entry{\n    background:var(--card);border:1px solid var(--border);\n    border-radius:var(--radius-sm);padding:.75rem 1rem;margin-bottom:.5rem;\n    transition:all .15s;\n  }\n  .log-entry.expandable{cursor:pointer}\n  .log-entry.no-expand{cursor:default;opacity:.65}\n  .log-entry:hover{border-color:var(--border-strong)}\n  .log-entry.expanded{border-color:var(--accent)}\n  .log-entry .log-header{display:flex;justify-content:space-between;align-items:start;gap:.5rem;margin-bottom:.3rem;flex-wrap:wrap}\n  .log-entry .log-action{font-weight:600;font-size:.8rem}\n  .log-entry .log-time{font-size:.7rem;color:var(--muted);white-space:nowrap}\n  .log-entry .log-detail{font-size:.8rem;color:var(--text);opacity:.85}\n  .log-entry .log-breakdown{\n    background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-sm);\n    padding:.5rem .75rem;margin-top:.5rem;\n    font-family:'Vazirmatn',monospace;font-size:.75rem;\n    white-space:pre-wrap;color:var(--accent);\n    display:none;\n  }\n  .log-entry.expanded .log-breakdown{display:block}\n  .log-entry .log-ai-raw{\n    background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.3);\n    border-radius:var(--radius-sm);padding:.5rem .75rem;margin-top:.5rem;\n    font-family:monospace;font-size:.7rem;\n    color:var(--yellow);direction:ltr;text-align:left;\n    max-height:200px;overflow-y:auto;display:none;\n  }\n  .log-entry.expanded .log-ai-raw{display:block}\n  .log-badge{display:inline-block;padding:.1rem .4rem;border-radius:4px;font-size:.65rem;margin-inline-start:.3rem}\n  .log-badge.sent{background:rgba(16,185,129,.2);color:var(--green)}\n  .log-badge.skipped{background:rgba(245,158,11,.2);color:var(--yellow)}\n  .log-badge.error{background:rgba(239,68,68,.2);color:var(--red)}\n  .log-badge.ai_raw{background:rgba(168,85,247,.2);color:var(--purple)}\n  .log-badge.ai_analyze{background:rgba(6,182,212,.2);color:var(--accent)}\n  .log-badge.scanned{background:rgba(59,130,246,.2);color:var(--blue)}\n\n  /* AI Pending */\n  .ai-pending-card{\n    background:var(--card);border:1px solid var(--border-strong);\n    border-radius:var(--radius);padding:1rem;margin-bottom:.75rem;\n  }\n  .ai-pending-card .kw-grid{display:flex;flex-wrap:wrap;gap:.3rem;margin-top:.5rem}\n  .kw-badge{\n    display:inline-flex;align-items:center;gap:.2rem;\n    padding:.25rem .5rem;border-radius:6px;font-size:.75rem;cursor:pointer;\n    transition:all .15s;border:1px solid transparent;\n  }\n  .kw-badge:hover{transform:translateY(-1px)}\n  .kw-badge.selected{opacity:1}\n  .kw-badge.deselected{opacity:.35;text-decoration:line-through}\n  .kw-main{background:rgba(16,185,129,.15);color:var(--green);border-color:rgba(16,185,129,.3)}\n  .kw-comp{background:rgba(168,85,247,.15);color:var(--purple);border-color:rgba(168,85,247,.3)}\n  .kw-periph{background:rgba(245,158,11,.15);color:var(--yellow);border-color:rgba(245,158,11,.3)}\n  .kw-pos{background:rgba(16,185,129,.15);color:var(--green);border-color:rgba(16,185,129,.3)}\n  .kw-neg{background:rgba(239,68,68,.15);color:var(--red);border-color:rgba(239,68,68,.3)}\n\n  /* Reaction rule editor */\n  .reaction-rules{display:flex;flex-direction:column;gap:.5rem}\n  .reaction-rule{\n    display:flex;align-items:center;gap:.5rem;\n    background:var(--bg2);border:1px solid var(--border);\n    border-radius:var(--radius-sm);padding:.5rem;\n  }\n  .reaction-rule select{\n    min-width:140px;background:var(--bg);border:1px solid var(--border);color:var(--text);\n    padding:.4rem;border-radius:6px;font-size:.9rem;font-family:inherit;\n    max-width:200px;\n  }\n  .reaction-rule input[type=text]{\n    width:50px;text-align:center;font-size:1.1rem;\n    background:var(--bg);border:1px solid var(--border);color:var(--text);\n    padding:.4rem;border-radius:6px;\n  }\n  .reaction-rule input[type=number]{\n    flex:1;min-width:90px;background:var(--bg);border:1px solid var(--border);color:var(--text) !important;\n    padding:.45rem .6rem;border-radius:6px;font-family:inherit;font-size:.9rem;\n    direction:ltr;text-align:left;\n  }\n  .reaction-rule .remove-rule{\n    background:transparent;border:none;color:var(--red);cursor:pointer;\n    width:28px;height:28px;display:flex;align-items:center;justify-content:center;\n    border-radius:6px;font-size:1rem;\n  }\n\n  /* Responsive */\n  @media (max-width: 768px){\n    .header{padding:.5rem .75rem}\n    .worker-url-input{width:120px}\n    .main{padding:1rem}\n    .page-title{font-size:1.25rem}\n    .stat-card .stat-value{font-size:1.4rem}\n    .nav{padding:.4rem .75rem}\n    .nav-btn{font-size:.78rem;padding:.4rem .7rem}\n  }\n</style>\n</head>\n<body>\n\n<!-- ─── Login ─── -->\n<div class=\"login-wrap\" id=\"login\">\n  <div class=\"login-card\">\n    <div class=\"login-logo\">\n      <svg width=\"32\" height=\"32\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#fff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\">\n        <path d=\"M22 2 11 13\"/><path d=\"m22 2-7 20-4-9-9-4Z\"/>\n      </svg>\n    </div>\n    <h1>پنل مدیریت ربات</h1>\n    <p>برای ورود، آدرس Worker و رمز عبور را وارد کنید</p>\n    <div class=\"field\">\n      <label>آدرس Worker</label>\n      <input id=\"loginWorker\" placeholder=\"https://your-worker.workers.dev\" />\n    </div>\n    <div class=\"field\">\n      <label>رمز عبور</label>\n      <input id=\"loginPass\" type=\"password\" placeholder=\"••••••••\" onkeydown=\"if(event.key==='Enter')doLogin()\" />\n    </div>\n    <button class=\"btn btn-primary\" style=\"width:100%\" onclick=\"doLogin()\">ورود</button>\n  </div>\n</div>\n\n<!-- ─── App ─── -->\n<div class=\"app\" id=\"app\">\n  <!-- Header -->\n  <header class=\"header\">\n    <div class=\"header-left\">\n      <div class=\"logo-mini\">\n        <svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#fff\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\">\n          <path d=\"M22 2 11 13\"/><path d=\"m22 2-7 20-4-9-9-4Z\"/>\n        </svg>\n      </div>\n      <h1>پنل مدیریت ربات <span class=\"sub\" id=\"hdrWorker\">...</span></h1>\n    </div>\n    <div class=\"header-right\">\n      <input class=\"worker-url-input\" id=\"workerUrl\" placeholder=\"Worker URL\" onchange=\"updateWorker()\" />\n      <button class=\"icon-btn\" title=\"به‌روزرسانی\" onclick=\"loadAll()\">\n        <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8\"/><path d=\"M21 3v5h-5\"/><path d=\"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16\"/><path d=\"M8 16H3v5\"/></svg>\n      </button>\n      <button class=\"icon-btn del\" title=\"خروج\" onclick=\"logout()\">\n        <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4\"/><polyline points=\"16 17 21 12 16 7\"/><line x1=\"21\" y1=\"12\" x2=\"9\" y2=\"12\"/></svg>\n      </button>\n    </div>\n  </header>\n\n  <!-- Nav -->\n  <nav class=\"nav\" id=\"nav\">\n    <button class=\"nav-btn active\" data-page=\"dashboard\" onclick=\"showPage('dashboard',this)\">\n      <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect width=\"7\" height=\"9\" x=\"3\" y=\"3\" rx=\"1\"/><rect width=\"7\" height=\"5\" x=\"14\" y=\"3\" rx=\"1\"/><rect width=\"7\" height=\"9\" x=\"14\" y=\"12\" rx=\"1\"/><rect width=\"7\" height=\"5\" x=\"3\" y=\"16\" rx=\"1\"/></svg>\n      داشبورد\n    </button>\n    <button class=\"nav-btn\" data-page=\"sources\" onclick=\"showPage('sources',this)\">\n      <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M4 11a9 9 0 0 1 9 9\"/><path d=\"M4 4a16 16 0 0 1 16 16\"/><circle cx=\"5\" cy=\"19\" r=\"1\"/></svg>\n      منابع\n    </button>\n    <button class=\"nav-btn\" data-page=\"ai\" onclick=\"showPage('ai',this)\">\n      <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 8V4H8\"/><rect width=\"16\" height=\"12\" x=\"4\" y=\"8\" rx=\"2\"/><path d=\"M2 14h2\"/><path d=\"M20 14h2\"/><path d=\"M15 13v2\"/><path d=\"M9 13v2\"/></svg>\n      هوش مصنوعی\n    </button>\n    <button class=\"nav-btn\" data-page=\"report\" onclick=\"showPage('report',this)\">\n      <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z\"/><path d=\"M14 2v6h6\"/><path d=\"M16 13H8\"/><path d=\"M16 17H8\"/><path d=\"M10 9H8\"/></svg>\n      گزارش\n    </button>\n    <button class=\"nav-btn\" data-page=\"logs\" onclick=\"showPage('logs',this)\">\n      <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z\"/><path d=\"M14 2v6h6\"/><path d=\"M12 18v-6\"/><path d=\"M9 15h6\"/></svg>\n      لاگ‌ها\n    </button>\n    <button class=\"nav-btn\" data-page=\"quarantine\" onclick=\"showPage('quarantine',this)\">\n      <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z\"/><path d=\"M12 9v4\"/><path d=\"M12 17h.01\"/></svg>\n      قرنطینه\n    </button>\n    <button class=\"nav-btn\" data-page=\"adblock\" onclick=\"showPage('adblock',this)\">\n      <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M6 4a14 14 0 0 0 0 16\"/><path d=\"M18 4a14 14 0 0 1 0 16\"/><path d=\"M4 12h16\"/></svg>\n      ضد تبلیغات\n    </button>\n    <button class=\"nav-btn\" data-page=\"admins\" onclick=\"showPage('admins',this)\">\n      <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2\"/><circle cx=\"9\" cy=\"7\" r=\"4\"/><path d=\"M22 21v-2a4 4 0 0 0-3-3.87\"/><path d=\"M16 3.13a4 4 0 0 1 0 7.75\"/></svg>\n      ادمین‌ها\n    </button>\n    <button class=\"nav-btn\" data-page=\"backup\" onclick=\"showPage('backup',this)\">\n      <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><ellipse cx=\"12\" cy=\"5\" rx=\"9\" ry=\"3\"/><path d=\"M3 5V19A9 3 0 0 0 21 19V5\"/><path d=\"M3 12A9 3 0 0 0 21 12\"/></svg>\n      بکاپ\n    </button>\n  </nav>\n\n  <main class=\"main\">\n    <!-- ─── Dashboard ─── -->\n    <div class=\"page active\" id=\"page-dashboard\">\n      <div class=\"page-header\"><h2 class=\"page-title\">داشبورد</h2></div>\n      <div class=\"grid grid-4\" id=\"statsGrid\"></div>\n      <div class=\"grid grid-2\" style=\"margin-top:1rem\">\n        <div class=\"card\">\n          <h3 style=\"font-size:.9rem;margin-bottom:1rem;color:var(--muted)\">📈 ارسال روزانه (۷ روز)</h3>\n          <canvas id=\"dailyChart\" height=\"120\"></canvas>\n        </div>\n        <div class=\"card\">\n          <h3 style=\"font-size:.9rem;margin-bottom:1rem;color:var(--muted)\">⚡ عملکردها</h3>\n          <canvas id=\"actionChart\" height=\"120\"></canvas>\n        </div>\n      </div>\n    </div>\n\n    <!-- ─── Sources ─── -->\n    <div class=\"page\" id=\"page-sources\">\n      <div class=\"page-header\">\n        <h2 class=\"page-title\">منابع <span class=\"count\" id=\"sourcesCount\"></span></h2>\n        <div style=\"display:flex;gap:.5rem;flex-wrap:wrap\">\n          <input class=\"search\" id=\"srcSearch\" placeholder=\"جستجوی کانال...\" style=\"width:200px\" oninput=\"renderSources()\" />\n          <button class=\"btn btn-ghost\" onclick=\"openBulkEdit()\">🔧 ویرایش گروهی</button>\n          <button class=\"btn btn-primary\" onclick=\"openAddModal()\">➕ افزودن منبع</button>\n        </div>\n      </div>\n      <div class=\"table-wrap\">\n        <table>\n          <thead>\n            <tr>\n              <th>#</th><th>کانال</th><th>موضوع</th><th>حالت</th><th>کلیدواژه‌ها</th><th>مقصد</th><th>ضد تبلیغ</th><th>وضعیت</th><th>عملیات</th>\n            </tr>\n          </thead>\n          <tbody id=\"sourcesBody\"></tbody>\n        </table>\n      </div>\n    </div>\n\n    <!-- ─── AI ─── -->\n    <div class=\"page\" id=\"page-ai\">\n      <div class=\"page-header\">\n        <h2 class=\"page-title\">هوش مصنوعی</h2>\n        <button class=\"btn btn-ghost\" onclick=\"loadAIPending()\">🔄 به‌روزرسانی</button>\n      </div>\n      <div class=\"card\" style=\"margin-bottom:1rem\">\n        <h3 style=\"font-size:.95rem;margin-bottom:.75rem\">🤖 تحلیل دستی کلیدواژه</h3>\n        <p style=\"color:var(--muted);font-size:.8rem;margin-bottom:.75rem\">\n          یک منبع را انتخاب کنید. هوش مصنوعی ۳۰ پست اخیر را تحلیل کرده و کلیدواژه‌های پیشنهادی (بر اساس حالت Deep) ارائه می‌دهد.\n        </p>\n        <div id=\"aiAnalyzeSources\"></div>\n        <button class=\"btn btn-primary\" style=\"margin-top:.75rem\" onclick=\"triggerAIAnalyze()\">🤖 شروع تحلیل</button>\n        <div id=\"aiAnalyzeStatus\" style=\"margin-top:.75rem\"></div>\n      </div>\n      <h3 style=\"font-size:1rem;margin:1rem 0 .75rem\">📋 کلیدواژه‌های pending</h3>\n      <div id=\"aiPendingBody\"></div>\n    </div>\n\n    <!-- ─── Report ─── -->\n    <div class=\"page\" id=\"page-report\">\n      <div class=\"page-header\">\n        <h2 class=\"page-title\">گزارش روزانه</h2>\n        <button class=\"btn btn-ghost\" onclick=\"loadReport()\">🔄 به‌روزرسانی</button>\n      </div>\n      <div class=\"card\" style=\"margin-bottom:1rem\">\n        <div style=\"display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:.5rem\">\n          <div>\n            <h3 style=\"font-size:.95rem\">📊 گزارش ۲۴ ساعت اخیر</h3>\n            <p style=\"color:var(--muted);font-size:.75rem;margin-top:.25rem\" id=\"reportMeta\"></p>\n          </div>\n          <button class=\"btn btn-primary\" onclick=\"triggerReport()\">📧 ارسال به ادمین</button>\n        </div>\n      </div>\n      <div id=\"reportBody\"></div>\n    </div>\n\n    <!-- ─── Logs ─── -->\n    <div class=\"page\" id=\"page-logs\">\n      <div class=\"page-header\">\n        <h2 class=\"page-title\">لاگ‌ها <span class=\"count\" id=\"logsCount\"></span></h2>\n        <button class=\"btn btn-ghost\" onclick=\"loadLogs()\">🔄 به‌روزرسانی</button>\n      </div>\n      <div class=\"card\" style=\"margin-bottom:1rem;display:flex;gap:.5rem;flex-wrap:wrap;align-items:center\">\n        <select id=\"logActionFilter\" onchange=\"loadLogs()\" style=\"background:var(--bg2);border:1px solid var(--border);color:var(--text);padding:.5rem .8rem;border-radius:8px;font-size:.85rem;font-family:inherit\">\n          <option value=\"\">همه</option>\n          <option value=\"sent\">ارسال شد</option>\n          <option value=\"skipped\">رد شد</option>\n          <option value=\"scanned\">اسکن</option>\n          <option value=\"error\">خطا</option>\n          <option value=\"ai_analyze\">تحلیل AI</option>\n          <option value=\"ai_raw\">پاسخ AI</option>\n          <option value=\"daily_report\">گزارش روزانه</option>\n          <option value=\"report_ad\">گزارش تبلیغ</option>\n          <option value=\"restore\">بازیابی</option>\n        </select>\n        <input class=\"search\" id=\"logSearch\" placeholder=\"جستجو در متن...\" style=\"width:240px\" oninput=\"loadLogs()\" />\n        <label style=\"font-size:.8rem;color:var(--muted);display:flex;align-items:center;gap:.3rem\">\n          <input type=\"checkbox\" id=\"logAutoRefresh\" onchange=\"toggleLogAutoRefresh()\" /> به‌روزرسانی خودکار (۳۰ ثانیه)\n        </label>\n      </div>\n      <div id=\"logsHint\" style=\"font-size:.75rem;color:var(--muted);margin-bottom:.5rem\">💡 روی هر لاگ کلیک کنید تا جزئیات (breakdown) نمایش داده شود</div>\n      <div id=\"logsBody\"></div>\n    </div>\n\n    <!-- ─── Quarantine ─── -->\n    <div class=\"page\" id=\"page-quarantine\">\n      <div class=\"page-header\">\n        <h2 class=\"page-title\">قرنطینه</h2>\n        <button class=\"btn btn-ghost\" onclick=\"loadQuarantine()\">🔄 به‌روزرسانی</button>\n      </div>\n      <div id=\"quarantineBody\"></div>\n    </div>\n\n    <!-- ─── Ad Block ─── -->\n    <div class=\"page\" id=\"page-adblock\">\n      <div class=\"page-header\">\n        <h2 class=\"page-title\">سیستم ضد تبلیغات</h2>\n        <button class=\"btn btn-ghost\" onclick=\"loadAdWeights()\">🔄 به‌روزرسانی</button>\n      </div>\n      <div class=\"card\" style=\"margin-bottom:1rem\">\n        <h3 style=\"font-size:.95rem;margin-bottom:.5rem\">➕ افزودن وزن دستی</h3>\n        <div style=\"display:flex;gap:.5rem;flex-wrap:wrap\">\n          <input id=\"adwToken\" placeholder=\"کلمه/لینک/دامنه\" style=\"flex:1;min-width:200px;background:var(--bg2);border:1px solid var(--border);color:var(--text);padding:.5rem .75rem;border-radius:8px;font-family:inherit\" />\n          <select id=\"adwType\" style=\"background:var(--bg2);border:1px solid var(--border);color:var(--text);padding:.5rem;border-radius:8px;font-family:inherit\">\n            <option value=\"word\">word</option>\n            <option value=\"link\">link</option>\n            <option value=\"emoji\">emoji</option>\n            <option value=\"domain\">domain</option>\n            <option value=\"bot_id\">bot_id</option>\n            <option value=\"pattern\">pattern</option>\n          </select>\n          <input id=\"adwWeight\" type=\"number\" value=\"30\" style=\"width:80px;background:var(--bg2);border:1px solid var(--border);color:var(--text);padding:.5rem;border-radius:8px;font-family:inherit\" />\n          <button class=\"btn btn-primary\" onclick=\"addAdWeight()\">افزودن</button>\n        </div>\n      </div>\n      <div class=\"table-wrap\">\n        <table>\n          <thead><tr><th>توکن</th><th>نوع</th><th>وزن</th><th>hits</th><th>auto</th><th>عملیات</th></tr></thead>\n          <tbody id=\"adWeightsBody\"></tbody>\n        </table>\n      </div>\n    </div>\n\n    <!-- ─── Admins ─── -->\n    <div class=\"page\" id=\"page-admins\">\n      <div class=\"page-header\">\n        <h2 class=\"page-title\">ادمین‌ها</h2>\n        <button class=\"btn btn-primary\" onclick=\"openAddAdmin()\">➕ افزودن ادمین</button>\n      </div>\n      <div class=\"card\" style=\"margin-bottom:1rem\" id=\"mainAdmin\"></div>\n      <h3 style=\"font-size:1rem;margin:.75rem 0\">ادمین‌های فرعی</h3>\n      <div class=\"table-wrap\">\n        <table>\n          <thead><tr><th>آیدی</th><th>افزوده توسط</th><th>دسترسی‌ها</th><th>عملیات</th></tr></thead>\n          <tbody id=\"adminsBody\"></tbody>\n        </table>\n      </div>\n    </div>\n\n    <!-- ─── Backup ─── -->\n    <div class=\"page\" id=\"page-backup\">\n      <div class=\"page-header\"><h2 class=\"page-title\">بکاپ‌گیری و بازیابی</h2></div>\n      <div class=\"grid grid-2\">\n        <div class=\"card\">\n          <h3 style=\"font-size:.95rem;margin-bottom:.75rem\">💾 بکاپ‌گیری</h3>\n          <p style=\"color:var(--muted);font-size:.8rem;margin-bottom:.75rem\">\n            دانلود فایل JSON شامل منابع + وزن‌های ضد تبلیغات + پیکربندی قرنطینه. بدون لاگ‌ها.\n          </p>\n          <button class=\"btn btn-primary\" onclick=\"downloadBackup()\">📥 دانلود بکاپ</button>\n        </div>\n        <div class=\"card\">\n          <h3 style=\"font-size:.95rem;margin-bottom:.75rem\">📤 بازیابی</h3>\n          <p style=\"color:var(--muted);font-size:.8rem;margin-bottom:.75rem\">\n            فایل JSON بکاپ را آپلود کنید تا منابع + وزن‌ها بازیابی شوند.\n          </p>\n          <input type=\"file\" id=\"restoreFile\" accept=\".json\" style=\"margin-bottom:.5rem\" />\n          <button class=\"btn btn-primary\" onclick=\"doRestore()\">📤 بازیابی</button>\n        </div>\n      </div>\n    </div>\n\n  </main>\n</div>\n\n<!-- Modal -->\n<div class=\"modal-overlay\" id=\"modal\" onclick=\"if(event.target===this)closeModal()\">\n  <div class=\"modal\">\n    <div class=\"modal-header\">\n      <h2 id=\"modalTitle\"></h2>\n      <button class=\"icon-btn\" onclick=\"closeModal()\">\n        <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><line x1=\"18\" y1=\"6\" x2=\"6\" y2=\"18\"/><line x1=\"6\" y1=\"6\" x2=\"18\" y2=\"18\"/></svg>\n      </button>\n    </div>\n    <div class=\"modal-body\" id=\"modalContent\"></div>\n    <div class=\"modal-actions\" id=\"modalActions\"></div>\n  </div>\n</div>\n\n<div class=\"toast\" id=\"toast\"></div>\n\n<script>\n// ─── متغیرهای سراسری ───\nlet WORKER_URL = localStorage.getItem('workerUrl') || '';\nlet SOURCES = [];\nlet LOGS = [];\nlet logAutoRefreshTimer = null;\nlet aiSelectedSource = null;\nlet aiAnalyzing = false;\nlet pendingSelection = {};\nlet charts = {};\n\n// ─── توابع کمکی ───\nfunction $(s){return document.querySelector(s)}\nfunction $(s){return document.querySelectorAll(s)}\nfunction toast(msg, ok=true){\n  const t = $('#toast');\n  t.textContent = msg;\n  t.className = 'toast show ' + (ok ? 'ok' : 'err');\n  setTimeout(() => t.className = 'toast', 2800);\n}\nasync function api(path, opts={}) {\n  const r = await fetch(WORKER_URL + '/api/' + path, {\n    ...opts,\n    credentials: 'include',\n    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },\n  });\n  if (r.status === 401) { logout(); throw new Error('Unauthorized'); }\n  const d = await r.json();\n  if (!r.ok) throw new Error(d.error || 'Error');\n  return d;\n}\nfunction esc(s){return String(s||'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]))}\nfunction fmtDate(ts){if(!ts)return '—';return new Date(ts).toLocaleString('fa-IR',{hour:'2-digit',minute:'2-digit',day:'numeric',month:'short'})}\nfunction safeJson(s, def){if(s===null||s===undefined||s==='')return def;if(typeof s==='object')return s;try{return JSON.parse(s)}catch{return def}}\nfunction modeBadge(m){const n={forward:'فوروارد',deep:'عمیق',viral:'وایرال'}[m]||m;return `<span class=\"badge b-${m}\">${n}</span>`}\n\n// ─── آیکون‌های SVG ───\nconst ICONS = {\n  send:`<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"m22 2-7 20-4-9-9-4Z\"/><path d=\"M22 2 11 13\"/></svg>`,\n  skip:`<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><polygon points=\"5 4 15 12 5 20 5 4\"/><line x1=\"19\" y1=\"5\" x2=\"19\" y2=\"19\"/></svg>`,\n  error:`<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"10\"/><line x1=\"12\" y1=\"8\" x2=\"12\" y2=\"12\"/><line x1=\"12\" y1=\"16\" x2=\"12.01\" y2=\"16\"/></svg>`,\n  ai:`<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect width=\"18\" height=\"10\" x=\"3\" y=\"11\" rx=\"2\"/><circle cx=\"12\" cy=\"5\" r=\"2\"/><path d=\"M12 7v4\"/><line x1=\"8\" y1=\"16\" x2=\"8\" y2=\"16\"/><line x1=\"16\" y1=\"16\" x2=\"16\" y2=\"16\"/></svg>`,\n  eye:`<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/></svg>`,\n  bot:`<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect width=\"18\" height=\"10\" x=\"3\" y=\"11\" rx=\"2\"/><circle cx=\"12\" cy=\"5\" r=\"2\"/><path d=\"M12 7v4\"/><line x1=\"8\" y1=\"16\" x2=\"8\" y2=\"16\"/><line x1=\"16\" y1=\"16\" x2=\"16\" y2=\"16\"/></svg>`,\n  shield:`<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1Z\"/></svg>`,\n  bug:`<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect width=\"8\" height=\"14\" x=\"8\" y=\"6\" rx=\"4\"/><path d=\"m19 7-3 2\"/><path d=\"m5 7 3 2\"/><path d=\"m19 19-3-2\"/><path d=\"m5 19 3-2\"/><path d=\"M20 13h-4\"/><path d=\"M4 13h4\"/><path d=\"m10 4 1 2\"/><path d=\"m14 4-1 2\"/></svg>`,\n  source:`<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M4 11a9 9 0 0 1 9 9\"/><path d=\"M4 4a16 16 0 0 1 16 16\"/><circle cx=\"5\" cy=\"19\" r=\"1\"/></svg>`,\n};\n\n// ─── Auth ───\nasync function doLogin(){\n  const url = $('#loginWorker').value.trim().replace(/\\/$/, '');\n  const pass = $('#loginPass').value;\n  if(!url || !pass){toast('Worker URL و رمز عبور را وارد کنید', false);return}\n  WORKER_URL = url;\n  try{\n    const r = await fetch(url+'/api/login', {method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body:JSON.stringify({password:pass})});\n    if(!r.ok){const d=await r.json().catch(()=>({}));throw new Error(d.error||'ورود ناموفق')}\n    localStorage.setItem('workerUrl', url);\n    $('#login').style.display='none';\n    $('#app').classList.add('active');\n    $('#workerUrl').value = url;\n    $('#hdrWorker').textContent = url.replace(/^https?:\\/\\//,'');\n    loadAll();\n  }catch(e){toast(e.message, false)}\n}\nfunction logout(){document.cookie='session=; Path=/; Max-Age=0';localStorage.removeItem('workerUrl');location.reload()}\nfunction updateWorker(){\n  WORKER_URL = $('#workerUrl').value.trim().replace(/\\/$/, '');\n  localStorage.setItem('workerUrl', WORKER_URL);\n  $('#hdrWorker').textContent = WORKER_URL.replace(/^https?:\\/\\//,'');\n  loadAll();\n}\n\n// اگه قبلاً وارد شده، مستقیم اپ نمایش داده شود\nif(WORKER_URL){\n  fetch(WORKER_URL+'/api/stats', {credentials:'include'})\n    .then(r=>{if(r.ok){$('#login').style.display='none';$('#app').classList.add('active');$('#workerUrl').value=WORKER_URL;$('#hdrWorker').textContent=WORKER_URL.replace(/^https?:\\/\\//,'');loadAll()}})\n    .catch(()=>{});\n}\n\nfunction showPage(name, btn){\n  $('.page').forEach(p=>p.classList.remove('active'));\n  $('#page-'+name).classList.add('active');\n  $('.nav-btn').forEach(b=>b.classList.remove('active'));\n  if(btn) btn.classList.add('active');\n  if(name==='dashboard') loadStats();\n  if(name==='sources') loadSources();\n  if(name==='ai') loadAIPending();\n  if(name==='report') loadReport();\n  if(name==='logs') loadLogs();\n  if(name==='quarantine') loadQuarantine();\n  if(name==='adblock') loadAdWeights();\n  if(name==='admins') loadAdmins();\n}\n\nasync function loadAll(){await loadStats()}\n\n// ─── Dashboard ───\nasync function loadStats(){\n  try{\n    const d = await api('stats');\n    const stats = [\n      {label:'منابع فعال', value:d.sources||0, icon:ICONS.source, color:'var(--accent)'},\n      {label:'پست‌های ارسالی', value:d.sentToday||0, icon:ICONS.send, color:'var(--green)'},\n      {label:'تبلیغات مسدود', value:d.adsBlocked||0, icon:ICONS.shield, color:'var(--red)'},\n      {label:'خطاها', value:d.errorsToday||0, icon:ICONS.error, color:'var(--yellow)'},\n    ];\n    $('#statsGrid').innerHTML = stats.map(s=>`\n      <div class=\"stat-card\">\n        <div class=\"stat-icon\" style=\"background:${s.color}22;color:${s.color}\">${s.icon}</div>\n        <div class=\"stat-label\">${s.label}</div>\n        <div class=\"stat-value\">${s.value}</div>\n      </div>\n    `).join('');\n    if(d.daily) renderDailyChart(d.daily);\n    if(d.byAction) renderActionChart(d.byAction);\n  }catch(e){toast(e.message, false)}\n}\n\nfunction renderDailyChart(daily){\n  const ctx = document.getElementById('dailyChart');\n  if(charts.daily) charts.daily.destroy();\n  charts.daily = new Chart(ctx, {\n    type:'line',\n    data:{\n      labels: daily.map(d=>new Date(d.date).toLocaleDateString('fa-IR',{weekday:'short'})),\n      datasets:[{label:'ارسالی', data:daily.map(d=>d.sent), borderColor:'#06b6d4', backgroundColor:'rgba(6,182,212,0.1)', fill:true, tension:.3}]\n    },\n    options:{responsive:true, plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true, ticks:{color:'#94a3b8'}}, x:{ticks:{color:'#94a3b8'}}}}\n  });\n}\nfunction renderActionChart(a){\n  const ctx = document.getElementById('actionChart');\n  if(charts.action) charts.action.destroy();\n  charts.action = new Chart(ctx, {\n    type:'doughnut',\n    data:{\n      labels: Object.keys(a),\n      datasets:[{data: Object.values(a), backgroundColor:['#10b981','#f59e0b','#ef4444','#3b82f6','#a855f7','#06b6d4']}]\n    },\n    options:{responsive:true, plugins:{legend:{position:'bottom', labels:{color:'#94a3b8', font:{size:11}}}}}\n  });\n}\n\n// ─── Sources ───\nasync function loadSources(){\n  try{\n    const d = await api('sources');\n    SOURCES = d.sources || [];\n    $('#sourcesCount').textContent = `(${SOURCES.length} منبع)`;\n    renderSources();\n  }catch(e){toast(e.message, false)}\n}\n\nfunction formatKwList(s){\n  if(s.mode === 'deep'){\n    const isScoring = s.deep_scoring == 1;\n    if(isScoring){\n      const main = safeJson(s.keywords_main, []);\n      const comp = safeJson(s.keywords_complementary, []);\n      const periph = safeJson(s.keywords_peripheral, []);\n      let html = `<div style=\"font-size:.75rem\">✅ اصلی (${main.length}): ${esc(main.join('، '))||'—'}</div>`;\n      if(comp.length) html += `<div style=\"font-size:.75rem;color:var(--purple)\">➕ مکمل (${comp.length}): ${esc(comp.join('، '))}</div>`;\n      if(periph.length) html += `<div style=\"font-size:.75rem;color:var(--yellow)\">⚠️ پیرامونی (${periph.length}): ${esc(periph.join('، '))}</div>`;\n      html += `<div style=\"font-size:.7rem;color:var(--muted);margin-top:.2rem\">📊 آستانه: ${s.deep_threshold||50}</div>`;\n      return html;\n    } else {\n      const pos = safeJson(s.keywords_positive, []);\n      const neg = safeJson(s.keywords_negative, []);\n      let html = `<div style=\"font-size:.75rem\">✅ مثبت‌کننده (${pos.length}): ${esc(pos.join('، '))||'—'}</div>`;\n      if(neg.length) html += `<div style=\"font-size:.75rem;color:var(--red)\">🚫 منفی‌کننده (${neg.length}): ${esc(neg.join('، '))}</div>`;\n      if(s.every_mode) html += `<span class=\"badge b-warn\" style=\"margin-top:.2rem\">every</span>`;\n      return html;\n    }\n  } else if(s.mode === 'viral'){\n    const rules = safeJson(s.viral_reactions, []);\n    if(rules.length){\n      return rules.map(r=>`<div style=\"font-size:.75rem\">${esc(r.emoji)} ≥ ${r.threshold}</div>`).join('') +\n        `<div style=\"font-size:.7rem;color:var(--muted);margin-top:.2rem\">مجموع ری‌اکشن fallback: ≥ ${s.viral_threshold||1000}</div>`;\n    }\n    return `<div style=\"font-size:.75rem;color:var(--yellow)\">⚠️ بدون rule — مجموع ری‌اکشن ≥ ${s.viral_threshold||1000}</div>`;\n  }\n  return '—';\n}\n\nfunction renderSources(){\n  const q = ($('#srcSearch').value || '').toLowerCase();\n  const list = SOURCES.filter(s => !q || (s.channel||'').toLowerCase().includes(q) || (s.mode||'').includes(q));\n  if(!list.length){\n    $('#sourcesBody').innerHTML = '<tr><td colspan=\"9\" class=\"empty\"><div class=\"empty\">📭 منبعی یافت نشد</div></td></tr>';\n    return;\n  }\n  $('#sourcesBody').innerHTML = list.map(s=>{\n    const pendingBadge = (s.pending_positive?.length || s.pending_main?.length) ? `<span class=\"badge b-warn\" style=\"margin-inline-start:.3rem\">🤖 pending</span>` : '';\n    const adIcon = s.block_ads === 0 ? '🔴' : '🟢';\n    const adTitle = s.block_ads === 0 ? 'خاموش — کلیک برای روشن' : 'روشن — کلیک برای خاموش';\n    return `<tr>\n      <td><strong>${s.id}</strong></td>\n      <td><a href=\"https://t.me/${(s.channel||'').replace('@','')}\" target=\"_blank\">@${esc(s.channel)}</a></td>\n      <td style=\"font-size:.75rem\">${esc(s.topic||'—')}${pendingBadge}</td>\n      <td>${modeBadge(s.mode)}</td>\n      <td>${formatKwList(s)}</td>\n      <td style=\"font-size:.7rem\">${esc(s.target_chat_id)}${s.target_topic_id?':'+esc(s.target_topic_id):''}</td>\n      <td><button class=\"icon-btn ${s.block_ads!==0?'success':''}\" title=\"${adTitle}\" onclick=\"toggleAdBlock(${s.id},${s.block_ads===0?1:0})\">${adIcon}</button></td>\n      <td><span class=\"badge ${s.active?'b-on':'b-off'}\">${s.active?'فعال':'غیرفعال'}</span></td>\n      <td><div style=\"display:flex;gap:.2rem\">\n        <button class=\"icon-btn\" title=\"اسکن\" onclick=\"scanSource(${s.id})\">🔍</button>\n        <button class=\"icon-btn\" title=\"ویرایش\" onclick=\"openEditModal(${s.id})\">✏️</button>\n        <button class=\"icon-btn del\" title=\"حذف\" onclick=\"delSource(${s.id})\">🗑</button>\n      </div></td>\n    </tr>`;\n  }).join('');\n}\n\nasync function toggleAdBlock(id, newVal){\n  try{\n    await api('sources/'+id, {method:'PUT', body:JSON.stringify({block_ads:newVal})});\n    const s = SOURCES.find(x=>x.id===id); if(s) s.block_ads = newVal;\n    renderSources();\n    toast(newVal===1?'🟢 ضد تبلیغات روشن شد':'🔴 ضد تبلیغات خاموش شد');\n  }catch(e){toast(e.message, false)}\n}\n\n// ─── Add Modal ───\nfunction openAddModal(){\n  $('#modalTitle').textContent = '➕ افزودن منبع جدید';\n  $('#modalContent').innerHTML = `\n    <div class=\"field\"><label>کانال(ها) — با کاما</label><input id=\"m_channel\" placeholder=\"@chan1,@chan2\" /></div>\n    <div class=\"field\"><label>موضوع (برای AI)</label><input id=\"m_topic_name\" placeholder=\"اخبار رمزارز، تکنولوژی...\" /></div>\n    <div class=\"field\"><label>حالت</label><select id=\"m_mode\" onchange=\"toggleModeFields()\">\n      <option value=\"forward\">📤 فوروارد</option>\n      <option value=\"deep\">🔎 عمیق</option>\n      <option value=\"viral\">👁 وایرال</option>\n    </select></div>\n\n    <div id=\"deepFields\" style=\"display:none\">\n      <div class=\"field\"><label>نوع Deep</label><select id=\"m_deep_type\" onchange=\"toggleDeepFields()\">\n        <option value=\"classic\">📋 Deep Classic (مثبت‌کننده/منفی‌کننده)</option>\n        <option value=\"scoring\">📊 Deep Scoring (اصلی/مکمل/پیرامونی)</option>\n      </select></div>\n      <div id=\"deepClassicFields\">\n        <div class=\"field\"><label>کلیدواژه مثبت‌کننده — +score (با کاما)</label><input id=\"m_pos\" placeholder=\"بیت کوین, ارز دیجیتال\" /></div>\n        <div class=\"field\"><label>کلیدواژه منفی‌کننده — رد پست (با کاما)</label><input id=\"m_neg\" placeholder=\"تبلیغ, اسپانسر\" /></div>\n        <div class=\"field\"><label><input type=\"checkbox\" id=\"m_every\" /> every — همه کلیدواژه‌های مثبت باید باشند (AND)</label></div>\n      </div>\n      <div id=\"deepScoringFields\" style=\"display:none\">\n        <div class=\"field\"><label>کلیدواژه اصلی — +۴۰ (با کاما)</label><input id=\"m_main\" placeholder=\"بیت کوین, ارز دیجیتال\" /></div>\n        <div class=\"field\"><label>کلیدواژه مکمل — +۱۵ (با کاما)</label><input id=\"m_comp\" placeholder=\"بازار, تحلیل, قیمت\" /></div>\n        <div class=\"field\"><label>کلیدواژه پیرامونی — -۳۰ (با کاما)</label><input id=\"m_periph\" placeholder=\"تبلیغ, فروش\" /></div>\n        <div class=\"field\"><label>آستانه امتیاز Deep</label><input id=\"m_deep_threshold\" type=\"number\" value=\"50\" /></div>\n      </div>\n    </div>\n\n    <div id=\"viralFields\" style=\"display:none\">\n      <div class=\"field\">\n        <label>قوانین چند ری‌اکشن (اختیاری)</label>\n        <div class=\"hint\" style=\"margin-bottom:.5rem\">هر ری‌اکشن آستانه مستقل دارد. همه باید عبور کنند (AND). خالی = مجموع همه ری‌اکشن‌ها.</div>\n        <div class=\"reaction-rules\" id=\"m_viral_rules\"></div>\n        <button class=\"btn btn-ghost btn-sm\" style=\"margin-top:.5rem\" onclick=\"addReactionRule('m')\">➕ افزودن ری‌اکشن</button>\n      </div>\n      <div class=\"field\"><label>آستانه مجموع ری‌اکشن‌ها (وقتی rule وجود ندارد)</label><input id=\"m_viral_threshold\" type=\"number\" value=\"1000\" />\n      <div class=\"hint\">معیار Viral Mode فقط ری‌اکشن‌هاست. اگه rule خاص تنظیم نکنید، مجموع همه ری‌اکشن‌ها از این عدد عبور کند → ارسال.</div></div>\n    </div>\n\n    <div class=\"field\"><label>مقصد (chat_id)</label><input id=\"m_target\" placeholder=\"-100123456789\" /></div>\n    <div class=\"field\"><label>تاپیک مقصد (اختیاری)</label><input id=\"m_topic\" placeholder=\"topic_id\" /></div>\n    <div class=\"field\"><label>آستانه Anti-Ad (پیش‌فرض ۷۰)</label><input id=\"m_ad_threshold\" type=\"number\" value=\"70\" /></div>\n    <div class=\"field\"><label><input type=\"checkbox\" id=\"m_block_ads\" checked /> 🛡 ضد تبلیغات روشن</label></div>\n  `;\n  $('#modalActions').innerHTML = `<button class=\"btn btn-ghost\" onclick=\"closeModal()\">انصراف</button><button class=\"btn btn-primary\" onclick=\"saveAddSource()\">ذخیره</button>`;\n  $('#modal').classList.add('active');\n}\n\nfunction toggleModeFields(){\n  const m = $('#m_mode').value;\n  $('#deepFields').style.display = m==='deep' ? 'block' : 'none';\n  $('#viralFields').style.display = m==='viral' ? 'block' : 'none';\n  if(m==='deep') toggleDeepFields();\n  // اگه viral انتخاب شد و هیچ rule وجود ندارد → یک rule پیش‌فرض اضافه کن\n  if(m==='viral'){\n    const container = $('#m_viral_rules');\n    if(container && !container.children.length){\n      addReactionRule('m');\n    }\n  }\n}\nfunction toggleDeepFields(){\n  const dt = $('#m_deep_type')?.value || 'classic';\n  if($('#deepScoringFields')) $('#deepScoringFields').style.display = dt==='scoring' ? 'block' : 'none';\n  if($('#deepClassicFields')) $('#deepClassicFields').style.display = dt==='classic' ? 'block' : 'none';\n}\n\n// ─── لیست ری‌اکشن‌های مجاز تلگرام ───\n// منبع: https://core.telegram.org/api/emoji-reactions\nconst TELEGRAM_REACTIONS = [\n  // ─── استاندارد (همه کاربران) ───\n  { emoji: '👍', name: 'مان بالا' },\n  { emoji: '👎', name: 'مان پایین' },\n  { emoji: '❤', name: 'قلب قرمز' },\n  { emoji: '🔥', name: 'آتش' },\n  { emoji: '🎉', name: 'جشن' },\n  { emoji: '🥰', name: 'قلب‌چشم' },\n  { emoji: '👏', name: 'دست‌زدن' },\n  { emoji: '😂', name: 'خنده' },\n  { emoji: '🙏', name: 'دعای دست' },\n  { emoji: '😍', name: 'عاشق' },\n  { emoji: '😭', name: 'گریه' },\n  { emoji: '😮', name: 'تعجب' },\n  { emoji: '🤔', name: 'فکر' },\n  { emoji: '💯', name: 'صد' },\n  { emoji: '💔', name: 'قلب شکسته' },\n  { emoji: '⚡', name: 'صاعقه' },\n  { emoji: '🏆', name: 'جام' },\n  { emoji: '🤝', name: 'دست‌دهی' },\n  { emoji: '🤡', name: 'دلقک' },\n  { emoji: '😴', name: 'خواب' },\n  { emoji: '🆒', name: 'cool' },\n  { emoji: '🐳', name: 'نهنگ' },\n  { emoji: '🖤', name: 'قلب مشکی' },\n  { emoji: '🤷', name: 'شکست سر' },\n  { emoji: '👀', name: 'چشم' },\n  { emoji: '😇', name: 'هاله' },\n  { emoji: '🤦', name: 'دست‌به‌سر' },\n  { emoji: '🌚', name: 'ماه سیاه' },\n  { emoji: '🌭', name: 'هات‌داگ' },\n  { emoji: '💘', name: 'قلب با کمان' },\n  { emoji: '🤣', name: 'خنده شدید' },\n  { emoji: '😢', name: 'غم' },\n  { emoji: '🥳', name: 'مهمون' },\n  { emoji: '🙈', name: 'میمون دست‌به‌چشم' },\n  { emoji: '💩', name: 'پوپ' },\n  { emoji: '🤯', name: 'منفجر' },\n  { emoji: '😡', name: 'عصبانی' },\n  { emoji: '😱', name: 'ترس' },\n  { emoji: '👿', name: 'شیطان' },\n  // ─── پیشرفته (نمایش به‌صورت custom emoji در چت‌های بزرگ) ───\n  { emoji: '❤‍🔥', name: 'قلب آتشین' },\n  { emoji: '👍🏻', name: 'مان روشن' },\n  { emoji: '👎🏻', name: 'مان روشن - پایین' },\n  { emoji: '🦄', name: 'تک‌شاخ' },\n  { emoji: '🥺', name: 'التماس' },\n  { emoji: '😎', name: 'آفتاب‌عینکی' },\n  { emoji: '🤩', name: 'ستاره‌چشم' },\n  { emoji: '🫡', name: 'سلام نظامی' },\n  { emoji: '🗿', name: 'مجسمه' },\n  { emoji: '🥱', name: 'خمیازه' },\n  { emoji: '🤤', name: 'آب دهان' },\n  { emoji: '🤧', name: 'عطسه' },\n  { emoji: '🤒', name: 'بیمار' },\n  { emoji: '🥶', name: 'سرما' },\n  { emoji: '🤠', name: 'کابوی' },\n  { emoji: '🫶', name: 'دست قلب' },\n  { emoji: '🫂', name: 'آغوش' },\n  { emoji: '🫵', name: 'انگشت به خود' },\n  { emoji: '🐈', name: 'گربه' },\n  { emoji: '🐶', name: 'سگ' },\n  { emoji: '🌸', name: 'گل ساکورا' },\n  { emoji: '🌈', name: 'رنگین‌کمان' },\n  { emoji: '💎', name: 'الماس' },\n  { emoji: '🚀', name: 'موشک' },\n  { emoji: '🧨', name: 'فشفشک' },\n  { emoji: '🍕', name: 'پیتزا' },\n  { emoji: '🍔', name: 'برگر' },\n  { emoji: '🍿', name: 'پاپ‌کورن' },\n  { emoji: '⚽', name: 'فوتبال' },\n  { emoji: '🏀', name: 'بسکتبال' },\n];\n\n// تابع ساخت dropdown از ری‌اکشن‌ها\nfunction buildReactionOptions(selected){\n  return TELEGRAM_REACTIONS.map(r => `<option value=\"${r.emoji}\" ${selected===r.emoji?'selected':''}>${r.emoji} ${r.name}</option>`).join('');\n}\n\nfunction addReactionRule(prefix, opts = {}){\n  const container = $(`#${prefix}_viral_rules`);\n  if(!container) return;\n  const div = document.createElement('div');\n  div.className = 'reaction-rule';\n  const selectedEmoji = opts.emoji || '🔥';\n  const thresholdVal = opts.threshold || 100;\n  div.innerHTML = `\n    <select class=\"vr-emoji\">\n      ${buildReactionOptions(selectedEmoji)}\n    </select>\n    <span style=\"color:var(--muted);font-size:.75rem;white-space:nowrap\">≥</span>\n    <input type=\"number\" placeholder=\"100\" value=\"${thresholdVal}\" class=\"vr-threshold\" min=\"0\" />\n    <button class=\"remove-rule\" onclick=\"this.parentElement.remove()\" title=\"حذف\">✕</button>\n  `;\n  container.appendChild(div);\n}\n\nfunction getViralRules(prefix){\n  const container = $(`#${prefix}_viral_rules`);\n  if(!container) return [];\n  const rules = [];\n  container.querySelectorAll('.reaction-rule').forEach(r=>{\n    const emoji = r.querySelector('.vr-emoji').value.trim();\n    const threshold = parseInt(r.querySelector('.vr-threshold').value, 10) || 0;\n    if(emoji && !isNaN(threshold) && threshold >= 0) rules.push({emoji, threshold});\n  });\n  return rules;\n}\n\nasync function saveAddSource(){\n  try{\n    const body = {\n      channels: $('#m_channel').value,\n      target_chat_id: $('#m_target').value,\n      target_topic_id: $('#m_topic').value || null,\n      mode: $('#m_mode').value,\n      topic: $('#m_topic_name').value || '',\n      block_ads: $('#m_block_ads').checked,\n      ad_threshold: parseInt($('#m_ad_threshold').value, 10) || 70,\n    };\n    if(body.mode === 'deep'){\n      const dt = $('#m_deep_type').value;\n      body.deep_scoring = dt === 'scoring' ? 1 : 0;\n      if(dt === 'scoring'){\n        body.keywords_main = $('#m_main').value.split(',').map(s=>s.trim()).filter(Boolean);\n        body.keywords_complementary = $('#m_comp').value.split(',').map(s=>s.trim()).filter(Boolean);\n        body.keywords_peripheral = $('#m_periph').value.split(',').map(s=>s.trim()).filter(Boolean);\n        body.deep_threshold = parseInt($('#m_deep_threshold').value, 10) || 50;\n      } else {\n        body.keywords_positive = $('#m_pos').value.split(',').map(s=>s.trim()).filter(Boolean);\n        body.keywords_negative = $('#m_neg').value.split(',').map(s=>s.trim()).filter(Boolean);\n        body.every_mode = $('#m_every').checked;\n      }\n    }\n    if(body.mode === 'viral'){\n      body.viral_threshold = parseInt($('#m_viral_threshold').value, 10) || 1000;\n      body.viral_reactions = getViralRules('m');\n    }\n    await api('sources', {method:'POST', body:JSON.stringify(body)});\n    toast('منبع افزوده شد');\n    closeModal();\n    loadSources();\n  }catch(e){toast(e.message, false)}\n}\n\n// ─── Edit Modal ───\nfunction openEditModal(id){\n  const s = SOURCES.find(x=>x.id===id); if(!s) return;\n  const isScoring = s.deep_scoring == 1;\n  const pos = safeJson(s.keywords_positive, []);\n  const neg = safeJson(s.keywords_negative, []);\n  const main = safeJson(s.keywords_main, []);\n  const comp = safeJson(s.keywords_complementary, []);\n  const periph = safeJson(s.keywords_peripheral, []);\n  const viralRules = safeJson(s.viral_reactions, []);\n\n  $('#modalTitle').textContent = `✏️ ویرایش منبع #${s.id}`;\n  $('#modalContent').innerHTML = `\n    <div class=\"field\"><label>کانال</label><input id=\"e_channel\" value=\"${esc(s.channel)}\" /></div>\n    <div class=\"field\"><label>موضوع (برای AI)</label><input id=\"e_topic_name\" value=\"${esc(s.topic||'')}\" placeholder=\"اخبار رمزارز...\" /></div>\n    <div class=\"field\"><label>حالت</label><select id=\"e_mode\" onchange=\"toggleEMode()\">\n      <option value=\"forward\" ${s.mode==='forward'?'selected':''}>📤 فوروارد</option>\n      <option value=\"deep\" ${s.mode==='deep'?'selected':''}>🔎 عمیق</option>\n      <option value=\"viral\" ${s.mode==='viral'?'selected':''}>👁 وایرال</option>\n    </select></div>\n\n    <div id=\"eDeep\" style=\"display:${s.mode==='deep'?'block':'none'}\">\n      <div class=\"field\"><label>نوع Deep</label><select id=\"e_deep_type\" onchange=\"toggleEDeepFields()\">\n        <option value=\"classic\" ${!isScoring?'selected':''}>📋 Deep Classic</option>\n        <option value=\"scoring\" ${isScoring?'selected':''}>📊 Deep Scoring</option>\n      </select></div>\n      <div id=\"eDeepClassicFields\" style=\"display:${!isScoring?'block':'none'}\">\n        <div class=\"field\"><label>کلیدواژه مثبت‌کننده (با کاما)</label><input id=\"e_pos\" value=\"${esc(pos.join(', '))}\" /></div>\n        <div class=\"field\"><label>کلیدواژه منفی‌کننده (با کاما)</label><input id=\"e_neg\" value=\"${esc(neg.join(', '))}\" /></div>\n        <div class=\"field\"><label><input type=\"checkbox\" id=\"e_every\" ${s.every_mode?'checked':''} /> every (AND)</label></div>\n      </div>\n      <div id=\"eDeepScoringFields\" style=\"display:${isScoring?'block':'none'}\">\n        <div class=\"field\"><label>کلیدواژه اصلی — +۴۰</label><input id=\"e_main\" value=\"${esc(main.join(', '))}\" /></div>\n        <div class=\"field\"><label>کلیدواژه مکمل — +۱۵</label><input id=\"e_comp\" value=\"${esc(comp.join(', '))}\" /></div>\n        <div class=\"field\"><label>کلیدواژه پیرامونی — -۳۰</label><input id=\"e_periph\" value=\"${esc(periph.join(', '))}\" /></div>\n        <div class=\"field\"><label>آستانه امتیاز Deep</label><input id=\"e_deep_threshold\" type=\"number\" value=\"${s.deep_threshold||50}\" /></div>\n      </div>\n    </div>\n\n    <div id=\"eViral\" style=\"display:${s.mode==='viral'?'block':'none'}\">\n      <div class=\"field\">\n        <label>قوانین چند ری‌اکشن</label>\n        <div class=\"reaction-rules\" id=\"e_viral_rules\"></div>\n        <button class=\"btn btn-ghost btn-sm\" style=\"margin-top:.5rem\" onclick=\"addReactionRule('e')\">➕ افزودن ری‌اکشن</button>\n      </div>\n      <div class=\"field\"><label>آستانه مجموع ری‌اکشن‌ها</label><input id=\"e_viral_threshold\" type=\"number\" value=\"${s.viral_threshold||1000}\" />\n      <div class=\"hint\">اگه rule خاص تنظیم نکنید، مجموع همه ری‌اکشن‌ها از این عدد عبور کند → ارسال.</div></div>\n    </div>\n\n    <div class=\"field\"><label>مقصد (chat_id)</label><input id=\"e_target\" value=\"${esc(s.target_chat_id)}\" /></div>\n    <div class=\"field\"><label>تاپیک</label><input id=\"e_topic\" value=\"${esc(s.target_topic_id||'')}\" /></div>\n    <div class=\"field\"><label>آستانه Anti-Ad</label><input id=\"e_ad_threshold\" type=\"number\" value=\"${s.ad_threshold||70}\" /></div>\n    <div class=\"field\"><label><input type=\"checkbox\" id=\"e_block_ads\" ${s.block_ads!==0?'checked':''} /> 🛡 ضد تبلیغات</label></div>\n    <div class=\"field\"><label><input type=\"checkbox\" id=\"e_active\" ${s.active?'checked':''} /> فعال</label></div>\n  `;\n\n  // اضافه کردن قوانین viral موجود (یا یک قانون پیش‌فرض اگه خالی است)\n  if(s.mode === 'viral'){\n    setTimeout(()=>{\n      if(viralRules.length){\n        viralRules.forEach(r=>{\n          addReactionRule('e', {emoji: r.emoji, threshold: r.threshold});\n        });\n      } else {\n        // پیش‌فرض: یک قانون خالی\n        addReactionRule('e');\n      }\n    }, 50);\n  }\n\n  $('#modalActions').innerHTML = `<button class=\"btn btn-ghost\" onclick=\"closeModal()\">انصراف</button><button class=\"btn btn-primary\" onclick=\"saveEditSource(${id})\">ذخیره</button>`;\n  $('#modal').classList.add('active');\n}\n\nfunction toggleEMode(){\n  const m = $('#e_mode').value;\n  $('#eDeep').style.display = m==='deep' ? 'block' : 'none';\n  $('#eViral').style.display = m==='viral' ? 'block' : 'none';\n  if(m==='deep') toggleEDeepFields();\n}\nfunction toggleEDeepFields(){\n  const dt = $('#e_deep_type')?.value || 'classic';\n  if($('#eDeepScoringFields')) $('#eDeepScoringFields').style.display = dt==='scoring' ? 'block' : 'none';\n  if($('#eDeepClassicFields')) $('#eDeepClassicFields').style.display = dt==='classic' ? 'block' : 'none';\n}\n\nasync function saveEditSource(id){\n  try{\n    const body = {\n      channel: $('#e_channel').value,\n      target_chat_id: $('#e_target').value,\n      target_topic_id: $('#e_topic').value || null,\n      mode: $('#e_mode').value,\n      topic: $('#e_topic_name').value || '',\n      block_ads: $('#e_block_ads').checked,\n      active: $('#e_active').checked,\n      ad_threshold: parseInt($('#e_ad_threshold').value, 10) || 70,\n    };\n    if(body.mode === 'deep'){\n      const dt = $('#e_deep_type').value;\n      body.deep_scoring = dt === 'scoring' ? 1 : 0;\n      if(dt === 'scoring'){\n        body.keywords_main = $('#e_main').value.split(',').map(s=>s.trim()).filter(Boolean);\n        body.keywords_complementary = $('#e_comp').value.split(',').map(s=>s.trim()).filter(Boolean);\n        body.keywords_peripheral = $('#e_periph').value.split(',').map(s=>s.trim()).filter(Boolean);\n        body.deep_threshold = parseInt($('#e_deep_threshold').value, 10) || 50;\n        body.keywords_positive = [];\n        body.keywords_negative = [];\n      } else {\n        body.keywords_positive = $('#e_pos').value.split(',').map(s=>s.trim()).filter(Boolean);\n        body.keywords_negative = $('#e_neg').value.split(',').map(s=>s.trim()).filter(Boolean);\n        body.every_mode = $('#e_every').checked;\n        body.keywords_main = [];\n        body.keywords_complementary = [];\n        body.keywords_peripheral = [];\n      }\n    }\n    if(body.mode === 'viral'){\n      body.viral_threshold = parseInt($('#e_viral_threshold').value, 10) || 1000;\n      body.viral_reactions = getViralRules('e');\n    }\n    await api('sources/'+id, {method:'PUT', body:JSON.stringify(body)});\n    toast('ذخیره شد');\n    closeModal();\n    loadSources();\n  }catch(e){toast(e.message, false)}\n}\n\nasync function delSource(id){\n  if(!confirm('حذف شود؟')) return;\n  try{await api('sources/'+id, {method:'DELETE'});toast('حذف شد');loadSources()}catch(e){toast(e.message, false)}\n}\nasync function scanSource(id){\n  try{toast('اسکن آغاز شد...');const r=await api('scan', {method:'POST', body:JSON.stringify({source_id:id})});toast(`✅ ${r.sent||0} ارسال / ${r.scanned||0} اسکن`)}catch(e){toast(e.message, false)}\n}\n\n// ─── Bulk Edit ───\nfunction openBulkEdit(){\n  if(!SOURCES.length){toast('منبعی نیست', false);return}\n  $('#modalTitle').textContent = '🔧 ویرایش گروهی';\n  $('#modalContent').innerHTML = `\n    <div class=\"field\">\n      <label>انتخاب منابع</label>\n      <div class=\"check-list\">${SOURCES.map(s=>`<label class=\"check-item\"><input type=\"checkbox\" value=\"${s.id}\" class=\"bulk-chk\" /> #${s.id} @${esc(s.channel)} (${s.mode})</label>`).join('')}</div>\n    </div>\n    <div class=\"field\"><label>حالت جدید (اختیاری)</label><select id=\"b_mode\"><option value=\"\">— تغییر نده —</option><option value=\"forward\">فوروارد</option><option value=\"deep\">عمیق</option><option value=\"viral\">وایرال</option></select></div>\n    <div class=\"field\"><label>Deep Classic — مثبت‌کننده (اختیاری)</label><input id=\"b_pos\" placeholder=\"با کاما\" /></div>\n    <div class=\"field\"><label>Deep Classic — منفی‌کننده (اختیاری)</label><input id=\"b_neg\" placeholder=\"با کاما\" /></div>\n    <div class=\"field\"><label>Deep Scoring — اصلی (اختیاری)</label><input id=\"b_main\" placeholder=\"با کاما\" /></div>\n    <div class=\"field\"><label>Deep Scoring — مکمل (اختیاری)</label><input id=\"b_comp\" placeholder=\"با کاما\" /></div>\n    <div class=\"field\"><label>Deep Scoring — پیرامونی (اختیاری)</label><input id=\"b_periph\" placeholder=\"با کاما\" /></div>\n    <div class=\"field\"><label>آستانه Deep (اختیاری)</label><input id=\"b_deep_threshold\" type=\"number\" placeholder=\"50\" /></div>\n    <div class=\"field\"><label>آستانه مجموع ری‌اکشن‌ها (اختیاری)</label><input id=\"b_viral\" type=\"number\" placeholder=\"مثلا 1000\" />\n    <div class=\"hint\">اگه rule خاص تنظیم نکنید، مجموع ری‌اکشن‌ها از این عدد عبور کند → ارسال.</div></div>\n    <div class=\"field\"><label>آستانه Anti-Ad (اختیاری)</label><input id=\"b_ad_threshold\" type=\"number\" placeholder=\"70\" /></div>\n    <div class=\"field\"><label>🛡 ضد تبلیغات (اختیاری)</label><select id=\"b_block_ads\"><option value=\"\">— تغییر نده —</option><option value=\"1\">🟢 روشن</option><option value=\"0\">🔴 خاموش</option></select></div>\n    <div class=\"field\"><label>وضعیت (اختیاری)</label><select id=\"b_active\"><option value=\"\">— تغییر نده —</option><option value=\"1\">فعال</option><option value=\"0\">غیرفعال</option></select></div>\n  `;\n  $('#modalActions').innerHTML = `<button class=\"btn btn-ghost\" onclick=\"closeModal()\">انصراف</button><button class=\"btn btn-primary\" onclick=\"applyBulk()\">اعمال</button>`;\n  $('#modal').classList.add('active');\n}\n\nasync function applyBulk(){\n  const ids = [...document.querySelectorAll('.bulk-chk:checked')].map(c=>parseInt(c.value,10));\n  if(!ids.length){toast('هیچ منبعی انتخاب نشد', false);return}\n  const body = {ids};\n  if($('#b_mode').value) body.mode = $('#b_mode').value;\n  if($('#b_pos').value) body.keywords_positive = $('#b_pos').value.split(',').map(s=>s.trim()).filter(Boolean);\n  if($('#b_neg').value) body.keywords_negative = $('#b_neg').value.split(',').map(s=>s.trim()).filter(Boolean);\n  if($('#b_main').value) body.keywords_main = $('#b_main').value.split(',').map(s=>s.trim()).filter(Boolean);\n  if($('#b_comp').value) body.keywords_complementary = $('#b_comp').value.split(',').map(s=>s.trim()).filter(Boolean);\n  if($('#b_periph').value) body.keywords_peripheral = $('#b_periph').value.split(',').map(s=>s.trim()).filter(Boolean);\n  if($('#b_deep_threshold').value) body.deep_threshold = parseInt($('#b_deep_threshold').value, 10);\n  if($('#b_viral').value) body.viral_threshold = parseInt($('#b_viral').value, 10);\n  if($('#b_ad_threshold').value) body.ad_threshold = parseInt($('#b_ad_threshold').value, 10);\n  if($('#b_block_ads').value !== '') body.block_ads = parseInt($('#b_block_ads').value, 10);\n  if($('#b_active').value !== '') body.active = parseInt($('#b_active').value, 10);\n  try{\n    const r = await api('sources-bulk-edit', {method:'POST', body:JSON.stringify(body)});\n    toast(`${r.updated} منبع ویرایش شد`);\n    closeModal();\n    loadSources();\n  }catch(e){toast(e.message, false)}\n}\n\n// ─── AI Pending ───\nasync function loadAIPending(){\n  try{\n    const d = await api('ai-pending');\n    const list = d.pending || [];\n    if(!list.length){\n      $('#aiPendingBody').innerHTML = '<div class=\"card\"><div class=\"empty\">✅ کلیدواژه pendingی وجود ندارد</div></div>';\n    } else {\n      $('#aiPendingBody').innerHTML = list.map(s=>{\n        const pos = s.pending_positive || [];\n        const neg = s.pending_negative || [];\n        const main = s.pending_main || [];\n        const comp = s.pending_complementary || [];\n        const periph = s.pending_peripheral || [];\n        const isScoring = main.length || comp.length || periph.length;\n\n        let kwHtml = '';\n        if(isScoring){\n          if(main.length) kwHtml += `<div style=\"color:var(--green);margin-bottom:.4rem;font-weight:600;font-size:.8rem\">✅ اصلی (+۴۰):</div>\n            <div class=\"kw-grid\" id=\"pending_main_${s.id}\">${main.map((k,i)=>`<span class=\"kw-badge kw-main selected\" onclick=\"togglePendingKw(${s.id},'main',${i},this)\">${esc(k)}</span>`).join('')}</div>`;\n          if(comp.length) kwHtml += `<div style=\"color:var(--purple);margin:.6rem 0 .4rem;font-weight:600;font-size:.8rem\">➕ مکمل (+۱۵):</div>\n            <div class=\"kw-grid\" id=\"pending_comp_${s.id}\">${comp.map((k,i)=>`<span class=\"kw-badge kw-comp selected\" onclick=\"togglePendingKw(${s.id},'comp',${i},this)\">${esc(k)}</span>`).join('')}</div>`;\n          if(periph.length) kwHtml += `<div style=\"color:var(--yellow);margin:.6rem 0 .4rem;font-weight:600;font-size:.8rem\">⚠️ پیرامونی (-۳۰):</div>\n            <div class=\"kw-grid\" id=\"pending_periph_${s.id}\">${periph.map((k,i)=>`<span class=\"kw-badge kw-periph selected\" onclick=\"togglePendingKw(${s.id},'periph',${i},this)\">${esc(k)}</span>`).join('')}</div>`;\n        } else {\n          if(pos.length) kwHtml += `<div style=\"color:var(--green);margin-bottom:.4rem;font-weight:600;font-size:.8rem\">✅ مثبت‌کننده:</div>\n            <div class=\"kw-grid\" id=\"pending_pos_${s.id}\">${pos.map((k,i)=>`<span class=\"kw-badge kw-pos selected\" onclick=\"togglePendingKw(${s.id},'pos',${i},this)\">${esc(k)}</span>`).join('')}</div>`;\n          if(neg.length) kwHtml += `<div style=\"color:var(--red);margin:.6rem 0 .4rem;font-weight:600;font-size:.8rem\">🚫 منفی‌کننده:</div>\n            <div class=\"kw-grid\" id=\"pending_neg_${s.id}\">${neg.map((k,i)=>`<span class=\"kw-badge kw-neg selected\" onclick=\"togglePendingKw(${s.id},'neg',${i},this)\">${esc(k)}</span>`).join('')}</div>`;\n        }\n\n        return `<div class=\"ai-pending-card\">\n          <div style=\"display:flex;justify-content:space-between;align-items:center;margin-bottom:.5rem;flex-wrap:wrap;gap:.3rem\">\n            <div><strong>@${esc(s.channel)}</strong> <span style=\"font-size:.75rem;color:var(--muted)\">📝 ${esc(s.topic||'—')}</span></div>\n            <span class=\"badge ${isScoring?'b-deep':'b-deep'}\">${isScoring?'Scoring':'Classic'}</span>\n          </div>\n          <div style=\"font-size:.8rem\">${kwHtml}</div>\n          <div style=\"display:flex;gap:.4rem;flex-wrap:wrap;margin-top:.75rem\">\n            <button class=\"btn btn-primary btn-sm\" onclick=\"applyAI(${s.id},'add')\">➕ اضافه</button>\n            <button class=\"btn btn-primary btn-sm\" onclick=\"applyAI(${s.id},'replace')\">🔄 جایگزین</button>\n            <button class=\"btn btn-danger btn-sm\" onclick=\"rejectAI(${s.id})\">❌ رد</button>\n          </div>\n        </div>`;\n      }).join('');\n    }\n    loadAIAnalyzeSources();\n  }catch(e){toast(e.message, false)}\n}\n\nfunction loadAIAnalyzeSources(){\n  const el = $('#aiAnalyzeSources');\n  if(!el) return;\n  if(!SOURCES.length){\n    el.innerHTML = '<div class=\"empty\">⏳ در حال بارگذاری منابع...</div>';\n    loadSources().then(()=>loadAIAnalyzeSources());\n    return;\n  }\n  const active = SOURCES.filter(s=>s.active && s.mode === 'deep');\n  if(!active.length){\n    el.innerHTML = '<div class=\"empty\">منبع فعالی در حالت Deep موجود نیست (AI فقط برای Deep modes)</div>';\n    return;\n  }\n  el.innerHTML = active.map(s=>`\n    <div class=\"check-item\" onclick=\"selectAISource(${s.id})\" style=\"cursor:pointer;${aiSelectedSource===s.id?'background:var(--card-hover)':''}\">\n      <input type=\"radio\" name=\"ai_source\" value=\"${s.id}\" ${aiSelectedSource===s.id?'checked':''} />\n      <div style=\"flex:1\">\n        <div>@${esc(s.channel)}</div>\n        <div style=\"font-size:.7rem;color:var(--muted)\">${esc(s.topic||'بدون موضوع')} • ${s.deep_scoring==1?'Scoring':'Classic'}</div>\n      </div>\n    </div>\n  `).join('');\n}\nfunction selectAISource(id){aiSelectedSource = id; loadAIAnalyzeSources()}\n\nasync function triggerAIAnalyze(){\n  if(!aiSelectedSource){toast('ابتدا یک منبع انتخاب کنید', false);return}\n  if(aiAnalyzing){toast('تحلیل قبلی هنوز در حال انجام است...', false);return}\n  aiAnalyzing = true;\n  const btn = event?.target;\n  if(btn){btn.disabled=true;btn.textContent='⏳ در حال تحلیل...'}\n  const statusEl = $('#aiAnalyzeStatus');\n  if(statusEl) statusEl.innerHTML = '<div style=\"padding:1rem;text-align:center;color:var(--accent)\">🤖 در حال تحلیل... ۵-۳۰ ثانیه</div>';\n  toast('🤖 تحلیل آغاز شد');\n  try{\n    const r = await api('ai-analyze', {method:'POST', body:JSON.stringify({source_id:aiSelectedSource})});\n    if(statusEl){\n      if(r.ok){\n        const total = (r.posKeywords?.length||0) + (r.negKeywords?.length||0) + (r.mainKeywords?.length||0) + (r.compKeywords?.length||0) + (r.periphKeywords?.length||0);\n        statusEl.innerHTML = `<div style=\"padding:1rem;text-align:center;color:var(--green)\">✅ ${total} کلیدواژه استخراج شد — به ادمین ارسال شد</div>`;\n      } else {\n        statusEl.innerHTML = `<div style=\"padding:1rem;text-align:center;color:var(--red)\">❌ ${esc(r.error||'خطا')}</div>`;\n      }\n    }\n    loadAIPending();\n  }catch(e){\n    if(statusEl) statusEl.innerHTML = `<div style=\"padding:1rem;text-align:center;color:var(--red)\">❌ ${esc(e.message)}</div>`;\n    toast(e.message, false);\n  }finally{\n    aiAnalyzing = false;\n    if(btn){btn.disabled=false;btn.textContent='🤖 شروع تحلیل'}\n  }\n}\n\nfunction togglePendingKw(sourceId, type, idx, el){\n  const key = `${sourceId}_${type}_${idx}`;\n  if(!pendingSelection[key]) pendingSelection[key] = true;\n  pendingSelection[key] = !pendingSelection[key];\n  if(pendingSelection[key]) el.classList.replace('deselected','selected');\n  else el.classList.replace('selected','deselected');\n}\n\nasync function applyAI(id, mode){\n  const collect = (containerId) => {\n    const badges = document.querySelectorAll(`#${containerId} .kw-badge`);\n    const result = [];\n    badges.forEach(el => {\n      if(el.classList.contains('selected')) result.push(el.textContent.trim());\n    });\n    return result;\n  };\n  const body = {source_id: id, mode};\n  if(document.getElementById(`pending_main_${id}`)) body.main = collect(`pending_main_${id}`);\n  if(document.getElementById(`pending_comp_${id}`)) body.complementary = collect(`pending_comp_${id}`);\n  if(document.getElementById(`pending_periph_${id}`)) body.peripheral = collect(`pending_periph_${id}`);\n  if(document.getElementById(`pending_pos_${id}`)) body.positive = collect(`pending_pos_${id}`);\n  if(document.getElementById(`pending_neg_${id}`)) body.negative = collect(`pending_neg_${id}`);\n  const total = (body.main||[]).length + (body.complementary||[]).length + (body.peripheral||[]).length + (body.positive||[]).length + (body.negative||[]).length;\n  if(!total){toast('حداقل یک کلیدواژه انتخاب کنید', false);return}\n  try{\n    await api('ai-apply-manual', {method:'POST', body:JSON.stringify(body)});\n    toast(`${total} کلیدواژه ${mode==='add'?'اضافه':'جایگزین'} شد`);\n    loadAIPending();\n    loadSources();\n  }catch(e){toast(e.message, false)}\n}\nasync function rejectAI(id){\n  if(!confirm('رد شود؟')) return;\n  try{await api('ai-reject', {method:'POST', body:JSON.stringify({source_id:id})});toast('رد شد');loadAIPending()}catch(e){toast(e.message, false)}\n}\n\n// ─── Report ───\nasync function loadReport(){\n  try{\n    const d = await api('report');\n    let html = `<div style=\"margin-bottom:1rem;font-size:.85rem;color:var(--muted)\">📈 مجموع ارسال ۲۴ ساعت: <strong style=\"color:var(--accent)\">${d.total||0}</strong></div>`;\n    const topics = Object.entries(d.byTopic||{});\n    if(topics.length){\n      html += '<div style=\"margin-bottom:1rem\"><strong>📂 به تفکیک موضوع:</strong></div>';\n      for(const [topic, td] of topics){\n        const posts = td.posts||[];\n        const chCount = td.channelCount||1;\n        html += `<div class=\"card\" style=\"margin-bottom:.75rem\">\n          <div style=\"display:flex;justify-content:space-between;margin-bottom:.5rem\">\n            <strong>${esc(topic)}</strong>\n            <span style=\"color:var(--muted);font-size:.75rem\">${posts.length} پست • ${chCount} کانال</span>\n          </div>\n          ${posts.slice(0,5).map(p=>`<div style=\"font-size:.78rem;padding:.25rem 0;border-top:1px solid var(--border)\">\n            <a href=\"${esc(p.link)}\" target=\"_blank\">@${esc(p.channel)}</a> — ${esc((p.text||'').slice(0,80))} ${p.views?`👁 ${p.views}`:''}\n          </div>`).join('')}\n        </div>`;\n      }\n    }\n    if(d.viral?.length){\n      html += '<div style=\"margin:1rem 0 .5rem\"><strong>🔥 پست‌های وایرال:</strong></div>';\n      html += d.viral.slice(0,10).map(p=>`<div style=\"font-size:.78rem;padding:.25rem 0\">\n        <a href=\"${esc(p.link)}\" target=\"_blank\">@${esc(p.channel)}</a> — 👁 ${p.views} — ${esc((p.text||'').slice(0,60))}\n      </div>`).join('');\n    }\n    if(!topics.length && !d.viral?.length){\n      html = '<div class=\"card\"><div class=\"empty\">📭 در ۲۴ ساعت گذشته پستی ارسال نشده</div></div>';\n    }\n    $('#reportBody').innerHTML = html;\n    $('#reportMeta').textContent = `${d.total||0} پست • ${topics.length} موضوع • ${d.viral?.length||0} وایرال`;\n  }catch(e){toast(e.message, false)}\n}\nasync function triggerReport(){\n  try{toast('در حال تولید...');await api('report-trigger', {method:'POST'});toast('✅ گزارش به ادمین ارسال شد')}catch(e){toast(e.message, false)}\n}\n\n// ─── Logs ───\nasync function loadLogs(){\n  try{\n    const action = $('#logActionFilter')?.value || '';\n    const q = ($('#logSearch')?.value || '').toLowerCase();\n    let url = 'logs?limit=100';\n    if(action) url += `&action=${action}`;\n    const d = await api(url);\n    let list = d.logs || [];\n    if(q) list = list.filter(l => (l.detail||'').toLowerCase().includes(q) || (l.post_text||'').toLowerCase().includes(q));\n    $('#logsCount').textContent = `(${list.length} رکورد)`;\n    if(!list.length){\n      $('#logsBody').innerHTML = '<div class=\"card\"><div class=\"empty\">📭 لاگی یافت نشد</div></div>';\n      return;\n    }\n    $('#logsBody').innerHTML = list.map(l=>{\n      let breakdown = '';\n      try { breakdown = formatBreakdown(l.breakdown); } catch {}\n      const hasExpandableContent = !!(breakdown || l.ai_raw);\n      const expandableClass = hasExpandableContent ? 'expandable' : 'no-expand';\n      return `<div class=\"log-entry ${expandableClass}\"${hasExpandableContent?` onclick=\"this.classList.toggle('expanded')\"`:''}>\n        <div class=\"log-header\">\n          <div>\n            <span class=\"log-action\">${esc(l.action)}</span>\n            <span class=\"log-badge ${l.action}\">${actionLabel(l.action)}</span>\n            ${l.ad_score?`<span style=\"font-size:.7rem;color:var(--muted);margin-inline-start:.3rem\">🛡 ${l.ad_score}</span>`:''}\n            ${l.ai_provider?`<span style=\"font-size:.7rem;color:var(--purple);margin-inline-start:.3rem\">🤖 ${esc(l.ai_provider)}</span>`:''}\n            ${hasExpandableContent?'<span style=\"font-size:.7rem;color:var(--accent);margin-inline-start:.3rem;opacity:.7\">▾ جزئیات</span>':''}\n          </div>\n          <span class=\"log-time\">${fmtDate(l.created_at)}</span>\n        </div>\n        <div class=\"log-detail\">${esc(l.detail||'')}</div>\n        ${l.source_id?`<div style=\"font-size:.7rem;color:var(--muted);margin-top:.2rem\">منبع #${l.source_id}${l.post_link?` • <a href=\"${esc(l.post_link)}\" target=\"_blank\" onclick=\"event.stopPropagation()\">لینک</a>`:''}</div>`:''}\n        ${breakdown?`<div class=\"log-breakdown\">${esc(breakdown)}</div>`:''}\n        ${l.ai_raw?`<div class=\"log-ai-raw\">${esc(l.ai_raw)}</div>`:''}\n        ${!hasExpandableContent?'<div style=\"font-size:.7rem;color:var(--muted);margin-top:.3rem;font-style:italic\">این لاگ قدیمی است و فیلد breakdown ندارد (قبل از آپدیت ربات ساخته شده).</div>':''}\n      </div>`;\n    }).join('');\n    // به‌روزرسانی hint بر اساس محتوا\n    const hintEl = $('#logsHint');\n    if(hintEl){\n      const hasExpandable = list.some(l => {\n        let bd = '';\n        try { bd = formatBreakdown(l.breakdown); } catch {}\n        return bd || l.ai_raw;\n      });\n      hintEl.textContent = hasExpandable\n        ? '💡 روی لاگ‌های با علامت «▾ جزئیات» کلیک کنید تا breakdown نمایش داده شود'\n        : '⚠️ لاگ‌های فعلی قدیمی هستند و breakdown ندارند. پس از آپدیت و اسکن جدید، لاگ‌های جدید با جزئیات نمایش داده می‌شوند.';\n    }\n  }catch(e){toast(e.message, false)}\n}\n\nfunction actionLabel(a){\n  return {\n    sent:'ارسال', skipped:'رد', scanned:'اسکن', error:'خطا',\n    ai_analyze:'تحلیل AI', ai_raw:'پاسخ AI', ai_approve:'تأیید AI',\n    daily_report:'گزارش', report_ad:'گزارش تبلیغ', restore:'بازیابی',\n    decision:'تصمیم',\n  }[a] || a;\n}\n\nfunction formatBreakdown(b){\n  if(!b) return '';\n  if(typeof b === 'string'){\n    try { b = JSON.parse(b); } catch { return b; }\n  }\n  if(!b || typeof b !== 'object') return '';\n\n  const lines = [];\n\n  // ── Deep Scoring breakdown ──\n  if(b.type === 'deep_scoring' || Array.isArray(b)){\n    let total = 0;\n    const arr = Array.isArray(b) ? b : (b.items || b.breakdown || []);\n    if(Array.isArray(arr)){\n      for(const item of arr){\n        const sign = item.value >= 0 ? '+' : '';\n        const label = {main:'اصلی', main_position:'موقعیت اصلی', complementary:'مکمل', peripheral:'پیرامونی', media_bonus:'رسانه', length_bonus:'طول متن'}[item.type] || item.type;\n        lines.push(`${label} «${item.kw||''}» ${sign}${item.value}`);\n        total += item.value || 0;\n      }\n    }\n    if(b.threshold !== undefined){\n      lines.push('────────────────');\n      lines.push(`امتیاز نهایی: ${b.score !== undefined ? b.score : total}`);\n      lines.push(`حداقل امتیاز: ${b.threshold}`);\n      const passed = (b.score !== undefined ? b.score : total) >= b.threshold;\n      lines.push(passed ? '✓ ارسال شد' : '✗ رد شد');\n    }\n    // اضافه کردن Anti-Ad breakdown\n    if(b.ad_breakdown){\n      lines.push('');\n      lines.push(...formatAdBreakdown(b.ad_breakdown));\n    }\n    return lines.join('\\n');\n  }\n\n  // ── Deep Classic breakdown ──\n  if(b.type === 'deep_classic'){\n    if(b.positive_match?.length) lines.push(`مثبت‌کننده: ${b.positive_match.join('، ')}`);\n    if(b.negative_match?.length) lines.push(`منفی‌کننده: ${b.negative_match.join('، ')}`);\n    if(b.logic) lines.push(`منطق: ${b.logic}`);\n    // اضافه کردن Anti-Ad breakdown\n    if(b.ad_breakdown){\n      lines.push('');\n      lines.push(...formatAdBreakdown(b.ad_breakdown));\n    }\n    return lines.join('\\n');\n  }\n\n  // ── Viral breakdown ──\n  if(b.type === 'viral' || b.viral_rules){\n    if(b.viral_rules?.length){\n      for(const r of b.viral_rules) lines.push(`${r.emoji} ${r.count}/${r.threshold} ${r.passed?'✓':'✗'}`);\n    } else if(b.total_count !== undefined){\n      lines.push(`مجموع ری‌اکشن: ${b.total_count}/${b.threshold}`);\n    }\n    if(b.failed_rule) lines.push(`رد به دلیل: ${b.failed_rule.emoji} ${b.failed_rule.count}/${b.failed_rule.threshold}`);\n    // اضافه کردن Anti-Ad breakdown\n    if(b.ad_breakdown){\n      lines.push('');\n      lines.push(...formatAdBreakdown(b.ad_breakdown));\n    }\n    return lines.join('\\n');\n  }\n\n  // ── Forward ──\n  if(b.type === 'forward'){\n    if(b.ad_breakdown){\n      lines.push('Forward — همیشه ارسال');\n      lines.push(...formatAdBreakdown(b.ad_breakdown));\n      return lines.join('\\n');\n    }\n    return 'Forward — همیشه ارسال';\n  }\n\n  return JSON.stringify(b, null, 2);\n}\n\n// ─── فرمت Anti-Ad breakdown (طبق سند: بخش‌به‌بخش) ───\nfunction formatAdBreakdown(ad){\n  if(!ad) return [];\n  const lines = ['🛡 Anti-Ad:'];\n  // reasons آرایه‌ای از امتیازدهی بخش‌به‌بخش است\n  if(ad.reasons && Array.isArray(ad.reasons)){\n    for(const r of ad.reasons){\n      lines.push(`  ${r}`);\n    }\n  }\n  // thresholdها\n  if(ad.threshold_block !== undefined){\n    lines.push(`  ────────────────`);\n    lines.push(`  آستانه Block: ${ad.threshold_block}`);\n    lines.push(`  آستانه Quarantine: ${ad.threshold_quarantine}`);\n  }\n  return lines;\n}\n\nfunction toggleLogAutoRefresh(){\n  if(logAutoRefreshTimer){clearInterval(logAutoRefreshTimer);logAutoRefreshTimer=null;return}\n  if($('#logAutoRefresh').checked){\n    logAutoRefreshTimer = setInterval(loadLogs, 30000);\n  }\n}\n\n// ─── Quarantine ───\nasync function loadQuarantine(){\n  try{\n    const d = await api('quarantine?status=pending');\n    const list = d.items || [];\n    if(!list.length){\n      $('#quarantineBody').innerHTML = '<div class=\"card\"><div class=\"empty\">✅ پست قرنطینه‌ای در انتظار نیست</div></div>';\n      return;\n    }\n    $('#quarantineBody').innerHTML = list.map(q=>`\n      <div class=\"card\" style=\"margin-bottom:.5rem\">\n        <div style=\"display:flex;justify-content:space-between;margin-bottom:.5rem;flex-wrap:wrap;gap:.3rem\">\n          <div><strong>@${esc(q.channel)}</strong> <span style=\"color:var(--muted);font-size:.75rem\">${fmtDate(q.created_at)}</span></div>\n          <span class=\"badge b-warn\">امتیاز: ${q.score||0}</span>\n        </div>\n        <div style=\"font-size:.8rem;margin-bottom:.5rem\">${esc((q.post_text||'').slice(0,300))}</div>\n        <div style=\"display:flex;gap:.3rem;flex-wrap:wrap\">\n          <a class=\"btn btn-ghost btn-sm\" href=\"${esc(q.post_link)}\" target=\"_blank\">🔗 مشاهده</a>\n          <button class=\"btn btn-danger btn-sm\" onclick=\"quarantineAction(${q.id},'ad')\">❌ تبلیغ</button>\n          <button class=\"btn btn-primary btn-sm\" onclick=\"quarantineAction(${q.id},'clean')\">✅ پاک</button>\n        </div>\n      </div>\n    `).join('');\n  }catch(e){toast(e.message, false)}\n}\nasync function quarantineAction(id, action){\n  try{await api('quarantine', {method:'POST', body:JSON.stringify({id, action})});toast(action==='ad'?'تبلیغ تأیید شد':'پاک تأیید شد');loadQuarantine()}catch(e){toast(e.message, false)}\n}\n\n// ─── Ad Weights ───\nasync function loadAdWeights(){\n  try{\n    const d = await api('ad-weights?limit=100');\n    const list = d.items || [];\n    if(!list.length){\n      $('#adWeightsBody').innerHTML = '<tr><td colspan=\"6\" class=\"empty\">📭 وزنی ثبت نشده</td></tr>';\n      return;\n    }\n    $('#adWeightsBody').innerHTML = list.map(w=>`<tr>\n      <td><code>${esc(w.token)}</code></td>\n      <td><span class=\"badge b-deep\">${esc(w.type)}</span></td>\n      <td><strong>${w.weight}</strong></td>\n      <td>${w.hits||0}</td>\n      <td>${w.auto?'🤖':'👤'}</td>\n      <td><button class=\"icon-btn del\" onclick=\"delAdWeight('${esc(w.token)}')\">🗑</button></td>\n    </tr>`).join('');\n  }catch(e){toast(e.message, false)}\n}\nasync function addAdWeight(){\n  const token = $('#adwToken').value.trim().toLowerCase();\n  if(!token){toast('توکن را وارد کنید', false);return}\n  try{\n    await api('ad-weights', {method:'POST', body:JSON.stringify({token, type:$('#adwType').value, weight:parseInt($('#adwWeight').value,10)||30})});\n    toast('افزوده شد');\n    $('#adwToken').value = '';\n    loadAdWeights();\n  }catch(e){toast(e.message, false)}\n}\nasync function delAdWeight(token){\n  try{await api('ad-weights', {method:'DELETE', body:JSON.stringify({token})});toast('حذف شد');loadAdWeights()}catch(e){toast(e.message, false)}\n}\n\n// ─── Admins ───\nasync function loadAdmins(){\n  try{\n    const d = await api('admins');\n    const mainUserPart = d.main_username ? ` <span style=\"color:var(--accent);font-size:.8rem\">(@${esc(d.main_username)})</span>` : '';\n    const mainNamePart = d.main_name ? ` — <strong>${esc(d.main_name)}</strong>${mainUserPart}` : '';\n    $('#mainAdmin').innerHTML = `<div style=\"display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.5rem\">\n      <div><span class=\"badge b-on\">🟢 ادمین اصلی</span> <code style=\"font-size:.9rem\">${esc(d.main)}</code>${mainNamePart}</div>\n      <span style=\"font-size:.7rem;color:var(--green)\">Full Access</span>\n    </div>`;\n    const list = d.admins || [];\n    if(!list.length){\n      $('#adminsBody').innerHTML = '<tr><td colspan=\"4\" class=\"empty\">ادمین فرعی وجود ندارد</td></tr>';\n      return;\n    }\n    $('#adminsBody').innerHTML = list.map(a=>{\n      const perms = typeof a.permissions === 'string' ? safeJson(a.permissions, {}) : (a.permissions || {});\n      const permCount = Object.values(perms).filter(v=>v).length;\n      const displayName = a.name ? esc(a.name) : '';\n      const userPart = a.username ? `<span style=\"color:var(--accent);font-size:.75rem\">@${esc(a.username)}</span>` : '';\n      return `<tr>\n        <td>\n          <div style=\"display:flex;flex-direction:column;gap:.15rem\">\n            <div style=\"font-weight:600;display:flex;align-items:center;gap:.4rem\">\n              <span>${displayName || '—'}</span>\n              ${userPart}\n            </div>\n            <code style=\"font-size:.75rem;color:var(--muted)\">${esc(a.user_id)}</code>\n          </div>\n        </td>\n        <td style=\"font-size:.75rem\">${esc(a.added_by||'—')}</td>\n        <td><span class=\"badge b-on\">${permCount}/۱۲ فعال</span></td>\n        <td>\n          <button class=\"icon-btn\" title=\"دسترسی‌ها\" onclick=\"openPermissions(${a.user_id})\">⚙️</button>\n          <button class=\"icon-btn del\" onclick=\"delAdmin(${a.user_id})\">🗑</button>\n        </td>\n      </tr>`;\n    }).join('');\n  }catch(e){toast(e.message, false)}\n}\n\nfunction openAddAdmin(){\n  $('#modalTitle').textContent = '➕ افزودن ادمین فرعی';\n  $('#modalContent').innerHTML = `<div class=\"field\"><label>آیدی عددی کاربر</label><input id=\"newAdminId\" placeholder=\"123456789\" /></div>`;\n  $('#modalActions').innerHTML = `<button class=\"btn btn-ghost\" onclick=\"closeModal()\">انصراف</button><button class=\"btn btn-primary\" onclick=\"saveAdmin()\">افزودن</button>`;\n  $('#modal').classList.add('active');\n}\nasync function saveAdmin(){\n  const id = $('#newAdminId').value.trim();\n  if(!id){toast('آیدی را وارد کنید', false);return}\n  try{await api('admins', {method:'POST', body:JSON.stringify({user_id:id})});toast('ادمین افزوده شد');closeModal();loadAdmins()}catch(e){toast(e.message, false)}\n}\nasync function delAdmin(id){\n  if(!confirm('حذف شود؟'))return;\n  try{await api('admins/'+id, {method:'DELETE'});toast('حذف شد');loadAdmins()}catch(e){toast(e.message, false)}\n}\nfunction openPermissions(adminId){\n  toast('ویرایش دسترسی از طریق /setpermissions در تلگرام انجام می‌شود');\n}\n\n// ─── Backup ───\nasync function downloadBackup(){\n  try{\n    const d = await api('backup');\n    const blob = new Blob([JSON.stringify(d, null, 2)], {type:'application/json'});\n    const url = URL.createObjectURL(blob);\n    const a = document.createElement('a');\n    a.href = url;\n    a.download = `backup-${new Date().toISOString().slice(0,10)}.json`;\n    a.click();\n    URL.revokeObjectURL(url);\n    toast('✅ بکاپ دانلود شد');\n  }catch(e){toast(e.message, false)}\n}\nasync function doRestore(){\n  const file = $('#restoreFile').files[0];\n  if(!file){toast('فایل را انتخاب کنید', false);return}\n  if(!confirm('بازیابی باعث بازنویسی منابع و وزن‌ها می‌شود. ادامه؟'))return;\n  try{\n    const text = await file.text();\n    const data = JSON.parse(text);\n    const r = await api('restore', {method:'POST', body:JSON.stringify(data)});\n    toast(`✅ ${r.restored} منبع + ${r.weights||0} وزن بازیابی شد`);\n    loadSources();\n  }catch(e){toast(e.message, false)}\n}\n\n// ─── Modal helpers ───\nfunction closeModal(){$('#modal').classList.remove('active')}\ndocument.addEventListener('keydown', e=>{if(e.key==='Escape')closeModal()});\n\n// ─── Keyboard shortcut: Enter on login ───\ndocument.addEventListener('DOMContentLoaded', ()=>{\n  const loginInput = $('#loginWorker');\n  if(loginInput && !loginInput.value){\n    // Try to pre-fill from saved URL\n    if(localStorage.getItem('workerUrl')) loginInput.value = localStorage.getItem('workerUrl');\n  }\n});\n</script>\n</body>\n</html>\n";


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

    // پیش‌پاسخ CORS برای پنل
    if (request.method === 'OPTIONS') return cors(request);

    // ذخیره خودکار URL ورکر در دیتابیس برای مینی‌اپ تلگرام
    const origin = url.origin;
    if (origin && origin.startsWith('http') && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
      ctx.waitUntil((async () => {
        try {
          await env.DB.prepare("INSERT OR REPLACE INTO kv_meta (key, value) VALUES ('worker_origin', ?)").bind(origin).run();
        } catch {}
      })());
    }

    // وب‌هوک تلگرام
    if (url.pathname === '/webhook' && request.method === 'POST') {
      return handleWebhook(request, env, ctx);
    }

    // سرو کردن مستقیم پنل وب و Telegram Mini App
    if (url.pathname === '/panel' || url.pathname === '/app' || (url.pathname === '/' && (request.headers.get('Accept') || '').includes('text/html'))) {
      return new Response(PANEL_HTML, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache',
        },
      });
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
    { command: 'panel', description: '📱 ورود به مینی‌اپ پنل مدیریت' },
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

// ─── کش اطلاعات و نام ادمین‌ها در حافظه موقت ─────────────────────────────
const adminInfoCache = new Map();

async function getAdminInfo(userId, env) {
  const uid = String(userId || '').trim();
  if (!uid) return { name: '', username: '' };
  if (uid === 'panel') return { name: 'پنل وب', username: '' };
  if (adminInfoCache.has(uid)) return adminInfoCache.get(uid);

  // ۱. بررسی جدول admins
  try {
    const row = await env.DB.prepare('SELECT name, username FROM admins WHERE user_id=?').bind(uid).first();
    if (row && (row.name || row.username)) {
      const info = { name: row.name || '', username: row.username || '' };
      adminInfoCache.set(uid, info);
      return info;
    }
  } catch {}

  // ۲. بررسی kv_meta
  try {
    const metaRow = await env.DB.prepare("SELECT value FROM kv_meta WHERE key=?").bind(`admin_info:${uid}`).first();
    if (metaRow?.value) {
      const parsed = JSON.parse(metaRow.value);
      adminInfoCache.set(uid, parsed);
      return parsed;
    }
  } catch {}

  // ۳. استعلام مستقیم از تلگرام
  try {
    const res = await tg('getChat', { chat_id: Number(uid) }, env);
    if (res.ok && res.result) {
      const u = res.result;
      const fullName = [u.first_name, u.last_name].filter(Boolean).join(' ') || u.title || '';
      const uname = u.username ? `@${u.username.replace(/^@/, '')}` : '';
      const info = { name: fullName, username: uname };
      adminInfoCache.set(uid, info);

      // ذخیره در kv_meta
      try {
        await env.DB.prepare("INSERT OR REPLACE INTO kv_meta (key, value) VALUES (?,?)")
          .bind(`admin_info:${uid}`, JSON.stringify(info)).run();
      } catch {}

      // به روزرسانی جدول admins در صورت وجود
      try {
        await env.DB.prepare("UPDATE admins SET name=?, username=? WHERE user_id=?")
          .bind(fullName, uname, uid).run();
      } catch {}

      return info;
    }
  } catch {}

  return { name: '', username: '' };
}

async function formatAdminDisplay(userId, env) {
  const uid = String(userId || '').trim();
  if (!uid) return '—';
  if (uid === 'panel') return '🌐 <b>پنل وب</b>';
  const isMain = String(env.MAIN_ADMIN_ID) === uid;
  const prefix = isMain ? '👑' : '👤';
  const info = await getAdminInfo(uid, env);

  let label = '';
  if (info.name && info.username) {
    label = `${escHtml(info.name)} (${escHtml(info.username)})`;
  } else if (info.name) {
    label = escHtml(info.name);
  } else if (info.username) {
    label = escHtml(info.username);
  }

  if (label) {
    return `${prefix} <b>${label}</b> (<code>${escHtml(uid)}</code>)`;
  }
  return `${prefix} <code>${escHtml(uid)}</code>`;
}

// دریافت آدرس پنل وب / مینی‌اپ (اولویت اول: متغیر محیطی PANEL_URL کلادفلر)
async function getPanelUrl(env) {
  if (env?.PANEL_URL && typeof env.PANEL_URL === 'string' && env.PANEL_URL.trim()) {
    return env.PANEL_URL.trim().replace(/\/$/, '');
  }
  try {
    const custom = await getMeta('panel_url', env);
    if (custom) return custom.replace(/\/$/, '');
    const origin = await getMeta('worker_origin', env);
    if (origin) return `${origin.replace(/\/$/, '')}/panel`;
  } catch {}
  return '';
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
  const adminDisplay = await formatAdminDisplay(adminId, env);
  let msg = `🔔 <b>فعالیت ادمین</b>\n\n`;
  msg += `👤 ادمین: ${adminDisplay}\n`;
  msg += `📋 عمل: ${label}`;
  if (detail) msg += `\n📝 ${detail}`;
  if (sourceId) msg += `\n🆔 منبع: ${sourceId}`;
  // ارسال بی‌صدا — اگر خطا داد مهم نیست
  try { await sendMsg(adminIdMain, msg, env); } catch {}
}

async function addAdmin(userId, by, env) {
  const uid = String(userId).trim();
  const byStr = String(by || '').trim();
  
  // استعلام نام و یوزرنیم از تلگرام
  let name = '';
  let username = '';
  try {
    const info = await getAdminInfo(uid, env);
    name = info.name || '';
    username = info.username || '';
  } catch {}

  try {
    await env.DB.prepare(
      'INSERT INTO admins (user_id, name, username, added_by, created_at) VALUES (?,?,?,?,?)' +
      ' ON CONFLICT(user_id) DO UPDATE SET name=excluded.name, username=excluded.username'
    ).bind(uid, name, username, byStr, Date.now()).run();
  } catch {
    // در صورتی که ستون‌های name/username هنوز ساخته نشده بودند
    try {
      await env.DB.prepare('ALTER TABLE admins ADD COLUMN name TEXT').run();
      await env.DB.prepare('ALTER TABLE admins ADD COLUMN username TEXT').run();
      await env.DB.prepare(
        'INSERT INTO admins (user_id, name, username, added_by, created_at) VALUES (?,?,?,?,?)' +
        ' ON CONFLICT(user_id) DO UPDATE SET name=excluded.name, username=excluded.username'
      ).bind(uid, name, username, byStr, Date.now()).run();
    } catch {
      await env.DB.prepare('INSERT OR IGNORE INTO admins (user_id, added_by, created_at) VALUES (?,?,?)')
        .bind(uid, byStr, Date.now()).run();
    }
  }
}

async function removeAdmin(userId, env) {
  await env.DB.prepare('DELETE FROM admins WHERE user_id = ?').bind(String(userId)).run();
}

async function listAdmins(env) {
  try {
    return await env.DB.prepare('SELECT * FROM admins ORDER BY created_at').all();
  } catch {
    return { results: [] };
  }
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
  // ۱. شناسایی دقیق شناسه اصلی پست A از تگ والد
  const idMatch = block.match(/<div[^>]*class="[^"]*tgme_widget_message\b[^"]*"[^>]*data-post="([^"]+)"/i)
    || block.match(/data-post="([^"]+)"/);
  if (!idMatch) return null;
  const dataPost = idMatch[1]; // channel/123
  const parts = dataPost.split('/');
  const channel = parts[0];
  const msgId = parseInt(parts[1] || '0', 10);

  // ۲. استخراج بخش ریپلای / نقل‌قول پست قبلی (پست B) و جداسازی کامل آن
  let isReply = false;
  let replyToText = '';
  let replyToAuthor = '';
  let replyToLink = '';

  // بررسی تگ ریپلای تلگرام: <a class="tgme_widget_message_reply" ...>...</a>
  const replyMatch = block.match(/<a[^>]*class="[^"]*tgme_widget_message_reply\b[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
  if (replyMatch) {
    isReply = true;
    replyToLink = replyMatch[1] || '';
    const replyInner = replyMatch[2];
    const authorMatch = replyInner.match(/class="[^"]*tgme_widget_message_reply_author\b[^"]*"[^>]*>([\s\S]*?)<\/(?:span|div|a)>/i);
    if (authorMatch) replyToAuthor = convertTelegramHtml(authorMatch[1]).replace(/<[^>]+>/g, '').trim();
    const rTextMatch = replyInner.match(/class="[^"]*tgme_widget_message_reply_text\b[^"]*"[^>]*>([\s\S]*?)<\/(?:span|div)>/i);
    if (rTextMatch) replyToText = convertTelegramHtml(rTextMatch[1]).trim();
  }

  // بررسی نقل قول مدرن: <blockquote class="tgme_widget_message_quote"...>...</blockquote>
  const quoteMatch = block.match(/<blockquote[^>]*class="[^"]*(?:tgme_widget_message_quote|quoted_inline_message)\b[^"]*"[^>]*>([\s\S]*?)<\/blockquote>/i);
  if (quoteMatch) {
    isReply = true;
    const qInner = quoteMatch[1];
    const qTextMatch = qInner.match(/class="[^"]*tgme_widget_message_quote_text\b[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    if (qTextMatch && !replyToText) replyToText = convertTelegramHtml(qTextMatch[1]).trim();
  }

  // ۳. کلید حل باگ ریپلای: پاکسازی کامل بلوک ریپلای/کوت از HTML تا متن و مدیا متعلق به پست اصلی A استخراج شود
  let cleanBlock = block;
  if (replyMatch) {
    cleanBlock = cleanBlock.replace(replyMatch[0], ' ');
  }
  if (quoteMatch) {
    cleanBlock = cleanBlock.replace(quoteMatch[0], ' ');
  }
  // حذف لینک‌های پیش‌نمایش درونی که ممکن است متون embed داشته باشند
  cleanBlock = cleanBlock.replace(/<div[^>]*class="[^"]*tgme_widget_message_link_preview\b[^"]*"[\s\S]*?<\/div>\s*<\/div>/gi, ' ');

  // ۴. استخراج متن اصلی پست A از cleanBlock
  let text = '';
  const textMatch = cleanBlock.match(/class="[^"]*\b(?:js-message_text|tgme_widget_message_text)\b[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
  if (textMatch) {
    text = convertTelegramHtml(textMatch[1]).trim();
  }

  // ۵. نوع رسانه فقط از پست اصلی (cleanBlock)
  let mediaType = 'text';
  if (/tgme_widget_message_photo/.test(cleanBlock)) mediaType = 'photo';
  else if (/tgme_widget_message_video|tgme_widget_message_video_player/.test(cleanBlock)) mediaType = 'video';
  else if (/tgme_widget_message_document/.test(cleanBlock)) mediaType = 'file';
  else if (/tgme_widget_message_audio/.test(cleanBlock)) mediaType = 'audio';
  else if (/tgme_widget_message_sticker/.test(cleanBlock)) mediaType = 'sticker';
  else if (/tgme_widget_message_poll/.test(cleanBlock)) mediaType = 'poll';
  else if (/tgme_widget_message_roundvideo/.test(cleanBlock)) mediaType = 'video';

  // ۶. بازدید
  const viewsMatch = cleanBlock.match(/class="tgme_widget_message_views[^"]*"[^>]*>([^<]+)</);
  let views = 0;
  if (viewsMatch) views = parseViews(viewsMatch[1]);

  // ۷. لینک مستقیم به پست اصلی A (مطمئن می‌شویم لینک پست B ریپلای شده نباشد)
  let link = `https://t.me/${dataPost}`;
  const linkMatch = cleanBlock.match(/class="tgme_widget_message_date"[^>]*href="([^"]+)"/)
    || cleanBlock.match(/class="tgme_widget_message_link"[^>]*href="([^"]+)"/);
  if (linkMatch && linkMatch[1].includes(`/${msgId}`)) {
    link = linkMatch[1];
  }

  // زمان
  const dateMatch = cleanBlock.match(/datetime="([^"]+)"/);
  const datetime = dateMatch ? dateMatch[1] : null;

  // ری‌اکشن‌ها
  const reactions = parseReactions(cleanBlock);

  return { dataPost, channel, msgId, text, mediaType, views, reactions, link, datetime, isReply, replyToText, replyToAuthor, replyToLink };
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
  const norm = normalizedText ? normalizedText : normalizeText(post.text || '');
  const text = norm.toLowerCase();
  const pos = safeKeywords(source.keywords_positive);
  const neg = safeKeywords(source.keywords_negative);

  const foundNegative = neg.filter(kw => {
    const k = normalizeText(kw).toLowerCase();
    return k && text.includes(k);
  });
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

  const foundPositive = pos.filter(kw => {
    const k = normalizeText(kw).toLowerCase();
    return k && text.includes(k);
  });
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
  const norm = normalizedText ? normalizedText : normalizeText(post.text || '');
  const text = norm.toLowerCase();
  const main = safeKeywords(source.keywords_main);
  const comp = safeKeywords(source.keywords_complementary);
  const periph = safeKeywords(source.keywords_peripheral);

  let score = 0;
  const breakdown = [];

  // ── کلیدواژه‌های اصلی — +۴۰ هر کلمه + ۱۵ position bonus ──
  for (const kw of main) {
    const k = normalizeText(kw).toLowerCase();
    if (k && text.includes(k)) {
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
    const k = normalizeText(kw).toLowerCase();
    if (k && text.includes(k)) {
      score += 15;
      breakdown.push({ kw, type: 'complementary', value: 15 });
    }
  }

  // ── کلیدواژه‌های پیرامونی — -۳۰ هر کلمه ──
  for (const kw of periph) {
    const k = normalizeText(kw).toLowerCase();
    if (k && text.includes(k)) {
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
  const viewsLabel = post.views > 0 ? `👁 <code>${formatViews(post.views)}</code>` : '';
  const timeLabel = post.datetime ? `🕐 <i>${escapeHtml(post.datetime.replace('T', ' ').slice(0, 16))}</i>` : '';

  // ─── کادر متادیتای فوق‌العاده شیک با استانداردهای مدرن تلگرام ───
  let meta = '<blockquote>';
  meta += `📡 <b>منبع:</b> <a href="${post.link}">@${escapeHtml(post.channel)}</a>  •  ${mediaLabel} <i>${mediaName(post.mediaType)}</i>\n`;
  meta += `🧭 <b>حالت:</b> <code>${modeName(source.mode, source.deep_scoring)}</code>`;
  if (viewsLabel) meta += `  •  ${viewsLabel}`;
  if (timeLabel) meta += `  •  ${timeLabel}`;

  // ─── اطلاعات اختصاصی هر حالت ───
  if (source.mode === 'viral' && ctx.viralInfo) {
    const v = ctx.viralInfo;
    if (v.viral_rules && v.viral_rules.length) {
      meta += `\n🔥 <b>ری‌اکشن‌ها:</b> `;
      const rItems = v.viral_rules.map(r => `${r.emoji} <code>${r.count}/${r.threshold}</code> ${r.passed ? '✓' : '✗'}`).join('  ');
      meta += rItems;
    } else if (v.total_count !== undefined) {
      meta += `\n🔥 <b>مجموع واکنش:</b> <code>${v.total_count}</code> / حداقل <code>${v.threshold}</code>`;
    }
  } else if (source.mode === 'deep' && ctx.dispatchBreakdown) {
    const bd = ctx.dispatchBreakdown;
    const isScoring = bd.type === 'deep_scoring';
    if (isScoring) {
      meta += `\n📊 <b>امتیاز موضوعی:</b> <code>${bd.score}/${bd.threshold}</code>`;
      const mainKw = (bd.items || []).filter(i => i.type === 'main').map(i => i.kw);
      const compKw = (bd.items || []).filter(i => i.type === 'complementary').map(i => i.kw);
      if (mainKw.length || compKw.length) {
        const parts = [];
        if (mainKw.length) parts.push(`اصلی: <b>${escapeHtml(mainKw.join('، '))}</b>`);
        if (compKw.length) parts.push(`مکمل: <i>${escapeHtml(compKw.join('، '))}</i>`);
        meta += `\n<tg-spoiler>🔍 ${parts.join(' | ')}</tg-spoiler>`;
      }
    } else if (bd.type === 'deep_classic') {
      if (bd.positive_match?.length) meta += `\n✅ <b>کلیدواژه مثبت:</b> <code>${escapeHtml(bd.positive_match.join('، '))}</code>`;
      if (bd.negative_match?.length) meta += `\n🚫 <b>منفی‌کننده:</b> <code>${escapeHtml(bd.negative_match.join('، '))}</code>`;
    }
  }

  // ─── اطلاعات Anti-Ad با نمایش شاخص سلامت ───
  if (ctx.adScore !== undefined && ctx.adScore > 0) {
    const cleanPercent = Math.max(0, 100 - ctx.adScore);
    const badge = ctx.adScore >= 70 ? '🚫 مسدود' : ctx.adScore >= 40 ? '⚠️ مشکوک' : '🛡 پاک';
    meta += `\n🛡 <b>شاخص سلامت:</b> <code>${cleanPercent}%</code> (${badge}) <tg-spoiler>[ریسک: ${ctx.adScore}/100]</tg-spoiler>`;
  }

  // ─── نمایش دقیق ریپلای به همراه لینک به پست قبلی ───
  if (post.isReply) {
    const authorName = post.replyToAuthor ? escapeHtml(post.replyToAuthor) : 'پست قبلی';
    const replyUrl = post.replyToLink || post.link;
    meta += `\n↩️ <b>پاسخ به:</b> <a href="${replyUrl}"><i>${authorName}</i></a>`;
    if (post.replyToText) {
      const cleanSnippet = post.replyToText.replace(/<[^>]+>/g, '').trim();
      const rt = cleanSnippet.length > 70 ? cleanSnippet.slice(0, 70) + '…' : cleanSnippet;
      meta += `\n<tg-spoiler>💬 «${escapeHtml(rt)}»</tg-spoiler>`;
    }
  }

  // ─── کلیدواژه‌های پیدا شده ───
  if (ctx.foundKeywords && ctx.foundKeywords.length && source.mode === 'deep') {
    const tags = ctx.foundKeywords.map(k => `<code>#${escapeHtml(k.replace(/\s+/g, '_'))}</code>`).join(' ');
    meta += `\n🏷 <b>برچسب‌ها:</b> ${tags}`;
  }

  meta += '</blockquote>';

  // ─── متن پست اصلی A (با حفظ فرمت‌بندی غنی تلگرام) ───
  let body = '';
  if (post.text) {
    let t = post.text;
    if (t.length > 3400) {
      t = t.slice(0, 3400) + '\n…';
    }
    // بستن تگ‌هایی که احیاناً در اثر برش باز مانده‌اند
    t = balanceHtmlTags(t);
    body = `\n${t}`;
  }

  const finalHtml = `${meta}${body}`;
  return balanceHtmlTags(finalHtml);
}

function mediaName(t) {
  return { photo: 'عکس', video: 'ویدیو', file: 'فایل', audio: 'صوت', sticker: 'استیکر', poll: 'نظرسنجی', text: 'متن' }[t] || 'متن';
}
function modeName(m, deepScoring = 0) {
  if (typeof m === 'object' && m !== null) {
    deepScoring = m.deep_scoring;
    m = m.mode;
  }
  if (m === 'forward') return '📤 فوروارد (Forward)';
  if (m === 'viral') return '👁 وایرال (Viral)';
  if (m === 'deep') {
    return Number(deepScoring) === 1 ? '📊 عمیق هوشمند (Deep Scoring)' : '📋 عمیق کلاسیک (Deep Classic)';
  }
  return m || '—';
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

// ارسال واقعی با پشتیبانی از تاپیک، context mode-specific و Fallback هوشمند در صورت خطای HTML تلگرام
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
  
  const res = await tg('sendMessage', params, env);
  
  // اگر خطای تلگرام مربوط به عدم توانایی در Parse کردن تگ‌های HTML بود (Bad Request: can't parse entities)
  if (!res.ok && res.description && /can't parse entities|character.*is reserved/i.test(res.description)) {
    console.warn(`[deliverPost] HTML parse error: ${res.description}. Retrying with sanitized text fallback.`);
    // ارسال مجدد بدون parse_mode و با حذف تگ‌های خراب برای جلوگیری از سوختن پست
    const cleanText = text
      .replace(/<blockquote[^>]*>/gi, '\n> ')
      .replace(/<\/blockquote>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"');
    
    const fallbackParams = {
      ...params,
      text: cleanText.trim(),
      parse_mode: undefined,
    };
    return tg('sendMessage', fallbackParams, env);
  }
  
  return res;
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
    // کش کردن URL پنل برای ساخت دکمه‌های وب‌اپ (مینی‌اپ تلگرام)
    if (env?.PANEL_URL && typeof env.PANEL_URL === 'string' && env.PANEL_URL.trim()) {
      cachedPanelUrl = env.PANEL_URL.trim().replace(/\/$/, '');
    } else if (!cachedPanelUrl) {
      ctx.waitUntil((async () => {
        const u = await getPanelUrl(env);
        if (u) cachedPanelUrl = u;
      })());
    }

    // سینک خودکار نام و یوزرنیم کاربر ارسال‌کننده
    const sender = update.message?.from || update.callback_query?.from;
    if (sender && sender.id) {
      const sId = String(sender.id);
      const fullName = [sender.first_name, sender.last_name].filter(Boolean).join(' ') || sender.username || '';
      const uname = sender.username ? `@${sender.username.replace(/^@/, '')}` : '';
      if (fullName || uname) {
        adminInfoCache.set(sId, { name: fullName, username: uname });
        ctx.waitUntil((async () => {
          try {
            await env.DB.prepare("UPDATE admins SET name=?, username=? WHERE user_id=?").bind(fullName, uname, sId).run();
            await env.DB.prepare("INSERT OR REPLACE INTO kv_meta (key, value) VALUES (?,?)")
              .bind(`admin_info:${sId}`, JSON.stringify({ name: fullName, username: uname })).run();
          } catch {}
        })());
      }
    }

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
        panel: cmdPanel,
        setpanelurl: cmdSetPanelUrl,
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
      const kw = parseKeywordsInput(text);
      await setState(userId, { ...state, step: 'add_keywords_neg', keywords_positive: kw }, env);
      return sendWizardPrompt(chatId, '🚫 <b>کلیدواژه‌های منفی‌کننده</b>\n\n<blockquote>کلماتی که اگر در پست باشند، محتوا ارسال نشود (حتی اگه کلیدواژه مثبت هم داشته باشد).\nبا کاما جدا کنید.\n\nبرای رد شدن بفرستید: <code>-</code></blockquote>', env, threadId);
    }
    case 'add_keywords_neg': {
      const neg = text.trim() === '-' ? [] : parseKeywordsInput(text);
      // ⚠️ حذف مرحله مقصد — مستقیماً finalize با مقصد = همین چت
      await finalizeAddSource(userId, { ...state, keywords_negative: neg, target_chat_id: String(chatId), target_topic_id: threadId || null }, env);
      return;
    }

    // ── Deep Scoring: کلیدواژه‌های اصلی ──
    case 'add_keywords_main': {
      const kw = parseKeywordsInput(text);
      await setState(userId, { ...state, step: 'add_keywords_comp', keywords_main: kw }, env);
      return sendWizardPrompt(chatId, '➕ <b>کلیدواژه‌های مکمل</b>\n\n<blockquote>کلماتی که موضوع اصلی را تقویت می‌کنند.\nبا کاما یا ویرگول جدا کنید (تعداد نامحدود).\n\n<b>امتیاز:</b> +۱۵ هر کلمه\n\nبرای رد شدن بفرستید: <code>-</code></blockquote>', env, threadId);
    }
    case 'add_keywords_comp': {
      const comp = text.trim() === '-' ? [] : parseKeywordsInput(text);
      await setState(userId, { ...state, step: 'add_keywords_periph', keywords_complementary: comp }, env);
      return sendWizardPrompt(chatId, '⚠️ <b>کلیدواژه‌های پیرامونی</b>\n\n<blockquote>کلماتی که در اطراف موضوع دیده می‌شوند اما ارزش اصلی را نشان نمی‌دهند — باعث کاهش امتیاز می‌شوند.\nبا کاما یا ویرگول جدا کنید (تعداد نامحدود).\n\n<b>امتیاز:</b> -۳۰ هر کلمه\n\nبرای رد شدن بفرستید: <code>-</code></blockquote>', env, threadId);
    }
    case 'add_keywords_periph': {
      const periph = text.trim() === '-' ? [] : parseKeywordsInput(text);
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
      const kw = text.trim() === '-' ? [] : parseKeywordsInput(text);
      await setState(userId, { ...state, step: 'edit_keywords_neg', keywords_positive: kw }, env);
      return sendWizardPrompt(chatId, '🚫 <b>کلیدواژه‌های منفی جدید</b>\n\n<blockquote>کلماتی که نباید در محتوا باشند (یا <code>-</code> برای خالی):</blockquote>', env, threadId);
    }
    case 'edit_keywords_neg': {
      const neg = text.trim() === '-' ? [] : parseKeywordsInput(text);
      await setState(userId, { ...state, step: 'edit_confirm', keywords_negative: neg }, env);
      return showEditConfirm(userId, { ...state, keywords_negative: neg, threadId }, env);
    }
    case 'edit_keywords_main': {
      const kw = text.trim() === '-' ? [] : parseKeywordsInput(text);
      await setState(userId, { ...state, step: 'edit_keywords_comp', keywords_main: kw }, env);
      return sendWizardPrompt(chatId, '➕ <b>کلیدواژه‌های مکمل جدید</b>\n\n<blockquote>کلماتی که امتیاز مثبت دارند (+۱۵) (یا <code>-</code> برای خالی):</blockquote>', env, threadId);
    }
    case 'edit_keywords_comp': {
      const comp = text.trim() === '-' ? [] : parseKeywordsInput(text);
      await setState(userId, { ...state, step: 'edit_keywords_periph', keywords_complementary: comp }, env);
      return sendWizardPrompt(chatId, '⚠️ <b>کلیدواژه‌های پیرامونی جدید</b>\n\n<blockquote>کلماتی که امتیاز منفی دارند (-۳۰) (یا <code>-</code> برای خالی):</blockquote>', env, threadId);
    }
    case 'edit_keywords_periph': {
      const periph = text.trim() === '-' ? [] : parseKeywordsInput(text);
      await setState(userId, { ...state, step: 'edit_deep_threshold_input', keywords_peripheral: periph }, env);
      return sendWizardPrompt(chatId, '📊 <b>آستانه امتیاز جدید</b>\n\n<blockquote>حداقل امتیاز برای ارسال (مثلاً <code>50</code> یا <code>-</code> برای بدون تغییر):</blockquote>', env, threadId);
    }
    case 'edit_deep_threshold_input': {
      const n = text.trim() === '-' ? (state.deep_threshold || 50) : parseInt(text, 10);
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
  if (state.mode) fields.push(`حالت: ${modeName(state.mode, state.deep_scoring)}`);
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

    case 'panel_info': {
      const panelUrl = await getPanelUrl(env);
      if (panelUrl) {
        const kb = {
          inline_keyboard: [
            [{ text: '🚀 باز کردن پنل مدیریت (Mini App)', web_app: { url: panelUrl } }],
            [{ text: '🌐 باز کردن در مرورگر وب', url: panelUrl }],
            [{ text: '🏠 منو', callback_data: 'menu' }],
          ],
        };
        return editMsg(chatId, messageId, `📱 <b>پنل مدیریت ربات (Mini App)</b>\n\n<blockquote>🔗 آدرس فعال: <code>${escHtml(panelUrl)}</code>\n\nبرای دسترسی به پنل بدون خروج از تلگرام روی دکمه زیر بزنید.</blockquote>`, env, kb, 'HTML');
      }
      return editMsg(
        chatId,
        messageId,
        `⚠️ <b>متغیر PANEL_URL در کلادفلر تنظیم نشده است</b>\n\n` +
        `<blockquote>برای اتصال خودکار پنل و مینی‌اپ، کافیست در داشبورد کلودفلر از مسیر <b>Settings > Variables and Secrets</b> یا در فایل <code>wrangler.toml</code> در بخش <code>[vars]</code> متغیر زیر را تعریف کنید:\n\n` +
        `<code>PANEL_URL = "https://your-worker.workers.dev/panel"</code></blockquote>`,
        env,
        { inline_keyboard: [[{ text: '🏠 منو', callback_data: 'menu' }]] },
        'HTML'
      );
    }

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
        msg += '<blockquote>کلماتی که مستقیماً موضوع اصلی هستند (+۴۰ امتیاز).\nبا کاما یا ویرگول بفرستید (یا <code>-</code> برای پاک‌کردن):</blockquote>';
        return editMsg(chatId, messageId, msg, env, null, 'HTML');
      } else {
        let msg = '📋 <b>Deep Classic — کلیدواژه‌های مثبت‌کننده جدید</b>\n\n';
        msg += '<blockquote>با کاما یا ویرگول بفرستید (یا <code>-</code> برای پاک‌کردن):</blockquote>';
        return editMsg(chatId, messageId, msg, env, null, 'HTML');
      }
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
        try { await deliverPost(post, src, { foundKeywords: [], adScore: 0, adVerdict: 'clean' }, env); } catch {}
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
let cachedPanelUrl = '';

function mainMenuKb(param = '') {
  let url = '';
  if (typeof param === 'string' && param.startsWith('http')) {
    url = param;
  }
  if (!url && cachedPanelUrl) {
    url = cachedPanelUrl;
  }

  const rows = [];
  if (url) {
    rows.push([{ text: '📱 ورود به پنل مدیریت (Mini App)', web_app: { url } }]);
  } else {
    rows.push([{ text: '📱 پنل مدیریت (Mini App)', callback_data: 'panel_info' }]);
  }
  rows.push([
    { text: '➕ افزودن منبع', callback_data: 'add_start' },
    { text: '📝 تنظیم موضوع', callback_data: 'settopic_start' },
  ]);
  rows.push([
    { text: '🔁 تغییر مقصد', callback_data: 'settarget_start' },
    { text: '🗑 حذف منبع', callback_data: 'del_start' },
  ]);
  rows.push([
    { text: '🔍 اسکن تک‌منبع', callback_data: 'scan_pick' },
    { text: '📋 لیست منابع', callback_data: 'list_sources' },
  ]);
  rows.push([
    { text: '🤖 تحلیل AI', callback_data: 'aianalyze_start' },
    { text: '📊 آمار', callback_data: 'stats' },
  ]);
  rows.push([
    { text: '🛡 ضد تبلیغات', callback_data: 'adblock_menu' },
    { text: '🛡 ادمین‌ها', callback_data: 'admin_list' },
  ]);
  rows.push([
    { text: '💾 بکاپ', callback_data: 'backup' },
    { text: '❓ راهنما', callback_data: 'help' },
  ]);
  return { inline_keyboard: rows };
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
    const display = await formatAdminDisplay(args.trim(), env);
    return sendMsg(chatId, `✅ ادمین ${display} افزوده شد.`, env, null, 'HTML', tid);
  }
  await setState(userId, { step: 'addadmin_input', chatId, threadId: tid }, env);
  return sendWizardPrompt(chatId, '➕ آیدی عددی ادمین جدید را بفرستید:', env, tid);
}

async function cmdDelAdmin({ chatId, userId, args, message, env }) {
  const tid = message?.message_thread_id || null;
  if (args && /^\d+$/.test(args.trim())) {
    const display = await formatAdminDisplay(args.trim(), env);
    await removeAdmin(args.trim(), env);
    return sendMsg(chatId, `🗑 ادمین ${display} حذف شد.`, env, null, 'HTML', tid);
  }
  await setState(userId, { step: 'deladmin_input', chatId, threadId: tid }, env);
  return sendWizardPrompt(chatId, '🗑 آیدی عددی ادمین را بفرستید:', env, tid);
}

async function cmdAdmins({ chatId, message, env }) {
  return showAdmins(chatId, null, env, message?.message_thread_id || null);
}

async function cmdPanel({ chatId, message, env }) {
  const tid = message?.message_thread_id || null;
  const panelUrl = await getPanelUrl(env);
  if (panelUrl) {
    try {
      await tg('setChatMenuButton', {
        chat_id: chatId,
        menu_button: {
          type: 'web_app',
          text: '📱 پنل مدیریت',
          web_app: { url: panelUrl },
        },
      }, env);
    } catch {}

    const kb = {
      inline_keyboard: [
        [{ text: '🚀 ورود به پنل مدیریت (Mini App)', web_app: { url: panelUrl } }],
        [{ text: '🌐 باز کردن در مرورگر وب', url: panelUrl }],
        [{ text: '🏠 بازگشت به منو', callback_data: 'menu' }],
      ],
    };
    return sendMsg(
      chatId,
      `📱 <b>پنل مدیریت ربات (Mini App)</b>\n\n` +
      `<blockquote>🔗 آدرس فعال: <code>${escHtml(panelUrl)}</code>\n\n` +
      `بدون نیاز به خروج از تلگرام، تمامی تنظیمات، منابع، لاگ‌ها و سیستم ضدتبلیغ را از طریق مینی‌اپ مدیریت کنید.</blockquote>`,
      env, kb, 'HTML', tid
    );
  } else {
    return sendMsg(
      chatId,
      `⚠️ <b>متغیر PANEL_URL در کلادفلر تنظیم نشده است.</b>\n\n` +
      `<blockquote>برای اتصال خودکار پنل مینی‌اپ، کافیست در داشبورد کلودفلر (مسیر Settings > Variables and Secrets) یا در فایل <code>wrangler.toml</code> در بخش <code>[vars]</code> متغیر زیر را اضافه کنید:\n\n` +
      `<code>PANEL_URL = "https://your-worker.workers.dev/panel"</code>\n\n` +
      `پس از ذخیره یا دیپلوی، دکمه ورود به پنل در تلگرام بلافاصله فعال می‌شود.</blockquote>`,
      env, null, 'HTML', tid
    );
  }
}

async function cmdSetPanelUrl({ chatId, userId, args, message, env }) {
  const tid = message?.message_thread_id || null;
  const isMain = String(env.MAIN_ADMIN_ID) === String(userId);
  if (!isMain) {
    return sendMsg(chatId, '⛔ فقط ادمین اصلی می‌تواند آدرس پنل را تغییر دهد.', env, null, 'HTML', tid);
  }

  const urlInput = (args || '').trim();
  if (!urlInput || !urlInput.startsWith('http')) {
    return sendMsg(
      chatId,
      `ℹ️ <b>راهنمای تنظیم آدرس پنل / مینی‌اپ:</b>\n\n` +
      `<blockquote>دستور را به همراه لینک بفرستید:\n<code>/setpanelurl https://your-worker.workers.dev/panel</code></blockquote>`,
      env, null, 'HTML', tid
    );
  }

  const cleanUrl = urlInput.replace(/\/$/, '');
  await env.DB.prepare("INSERT OR REPLACE INTO kv_meta (key, value) VALUES ('panel_url', ?)").bind(cleanUrl).run();
  cachedPanelUrl = cleanUrl;

  try {
    await tg('setChatMenuButton', {
      chat_id: chatId,
      menu_button: {
        type: 'web_app',
        text: '📱 پنل مدیریت',
        web_app: { url: cleanUrl },
      },
    }, env);
  } catch {}

  const kb = {
    inline_keyboard: [
      [{ text: '📱 تست و باز کردن پنل (Mini App)', web_app: { url: cleanUrl } }],
      [{ text: '🏠 منوی اصلی', callback_data: 'menu' }],
    ],
  };

  return sendMsg(
    chatId,
    `✅ <b>آدرس پنل با موفقیت ذخیره شد!</b>\n\n` +
    `<blockquote>🔗 آدرس جدید: <code>${escHtml(cleanUrl)}</code>\n\nدکمه منوی پایین تلگرام و دکمه‌های شیشه‌ای ربات به‌روزرسانی شدند.</blockquote>`,
    env, kb, 'HTML', tid
  );
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
    text += `   ${modeName(s.mode, s.deep_scoring)}${s.active ? '' : ' (غیرفعال)'} → ${s.target_chat_id}${s.target_topic_id ? ':' + s.target_topic_id : ''}\n`;
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
  const res = await env.DB.prepare('SELECT id, channel, mode, deep_scoring FROM sources ORDER BY id DESC LIMIT 20').all();
  if (!res.results.length) {
    const t = '📋 منبعی وجود ندارد.';
    return messageId ? editMsg(chatId, messageId, t, env, mainMenuKb()) : sendMsg(chatId, t, env, mainMenuKb(), 'HTML', threadId);
  }
  const kb = { inline_keyboard: [] };
  for (const s of res.results) {
    kb.inline_keyboard.push([{ text: `#${s.id} @${s.channel} (${modeName(s.mode, s.deep_scoring)})`, callback_data: `${callbackAction}:${s.id}` }]);
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

function parseKeywordsInput(input) {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input.map(s => String(s).trim()).filter(Boolean);
  }
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (trimmed === '-' || !trimmed) return [];
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.map(s => String(s).trim()).filter(Boolean);
      } catch {}
    }
    return trimmed
      .split(/[,،؛;\n\r]+/)
      .map(s => s.trim().replace(/^["'«»“”]/, '').replace(/["'«»“”]$/, '').trim())
      .filter(Boolean);
  }
  return [];
}

function safeKeywords(s) {
  return parseKeywordsInput(s);
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
  await getSourceColumns(env);
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
  await getSourceColumns(env);
  const {
    ids, mode,
    keywords_positive, keywords_negative,
    keywords_main, keywords_complementary, keywords_peripheral,
    deep_scoring, every_mode, deep_threshold,
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
  if (deep_scoring !== undefined) { sets.push('deep_scoring=?'); binds.push(deep_scoring ? 1 : 0); }
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
  // گرفتن نام و یوزرنیم ادمین اصلی
  const mainInfo = await getAdminInfo(env.MAIN_ADMIN_ID, env);

  // گرفتن نام هر ادمین فرعی با getAdminInfo
  const admins = [];
  for (const a of res.results || []) {
    const info = await getAdminInfo(a.user_id, env);
    admins.push({
      ...a,
      name: info.name || a.name || '',
      username: info.username || a.username || '',
      display_name: info.name || a.name || '',
      permissions: safeJson(a.permissions, {}),
    });
  }
  return json({
    main: env.MAIN_ADMIN_ID,
    main_name: mainInfo.name || '',
    main_username: mainInfo.username || '',
    admins
  });
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
  await getSourceColumns(env);
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
