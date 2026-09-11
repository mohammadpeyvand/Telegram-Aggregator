import React, { useState } from 'react';
import { Copy, Check, Download, AlertCircle, Database, Sparkles, HelpCircle } from 'lucide-react';
import { MIGRATION_SQL } from '../data/migrationSql';

export const MigrationView: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(MIGRATION_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([MIGRATION_SQL], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'migration.sql';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Notice Card: Do you need migration? */}
      <div className="bg-gradient-to-l from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div className="space-y-2 text-sm text-slate-800">
            <h3 className="font-bold text-base text-amber-900">
              آیا پروژه شما به Migration نیاز دارد؟
            </h3>
            <div className="grid md:grid-cols-2 gap-4 pt-1">
              <div className="bg-white/80 border border-amber-200/80 rounded-lg p-3.5 space-y-1">
                <div className="font-semibold text-emerald-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  حالت اول: نصب اولیه (دیتابیس کاملاً جدید)
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  اگر تازه می‌خواهید دیتابیس D1 بسازید، نیازی به مایگریشن ندارید! کافی است فایل کامل <span className="font-mono font-medium text-slate-800">schema.sql</span> را در کنسول D1 اجرا کنید.
                </p>
              </div>

              <div className="bg-white/80 border border-amber-200/80 rounded-lg p-3.5 space-y-1">
                <div className="font-semibold text-blue-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  حالت دوم: دیتابیس از قبل دارید (آپدیت به نسخه ۴)
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong>بله، نیاز به مایگریشن دارید!</strong> برای اینکه داده‌ها و کانال‌های قبلی شما پاک نشوند و ویژگی‌های جدید (قوانین چند ری‌اکشن وایرال، امتیازدهی Deep، سیستم ضدتبلیغ پویا) اضافه شوند، کوئری‌های زیر را در تب Console دیتابیس D1 اجرا کنید.
                </p>
              </div>
            </div>
            <p className="text-xs text-amber-900/90 pt-1 font-medium">
              💡 <strong>نکته کمکی:</strong> در کد جدید <span className="font-mono">worker.js</span>، یک لایه خودکار (Auto-Migration) نیز تعبیه شده که در اولین اسکن، ستون‌های مفقود را خودش در دیتابیس D1 اضافه می‌کند. اما اجرای دستی اسکریپت زیر جداول تکمیلی (<span className="font-mono">quarantine</span> و <span className="font-mono">ad_weights</span>) را هم بلافاصله می‌سازد.
            </p>
          </div>
        </div>
      </div>

      {/* SQL Code Box */}
      <div className="border border-slate-200 rounded-xl bg-white shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-slate-600" />
            <span className="font-semibold text-sm text-slate-800">
              دستورات Migration برای Cloudflare D1 Console (migration.sql)
            </span>
            <span className="text-xs text-slate-500 font-mono bg-slate-200/70 px-2 py-0.5 rounded">
              ۷ مرحله تغییر ساختار
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer shadow-2xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">کپی شد!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>کپی تمام کوئری‌ها</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>دانلود migration.sql</span>
            </button>
          </div>
        </div>

        <div className="p-4 bg-slate-950 font-mono text-xs text-slate-100 overflow-x-auto max-h-[500px] leading-relaxed select-all" dir="ltr">
          <pre>{MIGRATION_SQL}</pre>
        </div>
      </div>

      {/* Instructions on how to run migration */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
        <h4 className="font-semibold text-sm text-slate-900 mb-3 flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">
            i
          </span>
          راهنمای سریع اجرای مایگریشن در پنل Cloudflare:
        </h4>
        <ol className="list-decimal list-inside text-sm text-slate-700 space-y-2 mr-2">
          <li>وارد داشبورد Cloudflare شوید و به مسیر <strong className="text-slate-900">Workers & Pages &gt; D1 SQL Database</strong> بروید.</li>
          <li>روی نام دیتابیس خود (مثلاً <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">aggregator</code>) کلیک کنید.</li>
          <li>به تب <strong className="text-slate-900">Console</strong> بروید.</li>
          <li>دستورات بالا را در کادر متنی کنسول قرار داده و دکمه <strong className="text-blue-600">Execute</strong> را فشار دهید.</li>
          <li>تمام ستون‌ها و جداول جدید با موفقیت به دیتابیس متصل خواهند شد و می‌توانید از پنل و ورکر بدون هیچ اختلالی استفاده کنید.</li>
        </ol>
      </div>
    </div>
  );
};
