import React from "react";
import { Check, Zap, Crown, Star } from "lucide-react";
import { SectionCard, Button } from "../components/shared";

export function ServicePlansScreen() {
  const plans = [
    {
      id: "free",
      name: "Cơ bản",
      price: "Miễn phí",
      desc: "Phù hợp cho người mới bắt đầu tìm hiểu.",
      features: ["3 lượt phỏng vấn/tháng", "Phản hồi AI cơ bản", "Thư viện 50+ câu hỏi"],
      icon: Zap,
      color: "blue",
      current: true,
    },
    {
      id: "pro",
      name: "Chuyên nghiệp",
      price: "199.000đ/tháng",
      desc: "Tối ưu cho ứng viên đang tìm việc gấp.",
      features: ["Không giới hạn lượt/tháng", "AI phân tích sâu STAR", "Video mock-interview", "Ưu tiên hỗ trợ"],
      icon: Crown,
      color: "amber",
      recommended: true,
    },
    {
      id: "enterprise",
      name: "Tổ chức",
      price: "Liên hệ",
      desc: "Dành cho các trung tâm đào tạo và HR.",
      features: ["Tùy chỉnh ngân hàng câu hỏi", "Quản lý nhóm ứng viên", "API Integration", "White-labeling"],
      icon: Star,
      color: "indigo",
    },
  ];

  return (
    <div className="space-y-6">
      <header className="text-center max-w-2xl mx-auto py-8">
        <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--text)' }}>Nâng cấp trải nghiệm của bạn</h2>
        <p style={{ color: 'var(--text-soft)' }}>Mở khóa sức mạnh của AI để chuẩn bị tốt nhất cho buổi phỏng vấn thực tế.</p>
      </header>

      <div className="grid lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div 
            key={plan.id} 
            className={`relative flex flex-col rounded-3xl border ${
              plan.recommended ? "border-blue-600 shadow-xl scale-105" : ""
            } p-8 transition hover:border-blue-300`}
            style={{ backgroundColor: 'var(--card-bg)', borderColor: plan.recommended ? 'inherit' : 'var(--border)' }}
          >
            {plan.recommended && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                Khuyên dùng
              </span>
            )}
            
            <div className="mb-6">
              <div className={`w-12 h-12 rounded-2xl bg-${plan.color}-50 text-${plan.color}-600 flex items-center justify-center mb-4`}>
                <plan.icon size={24} />
              </div>
              <h3 className="text-xl font-bold" style={{ color: 'var(--text)' }}>{plan.name}</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-black" style={{ color: 'var(--text)' }}>{plan.price}</span>
              </div>
              <p className="mt-4 text-sm leading-relaxed" style={{ color: 'var(--text-soft)' }}>{plan.desc}</p>
            </div>

            <ul className="flex-1 space-y-4 mb-8">
              {plan.features.map(f => (
                <li key={f} className="flex items-start gap-3 text-sm" style={{ color: 'var(--text)' }}>
                  <Check size={16} className="text-blue-500 mt-0.5 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <Button 
              variant={plan.recommended ? "primary" : plan.current ? "ghost" : "secondary"} 
              className="w-full"
              disabled={plan.current}
            >
              {plan.current ? "Gói hiện tại" : "Nâng cấp ngay"}
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center p-8 border-t" style={{ borderColor: 'var(--border)' }}>
         <p className="text-sm" style={{ color: 'var(--text-soft)' }}>Bạn có câu hỏi? Liên hệ <a href="#" className="text-blue-600 font-bold">support@aiia.vn</a></p>
      </div>
    </div>
  );
}
