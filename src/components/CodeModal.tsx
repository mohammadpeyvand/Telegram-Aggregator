import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Download, Loader2 } from 'lucide-react';
import { FileItem } from '../types';

interface CodeModalProps {
  file: FileItem | null;
  onClose: () => void;
}

export const CodeModal: React.FC<CodeModalProps> = ({ file, onClose }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (!file) return;
    setLoading(true);
    fetch(file.downloadUrl)
      .then((res) => res.text())
      .then((text) => {
        setContent(text);
        setLoading(false);
      })
      .catch((err) => {
        setContent(`خطا در بارگذاری محتوا: ${err.message}`);
        setLoading(false);
      });
  }, [file]);

  if (!file) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const filename = file.id === 'panel' ? 'index.html' : file.name.split('/').pop() || file.name;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-mono font-bold text-slate-900 text-base" dir="ltr">
                {file.name}
              </h3>
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                {file.badge}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              اندازه: {file.size}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">کپی شد!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>کپی تمام کد</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>دانلود فایل</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 p-4 bg-slate-950 overflow-auto font-mono text-xs text-slate-200" dir="ltr">
          {loading ? (
            <div className="h-full flex items-center justify-center gap-2 text-slate-400" dir="rtl">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              <span>در حال بارگذاری فایل...</span>
            </div>
          ) : (
            <pre className="whitespace-pre overflow-x-auto select-all leading-relaxed font-mono">
              {content}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};
