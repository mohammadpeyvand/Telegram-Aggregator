# 🤖 Telegram Content Aggregator Bot

A bot that reads public Telegram channels, filters new content, and forwards it to your destination. Completely free, serverless, built on Cloudflare Workers.

## ✨ Features

- **Smart scanning** of public channels via `t.me/s/`
- **Three filter modes**: forward, deep (keywords), viral (views)
- **Anti-ad system** — automatically detects and blocks ad posts
- **SHA-256 deduplication** — no post is sent twice
- **AI-powered** — keyword analysis with Gemini API (or Workers AI as fallback)
- **Daily report** with AI summary
- **Web admin panel** with charts and stats
- **Sub-admin system** with customizable permissions
- **Backup and restore** in one click

## 🚀 Installation

### Prerequisites
- Cloudflare account (free)
- Telegram bot (from [@BotFather](https://t.me/BotFather))
- Gemini API key (free from [Google AI Studio](https://aistudio.google.com/app/apikey))

### Steps

1. Rename `wrangler.toml.example` to `wrangler.toml` and fill in the values.

2. Create Cloudflare resources:
```bash
wrangler d1 create aggregator
wrangler kv namespace create AGGREGATOR
wrangler d1 execute aggregator --file=./schema.sql
```

3. Set secrets:
```bash
wrangler secret put BOT_TOKEN
wrangler secret put PANEL_PASSWORD
wrangler secret put GEMINI_API_KEY
```

4. Deploy:
```bash
wrangler deploy
```

5. Open `https://your-worker.workers.dev/setup-commands` in your browser to register commands in Telegram.

## 📋 Commands

| Command | Description |
|---------|-------------|
| `/start` | Start and show menu |
| `/addsource` | Add new source |
| `/listsources` | List sources |
| `/scansingle` | Scan one source |
| `/scan` | Scan all sources |
| `/adblock` | Manage anti-ad system |
| `/aianalyze` | AI keyword analysis |
| `/report` | Daily report |
| `/stats` | Overall stats |
| `/backup` | Download backup file |
| `/restore` | Restore from backup |
| `/help` | Help |

## 🌐 Admin Panel

After deployment, go to `https://your-worker.workers.dev/panel` and log in with your password.

## 🛠 Tech Stack

- **Cloudflare Workers** — runtime
- **D1** — SQLite database
- **Workers KV** — cache and sessions
- **Gemini API** — AI
- **Telegram Bot API** — bot

## 📄 License

MIT
