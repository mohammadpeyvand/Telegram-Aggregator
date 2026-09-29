import React, { useState } from 'react';
import { Header } from './components/Header';
import { MigrationView } from './components/MigrationView';
import { FilesView } from './components/FilesView';
import { GuideView } from './components/GuideView';
import { FlowchartView } from './components/FlowchartView';
import { CodeModal } from './components/CodeModal';
import { ActiveTab, FileItem } from './types';
import { Database, FileCode, BookOpen, Sparkles, Download, Check, GitBranch } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('flowchart');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

  const handleDownloadAll = async () => {
    setIsDownloadingAll(true);
    try {
      const res = await fetch('/files/cloudflare-bot.zip');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'telegram-aggregator-cloudflare-bot.zip';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      window.open('/files/cloudflare-bot.zip', '_blank');
    } finally {
      setIsDownloadingAll(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans antialiased" dir="rtl">
      {/* Top Banner & Header */}
      <Header onDownloadAll={handleDownloadAll} isDownloading={isDownloadingAll} />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-4 pt-3 shadow-xs gap-2">
          <button
            onClick={() => setActiveTab('flowchart')}
            className={`flex items-center gap-2 py-3 px-4 font-semibold text-sm rounded-t-lg transition-all cursor-pointer border-b-2 -mb-px ${
              activeTab === 'flowchart'
                ? 'border-cyan-600 text-cyan-700 bg-cyan-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <GitBranch className="w-4 h-4 text-cyan-600" />
            <span>فلوچارت معماری نهایی (Flowchart)</span>
            <span className="px-1.5 py-0.2 rounded text-[11px] font-bold bg-cyan-100 text-cyan-800">
              ۵ فاز تعاملی
            </span>
          </button>

          <button
            onClick={() => setActiveTab('migration')}
            className={`flex items-center gap-2 py-3 px-4 font-semibold text-sm rounded-t-lg transition-all cursor-pointer border-b-2 -mb-px ${
              activeTab === 'migration'
                ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>کوئری‌های مایگریشن (Migration SQL)</span>
            <span className="px-1.5 py-0.2 rounded text-[11px] font-bold bg-amber-100 text-amber-800">
              مهم برای دیتابیس موجود
            </span>
          </button>

          <button
            onClick={() => setActiveTab('files')}
            className={`flex items-center gap-2 py-3 px-4 font-semibold text-sm rounded-t-lg transition-all cursor-pointer border-b-2 -mb-px ${
              activeTab === 'files'
                ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>فایل‌های پروژه (کدها و اسکریپت‌ها)</span>
            <span className="px-1.5 py-0.2 rounded text-[11px] font-bold bg-slate-200 text-slate-700">
              ۶ فایل
            </span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-2 py-3 px-4 font-semibold text-sm rounded-t-lg transition-all cursor-pointer border-b-2 -mb-px ${
              activeTab === 'guide'
                ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>راهنمای استقرار در داشبورد کلودفلر</span>
            <span className="px-1.5 py-0.2 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
              ۷ مرحله
            </span>
          </button>
        </div>

        {/* Tab Content Box */}
        <div className="bg-white rounded-b-xl border-x border-b border-slate-200 p-6 shadow-xs min-h-[500px]">
          {activeTab === 'flowchart' && <FlowchartView />}
          {activeTab === 'migration' && <MigrationView />}
          {activeTab === 'files' && <FilesView onViewCode={(file) => setSelectedFile(file)} />}
          {activeTab === 'guide' && <GuideView />}
        </div>

        {/* Summary Card Footer */}
        <div className="mt-8 bg-slate-900 text-slate-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="font-bold text-white text-base">
              فایل‌های پروژه در سیستم فایل نیز کپی شدند
            </h4>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              تمامی فایل‌ها علاوه بر دانلود از این پنل، در پوشه <code className="text-blue-300 font-mono">./cloudflare-bot/</code> موجود هستند و در درخت فایل‌های ادیتور سمت چپ نیز مستقیماً قابل دسترسی و بازبینی می‌باشند.
            </p>
          </div>

          <button
            onClick={handleDownloadAll}
            disabled={isDownloadingAll}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium text-sm transition-colors cursor-pointer shrink-0 shadow-xs disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isDownloadingAll ? 'در حال آماده‌سازی...' : 'دانلود کل بسته (ZIP)'}</span>
          </button>
        </div>
      </main>

      {/* Code Viewer Modal */}
      <CodeModal file={selectedFile} onClose={() => setSelectedFile(null)} />
    </div>
  );
}
