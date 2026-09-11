import React, { useState } from 'react';
import { CheckCircle2, Circle, Copy, Check, ExternalLink, ShieldCheck, Key, Clock, Database, Layers } from 'lucide-react';
import { DEPLOYMENT_STEPS, ENV_VARS } from '../data/deploymentGuide';

export const GuideView: React.FC = () => {
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const toggleStep = (stepNumber: number) => {
    setCompletedSteps(prev => ({
      ...prev,
      [stepNumber]: !prev[stepNumber]
    }));
  };

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Intro header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <h2 className="text-lg font-bold text-slate-900 mb-2">
          راهنمای گام‌به‌گام دیپلوی دستی در داشبورد کلودفلر (بدون نیاز به ترمینال)
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          برای استقرار ربات و پنل، مراحل زیر را به ترتیب در وب‌سایت <a href="https://dash.cloudflare.com" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-medium inline-flex items-center gap-0.5">Cloudflare Dashboard <ExternalLink className="w-3 h-3" /></a> انجام دهید. با لمس چک‌باکس هر مرحله می‌توانید پیشرفت خود را علامت‌گذاری کنید.
        </p>
      </div>

      {/* Steps List */}
      <div className="space-y-4">
        {DEPLOYMENT_STEPS.map((step) => {
          const isDone = !!completedSteps[step.stepNumber];

          return (
            <div
              key={step.id}
              className={`border rounded-xl transition-all ${
                isDone
                  ? 'border-emerald-200 bg-emerald-50/40 shadow-xs'
                  : 'border-slate-200 bg-white shadow-xs'
              }`}
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <button
                      onClick={() => toggleStep(step.stepNumber)}
                      className="mt-0.5 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                      title={isDone ? 'علامت‌گذاری به عنوان انجام نشده' : 'علامت‌گذاری به عنوان انجام شده'}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-600 fill-emerald-100" />
                      ) : (
                        <Circle className="w-6 h-6 text-slate-300 hover:text-slate-400" />
                      )}
                    </button>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          مرحله {step.stepNumber}
                        </span>
                        <h3 className={`font-bold text-base ${isDone ? 'text-emerald-950 line-through' : 'text-slate-900'}`}>
                          {step.title}
                        </h3>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                          {step.badge}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 mr-9 space-y-2.5">
                  <ul className="space-y-1.5 text-sm text-slate-700 list-disc list-inside">
                    {step.substeps.map((sub, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {sub}
                      </li>
                    ))}
                  </ul>

                  {step.codeBlock && (
                    <div className="mt-3 relative bg-slate-950 rounded-lg p-3 font-mono text-xs text-slate-100 flex items-center justify-between" dir="ltr">
                      <code className="overflow-x-auto select-all whitespace-pre-line">{step.codeBlock}</code>
                      <button
                        onClick={() => handleCopyText(step.codeBlock!, step.id)}
                        className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0 ml-2"
                        title="کپی متن"
                      >
                        {copiedKey === step.id ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Env Vars Reference Table */}
      <div className="border border-slate-200 rounded-xl bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Key className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-base text-slate-900">
            جدول متغیرهای محیطی برای تنظیم در Worker (Settings &gt; Variables and Secrets)
          </h3>
        </div>
        <p className="text-sm text-slate-600">
          در صفحه تنظیمات ورکر خود، این متغیرها را اضافه کنید. متغیرهای توکن و رمزعبور را به صورت <strong className="text-slate-800">Encrypt (Secret)</strong> ذخیره کنید.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 text-xs font-semibold">
                <th className="py-2.5 px-3">نام متغیر</th>
                <th className="py-2.5 px-3">نوع</th>
                <th className="py-2.5 px-3">الزامی؟</th>
                <th className="py-2.5 px-3">توضیحات</th>
                <th className="py-2.5 px-3">مثال</th>
                <th className="py-2.5 px-3 text-center">کپی نام</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ENV_VARS.map((v) => (
                <tr key={v.name} className="hover:bg-slate-50/80">
                  <td className="py-3 px-3 font-mono font-bold text-xs text-blue-700 select-all" dir="ltr">
                    {v.name}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                      v.type === 'Secret' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {v.type}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    {v.required ? (
                      <span className="text-xs font-semibold text-rose-600">بله (الزامی)</span>
                    ) : (
                      <span className="text-xs text-slate-500">اختیاری (برای AI)</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-700 text-xs leading-relaxed">
                    {v.desc}
                  </td>
                  <td className="py-3 px-3 font-mono text-xs text-slate-500" dir="ltr">
                    {v.example}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => handleCopyText(v.name, `var-${v.name}`)}
                      className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
                      title="کپی نام متغیر"
                    >
                      {copiedKey === `var-${v.name}` ? (
                        <Check className="w-4 h-4 text-emerald-600 inline" />
                      ) : (
                        <Copy className="w-4 h-4 inline" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
