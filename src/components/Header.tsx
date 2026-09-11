import React from 'react';
import { Download, Bot, Database, Sparkles, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  onDownloadAll: () => void;
  isDownloading: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onDownloadAll, isDownloading }) => {
  return (
    <header className="border-b border-slate-200 bg-white shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-600 to-blue-500 flex items-center justify-center text-white shadow-md shrink-0">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  مرکز استقرار و دیپلوی Telegram Aggregator Bot
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  نسخه ۴ (تست‌شده و آماده دیپلوی)
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-1">
                فایل‌های آماده برای Cloudflare Workers + دیتابیس D1 + پنل Cloudflare Pages، به همراه اسکریپت مایگریشن خودکار
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onDownloadAll}
              disabled={isDownloading}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {isDownloading ? 'در حال آماده‌سازی فایل...' : 'دانلود پکیج کامل (ZIP)'}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
