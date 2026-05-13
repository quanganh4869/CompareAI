import React from "react";
import { AlertTriangle, X } from "lucide-react";

export const ConfirmDialog = ({ 
  isOpen, 
  title, 
  message, 
  confirmText = "Xác nhận", 
  cancelText = "Hủy", 
  onConfirm, 
  onCancel,
  tone = "danger" // danger, warning, info
}) => {
  if (!isOpen) return null;

  const toneClasses = {
    danger: "bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400",
    warning: "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
    info: "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400",
  };

  const btnClasses = {
    danger: "bg-rose-600 hover:bg-rose-700 shadow-rose-200 dark:shadow-none",
    warning: "bg-amber-600 hover:bg-amber-700 shadow-amber-200 dark:shadow-none",
    info: "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 dark:shadow-none",
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8">
          <div className="flex items-center justify-center mb-6">
            <div className={`p-4 rounded-2xl ${toneClasses[tone]}`}>
              <AlertTriangle className="h-8 w-8" />
            </div>
          </div>
          
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              {message}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-6 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-6 py-3.5 rounded-2xl text-white font-bold transition-all shadow-lg active:scale-95 ${btnClasses[tone]}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
