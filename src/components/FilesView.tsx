import React, { useState } from 'react';
import { Download, FileCode, Copy, Check, Eye, ExternalLink, ShieldCheck, Database, Layers, Sparkles } from 'lucide-react';
import { FileItem } from '../types';

interface FilesViewProps {
  onViewCode: (file: FileItem) => void;
}

const FILES_LIST: FileItem[] = [
  {
    id: 'worker',
    name: 'worker.js',
    path: 'cloudflare-bot/worker.js',
    size: '۳۹۶ کیلوبایت (تک‌فایلی مستقل و خودکفا)',
    badge: 'تک‌فایلی آماده کپی در ادیتور کلادفلر',
    description: 'کد هسته ربات تلگرام روی Cloudflare Workers به صورت کاملاً مستقل و Self-Contained. قالب HTML پنل و مینی‌اپ مستقیماً درون خود فایل امبد شده و نیازی به هیچ ماژول یا فایل مجزای دیگری در کلادفلر ندارد.',
    downloadUrl: '/files/worker.js'
  },
  {
    id: 'panel',
    name: 'panel/index.html',
    path: 'cloudflare-bot/panel/index.html',
    size: '۹۳ کیلوبایت (تک فایلی)',
    badge: 'پنل مدیریت تحت وب و تلگرام',
    description: 'پنل کاربری واکنش‌گرا هماهنگ با Telegram WebApp SDK. شامل نمایش نام و یوزرنیم ادمین‌ها کنار آیدی، تم تاریک و روشن هماهنگ با تلگرام، و دسترسی مستقیم بدون خروج از تلگرام.',
    downloadUrl: '/files/panel-index.html'
  },
  {
    id: 'migration',
    name: 'migration.sql',
    path: 'cloudflare-bot/migration.sql',
    size: '۴ کیلوبایت',
    badge: 'اسکریپت مایگریشن D1',
    description: 'کوئری‌های لازم برای به‌روزرسانی دیتابیس موجود به نسخه جدید بدون پاک شدن داده‌ها و منابع ذخیره شده قبلی.',
    downloadUrl: '/files/migration.sql'
  },
  {
    id: 'schema',
    name: 'schema.sql',
    path: 'cloudflare-bot/schema.sql',
    size: '۱۴.۵ کیلوبایت',
    badge: 'اسکیمای کامل اولیه',
    description: 'ساختار کامل دیتابیس D1 شامل تمام جداول sources، logs، admins، ad_weights، quarantine و ai_suggestions برای ساخت دیتابیس جدید از صفر.',
    downloadUrl: '/files/schema.sql'
  },
  {
    id: 'wrangler',
    name: 'wrangler.toml.example',
    path: 'cloudflare-bot/wrangler.toml.example',
    size: '۲.۶ کیلوبایت',
    badge: 'نمونه تنظیمات خط فرمان',
    description: 'نمونه فایل پیکربندی برای افرادی که تمایل دارند از ابزار خط فرمان Wrangler CLI برای دیپلوی یا بایندینگ‌ها استفاده کنند.',
    downloadUrl: '/files/wrangler.toml.example'
  }
];

export const FilesView: React.FC<FilesViewProps> = ({ onViewCode }) => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownloadFile = async (file: FileItem) => {
    setDownloadingId(file.id);
    try {
      const response = await fetch(file.downloadUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Use proper filename for download
      const filename = file.id === 'panel' ? 'index.html' : file.name.split('/').pop() || file.name;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      window.open(file.downloadUrl, '_blank');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            فایل‌های آماده برای استقرار در کلودفلر
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            می‌توانید هر فایل را به صورت تکی دانلود کرده یا مستقیماً محتوای متنی آن را مشاهده و کپی کنید.
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {FILES_LIST.map((file) => (
          <div
            key={file.id}
            className="border border-slate-200 hover:border-slate-300 rounded-xl bg-white p-5 shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                <FileCode className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-900 font-mono text-base" dir="ltr">
                    {file.name}
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                    {file.badge}
                  </span>
                  <span className="text-xs text-slate-500 font-mono" dir="ltr">
                    {file.size}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mt-1.5 leading-relaxed max-w-3xl">
                  {file.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
              <button
                onClick={() => onViewCode(file)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer shadow-2xs"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>مشاهده و کپی کد</span>
              </button>

              <button
                onClick={() => handleDownloadFile(file)}
                disabled={downloadingId === file.id}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{downloadingId === file.id ? 'در حال دریافت...' : 'دانلود فایل'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
