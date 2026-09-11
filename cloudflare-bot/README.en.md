# 🤖 Smart Telegram Content Aggregator & Curator (v4)
### Serverless Telegram Content Aggregator & Curator on Cloudflare Workers

A production-ready, serverless, ultra-fast, and cost-effective system to aggregate, filter, sanitize, and publish content from public Telegram channels to your destination channel or group — built on **Cloudflare Workers**.

---

## 🌟 Key Features

### 1. Smart Content Ingestion & Filtering
- **Public channel scraping** via `t.me/s/channel` without requiring Telegram user accounts or MTProto sessions.
- **Three independent operational modes per source:**
  - `forward`: Clean forward/repost without alteration.
  - `deep`: Advanced keyword evaluation (primary, secondary, complementary keywords) with threshold scoring.
  - `viral`: Engagement-based filtering based on view thresholds, views-per-hour velocity, and conditional reaction rules (`reactions_rules`).
- **Strict Deduplication:** Powered by SHA-256 content hashing stored in Cloudflare D1.

### 2. Intelligent Anti-Ad Engine & Quarantine
- **Ad Token Weight System (`ad_weights`):** Automatically evaluates advertising probabilities with auto-learning capabilities (`auto_learned`).
- **Quarantine Pipeline (`quarantine_config`):** Holds ambiguous posts for manual review or delayed automated release.

### 3. Dual AI Processing (Gemini 2.5 Flash + Workers AI)
- Keyword discovery, sentiment analysis, and smart tagging using **Google Gemini 2.5 Flash**.
- Transparent fallback to **Cloudflare Workers AI** if rate limits or network issues occur.
- Automated daily digest reports sent directly to your admin Telegram chat.

### 4. Modern, Responsive Web Admin Panel
- **Dark & Light Mode Support:** Toggle button in the header with local persistence and automatic system preference detection.
- **Mobile-First Optimizations:**
  - Smooth horizontal scrolling touch navigation bar.
  - Slide-up bottom sheets for modals and editors on mobile screens.
  - Touch-friendly 40px+ tap targets.
  - Font scaling formatted to prevent unwanted zoom on iOS Safari.
- **Full Source & Log Management:** Add, edit, test, pause sources, and inspect live log breakdowns.
- **Backup & Restore v4:** Full JSON export/import of sources, ad-weights, and quarantine settings.
- **Multi-Admin Hierarchy:** Primary admin and secondary admins with customizable granular permissions.

---

## 📂 Project Architecture

If you wish to deploy or export only the bot to your GitHub repository, the core files are located in `cloudflare-bot/`:

```text
cloudflare-bot/
├── worker.js              # Main Cloudflare Worker entry point (bot logic, cron, API)
├── wrangler.toml          # Wrangler configuration file
├── schema.sql             # Cloudflare D1 SQLite database schema (v4)
├── panel/
│   └── index.html         # Standalone web admin panel (Dark/Light mode & Mobile ready)
├── ARCHITECTURE.md        # Technical architecture and schema specification
├── DEPLOYMENT.md          # Step-by-step Cloudflare Dashboard manual deployment guide
├── README.fa.md           # Persian documentation
└── README.en.md           # English documentation
```

---

## 🚀 Deployment Methods

### Method 1: Deployment via Wrangler CLI (Recommended for Developers)

1. Clone the repository and navigate to the bot directory:
```bash
git clone https://github.com/your-username/telegram-aggregator-bot.git
cd telegram-aggregator-bot/cloudflare-bot
npm install
```

2. Provision Cloudflare D1 database and KV namespace:
```bash
wrangler d1 create aggregator
wrangler kv namespace create AGGREGATOR
```

3. Insert the outputted `database_id` and `id` values into `wrangler.toml`.

4. Execute database migrations:
```bash
wrangler d1 execute aggregator --file=./schema.sql
```

5. Store sensitive secrets:
```bash
wrangler secret put BOT_TOKEN
wrangler secret put PANEL_PASSWORD
wrangler secret put GEMINI_API_KEY
```

6. Deploy to Cloudflare:
```bash
wrangler deploy
```

---

### Method 2: Manual Cloudflare Dashboard Deployment (Zero-CLI)

You can deploy directly within your browser via the Cloudflare Dashboard:
1. Go to **Workers & Pages** in your Cloudflare dashboard and create a new Worker.
2. Under **Settings > Variables and Secrets**, set up your environment variables (`BOT_TOKEN`, `DESTINATION_CHANNEL`, `MAIN_ADMIN_ID`, `PANEL_PASSWORD`, `GEMINI_API_KEY`).
3. Under **D1 SQL Database**, create an `aggregator` database and execute the queries from `schema.sql` inside the SQL Console.
4. Under **KV**, create a namespace named `AGGREGATOR` and bind both D1 (`DB`) and KV (`KV`) to your Worker.
5. Copy the contents of `cloudflare-bot/worker.js` into the online quick-editor and click **Save and Deploy**.
*(For an exhaustive guide with troubleshooting, see `DEPLOYMENT.md`).*

---

## ⚙️ Environment Variables & Secrets

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `BOT_TOKEN` | Secret | Yes | Telegram Bot Token from @BotFather |
| `DESTINATION_CHANNEL` | Variable | Yes | Target Telegram channel or group username/ID |
| `MAIN_ADMIN_ID` | Variable | Yes | Numeric Telegram user ID of the primary administrator |
| `PANEL_PASSWORD` | Secret | Yes | Authentication password for the web admin panel |
| `GEMINI_API_KEY` | Secret | Optional | Google Gemini API key for AI analysis |
| `DB` | D1 Binding | Yes | Cloudflare D1 Database binding |
| `KV` | KV Binding | Yes | Cloudflare Workers KV binding |

---

## 📱 Telegram Commands

| Command | Function |
|---------|----------|
| `/start` | Show main navigation keyboard and status overview |
| `/addsource` | Add a new target channel with mode (`forward`, `deep`, `viral`) |
| `/listsources` | View and manage configured channel sources |
| `/scan` | Force an immediate scan of all sources |
| `/scansingle` | Interactively scan a specific channel |
| `/adblock` | Adjust ad-filter sensitivity and token weights |
| `/aianalyze` | Trigger AI to extract high-relevance keywords |
| `/report` | Generate an instant performance and analytics report |
| `/stats` | View 24-hour delivery and error statistics |
| `/backup` | Receive an encrypted JSON backup file |
| `/restore` | Upload a JSON backup file to restore configuration |

---

## 📄 License
Released under the **MIT License**. Free for personal and commercial usage.
