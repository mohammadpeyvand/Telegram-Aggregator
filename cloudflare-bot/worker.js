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
const PANEL_HTML = "<!DOCTYPE html>\n<html lang=\"fa\" dir=\"rtl\">\n<head>\n<meta charset=\"UTF-8\" />\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n<title>پنل مدیریت ربات تجمیع‌کننده</title>\n<script src=\"https://telegram.org/js/telegram-web-app.js\"></script>\n<script src=\"https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js\"></script>\n<style>\n  /* ─── متغیرهای رنگ تم تاریک (پیش‌فرض) ─── */\n  :root{\n    --bg: #0a0e1a;\n    --bg2: #0f172a;\n    --bg3: #131c33;\n    --card: rgba(22, 28, 45, 0.7);\n    --card-solid: #161c2d;\n    --card-hover: rgba(34, 211, 238, 0.08);\n    --border: rgba(99, 102, 241, 0.15);\n    --border-strong: rgba(99, 102, 241, 0.35);\n    --text: #f1f5f9;\n    --muted: #94a3b8;\n    --accent: #06b6d4;\n    --accent2: #a78bfa;\n    --accent-glow: rgba(6, 182, 212, 0.4);\n    --green: #10b981;\n    --red: #ef4444;\n    --yellow: #f59e0b;\n    --blue: #3b82f6;\n    --purple: #a855f7;\n    --pink: #ec4899;\n    --shadow-sm: 0 1px 2px rgba(0,0,0,0.2);\n    --shadow: 0 4px 16px rgba(0,0,0,0.3);\n    --shadow-lg: 0 12px 32px rgba(0,0,0,0.4);\n    --radius-sm: 8px;\n    --radius: 12px;\n    --radius-lg: 16px;\n    --gradient: linear-gradient(135deg, #06b6d4 0%, #a78bfa 100%);\n    --gradient-card: linear-gradient(135deg, rgba(6,182,212,0.05) 0%, rgba(167,139,250,0.05) 100%);\n    --chart-tick: #94a3b8;\n    --chart-grid: rgba(148, 163, 184, 0.1);\n  }\n\n  /* ─── متغیرهای رنگ تم روشن (Light Mode) ─── */\n  [data-theme=\"light\"]{\n    --bg: #f8fafc;\n    --bg2: #ffffff;\n    --bg3: #f1f5f9;\n    --card: rgba(255, 255, 255, 0.95);\n    --card-solid: #ffffff;\n    --card-hover: rgba(8, 145, 178, 0.08);\n    --border: rgba(148, 163, 184, 0.28);\n    --border-strong: rgba(99, 102, 241, 0.35);\n    --text: #0f172a;\n    --muted: #475569;\n    --accent: #0891b2;\n    --accent2: #7c3aed;\n    --accent-glow: rgba(8, 145, 178, 0.25);\n    --green: #059669;\n    --red: #dc2626;\n    --yellow: #d97706;\n    --blue: #2563eb;\n    --purple: #9333ea;\n    --pink: #db2777;\n    --shadow-sm: 0 1px 3px rgba(0,0,0,0.06);\n    --shadow: 0 4px 16px rgba(0,0,0,0.08);\n    --shadow-lg: 0 12px 32px rgba(0,0,0,0.12);\n    --gradient: linear-gradient(135deg, #0891b2 0%, #7c3aed 100%);\n    --gradient-card: linear-gradient(135deg, rgba(8,145,178,0.06) 0%, rgba(124,58,237,0.06) 100%);\n    --chart-tick: #475569;\n    --chart-grid: rgba(148, 163, 184, 0.15);\n  }\n\n  *{box-sizing:border-box;margin:0;padding:0}\n  html,body{height:100%}\n  body{\n    font-family:'Vazirmatn',system-ui,-apple-system,BlinkMacSystemFont,sans-serif;\n    background: var(--bg);\n    background-image:\n      radial-gradient(at 20% 0%, rgba(6,182,212,0.12) 0px, transparent 50%),\n      radial-gradient(at 80% 100%, rgba(167,139,250,0.12) 0px, transparent 50%),\n      radial-gradient(at 100% 0%, rgba(236,72,153,0.08) 0px, transparent 50%);\n    background-attachment: fixed;\n    color: var(--text);\n    min-height: 100vh;\n    line-height: 1.6;\n    -webkit-font-smoothing: antialiased;\n    transition: background-color .25s ease, color .25s ease;\n  }\n  [data-theme=\"light\"] body{\n    background-image:\n      radial-gradient(at 20% 0%, rgba(8,145,178,0.08) 0px, transparent 50%),\n      radial-gradient(at 80% 100%, rgba(124,58,237,0.08) 0px, transparent 50%),\n      radial-gradient(at 100% 0%, rgba(219,39,119,0.04) 0px, transparent 50%);\n  }\n  [data-theme=\"light\"] .header{\n    background: rgba(255, 255, 255, 0.92);\n  }\n  [data-theme=\"light\"] .nav{\n    background: rgba(248, 250, 252, 0.95);\n  }\n  [data-theme=\"light\"] .login-wrap{\n    background: radial-gradient(at center, rgba(8,145,178,0.12), transparent 70%);\n  }\n  [data-theme=\"light\"] .login-card{\n    background: rgba(255, 255, 255, 0.96);\n    box-shadow: 0 20px 40px rgba(0,0,0,0.08);\n  }\n  [data-theme=\"light\"] .modal{\n    background: #ffffff;\n    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.2);\n  }\n  [data-theme=\"light\"] .modal-header,\n  [data-theme=\"light\"] .modal-actions{\n    background: #ffffff;\n  }\n  [data-theme=\"light\"] .log-entry .log-breakdown{\n    background: #f1f5f9;\n    color: #0369a1;\n  }\n  [data-theme=\"light\"] .reaction-rule select,\n  [data-theme=\"light\"] .reaction-rule input[type=text],\n  [data-theme=\"light\"] .reaction-rule input[type=number]{\n    background: #ffffff;\n  }\n  a{color:var(--accent);text-decoration:none}\n  ::selection{background:var(--accent);color:#fff}\n\n  /* ─── Scrollbar ─── */\n  ::-webkit-scrollbar{width:10px;height:10px}\n  ::-webkit-scrollbar-track{background:transparent}\n  ::-webkit-scrollbar-thumb{background:var(--border-strong);border-radius:5px}\n  ::-webkit-scrollbar-thumb:hover{background:var(--accent)}\n\n  /* ─── Login ─── */\n  .login-wrap{\n    display:flex;align-items:center;justify-content:center;min-height:100vh;padding:1rem;\n    background: radial-gradient(at center, rgba(6,182,212,0.15), transparent 70%);\n  }\n  .login-card{\n    background: rgba(22, 28, 45, 0.85);\n    backdrop-filter: blur(20px);\n    border:1px solid var(--border-strong);\n    border-radius: var(--radius-lg);\n    padding:2.5rem 2rem;\n    width:100%;max-width:400px;\n    box-shadow: var(--shadow-lg);\n    text-align:center;\n  }\n  .login-logo{\n    width:64px;height:64px;margin:0 auto 1.5rem;\n    background:var(--gradient);\n    border-radius:16px;\n    display:flex;align-items:center;justify-content:center;\n    box-shadow:0 0 40px var(--accent-glow);\n  }\n  .login-card h1{font-size:1.25rem;margin-bottom:.5rem}\n  .login-card p{color:var(--muted);font-size:.85rem;margin-bottom:1.5rem}\n  .login-card .field{margin-bottom:1rem;text-align:right}\n  .login-card .field label{display:block;font-size:.8rem;color:var(--muted);margin-bottom:.4rem;font-weight:500}\n  .login-card .field input{width:100%}\n\n  /* ─── Layout ─── */\n  .app{display:none;flex-direction:column;min-height:100vh}\n  .app.active{display:flex}\n\n  /* Header */\n  .header{\n    position:sticky;top:0;z-index:50;\n    background: rgba(10,14,26,0.85);\n    backdrop-filter: blur(20px);\n    border-bottom:1px solid var(--border);\n    padding:.75rem 1.25rem;\n    display:flex;align-items:center;justify-content:space-between;\n    gap:1rem;\n  }\n  .header-left{display:flex;align-items:center;gap:.75rem}\n  .logo-mini{\n    width:36px;height:36px;\n    background:var(--gradient);\n    border-radius:10px;\n    display:flex;align-items:center;justify-content:center;\n    box-shadow:0 0 20px var(--accent-glow);\n  }\n  .header h1{font-size:1rem;font-weight:700}\n  .header h1 .sub{color:var(--muted);font-weight:400;font-size:.7rem;display:block}\n  .header-right{display:flex;align-items:center;gap:.5rem}\n  .worker-url-input{\n    background:var(--bg2);border:1px solid var(--border);color:var(--text);\n    padding:.4rem .6rem;border-radius:var(--radius-sm);font-size:.75rem;width:200px;\n    font-family:inherit;\n  }\n  .icon-btn{\n    width:36px;height:36px;display:inline-flex;align-items:center;justify-content:center;\n    background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius-sm);\n    color:var(--muted);cursor:pointer;transition:all .2s;\n  }\n  .icon-btn:hover{color:var(--accent);border-color:var(--border-strong);background:var(--card-hover)}\n  .icon-btn svg{width:18px;height:18px}\n  .icon-btn.del:hover{color:var(--red);border-color:var(--red)}\n  .icon-btn.success:hover{color:var(--green);border-color:var(--green)}\n\n  /* Nav */\n  .nav{\n    background: rgba(15,23,42,0.6);\n    border-bottom:1px solid var(--border);\n    padding:.5rem 1.25rem;\n    display:flex;gap:.25rem;overflow-x:auto;\n  }\n  .nav-btn{\n    padding:.5rem 1rem;border:none;background:transparent;\n    color:var(--muted);cursor:pointer;border-radius:var(--radius-sm);\n    font-family:inherit;font-size:.85rem;font-weight:500;\n    display:flex;align-items:center;gap:.4rem;white-space:nowrap;\n    transition: all .2s;\n  }\n  .nav-btn:hover{color:var(--text);background:var(--card-hover)}\n  .nav-btn.active{color:var(--accent);background:rgba(6,182,212,0.12)}\n  .nav-btn svg{width:16px;height:16px}\n\n  /* Main */\n  .main{padding:1.5rem;flex:1;max-width:1400px;margin:0 auto;width:100%}\n  .page{display:none;animation:fadeIn .3s ease}\n  .page.active{display:block}\n  @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}\n\n  .page-header{\n    display:flex;align-items:center;justify-content:space-between;\n    margin-bottom:1.25rem;flex-wrap:wrap;gap:.5rem;\n  }\n  .page-title{font-size:1.5rem;font-weight:700}\n  .page-title .count{color:var(--muted);font-size:.85rem;font-weight:400;margin-inline-start:.5rem}\n\n  /* ─── Components ─── */\n  .btn{\n    display:inline-flex;align-items:center;justify-content:center;gap:.4rem;\n    padding:.55rem 1rem;border-radius:var(--radius-sm);font-family:inherit;\n    font-size:.85rem;font-weight:500;cursor:pointer;border:1px solid transparent;\n    transition: all .2s;white-space:nowrap;\n  }\n  .btn svg{width:16px;height:16px}\n  .btn-primary{background:var(--gradient);color:#fff;box-shadow:0 4px 12px var(--accent-glow)}\n  .btn-primary:hover{opacity:.9;transform:translateY(-1px)}\n  .btn-ghost{background:var(--bg2);color:var(--text);border:1px solid var(--border)}\n  .btn-ghost:hover{border-color:var(--border-strong);background:var(--card-hover)}\n  .btn-danger{background:rgba(239,68,68,0.1);color:var(--red);border:1px solid rgba(239,68,68,0.3)}\n  .btn-danger:hover{background:rgba(239,68,68,0.2)}\n  .btn-sm{padding:.35rem .65rem;font-size:.75rem}\n  .btn:disabled{opacity:.5;cursor:not-allowed}\n\n  .field{margin-bottom:1rem}\n  .field label{display:block;font-size:.8rem;color:var(--muted);margin-bottom:.4rem;font-weight:500}\n  .field input,.field select,.field textarea{\n    width:100%;background:var(--bg2);border:1px solid var(--border);color:var(--text);\n    padding:.55rem .75rem;border-radius:var(--radius-sm);font-family:inherit;font-size:.85rem;\n    transition:all .2s;\n  }\n  .field input:focus,.field select:focus,.field textarea:focus{\n    outline:none;border-color:var(--accent);box-shadow:0 0 0 3px rgba(6,182,212,0.15);\n  }\n  .field input[type=checkbox]{width:auto;margin-inline-start:.4rem}\n  .field .hint{font-size:.7rem;color:var(--muted);margin-top:.3rem}\n\n  .search{\n    background:var(--bg2);border:1px solid var(--border);color:var(--text);\n    padding:.55rem .75rem .55rem 2rem;border-radius:var(--radius-sm);\n    font-family:inherit;font-size:.85rem;width:100%;transition:all .2s;\n    background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='11' cy='11' r='8'%3E%3C/circle%3E%3Cpath d='m21 21-4.35-4.35'%3E%3C/path%3E%3C/svg%3E\");\n    background-repeat:no-repeat;background-position:right .75rem center;\n  }\n  .search:focus{outline:none;border-color:var(--accent)}\n\n  /* Cards */\n  .card{\n    background:var(--card);\n    backdrop-filter:blur(10px);\n    border:1px solid var(--border);\n    border-radius:var(--radius);\n    padding:1.25rem;\n    transition:all .2s;\n  }\n  .card:hover{border-color:var(--border-strong)}\n  .grid{display:grid;gap:1rem}\n  .grid-2{grid-template-columns:repeat(auto-fit,minmax(280px,1fr))}\n  .grid-3{grid-template-columns:repeat(auto-fit,minmax(220px,1fr))}\n  .grid-4{grid-template-columns:repeat(auto-fit,minmax(180px,1fr))}\n\n  /* Stats */\n  .stat-card{\n    background:var(--gradient-card);\n    border:1px solid var(--border);\n    border-radius:var(--radius);\n    padding:1.25rem;\n    position:relative;overflow:hidden;\n  }\n  .stat-card::before{\n    content:'';position:absolute;top:0;right:0;width:60px;height:60px;\n    background:var(--gradient);opacity:.15;border-radius:50%;\n    transform:translate(20px,-20px);\n  }\n  .stat-card .stat-icon{\n    width:36px;height:36px;border-radius:10px;\n    display:flex;align-items:center;justify-content:center;\n    margin-bottom:.75rem;\n  }\n  .stat-card .stat-icon svg{width:20px;height:20px}\n  .stat-card .stat-label{font-size:.75rem;color:var(--muted);margin-bottom:.25rem}\n  .stat-card .stat-value{font-size:1.75rem;font-weight:700}\n  .stat-card .stat-sub{font-size:.7rem;color:var(--muted);margin-top:.25rem}\n\n  /* Table */\n  .table-wrap{overflow-x:auto;border-radius:var(--radius);border:1px solid var(--border)}\n  table{width:100%;border-collapse:collapse;font-size:.85rem}\n  th{background:var(--bg2);padding:.75rem 1rem;text-align:right;font-weight:600;color:var(--muted);font-size:.75rem;text-transform:uppercase;letter-spacing:.05em;white-space:nowrap}\n  td{padding:.75rem 1rem;border-top:1px solid var(--border);vertical-align:middle}\n  tr:hover td{background:var(--card-hover)}\n  td.empty{text-align:center;color:var(--muted);padding:2rem}\n\n  /* Badges */\n  .badge{\n    display:inline-flex;align-items:center;gap:.25rem;\n    padding:.2rem .55rem;border-radius:999px;font-size:.7rem;font-weight:500;\n  }\n  .b-forward{background:rgba(59,130,246,.15);color:var(--blue)}\n  .b-deep{background:rgba(168,85,247,.15);color:var(--purple)}\n  .b-viral{background:rgba(245,158,11,.15);color:var(--yellow)}\n  .b-on{background:rgba(16,185,129,.15);color:var(--green)}\n  .b-off{background:rgba(239,68,68,.15);color:var(--red)}\n  .b-warn{background:rgba(245,158,11,.15);color:var(--yellow)}\n\n  .check-list{max-height:300px;overflow-y:auto;border:1px solid var(--border);border-radius:var(--radius-sm);padding:.5rem}\n  .check-item{display:flex;align-items:center;gap:.5rem;padding:.5rem;border-radius:6px;cursor:pointer;transition:background .15s}\n  .check-item:hover{background:var(--card-hover)}\n  .check-item input{margin:0}\n\n  /* Modal */\n  .modal-overlay{\n    position:fixed;inset:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(4px);\n    display:none;align-items:flex-start;justify-content:center;z-index:100;\n    padding:2rem 1rem;overflow-y:auto;\n  }\n  .modal-overlay.active{display:flex}\n  .modal{\n    background:var(--card-solid);border:1px solid var(--border-strong);\n    border-radius:var(--radius-lg);width:100%;max-width:560px;margin:auto;\n    box-shadow:var(--shadow-lg);animation:modalIn .2s ease;\n  }\n  @keyframes modalIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}\n  .modal-header{\n    padding:1rem 1.25rem;border-bottom:1px solid var(--border);\n    display:flex;align-items:center;justify-content:space-between;\n  }\n  .modal-header h2{font-size:1.05rem;font-weight:600}\n  .modal-body{padding:1.25rem;max-height:60vh;overflow-y:auto}\n  .modal-actions{\n    padding:1rem 1.25rem;border-top:1px solid var(--border);\n    display:flex;justify-content:flex-end;gap:.5rem;\n  }\n\n  /* Toast */\n  .toast{\n    position:fixed;bottom:1.5rem;left:50%;transform:translateX(-50%);\n    background:var(--card-solid);border:1px solid var(--border-strong);\n    padding:.75rem 1.25rem;border-radius:var(--radius);\n    box-shadow:var(--shadow-lg);color:var(--text);font-size:.85rem;\n    z-index:1000;opacity:0;pointer-events:none;transition:all .3s;\n  }\n  .toast.show{opacity:1;bottom:2rem}\n  .toast.ok{border-color:var(--green)}\n  .toast.err{border-color:var(--red)}\n\n  /* Empty state */\n  .empty{\n    text-align:center;padding:2rem;color:var(--muted);\n    display:flex;flex-direction:column;align-items:center;gap:.5rem;\n  }\n  .empty svg{width:32px;height:32px;opacity:.5}\n\n  /* Log entries */\n  .log-entry{\n    background:var(--card);border:1px solid var(--border);\n    border-radius:var(--radius-sm);padding:.75rem 1rem;margin-bottom:.5rem;\n    transition:all .15s;\n  }\n  .log-entry.expandable{cursor:pointer}\n  .log-entry.no-expand{cursor:default;opacity:.65}\n  .log-entry:hover{border-color:var(--border-strong)}\n  .log-entry.expanded{border-color:var(--accent)}\n  .log-entry .log-header{display:flex;justify-content:space-between;align-items:start;gap:.5rem;margin-bottom:.3rem;flex-wrap:wrap}\n  .log-entry .log-action{font-weight:600;font-size:.8rem}\n  .log-entry .log-time{font-size:.7rem;color:var(--muted);white-space:nowrap}\n  .log-entry .log-detail{font-size:.8rem;color:var(--text);opacity:.85}\n  .log-entry .log-breakdown{\n    background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-sm);\n    padding:.5rem .75rem;margin-top:.5rem;\n    font-family:'Vazirmatn',monospace;font-size:.75rem;\n    white-space:pre-wrap;color:var(--accent);\n    display:none;\n  }\n  .log-entry.expanded .log-breakdown{display:block}\n  .log-entry .log-ai-raw{\n    background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.3);\n    border-radius:var(--radius-sm);padding:.5rem .75rem;margin-top:.5rem;\n    font-family:monospace;font-size:.7rem;\n    color:var(--yellow);direction:ltr;text-align:left;\n    max-height:200px;overflow-y:auto;display:none;\n  }\n  .log-entry.expanded .log-ai-raw{display:block}\n  .log-badge{display:inline-block;padding:.1rem .4rem;border-radius:4px;font-size:.65rem;margin-inline-start:.3rem}\n  .log-badge.sent{background:rgba(16,185,129,.2);color:var(--green)}\n  .log-badge.skipped{background:rgba(245,158,11,.2);color:var(--yellow)}\n  .log-badge.error{background:rgba(239,68,68,.2);color:var(--red)}\n  .log-badge.ai_raw{background:rgba(168,85,247,.2);color:var(--purple)}\n  .log-badge.ai_analyze{background:rgba(6,182,212,.2);color:var(--accent)}\n  .log-badge.scanned{background:rgba(59,130,246,.2);color:var(--blue)}\n\n  /* AI Pending */\n  .ai-pending-card{\n    background:var(--card);border:1px solid var(--border-strong);\n    border-radius:var(--radius);padding:1rem;margin-bottom:.75rem;\n  }\n  .ai-pending-card .kw-grid{display:flex;flex-wrap:wrap;gap:.3rem;margin-top:.5rem}\n  .kw-badge{\n    display:inline-flex;align-items:center;gap:.2rem;\n    padding:.25rem .5rem;border-radius:6px;font-size:.75rem;cursor:pointer;\n    transition:all .15s;border:1px solid transparent;\n  }\n  .kw-badge:hover{transform:translateY(-1px)}\n  .kw-badge.selected{opacity:1}\n  .kw-badge.deselected{opacity:.35;text-decoration:line-through}\n  .kw-main{background:rgba(16,185,129,.15);color:var(--green);border-color:rgba(16,185,129,.3)}\n  .kw-comp{background:rgba(168,85,247,.15);color:var(--purple);border-color:rgba(168,85,247,.3)}\n  .kw-periph{background:rgba(245,158,11,.15);color:var(--yellow);border-color:rgba(245,158,11,.3)}\n  .kw-pos{background:rgba(16,185,129,.15);color:var(--green);border-color:rgba(16,185,129,.3)}\n  .kw-neg{background:rgba(239,68,68,.15);color:var(--red);border-color:rgba(239,68,68,.3)}\n\n  /* Reaction rule editor */\n  .reaction-rules{display:flex;flex-direction:column;gap:.5rem}\n  .reaction-rule{\n    display:flex;align-items:center;gap:.5rem;\n    background:var(--bg2);border:1px solid var(--border);\n    border-radius:var(--radius-sm);padding:.5rem;\n  }\n  .reaction-rule select{\n    min-width:140px;background:var(--bg);border:1px solid var(--border);color:var(--text);\n    padding:.4rem;border-radius:6px;font-size:.9rem;font-family:inherit;\n    max-width:200px;\n  }\n  .reaction-rule input[type=text]{\n    width:50px;text-align:center;font-size:1.1rem;\n    background:var(--bg);border:1px solid var(--border);color:var(--text);\n    padding:.4rem;border-radius:6px;\n  }\n  .reaction-rule input[type=number]{\n    flex:1;min-width:90px;background:var(--bg);border:1px solid var(--border);color:var(--text) !important;\n    padding:.45rem .6rem;border-radius:6px;font-family:inherit;font-size:.9rem;\n    direction:ltr;text-align:left;\n  }\n  .reaction-rule .remove-rule{\n    background:transparent;border:none;color:var(--red);cursor:pointer;\n    width:28px;height:28px;display:flex;align-items:center;justify-content:center;\n    border-radius:6px;font-size:1rem;\n  }\n\n  /* ─── بهینه‌سازی پیشرفته برای موبایل (Mobile Responsiveness) ─── */\n  @media (max-width: 768px){\n    .header{\n      padding: .6rem .75rem;\n      flex-wrap: wrap;\n      gap: .5rem;\n    }\n    .header-left{\n      gap: .5rem;\n      flex: 1;\n      min-width: 0;\n    }\n    .header h1{\n      font-size: .88rem;\n      line-height: 1.3;\n      white-space: nowrap;\n      overflow: hidden;\n      text-overflow: ellipsis;\n    }\n    .header h1 .sub{\n      font-size: .65rem;\n      white-space: nowrap;\n      overflow: hidden;\n      text-overflow: ellipsis;\n      max-width: 130px;\n    }\n    .header-right{\n      gap: .35rem;\n      flex-shrink: 0;\n    }\n    .worker-url-input{\n      width: 105px;\n      padding: .35rem .5rem;\n      font-size: .72rem;\n    }\n    .icon-btn{\n      width: 38px;\n      height: 38px;\n      min-width: 38px;\n      min-height: 38px;\n    }\n\n    /* نوبار لمسی بهینه با اسکرول افقی روان */\n    .nav{\n      padding: .4rem .5rem;\n      gap: .35rem;\n      -webkit-overflow-scrolling: touch;\n      scrollbar-width: none;\n    }\n    .nav::-webkit-scrollbar{\n      display: none;\n    }\n    .nav-btn{\n      font-size: .8rem;\n      padding: .5rem .75rem;\n      min-height: 40px;\n      flex-shrink: 0;\n    }\n\n    .main{\n      padding: .85rem .6rem;\n      max-width: 100%;\n    }\n    .page-header{\n      flex-direction: column;\n      align-items: stretch;\n      gap: .65rem;\n      margin-bottom: 1rem;\n    }\n    .page-header .btn{\n      width: 100%;\n      justify-content: center;\n      min-height: 42px;\n    }\n    .page-title{\n      font-size: 1.2rem;\n    }\n\n    /* شبکه کارت‌ها در موبایل تک‌ستونه */\n    .grid-2, .grid-3, .grid-4{\n      grid-template-columns: 1fr;\n      gap: .75rem;\n    }\n    .stat-card{\n      padding: 1rem;\n    }\n    .stat-card .stat-value{\n      font-size: 1.45rem;\n    }\n\n    /* جدول‌ها در موبایل */\n    .table-wrap{\n      margin: 0 -0.6rem;\n      border-radius: 0;\n      border-left: none;\n      border-right: none;\n      -webkit-overflow-scrolling: touch;\n    }\n    th, td{\n      padding: .6rem .65rem;\n      font-size: .78rem;\n    }\n\n    /* مدال‌ها به شکل Bottom Sheet روی موبایل */\n    .modal-overlay{\n      padding: 0;\n      align-items: flex-end;\n    }\n    .modal{\n      max-width: 100%;\n      width: 100%;\n      border-radius: 20px 20px 0 0;\n      max-height: 92vh;\n      border-bottom: none;\n      animation: modalSheetUp .25s cubic-bezier(0.16, 1, 0.3, 1);\n    }\n    @keyframes modalSheetUp{\n      from{transform:translateY(100%);opacity:.8}\n      to{transform:translateY(0);opacity:1}\n    }\n    .modal-body{\n      max-height: calc(92vh - 125px);\n      padding: 1rem;\n      -webkit-overflow-scrolling: touch;\n    }\n    .modal-actions{\n      padding: .75rem 1rem;\n      position: sticky;\n      bottom: 0;\n      background: var(--card-solid);\n      z-index: 5;\n    }\n    .modal-actions .btn{\n      flex: 1;\n      justify-content: center;\n      min-height: 42px;\n    }\n\n    /* جلوگیری از بزرگنمایی ناخواسته سافاری در iOS */\n    .field input, .field select, .field textarea, .search{\n      font-size: 16px !important;\n    }\n\n    /* ویرایشگر قوانین ری‌اکشن در موبایل */\n    .reaction-rule{\n      flex-wrap: wrap;\n      gap: .4rem;\n    }\n    .reaction-rule select{\n      max-width: 100%;\n      width: 100%;\n    }\n    .reaction-rule input[type=number]{\n      flex: 1;\n    }\n\n    /* لاگ‌ها در موبایل */\n    .log-entry .log-header{\n      flex-direction: column;\n      align-items: flex-start;\n      gap: .25rem;\n    }\n    .log-entry .log-breakdown{\n      font-size: .7rem;\n      word-break: break-word;\n    }\n  }\n\n  @media (max-width: 480px){\n    .worker-url-input{\n      width: 85px;\n      font-size: .68rem;\n      padding: .3rem .4rem;\n    }\n    .logo-mini{\n      width: 32px;\n      height: 32px;\n    }\n    .logo-mini svg{\n      width: 17px;\n      height: 17px;\n    }\n  }\n</style>\n</head>\n<body>\n\n<!-- ─── Login ─── -->\n<div class=\"login-wrap\" id=\"login\">\n  <div style=\"position:absolute;top:1rem;left:1rem;z-index:10\">\n    <button class=\"icon-btn theme-toggle-btn\" id=\"loginThemeToggle\" title=\"تغییر تم\" onclick=\"toggleTheme()\">\n      <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"4\"/><path d=\"M12 2v2\"/><path d=\"M12 20v2\"/><path d=\"m4.93 4.93 1.41 1.41\"/><path d=\"m17.66 17.66 1.41 1.41\"/><path d=\"M2 12h2\"/><path d=\"M20 12h2\"/><path d=\"m6.34 17.66-1.41 1.41\"/><path d=\"m19.07 4.93-1.41 1.41\"/></svg>\n    </button>\n  </div>\n  <div class=\"login-card\">\n    <div class=\"login-logo\">\n      <svg width=\"32\" height=\"32\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#fff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\">\n        <path d=\"M22 2 11 13\"/><path d=\"m22 2-7 20-4-9-9-4Z\"/>\n      </svg>\n    </div>\n    <h1>پنل مدیریت ربات</h1>\n    <p>برای ورود، آدرس Worker و رمز عبور را وارد کنید</p>\n    <div class=\"field\">\n      <label>آدرس Worker</label>\n      <input id=\"loginWorker\" placeholder=\"https://your-worker.workers.dev\" />\n    </div>\n    <div class=\"field\">\n      <label>رمز عبور</label>\n      <input id=\"loginPass\" type=\"password\" placeholder=\"••••••••\" onkeydown=\"if(event.key==='Enter')doLogin()\" />\n    </div>\n    <button class=\"btn btn-primary\" style=\"width:100%\" onclick=\"doLogin()\">ورود</button>\n  </div>\n</div>\n\n<!-- ─── App ─── -->\n<div class=\"app\" id=\"app\">\n  <!-- Header -->\n  <header class=\"header\">\n    <div class=\"header-left\">\n      <div class=\"logo-mini\">\n        <svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#fff\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\">\n          <path d=\"M22 2 11 13\"/><path d=\"m22 2-7 20-4-9-9-4Z\"/>\n        </svg>\n      </div>\n      <h1>پنل مدیریت ربات <span class=\"sub\" id=\"hdrWorker\">...</span></h1>\n    </div>\n    <div class=\"header-right\">\n      <input class=\"worker-url-input\" id=\"workerUrl\" placeholder=\"Worker URL\" onchange=\"updateWorker()\" />\n      <button class=\"icon-btn theme-toggle-btn\" id=\"themeToggle\" title=\"تغییر تم به روشن یا تاریک\" onclick=\"toggleTheme()\">\n        <!-- آیکون خورشید / ماه دینامیک -->\n      </button>\n      <button class=\"icon-btn\" title=\"به‌روزرسانی\" onclick=\"loadAll()\">\n        <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8\"/><path d=\"M21 3v5h-5\"/><path d=\"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16\"/><path d=\"M8 16H3v5\"/></svg>\n      </button>\n      <button class=\"icon-btn del\" title=\"خروج\" onclick=\"logout()\">\n        <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4\"/><polyline points=\"16 17 21 12 16 7\"/><line x1=\"21\" y1=\"12\" x2=\"9\" y2=\"12\"/></svg>\n      </button>\n    </div>\n  </header>\n\n  <!-- Nav -->\n  <nav class=\"nav\" id=\"nav\">\n    <button class=\"nav-btn active\" data-page=\"dashboard\" onclick=\"showPage('dashboard',this)\">\n      <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect width=\"7\" height=\"9\" x=\"3\" y=\"3\" rx=\"1\"/><rect width=\"7\" height=\"5\" x=\"14\" y=\"3\" rx=\"1\"/><rect width=\"7\" height=\"9\" x=\"14\" y=\"12\" rx=\"1\"/><rect width=\"7\" height=\"5\" x=\"3\" y=\"16\" rx=\"1\"/></svg>\n      داشبورد\n    </button>\n    <button class=\"nav-btn\" data-page=\"sources\" onclick=\"showPage('sources',this)\">\n      <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M4 11a9 9 0 0 1 9 9\"/><path d=\"M4 4a16 16 0 0 1 16 16\"/><circle cx=\"5\" cy=\"19\" r=\"1\"/></svg>\n      منابع\n    </button>\n    <button class=\"nav-btn\" data-page=\"ai\" onclick=\"showPage('ai',this)\">\n      <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 8V4H8\"/><rect width=\"16\" height=\"12\" x=\"4\" y=\"8\" rx=\"2\"/><path d=\"M2 14h2\"/><path d=\"M20 14h2\"/><path d=\"M15 13v2\"/><path d=\"M9 13v2\"/></svg>\n      هوش مصنوعی\n    </button>\n    <button class=\"nav-btn\" data-page=\"report\" onclick=\"showPage('report',this)\">\n      <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z\"/><path d=\"M14 2v6h6\"/><path d=\"M16 13H8\"/><path d=\"M16 17H8\"/><path d=\"M10 9H8\"/></svg>\n      گزارش\n    </button>\n    <button class=\"nav-btn\" data-page=\"logs\" onclick=\"showPage('logs',this)\">\n      <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z\"/><path d=\"M14 2v6h6\"/><path d=\"M12 18v-6\"/><path d=\"M9 15h6\"/></svg>\n      لاگ‌ها\n    </button>\n    <button class=\"nav-btn\" data-page=\"quarantine\" onclick=\"showPage('quarantine',this)\">\n      <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z\"/><path d=\"M12 9v4\"/><path d=\"M12 17h.01\"/></svg>\n      قرنطینه\n    </button>\n    <button class=\"nav-btn\" data-page=\"adblock\" onclick=\"showPage('adblock',this)\">\n      <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M6 4a14 14 0 0 0 0 16\"/><path d=\"M18 4a14 14 0 0 1 0 16\"/><path d=\"M4 12h16\"/></svg>\n      ضد تبلیغات\n    </button>\n    <button class=\"nav-btn\" data-page=\"admins\" onclick=\"showPage('admins',this)\">\n      <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2\"/><circle cx=\"9\" cy=\"7\" r=\"4\"/><path d=\"M22 21v-2a4 4 0 0 0-3-3.87\"/><path d=\"M16 3.13a4 4 0 0 1 0 7.75\"/></svg>\n      ادمین‌ها\n    </button>\n    <button class=\"nav-btn\" data-page=\"backup\" onclick=\"showPage('backup',this)\">\n      <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><ellipse cx=\"12\" cy=\"5\" rx=\"9\" ry=\"3\"/><path d=\"M3 5V19A9 3 0 0 0 21 19V5\"/><path d=\"M3 12A9 3 0 0 0 21 12\"/></svg>\n      بکاپ\n    </button>\n  </nav>\n\n  <main class=\"main\">\n    <!-- ─── Dashboard ─── -->\n    <div class=\"page active\" id=\"page-dashboard\">\n      <div class=\"page-header\"><h2 class=\"page-title\">داشبورد</h2></div>\n      <div class=\"grid grid-4\" id=\"statsGrid\"></div>\n      <div class=\"grid grid-2\" style=\"margin-top:1rem\">\n        <div class=\"card\">\n          <h3 style=\"font-size:.9rem;margin-bottom:1rem;color:var(--muted)\">📈 ارسال روزانه (۷ روز)</h3>\n          <canvas id=\"dailyChart\" height=\"120\"></canvas>\n        </div>\n        <div class=\"card\">\n          <h3 style=\"font-size:.9rem;margin-bottom:1rem;color:var(--muted)\">⚡ عملکردها</h3>\n          <canvas id=\"actionChart\" height=\"120\"></canvas>\n        </div>\n      </div>\n    </div>\n\n    <!-- ─── Sources ─── -->\n    <div class=\"page\" id=\"page-sources\">\n      <div class=\"page-header\">\n        <h2 class=\"page-title\">منابع <span class=\"count\" id=\"sourcesCount\"></span></h2>\n        <div style=\"display:flex;gap:.5rem;flex-wrap:wrap\">\n          <input class=\"search\" id=\"srcSearch\" placeholder=\"جستجوی کانال...\" style=\"width:200px\" oninput=\"renderSources()\" />\n          <button class=\"btn btn-ghost\" onclick=\"openBulkEdit()\">🔧 ویرایش گروهی</button>\n          <button class=\"btn btn-primary\" onclick=\"openAddModal()\">➕ افزودن منبع</button>\n        </div>\n      </div>\n      <div class=\"table-wrap\">\n        <table>\n          <thead>\n            <tr>\n              <th>#</th><th>کانال</th><th>موضوع</th><th>حالت</th><th>کلیدواژه‌ها</th><th>مقصد</th><th>ضد تبلیغ</th><th>کلیدواژه AI</th><th>وضعیت</th><th>عملیات</th>\n            </tr>\n          </thead>\n          <tbody id=\"sourcesBody\"></tbody>\n        </table>\n      </div>\n    </div>\n\n    <!-- ─── AI ─── -->\n    <div class=\"page\" id=\"page-ai\">\n      <div class=\"page-header\">\n        <h2 class=\"page-title\">هوش مصنوعی</h2>\n        <button class=\"btn btn-ghost\" onclick=\"loadAIPending()\">🔄 به‌روزرسانی</button>\n      </div>\n      <div class=\"card\" style=\"margin-bottom:1rem\">\n        <h3 style=\"font-size:.95rem;margin-bottom:.75rem\">🤖 تحلیل دستی کلیدواژه</h3>\n        <p style=\"color:var(--muted);font-size:.8rem;margin-bottom:.75rem\">\n          یک منبع را انتخاب کنید. هوش مصنوعی ۳۰ پست اخیر را تحلیل کرده و کلیدواژه‌های پیشنهادی (بر اساس حالت Deep) ارائه می‌دهد.\n        </p>\n        <div id=\"aiAnalyzeSources\"></div>\n        <button class=\"btn btn-primary\" style=\"margin-top:.75rem\" onclick=\"triggerAIAnalyze()\">🤖 شروع تحلیل</button>\n        <div id=\"aiAnalyzeStatus\" style=\"margin-top:.75rem\"></div>\n      </div>\n      <h3 style=\"font-size:1rem;margin:1rem 0 .75rem\">📋 کلیدواژه‌های pending</h3>\n      <div id=\"aiPendingBody\"></div>\n    </div>\n\n    <!-- ─── Report ─── -->\n    <div class=\"page\" id=\"page-report\">\n      <div class=\"page-header\">\n        <h2 class=\"page-title\">گزارش روزانه</h2>\n        <button class=\"btn btn-ghost\" onclick=\"loadReport()\">🔄 به‌روزرسانی</button>\n      </div>\n      <div class=\"card\" style=\"margin-bottom:1rem\">\n        <div style=\"display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:.5rem\">\n          <div>\n            <h3 style=\"font-size:.95rem\">📊 گزارش ۲۴ ساعت اخیر</h3>\n            <p style=\"color:var(--muted);font-size:.75rem;margin-top:.25rem\" id=\"reportMeta\"></p>\n          </div>\n          <button class=\"btn btn-primary\" onclick=\"triggerReport()\">📧 ارسال به ادمین</button>\n        </div>\n      </div>\n      <div id=\"reportBody\"></div>\n    </div>\n\n    <!-- ─── Logs ─── -->\n    <div class=\"page\" id=\"page-logs\">\n      <div class=\"page-header\">\n        <h2 class=\"page-title\">لاگ‌ها <span class=\"count\" id=\"logsCount\"></span></h2>\n        <button class=\"btn btn-ghost\" onclick=\"loadLogs()\">🔄 به‌روزرسانی</button>\n      </div>\n      <div class=\"card\" style=\"margin-bottom:1rem;display:flex;gap:.5rem;flex-wrap:wrap;align-items:center\">\n        <select id=\"logActionFilter\" onchange=\"loadLogs()\" style=\"background:var(--bg2);border:1px solid var(--border);color:var(--text);padding:.5rem .8rem;border-radius:8px;font-size:.85rem;font-family:inherit\">\n          <option value=\"\">همه</option>\n          <option value=\"sent\">ارسال شد</option>\n          <option value=\"skipped\">رد شد</option>\n          <option value=\"scanned\">اسکن</option>\n          <option value=\"error\">خطا</option>\n          <option value=\"ai_analyze\">تحلیل AI</option>\n          <option value=\"ai_raw\">پاسخ AI</option>\n          <option value=\"daily_report\">گزارش روزانه</option>\n          <option value=\"report_ad\">گزارش تبلیغ</option>\n          <option value=\"restore\">بازیابی</option>\n        </select>\n        <input class=\"search\" id=\"logSearch\" placeholder=\"جستجو در متن...\" style=\"width:240px\" oninput=\"loadLogs()\" />\n        <label style=\"font-size:.8rem;color:var(--muted);display:flex;align-items:center;gap:.3rem\">\n          <input type=\"checkbox\" id=\"logAutoRefresh\" onchange=\"toggleLogAutoRefresh()\" /> به‌روزرسانی خودکار (۳۰ ثانیه)\n        </label>\n      </div>\n      <div id=\"logsHint\" style=\"font-size:.75rem;color:var(--muted);margin-bottom:.5rem\">💡 روی هر لاگ کلیک کنید تا جزئیات (breakdown) نمایش داده شود</div>\n      <div id=\"logsBody\"></div>\n    </div>\n\n    <!-- ─── Quarantine ─── -->\n    <div class=\"page\" id=\"page-quarantine\">\n      <div class=\"page-header\">\n        <h2 class=\"page-title\">قرنطینه</h2>\n        <button class=\"btn btn-ghost\" onclick=\"loadQuarantine()\">🔄 به‌روزرسانی</button>\n      </div>\n      <div id=\"quarantineBody\"></div>\n    </div>\n\n    <!-- ─── Ad Block ─── -->\n    <div class=\"page\" id=\"page-adblock\">\n      <div class=\"page-header\">\n        <h2 class=\"page-title\">سیستم ضد تبلیغات</h2>\n        <button class=\"btn btn-ghost\" onclick=\"loadAdWeights()\">🔄 به‌روزرسانی</button>\n      </div>\n      <div class=\"card\" style=\"margin-bottom:1rem\">\n        <h3 style=\"font-size:.95rem;margin-bottom:.5rem\">➕ افزودن وزن دستی</h3>\n        <div style=\"display:flex;gap:.5rem;flex-wrap:wrap\">\n          <input id=\"adwToken\" placeholder=\"کلمه/لینک/دامنه\" style=\"flex:1;min-width:200px;background:var(--bg2);border:1px solid var(--border);color:var(--text);padding:.5rem .75rem;border-radius:8px;font-family:inherit\" />\n          <select id=\"adwType\" style=\"background:var(--bg2);border:1px solid var(--border);color:var(--text);padding:.5rem;border-radius:8px;font-family:inherit\">\n            <option value=\"word\">word</option>\n            <option value=\"link\">link</option>\n            <option value=\"emoji\">emoji</option>\n            <option value=\"domain\">domain</option>\n            <option value=\"bot_id\">bot_id</option>\n            <option value=\"pattern\">pattern</option>\n          </select>\n          <input id=\"adwWeight\" type=\"number\" value=\"30\" style=\"width:80px;background:var(--bg2);border:1px solid var(--border);color:var(--text);padding:.5rem;border-radius:8px;font-family:inherit\" />\n          <button class=\"btn btn-primary\" onclick=\"addAdWeight()\">افزودن</button>\n        </div>\n      </div>\n      <div class=\"table-wrap\">\n        <table>\n          <thead><tr><th>توکن</th><th>نوع</th><th>وزن</th><th>hits</th><th>auto</th><th>عملیات</th></tr></thead>\n          <tbody id=\"adWeightsBody\"></tbody>\n        </table>\n      </div>\n    </div>\n\n    <!-- ─── Admins ─── -->\n    <div class=\"page\" id=\"page-admins\">\n      <div class=\"page-header\">\n        <h2 class=\"page-title\">ادمین‌ها</h2>\n        <button class=\"btn btn-primary\" onclick=\"openAddAdmin()\">➕ افزودن ادمین</button>\n      </div>\n      <div class=\"card\" style=\"margin-bottom:1rem\" id=\"mainAdmin\"></div>\n      <h3 style=\"font-size:1rem;margin:.75rem 0\">ادمین‌های فرعی</h3>\n      <div class=\"table-wrap\">\n        <table>\n          <thead><tr><th>نام و آیدی ادمین</th><th>افزوده توسط</th><th>دسترسی‌ها</th><th>عملیات</th></tr></thead>\n          <tbody id=\"adminsBody\"></tbody>\n        </table>\n      </div>\n    </div>\n\n    <!-- ─── Backup ─── -->\n    <div class=\"page\" id=\"page-backup\">\n      <div class=\"page-header\"><h2 class=\"page-title\">بکاپ‌گیری و بازیابی</h2></div>\n      <div class=\"grid grid-2\">\n        <div class=\"card\">\n          <h3 style=\"font-size:.95rem;margin-bottom:.75rem\">💾 بکاپ‌گیری</h3>\n          <p style=\"color:var(--muted);font-size:.8rem;margin-bottom:.75rem\">\n            دانلود فایل JSON شامل منابع + وزن‌های ضد تبلیغات + پیکربندی قرنطینه. بدون لاگ‌ها.\n          </p>\n          <button class=\"btn btn-primary\" onclick=\"downloadBackup()\">📥 دانلود بکاپ</button>\n        </div>\n        <div class=\"card\">\n          <h3 style=\"font-size:.95rem;margin-bottom:.75rem\">📤 بازیابی</h3>\n          <p style=\"color:var(--muted);font-size:.8rem;margin-bottom:.75rem\">\n            فایل JSON بکاپ را آپلود کنید تا منابع + وزن‌ها بازیابی شوند.\n          </p>\n          <input type=\"file\" id=\"restoreFile\" accept=\".json\" style=\"margin-bottom:.5rem\" />\n          <button class=\"btn btn-primary\" onclick=\"doRestore()\">📤 بازیابی</button>\n        </div>\n      </div>\n    </div>\n\n  </main>\n</div>\n\n<!-- Modal -->\n<div class=\"modal-overlay\" id=\"modal\" onclick=\"if(event.target===this)closeModal()\">\n  <div class=\"modal\">\n    <div class=\"modal-header\">\n      <h2 id=\"modalTitle\"></h2>\n      <button class=\"icon-btn\" onclick=\"closeModal()\">\n        <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><line x1=\"18\" y1=\"6\" x2=\"6\" y2=\"18\"/><line x1=\"6\" y1=\"6\" x2=\"18\" y2=\"18\"/></svg>\n      </button>\n    </div>\n    <div class=\"modal-body\" id=\"modalContent\"></div>\n    <div class=\"modal-actions\" id=\"modalActions\"></div>\n  </div>\n</div>\n\n<div class=\"toast\" id=\"toast\"></div>\n\n<script>\n// ─── متغیرهای سراسری و تلگرام مینی‌اپ ───\nconst tgWebApp = (window.Telegram && window.Telegram.WebApp) ? window.Telegram.WebApp : null;\nlet defaultOrigin = '';\nif (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin.startsWith('http') && !window.location.origin.includes('localhost:3000') && !window.location.origin.includes('127.0.0.1')) {\n  defaultOrigin = window.location.origin;\n}\nlet WORKER_URL = localStorage.getItem('workerUrl') || defaultOrigin;\nlet SOURCES = [];\nlet LOGS = [];\nlet logAutoRefreshTimer = null;\nlet aiSelectedSource = null;\nlet aiAnalyzing = false;\nlet pendingSelection = {};\nlet charts = {};\n\n// راه‌اندازی Telegram Mini App در صورت باز شدن در تلگرام\nif (tgWebApp) {\n  try {\n    tgWebApp.ready();\n    tgWebApp.expand();\n    if (tgWebApp.setHeaderColor) tgWebApp.setHeaderColor('#0a0e1a');\n    if (tgWebApp.setBackgroundColor) tgWebApp.setBackgroundColor('#0a0e1a');\n    if (tgWebApp.colorScheme === 'light' && !localStorage.getItem('panel_theme')) {\n      document.documentElement.setAttribute('data-theme', 'light');\n    }\n  } catch(e) {}\n}\n\nfunction closeMiniApp() {\n  if (tgWebApp) {\n    try { tgWebApp.close(); } catch(e) {}\n  }\n}\n\n// ─── توابع کمکی ───\nfunction $(s){return document.querySelector(s)}\nfunction $$(s){return document.querySelectorAll(s)}\nfunction toast(msg, ok=true){\n  const t = $('#toast');\n  t.textContent = msg;\n  t.className = 'toast show ' + (ok ? 'ok' : 'err');\n  setTimeout(() => t.className = 'toast', 2800);\n}\nasync function api(path, opts={}) {\n  const r = await fetch(WORKER_URL + '/api/' + path, {\n    ...opts,\n    credentials: 'include',\n    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },\n  });\n  if (r.status === 401) { logout(); throw new Error('Unauthorized'); }\n  const d = await r.json();\n  if (!r.ok) throw new Error(d.error || 'Error');\n  return d;\n}\nfunction esc(s){return String(s||'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]))}\nfunction fmtDate(ts){if(!ts)return '—';return new Date(ts).toLocaleString('fa-IR',{hour:'2-digit',minute:'2-digit',day:'numeric',month:'short'})}\nfunction safeJson(s, def){if(s===null||s===undefined||s==='')return def;if(typeof s==='object')return s;try{return JSON.parse(s)}catch{return def}}\nfunction modeBadge(m, deepScoring = null){\n  if(m === 'deep'){\n    if(deepScoring === 1 || deepScoring === true || deepScoring === '1') return '<span class=\"badge b-deep\">📊 Deep Scoring</span>';\n    if(deepScoring === 0 || deepScoring === false || deepScoring === '0') return '<span class=\"badge b-deep\">📋 Deep Classic</span>';\n    return '<span class=\"badge b-deep\">🔎 عمیق</span>';\n  }\n  const n={forward:'📤 فوروارد',viral:'👁 وایرال'}[m]||m;\n  return `<span class=\"badge b-${m}\">${n}</span>`;\n}\n\n// ─── آیکون‌های SVG ───\nconst ICONS = {\n  send:`<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"m22 2-7 20-4-9-9-4Z\"/><path d=\"M22 2 11 13\"/></svg>`,\n  skip:`<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><polygon points=\"5 4 15 12 5 20 5 4\"/><line x1=\"19\" y1=\"5\" x2=\"19\" y2=\"19\"/></svg>`,\n  error:`<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"10\"/><line x1=\"12\" y1=\"8\" x2=\"12\" y2=\"12\"/><line x1=\"12\" y1=\"16\" x2=\"12.01\" y2=\"16\"/></svg>`,\n  ai:`<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect width=\"18\" height=\"10\" x=\"3\" y=\"11\" rx=\"2\"/><circle cx=\"12\" cy=\"5\" r=\"2\"/><path d=\"M12 7v4\"/><line x1=\"8\" y1=\"16\" x2=\"8\" y2=\"16\"/><line x1=\"16\" y1=\"16\" x2=\"16\" y2=\"16\"/></svg>`,\n  eye:`<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/></svg>`,\n  bot:`<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect width=\"18\" height=\"10\" x=\"3\" y=\"11\" rx=\"2\"/><circle cx=\"12\" cy=\"5\" r=\"2\"/><path d=\"M12 7v4\"/><line x1=\"8\" y1=\"16\" x2=\"8\" y2=\"16\"/><line x1=\"16\" y1=\"16\" x2=\"16\" y2=\"16\"/></svg>`,\n  shield:`<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1Z\"/></svg>`,\n  bug:`<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect width=\"8\" height=\"14\" x=\"8\" y=\"6\" rx=\"4\"/><path d=\"m19 7-3 2\"/><path d=\"m5 7 3 2\"/><path d=\"m19 19-3-2\"/><path d=\"m5 19 3-2\"/><path d=\"M20 13h-4\"/><path d=\"M4 13h4\"/><path d=\"m10 4 1 2\"/><path d=\"m14 4-1 2\"/></svg>`,\n  source:`<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M4 11a9 9 0 0 1 9 9\"/><path d=\"M4 4a16 16 0 0 1 16 16\"/><circle cx=\"5\" cy=\"19\" r=\"1\"/></svg>`,\n  sun:`<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"4\"/><path d=\"M12 2v2\"/><path d=\"M12 20v2\"/><path d=\"m4.93 4.93 1.41 1.41\"/><path d=\"m17.66 17.66 1.41 1.41\"/><path d=\"M2 12h2\"/><path d=\"M20 12h2\"/><path d=\"m6.34 17.66-1.41 1.41\"/><path d=\"m19.07 4.93-1.41 1.41\"/></svg>`,\n  moon:`<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z\"/></svg>`,\n};\n\n// ─── مدیریت تم (Dark / Light Mode) ───\nfunction initTheme() {\n  const saved = localStorage.getItem('panel_theme');\n  const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;\n  const theme = saved || (prefersLight ? 'light' : 'dark');\n  applyTheme(theme);\n}\nfunction applyTheme(theme) {\n  document.documentElement.setAttribute('data-theme', theme);\n  localStorage.setItem('panel_theme', theme);\n  const icon = theme === 'dark' ? ICONS.sun : ICONS.moon;\n  const title = theme === 'dark' ? 'تغییر به تم روشن' : 'تغییر به تم تاریک';\n  \n  const hdrBtn = $('#themeToggle');\n  if(hdrBtn){\n    hdrBtn.innerHTML = icon;\n    hdrBtn.title = title;\n  }\n  const loginBtn = $('#loginThemeToggle');\n  if(loginBtn){\n    loginBtn.innerHTML = icon;\n    loginBtn.title = title;\n  }\n\n  // به‌روزرسانی نمودارها در صورت لود بودن\n  const tickColor = theme === 'dark' ? '#94a3b8' : '#475569';\n  const gridColor = theme === 'dark' ? 'rgba(148, 163, 184, 0.1)' : 'rgba(148, 163, 184, 0.15)';\n  if (charts.daily && charts.daily.options) {\n    charts.daily.options.scales.x.ticks.color = tickColor;\n    if(charts.daily.options.scales.x.grid) charts.daily.options.scales.x.grid.color = gridColor;\n    charts.daily.options.scales.y.ticks.color = tickColor;\n    if(charts.daily.options.scales.y.grid) charts.daily.options.scales.y.grid.color = gridColor;\n    charts.daily.update();\n  }\n  if (charts.action && charts.action.options) {\n    charts.action.options.plugins.legend.labels.color = tickColor;\n    charts.action.update();\n  }\n}\nfunction toggleTheme() {\n  const current = document.documentElement.getAttribute('data-theme') || 'dark';\n  applyTheme(current === 'dark' ? 'light' : 'dark');\n}\n\n// مقداردهی اولیه تم قبل از هر چیز\ninitTheme();\n\n// ─── Auth ───\nasync function doLogin(){\n  const url = $('#loginWorker').value.trim().replace(/\\/$/, '');\n  const pass = $('#loginPass').value;\n  if(!url || !pass){toast('Worker URL و رمز عبور را وارد کنید', false);return}\n  WORKER_URL = url;\n  try{\n    const r = await fetch(url+'/api/login', {method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body:JSON.stringify({password:pass})});\n    if(!r.ok){const d=await r.json().catch(()=>({}));throw new Error(d.error||'ورود ناموفق')}\n    localStorage.setItem('workerUrl', url);\n    $('#login').style.display='none';\n    $('#app').classList.add('active');\n    $('#workerUrl').value = url;\n    $('#hdrWorker').textContent = url.replace(/^https?:\\/\\//,'');\n    loadAll();\n  }catch(e){toast(e.message, false)}\n}\nfunction logout(){document.cookie='session=; Path=/; Max-Age=0';localStorage.removeItem('workerUrl');location.reload()}\nfunction updateWorker(){\n  WORKER_URL = $('#workerUrl').value.trim().replace(/\\/$/, '');\n  localStorage.setItem('workerUrl', WORKER_URL);\n  $('#hdrWorker').textContent = WORKER_URL.replace(/^https?:\\/\\//,'');\n  loadAll();\n}\n\n// پر کردن خودکار فیلد ورودی Worker URL در صفحه لاگین در صورت وجود\nif($('#loginWorker') && !$('#loginWorker').value && defaultOrigin){\n  $('#loginWorker').value = defaultOrigin;\n}\n\n// اگه قبلاً وارد شده، مستقیم اپ نمایش داده شود\nif(WORKER_URL){\n  fetch(WORKER_URL+'/api/stats', {credentials:'include'})\n    .then(r=>{if(r.ok){$('#login').style.display='none';$('#app').classList.add('active');$('#workerUrl').value=WORKER_URL;$('#hdrWorker').textContent=WORKER_URL.replace(/^https?:\\/\\//,'');loadAll()}})\n    .catch(()=>{});\n}\n\nfunction showPage(name, btn){\n  $$('.page').forEach(p=>p.classList.remove('active'));\n  $('#page-'+name).classList.add('active');\n  $$('.nav-btn').forEach(b=>b.classList.remove('active'));\n  if(btn) btn.classList.add('active');\n  if(name==='dashboard') loadStats();\n  if(name==='sources') loadSources();\n  if(name==='ai') loadAIPending();\n  if(name==='report') loadReport();\n  if(name==='logs') loadLogs();\n  if(name==='quarantine') loadQuarantine();\n  if(name==='adblock') loadAdWeights();\n  if(name==='admins') loadAdmins();\n}\n\nasync function loadAll(){await loadStats()}\n\n// ─── Dashboard ───\nasync function loadStats(){\n  try{\n    const d = await api('stats');\n    const stats = [\n      {label:'منابع فعال', value:d.sources||0, icon:ICONS.source, color:'var(--accent)'},\n      {label:'پست‌های ارسالی', value:d.sentToday||0, icon:ICONS.send, color:'var(--green)'},\n      {label:'تبلیغات مسدود', value:d.adsBlocked||0, icon:ICONS.shield, color:'var(--red)'},\n      {label:'خطاها', value:d.errorsToday||0, icon:ICONS.error, color:'var(--yellow)'},\n    ];\n    $('#statsGrid').innerHTML = stats.map(s=>`\n      <div class=\"stat-card\">\n        <div class=\"stat-icon\" style=\"background:${s.color}22;color:${s.color}\">${s.icon}</div>\n        <div class=\"stat-label\">${s.label}</div>\n        <div class=\"stat-value\">${s.value}</div>\n      </div>\n    `).join('');\n    if(d.daily) renderDailyChart(d.daily);\n    if(d.byAction) renderActionChart(d.byAction);\n  }catch(e){toast(e.message, false)}\n}\n\nfunction renderDailyChart(daily){\n  const ctx = document.getElementById('dailyChart');\n  if(charts.daily) charts.daily.destroy();\n  const isLight = document.documentElement.getAttribute('data-theme') === 'light';\n  const tickColor = isLight ? '#475569' : '#94a3b8';\n  const gridColor = isLight ? 'rgba(148, 163, 184, 0.15)' : 'rgba(148, 163, 184, 0.1)';\n  charts.daily = new Chart(ctx, {\n    type:'line',\n    data:{\n      labels: daily.map(d=>new Date(d.date).toLocaleDateString('fa-IR',{weekday:'short'})),\n      datasets:[{label:'ارسالی', data:daily.map(d=>d.sent), borderColor: isLight ? '#0891b2' : '#06b6d4', backgroundColor: isLight ? 'rgba(8,145,178,0.12)' : 'rgba(6,182,212,0.1)', fill:true, tension:.3}]\n    },\n    options:{responsive:true, plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true, ticks:{color:tickColor}, grid:{color:gridColor}}, x:{ticks:{color:tickColor}, grid:{color:gridColor}}}}\n  });\n}\nfunction renderActionChart(a){\n  const ctx = document.getElementById('actionChart');\n  if(charts.action) charts.action.destroy();\n  const isLight = document.documentElement.getAttribute('data-theme') === 'light';\n  const tickColor = isLight ? '#475569' : '#94a3b8';\n  charts.action = new Chart(ctx, {\n    type:'doughnut',\n    data:{\n      labels: Object.keys(a),\n      datasets:[{data: Object.values(a), backgroundColor:['#10b981','#f59e0b','#ef4444','#3b82f6','#a855f7','#06b6d4']}]\n    },\n    options:{responsive:true, plugins:{legend:{position:'bottom', labels:{color:tickColor, font:{size:11}}}}}\n  });\n}\n\n// ─── Sources ───\nasync function loadSources(){\n  try{\n    const d = await api('sources');\n    SOURCES = d.sources || [];\n    $('#sourcesCount').textContent = `(${SOURCES.length} منبع)`;\n    renderSources();\n  }catch(e){toast(e.message, false)}\n}\n\nfunction formatKwList(s){\n  if(s.mode === 'deep'){\n    const main = Array.isArray(s.keywords_main) ? s.keywords_main : safeJson(s.keywords_main, []);\n    const comp = Array.isArray(s.keywords_complementary) ? s.keywords_complementary : safeJson(s.keywords_complementary, []);\n    const periph = Array.isArray(s.keywords_peripheral) ? s.keywords_peripheral : safeJson(s.keywords_peripheral, []);\n    const pos = Array.isArray(s.keywords_positive) ? s.keywords_positive : safeJson(s.keywords_positive, []);\n    const neg = Array.isArray(s.keywords_negative) ? s.keywords_negative : safeJson(s.keywords_negative, []);\n\n    const isScoring = Number(s.deep_scoring) === 1 || s.deep_scoring === true || s.mode === 'deep_scoring' || (main.length > 0 || comp.length > 0 || periph.length > 0);\n    if(isScoring){\n      let html = `<div style=\"font-size:.75rem\">✅ اصلی (${main.length}): ${esc(main.join('، '))||'—'}</div>`;\n      if(comp.length) html += `<div style=\"font-size:.75rem;color:var(--purple)\">➕ مکمل (${comp.length}): ${esc(comp.join('، '))}</div>`;\n      if(periph.length) html += `<div style=\"font-size:.75rem;color:var(--yellow)\">⚠️ پیرامونی (${periph.length}): ${esc(periph.join('، '))}</div>`;\n      html += `<div style=\"font-size:.7rem;color:var(--muted);margin-top:.2rem\">📊 آستانه: ${s.deep_threshold||50}</div>`;\n      return html;\n    } else {\n      let html = `<div style=\"font-size:.75rem\">✅ مثبت‌کننده (${pos.length}): ${esc(pos.join('، '))||'—'}</div>`;\n      if(neg.length) html += `<div style=\"font-size:.75rem;color:var(--red)\">🚫 منفی‌کننده (${neg.length}): ${esc(neg.join('، '))}</div>`;\n      if(s.every_mode) html += `<span class=\"badge b-warn\" style=\"margin-top:.2rem\">every (AND)</span>`;\n      return html;\n    }\n  } else if(s.mode === 'viral'){\n    const rules = Array.isArray(s.viral_reactions) ? s.viral_reactions : safeJson(s.viral_reactions, []);\n    if(rules.length){\n      return rules.map(r=>`<div style=\"font-size:.75rem\">${esc(r.emoji)} ≥ ${r.threshold}</div>`).join('') +\n        `<div style=\"font-size:.7rem;color:var(--muted);margin-top:.2rem\">مجموع ری‌اکشن fallback: ≥ ${s.viral_threshold||1000}</div>`;\n    }\n    return `<div style=\"font-size:.75rem;color:var(--yellow)\">⚠️ بدون rule — مجموع ری‌اکشن ≥ ${s.viral_threshold||1000}</div>`;\n  }\n  return '—';\n}\n\nfunction renderSources(){\n  const q = ($('#srcSearch').value || '').toLowerCase();\n  const list = SOURCES.filter(s => !q || (s.channel||'').toLowerCase().includes(q) || (s.mode||'').includes(q));\n  if(!list.length){\n    $('#sourcesBody').innerHTML = '<tr><td colspan=\"9\" class=\"empty\"><div class=\"empty\">📭 منبعی یافت نشد</div></td></tr>';\n    return;\n  }\n  $('#sourcesBody').innerHTML = list.map(s=>{\n    const pendingBadge = (s.pending_positive?.length || s.pending_main?.length) ? `<span class=\"badge b-warn\" style=\"margin-inline-start:.3rem\">🤖 pending</span>` : '';\n    const adIcon = s.block_ads === 0 ? '🔴' : '🟢';\n    const adTitle = s.block_ads === 0 ? 'خاموش — کلیک برای روشن' : 'روشن — کلیک برای خاموش';\n    return `<tr>\n      <td><strong>${s.id}</strong></td>\n      <td><a href=\"https://t.me/${(s.channel||'').replace('@','')}\" target=\"_blank\">@${esc(s.channel)}</a></td>\n      <td style=\"font-size:.75rem\">${esc(s.topic||'—')}${pendingBadge}</td>\n      <td>${modeBadge(s.mode, s.deep_scoring)}</td>\n      <td>${formatKwList(s)}</td>\n      <td style=\"font-size:.7rem\">${esc(s.target_chat_id)}${s.target_topic_id?':'+esc(s.target_topic_id):''}</td>\n      <td><button class=\"icon-btn ${s.block_ads!==0?'success':''}\" title=\"${adTitle}\" onclick=\"toggleAdBlock(${s.id},${s.block_ads===0?1:0})\">${adIcon}</button></td>\n      <td>\n        <button class=\"icon-btn ${s.ai_keywords_enabled!==0?'success':''}\" title=\"${s.ai_keywords_enabled===0?'پذیرش AI خاموش — کلیک برای روشن':'پذیرش AI روشن — کلیک برای خاموش (پرش)'}\" onclick=\"toggleAIKeywords(${s.id},${s.ai_keywords_enabled===0?1:0})\">\n          ${s.ai_keywords_enabled===0?'❌':'🤖'}\n        </button>\n      </td>\n      <td><span class=\"badge ${s.active?'b-on':'b-off'}\">${s.active?'فعال':'غیرفعال'}</span></td>\n      <td><div style=\"display:flex;gap:.2rem\">\n        <button class=\"icon-btn\" title=\"اسکن\" onclick=\"scanSource(${s.id})\">🔍</button>\n        <button class=\"icon-btn\" title=\"ویرایش\" onclick=\"openEditModal(${s.id})\">✏️</button>\n        <button class=\"icon-btn del\" title=\"حذف\" onclick=\"delSource(${s.id})\">🗑</button>\n      </div></td>\n    </tr>`;\n  }).join('');\n}\n\nasync function toggleAdBlock(id, newVal){\n  try{\n    await api('sources/'+id, {method:'PUT', body:JSON.stringify({block_ads:newVal})});\n    const s = SOURCES.find(x=>x.id===id); if(s) s.block_ads = newVal;\n    renderSources();\n    toast(newVal===1?'🟢 ضد تبلیغات روشن شد':'🔴 ضد تبلیغات خاموش شد');\n  }catch(e){toast(e.message, false)}\n}\nasync function toggleAIKeywords(id, newVal){\n  try{\n    await api('sources/'+id, {method:'PUT', body:JSON.stringify({ai_keywords_enabled:newVal})});\n    const s = SOURCES.find(x=>x.id===id); if(s) s.ai_keywords_enabled = newVal;\n    renderSources();\n    toast(newVal===1?'🤖 پذیرش کلیدواژه هوش مصنوعی فعال شد':'❌ پیشنهاد و پذیرش کلیدواژه AI غیرفعال (پرش) شد');\n  }catch(e){toast(e.message, false)}\n}\n\n// ─── Add Modal ───\nfunction openAddModal(){\n  $('#modalTitle').textContent = '➕ افزودن منبع جدید';\n  $('#modalContent').innerHTML = `\n    <div class=\"field\"><label>کانال(ها) — با کاما</label><input id=\"m_channel\" placeholder=\"@chan1,@chan2\" /></div>\n    <div class=\"field\"><label>موضوع (برای AI)</label><input id=\"m_topic_name\" placeholder=\"اخبار رمزارز، تکنولوژی...\" /></div>\n    <div class=\"field\"><label>حالت اسکن</label><select id=\"m_mode\" onchange=\"toggleModeFields()\">\n      <option value=\"forward\">📤 فوروارد (ارسال همه)</option>\n      <option value=\"deep\">🔎 عمیق (Deep Classic / Deep Scoring)</option>\n      <option value=\"viral\">👁 وایرال (ری‌اکشن)</option>\n    </select></div>\n\n    <div id=\"deepFields\" style=\"display:none\">\n      <div class=\"field\"><label>نوع حالت عمیق</label><select id=\"m_deep_type\" onchange=\"toggleDeepFields()\">\n        <option value=\"classic\">📋 عمیق کلاسیک — Deep Classic (مثبت‌کننده / منفی‌کننده)</option>\n        <option value=\"scoring\">📊 عمیق امتیازی — Deep Scoring (اصلی / مکمل / پیرامونی)</option>\n      </select></div>\n      <div id=\"deepClassicFields\">\n        <div class=\"field\"><label>کلیدواژه مثبت‌کننده — +score (با کاما)</label><input id=\"m_pos\" placeholder=\"بیت کوین, ارز دیجیتال\" /></div>\n        <div class=\"field\"><label>کلیدواژه منفی‌کننده — رد پست (با کاما)</label><input id=\"m_neg\" placeholder=\"تبلیغ, اسپانسر\" /></div>\n        <div class=\"field\"><label><input type=\"checkbox\" id=\"m_every\" /> every — همه کلیدواژه‌های مثبت باید باشند (AND)</label></div>\n      </div>\n      <div id=\"deepScoringFields\" style=\"display:none\">\n        <div class=\"field\"><label>کلیدواژه‌های اصلی (+۴۰ امتیاز) — با کاما</label><input id=\"m_main\" placeholder=\"بیت کوین, اتریوم\" /></div>\n        <div class=\"field\"><label>کلیدواژه‌های مکمل (+۱۵ امتیاز) — با کاما</label><input id=\"m_comp\" placeholder=\"بازار, تحلیل, قیمت\" /></div>\n        <div class=\"field\"><label>کلیدواژه‌های پیرامونی (-۳۰ امتیاز) — با کاما</label><input id=\"m_periph\" placeholder=\"تبلیغ, ثبت نام, صرافی\" /></div>\n        <div class=\"field\"><label>آستانه امتیاز Deep Scoring (پیش‌فرض: ۵۰)</label><input id=\"m_deep_threshold\" type=\"number\" value=\"50\" /></div>\n      </div>\n    </div>\n\n    <div id=\"viralFields\" style=\"display:none\">\n      <div class=\"field\">\n        <div style=\"display:flex;justify-content:space-between;align-items:center;margin-bottom:.5rem\">\n          <label style=\"margin:0\">قوانین چند ری‌اکشن (اختیاری)</label>\n          <button type=\"button\" class=\"btn btn-ghost btn-sm\" onclick=\"checkViralThresholds('m')\">📊 بررسی آستانه ری‌اکشن (روز قبل)</button>\n        </div>\n        <div id=\"m_viral_suggest_box\" style=\"display:none;background:rgba(6,182,212,0.08);border:1px solid rgba(6,182,212,0.3);border-radius:var(--radius-sm);padding:.75rem;margin-bottom:.75rem\"></div>\n        <div class=\"hint\" style=\"margin-bottom:.5rem\">هر ری‌اکشن آستانه مستقل دارد. همه باید عبور کنند (AND). رشد ری‌اکشن در چند بررسی متوالی رصد می‌شود.</div>\n        <div class=\"reaction-rules\" id=\"m_viral_rules\"></div>\n        <button class=\"btn btn-ghost btn-sm\" style=\"margin-top:.5rem\" onclick=\"addReactionRule('m')\">➕ افزودن ری‌اکشن</button>\n      </div>\n      <div class=\"field\"><label>آستانه مجموع ری‌اکشن‌ها (وقتی rule وجود ندارد)</label><input id=\"m_viral_threshold\" type=\"number\" value=\"1000\" />\n      <div class=\"hint\">معیار Viral Mode فقط ری‌اکشن‌هاست. اگه rule خاص تنظیم نکنید، مجموع همه ری‌اکشن‌ها با اثبات رشد از این عدد عبور کند → ارسال.</div></div>\n    </div>\n\n    <div class=\"field\"><label>مقصد (chat_id)</label><input id=\"m_target\" placeholder=\"-100123456789\" /></div>\n    <div class=\"field\"><label>تاپیک مقصد (اختیاری)</label><input id=\"m_topic\" placeholder=\"topic_id\" /></div>\n    <div class=\"field\"><label>آستانه Anti-Ad (پیش‌فرض ۷۰)</label><input id=\"m_ad_threshold\" type=\"number\" value=\"70\" /></div>\n    <div class=\"field\"><label><input type=\"checkbox\" id=\"m_block_ads\" checked /> 🛡 ضد تبلیغات روشن</label></div>\n  `;\n  $('#modalActions').innerHTML = `<button class=\"btn btn-ghost\" onclick=\"closeModal()\">انصراف</button><button class=\"btn btn-primary\" onclick=\"saveAddSource()\">ذخیره</button>`;\n  $('#modal').classList.add('active');\n}\n\nfunction toggleModeFields(){\n  const m = $('#m_mode').value;\n  $('#deepFields').style.display = m==='deep' ? 'block' : 'none';\n  $('#viralFields').style.display = m==='viral' ? 'block' : 'none';\n  if(m==='deep') toggleDeepFields();\n  // اگه viral انتخاب شد و هیچ rule وجود ندارد → یک rule پیش‌فرض اضافه کن\n  if(m==='viral'){\n    const container = $('#m_viral_rules');\n    if(container && !container.children.length){\n      addReactionRule('m');\n    }\n  }\n}\nfunction toggleDeepFields(){\n  const dt = $('#m_deep_type')?.value || 'classic';\n  if($('#deepScoringFields')) $('#deepScoringFields').style.display = dt==='scoring' ? 'block' : 'none';\n  if($('#deepClassicFields')) $('#deepClassicFields').style.display = dt==='classic' ? 'block' : 'none';\n}\n\n// ─── لیست ری‌اکشن‌های مجاز تلگرام ───\n// منبع: https://core.telegram.org/api/emoji-reactions\nconst TELEGRAM_REACTIONS = [\n  // ─── استاندارد (همه کاربران) ───\n  { emoji: '👍', name: 'مان بالا' },\n  { emoji: '👎', name: 'مان پایین' },\n  { emoji: '❤', name: 'قلب قرمز' },\n  { emoji: '🔥', name: 'آتش' },\n  { emoji: '🎉', name: 'جشن' },\n  { emoji: '🥰', name: 'قلب‌چشم' },\n  { emoji: '👏', name: 'دست‌زدن' },\n  { emoji: '😂', name: 'خنده' },\n  { emoji: '🙏', name: 'دعای دست' },\n  { emoji: '😍', name: 'عاشق' },\n  { emoji: '😭', name: 'گریه' },\n  { emoji: '😮', name: 'تعجب' },\n  { emoji: '🤔', name: 'فکر' },\n  { emoji: '💯', name: 'صد' },\n  { emoji: '💔', name: 'قلب شکسته' },\n  { emoji: '⚡', name: 'صاعقه' },\n  { emoji: '🏆', name: 'جام' },\n  { emoji: '🤝', name: 'دست‌دهی' },\n  { emoji: '🤡', name: 'دلقک' },\n  { emoji: '😴', name: 'خواب' },\n  { emoji: '🆒', name: 'cool' },\n  { emoji: '🐳', name: 'نهنگ' },\n  { emoji: '🖤', name: 'قلب مشکی' },\n  { emoji: '🤷', name: 'شکست سر' },\n  { emoji: '👀', name: 'چشم' },\n  { emoji: '😇', name: 'هاله' },\n  { emoji: '🤦', name: 'دست‌به‌سر' },\n  { emoji: '🌚', name: 'ماه سیاه' },\n  { emoji: '🌭', name: 'هات‌داگ' },\n  { emoji: '💘', name: 'قلب با کمان' },\n  { emoji: '🤣', name: 'خنده شدید' },\n  { emoji: '😢', name: 'غم' },\n  { emoji: '🥳', name: 'مهمون' },\n  { emoji: '🙈', name: 'میمون دست‌به‌چشم' },\n  { emoji: '💩', name: 'پوپ' },\n  { emoji: '🤯', name: 'منفجر' },\n  { emoji: '😡', name: 'عصبانی' },\n  { emoji: '😱', name: 'ترس' },\n  { emoji: '👿', name: 'شیطان' },\n  // ─── پیشرفته (نمایش به‌صورت custom emoji در چت‌های بزرگ) ───\n  { emoji: '❤‍🔥', name: 'قلب آتشین' },\n  { emoji: '👍🏻', name: 'مان روشن' },\n  { emoji: '👎🏻', name: 'مان روشن - پایین' },\n  { emoji: '🦄', name: 'تک‌شاخ' },\n  { emoji: '🥺', name: 'التماس' },\n  { emoji: '😎', name: 'آفتاب‌عینکی' },\n  { emoji: '🤩', name: 'ستاره‌چشم' },\n  { emoji: '🫡', name: 'سلام نظامی' },\n  { emoji: '🗿', name: 'مجسمه' },\n  { emoji: '🥱', name: 'خمیازه' },\n  { emoji: '🤤', name: 'آب دهان' },\n  { emoji: '🤧', name: 'عطسه' },\n  { emoji: '🤒', name: 'بیمار' },\n  { emoji: '🥶', name: 'سرما' },\n  { emoji: '🤠', name: 'کابوی' },\n  { emoji: '🫶', name: 'دست قلب' },\n  { emoji: '🫂', name: 'آغوش' },\n  { emoji: '🫵', name: 'انگشت به خود' },\n  { emoji: '🐈', name: 'گربه' },\n  { emoji: '🐶', name: 'سگ' },\n  { emoji: '🌸', name: 'گل ساکورا' },\n  { emoji: '🌈', name: 'رنگین‌کمان' },\n  { emoji: '💎', name: 'الماس' },\n  { emoji: '🚀', name: 'موشک' },\n  { emoji: '🧨', name: 'فشفشک' },\n  { emoji: '🍕', name: 'پیتزا' },\n  { emoji: '🍔', name: 'برگر' },\n  { emoji: '🍿', name: 'پاپ‌کورن' },\n  { emoji: '⚽', name: 'فوتبال' },\n  { emoji: '🏀', name: 'بسکتبال' },\n];\n\n// تابع ساخت dropdown از ری‌اکشن‌ها\nfunction buildReactionOptions(selected){\n  return TELEGRAM_REACTIONS.map(r => `<option value=\"${r.emoji}\" ${selected===r.emoji?'selected':''}>${r.emoji} ${r.name}</option>`).join('');\n}\n\nfunction addReactionRule(prefix, opts = {}){\n  const container = $(`#${prefix}_viral_rules`);\n  if(!container) return;\n  const div = document.createElement('div');\n  div.className = 'reaction-rule';\n  const selectedEmoji = opts.emoji || '🔥';\n  const thresholdVal = opts.threshold || 100;\n  div.innerHTML = `\n    <select class=\"vr-emoji\">\n      ${buildReactionOptions(selectedEmoji)}\n    </select>\n    <span style=\"color:var(--muted);font-size:.75rem;white-space:nowrap\">≥</span>\n    <input type=\"number\" placeholder=\"100\" value=\"${thresholdVal}\" class=\"vr-threshold\" min=\"0\" />\n    <button class=\"remove-rule\" onclick=\"this.parentElement.remove()\" title=\"حذف\">✕</button>\n  `;\n  container.appendChild(div);\n}\n\nfunction getViralRules(prefix){\n  const container = $(`#${prefix}_viral_rules`);\n  if(!container) return [];\n  const rules = [];\n  container.querySelectorAll('.reaction-rule').forEach(r=>{\n    const emoji = r.querySelector('.vr-emoji').value.trim();\n    const threshold = parseInt(r.querySelector('.vr-threshold').value, 10) || 0;\n    if(emoji && !isNaN(threshold) && threshold >= 0) rules.push({emoji, threshold});\n  });\n  return rules;\n}\n\n// ─── بررسی هوشمند آستانه ری‌اکشن بر اساس ۲۰ پست روز قبل (بدون AI) ───\nasync function checkViralThresholds(prefix){\n  const channelInput = $(`#${prefix}_channel`);\n  const rawChannel = channelInput ? channelInput.value : '';\n  const channel = rawChannel.split(',')[0].trim().replace(/^@/, '');\n  if(!channel){\n    toast('ابتدا آیدی کانال را در فیلد بالا وارد کنید', false);\n    return;\n  }\n  const box = $(`#${prefix}_viral_suggest_box`);\n  if(box){\n    box.style.display = 'block';\n    box.innerHTML = '<div style=\"font-size:.8rem;color:var(--accent)\">⏳ در حال واکشی و تحلیل ۲۰ پست روز قبل کانال... لطفاً صبر کنید</div>';\n  }\n  // استخراج ری‌اکشن‌های فعلی فرم\n  const container = $(`#${prefix}_viral_rules`);\n  const emojis = [];\n  if(container){\n    container.querySelectorAll('.reaction-rule').forEach(r=>{\n      const em = r.querySelector('.vr-emoji')?.value;\n      if(em && !emojis.includes(em)) emojis.push(em);\n    });\n  }\n  try{\n    const res = await api('viral-suggest', {\n      method: 'POST',\n      body: JSON.stringify({ channel, emojis: emojis.length ? emojis : ['🔥', '❤️', '👍'] }),\n    });\n    if(!res.ok) throw new Error(res.error || 'خطا در بررسی آستانه');\n\n    let html = `<div style=\"font-size:.8rem;font-weight:600;margin-bottom:.4rem;color:var(--text)\">📊 پیشنهاد آستانه (تحلیل ${res.posts_analyzed} پست آخر روز قبل - ${esc(res.date_sample)}):</div>`;\n    html += `<div style=\"display:flex;flex-direction:column;gap:.35rem;margin-bottom:.6rem\">`;\n    for(const s of res.suggestions){\n      html += `<div style=\"display:flex;justify-content:space-between;align-items:center;background:var(--bg2);padding:.35rem .6rem;border-radius:6px;font-size:.8rem\">\n        <span>${esc(s.emoji)} آستانه پیشنهادی: <strong style=\"color:var(--accent);font-size:.9rem\">${s.recommended}</strong></span>\n        <span style=\"font-size:.7rem;color:var(--muted)\">میانگین: ${s.avg} | بیشترین: ${s.max}</span>\n      </div>`;\n    }\n    html += `</div>`;\n    html += `<div style=\"font-size:.75rem;color:var(--muted);margin-bottom:.5rem\">⚡ پیشنهاد آستانه مجموع: <strong>${res.total_suggestion}</strong></div>`;\n    html += `<div style=\"display:flex;gap:.5rem\">\n      <button type=\"button\" class=\"btn btn-primary btn-sm\" onclick=\"applyViralSuggestions('${prefix}', ${JSON.stringify(res.suggestions).replace(/\"/g, '&quot;')}, ${res.total_suggestion})\">✅ اعمال مقادیر پیشنهادی در فرم</button>\n      <button type=\"button\" class=\"btn btn-ghost btn-sm\" onclick=\"$('#${prefix}_viral_suggest_box').style.display='none'\">بستن</button>\n    </div>`;\n    box.innerHTML = html;\n  }catch(e){\n    if(box) box.innerHTML = `<div style=\"font-size:.8rem;color:var(--red)\">❌ خطا: ${esc(e.message)}</div>`;\n    toast(e.message, false);\n  }\n}\n\nfunction applyViralSuggestions(prefix, suggestions, totalSug){\n  const container = $(`#${prefix}_viral_rules`);\n  if(!container) return;\n  container.innerHTML = '';\n  for(const s of suggestions){\n    addReactionRule(prefix, { emoji: s.emoji, threshold: s.recommended });\n  }\n  const totInput = $(`#${prefix}_viral_threshold`);\n  if(totInput && totalSug) totInput.value = totalSug;\n  const box = $(`#${prefix}_viral_suggest_box`);\n  if(box) box.style.display = 'none';\n  toast('✅ مقادیر پیشنهادی با موفقیت در فرم درج شدند');\n}\n\nfunction parseKwInput(val){\n  if(!val) return [];\n  if(Array.isArray(val)) return val.map(s=>String(s).trim()).filter(Boolean);\n  return String(val)\n    .split(/[,،؛;\\n\\r]+/)\n    .map(s => s.trim().replace(/^[\"'«»“”]/, '').replace(/[\"'«»“”]$/, '').trim())\n    .filter(Boolean);\n}\n\nasync function saveAddSource(){\n  try{\n    const body = {\n      channels: $('#m_channel').value,\n      target_chat_id: $('#m_target').value,\n      target_topic_id: $('#m_topic').value || null,\n      mode: $('#m_mode').value,\n      topic: $('#m_topic_name').value || '',\n      block_ads: $('#m_block_ads').checked,\n      ad_threshold: parseInt($('#m_ad_threshold').value, 10) || 70,\n    };\n    if(body.mode === 'deep'){\n      const dt = $('#m_deep_type').value;\n      body.deep_scoring = dt === 'scoring' ? 1 : 0;\n      if(dt === 'scoring'){\n        body.keywords_main = parseKwInput($('#m_main').value);\n        body.keywords_complementary = parseKwInput($('#m_comp').value);\n        body.keywords_peripheral = parseKwInput($('#m_periph').value);\n        body.deep_threshold = parseInt($('#m_deep_threshold').value, 10) || 50;\n      } else {\n        body.keywords_positive = parseKwInput($('#m_pos').value);\n        body.keywords_negative = parseKwInput($('#m_neg').value);\n        body.every_mode = $('#m_every').checked;\n      }\n    }\n    if(body.mode === 'viral'){\n      body.viral_threshold = parseInt($('#m_viral_threshold').value, 10) || 1000;\n      body.viral_reactions = getViralRules('m');\n    }\n    await api('sources', {method:'POST', body:JSON.stringify(body)});\n    toast('منبع افزوده شد');\n    closeModal();\n    loadSources();\n  }catch(e){toast(e.message, false)}\n}\n\n// ─── Edit Modal ───\nfunction openEditModal(id){\n  const s = SOURCES.find(x=>x.id===id); if(!s) return;\n  const main = Array.isArray(s.keywords_main) ? s.keywords_main : safeJson(s.keywords_main, []);\n  const comp = Array.isArray(s.keywords_complementary) ? s.keywords_complementary : safeJson(s.keywords_complementary, []);\n  const periph = Array.isArray(s.keywords_peripheral) ? s.keywords_peripheral : safeJson(s.keywords_peripheral, []);\n  const pos = Array.isArray(s.keywords_positive) ? s.keywords_positive : safeJson(s.keywords_positive, []);\n  const neg = Array.isArray(s.keywords_negative) ? s.keywords_negative : safeJson(s.keywords_negative, []);\n  const viralRules = Array.isArray(s.viral_reactions) ? s.viral_reactions : safeJson(s.viral_reactions, []);\n\n  const isScoring = Number(s.deep_scoring) === 1 || s.deep_scoring === true || s.mode === 'deep_scoring' || (main.length > 0 || comp.length > 0 || periph.length > 0);\n\n  $('#modalTitle').textContent = `✏️ ویرایش منبع #${s.id}`;\n  $('#modalContent').innerHTML = `\n    <div class=\"field\"><label>کانال</label><input id=\"e_channel\" value=\"${esc(s.channel)}\" /></div>\n    <div class=\"field\"><label>موضوع (برای AI)</label><input id=\"e_topic_name\" value=\"${esc(s.topic||'')}\" placeholder=\"اخبار رمزارز...\" /></div>\n    <div class=\"field\"><label>حالت اسکن</label><select id=\"e_mode\" onchange=\"toggleEMode()\">\n      <option value=\"forward\" ${s.mode==='forward'?'selected':''}>📤 فوروارد (ارسال همه)</option>\n      <option value=\"deep\" ${s.mode==='deep'?'selected':''}>🔎 عمیق (Deep Classic / Deep Scoring)</option>\n      <option value=\"viral\" ${s.mode==='viral'?'selected':''}>👁 وایرال (ری‌اکشن)</option>\n    </select></div>\n\n    <div id=\"eDeep\" style=\"display:${s.mode==='deep'?'block':'none'}\">\n      <div class=\"field\"><label>نوع حالت عمیق</label><select id=\"e_deep_type\" onchange=\"toggleEDeepFields()\">\n        <option value=\"classic\" ${!isScoring?'selected':''}>📋 عمیق کلاسیک — Deep Classic (مثبت‌کننده / منفی‌کننده)</option>\n        <option value=\"scoring\" ${isScoring?'selected':''}>📊 عمیق امتیازی — Deep Scoring (اصلی / مکمل / پیرامونی)</option>\n      </select></div>\n      <div id=\"eDeepClassicFields\" style=\"display:${!isScoring?'block':'none'}\">\n        <div class=\"field\"><label>کلیدواژه مثبت‌کننده (با کاما)</label><input id=\"e_pos\" value=\"${esc(pos.join(', '))}\" placeholder=\"مثلاً: بیت کوین, اتریوم\" /></div>\n        <div class=\"field\"><label>کلیدواژه منفی‌کننده (با کاما)</label><input id=\"e_neg\" value=\"${esc(neg.join(', '))}\" placeholder=\"مثلاً: تبلیغ, اسپانسر\" /></div>\n        <div class=\"field\"><label><input type=\"checkbox\" id=\"e_every\" ${s.every_mode?'checked':''} /> every — همه کلیدواژه‌های مثبت باید باشند (AND)</label></div>\n      </div>\n      <div id=\"eDeepScoringFields\" style=\"display:${isScoring?'block':'none'}\">\n        <div class=\"field\"><label>کلیدواژه‌های اصلی (+۴۰ امتیاز) — با کاما</label><input id=\"e_main\" value=\"${esc(main.join(', '))}\" placeholder=\"مثلاً: بیت کوین, اتریوم\" /></div>\n        <div class=\"field\"><label>کلیدواژه‌های مکمل (+۱۵ امتیاز) — با کاما</label><input id=\"e_comp\" value=\"${esc(comp.join(', '))}\" placeholder=\"مثلاً: تحلیل, بازار, قیمت\" /></div>\n        <div class=\"field\"><label>کلیدواژه‌های پیرامونی (-۳۰ امتیاز) — با کاما</label><input id=\"e_periph\" value=\"${esc(periph.join(', '))}\" placeholder=\"مثلاً: تبلیغ, ثبت نام, صرافی\" /></div>\n        <div class=\"field\"><label>آستانه امتیاز Deep Scoring (پیش‌فرض: ۵۰)</label><input id=\"e_deep_threshold\" type=\"number\" value=\"${s.deep_threshold||50}\" /></div>\n      </div>\n    </div>\n\n    <div id=\"eViral\" style=\"display:${s.mode==='viral'?'block':'none'}\">\n      <div class=\"field\">\n        <div style=\"display:flex;justify-content:space-between;align-items:center;margin-bottom:.5rem\">\n          <label style=\"margin:0\">قوانین چند ری‌اکشن</label>\n          <button type=\"button\" class=\"btn btn-ghost btn-sm\" onclick=\"checkViralThresholds('e')\">📊 بررسی آستانه ری‌اکشن (روز قبل)</button>\n        </div>\n        <div id=\"e_viral_suggest_box\" style=\"display:none;background:rgba(6,182,212,0.08);border:1px solid rgba(6,182,212,0.3);border-radius:var(--radius-sm);padding:.75rem;margin-bottom:.75rem\"></div>\n        <div class=\"reaction-rules\" id=\"e_viral_rules\"></div>\n        <button class=\"btn btn-ghost btn-sm\" style=\"margin-top:.5rem\" onclick=\"addReactionRule('e')\">➕ افزودن ری‌اکشن</button>\n      </div>\n      <div class=\"field\"><label>آستانه مجموع ری‌اکشن‌ها</label><input id=\"e_viral_threshold\" type=\"number\" value=\"${s.viral_threshold||1000}\" />\n      <div class=\"hint\">اگه rule خاص تنظیم نکنید، مجموع همه ری‌اکشن‌ها با اثبات رشد از این عدد عبور کند → ارسال.</div></div>\n    </div>\n\n    <div class=\"field\"><label>مقصد (chat_id)</label><input id=\"e_target\" value=\"${esc(s.target_chat_id)}\" /></div>\n    <div class=\"field\"><label>تاپیک مقصد (اختیاری)</label><input id=\"e_topic\" value=\"${esc(s.target_topic_id||'')}\" /></div>\n    <div class=\"field\"><label>آستانه Anti-Ad</label><input id=\"e_ad_threshold\" type=\"number\" value=\"${s.ad_threshold||70}\" /></div>\n    <div class=\"field\"><label><input type=\"checkbox\" id=\"e_block_ads\" ${s.block_ads!==0?'checked':''} /> 🛡 ضد تبلیغات</label></div>\n    <div class=\"field\"><label><input type=\"checkbox\" id=\"e_active\" ${s.active?'checked':''} /> فعال</label></div>\n  `;\n\n  // اضافه کردن قوانین viral موجود (یا یک قانون پیش‌فرض اگه خالی است)\n  if(s.mode === 'viral'){\n    setTimeout(()=>{\n      if(viralRules.length){\n        viralRules.forEach(r=>{\n          addReactionRule('e', {emoji: r.emoji, threshold: r.threshold});\n        });\n      } else {\n        // پیش‌فرض: یک قانون خالی\n        addReactionRule('e');\n      }\n    }, 50);\n  }\n\n  $('#modalActions').innerHTML = `<button class=\"btn btn-ghost\" onclick=\"closeModal()\">انصراف</button><button class=\"btn btn-primary\" onclick=\"saveEditSource(${id})\">ذخیره</button>`;\n  $('#modal').classList.add('active');\n}\n\nfunction toggleEMode(){\n  const m = $('#e_mode').value;\n  $('#eDeep').style.display = m==='deep' ? 'block' : 'none';\n  $('#eViral').style.display = m==='viral' ? 'block' : 'none';\n  if(m==='deep') toggleEDeepFields();\n}\nfunction toggleEDeepFields(){\n  const dt = $('#e_deep_type')?.value || 'classic';\n  if($('#eDeepScoringFields')) $('#eDeepScoringFields').style.display = dt==='scoring' ? 'block' : 'none';\n  if($('#eDeepClassicFields')) $('#eDeepClassicFields').style.display = dt==='classic' ? 'block' : 'none';\n}\n\nasync function saveEditSource(id){\n  try{\n    const body = {\n      channel: $('#e_channel').value,\n      target_chat_id: $('#e_target').value,\n      target_topic_id: $('#e_topic').value || null,\n      mode: $('#e_mode').value,\n      topic: $('#e_topic_name').value || '',\n      block_ads: $('#e_block_ads').checked,\n      active: $('#e_active').checked,\n      ad_threshold: parseInt($('#e_ad_threshold').value, 10) || 70,\n    };\n    if(body.mode === 'deep'){\n      const dt = $('#e_deep_type').value;\n      body.deep_scoring = dt === 'scoring' ? 1 : 0;\n      if(dt === 'scoring'){\n        body.keywords_main = parseKwInput($('#e_main').value);\n        body.keywords_complementary = parseKwInput($('#e_comp').value);\n        body.keywords_peripheral = parseKwInput($('#e_periph').value);\n        body.deep_threshold = parseInt($('#e_deep_threshold').value, 10) || 50;\n        body.keywords_positive = [];\n        body.keywords_negative = [];\n      } else {\n        body.keywords_positive = parseKwInput($('#e_pos').value);\n        body.keywords_negative = parseKwInput($('#e_neg').value);\n        body.every_mode = $('#e_every').checked;\n        body.keywords_main = [];\n        body.keywords_complementary = [];\n        body.keywords_peripheral = [];\n      }\n    }\n    if(body.mode === 'viral'){\n      body.viral_threshold = parseInt($('#e_viral_threshold').value, 10) || 1000;\n      body.viral_reactions = getViralRules('e');\n    }\n    await api('sources/'+id, {method:'PUT', body:JSON.stringify(body)});\n    toast('ذخیره شد');\n    closeModal();\n    loadSources();\n  }catch(e){toast(e.message, false)}\n}\n\nasync function delSource(id){\n  if(!confirm('حذف شود؟')) return;\n  try{await api('sources/'+id, {method:'DELETE'});toast('حذف شد');loadSources()}catch(e){toast(e.message, false)}\n}\nasync function scanSource(id){\n  try{toast('اسکن آغاز شد...');const r=await api('scan', {method:'POST', body:JSON.stringify({source_id:id})});toast(`✅ ${r.sent||0} ارسال / ${r.scanned||0} اسکن`)}catch(e){toast(e.message, false)}\n}\n\n// ─── Bulk Edit ───\nfunction openBulkEdit(){\n  if(!SOURCES.length){toast('منبعی نیست', false);return}\n  $('#modalTitle').textContent = '🔧 ویرایش گروهی';\n  $('#modalContent').innerHTML = `\n    <div class=\"field\">\n      <label>انتخاب منابع</label>\n      <div class=\"check-list\">${SOURCES.map(s=>`<label class=\"check-item\"><input type=\"checkbox\" value=\"${s.id}\" class=\"bulk-chk\" /> #${s.id} @${esc(s.channel)} (${s.mode === 'deep' ? (s.deep_scoring == 1 ? 'Deep Scoring' : 'Deep Classic') : s.mode})</label>`).join('')}</div>\n    </div>\n    <div class=\"field\"><label>حالت جدید (اختیاری)</label><select id=\"b_mode\"><option value=\"\">— تغییر نده —</option><option value=\"forward\">فوروارد</option><option value=\"deep\">عمیق</option><option value=\"viral\">وایرال</option></select></div>\n    <div class=\"field\"><label>Deep Classic — مثبت‌کننده (اختیاری)</label><input id=\"b_pos\" placeholder=\"با کاما\" /></div>\n    <div class=\"field\"><label>Deep Classic — منفی‌کننده (اختیاری)</label><input id=\"b_neg\" placeholder=\"با کاما\" /></div>\n    <div class=\"field\"><label>Deep Scoring — اصلی (+۴۰) (اختیاری)</label><input id=\"b_main\" placeholder=\"با کاما\" /></div>\n    <div class=\"field\"><label>Deep Scoring — مکمل (+۱۵) (اختیاری)</label><input id=\"b_comp\" placeholder=\"با کاما\" /></div>\n    <div class=\"field\"><label>Deep Scoring — پیرامونی (-۳۰) (اختیاری)</label><input id=\"b_periph\" placeholder=\"با کاما\" /></div>\n    <div class=\"field\"><label>آستانه Deep Scoring (اختیاری)</label><input id=\"b_deep_threshold\" type=\"number\" placeholder=\"50\" /></div>\n    <div class=\"field\"><label>آستانه مجموع ری‌اکشن‌ها (اختیاری)</label><input id=\"b_viral\" type=\"number\" placeholder=\"مثلا 1000\" />\n    <div class=\"hint\">اگه rule خاص تنظیم نکنید، مجموع ری‌اکشن‌ها از این عدد عبور کند → ارسال.</div></div>\n    <div class=\"field\"><label>آستانه Anti-Ad (اختیاری)</label><input id=\"b_ad_threshold\" type=\"number\" placeholder=\"70\" /></div>\n    <div class=\"field\"><label>🛡 ضد تبلیغات (اختیاری)</label><select id=\"b_block_ads\"><option value=\"\">— تغییر نده —</option><option value=\"1\">🟢 روشن</option><option value=\"0\">🔴 خاموش</option></select></div>\n    <div class=\"field\"><label>وضعیت (اختیاری)</label><select id=\"b_active\"><option value=\"\">— تغییر نده —</option><option value=\"1\">فعال</option><option value=\"0\">غیرفعال</option></select></div>\n  `;\n  $('#modalActions').innerHTML = `<button class=\"btn btn-ghost\" onclick=\"closeModal()\">انصراف</button><button class=\"btn btn-primary\" onclick=\"applyBulk()\">اعمال</button>`;\n  $('#modal').classList.add('active');\n}\n\nasync function applyBulk(){\n  const ids = [...document.querySelectorAll('.bulk-chk:checked')].map(c=>parseInt(c.value,10));\n  if(!ids.length){toast('هیچ منبعی انتخاب نشد', false);return}\n  const body = {ids};\n  if($('#b_mode').value) body.mode = $('#b_mode').value;\n  if($('#b_pos').value) body.keywords_positive = parseKwInput($('#b_pos').value);\n  if($('#b_neg').value) body.keywords_negative = parseKwInput($('#b_neg').value);\n  if($('#b_main').value) body.keywords_main = parseKwInput($('#b_main').value);\n  if($('#b_comp').value) body.keywords_complementary = parseKwInput($('#b_comp').value);\n  if($('#b_periph').value) body.keywords_peripheral = parseKwInput($('#b_periph').value);\n  if($('#b_main').value || $('#b_comp').value || $('#b_periph').value) {\n    body.deep_scoring = 1;\n  } else if($('#b_pos').value || $('#b_neg').value) {\n    body.deep_scoring = 0;\n  }\n  if($('#b_deep_threshold').value) body.deep_threshold = parseInt($('#b_deep_threshold').value, 10);\n  if($('#b_viral').value) body.viral_threshold = parseInt($('#b_viral').value, 10);\n  if($('#b_ad_threshold').value) body.ad_threshold = parseInt($('#b_ad_threshold').value, 10);\n  if($('#b_block_ads').value !== '') body.block_ads = parseInt($('#b_block_ads').value, 10);\n  if($('#b_active').value !== '') body.active = parseInt($('#b_active').value, 10);\n  try{\n    const r = await api('sources-bulk-edit', {method:'POST', body:JSON.stringify(body)});\n    toast(`${r.updated} منبع ویرایش شد`);\n    closeModal();\n    loadSources();\n  }catch(e){toast(e.message, false)}\n}\n\n// ─── AI Pending ───\nasync function loadAIPending(){\n  try{\n    const d = await api('ai-pending');\n    const list = d.pending || [];\n    if(!list.length){\n      $('#aiPendingBody').innerHTML = '<div class=\"card\"><div class=\"empty\">✅ کلیدواژه pendingی وجود ندارد</div></div>';\n    } else {\n      $('#aiPendingBody').innerHTML = list.map(s=>{\n        const pos = s.pending_positive || [];\n        const neg = s.pending_negative || [];\n        const main = s.pending_main || [];\n        const comp = s.pending_complementary || [];\n        const periph = s.pending_peripheral || [];\n        const isScoring = main.length || comp.length || periph.length;\n\n        let kwHtml = '';\n        if(isScoring){\n          if(main.length) kwHtml += `<div style=\"color:var(--green);margin-bottom:.4rem;font-weight:600;font-size:.8rem\">✅ اصلی (+۴۰):</div>\n            <div class=\"kw-grid\" id=\"pending_main_${s.id}\">${main.map((k,i)=>`<span class=\"kw-badge kw-main selected\" onclick=\"togglePendingKw(${s.id},'main',${i},this)\">${esc(k)}</span>`).join('')}</div>`;\n          if(comp.length) kwHtml += `<div style=\"color:var(--purple);margin:.6rem 0 .4rem;font-weight:600;font-size:.8rem\">➕ مکمل (+۱۵):</div>\n            <div class=\"kw-grid\" id=\"pending_comp_${s.id}\">${comp.map((k,i)=>`<span class=\"kw-badge kw-comp selected\" onclick=\"togglePendingKw(${s.id},'comp',${i},this)\">${esc(k)}</span>`).join('')}</div>`;\n          if(periph.length) kwHtml += `<div style=\"color:var(--yellow);margin:.6rem 0 .4rem;font-weight:600;font-size:.8rem\">⚠️ پیرامونی (-۳۰):</div>\n            <div class=\"kw-grid\" id=\"pending_periph_${s.id}\">${periph.map((k,i)=>`<span class=\"kw-badge kw-periph selected\" onclick=\"togglePendingKw(${s.id},'periph',${i},this)\">${esc(k)}</span>`).join('')}</div>`;\n        } else {\n          if(pos.length) kwHtml += `<div style=\"color:var(--green);margin-bottom:.4rem;font-weight:600;font-size:.8rem\">✅ مثبت‌کننده:</div>\n            <div class=\"kw-grid\" id=\"pending_pos_${s.id}\">${pos.map((k,i)=>`<span class=\"kw-badge kw-pos selected\" onclick=\"togglePendingKw(${s.id},'pos',${i},this)\">${esc(k)}</span>`).join('')}</div>`;\n          if(neg.length) kwHtml += `<div style=\"color:var(--red);margin:.6rem 0 .4rem;font-weight:600;font-size:.8rem\">🚫 منفی‌کننده:</div>\n            <div class=\"kw-grid\" id=\"pending_neg_${s.id}\">${neg.map((k,i)=>`<span class=\"kw-badge kw-neg selected\" onclick=\"togglePendingKw(${s.id},'neg',${i},this)\">${esc(k)}</span>`).join('')}</div>`;\n        }\n\n        return `<div class=\"ai-pending-card\">\n          <div style=\"display:flex;justify-content:space-between;align-items:center;margin-bottom:.5rem;flex-wrap:wrap;gap:.3rem\">\n            <div><strong>@${esc(s.channel)}</strong> <span style=\"font-size:.75rem;color:var(--muted)\">📝 ${esc(s.topic||'—')}</span></div>\n            <span class=\"badge ${isScoring?'b-deep':'b-deep'}\">${isScoring?'Scoring':'Classic'}</span>\n          </div>\n          <div style=\"font-size:.8rem\">${kwHtml}</div>\n          <div style=\"display:flex;gap:.4rem;flex-wrap:wrap;margin-top:.75rem\">\n            <button class=\"btn btn-primary btn-sm\" onclick=\"applyAI(${s.id},'add')\">➕ اضافه</button>\n            <button class=\"btn btn-primary btn-sm\" onclick=\"applyAI(${s.id},'replace')\">🔄 جایگزین</button>\n            <button class=\"btn btn-danger btn-sm\" onclick=\"rejectAI(${s.id})\">❌ رد</button>\n          </div>\n        </div>`;\n      }).join('');\n    }\n    loadAIAnalyzeSources();\n  }catch(e){toast(e.message, false)}\n}\n\nfunction loadAIAnalyzeSources(){\n  const el = $('#aiAnalyzeSources');\n  if(!el) return;\n  if(!SOURCES.length){\n    el.innerHTML = '<div class=\"empty\">⏳ در حال بارگذاری منابع...</div>';\n    loadSources().then(()=>loadAIAnalyzeSources());\n    return;\n  }\n  const active = SOURCES.filter(s=>s.active && s.mode === 'deep');\n  if(!active.length){\n    el.innerHTML = '<div class=\"empty\">منبع فعالی در حالت Deep موجود نیست (AI فقط برای Deep modes)</div>';\n    return;\n  }\n  el.innerHTML = active.map(s=>`\n    <div class=\"check-item\" onclick=\"selectAISource(${s.id})\" style=\"cursor:pointer;${aiSelectedSource===s.id?'background:var(--card-hover)':''}\">\n      <input type=\"radio\" name=\"ai_source\" value=\"${s.id}\" ${aiSelectedSource===s.id?'checked':''} />\n      <div style=\"flex:1\">\n        <div>@${esc(s.channel)}</div>\n        <div style=\"font-size:.7rem;color:var(--muted)\">${esc(s.topic||'بدون موضوع')} • ${s.deep_scoring==1?'Scoring':'Classic'}</div>\n      </div>\n    </div>\n  `).join('');\n}\nfunction selectAISource(id){aiSelectedSource = id; loadAIAnalyzeSources()}\n\nasync function triggerAIAnalyze(){\n  if(!aiSelectedSource){toast('ابتدا یک منبع انتخاب کنید', false);return}\n  if(aiAnalyzing){toast('تحلیل قبلی هنوز در حال انجام است...', false);return}\n  aiAnalyzing = true;\n  const btn = event?.target;\n  if(btn){btn.disabled=true;btn.textContent='⏳ در حال تحلیل...'}\n  const statusEl = $('#aiAnalyzeStatus');\n  if(statusEl) statusEl.innerHTML = '<div style=\"padding:1rem;text-align:center;color:var(--accent)\">🤖 در حال تحلیل... ۵-۳۰ ثانیه</div>';\n  toast('🤖 تحلیل آغاز شد');\n  try{\n    const r = await api('ai-analyze', {method:'POST', body:JSON.stringify({source_id:aiSelectedSource})});\n    if(statusEl){\n      if(r.ok){\n        const total = (r.posKeywords?.length||0) + (r.negKeywords?.length||0) + (r.mainKeywords?.length||0) + (r.compKeywords?.length||0) + (r.periphKeywords?.length||0);\n        statusEl.innerHTML = `<div style=\"padding:1rem;text-align:center;color:var(--green)\">✅ ${total} کلیدواژه استخراج شد — به ادمین ارسال شد</div>`;\n      } else {\n        statusEl.innerHTML = `<div style=\"padding:1rem;text-align:center;color:var(--red)\">❌ ${esc(r.error||'خطا')}</div>`;\n      }\n    }\n    loadAIPending();\n  }catch(e){\n    if(statusEl) statusEl.innerHTML = `<div style=\"padding:1rem;text-align:center;color:var(--red)\">❌ ${esc(e.message)}</div>`;\n    toast(e.message, false);\n  }finally{\n    aiAnalyzing = false;\n    if(btn){btn.disabled=false;btn.textContent='🤖 شروع تحلیل'}\n  }\n}\n\nfunction togglePendingKw(sourceId, type, idx, el){\n  const key = `${sourceId}_${type}_${idx}`;\n  if(pendingSelection[key] === undefined) pendingSelection[key] = true;\n  pendingSelection[key] = !pendingSelection[key];\n  if(pendingSelection[key]){\n    el.classList.remove('deselected');\n    el.classList.add('selected');\n  } else {\n    el.classList.remove('selected');\n    el.classList.add('deselected');\n  }\n}\n\nasync function applyAI(id, mode){\n  const collect = (containerId) => {\n    const badges = document.querySelectorAll(`#${containerId} .kw-badge`);\n    const result = [];\n    badges.forEach(el => {\n      if(el.classList.contains('selected')) result.push(el.textContent.trim());\n    });\n    return result;\n  };\n  const body = {source_id: id, mode};\n  if(document.getElementById(`pending_main_${id}`)) body.main = collect(`pending_main_${id}`);\n  if(document.getElementById(`pending_comp_${id}`)) body.complementary = collect(`pending_comp_${id}`);\n  if(document.getElementById(`pending_periph_${id}`)) body.peripheral = collect(`pending_periph_${id}`);\n  if(document.getElementById(`pending_pos_${id}`)) body.positive = collect(`pending_pos_${id}`);\n  if(document.getElementById(`pending_neg_${id}`)) body.negative = collect(`pending_neg_${id}`);\n  const total = (body.main||[]).length + (body.complementary||[]).length + (body.peripheral||[]).length + (body.positive||[]).length + (body.negative||[]).length;\n  if(!total){toast('حداقل یک کلیدواژه انتخاب کنید', false);return}\n  try{\n    await api('ai-apply-manual', {method:'POST', body:JSON.stringify(body)});\n    toast(`${total} کلیدواژه ${mode==='add'?'اضافه':'جایگزین'} شد`);\n    loadAIPending();\n    loadSources();\n  }catch(e){toast(e.message, false)}\n}\nasync function rejectAI(id){\n  if(!confirm('رد شود؟')) return;\n  try{await api('ai-reject', {method:'POST', body:JSON.stringify({source_id:id})});toast('رد شد');loadAIPending()}catch(e){toast(e.message, false)}\n}\n\n// ─── Report ───\nasync function loadReport(){\n  try{\n    const d = await api('report');\n    let html = `<div style=\"margin-bottom:1rem;font-size:.85rem;color:var(--muted)\">📈 مجموع ارسال ۲۴ ساعت: <strong style=\"color:var(--accent)\">${d.total||0}</strong></div>`;\n    const topics = Object.entries(d.byTopic||{});\n    if(topics.length){\n      html += '<div style=\"margin-bottom:1rem\"><strong>📂 به تفکیک موضوع:</strong></div>';\n      for(const [topic, td] of topics){\n        const posts = td.posts||[];\n        const chCount = td.channelCount||1;\n        html += `<div class=\"card\" style=\"margin-bottom:.75rem\">\n          <div style=\"display:flex;justify-content:space-between;margin-bottom:.5rem\">\n            <strong>${esc(topic)}</strong>\n            <span style=\"color:var(--muted);font-size:.75rem\">${posts.length} پست • ${chCount} کانال</span>\n          </div>\n          ${posts.slice(0,5).map(p=>`<div style=\"font-size:.78rem;padding:.25rem 0;border-top:1px solid var(--border)\">\n            <a href=\"${esc(p.link)}\" target=\"_blank\">@${esc(p.channel)}</a> — ${esc((p.text||'').slice(0,80))} ${p.views?`👁 ${p.views}`:''}\n          </div>`).join('')}\n        </div>`;\n      }\n    }\n    if(d.viral?.length){\n      html += '<div style=\"margin:1rem 0 .5rem\"><strong>🔥 پست‌های وایرال:</strong></div>';\n      html += d.viral.slice(0,10).map(p=>`<div style=\"font-size:.78rem;padding:.25rem 0\">\n        <a href=\"${esc(p.link)}\" target=\"_blank\">@${esc(p.channel)}</a> — 👁 ${p.views} — ${esc((p.text||'').slice(0,60))}\n      </div>`).join('');\n    }\n    if(!topics.length && !d.viral?.length){\n      html = '<div class=\"card\"><div class=\"empty\">📭 در ۲۴ ساعت گذشته پستی ارسال نشده</div></div>';\n    }\n    $('#reportBody').innerHTML = html;\n    $('#reportMeta').textContent = `${d.total||0} پست • ${topics.length} موضوع • ${d.viral?.length||0} وایرال`;\n  }catch(e){toast(e.message, false)}\n}\nasync function triggerReport(){\n  try{toast('در حال تولید...');await api('report-trigger', {method:'POST'});toast('✅ گزارش به ادمین ارسال شد')}catch(e){toast(e.message, false)}\n}\n\n// ─── Logs ───\nasync function loadLogs(){\n  try{\n    const action = $('#logActionFilter')?.value || '';\n    const q = ($('#logSearch')?.value || '').toLowerCase();\n    let url = 'logs?limit=100';\n    if(action) url += `&action=${action}`;\n    const d = await api(url);\n    let list = d.logs || [];\n    if(q) list = list.filter(l => (l.detail||'').toLowerCase().includes(q) || (l.post_text||'').toLowerCase().includes(q));\n    $('#logsCount').textContent = `(${list.length} رکورد)`;\n    if(!list.length){\n      $('#logsBody').innerHTML = '<div class=\"card\"><div class=\"empty\">📭 لاگی یافت نشد</div></div>';\n      return;\n    }\n    $('#logsBody').innerHTML = list.map(l=>{\n      let breakdown = '';\n      try { breakdown = formatBreakdown(l.breakdown); } catch {}\n      const hasExpandableContent = !!(breakdown || l.ai_raw);\n      const expandableClass = hasExpandableContent ? 'expandable' : 'no-expand';\n      return `<div class=\"log-entry ${expandableClass}\"${hasExpandableContent?` onclick=\"this.classList.toggle('expanded')\"`:''}>\n        <div class=\"log-header\">\n          <div>\n            <span class=\"log-action\">${esc(l.action)}</span>\n            <span class=\"log-badge ${l.action}\">${actionLabel(l.action)}</span>\n            ${l.ad_score?`<span style=\"font-size:.7rem;color:var(--muted);margin-inline-start:.3rem\">🛡 ${l.ad_score}</span>`:''}\n            ${l.ai_provider?`<span style=\"font-size:.7rem;color:var(--purple);margin-inline-start:.3rem\">🤖 ${esc(l.ai_provider)}</span>`:''}\n            ${hasExpandableContent?'<span style=\"font-size:.7rem;color:var(--accent);margin-inline-start:.3rem;opacity:.7\">▾ جزئیات</span>':''}\n          </div>\n          <span class=\"log-time\">${fmtDate(l.created_at)}</span>\n        </div>\n        <div class=\"log-detail\">${esc(l.detail||'')}</div>\n        ${l.source_id?`<div style=\"font-size:.7rem;color:var(--muted);margin-top:.2rem\">منبع #${l.source_id}${l.post_link?` • <a href=\"${esc(l.post_link)}\" target=\"_blank\" onclick=\"event.stopPropagation()\">لینک</a>`:''}</div>`:''}\n        ${breakdown?`<div class=\"log-breakdown\">${esc(breakdown)}</div>`:''}\n        ${l.ai_raw?`<div class=\"log-ai-raw\">${esc(l.ai_raw)}</div>`:''}\n        ${!hasExpandableContent?'<div style=\"font-size:.7rem;color:var(--muted);margin-top:.3rem;font-style:italic\">این لاگ قدیمی است و فیلد breakdown ندارد (قبل از آپدیت ربات ساخته شده).</div>':''}\n      </div>`;\n    }).join('');\n    // به‌روزرسانی hint بر اساس محتوا\n    const hintEl = $('#logsHint');\n    if(hintEl){\n      const hasExpandable = list.some(l => {\n        let bd = '';\n        try { bd = formatBreakdown(l.breakdown); } catch {}\n        return bd || l.ai_raw;\n      });\n      hintEl.textContent = hasExpandable\n        ? '💡 روی لاگ‌های با علامت «▾ جزئیات» کلیک کنید تا breakdown نمایش داده شود'\n        : '⚠️ لاگ‌های فعلی قدیمی هستند و breakdown ندارند. پس از آپدیت و اسکن جدید، لاگ‌های جدید با جزئیات نمایش داده می‌شوند.';\n    }\n  }catch(e){toast(e.message, false)}\n}\n\nfunction actionLabel(a){\n  return {\n    sent:'ارسال', skipped:'رد', scanned:'اسکن', error:'خطا',\n    ai_analyze:'تحلیل AI', ai_raw:'پاسخ AI', ai_approve:'تأیید AI',\n    daily_report:'گزارش', report_ad:'گزارش تبلیغ', restore:'بازیابی',\n    decision:'تصمیم',\n  }[a] || a;\n}\n\nfunction formatBreakdown(b){\n  if(!b) return '';\n  if(typeof b === 'string'){\n    try { b = JSON.parse(b); } catch { return b; }\n  }\n  if(!b || typeof b !== 'object') return '';\n\n  const lines = [];\n\n  // ── Deep Scoring breakdown ──\n  if(b.type === 'deep_scoring' || Array.isArray(b)){\n    let total = 0;\n    const arr = Array.isArray(b) ? b : (b.items || b.breakdown || []);\n    if(Array.isArray(arr)){\n      for(const item of arr){\n        const sign = item.value >= 0 ? '+' : '';\n        const label = {main:'اصلی', main_position:'موقعیت اصلی', complementary:'مکمل', peripheral:'پیرامونی', media_bonus:'رسانه', length_bonus:'طول متن'}[item.type] || item.type;\n        lines.push(`${label} «${item.kw||''}» ${sign}${item.value}`);\n        total += item.value || 0;\n      }\n    }\n    if(b.threshold !== undefined){\n      lines.push('────────────────');\n      lines.push(`امتیاز نهایی: ${b.score !== undefined ? b.score : total}`);\n      lines.push(`حداقل امتیاز: ${b.threshold}`);\n      const passed = (b.score !== undefined ? b.score : total) >= b.threshold;\n      lines.push(passed ? '✓ ارسال شد' : '✗ رد شد');\n    }\n    // اضافه کردن Anti-Ad breakdown\n    if(b.ad_breakdown){\n      lines.push('');\n      lines.push(...formatAdBreakdown(b.ad_breakdown));\n    }\n    return lines.join('\\n');\n  }\n\n  // ── Deep Classic breakdown ──\n  if(b.type === 'deep_classic'){\n    if(b.positive_match?.length) lines.push(`مثبت‌کننده: ${b.positive_match.join('، ')}`);\n    if(b.negative_match?.length) lines.push(`منفی‌کننده: ${b.negative_match.join('، ')}`);\n    if(b.logic) lines.push(`منطق: ${b.logic}`);\n    // اضافه کردن Anti-Ad breakdown\n    if(b.ad_breakdown){\n      lines.push('');\n      lines.push(...formatAdBreakdown(b.ad_breakdown));\n    }\n    return lines.join('\\n');\n  }\n\n  // ── Viral breakdown ──\n  if(b.type === 'viral' || b.viral_rules){\n    if(b.viral_rules?.length){\n      for(const r of b.viral_rules) lines.push(`${r.emoji} ${r.count}/${r.threshold} ${r.passed?'✓':'✗'}`);\n    } else if(b.total_count !== undefined){\n      lines.push(`مجموع ری‌اکشن: ${b.total_count}/${b.threshold}`);\n    }\n    if(b.failed_rule) lines.push(`رد به دلیل: ${b.failed_rule.emoji} ${b.failed_rule.count}/${b.failed_rule.threshold}`);\n    // اضافه کردن Anti-Ad breakdown\n    if(b.ad_breakdown){\n      lines.push('');\n      lines.push(...formatAdBreakdown(b.ad_breakdown));\n    }\n    return lines.join('\\n');\n  }\n\n  // ── Forward ──\n  if(b.type === 'forward'){\n    if(b.ad_breakdown){\n      lines.push('Forward — همیشه ارسال');\n      lines.push(...formatAdBreakdown(b.ad_breakdown));\n      return lines.join('\\n');\n    }\n    return 'Forward — همیشه ارسال';\n  }\n\n  return JSON.stringify(b, null, 2);\n}\n\n// ─── فرمت Anti-Ad breakdown (طبق سند: بخش‌به‌بخش) ───\nfunction formatAdBreakdown(ad){\n  if(!ad) return [];\n  const lines = ['🛡 Anti-Ad:'];\n  // reasons آرایه‌ای از امتیازدهی بخش‌به‌بخش است\n  if(ad.reasons && Array.isArray(ad.reasons)){\n    for(const r of ad.reasons){\n      lines.push(`  ${r}`);\n    }\n  }\n  // thresholdها\n  if(ad.threshold_block !== undefined){\n    lines.push(`  ────────────────`);\n    lines.push(`  آستانه Block: ${ad.threshold_block}`);\n    lines.push(`  آستانه Quarantine: ${ad.threshold_quarantine}`);\n  }\n  return lines;\n}\n\nfunction toggleLogAutoRefresh(){\n  if(logAutoRefreshTimer){clearInterval(logAutoRefreshTimer);logAutoRefreshTimer=null;return}\n  if($('#logAutoRefresh').checked){\n    logAutoRefreshTimer = setInterval(loadLogs, 30000);\n  }\n}\n\n// ─── Quarantine ───\nasync function loadQuarantine(){\n  try{\n    const d = await api('quarantine?status=pending');\n    const list = d.items || [];\n    if(!list.length){\n      $('#quarantineBody').innerHTML = '<div class=\"card\"><div class=\"empty\">✅ پست قرنطینه‌ای در انتظار نیست</div></div>';\n      return;\n    }\n    $('#quarantineBody').innerHTML = list.map(q=>`\n      <div class=\"card\" style=\"margin-bottom:.5rem\">\n        <div style=\"display:flex;justify-content:space-between;margin-bottom:.5rem;flex-wrap:wrap;gap:.3rem\">\n          <div><strong>@${esc(q.channel)}</strong> <span style=\"color:var(--muted);font-size:.75rem\">${fmtDate(q.created_at)}</span></div>\n          <span class=\"badge b-warn\">امتیاز: ${q.score||0}</span>\n        </div>\n        <div style=\"font-size:.8rem;margin-bottom:.5rem\">${esc((q.post_text||'').slice(0,300))}</div>\n        <div style=\"display:flex;gap:.3rem;flex-wrap:wrap\">\n          <a class=\"btn btn-ghost btn-sm\" href=\"${esc(q.post_link)}\" target=\"_blank\">🔗 مشاهده</a>\n          <button class=\"btn btn-danger btn-sm\" onclick=\"quarantineAction(${q.id},'ad')\">❌ تبلیغ</button>\n          <button class=\"btn btn-primary btn-sm\" onclick=\"quarantineAction(${q.id},'clean')\">✅ پاک</button>\n        </div>\n      </div>\n    `).join('');\n  }catch(e){toast(e.message, false)}\n}\nasync function quarantineAction(id, action){\n  try{await api('quarantine', {method:'POST', body:JSON.stringify({id, action})});toast(action==='ad'?'تبلیغ تأیید شد':'پاک تأیید شد');loadQuarantine()}catch(e){toast(e.message, false)}\n}\n\n// ─── Ad Weights ───\nasync function loadAdWeights(){\n  try{\n    const d = await api('ad-weights?limit=100');\n    const list = d.items || [];\n    if(!list.length){\n      $('#adWeightsBody').innerHTML = '<tr><td colspan=\"6\" class=\"empty\">📭 وزنی ثبت نشده</td></tr>';\n      return;\n    }\n    $('#adWeightsBody').innerHTML = list.map(w=>`<tr>\n      <td><code>${esc(w.token)}</code></td>\n      <td><span class=\"badge b-deep\">${esc(w.type)}</span></td>\n      <td><strong>${w.weight}</strong></td>\n      <td>${w.hits||0}</td>\n      <td>${w.auto?'🤖':'👤'}</td>\n      <td><button class=\"icon-btn del\" onclick=\"delAdWeight('${esc(w.token)}')\">🗑</button></td>\n    </tr>`).join('');\n  }catch(e){toast(e.message, false)}\n}\nasync function addAdWeight(){\n  const token = $('#adwToken').value.trim().toLowerCase();\n  if(!token){toast('توکن را وارد کنید', false);return}\n  try{\n    await api('ad-weights', {method:'POST', body:JSON.stringify({token, type:$('#adwType').value, weight:parseInt($('#adwWeight').value,10)||30})});\n    toast('افزوده شد');\n    $('#adwToken').value = '';\n    loadAdWeights();\n  }catch(e){toast(e.message, false)}\n}\nasync function delAdWeight(token){\n  try{await api('ad-weights', {method:'DELETE', body:JSON.stringify({token})});toast('حذف شد');loadAdWeights()}catch(e){toast(e.message, false)}\n}\n\n// ─── Admins ───\nasync function loadAdmins(){\n  try{\n    const d = await api('admins');\n    const mainAdminName = d.main_name || 'ادمین اصلی';\n    $('#mainAdmin').innerHTML = `<div style=\"display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.75rem\">\n      <div style=\"display:flex;align-items:center;gap:.6rem\">\n        <span class=\"badge b-on\">👑 ادمین اصلی</span>\n        <div style=\"display:flex;flex-direction:column\">\n          <strong style=\"font-size:.95rem;color:var(--text)\">👤 ${esc(mainAdminName)}</strong>\n          <code style=\"font-size:.78rem;color:var(--muted)\">آیدی: ${esc(d.main)}</code>\n        </div>\n      </div>\n      <span class=\"badge b-on\" style=\"font-size:.72rem\">Full Access (دسترسی کامل)</span>\n    </div>`;\n    const list = d.admins || [];\n    if(!list.length){\n      $('#adminsBody').innerHTML = '<tr><td colspan=\"4\" class=\"empty\">ادمین فرعی تعریف نشده است</td></tr>';\n      return;\n    }\n    $('#adminsBody').innerHTML = list.map(a=>{\n      const perms = typeof a.permissions === 'string' ? safeJson(a.permissions, {}) : (a.permissions || {});\n      const permCount = Object.values(perms).filter(v=>v).length;\n      const adminName = a.display_name || a.name || 'ادمین فرعی';\n      const usernameHtml = a.username ? `<span style=\"font-size:.75rem;color:var(--accent);font-weight:normal;margin-inline-start:.35rem\">@${esc(a.username.replace('@',''))}</span>` : '';\n      const addedByDisplay = a.added_by_name ? `<div>${esc(a.added_by_name)}</div><code style=\"font-size:.72rem;color:var(--muted)\">${esc(a.added_by)}</code>` : `<code style=\"font-size:.78rem\">${esc(a.added_by||'—')}</code>`;\n      return `<tr>\n        <td>\n          <div style=\"font-weight:600;display:flex;align-items:center;gap:.35rem;font-size:.9rem\">\n            <span>👤</span>\n            <span>${esc(adminName)}</span>\n            ${usernameHtml}\n          </div>\n          <code style=\"font-size:.75rem;color:var(--muted)\">آیدی: ${esc(a.user_id)}</code>\n        </td>\n        <td style=\"font-size:.8rem\">${addedByDisplay}</td>\n        <td><span class=\"badge b-on\">${permCount}/۱۲ فعال</span></td>\n        <td>\n          <button class=\"icon-btn\" title=\"دسترسی‌ها\" onclick=\"openPermissions(${a.user_id})\">⚙️</button>\n          <button class=\"icon-btn del\" onclick=\"delAdmin(${a.user_id})\">🗑</button>\n        </td>\n      </tr>`;\n    }).join('');\n  }catch(e){toast(e.message, false)}\n}\n\nfunction openAddAdmin(){\n  $('#modalTitle').textContent = '➕ افزودن ادمین فرعی';\n  $('#modalContent').innerHTML = `<div class=\"field\"><label>آیدی عددی کاربر</label><input id=\"newAdminId\" placeholder=\"123456789\" /></div>`;\n  $('#modalActions').innerHTML = `<button class=\"btn btn-ghost\" onclick=\"closeModal()\">انصراف</button><button class=\"btn btn-primary\" onclick=\"saveAdmin()\">افزودن</button>`;\n  $('#modal').classList.add('active');\n}\nasync function saveAdmin(){\n  const id = $('#newAdminId').value.trim();\n  if(!id){toast('آیدی را وارد کنید', false);return}\n  try{await api('admins', {method:'POST', body:JSON.stringify({user_id:id})});toast('ادمین افزوده شد');closeModal();loadAdmins()}catch(e){toast(e.message, false)}\n}\nasync function delAdmin(id){\n  if(!confirm('حذف شود؟'))return;\n  try{await api('admins/'+id, {method:'DELETE'});toast('حذف شد');loadAdmins()}catch(e){toast(e.message, false)}\n}\nfunction openPermissions(adminId){\n  toast('ویرایش دسترسی از طریق /setpermissions در تلگرام انجام می‌شود');\n}\n\n// ─── Backup ───\nasync function downloadBackup(){\n  try{\n    const d = await api('backup');\n    const blob = new Blob([JSON.stringify(d, null, 2)], {type:'application/json'});\n    const url = URL.createObjectURL(blob);\n    const a = document.createElement('a');\n    a.href = url;\n    a.download = `backup-${new Date().toISOString().slice(0,10)}.json`;\n    a.click();\n    URL.revokeObjectURL(url);\n    toast('✅ بکاپ دانلود شد');\n  }catch(e){toast(e.message, false)}\n}\nasync function doRestore(){\n  const file = $('#restoreFile').files[0];\n  if(!file){toast('فایل را انتخاب کنید', false);return}\n  if(!confirm('بازیابی باعث بازنویسی منابع و وزن‌ها می‌شود. ادامه؟'))return;\n  try{\n    const text = await file.text();\n    const data = JSON.parse(text);\n    const r = await api('restore', {method:'POST', body:JSON.stringify(data)});\n    toast(`✅ ${r.restored} منبع + ${r.weights||0} وزن بازیابی شد`);\n    loadSources();\n  }catch(e){toast(e.message, false)}\n}\n\n// ─── Modal helpers ───\nfunction closeModal(){$('#modal').classList.remove('active')}\ndocument.addEventListener('keydown', e=>{if(e.key==='Escape')closeModal()});\n\n// ─── Keyboard shortcut: Enter on login ───\ndocument.addEventListener('DOMContentLoaded', ()=>{\n  const loginInput = $('#loginWorker');\n  if(loginInput && !loginInput.value){\n    // Try to pre-fill from saved URL\n    if(localStorage.getItem('workerUrl')) loginInput.value = localStorage.getItem('workerUrl');\n  }\n});\n</script>\n</body>\n</html>\n";
const FLOWCHART_HTML = "<!DOCTYPE html>\n<html lang=\"fa\" dir=\"rtl\">\n<head>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n<title>فلوچارت معماری نهایی ربات تجمیع‌کننده تلگرام (Telegram Aggregator Bot)</title>\n<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\n<link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>\n<link href=\"https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800&display=swap\" rel=\"stylesheet\">\n<style>\n  * { margin: 0; padding: 0; box-sizing: border-box; }\n  \n  :root {\n    --bg: #0a0e1a;\n    --bg-card: rgba(22, 28, 45, 0.75);\n    --bg-card-hover: rgba(30, 41, 69, 0.9);\n    --border: rgba(99, 102, 241, 0.18);\n    --border-strong: rgba(99, 102, 241, 0.4);\n    --text: #f1f5f9;\n    --text-sub: #94a3b8;\n    --text-muted: #64748b;\n    --accent: #06b6d4;\n    --accent-glow: rgba(6, 182, 212, 0.35);\n    --purple: #a78bfa;\n    --green: #10b981;\n    --yellow: #f59e0b;\n    --red: #ef4444;\n    --blue: #3b82f6;\n    --connector: #475569;\n    --shadow: 0 8px 30px rgba(0,0,0,0.3);\n  }\n\n  [data-theme=\"light\"] {\n    --bg: #f8fafc;\n    --bg-card: #ffffff;\n    --bg-card-hover: #f1f5f9;\n    --border: #e2e8f0;\n    --border-strong: #cbd5e1;\n    --text: #0f172a;\n    --text-sub: #475569;\n    --text-muted: #94a3b8;\n    --accent: #0284c7;\n    --accent-glow: rgba(2, 132, 199, 0.2);\n    --purple: #7c3aed;\n    --green: #059669;\n    --yellow: #d97706;\n    --red: #dc2626;\n    --blue: #2563eb;\n    --connector: #cbd5e1;\n    --shadow: 0 8px 30px rgba(0,0,0,0.06);\n  }\n\n  body {\n    font-family: 'Vazirmatn', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;\n    background: var(--bg);\n    color: var(--text);\n    min-height: 100vh;\n    line-height: 1.6;\n    -webkit-font-smoothing: antialiased;\n    transition: background 0.3s, color 0.3s;\n    background-image: \n      radial-gradient(at 10% 0%, rgba(6, 182, 212, 0.08) 0px, transparent 50%),\n      radial-gradient(at 90% 100%, rgba(167, 139, 250, 0.08) 0px, transparent 50%);\n    background-attachment: fixed;\n    padding-bottom: 60px;\n  }\n\n  .container {\n    max-width: 1200px;\n    margin: 0 auto;\n    padding: 30px 20px;\n  }\n\n  /* Header */\n  .top-bar {\n    display: flex;\n    justify-content: space-between;\n    align-items: center;\n    margin-bottom: 30px;\n    flex-wrap: wrap;\n    gap: 15px;\n    border-bottom: 1px solid var(--border);\n    padding-bottom: 20px;\n  }\n  .title-group h1 {\n    font-size: 1.6rem;\n    font-weight: 800;\n    background: linear-gradient(135deg, var(--accent) 0%, var(--purple) 100%);\n    -webkit-background-clip: text;\n    -webkit-text-fill-color: transparent;\n    display: inline-block;\n  }\n  .title-group p {\n    font-size: 0.9rem;\n    color: var(--text-sub);\n    margin-top: 4px;\n  }\n  .top-actions {\n    display: flex;\n    gap: 10px;\n    align-items: center;\n  }\n  .btn-action {\n    display: inline-flex;\n    align-items: center;\n    gap: 6px;\n    padding: 8px 14px;\n    border-radius: 8px;\n    font-family: inherit;\n    font-size: 0.85rem;\n    font-weight: 500;\n    cursor: pointer;\n    background: var(--bg-card);\n    border: 1px solid var(--border);\n    color: var(--text);\n    transition: all 0.2s;\n  }\n  .btn-action:hover {\n    border-color: var(--accent);\n    color: var(--accent);\n    transform: translateY(-1px);\n  }\n\n  /* Phase styling */\n  .phase-card {\n    background: var(--bg-card);\n    backdrop-filter: blur(12px);\n    border: 1px solid var(--border);\n    border-radius: 16px;\n    padding: 24px;\n    margin-bottom: 24px;\n    box-shadow: var(--shadow);\n    transition: border-color 0.25s;\n  }\n  .phase-card:hover {\n    border-color: var(--border-strong);\n  }\n  .phase-header {\n    display: flex;\n    align-items: center;\n    justify-content: space-between;\n    margin-bottom: 16px;\n    flex-wrap: wrap;\n    gap: 10px;\n  }\n  .phase-title-badge {\n    display: flex;\n    align-items: center;\n    gap: 10px;\n  }\n  .phase-num {\n    width: 32px;\n    height: 32px;\n    border-radius: 10px;\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    font-weight: 700;\n    font-size: 0.95rem;\n    color: #fff;\n  }\n  .phase-title {\n    font-size: 1.15rem;\n    font-weight: 700;\n    color: var(--text);\n  }\n  .phase-tag {\n    font-size: 0.75rem;\n    padding: 3px 10px;\n    border-radius: 999px;\n    background: rgba(99, 102, 241, 0.12);\n    color: var(--purple);\n    font-weight: 500;\n  }\n\n  /* Grid of steps */\n  .steps-grid {\n    display: grid;\n    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));\n    gap: 14px;\n  }\n  .step-node {\n    background: rgba(15, 23, 42, 0.35);\n    border: 1px solid var(--border);\n    border-radius: 12px;\n    padding: 14px 16px;\n    cursor: pointer;\n    transition: all 0.2s ease;\n    display: flex;\n    flex-direction: column;\n    justify-content: space-between;\n    position: relative;\n    overflow: hidden;\n  }\n  [data-theme=\"light\"] .step-node {\n    background: #f8fafc;\n  }\n  .step-node:hover {\n    transform: translateY(-2px);\n    border-color: var(--accent);\n    box-shadow: 0 4px 16px var(--accent-glow);\n  }\n  .step-node.active {\n    border-color: var(--accent);\n    background: rgba(6, 182, 212, 0.08);\n  }\n  .node-top {\n    display: flex;\n    align-items: center;\n    gap: 10px;\n    margin-bottom: 8px;\n  }\n  .node-icon {\n    font-size: 1.25rem;\n    width: 36px;\n    height: 36px;\n    border-radius: 8px;\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    background: rgba(255,255,255,0.06);\n    flex-shrink: 0;\n  }\n  .node-name {\n    font-size: 0.95rem;\n    font-weight: 700;\n    color: var(--text);\n  }\n  .node-desc {\n    font-size: 0.8rem;\n    color: var(--text-sub);\n    line-height: 1.5;\n    margin-bottom: 10px;\n  }\n  .node-footer {\n    display: flex;\n    justify-content: space-between;\n    align-items: center;\n    font-size: 0.72rem;\n    color: var(--text-muted);\n    border-top: 1px dashed var(--border);\n    padding-top: 8px;\n  }\n  .node-badge {\n    padding: 2px 7px;\n    border-radius: 6px;\n    font-size: 0.68rem;\n    font-weight: 600;\n  }\n  .nb-blue { background: rgba(59, 130, 246, 0.15); color: var(--blue); }\n  .nb-green { background: rgba(16, 185, 129, 0.15); color: var(--green); }\n  .nb-yellow { background: rgba(245, 158, 11, 0.15); color: var(--yellow); }\n  .nb-purple { background: rgba(167, 139, 250, 0.15); color: var(--purple); }\n  .nb-red { background: rgba(239, 68, 68, 0.15); color: var(--red); }\n\n  /* Flow separator arrow */\n  .flow-arrow {\n    text-align: center;\n    font-size: 1.5rem;\n    color: var(--connector);\n    margin: -10px 0 14px;\n    opacity: 0.7;\n  }\n\n  /* Detail Drawer / Modal */\n  .drawer-overlay {\n    position: fixed;\n    inset: 0;\n    background: rgba(0, 0, 0, 0.6);\n    backdrop-filter: blur(4px);\n    z-index: 100;\n    opacity: 0;\n    pointer-events: none;\n    transition: opacity 0.25s ease;\n  }\n  .drawer-overlay.active {\n    opacity: 1;\n    pointer-events: auto;\n  }\n  .drawer {\n    position: fixed;\n    top: 0;\n    left: 0;\n    bottom: 0;\n    width: 480px;\n    max-width: 90vw;\n    background: var(--bg-card);\n    border-right: 1px solid var(--border-strong);\n    box-shadow: 10px 0 40px rgba(0, 0, 0, 0.4);\n    z-index: 101;\n    transform: translateX(-100%);\n    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);\n    display: flex;\n    flex-direction: column;\n    overflow-y: auto;\n  }\n  .drawer.active {\n    transform: translateX(0);\n  }\n  .drawer-header {\n    padding: 20px;\n    border-bottom: 1px solid var(--border);\n    display: flex;\n    justify-content: space-between;\n    align-items: center;\n  }\n  .drawer-body {\n    padding: 24px 20px;\n    flex: 1;\n  }\n  .drawer-icon-box {\n    width: 52px;\n    height: 52px;\n    border-radius: 12px;\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    font-size: 1.8rem;\n    margin-bottom: 12px;\n  }\n  .drawer-title {\n    font-size: 1.25rem;\n    font-weight: 700;\n    margin-bottom: 4px;\n  }\n  .drawer-subtitle {\n    font-size: 0.85rem;\n    color: var(--text-sub);\n    margin-bottom: 20px;\n  }\n  .section-title {\n    font-size: 0.82rem;\n    font-weight: 700;\n    color: var(--text-sub);\n    text-transform: uppercase;\n    letter-spacing: 0.05em;\n    margin: 18px 0 8px;\n    display: flex;\n    align-items: center;\n    gap: 6px;\n  }\n  .code-box {\n    background: rgba(0, 0, 0, 0.35);\n    border: 1px solid var(--border);\n    border-radius: 8px;\n    padding: 10px 14px;\n    font-family: monospace;\n    font-size: 0.78rem;\n    color: var(--accent);\n    direction: ltr;\n    text-align: left;\n    white-space: pre-wrap;\n    word-break: break-all;\n  }\n  [data-theme=\"light\"] .code-box {\n    background: #f1f5f9;\n    color: #0369a1;\n  }\n  .tag-cloud {\n    display: flex;\n    flex-wrap: wrap;\n    gap: 6px;\n  }\n  .tag-item {\n    font-size: 0.75rem;\n    padding: 4px 10px;\n    border-radius: 6px;\n    display: inline-flex;\n    align-items: center;\n    gap: 4px;\n  }\n  .tag-does { background: rgba(16, 185, 129, 0.15); color: var(--green); border: 1px solid rgba(16, 185, 129, 0.3); }\n  .tag-doesnt { background: rgba(239, 68, 68, 0.15); color: var(--red); border: 1px solid rgba(239, 68, 68, 0.3); }\n  .tag-table { background: rgba(167, 139, 250, 0.15); color: var(--purple); border: 1px solid rgba(167, 139, 250, 0.3); }\n\n  /* Legend */\n  .legend {\n    display: flex;\n    flex-wrap: wrap;\n    justify-content: center;\n    gap: 16px;\n    padding: 16px;\n    background: var(--bg-card);\n    border: 1px solid var(--border);\n    border-radius: 12px;\n    margin-top: 30px;\n  }\n  .legend-item {\n    display: flex;\n    align-items: center;\n    gap: 8px;\n    font-size: 0.8rem;\n    color: var(--text-sub);\n  }\n  .legend-color {\n    width: 12px;\n    height: 12px;\n    border-radius: 4px;\n  }\n\n  @media (max-width: 600px) {\n    .drawer {\n      width: 100vw;\n      max-width: 100vw;\n    }\n  }\n</style>\n</head>\n<body>\n\n<div class=\"container\">\n  <!-- Top Bar -->\n  <div class=\"top-bar\">\n    <div class=\"title-group\">\n      <h1>معماری و خط لوله پردازشی ربات تجمیع محتوا</h1>\n      <p>فلوچارت تعاملی کد نهایی — Cloudflare Workers + D1 Database + Telegram + AI + Web Panel</p>\n    </div>\n    <div class=\"top-actions\">\n      <button class=\"btn-action\" onclick=\"toggleTheme()\" title=\"تغییر تم روشن / تاریک\">\n        🌓 تغییر تم\n      </button>\n      <button class=\"btn-action\" onclick=\"window.print()\" title=\"چاپ یا ذخیره PDF\">\n        🖨️ چاپ / PDF\n      </button>\n      <a class=\"btn-action\" href=\"/panel\" style=\"text-decoration:none;\">\n        ⚙️ بازگشت به پنل\n      </a>\n    </div>\n  </div>\n\n  <!-- PHASE 1: Entry Points -->\n  <div class=\"phase-card\">\n    <div class=\"phase-header\">\n      <div class=\"phase-title-badge\">\n        <div class=\"phase-num\" style=\"background:var(--blue);\">۱</div>\n        <div class=\"phase-title\">درگاه‌های ورودی و آغازگرها (Entry Points & Triggers)</div>\n      </div>\n      <span class=\"phase-tag\">ورودی‌ها</span>\n    </div>\n    <div class=\"steps-grid\">\n      <div class=\"step-node\" onclick=\"openNode('webhook')\">\n        <div class=\"node-top\">\n          <div class=\"node-icon\">📡</div>\n          <div class=\"node-name\">Telegram Webhook</div>\n        </div>\n        <div class=\"node-desc\">دریافت لحظه‌ای پیام‌ها، دستورات ادمین، کالبک دکمه‌های شیشه‌ای و تاپیک‌های تلگرام.</div>\n        <div class=\"node-footer\">\n          <span>POST /webhook</span>\n          <span class=\"node-badge nb-blue\">امنیت ادمین</span>\n        </div>\n      </div>\n\n      <div class=\"step-node\" onclick=\"openNode('cron_scan')\">\n        <div class=\"node-top\">\n          <div class=\"node-icon\">⏰</div>\n          <div class=\"node-name\">Cron: اسکن هر ۲ دقیقه</div>\n        </div>\n        <div class=\"node-desc\">اسکن منظم منابع به شیوه نوبتی (Round-Robin) جهت رعایت محدودیت CPU کلادفلر.</div>\n        <div class=\"node-footer\">\n          <span>*/2 * * * *</span>\n          <span class=\"node-badge nb-green\">Round-Robin</span>\n        </div>\n      </div>\n\n      <div class=\"step-node\" onclick=\"openNode('cron_ai')\">\n        <div class=\"node-top\">\n          <div class=\"node-icon\">🤖</div>\n          <div class=\"node-name\">Cron: تحلیل شبانه AI</div>\n        </div>\n        <div class=\"node-desc\">تحلیل ۳۰ پست اخیر منبع در ساعت ۲ بامداد ایران و استخراج هوشمند کلیدواژه‌های pending.</div>\n        <div class=\"node-footer\">\n          <span>30 22 * * * (UTC)</span>\n          <span class=\"node-badge nb-purple\">Gemini / CF AI</span>\n        </div>\n      </div>\n\n      <div class=\"step-node\" onclick=\"openNode('cron_report')\">\n        <div class=\"node-top\">\n          <div class=\"node-icon\">📊</div>\n          <div class=\"node-name\">Cron: گزارش ۲۴h + پاکسازی</div>\n        </div>\n        <div class=\"node-desc\">تولید گزارش هوشمند روزانه با لینک پست‌ها ساعت ۳ بامداد + حذف لاگ‌های بالای ۲ هفته.</div>\n        <div class=\"node-footer\">\n          <span>30 23 * * * (UTC)</span>\n          <span class=\"node-badge nb-yellow\">پاکسازی D1</span>\n        </div>\n      </div>\n\n      <div class=\"step-node\" onclick=\"openNode('panel_api')\">\n        <div class=\"node-top\">\n          <div class=\"node-icon\">🖥️</div>\n          <div class=\"node-name\">Web Panel & Mini App</div>\n        </div>\n        <div class=\"node-desc\">پنل مدیریت تحت وب و مینی‌اپ تلگرام با سشن SHA-256 و ۱۱ تب اختصاصی مدیریتی.</div>\n        <div class=\"node-footer\">\n          <span>/panel & /api/*</span>\n          <span class=\"node-badge nb-blue\">CORS + Session</span>\n        </div>\n      </div>\n    </div>\n  </div>\n\n  <div class=\"flow-arrow\">↓</div>\n\n  <!-- PHASE 2: Ingestion & Pre-processing -->\n  <div class=\"phase-card\">\n    <div class=\"phase-header\">\n      <div class=\"phase-title-badge\">\n        <div class=\"phase-num\" style=\"background:var(--accent);\">۲</div>\n        <div class=\"phase-title\">خط لوله اسکرپ و آماده‌سازی محتوا (Ingestion & Pre-processing)</div>\n      </div>\n      <span class=\"phase-tag\">پردازش محتوا</span>\n    </div>\n    <div class=\"steps-grid\">\n      <div class=\"step-node\" onclick=\"openNode('scrape')\">\n        <div class=\"node-top\">\n          <div class=\"node-icon\">🌐</div>\n          <div class=\"node-name\">scrapeChannel()</div>\n        </div>\n        <div class=\"node-desc\">واکشی HTML عمومی کانال از t.me/s/{channel} با هدرهای مرورگر واقعی و timeout ۱۲ ثانیه.</div>\n        <div class=\"node-footer\">\n          <span>fetch t.me/s/</span>\n          <span class=\"node-badge nb-green\">بدون عضویت ربات</span>\n        </div>\n      </div>\n\n      <div class=\"step-node\" onclick=\"openNode('parse')\">\n        <div class=\"node-top\">\n          <div class=\"node-icon\">✂️</div>\n          <div class=\"node-name\">parsePosts()</div>\n        </div>\n        <div class=\"node-desc\">استخراج دقیق متن، ۷ نوع رسانه، شناسه پست، تعداد بازدید، واکنش‌ها و زمان انتشار.</div>\n        <div class=\"node-footer\">\n          <span>parsePostBlock</span>\n          <span class=\"node-badge nb-blue\">پارس ساختاریافته</span>\n        </div>\n      </div>\n\n      <div class=\"step-node\" onclick=\"openNode('html_convert')\">\n        <div class=\"node-top\">\n          <div class=\"node-icon\">🎨</div>\n          <div class=\"node-name\">convertTelegramHtml()</div>\n        </div>\n        <div class=\"node-desc\">حفظ ساختار غنی تلگرام (Bold, Italic, Spoiler, Quote, Links) و بستن ایمن تگ‌های ناتمام.</div>\n        <div class=\"node-footer\">\n          <span>balanceHtmlTags</span>\n          <span class=\"node-badge nb-yellow\">ضد خطای 400</span>\n        </div>\n      </div>\n\n      <div class=\"step-node\" onclick=\"openNode('dedup')\">\n        <div class=\"node-top\">\n          <div class=\"node-icon\">🔒</div>\n          <div class=\"node-name\">ضدتکرار SHA-256 (D1)</div>\n        </div>\n        <div class=\"node-desc\">تولید هش یکتا از شناسه پست و کانال؛ ذخیره در جدول dedup با بازه ماندگاری ۷ روزه.</div>\n        <div class=\"node-footer\">\n          <span>isDuplicate()</span>\n          <span class=\"node-badge nb-red\">جلوگیری از ارسال مجدد</span>\n        </div>\n      </div>\n    </div>\n  </div>\n\n  <div class=\"flow-arrow\">↓</div>\n\n  <!-- PHASE 3: Source Modes & Viral Growth -->\n  <div class=\"phase-card\">\n    <div class=\"phase-header\">\n      <div class=\"phase-title-badge\">\n        <div class=\"phase-num\" style=\"background:var(--purple);\">۳</div>\n        <div class=\"phase-title\">موتور تطبیق و رهگیری رشد وایرال (Dispatch & Viral Tracking)</div>\n      </div>\n      <span class=\"phase-tag\">منطق فیلتر</span>\n    </div>\n    <div class=\"steps-grid\">\n      <div class=\"step-node\" onclick=\"openNode('mode_forward')\">\n        <div class=\"node-top\">\n          <div class=\"node-icon\">⏩</div>\n          <div class=\"node-name\">حالت Forward</div>\n        </div>\n        <div class=\"node-desc\">انتقال سریع و مستقیم کلیه پست‌های جدید کانال به مقصد تعیین‌شده بدون فیلتر محتوا.</div>\n        <div class=\"node-footer\">\n          <span>forward mode</span>\n          <span class=\"node-badge nb-blue\">ارسال ۱۰۰٪</span>\n        </div>\n      </div>\n\n      <div class=\"step-node\" onclick=\"openNode('mode_deep')\">\n        <div class=\"node-top\">\n          <div class=\"node-icon\">🎯</div>\n          <div class=\"node-name\">حالت Deep (Classic / Scoring)</div>\n        </div>\n        <div class=\"node-desc\">فیلتر کلیدواژه‌ای؛ Classic (مثبت/منفی/every) یا Scoring چندسطحی با امتیاز تفکیکی.</div>\n        <div class=\"node-footer\">\n          <span>matchDeepScoring()</span>\n          <span class=\"node-badge nb-purple\">breakdown دقیق</span>\n        </div>\n      </div>\n\n      <div class=\"step-node\" onclick=\"openNode('mode_viral_growth')\">\n        <div class=\"node-top\">\n          <div class=\"node-icon\">🔥</div>\n          <div class=\"node-name\">Viral Growth Engine</div>\n        </div>\n        <div class=\"node-desc\">سنجش رشد واقعی ری‌اکشن در بررسی‌های متوالی با جدول viral_tracking و سقف ۴ بررسی.</div>\n        <div class=\"node-footer\">\n          <span>evaluateViralWithGrowth()</span>\n          <span class=\"node-badge nb-yellow\">ضد ارسال پست راکد</span>\n        </div>\n      </div>\n\n      <div class=\"step-node\" onclick=\"openNode('viral_suggest')\">\n        <div class=\"node-top\">\n          <div class=\"node-icon\">📈</div>\n          <div class=\"node-name\">پیشنهاد هوشمند آستانه</div>\n        </div>\n        <div class=\"node-desc\">آنالیز ۲۰ پست آخر روز قبل منبع بدون AI و پیشنهاد آستانه صدک ۸۰٪ در تلگرام و پنل.</div>\n        <div class=\"node-footer\">\n          <span>/api/viral-suggest</span>\n          <span class=\"node-badge nb-green\">داده واقعی روز قبل</span>\n        </div>\n      </div>\n    </div>\n  </div>\n\n  <div class=\"flow-arrow\">↓</div>\n\n  <!-- PHASE 4: Anti-Ad & Quarantine -->\n  <div class=\"phase-card\">\n    <div class=\"phase-header\">\n      <div class=\"phase-title-badge\">\n        <div class=\"phase-num\" style=\"background:var(--yellow);\">۴</div>\n        <div class=\"phase-title\">سیستم ۴ لایه‌ای ضد تبلیغات و قرنطینه (Anti-Ad & Quarantine)</div>\n      </div>\n      <span class=\"phase-tag\">پایش تبلیغات</span>\n    </div>\n    <div class=\"steps-grid\">\n      <div class=\"step-node\" onclick=\"openNode('ad_layer1')\">\n        <div class=\"node-top\">\n          <div class=\"node-icon\">📝</div>\n          <div class=\"node-name\">لایه ۱: کلمات و الگوها</div>\n        </div>\n        <div class=\"node-desc\">شناسایی ۸۰+ کلمه تبلیغاتی سنگین و متوسط (تخفیف، فروش، شارژ، سود) با وزن ۱۵ تا ۴۰.</div>\n        <div class=\"node-footer\">\n          <span>HEAVY / MEDIUM</span>\n          <span class=\"node-badge nb-yellow\">وزن متغیر</span>\n        </div>\n      </div>\n\n      <div class=\"step-node\" onclick=\"openNode('ad_layer2')\">\n        <div class=\"node-top\">\n          <div class=\"node-icon\">🔗</div>\n          <div class=\"node-name\">لایه ۲: لینک‌ها و اموجی‌ها</div>\n        </div>\n        <div class=\"node-desc\">بررسی لینک‌های joinchat، ربات‌های تجاری، دامنه‌های مشکوک (.vip, .xyz) و اموجی‌ها.</div>\n        <div class=\"node-footer\">\n          <span>SUSPICIOUS_DOMAINS</span>\n          <span class=\"node-badge nb-red\">+۲۵ تا +۳۵ امتیاز</span>\n        </div>\n      </div>\n\n      <div class=\"step-node\" onclick=\"openNode('ad_layer3')\">\n        <div class=\"node-top\">\n          <div class=\"node-icon\">⚡</div>\n          <div class=\"node-name\">لایه ۳: سیگنال پیش‌درآمد</div>\n        </div>\n        <div class=\"node-desc\">تشخیص استیکر یا پیام کوتاه مشکوک به عنوان پیش‌درآمد تبلیغ؛ اعمال ضریب ×۱.۵ در KV.</div>\n        <div class=\"node-footer\">\n          <span>KV TTL: 300s</span>\n          <span class=\"node-badge nb-purple\">ضریب حساسیت</span>\n        </div>\n      </div>\n\n      <div class=\"step-node\" onclick=\"openNode('ad_layer4')\">\n        <div class=\"node-top\">\n          <div class=\"node-icon\">⚖️</div>\n          <div class=\"node-name\">لایه ۴: ساختار و امتیاز منفی</div>\n        </div>\n        <div class=\"node-desc\">نسبت لینک به متن، خطوط جداکننده، و امتیاز منفی خنثی‌کننده برای پست‌های طولانی و معتبر.</div>\n        <div class=\"node-footer\">\n          <span>خنثی‌کننده خطای مثبت</span>\n          <span class=\"node-badge nb-green\">-۱۵ تا -۳۰ امتیاز</span>\n        </div>\n      </div>\n\n      <div class=\"step-node\" onclick=\"openNode('ad_verdicts')\">\n        <div class=\"node-top\">\n          <div class=\"node-icon\">🚦</div>\n          <div class=\"node-name\">تصمیم نهایی (Verdicts)</div>\n        </div>\n        <div class=\"node-desc\">امتیاز ≥ ۷۰ مسدود، ۴۰ تا ۶۹ قرنطینه با دکمه‌های داوری، کمتر از ۴۰ پاک و ارسال مستقیم.</div>\n        <div class=\"node-footer\">\n          <span>Block / Quarantine / Clean</span>\n          <span class=\"node-badge nb-blue\">امتیازدهی بخش‌به‌بخش</span>\n        </div>\n      </div>\n    </div>\n  </div>\n\n  <div class=\"flow-arrow\">↓</div>\n\n  <!-- PHASE 5: Delivery & Intelligence -->\n  <div class=\"phase-card\">\n    <div class=\"phase-header\">\n      <div class=\"phase-title-badge\">\n        <div class=\"phase-num\" style=\"background:var(--green);\">۵</div>\n        <div class=\"phase-title\">ارسال، هوش مصنوعی و گزارش‌دهی هوشمند (Delivery & Intelligence)</div>\n      </div>\n      <span class=\"phase-tag\">خروجی نهایی</span>\n    </div>\n    <div class=\"steps-grid\">\n      <div class=\"step-node\" onclick=\"openNode('deliver_post')\">\n        <div class=\"node-top\">\n          <div class=\"node-icon\">🚀</div>\n          <div class=\"node-name\">deliverPost()</div>\n        </div>\n        <div class=\"node-desc\">ارسال پست به چت یا تاپیک مقصد به همراه دکمه‌های لینک اصلی و «🚫 گزارش تبلیغ».</div>\n        <div class=\"node-footer\">\n          <span>HTML Fallback هوشمند</span>\n          <span class=\"node-badge nb-green\">پشتیبانی کامل تاپیک</span>\n        </div>\n      </div>\n\n      <div class=\"step-node\" onclick=\"openNode('ai_fallback')\">\n        <div class=\"node-top\">\n          <div class=\"node-icon\">🧠</div>\n          <div class=\"node-name\">runAIWithFallback()</div>\n        </div>\n        <div class=\"node-desc\">موتور هوش مصنوعی دوموتوره؛ اولویت با Gemini Flash با فال‌بک خودکار به Workers AI.</div>\n        <div class=\"node-footer\">\n          <span>Gemini ➔ Llama-3.3</span>\n          <span class=\"node-badge nb-purple\">کش هوشمند مدل</span>\n        </div>\n      </div>\n\n      <div class=\"step-node\" onclick=\"openNode('daily_report')\">\n        <div class=\"node-top\">\n          <div class=\"node-icon\">📑</div>\n          <div class=\"node-name\">گزارش روزانه هوشمند</div>\n        </div>\n        <div class=\"node-desc\">خلاصه‌سازی ۲۴ ساعته بر مبنای موضوعات، اخبار مهم و سایر گزارش‌ها با عناوین لینک‌شده.</div>\n        <div class=\"node-footer\">\n          <span>Smart Chunking < 3500</span>\n          <span class=\"node-badge nb-yellow\">هایپرلینک مستقیم</span>\n        </div>\n      </div>\n\n      <div class=\"step-node\" onclick=\"openNode('learning_loop')\">\n        <div class=\"node-top\">\n          <div class=\"node-icon\">🔄</div>\n          <div class=\"node-name\">چرخه یادگیری و حسابرسی</div>\n        </div>\n        <div class=\"node-desc\">یادگیری پویا در ad_weights، افزایش وزن با گزارش ادمین، /balancad و ثبت سابقه در audit_log.</div>\n        <div class=\"node-footer\">\n          <span>bumpPostWeights()</span>\n          <span class=\"node-badge nb-blue\">بهینه‌سازی مداوم</span>\n        </div>\n      </div>\n    </div>\n  </div>\n\n  <!-- Legend -->\n  <div class=\"legend\">\n    <div class=\"legend-item\"><div class=\"legend-color\" style=\"background:var(--blue);\"></div>ورودی‌ها و ترایگرها</div>\n    <div class=\"legend-item\"><div class=\"legend-color\" style=\"background:var(--accent);\"></div>اسکرپ و پردازش HTML</div>\n    <div class=\"legend-item\"><div class=\"legend-color\" style=\"background:var(--purple);\"></div>حالت‌های منبع و پایش رشد وایرال</div>\n    <div class=\"legend-item\"><div class=\"legend-color\" style=\"background:var(--yellow);\"></div>ضد تبلیغات و قرنطینه</div>\n    <div class=\"legend-item\"><div class=\"legend-color\" style=\"background:var(--green);\"></div>ارسال، هوش مصنوعی و یادگیری</div>\n  </div>\n</div>\n\n<!-- Drawer / Detail Sheet -->\n<div class=\"drawer-overlay\" id=\"overlay\" onclick=\"closeDrawer()\"></div>\n<div class=\"drawer\" id=\"drawer\">\n  <div class=\"drawer-header\">\n    <div style=\"font-weight:700;font-size:1rem;\">جزئیات فنی گام انتخابی</div>\n    <button class=\"btn-action\" onclick=\"closeDrawer()\" style=\"padding:4px 8px;\">✕</button>\n  </div>\n  <div class=\"drawer-body\" id=\"drawerBody\">\n    <!-- دینامیک توسط جاوااسکریپت پر می‌شود -->\n  </div>\n</div>\n\n<script>\nconst NODE_DETAILS = {\n  webhook: {\n    icon: '📡', bg: 'rgba(59, 130, 246, 0.15)',\n    title: 'Telegram Webhook (/webhook)',\n    sub: 'درگاه اصلی دریافت تعاملات تلگرام با متد POST',\n    code: 'export default { async fetch(request, env, ctx) { ... if (url.pathname === \"/webhook\") return handleWebhook(request, env, ctx); } }',\n    does: [\n      'دریافت پیام‌های متنی و دستورات شروع با /',\n      'مدیریت دکمه‌های شیشه‌ای (Callback Queries)',\n      'پشتیبانی از گروه‌های تاپیک‌دار (message_thread_id)',\n      'تأیید هویت و اعمال دسترسی ادمین‌های اصلی و فرعی',\n      'هندلینگ حالت Force Reply برای ویزاردهای چندمرحله‌ای'\n    ],\n    doesnt: [\n      'اسکن زمان‌بندی‌شده (آن توسط Cron Trigger انجام می‌شود)',\n      'پاسخ‌دهی به کاربران عادی (سکوت کامل امنیتی)'\n    ],\n    tables: ['admins', 'kv_meta (state)']\n  },\n  cron_scan: {\n    icon: '⏰', bg: 'rgba(16, 185, 129, 0.15)',\n    title: 'Cron Job: اسکن منابع (هر ۲ دقیقه)',\n    sub: 'اجرای منظم اسکن به شکل حلقه‌ای یکی‌به‌یکی (Round-Robin)',\n    code: 'async function runCron(env) {\\n  let idxRow = await env.DB.prepare(\"SELECT value FROM kv_meta WHERE key = ?\").bind(\"scan_index\").first();\\n  const sources = await env.DB.prepare(\"SELECT * FROM sources WHERE active = 1 ORDER BY id ASC\").all();\\n  ...\\n  await scanSource(source, env, false);\\n}',\n    does: [\n      'خواندن اندیس فعلی اسکن از جدول kv_meta',\n      'انتخاب منبع فعال بعدی و به‌روزرسانی اندیس',\n      'اسکرپ و پردازش ۱۰ پست آخر با کنترل نرخ مصرف CPU',\n      'ارزیابی قوانین Dispatch و Anti-Ad برای هر پست'\n    ],\n    doesnt: [\n      'اسکن همزمان همه منابع (جهت پرهیز از Timeout و CPU Limit)'\n    ],\n    tables: ['sources', 'kv_meta', 'logs', 'dedup']\n  },\n  cron_ai: {\n    icon: '🤖', bg: 'rgba(167, 139, 250, 0.15)',\n    title: 'Cron Job: تحلیل شبانه کلیدواژه‌ها (ساعت ۲ بامداد ایران)',\n    sub: 'تحلیل خودکار محتوای منابع دارای موضوع مشخص',\n    code: 'async function runAIAnalysis(env) {\\n  // انتخاب یک منبع با موضوع مشخص به نوبت\\n  // واکشی ۳۰ پست اخیر و ارسال پرامپت تحلیلی به Gemini\\n  // ذخیره کلیدواژه‌های اصلی، مکمل و پیرامونی به عنوان pending\\n}',\n    does: [\n      'واکشی ۳۰ پست اخیر کانال‌های فعال',\n      'تحلیل معنایی و فرکانس کلمات توسط مدل هوش مصنوعی',\n      'پیشنهاد کلیدواژه‌های ۳ سطحی برای حالت Deep Scoring',\n      'پیشنهاد کلیدواژه‌های مثبت و منفی برای Deep Classic',\n      'ارسال اعلان تأیید به ادمین همراه با دکمه‌های Toggle'\n    ],\n    doesnt: [\n      'اعمال بی‌اجازه کلیدواژه‌ها (نیاز به تأیید ادمین در ربات یا پنل)'\n    ],\n    tables: ['sources', 'ai_suggestions', 'logs']\n  },\n  cron_report: {\n    icon: '📊', bg: 'rgba(245, 158, 11, 0.15)',\n    title: 'Cron Job: گزارش ۲۴ ساعته و پاکسازی (ساعت ۳ بامداد ایران)',\n    sub: 'گزارش‌گیری تجمیعی هوشمند و پاکسازی داده‌های قدیمی',\n    code: 'async function runDailyReport(env) {\\n  const sentPosts = await env.DB.prepare(\"SELECT * FROM logs WHERE action=\\'sent\\' AND created_at >= ?\").all();\\n  // گروه‌بندی، خلاصه‌سازی و ارسال به ادمین\\n  await cleanupOldHashes(env); // حذف هشت‌های بالای ۷ روز\\n  await cleanupOldLogs(env);   // حذف لاگ‌های بالای ۱۴ روز\\n}',\n    does: [\n      'واکشی کلیه پست‌های ارسالی ۲۴ ساعت گذشته',\n      'گروه‌بندی موضوعی و کانالی پست‌ها',\n      'تولید خلاصه تحلیلی با عناوین هایپرلینک‌شده به تلگرام',\n      'حذف خودکار هش‌های ضدتکرار بالای ۷ روز',\n      'حذف خودکار لاگ‌های عملیاتی بالای ۱۴ روز',\n      'حذف رکوردهای منقضی‌شده جدول viral_tracking'\n    ],\n    doesnt: [\n      'حذف منابع، ادمین‌ها یا وزن‌های ضد تبلیغات'\n    ],\n    tables: ['logs', 'dedup', 'viral_tracking']\n  },\n  panel_api: {\n    icon: '🖥️', bg: 'rgba(59, 130, 246, 0.15)',\n    title: 'Web Panel & Mini App (/panel, /api/*)',\n    sub: 'رابط کاربری مدرن SPA و تلگرام مینی‌اپ با ۱۱ تب کامل',\n    code: 'async function handleApi(request, env, url) {\\n  const auth = await checkAuth(request, env);\\n  // مسیرهای مدیریت منابع، ضد تبلیغ، قرنطینه، لاگ‌ها، بکاپ، وایرال\\n}',\n    does: [\n      'ورود با رمز عبور و سشن رمزنگاری‌شده ایمن',\n      'افزودن و ویرایش گروهی منابع (Forward / Deep / Viral)',\n      'پیشنهاد هوشمند آستانه ری‌اکشن (/api/viral-suggest)',\n      'داوری موارد قرنطینه (تأیید تبلیغ / تأیید پاک)',\n      'مشاهده نمودارهای Chart.js و فیلتر لاگ‌ها با breakdown',\n      'پشتیبان‌گیری کامل JSON و بازیابی آنی'\n    ],\n    doesnt: [\n      'ذخیره پسورد به صورت پلین در کلاینت'\n    ],\n    tables: ['sources', 'ad_weights', 'quarantine', 'audit_log', 'admins']\n  },\n  scrape: {\n    icon: '🌐', bg: 'rgba(16, 185, 129, 0.15)',\n    title: 'scrapeChannel(channel, maxPosts)',\n    sub: 'واکشی بدون واسطه و بدون نیاز به عضویت از پیش‌نمایش تلگرام',\n    code: 'async function scrapeChannel(channel, maxPosts = POSTS_PER_SCAN) {\\n  const url = `https://t.me/s/${clean}`;\\n  const res = await fetch(url, { headers: { \"User-Agent\": \"...\" }, signal: controller.signal });\\n  return { ok: true, posts: parsePosts(html, maxPosts), channel: clean };\\n}',\n    does: [\n      'شبیه‌سازی کامل هدرهای مرورگر برای جلوگیری از محدودیت',\n      'مکانیزم AbortController با سقف ۱۲ ثانیه',\n      'پشتیبانی از واکشی صفحات قبل کانال در آنالیزهای عمیق',\n      'استخراج تا سقف ۵۰ پست در صورت نیاز آنالیز وایرال'\n    ],\n    doesnt: [\n      'استفاده از کتابخانه‌های سنگین سنگین و حافظه‌بر'\n    ],\n    tables: []\n  },\n  parse: {\n    icon: '✂️', bg: 'rgba(59, 130, 246, 0.15)',\n    title: 'parsePosts() & parsePostBlock()',\n    sub: 'موتور استخراج فیلدهای خام از بلوک‌های HTML تلگرام',\n    code: 'function parsePostBlock(block) {\\n  // text, mediaType, views, reactions, datetime, link, msgId\\n}',\n    does: [\n      'استخراج متن کامل پست و کپشن رسانه‌ها',\n      'تشخیص ۷ نوع رسانه: عکس، ویدیو، استیکر، گیف، سند، ویس، متن',\n      'استخراج تعداد دقیق یا تقریبی بازدید (views)',\n      'استخراج تاریخچه و تعداد ری‌اکشن‌های ایموجی',\n      'تشخیص شناسه پست (msgId) و پیام‌های فوروارد/ریپلای'\n    ],\n    doesnt: [\n      'تغییر محتوای متنی در این مرحله'\n    ],\n    tables: []\n  },\n  html_convert: {\n    icon: '🎨', bg: 'rgba(245, 158, 11, 0.15)',\n    title: 'convertTelegramHtml()',\n    sub: 'حفظ استایل و بالانس تگ‌های فرمت‌بندی تلگرام',\n    code: 'function convertTelegramHtml(html) {\\n  // تبدیل تگ‌های وب تلگرام به تگ‌های مجاز Bot API\\n  // balanceHtmlTags: بستن تگ‌های بازمانده برای جلوگیری از خطای 400\\n}',\n    does: [\n      'پشتیبانی از <b>, <i>, <u>, <s>, <tg-spoiler>, <blockquote>, <code>, <pre>',\n      'حفظ و تصحیح لینک‌های درون‌متنی (<a href=\"...\">)',\n      'جلوگیری قطعی از خطای Bad Request: can\\'t parse entities',\n      'حذف اسکریپت‌ها و استایل‌های نامعتبر'\n    ],\n    doesnt: [\n      'حذف فرمت‌های اصلی نگارش نویسنده کانال'\n    ],\n    tables: []\n  },\n  dedup: {\n    icon: '🔒', bg: 'rgba(239, 68, 68, 0.15)',\n    title: 'سیستم ضدتکرار SHA-256 (D1 Database)',\n    sub: 'تضمین ارسال حداکثر یک‌بار برای هر محتوا',\n    code: 'async function hashPost(dataPost) {\\n  const digest = await crypto.subtle.digest(\"SHA-256\", new TextEncoder().encode(dataPost));\\n  return hex;\\n}',\n    does: [\n      'تولید هش یکتا بر مبنای کانال و شناسه پست (dataPost)',\n      'بررسی سریع وجود هش در جدول اختصاصی dedup با ایندکس B-Tree',\n      'ثبت آنی هش پس از ارسال موفق یا منقضی شدن پست وایرال',\n      'پاکسازی منظم رکوردهای قدیمی‌تر از ۷ روز'\n    ],\n    doesnt: [\n      'تداخل با پست‌های کانال‌های دیگر با متن یکسان'\n    ],\n    tables: ['dedup']\n  },\n  mode_forward: {\n    icon: '⏩', bg: 'rgba(59, 130, 246, 0.15)',\n    title: 'حالت فوروارد ساده (Forward Mode)',\n    sub: 'انتقال پیوسته و طبیعی تمامی پست‌های منبع',\n    code: 'if (source.mode === \"forward\") {\\n  shouldSend = true;\\n  dispatchDetail = \"Forward — همیشه ارسال\";\\n}',\n    does: [\n      'تطبیق فوری تمامی پست‌های دریافتی جدید',\n      'حفظ ترتیب زمانی پست‌ها در انتشار',\n      'ارسال پست به فاز ارزیابی Anti-Ad در صورت فعال بودن ضد تبلیغ'\n    ],\n    doesnt: [\n      'فیلتر کلیدواژه‌ای یا سنجش بازدید'\n    ],\n    tables: ['sources', 'logs']\n  },\n  mode_deep: {\n    icon: '🎯', bg: 'rgba(167, 139, 250, 0.15)',\n    title: 'حالت عمیق (Deep Classic & Deep Scoring)',\n    sub: 'موتور قدرتمند تحلیل و تطبیق کلیدواژه‌ای',\n    code: 'if (isScoring) {\\n  dispatchResult = matchDeepScoring(post, source, normalizedText);\\n} else {\\n  dispatchResult = matchDeep(post, source, normalizedText);\\n}',\n    does: [\n      'Deep Scoring: کلمات اصلی (+۴۰)، مکمل (+۱۵)، پیرامونی (-۲۰)',\n      'بونوس‌های ساختاری: شروع متن (+۱۵)، وجود مدیا (+۱۰)، طول مناسب (+۵)',\n      'مقایسه امتیاز کل با حد آستانه deep_threshold (پیش‌فرض ۵۰)',\n      'Deep Classic: کلمات مثبت‌کننده و منفی‌کننده با حالت every',\n      'ثبت دلیل و breakdown کامل بخش‌به‌بخش در لاگ D1'\n    ],\n    doesnt: [\n      'گزارش امتیاز مبهم بدون تفکیک بخش‌ها'\n    ],\n    tables: ['sources', 'logs']\n  },\n  mode_viral_growth: {\n    icon: '🔥', bg: 'rgba(245, 158, 11, 0.15)',\n    title: 'موتور سنجش رشد وایرال (Viral Growth Engine)',\n    sub: 'پایش شتاب واکنش‌ها برای کشف پست‌های واقعاً داغ',\n    code: 'async function evaluateViralWithGrowth(post, source, env) {\\n  // ۱. بررسی جدول viral_tracking\\n  // ۲. دور اول: ثبت اولیه (tracking) و عدم ارسال زودهنگام\\n  // ۳. دورهای بعد: اثبات رشد ری‌اکشن (growthObserved) + عبور از آستانه\\n  // ۴. سقف ۴ بررسی یا ۶ ساعت -> منقضی (expired)\\n}',\n    does: [\n      'جلوگیری از شبیه شدن وایرال به فوروارد در پست‌های قدیمی با ری‌اکشن ثابت',\n      'پایش ری‌اکشن‌های چندگانه (Multi-Reaction Rules مثل 🔥 ≥ 50 و ❤️ ≥ 20)',\n      'ثبت تاریخچه ری‌اکشن‌ها در هر دور اسکن در جدول viral_tracking',\n      'تأیید رشد متوالی پیش از اجازه انتشار پست',\n      'توقف خودکار پس از ۴ بررسی ناموفق یا گذشت ۶ ساعت'\n    ],\n    doesnt: [\n      'بررسی نامحدود و تکراری یک پست در تمام کرون‌ها'\n    ],\n    tables: ['viral_tracking', 'logs']\n  },\n  viral_suggest: {\n    icon: '📈', bg: 'rgba(16, 185, 129, 0.15)',\n    title: 'پیشنهاد آستانه هوشمند ری‌اکشن (بدون هوش مصنوعی)',\n    sub: 'محاسبه آماری دقیق بر اساس ۲۰ پست روز قبل منبع',\n    code: 'async function apiViralSuggest(request, env) {\\n  const postData = await fetchPreviousDayPosts(channel, 20);\\n  const calculated = computeViralThresholds(postData.posts, targetEmojis);\\n  // میانگین، بیشترین و صدک ۸۰ برتر\\n}',\n    does: [\n      'استخراج مشخصاً ۲۰ پست متعلق به روز قبل (۲۴ تا ۴۸ ساعت پیش)',\n      'تفکیک داده‌های آماری برای هر نوع ایموجی به صورت مجزا',\n      'محاسبه میانگین، بالاترین ری‌اکشن و صدک ۸۰٪ برتر کانال',\n      'پیشنهاد آستانه مجموع کل ری‌اکشن‌ها',\n      'امکان اعمال خودکار با یک کلیک در پنل وب و ربات تلگرام'\n    ],\n    doesnt: [\n      'استفاده از هوش مصنوعی یا هزینه‌تراشی توکن',\n      'اتکا به پست‌های ناقص و در حال رشد امروز'\n    ],\n    tables: ['sources']\n  },\n  ad_layer1: {\n    icon: '📝', bg: 'rgba(245, 158, 11, 0.15)',\n    title: 'ضد تبلیغ — لایه ۱: کلمات و الگوهای تجاری',\n    sub: 'فیلتر واژگانی سنگین و متوسط با امتیازدهی پویا',\n    code: 'const HEAVY_AD_WORDS = [\"شارژ حساب\", \"سود روزانه\", \"سیگنال تضمینی\", \"کد تخفیف\", ...];\\nconst MEDIUM_AD_WORDS = [\"خرید\", \"فروش\", \"تخفیف\", \"ثبت نام\", ...];',\n    does: [\n      'کلمات سنگین (+۳۰ تا +۴۰ امتیاز)',\n      'کلمات متوسط (+۱۵ تا +۲۵ امتیاز)',\n      'تطبیق با جدول وزن‌های پویا ad_weights در دیتابیس',\n      'ثبت توکن‌های کشف‌شده در ریزدلایل لاگ'\n    ],\n    doesnt: [\n      'مسدودسازی صرفاً بر اساس یک کلمه معمولی'\n    ],\n    tables: ['ad_weights']\n  },\n  ad_layer2: {\n    icon: '🔗', bg: 'rgba(239, 68, 68, 0.15)',\n    title: 'ضد تبلیغ — لایه ۲: لینک‌ها، ربات‌ها و اموجی‌ها',\n    sub: 'شناسایی شاخص‌های رفتاری کانال‌های اسپم',\n    code: 'if (SUSPICIOUS_DOMAINS.test(link)) score += 30;\\nif (/@\\\\w+bot\\\\b/i.test(text)) score += 35;\\nif (text.includes(\"joinchat\") || text.includes(\"t.me/+\")) score += 35;',\n    does: [\n      'شناسایی لینک‌های عضویت خصوصی (joinchat و t.me/+)',\n      'تشخیص آیدی ربات‌های ثبت‌نامی و خدمات تجاری',\n      'شناسایی دامنه‌های فیشینگ و کوتاه‌کننده (bit.ly, .vip, .top)',\n      'شمارش اموجی‌های تیپیکال تبلیغاتی (🎁, 🚀, 💰, 🔥)'\n    ],\n    doesnt: [\n      'مسدودسازی لینک‌های رسمی و معتبر خبری'\n    ],\n    tables: []\n  },\n  ad_layer3: {\n    icon: '⚡', bg: 'rgba(167, 139, 250, 0.15)',\n    title: 'ضد تبلیغ — لایه ۳: سیگنال پیش‌درآمد در KV',\n    sub: 'پیش‌بینی پست‌های تبلیغاتی چندمرحله‌ای',\n    code: 'if (post.mediaType === \"sticker\" || text.length < 20) {\\n  await setAdSignal(channel, env, \"short\");\\n}\\n// در اسکن پست بعدی از همان کانال:\\nif (hasSignal) score = Math.round(score * 1.5);',\n    does: [\n      'تشخیص استیکرهای جلب توجه یا پیام‌های کوتاه پیش‌درآمد',\n      'ذخیره موقت سیگنال به مدت ۵ دقیقه (TTL) در حافظه KV',\n      'اعمال ضریب حساسیت ۱.۵ برابری روی امتیاز پست بعدی همان کانال',\n      'جلوگیری از دور زدن سیستم با فوروارد دوتایی'\n    ],\n    doesnt: [\n      'ذخیره دائمی یا مسدودسازی خود استیکر به تنهایی'\n    ],\n    tables: ['KV Storage']\n  },\n  ad_layer4: {\n    icon: '📐', bg: 'rgba(16, 185, 129, 0.15)',\n    title: 'ضد تبلیغ — لایه ۴: ساختار و خنثی‌کننده‌ها',\n    sub: 'حفظ پست‌های ارزشمند و کاهش خطای مثبت کاذب',\n    code: 'if (text.length > 500) score -= 20;\\nif (post.isReply) score -= 15;\\nif (TRUSTED_DOMAINS.test(link)) score -= 30;',\n    does: [\n      'محاسبه چگالی لینک‌ها به کل متن',\n      'کسر امتیاز برای مقالات تحلیلی طولانی بالای ۵۰۰ کاراکتر',\n      'کسر امتیاز برای پاسخ‌ها و ریپلای‌های متنی معتبر',\n      'اعتباربخشی به منابع رسمی و دامنه‌های مورد اعتماد'\n    ],\n    doesnt: [\n      'اجازه عبور به تبلیغی که صراحتاً پکیج یا سود تضمینی می‌فروشد'\n    ],\n    tables: []\n  },\n  ad_verdicts: {\n    icon: '🚦', bg: 'rgba(59, 130, 246, 0.15)',\n    title: 'تصمیم‌گیری ۳ حالته ضد تبلیغات',\n    sub: 'تفکیک قطعی بر مبنای امتیاز نهایی و آستانه منبع',\n    code: 'if (adScore >= adThresholdBlock) verdict = \"block\";\\nelse if (adScore >= adThresholdQuarantine) verdict = \"quarantine\";\\nelse verdict = \"clean\";',\n    does: [\n      'امتیاز بالای ۷۰: مسدود قطعی (Block) بدون اتلاف منابع',\n      'امتیاز ۴۰ تا ۶۹: ارسال به مقصد قرنطینه با دکمه‌های ❌ تبلیغ، ✅ پاک، 🤖 تحلیل AI',\n      'امتیاز زیر ۴۰: تأیید به عنوان پست پاک و ارسال به مقصد نهایی',\n      'ثبت تمام فاکتورهای امتیازدهی بخش‌به‌بخش در لاگ D1'\n    ],\n    doesnt: [\n      'حذف پست بدون ذخیره دلیل و امکان بازبینی در قرنطینه'\n    ],\n    tables: ['quarantine', 'logs']\n  },\n  deliver_post: {\n    icon: '🚀', bg: 'rgba(16, 185, 129, 0.15)',\n    title: 'تحویل پست به تلگرام (deliverPost)',\n    sub: 'ارسال زیبا، پایدار و مقاوم با پشتیبانی تاپیک‌ها',\n    code: 'async function deliverPost(post, source, ctx, env) {\\n  // ارسال با فرمت HTML به chat_id و message_thread_id\\n  // در صورت بروز خطای تگ، فال‌بک خودکار به متن پاکیزه و امن\\n}',\n    does: [\n      'درج هدر و اطلاعات موضوعی و کانال منبع',\n      'نمایش آمار ری‌اکشن‌ها در حالت Viral و کلیدواژه‌ها در Deep',\n      'افزودن دکمه شیشه‌ای مشاهده در تلگرام و دکمه 🚫 گزارش تبلیغ',\n      'ارسال دقیق در همان تاپیک تلگرام مشخص‌شده (Topic Thread)',\n      'مکانیزم Fallback برای ارسال بدون وقفه حتی در خطای HTML تلگرام'\n    ],\n    doesnt: [\n      'سوزاندن پست در اثر خطای کاراکتر نامعتبر'\n    ],\n    tables: ['logs']\n  },\n  ai_fallback: {\n    icon: '🧠', bg: 'rgba(167, 139, 250, 0.15)',\n    title: 'موتور دوگانه هوش مصنوعی (Dual AI Engine)',\n    sub: 'پایداری بالا با زنجیره Fallback خودکار',\n    code: 'async function runAIWithFallback(prompt, env, systemInstruction, maxTokens) {\\n  // اولویت ۱: Gemini 2.5-flash / 2.0-flash / 1.5-flash\\n  // اولویت ۲: Workers AI (Llama-3.3-70b / Llama-3-8b)\\n}',\n    does: [\n      'فراخوانی REST مستقیم بدون پکیج‌های حجیم',\n      'کش ارائه‌دهنده و مدل موفق برای درخواست‌های بعدی',\n      'پشتیبانی کامل از زبان فارسی و فرمت‌بندی استاندارد تلگرام',\n      'کنترل هزینه و اجرای رایگان بر بستر گوگل و کلادفلر'\n    ],\n    doesnt: [\n      'کرش سیستم در صورت اختلال در یک مدل یا تمام شدن سهمیه'\n    ],\n    tables: ['kv_meta']\n  },\n  daily_report: {\n    icon: '📑', bg: 'rgba(245, 158, 11, 0.15)',\n    title: 'تولید گزارش هوشمند روزانه ۲۴h',\n    sub: 'ساختار استاندارد، عناوین لینک‌شده و تفکیک موضوعی',\n    code: 'function formatAiDailyReport(rawText) {\\n  // تفکیک موضوعات، اخبار مهم، سایر گزارش‌ها، و لینک‌های <a href=\"...\">\\n  // تقسیم بخش‌های طولانی به بسته‌های زیر ۳۵۰۰ کاراکتر (Smart Chunking)\\n}',\n    does: [\n      'هایپرلینک مستقیم به پست اصلی کانال با فرمت مجاز تلگرام',\n      'دسته‌بندی موضوعی دقیق و استخراج مهم‌ترین رویدادها',\n      'ارسال ایمن چندبخشی برای جلوگیری از محدودیت ۴۰۹۶ کاراکتری تلگرام',\n      'ارسال به ادمین اصلی ساعت ۳ بامداد یا به صورت دستی با /report'\n    ],\n    doesnt: [\n      'ارسال پیام‌های ناقص یا خطای پیام بیش از حد طولانی'\n    ],\n    tables: ['logs']\n  },\n  learning_loop: {\n    icon: '🔄', bg: 'rgba(59, 130, 246, 0.15)',\n    title: 'چرخه یادگیری و حسابرسی (Continuous Learning)',\n    sub: 'بهینه‌سازی مداوم دقت ضد تبلیغ و گزارش‌های حسابرسی',\n    code: 'async function bumpPostWeights(text, env) {\\n  // هر ۳ بار تکرار یک توکن تبلیغاتی -> افزایش وزن ۵ واحد\\n  // /balancad -> کسر وزن ۱۰ واحد برای پست‌های پاک\\n  // audit_log -> ثبت تغییرات دستی و خودکار\\n}',\n    does: [\n      'افزایش خودکار وزن کلمات تبلیغاتی پرتکرار جدید',\n      'پاسخ فوری به کلیک دکمه «🚫 گزارش تبلیغ» ادمین‌ها',\n      'دستور /balancad برای تعدیل و بخشش اشتباهات سیستم',\n      'ثبت رکوردهای تفکیکی در جدول audit_log جهت بررسی ادمین',\n      'پشتیبان‌گیری کامل دیتابیس در فایل JSON استاندارد'\n    ],\n    doesnt: [\n      'دستکاری تنظیمات بدون ثبت در تاریخچه حسابرسی'\n    ],\n    tables: ['ad_weights', 'feedback', 'audit_log']\n  }\n};\n\nfunction openNode(id) {\n  const d = NODE_DETAILS[id];\n  if (!d) return;\n\n  const body = document.getElementById('drawerBody');\n  body.innerHTML = `\n    <div class=\"drawer-icon-box\" style=\"background:${d.bg}\">${d.icon}</div>\n    <div class=\"drawer-title\">${d.title}</div>\n    <div class=\"drawer-subtitle\">${d.sub}</div>\n\n    <div class=\"section-title\">💻 قطعه کد و پیاده‌سازی ورکر</div>\n    <div class=\"code-box\">${escapeHtml(d.code)}</div>\n\n    <div class=\"section-title\">✅ وظایف و رفتارهای گام</div>\n    <div class=\"tag-cloud\" style=\"margin-bottom:12px;\">\n      ${d.does.map(item => `<span class=\"tag-item tag-does\">✓ ${escapeHtml(item)}</span>`).join('')}\n    </div>\n\n    ${d.doesnt && d.doesnt.length ? `\n      <div class=\"section-title\">🚫 مواردی که عمداً انجام نمی‌دهد</div>\n      <div class=\"tag-cloud\" style=\"margin-bottom:12px;\">\n        ${d.doesnt.map(item => `<span class=\"tag-item tag-doesnt\">✗ ${escapeHtml(item)}</span>`).join('')}\n      </div>\n    ` : ''}\n\n    ${d.tables && d.tables.length ? `\n      <div class=\"section-title\">🗄️ جداول و ذخیره‌سازهای درگیر</div>\n      <div class=\"tag-cloud\">\n        ${d.tables.map(t => `<span class=\"tag-item tag-table\">📊 ${escapeHtml(t)}</span>`).join('')}\n      </div>\n    ` : ''}\n  `;\n\n  document.getElementById('overlay').classList.add('active');\n  document.getElementById('drawer').classList.add('active');\n\n  document.querySelectorAll('.step-node').forEach(node => node.classList.remove('active'));\n  event?.currentTarget?.classList.add('active');\n}\n\nfunction closeDrawer() {\n  document.getElementById('overlay').classList.remove('active');\n  document.getElementById('drawer').classList.remove('active');\n  document.querySelectorAll('.step-node').forEach(node => node.classList.remove('active'));\n}\n\nfunction toggleTheme() {\n  const current = document.documentElement.getAttribute('data-theme') || 'dark';\n  const target = current === 'dark' ? 'light' : 'dark';\n  document.documentElement.setAttribute('data-theme', target);\n  localStorage.setItem('flowchart_theme', target);\n}\n\nfunction escapeHtml(str) {\n  return String(str || '').replace(/[&<>'\"]/g, tag => ({\n    '&': '&amp;',\n    '<': '&lt;',\n    '>': '&gt;',\n    \"'\": '&#39;',\n    '\"': '&quot;'\n  }[tag] || tag));\n}\n\n// بارگذاری تم ذخیره‌شده\n(function() {\n  const saved = localStorage.getItem('flowchart_theme');\n  if (saved) document.documentElement.setAttribute('data-theme', saved);\n})();\n\ndocument.addEventListener('keydown', e => {\n  if (e.key === 'Escape') closeDrawer();\n});\n</script>\n\n</body>\n</html>\n";


// ─── ثابت‌های پیکربندی ──────────────────────────────────────────────────────
const DEDUP_TTL = 604800;        // ۷ روز (ثانیه)
const SESSION_TTL = 86400;       // ۲۴ ساعت
const SCRAPE_TIMEOUT = 12000;    // میلی‌ثانیه
const BOT_API = 'https://api.telegram.org/bot';
const REACTION_EMOJI = '🫡';
const POSTS_PER_SCAN = 10;       // حداکثر پست بررسی‌شده در هر اسکن (بهینه برای سقف CPU)

// ─── ورودی اصلی ──────────────────────────────────────────────────────────────
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // پیش‌پاسخ CORS برای پنل
    if (request.method === 'OPTIONS') return cors(request);

    // اطمینان از صحت ستون‌های دیتابیس D1 در پس‌زمینه
    if (ctx && env?.DB) {
      ctx.waitUntil(ensureDbSchema(env));
    }

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

    // سرو کردن مستقیم فلوچارت معماری ربات
    if (url.pathname === '/flowchart') {
      return new Response(FLOWCHART_HTML, {
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
      // گزارش روزانه هر شب ساعت ۳ ایران (۲۳:۳۰ UTC) و پاکسازی سوابق قدیمی دیتابیس
      ctx.waitUntil((async () => {
        await runDailyReport(env);
        try { await cleanupOldHashes(env); } catch {}
        try { await cleanupOldLogs(env); } catch {}
      })());
    }
  },
};

// ===========================================================================
//  Telegram Bot API — توابع کمکی
// ===========================================================================
async function tg(method, params, env, retries = 2) {
  try {
    const res = await fetch(`${BOT_API}${env.BOT_TOKEN}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!data.ok && data.error_code === 429 && retries > 0) {
      const waitSec = Math.min(10, data.parameters?.retry_after || 2);
      await new Promise(r => setTimeout(r, waitSec * 1000));
      return tg(method, params, env, retries - 1);
    }
    return data;
  } catch (e) {
    if (retries > 0) {
      await new Promise(r => setTimeout(r, 1000));
      return tg(method, params, env, retries - 1);
    }
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
    { command: 'editsource', description: 'ویرایش تنظیمات منبع' },
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

// ─── اطمینان از سینک بودن ستون‌های دیتابیس D1 ─────────────────────────
let _dbSchemaChecked = false;
let _adminColumns = null;

async function getAdminColumns(env) {
  if (_adminColumns) return _adminColumns;
  try {
    const res = await env.DB.prepare("PRAGMA table_info(admins)").all();
    if (res && res.results && res.results.length > 0) {
      _adminColumns = new Set(res.results.map(r => (r.name || '').toLowerCase()));
      return _adminColumns;
    }
  } catch {}
  return new Set();
}

async function ensureDbSchema(env) {
  if (_dbSchemaChecked || !env || !env.DB) return;
  try {
    const cols = await getAdminColumns(env);
    if (cols.size > 0) {
      if (!cols.has('name')) {
        try {
          await env.DB.prepare("ALTER TABLE admins ADD COLUMN name TEXT").run();
          cols.add('name');
        } catch {}
      }
      if (!cols.has('username')) {
        try {
          await env.DB.prepare("ALTER TABLE admins ADD COLUMN username TEXT").run();
          cols.add('username');
        } catch {}
      }
      if (!cols.has('permissions')) {
        try {
          await env.DB.prepare("ALTER TABLE admins ADD COLUMN permissions TEXT DEFAULT '{}'").run();
          cols.add('permissions');
        } catch {}
      }
    }
    try { await env.DB.prepare("ALTER TABLE sources ADD COLUMN ai_keywords_enabled INTEGER DEFAULT 1").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE logs ADD COLUMN breakdown TEXT").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE logs ADD COLUMN ai_provider TEXT").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE logs ADD COLUMN ai_raw TEXT").run(); } catch {}
    try {
      await env.DB.prepare(`CREATE TABLE IF NOT EXISTS viral_tracking (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        source_id       INTEGER NOT NULL,
        data_post       TEXT    NOT NULL UNIQUE,
        post_link       TEXT    NOT NULL,
        check_count     INTEGER DEFAULT 1,
        first_seen_at   INTEGER NOT NULL,
        last_checked_at INTEGER NOT NULL,
        reactions_history TEXT  DEFAULT '[]',
        growth_observed INTEGER DEFAULT 0,
        status          TEXT    DEFAULT 'tracking',
        created_at      INTEGER
      )`).run();
      await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_viral_track_status ON viral_tracking(status)").run();
      await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_viral_track_source ON viral_tracking(source_id)").run();
    } catch {}
    _dbSchemaChecked = true;
  } catch {}
}

// ─── کش اطلاعات و نام ادمین‌ها در حافظه موقت ─────────────────────────────
const adminInfoCache = new Map();

async function updateAdminProfile(userId, fullName, uname, env) {
  if (!env || !env.DB || !userId) return;
  const uid = String(userId).trim();
  if (!uid || uid === 'panel') return;

  // ۱. همیشه در kv_meta ذخیره می‌کنیم (کاملاً ایزوله و مطمئن)
  try {
    await env.DB.prepare("INSERT OR REPLACE INTO kv_meta (key, value) VALUES (?,?)")
      .bind(`admin_info:${uid}`, JSON.stringify({ name: fullName, username: uname })).run();
  } catch {}

  // ۲. بررسی می‌کنیم آیا کاربر ادمین است؟
  try {
    const isAdm = await isAdmin(uid, env);
    if (!isAdm) return;

    const cols = await getAdminColumns(env);
    if (!cols.has('name')) {
      try {
        await env.DB.prepare("ALTER TABLE admins ADD COLUMN name TEXT").run();
        cols.add('name');
      } catch {}
    }
    if (!cols.has('username')) {
      try {
        await env.DB.prepare("ALTER TABLE admins ADD COLUMN username TEXT").run();
        cols.add('username');
      } catch {}
    }

    if (cols.has('name') && cols.has('username')) {
      await env.DB.prepare("UPDATE admins SET name=?, username=? WHERE user_id=?")
        .bind(fullName, uname, uid).run();
    }
  } catch {}
}

async function getAdminInfo(userId, env) {
  const uid = String(userId || '').trim();
  if (!uid) return { name: '', username: '' };
  if (uid === 'panel') return { name: 'پنل وب', username: '' };
  if (adminInfoCache.has(uid)) return adminInfoCache.get(uid);

  // ۱. بررسی جدول admins در صورت وجود ستون‌های name و username
  try {
    const cols = await getAdminColumns(env);
    if (cols.has('name') && cols.has('username')) {
      const row = await env.DB.prepare('SELECT name, username FROM admins WHERE user_id=?').bind(uid).first();
      if (row && (row.name || row.username)) {
        const info = { name: row.name || '', username: row.username || '' };
        adminInfoCache.set(uid, info);
        return info;
      }
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

      await updateAdminProfile(uid, fullName, uname, env);
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

  const cols = await getAdminColumns(env);
  if (!cols.has('name')) {
    try { await env.DB.prepare('ALTER TABLE admins ADD COLUMN name TEXT').run(); cols.add('name'); } catch {}
  }
  if (!cols.has('username')) {
    try { await env.DB.prepare('ALTER TABLE admins ADD COLUMN username TEXT').run(); cols.add('username'); } catch {}
  }

  if (cols.has('name') && cols.has('username')) {
    try {
      await env.DB.prepare(
        'INSERT INTO admins (user_id, name, username, added_by, created_at) VALUES (?,?,?,?,?)' +
        ' ON CONFLICT(user_id) DO UPDATE SET name=excluded.name, username=excluded.username'
      ).bind(uid, name, username, byStr, Date.now()).run();
      return;
    } catch {}
  }

  try {
    await env.DB.prepare('INSERT OR IGNORE INTO admins (user_id, added_by, created_at) VALUES (?,?,?)')
      .bind(uid, byStr, Date.now()).run();
  } catch {}
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
async function scrapeChannel(channel, maxPosts = POSTS_PER_SCAN) {
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
    return { ok: true, posts: parsePosts(html, maxPosts), channel: clean };
  } catch (e) {
    return { ok: false, error: e.message };
  } finally {
    clearTimeout(t);
  }
}

function parsePosts(html, maxPosts = POSTS_PER_SCAN) {
  const posts = [];
  const starts = [...html.matchAll(/class="tgme_widget_message_wrap/g)];
  if (starts.length === 0) return posts;

  const limit = Math.min(starts.length, maxPosts || POSTS_PER_SCAN);
  const startIndex = Math.max(0, starts.length - limit);
  for (let i = startIndex; i < starts.length; i++) {
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

  // استخراج محدوده کانتینر ری‌اکشن‌ها
  const wrapMatch = block.match(/class="[^"]*reactions\b[^"]*"[^>]*>([\s\S]*?)(?:<div class="tgme_widget_message_footer"|<\/body>|$)/i);
  const searchArea = wrapMatch ? wrapMatch[1] : block;

  // تفکیک هر ری‌اکشن به عنوان یک بخش مجزا
  const itemSplitter = /<(?:div|span|a|button)[^>]*class="[^"]*(?:tgme_widget_message_reaction\b|tgme_reaction\b)(?![_s])[^\"]*\"[^>]*>/gi;
  const indices = [];
  let m;
  while ((m = itemSplitter.exec(searchArea)) !== null) {
    indices.push(m.index);
  }

  // اگر فرمت تک‌تگی استفاده شده بود
  if (!indices.length) {
    const fallbackRegex = /<(?:div|span|a)[^>]*class="[^"]*(?:reaction\b)[^"]*"[^>]*>/gi;
    while ((m = fallbackRegex.exec(searchArea)) !== null) {
      indices.push(m.index);
    }
  }

  for (let i = 0; i < indices.length; i++) {
    const start = indices[i];
    const end = (i + 1 < indices.length) ? indices[i + 1] : searchArea.length;
    const itemBlock = searchArea.slice(start, end);

    // ۱. استخراج ایموجی
    let emoji = '';
    const emojiMatch = itemBlock.match(/class="[^"]*(?:reaction_emoji\b)[^"]*"[^>]*>([\s\S]*?)<\//i);
    if (emojiMatch) {
      emoji = emojiMatch[1].replace(/<[^>]+>/g, '').trim();
    }
    if (!emoji) {
      const imgMatch = itemBlock.match(/<img[^>]*alt="([^"]+)"/i);
      if (imgMatch) emoji = imgMatch[1].trim();
    }
    if (!emoji) {
      const clean = itemBlock.replace(/<[^>]+>/g, ' ');
      const uni = clean.match(/(\p{Extended_Pictographic}|\p{Emoji_Presentation})/u);
      if (uni) emoji = uni[1];
    }

    // ۲. استخراج تعداد شمارش
    let count = 0;
    const countMatch = itemBlock.match(/class="[^"]*(?:reaction_count\b)[^"]*"[^>]*>([\s\S]*?)<\//i);
    if (countMatch) {
      const cStr = countMatch[1].replace(/<[^>]+>/g, '').trim();
      count = parseViews(cStr);
    } else {
      const clean = itemBlock.replace(/<[^>]+>/g, ' ').trim();
      const numMatch = clean.match(/([\d.]+)\s*([KM]?)/i);
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
  // حذف لینک‌های پیش‌نمایش درونی بدون عبارات باگ‌ساز یا backtracking
  const previewIdx = cleanBlock.indexOf('tgme_widget_message_link_preview');
  if (previewIdx > 0) {
    const startTag = cleanBlock.lastIndexOf('<div', previewIdx);
    if (startTag >= 0) {
      const closeDiv = cleanBlock.indexOf('</div>', previewIdx);
      if (closeDiv >= 0) {
        cleanBlock = cleanBlock.slice(0, startTag) + ' ' + cleanBlock.slice(closeDiv + 6);
      }
    }
  }

  // ۴. استخراج متن اصلی پست A از cleanBlock
  let text = '';
  const textMatch = cleanBlock.match(/class="[^"]*\b(?:js-message_text|tgme_widget_message_text)\b[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
  if (textMatch) {
    text = convertTelegramHtml(textMatch[1]).trim();
  }

  // ۵. نوع رسانه فقط از پست اصلی (cleanBlock)
  let mediaType = 'text';
  if (cleanBlock.includes('tgme_widget_message_photo')) mediaType = 'photo';
  else if (cleanBlock.includes('tgme_widget_message_video') || cleanBlock.includes('tgme_widget_message_video_player') || cleanBlock.includes('tgme_widget_message_roundvideo')) mediaType = 'video';
  else if (cleanBlock.includes('tgme_widget_message_document')) mediaType = 'file';
  else if (cleanBlock.includes('tgme_widget_message_audio')) mediaType = 'audio';
  else if (cleanBlock.includes('tgme_widget_message_sticker')) mediaType = 'sticker';
  else if (cleanBlock.includes('tgme_widget_message_poll')) mediaType = 'poll';

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
const HEX_LUT = Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, '0'));
function bufToHex(buf) {
  const bytes = new Uint8Array(buf);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += HEX_LUT[bytes[i]];
  }
  return hex;
}

async function hashPost(postId) {
  const data = new TextEncoder().encode(postId);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return bufToHex(buf);
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
  try {
    await env.DB.prepare('DELETE FROM viral_tracking WHERE last_checked_at < ?').bind(cutoff).run();
  } catch {}
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
  const views = post.views || 0;

  // ── حالت ۱: multi-reaction با آستانه‌های جداگانه ──
  if (viralRules.length > 0) {
    const checked = [];
    let failedRule = null;
    const normEmoji = s => String(s || '').replace(/[\uFE0E\uFE0F]/g, '').trim();
    for (const rule of viralRules) {
      const r = reactions.find(x => normEmoji(x.emoji) === normEmoji(rule.emoji));
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
      views,
    };
  }

  // ── حالت ۲: مجموع ری‌اکشن‌ها (با فال‌بک به بازدید در صورت غیرفعال بودن ری‌اکشن در کانال) ──
  const totalCount = reactions.reduce((sum, r) => sum + (r.count || 0), 0);
  const passedReaction = totalCount >= threshold;
  // اگر کانال ری‌اکشن ندارد یا بسته است، بازدید را به عنوان معیار جایگزین بررسی کن
  const passedViewsFallback = (reactions.length === 0 && views >= threshold);
  const passed = passedReaction || passedViewsFallback;

  return {
    match: passed,
    reason: passedReaction 
      ? 'total_reactions_passed' 
      : (passedViewsFallback ? 'views_fallback_passed' : (reactions.length === 0 ? 'views_below_threshold' : 'total_reactions_below_threshold')),
    reactions,
    total_count: totalCount,
    views,
    threshold,
  };
}

// ===========================================================================
//  رهگیری و ارزیابی رشد واقعی در حالت Viral Mode (بخش‌های ۱ و ۲ بهینه‌سازی)
// ===========================================================================
const VIRAL_MAX_CHECKS = 4;                 // حداکثر ۴ بررسی متوالی
const VIRAL_WINDOW_MS = 6 * 60 * 60 * 1000; // پنجره زمانی ۶ ساعت

function extractReactionCounts(reactions = []) {
  const map = {};
  for (const r of reactions) {
    if (r.emoji) {
      const norm = String(r.emoji).replace(/[\uFE0E\uFE0F]/g, '').trim();
      map[norm] = r.count || 0;
    }
  }
  return map;
}

function getTotalReactions(reactions = []) {
  return (reactions || []).reduce((sum, r) => sum + (r.count || 0), 0);
}

async function evaluateViralWithGrowth(post, source, env) {
  const reactions = post.reactions || [];
  const viralRules = safeJson(source.viral_reactions, []);
  const threshold = source.viral_threshold || 1000;
  const views = post.views || 0;
  const dataPost = post.dataPost || `${source.channel}/${post.msgId}`;
  const now = Date.now();

  const currentCounts = extractReactionCounts(reactions);
  const currentTotal = getTotalReactions(reactions);

  // بررسی وضعیت آستانه‌ها
  const normEmoji = s => String(s || '').replace(/[\uFE0E\uFE0F]/g, '').trim();
  let thresholdMet = false;
  let failedRule = null;
  const checkedRules = [];

  if (viralRules.length > 0) {
    for (const rule of viralRules) {
      const nRule = normEmoji(rule.emoji);
      const count = currentCounts[nRule] || 0;
      const passed = count >= (rule.threshold || 0);
      checkedRules.push({ emoji: rule.emoji, threshold: rule.threshold, count, passed });
      if (!passed && !failedRule) {
        failedRule = { emoji: rule.emoji, threshold: rule.threshold, count };
      }
    }
    thresholdMet = checkedRules.every(c => c.passed);
  } else {
    const passedReaction = currentTotal >= threshold;
    const passedViews = (reactions.length === 0 && views >= threshold);
    thresholdMet = passedReaction || passedViews;
  }

  // ۱. بررسی جدول viral_tracking در دیتابیس D1
  let row = null;
  try {
    row = await env.DB.prepare('SELECT * FROM viral_tracking WHERE data_post = ?').bind(dataPost).first();
  } catch (e) {
    return matchViral(post, source);
  }

  // اگر قبلاً فرستاده شده یا منقضی شده
  if (row && (row.status === 'sent' || row.status === 'expired')) {
    return {
      match: false,
      reason: row.status === 'sent' ? 'already_sent' : 'viral_expired',
      status: row.status,
      detail: row.status === 'sent' ? 'قبلاً ارسال شده' : 'پایان بررسی و منقضی‌شده',
      reactions,
      views,
    };
  }

  // ۲. بررسی اول: اولین بار است که پست در اسکن رویت می‌شود
  if (!row) {
    const history = [{
      check: 1,
      time: now,
      counts: currentCounts,
      total: currentTotal,
      views,
    }];

    try {
      await env.DB.prepare(`
        INSERT INTO viral_tracking (source_id, data_post, post_link, check_count, first_seen_at, last_checked_at, reactions_history, growth_observed, status, created_at)
        VALUES (?,?,?,1,?,?,?,0,'tracking',?)
      `).bind(source.id, dataPost, post.link, now, now, JSON.stringify(history), now).run();
    } catch {}

    const countSummary = viralRules.length
      ? checkedRules.map(r => `${r.emoji}${r.count}/${r.threshold}`).join('، ')
      : `مجموع: ${currentTotal}/${threshold}`;

    return {
      match: false,
      reason: 'viral_initial_tracking',
      status: 'tracking',
      check_count: 1,
      detail: `پایش اولیه (بررسی ۱/${VIRAL_MAX_CHECKS}) — ${countSummary} — در انتظار بررسی رشد`,
      reactions,
      viral_rules: checkedRules,
      failed_rule: failedRule,
      total_count: currentTotal,
      views,
      threshold,
    };
  }

  // ۳. بررسی‌های بعدی: ارزیابی رشد واقعی
  const checkCount = (row.check_count || 1) + 1;
  const history = safeJson(row.reactions_history, []);
  const prev = history[history.length - 1] || {};
  const prevCounts = prev.counts || {};
  const first = history[0] || {};
  const firstCounts = first.counts || {};

  // الف) بررسی انقضای بازه زمانی (Viral Window)
  if (now - (row.first_seen_at || now) > VIRAL_WINDOW_MS) {
    try {
      await env.DB.prepare("UPDATE viral_tracking SET status='expired', last_checked_at=? WHERE id=?").bind(now, row.id).run();
    } catch {}
    return {
      match: false,
      reason: 'viral_window_expired',
      status: 'expired',
      detail: `پایان بازه زمانی وایرال (${Math.round((now - row.first_seen_at) / 3600000)} ساعت گذشت)`,
      reactions,
      views,
    };
  }

  // ب) سنجش رشد ری‌اکشن‌ها
  let growthObserved = false;
  let growthDetails = [];

  if (viralRules.length > 0) {
    let anyGrew = false;
    let noneDecreased = true;
    for (const rule of viralRules) {
      const nRule = normEmoji(rule.emoji);
      const curr = currentCounts[nRule] || 0;
      const prevC = prevCounts[nRule] || 0;
      const firstC = firstCounts[nRule] || 0;
      if (curr > prevC || curr > firstC) anyGrew = true;
      if (curr < prevC) noneDecreased = false;
      growthDetails.push(`${rule.emoji} ${firstC} ➔ ${curr} (آستانه: ${rule.threshold})`);
    }
    growthObserved = anyGrew && noneDecreased;
  } else {
    const prevTot = prev.total || 0;
    const firstTot = first.total || 0;
    growthObserved = (currentTotal > prevTot || currentTotal > firstTot);
    growthDetails.push(`مجموع: ${firstTot} ➔ ${currentTotal} (آستانه: ${threshold})`);
  }

  const growthSummary = growthDetails.join(' | ');

  // ج) اگر شرایط وایرال محقق شد (رشد اثبات شد AND از آستانه عبور کرد)
  if (growthObserved && thresholdMet) {
    history.push({ check: checkCount, time: now, counts: currentCounts, total: currentTotal, views });
    try {
      await env.DB.prepare("UPDATE viral_tracking SET check_count=?, last_checked_at=?, reactions_history=?, growth_observed=1, status='sent' WHERE id=?")
        .bind(checkCount, now, JSON.stringify(history), row.id).run();
    } catch {}

    return {
      match: true,
      reason: 'viral_growth_and_threshold_met',
      status: 'sent',
      check_count: checkCount,
      detail: `✓ رشد تأیید شد: ${growthSummary}`,
      growth_details: growthDetails,
      reactions,
      viral_rules: checkedRules,
      failed_rule: null,
      total_count: currentTotal,
      views,
      threshold,
    };
  }

  // د) اگر به سقف تعداد بررسی رسید اما وایرال نشد → انقضا
  if (checkCount >= VIRAL_MAX_CHECKS) {
    try {
      await env.DB.prepare("UPDATE viral_tracking SET check_count=?, last_checked_at=?, status='expired' WHERE id=?")
        .bind(checkCount, now, row.id).run();
    } catch {}

    return {
      match: false,
      reason: 'viral_max_checks_reached',
      status: 'expired',
      check_count: checkCount,
      detail: `پایان بررسی‌ها (${checkCount} بررسی انجام شد و به شرایط وایرال نرسید)`,
      reactions,
      views,
    };
  }

  // هـ) هنوز فرصت بررسی دارد → به‌روزرسانی برای دور بعد
  history.push({ check: checkCount, time: now, counts: currentCounts, total: currentTotal, views });
  try {
    await env.DB.prepare("UPDATE viral_tracking SET check_count=?, last_checked_at=?, reactions_history=? WHERE id=?")
      .bind(checkCount, now, JSON.stringify(history), row.id).run();
  } catch {}

  return {
    match: false,
    reason: 'viral_tracking_in_progress',
    status: 'tracking',
    check_count: checkCount,
    detail: `پایش بررسی ${checkCount}/${VIRAL_MAX_CHECKS}: ${growthSummary}`,
    reactions,
    viral_rules: checkedRules,
    failed_rule: failedRule,
    total_count: currentTotal,
    views,
    threshold,
  };
}

// ===========================================================================
//  دریافت ۲۰ پست روز قبل برای تعیین آستانه هوشمند ری‌اکشن (بخش ۳ بهینه‌سازی)
// ===========================================================================
async function fetchPreviousDayPosts(channel, targetCount = 20) {
  const clean = channel.replace(/^@/, '').replace(/^https?:\/\/t\.me\/s?\//i, '');
  const now = new Date();
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).getTime();
  const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;

  // مرحله ۱: اسکرپ اولیه
  const firstRes = await scrapeChannel(clean, 50);
  if (!firstRes.ok || !firstRes.posts || !firstRes.posts.length) {
    return { ok: false, error: firstRes.error || 'پستی برای این کانال یافت نشد', posts: [] };
  }

  let allPosts = [...firstRes.posts];

  // اگر پست‌های کافی از روز قبل نبود، صفحه قبل را بخوان
  const earliestMsgId = Math.min(...allPosts.map(p => p.msgId || 0));
  const hasEnoughYesterday = allPosts.filter(p => p.datetime && new Date(p.datetime).getTime() < todayStart).length >= targetCount;

  if (earliestMsgId > 1 && !hasEnoughYesterday) {
    try {
      const olderUrl = `https://t.me/s/${clean}?before=${earliestMsgId}`;
      const res = await fetch(olderUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });
      if (res.ok) {
        const html = await res.text();
        const olderPosts = parsePosts(html, 50);
        if (olderPosts.length) {
          allPosts = [...olderPosts, ...allPosts];
        }
      }
    } catch {}
  }

  // فیلتر کردن پست‌ها: فقط پست‌های قبل از امروز
  let candidatePosts = allPosts.filter(p => {
    if (!p.datetime) return false;
    const t = new Date(p.datetime).getTime();
    return t < todayStart;
  });

  // اگر تاریخ پست‌ها ثبت نشده بود (یا محیط تست)
  if (candidatePosts.length < 5) {
    const sliced = allPosts.slice(0, Math.max(1, allPosts.length - 2));
    candidatePosts = sliced.length ? sliced : allPosts;
  }

  const selectedPosts = candidatePosts.slice(-targetCount);

  const sampleDateStr = new Date(yesterdayStart).toLocaleDateString('fa-IR', {
    year: 'numeric', month: 'numeric', day: 'numeric',
  });

  return {
    ok: true,
    channel: clean,
    posts: selectedPosts,
    sampleDate: sampleDateStr,
  };
}

// ─── محاسبه آستانه پیشنهادی ساده و مبتنی بر داده واقعی ───
function computeViralThresholds(posts, targetEmojis = []) {
  if (!posts || !posts.length) {
    return {
      suggestions: targetEmojis.map(e => ({ emoji: e, recommended: 50, avg: 0, max: 0, samples: [] })),
      totalSuggestion: 100,
      totalAvg: 0,
      totalMax: 0,
      postCount: 0,
    };
  }

  const suggestions = [];
  const emojisToProcess = targetEmojis.length ? targetEmojis : ['🔥', '❤️', '👍'];

  for (const emoji of emojisToProcess) {
    const norm = String(emoji).replace(/[\uFE0E\uFE0F]/g, '').trim();
    const counts = posts.map(p => {
      const r = (p.reactions || []).find(x => String(x.emoji).replace(/[\uFE0E\uFE0F]/g, '').trim() === norm);
      return r ? r.count : 0;
    });

    const sum = counts.reduce((a, b) => a + b, 0);
    const avg = Math.round(sum / Math.max(1, counts.length));
    const max = Math.max(0, ...counts);

    // صدک ۸۰ (چارک برتر پست‌های روز گذشته منبع)
    const sorted = [...counts].sort((a, b) => a - b);
    const p80Idx = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.8));
    let rec = sorted[p80Idx] || Math.round(avg * 1.4);

    if (rec > 50) rec = Math.round(rec / 5) * 5;
    else if (rec > 10) rec = Math.round(rec / 2) * 2;
    if (rec < 5 && max > 0) rec = Math.max(3, max);
    if (rec <= 0) rec = 25;

    suggestions.push({
      emoji,
      recommended: rec,
      avg,
      max,
      samples: counts,
    });
  }

  // محاسبه آستانه مجموع کل ری‌اکشن‌ها
  const totalCounts = posts.map(p => {
    return (p.reactions || []).reduce((s, r) => s + (r.count || 0), 0);
  });
  const totalSum = totalCounts.reduce((a, b) => a + b, 0);
  const totalAvg = Math.round(totalSum / Math.max(1, totalCounts.length));
  const totalMax = Math.max(0, ...totalCounts);
  const sortedTotal = [...totalCounts].sort((a, b) => a - b);
  const p80Total = Math.min(sortedTotal.length - 1, Math.floor(sortedTotal.length * 0.8));
  let recTotal = sortedTotal[p80Total] || Math.round(totalAvg * 1.4);
  if (recTotal > 50) recTotal = Math.round(recTotal / 10) * 10;
  if (recTotal < 10 && totalMax > 0) recTotal = totalMax;
  if (recTotal <= 0) recTotal = 100;

  return {
    suggestions,
    totalSuggestion: recTotal,
    totalAvg,
    totalMax,
    postCount: posts.length,
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

const ALL_AD_WORDS_PREPARED = [...HEAVY_AD_WORDS, ...MEDIUM_AD_WORDS].map(item => ({
  w: item.w,
  wLower: item.w.toLowerCase(),
  s: item.s,
}));

function tokenizePost(text) {
  if (!text) return { words: [], links: [], emojis: [], bots: [] };
  const lower = text.toLowerCase();
  const tokens = { words: [], links: [], emojis: [], bots: [] };
  for (let i = 0; i < ALL_AD_WORDS_PREPARED.length; i++) {
    const item = ALL_AD_WORDS_PREPARED[i];
    if (lower.includes(item.wLower)) tokens.words.push(item);
  }
  const linkMatches = text.match(/https?:\/\/[^\s]+|t\.me\/[^\s]+|@[\w_]{3,}/gi);
  if (linkMatches) {
    for (let i = 0; i < linkMatches.length; i++) tokens.links.push(linkMatches[i].toLowerCase());
  }
  const botMatches = text.match(/@[a-z0-9_]+bot\b/gi);
  if (botMatches) {
    for (let i = 0; i < botMatches.length; i++) tokens.bots.push(botMatches[i].toLowerCase());
  }
  const emojiRe = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F1E6}-\u{1F1FF}]/gu;
  const allEmojis = text.match(emojiRe);
  if (allEmojis) {
    for (let i = 0; i < allEmojis.length; i++) {
      if (AD_EMOJIS.includes(allEmojis[i])) tokens.emojis.push(allEmojis[i]);
    }
  }
  return tokens;
}

// کش درون‌حافظه‌ای برای وزن‌های پویا تا از کوئری مکرر به D1 جلوگیری شود
let _cachedAdWeights = null;
let _cachedAdWeightsTime = 0;

async function getDynamicAdWeights(env) {
  if (!env || !env.DB) return [];
  const now = Date.now();
  if (_cachedAdWeights && (now - _cachedAdWeightsTime < 60000)) {
    return _cachedAdWeights;
  }
  try {
    const res = await env.DB.prepare('SELECT token, type, weight, hits FROM ad_weights WHERE weight > 0').all();
    const rows = res.results || [];
    _cachedAdWeights = rows.map(item => ({
      token: item.token,
      tok: (item.token || '').toLowerCase().trim(),
      type: item.type,
      weight: item.weight || 20,
    })).filter(x => x.tok.length >= 2);
    _cachedAdWeightsTime = now;
    return _cachedAdWeights;
  } catch {
    return _cachedAdWeights || [];
  }
}

async function scoreAdPost(post, env) {
  const text = post.text || '';
  let score = 0;
  const reasons = [];
  const tokens = tokenizePost(text);

  // لایه ۱: کلمات پایه
  for (let i = 0; i < tokens.words.length; i++) {
    const item = tokens.words[i];
    score += item.s;
    reasons.push(`${item.w} (+${item.s})`);
  }

  // لایه ۱.۵: کلمات، دامنه‌ها و شناسه‌های یادگرفته‌شده پویا از پایگاه‌داده (Self-Learning Dynamic Weights)
  if (env) {
    const dynamicWeights = await getDynamicAdWeights(env);
    if (dynamicWeights.length > 0) {
      const lower = text.toLowerCase();
      for (let i = 0; i < dynamicWeights.length; i++) {
        const item = dynamicWeights[i];
        let matched = false;
        if (item.type === 'word') {
          if (lower.includes(item.tok)) matched = true;
        } else if (item.type === 'link') {
          if (tokens.links.some(l => l.includes(item.tok))) matched = true;
        } else if (item.type === 'bot_id') {
          if (tokens.bots.some(b => b.includes(item.tok))) matched = true;
        } else if (lower.includes(item.tok)) {
          matched = true;
        }

        if (matched) {
          score += item.weight;
          reasons.push(`${item.token} (+${item.weight}) [یادگیری پویا]`);
        }
      }
    }
  }

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
        const newWeight = Math.min(60, 25 + Math.floor(newHits / 3) * 5); // سقف‌گذاری وزن توکن به حداکثر ۶۰ جهت جلوگیری از خطای مثبت کاذب
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
  const timeLabel = post.datetime ? `🕐 ${escapeHtml(post.datetime.replace('T', ' ').slice(0, 16))}` : '';

  // ─── سربرگ تمیز و پایدار پست ───
  let meta = `📡 <b>منبع:</b> <a href="${post.link}">@${escapeHtml(post.channel)}</a>  •  ${mediaLabel} ${mediaName(post.mediaType)}`;
  if (viewsLabel) meta += `  •  ${viewsLabel}`;
  if (timeLabel) meta += `  •  ${timeLabel}`;

  // ─── اطلاعات حالت منبع ───
  if (source.mode === 'viral' && ctx.viralInfo) {
    const v = ctx.viralInfo;
    if (v.viral_rules && v.viral_rules.length) {
      const rItems = v.viral_rules.map(r => `${r.emoji} ${r.count}/${r.threshold}`).join('  ');
      meta += `\n🔥 <b>واکنش‌ها:</b> ${rItems}`;
    } else if (v.total_count !== undefined) {
      meta += `\n🔥 <b>مجموع واکنش:</b> ${v.total_count}/${v.threshold}`;
    }
  } else if (source.mode === 'deep' && ctx.dispatchBreakdown) {
    const bd = ctx.dispatchBreakdown;
    const isScoring = bd.type === 'deep_scoring';
    if (isScoring) {
      meta += `\n📊 <b>امتیاز:</b> ${bd.score}/${bd.threshold}`;
    } else if (bd.type === 'deep_classic') {
      if (bd.positive_match?.length) meta += `\n✅ <b>کلیدواژه:</b> ${escapeHtml(bd.positive_match.join('، '))}`;
    }
  }

  // ─── نمایش ریپلای ───
  if (post.isReply) {
    const authorName = post.replyToAuthor ? escapeHtml(post.replyToAuthor) : 'پست قبلی';
    const replyUrl = post.replyToLink || post.link;
    meta += `\n↩️ <b>پاسخ به:</b> <a href="${replyUrl}">${authorName}</a>`;
  }

  // ─── کلیدواژه‌ها ───
  if (ctx.foundKeywords && ctx.foundKeywords.length && source.mode === 'deep') {
    const tags = ctx.foundKeywords.map(k => `#${escapeHtml(k.replace(/\s+/g, '_'))}`).join(' ');
    meta += `\n🏷 ${tags}`;
  }

  // ─── متن پست اصلی ───
  let body = '';
  if (post.text) {
    let t = post.text;
    if (t.length > 3500) {
      t = t.slice(0, 3500) + '\n…';
    }
    t = balanceHtmlTags(t);
    body = `\n\n${t}`;
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
  return deliverPost(post, source, ctx, env);
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

// ─── پاکسازی لاگ‌ها، انقضای خودکار قرنطینه و اعمال خودکار کلیدواژه‌های ۱۴ روزه ───
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
}

async function scanSource(source, env, forceAll = false) {
  const result = await scrapeChannel(source.channel, POSTS_PER_SCAN);
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
      dispatchResult = await evaluateViralWithGrowth(post, source, env);
      shouldSend = dispatchResult.match;
      dispatchBreakdown = {
        type: 'viral',
        viral_rules: dispatchResult.viral_rules,
        total_count: dispatchResult.total_count,
        views: dispatchResult.views,
        threshold: dispatchResult.threshold,
        failed_rule: dispatchResult.failed_rule,
        check_count: dispatchResult.check_count || 1,
        growth: dispatchResult.growth_details || null,
        status: dispatchResult.status,
      };
      viralInfo = dispatchResult;
      dispatchDetail = `Viral — ${dispatchResult.detail || dispatchResult.reason}`;
    } else {
      // forward
      dispatchDetail = 'Forward — همیشه ارسال';
      dispatchBreakdown = { type: 'forward' };
    }

    // ─── اگه Dispatch رد کرد → skip با breakdown کامل ───
    if (!shouldSend) {
      // در حالت وایرال، فقط زمانی که بررسی‌ها پایان یافته یا منقضی شده هش را ثبت می‌کنیم
      if (source.mode !== 'viral' || dispatchResult?.status === 'expired') {
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
  // ⚠️ بررسی وضعیت پذیرش و پیشنهاد هوش مصنوعی برای منبع
  if (source.ai_keywords_enabled === 0 || source.ai_keywords_enabled === false || source.ai_keywords_enabled === '0') {
    return { ok: false, error: 'پذیرش و پیشنهاد کلیدواژه هوش مصنوعی برای این منبع غیرفعال است (پرش شد).' };
  }

  const topic = source.topic || 'عمومی';

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
      await logAction(source.id, 'error', `AI: اسکرپ ناموفق: ${fallbackRes.error}`, env);
      return { ok: false, error: fallbackRes.error };
    }
    for (const p of fallbackRes.posts.slice(-AI_POSTS_COUNT)) {
      if (p.text) collectedPosts.push({ channel: source.channel, text: p.text.trim() });
    }
  }

  const posts = collectedPosts;
  const allText = collectedPosts.map(p => `[کانال @${p.channel.replace(/^@+/,'')}]:\n${p.text}`).join('\n---\n').slice(0, 5000);
  if (!allText) {
    await logAction(source.id, 'error', 'AI: متن کافی برای تحلیل نیست', env);
    return { ok: false, error: 'متن کافی نیست' };
  }

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

    // ── توزیع و ذخیره کلیدواژه‌ها متناسب با ساختار هر منبع در این موضوع ──
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
// ─── پاکسازی و فرمت‌بندی خروجی هوش مصنوعی برای گزارش روزانه ───
function formatAiDailyReport(rawText) {
  if (!rawText) return '';
  let s = rawText.trim();
  // حذف تگ‌های کد Markdown در صورت وجود
  s = s.replace(/```(?:html)?\n?/gi, '').replace(/```\n?/gi, '');
  // تبدیل هدرهای مارک‌داون به هدر بولد
  s = s.replace(/^#{1,6}\s*(.+)$/gm, '<b>$1</b>');
  // تبدیل بولت‌های خط تیره یا ستاره مارک‌داون به بولت دایره‌ای تمیز
  s = s.replace(/^[\*\-]\s+/gm, '• ');
  // تبدیل لینک‌های مارک‌داون [عنوان](لینک) به HTML معتبر تلگرام <a href="لینک">عنوان</a>
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2">$1</a>');
  // تبدیل **بولد** به <b>بولد</b>
  s = s.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
  // تبدیل *ایتالیک* به <i>ایتالیک</i>
  s = s.replace(/(^|[^\*])\*([^\*\n]+)\*([^\*]|$)/g, '$1<i>$2</i>$3');
  // حذف آیدی‌های دوبل مثل @@channel
  s = s.replace(/@@+/g, '@');
  // بالانس کردن تگ‌های HTML تلگرام
  return convertTelegramHtml(s);
}

// ─── استخراج متن تمیز پست جهت ارسال به AI (جلوگیری از نشت لاگ‌های سیستمی) ───
function getCleanPostForAI(p) {
  let raw = p.post_text || '';
  if (!raw && p.detail && !/^(?:ارسال شد|رد شد|Deep|Forward|Viral)/i.test(p.detail)) {
    raw = p.detail;
  }
  if (!raw || /^(?:ارسال شد|رد شد|Deep|Forward|Viral)/i.test(raw)) {
    raw = '';
  }
  raw = raw.replace(/<[^>]+>/g, ' ').replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, ' ').trim();
  return raw;
}

// ─── ارسال دسته‌ای گزارش برای جلوگیری از خطای سقف کاراکتر تلگرام (۴۰۹۶ کاراکتر) ───
async function sendChunkedReport(chatId, sections, footer, env) {
  let currentMsg = '';
  for (const sec of sections) {
    if (!sec || !sec.trim()) continue;

    // اگر یک بخش به تنهایی طولانی باشد، آن را ایمن تقسیم کن تا سقف تلگرام نقض نشود
    const subSections = [];
    if (sec.length > 3200) {
      const parts = sec.split(/\n(?=•|🔥|📌|━━━━━━━━━━━━━)/);
      let buf = '';
      for (const p of parts) {
        if (buf.length + p.length + 10 > 2800) {
          if (buf.trim()) subSections.push(buf.trim());
          buf = p;
        } else {
          buf += (buf ? '\n' : '') + p;
        }
      }
      if (buf.trim()) subSections.push(buf.trim());
    } else {
      subSections.push(sec);
    }

    for (const sub of subSections) {
      if (currentMsg.length + sub.length + 50 > 3400) {
        if (currentMsg.trim()) {
          await sendMsg(chatId, currentMsg.trim(), env, null, 'HTML');
          await sleep(400);
        }
        currentMsg = sub + '\n\n';
      } else {
        currentMsg += (currentMsg ? '\n' : '') + sub + '\n\n';
      }
    }
  }
  if (footer) currentMsg += footer;
  if (currentMsg.trim()) {
    await sendMsg(chatId, currentMsg.trim(), env, null, 'HTML');
  }
}

// ─── گزارش روزانه هوشمند ───
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

  const sections = [];
  let header = `📊 <b>گزارش روزانه هوشمند</b>\n🕐 ۲۴ ساعت گذشته\n`;
  header += `📈 مجموع ارسال: <b>${sentPosts.length} پست</b>`;
  sections.push(header);

  let aiProvider = null;
  const aiRawResponses = [];

  // ── پردازش هر موضوع به‌صورت مستقل ──
  for (const [topic, posts] of Object.entries(byTopic)) {
    let topicSection = `━━━━━━━━━━━━━\n`;
    topicSection += `📂 <b>موضوع: ${topic}</b> (${posts.length} پست)\n`;

    // گروه‌بندی بر اساس کانال در این موضوع با نام تمیز (بدون @@)
    const byChannel = {};
    for (const p of posts) {
      const ch = (p.channel || 'نامشخص').replace(/^@+/, '');
      if (!byChannel[ch]) byChannel[ch] = [];
      byChannel[ch].push(p);
    }

    const cleanChannels = Object.keys(byChannel);
    topicSection += `📡 منابع: ${cleanChannels.map(c => '@' + c).join('، ')}\n\n`;

    // انتخاب عادلانه پست‌ها از تمامی کانال‌های منبع این موضوع (تا سقف ۲۴ پست کل)
    const validAiPosts = [];
    const maxPerChannel = Math.max(4, Math.floor(24 / Math.max(1, cleanChannels.length)));
    for (const ch of cleanChannels) {
      const chPosts = byChannel[ch] || [];
      let count = 0;
      for (const p of chPosts) {
        if (count >= maxPerChannel) break;
        const cleanSnippet = getCleanPostForAI(p);
        if (cleanSnippet && cleanSnippet.length >= 10 && p.post_link) {
          validAiPosts.push({
            channel: ch,
            text: cleanSnippet.slice(0, 350),
            link: p.post_link,
          });
          count++;
        }
      }
    }

    if (isAIAvailable(env) && validAiPosts.length >= 1) {
      const postsText = validAiPosts.map((p, i) =>
        `پست ${i + 1} [@${p.channel}] لینک: ${p.link}\nمتن خبر: ${p.text}`
      ).join('\n---\n');

      const sampleLink = validAiPosts[0]?.link || 'https://t.me/channel/123';
      const sampleChannel = validAiPosts[0]?.channel || 'channel';

      const aiPrompt = `شما یک دستیار تحلیلی و خلاصه‌ساز ارشد اخبار برای تلگرام هستید.
از میان پست‌های ورودی زیر که همگی مربوط به موضوع «${topic}» هستند، یک گزارش روزانه بسیار جامع، شسته‌رفته و حرفه‌ای به زبان فارسی با ساختار دقیق زیر بنویسید.

قوانین حیاتی و الزامی:
۱. خروجی باید حتماً به دو بخش موضوعی تقسیم شود:
🔥 <b>اخبار مهم و رویدادهای اصلی</b>
(مهم‌ترین خبرها، تصمیمات، پیروزی‌ها و وقایع اصلی)

📌 <b>سایر گزارش‌ها و تحولات</b>
(سایر خبرها، حواشی، مصاحبه‌ها و گزارش‌های جانبی)

۲. فرمت هر بند خبری دقیقاً باید به صورت زیر باشد (خلاصه کامل + لینک تلگرام در پرانتز + کانال منبع):
• متن و خلاصه رسا، کامل و دقیق رویداد (${sampleLink}) - @${sampleChannel}
یا به صورت هایپرلینک:
• <a href="${sampleLink}">متن و خلاصه رسا و کامل رویداد</a> - @${sampleChannel}

۳. خلاصه هر خبر باید ۲ الی ۳ خط مفید و آموزنده باشد؛ به طوری که خواننده بدون نیاز به باز کردن لینک، اصل ماجرا و جزئیات کلیدی خبر را بفهمد.
۴. زبان ۱۰۰٪ فارسی شیوا، روان و رسمی باشد. از هیچ عنوان یا عبارت انگلیسی (مثل High/Medium Importance) استفاده نکنید.
۵. بین هر خبر یک خط فاصله خالی (اینتر) قرار دهید تا خوانایی در تلگرام بسیار زیبا و چشم‌نواز باشد.

نمونه فرمت مورد انتظار:
🔥 <b>اخبار مهم و رویدادهای اصلی</b>

• جنجال بزرگ مالی در فوتبال انگلیس؛ باشگاه منچسترسیتی در پرونده نقض قوانین مالی لیگ برتر در ۱۱۴ مورد مقصر شناخته شد (${sampleLink}) - @${sampleChannel}

• جود بلینگهام برای دومین سال متوالی به عنوان بهترین بازیکن سال فوتبال انگلستان انتخاب شد (${sampleLink}) - @${sampleChannel}

📌 <b>سایر گزارش‌ها و تحولات</b>

• صحنه پربازدید در مسابقات ورزشی که مورد توجه هواداران در شبکه‌های اجتماعی قرار گرفت (${sampleLink}) - @${sampleChannel}

پست‌های ورودی:
${postsText}`;

      try {
        const r = await runAIWithFallback(env, {
          messages: [{ role: 'user', content: aiPrompt }],
          max_tokens: 2800,
        });
        aiProvider = r.provider;
        aiRawResponses.push({ topic, raw: r.text });
        topicSection += formatAiDailyReport(r.text);
      } catch (e) {
        // فال‌بک شکیل با همان ساختار دوگانه اخبار اصلی و سایر رویدادها در صورت قطعی موقت هوش مصنوعی
        const topSlice = posts.slice(0, 4);
        const restSlice = posts.slice(4, 12);
        if (topSlice.length) {
          topicSection += `🔥 <b>اخبار مهم و رویدادهای اصلی</b>\n\n`;
          for (const p of topSlice) {
            const ch = (p.channel || '').replace(/^@+/, '');
            const snip = getCleanPostForAI(p) || 'مشاهده گزارش کامل در کانال';
            topicSection += `• ${escapeHtml(snip.slice(0, 160))} (<a href="${p.post_link}">${p.post_link}</a>) - @${ch}\n\n`;
          }
        }
        if (restSlice.length) {
          topicSection += `📌 <b>سایر گزارش‌ها و تحولات</b>\n\n`;
          for (const p of restSlice) {
            const ch = (p.channel || '').replace(/^@+/, '');
            const snip = getCleanPostForAI(p) || 'مشاهده گزارش کامل در کانال';
            topicSection += `• ${escapeHtml(snip.slice(0, 120))} (<a href="${p.post_link}">${p.post_link}</a>) - @${ch}\n\n`;
          }
        }
      }
    } else {
      // حالت بدون هوش مصنوعی یا بدون متن کافی: نمایش منظم با ساختار استاندارد
      const topSlice = posts.slice(0, 4);
      const restSlice = posts.slice(4, 12);
      if (topSlice.length) {
        topicSection += `🔥 <b>اخبار مهم و رویدادهای اصلی</b>\n\n`;
        for (const p of topSlice) {
          const ch = (p.channel || '').replace(/^@+/, '');
          const snip = getCleanPostForAI(p) || 'مشاهده گزارش کامل در کانال';
          topicSection += `• ${escapeHtml(snip.slice(0, 160))} (<a href="${p.post_link}">${p.post_link}</a>) - @${ch}\n\n`;
        }
      }
      if (restSlice.length) {
        topicSection += `📌 <b>سایر گزارش‌ها و تحولات</b>\n\n`;
        for (const p of restSlice) {
          const ch = (p.channel || '').replace(/^@+/, '');
          const snip = getCleanPostForAI(p) || 'مشاهده گزارش کامل در کانال';
          topicSection += `• ${escapeHtml(snip.slice(0, 120))} (<a href="${p.post_link}">${p.post_link}</a>) - @${ch}\n\n`;
        }
      }
    }

    sections.push(topicSection);
  }

  // ── بخش وایرال (مرتب بر اساس بازدید) ──
  if (viralPosts.length) {
    viralPosts.sort((a, b) => (b.views || 0) - (a.views || 0));
    let viralSection = `━━━━━━━━━━━━━\n`;
    viralSection += `🔥 <b>پست‌های برگزیده و وایرال</b> (${viralPosts.length} پست)\n\n`;
    for (const p of viralPosts.slice(0, 10)) {
      const chName = (p.channel || '').replace(/^@+/, '');
      const snip = getCleanPostForAI(p) || 'پست وایرال پربازدید';
      viralSection += `👁 ${formatViews(p.views || 0)} • @${chName} • <a href="${p.post_link}">${escapeHtml(snip.slice(0, 70))}</a>\n`;
    }
    sections.push(viralSection);
  }

  const footer = `━━━━━━━━━━━━━\n🤖 <i>تولیدشده توسط ${aiProvider || 'سیستم هوشمند'}</i>`;

  // ارسال ایمن و چندبخشی گزارش به ادمین
  await sendChunkedReport(adminId, sections, footer, env);

  // ثبت در لاگ سیستم
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
        ctx.waitUntil(updateAdminProfile(sId, fullName, uname, env));
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
        editsource: cmdEditSource,
        settarget: cmdSetTarget,
        delsource: cmdDelSource, removesource: cmdDelSource,
        scansingle: cmdScanSingle,
        listsources: cmdListSources, sources: cmdListSources,
        backup: cmdBackup, restore: cmdRestore,
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
      const channels = text.split(',').map(s => s.trim().replace(/^@+/, '')).filter(Boolean);
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
    'viral_check_thresholds': 'addsource',
    'viral_apply_suggested': 'addsource',
    'viral_edit_manual': 'addsource',
    'viral_back_to_picker': 'addsource',
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
      } else if (payload === 'ai_keywords') {
        const kb = { inline_keyboard: [
          [{ text: '🟢 روشن (پذیرش و پیشنهاد AI)', callback_data: 'edit_ai_kw:1' }],
          [{ text: '🔴 خاموش (پرش و عدم تغییر)', callback_data: 'edit_ai_kw:0' }],
          [{ text: '❌ لغو', callback_data: 'menu' }],
        ]};
        return editMsg(chatId, messageId, '🤖 <b>پذیرش و پیشنهاد کلیدواژه‌های هوش مصنوعی برای منبع:</b>\n\nآیا برای این منبع کلیدواژه پیشنهاد و اعمال شود یا پرش شود؟', env, kb, 'HTML');
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

    // ─── بررسی هوشمند آستانه ری‌اکشن (۲۰ پست روز قبل) ───
    case 'viral_check_thresholds': {
      let ch = state.channel;
      if (!ch && state.source_id) {
        const src = await env.DB.prepare('SELECT channel FROM sources WHERE id=?').bind(state.source_id).first();
        ch = src?.channel;
      }
      if (!ch) {
        await answerCb(query.id, '⚠️ ابتدا نام کانال را مشخص کنید', env, true);
        return;
      }
      const cleanCh = ch.replace(/^@/, '').trim();
      await answerCb(query.id, '⏳ در حال واکشی و تحلیل ۲۰ پست روز قبل...', env);
      await editMsg(chatId, messageId, `⏳ <b>در حال بررسی ۲۰ پست روز قبل کانال @${cleanCh}...</b>\n\n<blockquote>داده‌های روز گذشته در حال استخراج و تحلیل بدون هوش مصنوعی هستند...</blockquote>`, env, null, 'HTML');

      const pRes = await fetchPreviousDayPosts(cleanCh, 20);
      if (!pRes.ok || !pRes.posts.length) {
        let errText = `❌ <b>خطا در بررسی پست‌های کانال:</b>\n\n<blockquote>${escHtml(pRes.error || 'پستی برای تحلیل یافت نشد')}</blockquote>`;
        return editMsg(chatId, messageId, errText, env, reactionPickerKb(state), 'HTML');
      }

      // استخراج ری‌اکشن‌های انتخابی ادمین (یا پیش‌فرض‌های محبوب اگر هنوز انتخاب نکرده بود)
      const currentRules = state.viral_reactions || [];
      let emojisToCalc = currentRules.map(r => r.emoji);
      if (!emojisToCalc.length) emojisToCalc = ['🔥', '❤️', '👍'];

      const calc = computeViralThresholds(pRes.posts, emojisToCalc);
      const suggestedRules = calc.suggestions.map(s => ({ emoji: s.emoji, threshold: s.recommended }));

      // ذخیره موقت در state برای تأیید بعدی
      await setState(userId, {
        ...state,
        channel: cleanCh,
        pending_suggested_rules: suggestedRules,
        pending_suggested_total: calc.totalSuggestion,
      }, env);

      let msg = `📊 <b>بررسی هوشمند آستانه ری‌اکشن انجام شد</b>\n\n`;
      msg += `📡 کانال: <b>@${cleanCh}</b>\n`;
      msg += `📅 مبنا: <b>۲۰ پست آخر روز قبل</b> (${pRes.sampleDate})\n\n`;
      msg += `<blockquote>آستانه‌های پیشنهادی (بر اساس ۲۰٪ برتر و رفتار واقعی روز گذشته کانال):</blockquote>\n\n`;

      for (const s of calc.suggestions) {
        msg += `• ${s.emoji} پیشنهاد: <b>${s.recommended}</b> (میانگین: ${s.avg} | بیشترین: ${s.max})\n`;
      }
      msg += `\n⚡ پیشنهاد آستانه مجموع کل: <b>${calc.totalSuggestion}</b>\n\n`;
      msg += `آیا این مقادیر را به عنوان آستانه استفاده می‌کنید؟`;

      const kb = {
        inline_keyboard: [
          [{ text: '✅ ثبت این مقادیر', callback_data: 'viral_apply_suggested' }],
          [{ text: '✏️ ویرایش آستانه‌ها', callback_data: 'viral_edit_manual' }],
          [{ text: '🔙 بازگشت به لیست ری‌اکشن‌ها', callback_data: 'viral_back_to_picker' }],
        ],
      };
      return editMsg(chatId, messageId, msg, env, kb, 'HTML');
    }

    case 'viral_apply_suggested': {
      const rules = state.pending_suggested_rules || [];
      const total = state.pending_suggested_total || 100;
      await answerCb(query.id, '✅ مقادیر پیشنهادی تأیید شدند', env);

      if (state.step === 'edit_viral_reactions') {
        await setState(userId, { ...state, step: 'edit_confirm', viral_reactions: rules, viral_threshold: total }, env);
        return showEditConfirm(userId, { ...state, threadId }, env);
      }

      // در ویزارد افزودن منبع: مستقیماً منبع با این آستانه‌ها ثبت می‌شود
      const stateForFinalize = {
        ...state,
        viral_reactions: rules,
        viral_threshold: total,
        target_chat_id: String(chatId),
        target_topic_id: threadId || null,
        chatId: String(chatId),
      };
      await finalizeAddSource(userId, stateForFinalize, env);

      let msg = '✅ <b>آستانه‌های پیشنهادی با موفقیت ذخیره شدند:</b>\n\n';
      for (const r of rules) {
        msg += `  ${r.emoji} ≥ ${r.threshold}\n`;
      }
      msg += `\n⚡ مجموع ری‌اکشن‌ها: ≥ ${total}\n📍 مقصد: این چت\n🎯 منبع با پایش رشد ری‌اکشن فعال شد.`;
      return editMsg(chatId, messageId, msg, env, mainMenuKb(), 'HTML');
    }

    case 'viral_edit_manual':
    case 'viral_back_to_picker': {
      const currentRules = state.pending_suggested_rules || state.viral_reactions || [];
      await setState(userId, { ...state, viral_reactions: currentRules }, env);
      let msg = '👁 <b>تنظیم دستی آستانه‌های ری‌اکشن</b>\n\n';
      msg += 'روی هر ایموجی کلیک کنید تا آستانه آن را تغییر دهید یا حذف کنید:\n\n';
      for (const r of currentRules) {
        msg += `  ${r.emoji} ≥ ${r.threshold}\n`;
      }
      return editMsg(chatId, messageId, msg, env, reactionPickerKb({ viral_reactions: currentRules }), 'HTML');
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
    { text: '📊 بررسی آستانه ری‌اکشن (۲۰ پست روز قبل)', callback_data: 'viral_check_thresholds' },
  ]);
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
    [{ text: '🤖 پذیرش کلیدواژه AI', callback_data: 'edit_field:ai_keywords' }],
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
      case 'viral-suggest':
        if (method === 'POST') resp = await apiViralSuggest(request, env);
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
    ai_keywords_enabled: s.ai_keywords_enabled !== undefined && s.ai_keywords_enabled !== null ? Number(s.ai_keywords_enabled) : 1,
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
  const rawChannels = b.channels !== undefined ? b.channels : (b.channel || '');
  const channels = (Array.isArray(rawChannels) ? rawChannels : String(rawChannels).split(','))
    .map(s => String(s).trim().replace(/^@+/, '')).filter(Boolean);
  const ids = [];
  for (const ch of channels) {
    try {
      const res = await smartInsertSource(env, {
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
      if (res?.meta?.last_row_id) ids.push(res.meta.last_row_id);
    } catch (e) {
      return json({ error: e.message }, 500);
    }
  }
  return json({ ok: true, count: channels.length, id: ids[0] || null, ids });
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

  if (b.channel !== undefined) tryField('channel', String(b.channel).trim().replace(/^@+/, ''));
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
  if (b.ai_keywords_enabled !== undefined) tryField('ai_keywords_enabled', b.ai_keywords_enabled ? 1 : 0);
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
            every_mode, deep_scoring, deep_threshold,
            viral_threshold, viral_reactions,
            block_ads, ad_threshold,
            active, created_by, created_at
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
        ).bind(
          s.id, String(s.channel || '').trim().replace(/^@+/, ''), s.target_chat_id, s.target_topic_id, s.mode, s.topic || '',
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

// ─── API: پیشنهاد آستانه ری‌اکشن بر اساس ۲۰ پست روز قبل (بخش ۳ بهینه‌سازی) ───
async function apiViralSuggest(request, env) {
  try {
    const { channel, emojis } = await request.json();
    if (!channel) return json({ ok: false, error: 'کانال مشخص نشده است' }, 400);

    const postData = await fetchPreviousDayPosts(channel, 20);
    if (!postData.ok) {
      return json({ ok: false, error: postData.error || 'خطا در دریافت پست‌های روز قبل' }, 400);
    }

    const targetEmojis = Array.isArray(emojis) && emojis.length ? emojis : ['🔥', '❤️'];
    const calculated = computeViralThresholds(postData.posts, targetEmojis);

    return json({
      ok: true,
      channel: postData.channel,
      date_sample: postData.sampleDate,
      posts_analyzed: postData.posts.length,
      suggestions: calculated.suggestions,
      total_suggestion: calculated.totalSuggestion,
      total_avg: calculated.totalAvg,
      total_max: calculated.totalMax,
    });
  } catch (e) {
    return json({ ok: false, error: e.message }, 500);
  }
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
    _cachedAdWeights = null;
    return json({ ok: true, token: t, weight: w });
  } catch (e) { return json({ error: e.message }, 500); }
}

async function apiDeleteAdWeight(request, env) {
  const { token } = await request.json();
  if (!token) return json({ error: 'token الزامی است' }, 400);
  try {
    await env.DB.prepare('DELETE FROM ad_weights WHERE token=?').bind((token || '').toLowerCase().trim()).run();
    _cachedAdWeights = null;
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
