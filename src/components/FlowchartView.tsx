import React, { useState } from 'react';
import { GitBranch, ExternalLink, Download, Sparkles, Layers, ShieldCheck, Cpu, Send, RefreshCw } from 'lucide-react';

export const FlowchartView: React.FC = () => {
  const [iframeKey, setIframeKey] = useState(0);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = '/files/flowchart.html';
    a.download = 'telegram-bot-architecture-flowchart.html';
    a.click();
  };

  const handleOpenFullscreen = () => {
    window.open('/files/flowchart.html', '_blank');
  };

  const PHASES = [
    {
      num: '۱',
      title: 'درگاه‌های ورودی و آغازگرها (Entry Points & Triggers)',
      color: 'bg-blue-600',
      border: 'border-blue-200',
      icon: <Layers className="w-5 h-5 text-blue-600" />,
      desc: 'اجرای زمان‌بندی‌شده Cron (اسکن دوره‌ای کانال‌ها)، وب‌هوک تلگرام (دریافت دستورات ادمین و دکمه‌ها)، و REST API پنل مدیریت با نشست کوکی امن.'
    },
    {
      num: '۲',
      title: 'خط لوله اسکرپ و آماده‌سازی محتوا (Ingestion & Pre-processing)',
      color: 'bg-cyan-600',
      border: 'border-cyan-200',
      icon: <RefreshCw className="w-5 h-5 text-cyan-600" />,
      desc: 'اسکرپ امن صفحات وب عمومی کانال‌ها، استخراج ساختاریافته متن، مدیا، آمار بازدید و انواع ری‌اکشن‌ها همراه با کش ضدتکرار در KV و D1.'
    },
    {
      num: '۳',
      title: 'موتور تطبیق و رهگیری رشد وایرال (Dispatch & Viral Tracking)',
      color: 'bg-purple-600',
      border: 'border-purple-200',
      icon: <Sparkles className="w-5 h-5 text-purple-600" />,
      desc: 'تشخیص حالت‌های Forward، Deep Classic، Deep Scoring، و موتور هوشمند Viral مبتنی بر رشد واقعی در بررسی‌های متوالی و پنجره زمانی محدود.'
    },
    {
      num: '۴',
      title: 'سیستم ۴ لایه‌ای ضد تبلیغات و قرنطینه (Anti-Ad & Quarantine)',
      color: 'bg-amber-600',
      border: 'border-amber-200',
      icon: <ShieldCheck className="w-5 h-5 text-amber-600" />,
      desc: 'امتیازدهی چندلایه متنی، کلمات پویا و دامنه‌ها در D1، مسدودسازی مستقیم تبلیغات قطعی و هدایت پست‌های مشکوک به صف قرنطینه با دکمه‌های مدیریتی.'
    },
    {
      num: '۵',
      title: 'ارسال، هوش مصنوعی و گزارش‌دهی هوشمند ۲۴h (Delivery & Intelligence)',
      color: 'bg-emerald-600',
      border: 'border-emerald-200',
      icon: <Send className="w-5 h-5 text-emerald-600" />,
      desc: 'ارسال با پشتیبانی از تاپیک‌ها، موتور فال‌بک دوگانه هوش مصنوعی (Gemini + Workers AI)، گزارش تفکیکی روزانه با عنوان‌های لینک‌شده به پست منبع و چرخه یادگیری وزن‌ها.'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-2xl text-white shadow-md">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
              <GitBranch className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold">فلوچارت تعاملی معماری نهایی ربات</h2>
          </div>
          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
            نمودار جامع و مرحله‌به‌مرحله جریان داده، منطق تصمیم‌گیری ورکر، جدول‌های دیتابیس D1، و نحوه تعامل ربات تلگرام و پنل وب به صورت کاملاً تعاملی.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={() => setIframeKey(k => k + 1)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors cursor-pointer"
            title="بارگذاری مجدد نمایشگر"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>تازه‌سازی</span>
          </button>

          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>دانلود HTML</span>
          </button>

          <button
            onClick={handleOpenFullscreen}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-xs transition-all cursor-pointer shadow-sm shadow-cyan-500/30"
          >
            <ExternalLink className="w-4 h-4" />
            <span>مشاهده تمام صفحه فلوچارت</span>
          </button>
        </div>
      </div>

      {/* 5 Architecture Phases Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {PHASES.map((p, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-xl border ${p.border} bg-white shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between`}
          >
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span className={`w-6 h-6 rounded-md ${p.color} text-white font-bold text-xs flex items-center justify-center shrink-0`}>
                  {p.num}
                </span>
                <span className="font-semibold text-xs text-slate-800 line-clamp-1">{p.title}</span>
              </div>
              <p className="text-[12px] text-slate-600 leading-relaxed">{p.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Embedded Interactive Flowchart Frame */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-950 shadow-sm">
        <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            <span className="font-mono text-slate-300 mr-2 text-[11px]">/flowchart.html (Interactive Architecture Canvas)</span>
          </div>
          <span className="text-[11px] text-cyan-400 font-medium">💡 با کلیک روی هر گام، قطعه‌کد و وظایف آن باز می‌شود</span>
        </div>

        <iframe
          key={iframeKey}
          src="/files/flowchart.html"
          title="فلوچارت معماری نهایی ربات"
          className="w-full h-[750px] border-0"
        />
      </div>
    </div>
  );
};
