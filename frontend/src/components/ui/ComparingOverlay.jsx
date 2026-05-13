import React, { useState, useEffect } from "react";
import { Sparkles, FileSearch, BrainCircuit, Cpu, Zap, CheckCircle2 } from "lucide-react";

const steps = [
  { id: 1, label: "Trích xuất văn bản từ CV...", icon: FileSearch },
  { id: 2, label: "Phân tích yêu cầu từ JD...", icon: Cpu },
  { id: 3, label: "Tính toán độ tương quan ngữ nghĩa...", icon: BrainCircuit },
  { id: 4, label: "Đánh giá sự phù hợp về kỹ năng...", icon: Zap },
  { id: 5, label: "Tổng hợp kết quả cuối cùng...", icon: Sparkles },
];

export const ComparingOverlay = ({ isOpen }) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1500);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[500] flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-500">
      <div className="relative flex flex-col items-center max-w-lg w-full px-8 text-center">
        {/* Animated AI Core */}
        <div className="relative mb-12">
          <div className="absolute inset-0 bg-indigo-500/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="relative h-32 w-32 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-3xl shadow-2xl flex items-center justify-center animate-bounce duration-[2000ms]">
            <BrainCircuit className="h-16 w-16 text-white animate-pulse" />
            
            {/* Orbital Rings */}
            <div className="absolute inset-[-20px] border-2 border-dashed border-indigo-500/50 rounded-full animate-[spin_10s_linear_infinite]"></div>
            <div className="absolute inset-[-40px] border border-violet-500/30 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
          </div>
        </div>

        {/* Text Header */}
        <h2 className="text-3xl font-black text-white mb-4 tracking-tight">
          AI Đang Đối Chiếu Dữ Liệu
        </h2>
        <p className="text-slate-400 text-lg mb-12 leading-relaxed">
          Hệ thống đang sử dụng mô hình ngôn ngữ lớn để đánh giá độ phù hợp giữa hồ sơ và yêu cầu công việc.
        </p>

        {/* Progress Steps */}
        <div className="w-full space-y-4 bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-sm">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isActive = idx === currentStep;
            const isCompleted = idx < currentStep;

            return (
              <div 
                key={step.id} 
                className={`flex items-center gap-4 transition-all duration-500 ${isActive ? "scale-105" : "opacity-40"}`}
              >
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${isCompleted || isActive ? "bg-indigo-500 text-white" : "bg-slate-800 text-slate-500"}`}>
                  {isCompleted ? <CheckCircle2 className="h-6 w-6" /> : <Icon className={`h-5 w-5 ${isActive ? "animate-spin-slow" : ""}`} />}
                </div>
                <span className={`text-sm font-bold text-left ${isActive ? "text-indigo-400" : "text-slate-300"}`}>
                  {step.label}
                </span>
                {isActive && (
                  <div className="ml-auto flex gap-1">
                    <div className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
                    <div className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Scanning Line Animation */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50 animate-[scan_3s_ease-in-out_infinite]"></div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
};
