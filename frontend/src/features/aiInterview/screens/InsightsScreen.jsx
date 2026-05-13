import React, { useMemo } from "react";
import { TrendingUp, Award, Zap, Target } from "lucide-react";
import { SectionCard, ProgressLine, MetricCard } from "../components/shared";

export function InsightsScreen() {
  const skills = [
    { label: "Tư duy mạch lạc", value: 89, color: "bg-blue-600" },
    { label: "Độ sâu đánh giá rủi ro", value: 83, color: "bg-indigo-600" },
    { label: "Giao tiếp kinh doanh", value: 92, color: "bg-violet-600" },
    { label: "Cân bằng quyết định", value: 86, color: "bg-sky-600" },
  ];

  const recommendations = [
    { title: "Tăng ví dụ định lượng", text: "Bổ sung ít nhất 2 số liệu thực tế cho mỗi câu trả lời kinh nghiệm.", icon: TrendingUp },
    { title: "Rèn cấu trúc STAR", text: "Sử dụng mô hình STAR để giữ câu trả lời trong khoảng 60-90 giây.", icon: Target },
    { title: "Kiểm soát rủi ro", text: "Ôn lại các framework xử lý rủi ro vận hành (COBIT/NIST).", icon: Zap },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Phân tích năng lực (Insights)</h2>
        <p className="text-sm" style={{ color: 'var(--text-soft)' }}>AI phân tích dữ liệu từ tất cả các phiên phỏng vấn để đưa ra lộ trình cải thiện.</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Điểm AI tổng hợp" value="88/100" delta="Top 12% benchmark" tone="good" />
        <MetricCard label="Năng lực nổi bật" value="Giao tiếp" delta="+11 điểm tháng này" tone="good" />
        <MetricCard label="Cần cải thiện" value="Độ sâu kỹ thuật" delta="Target +8% next month" tone="default" />
        <MetricCard label="Độ phù hợp JD" value="91%" delta="Ổn định qua 4 phiên" tone="good" />
      </section>

      <div className="grid lg:grid-cols-2 gap-6">
        <SectionCard title="Đánh giá chi tiết tiêu chí" subtitle="Phân tích gộp từ Feedback & Scoring">
          <div className="space-y-6 py-4">
             {skills.map(skill => (
               <div key={skill.label} className="space-y-2">
                  <div className="flex justify-between text-sm">
                     <span className="font-semibold" style={{ color: 'var(--text)' }}>{skill.label}</span>
                     <span className="font-bold text-blue-600">{skill.value}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full overflow-hidden" style={{ backgroundColor: 'var(--card-soft)' }}>
                     <div 
                       className={`h-full ${skill.color} transition-all duration-1000`} 
                       style={{ width: `${skill.value}%` }} 
                     />
                  </div>
               </div>
             ))}
          </div>
        </SectionCard>

        <SectionCard title="Khuyến nghị từ AI" subtitle="Kế hoạch cải thiện cá nhân hóa">
           <div className="space-y-4">
              {recommendations.map((item, idx) => (
                 <div key={idx} className="flex gap-4 p-4 rounded-2xl border transition" style={{ backgroundColor: 'var(--card-soft)', borderColor: 'var(--border)' }}>
                    <div className="w-10 h-10 rounded-xl shadow-sm flex items-center justify-center text-blue-600 shrink-0" style={{ backgroundColor: 'var(--card-bg)' }}>
                       <item.icon size={20} />
                    </div>
                    <div>
                       <h4 className="font-bold text-sm" style={{ color: 'var(--text)' }}>{item.title}</h4>
                       <p className="text-xs leading-relaxed mt-0.5" style={{ color: 'var(--text-soft)' }}>{item.text}</p>
                    </div>
                 </div>
              ))}
           </div>
        </SectionCard>
      </div>

       <div className="rounded-3xl border p-8" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3 mb-6">
             <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                <Award size={20} />
             </div>
             <div>
                <h3 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Thành tựu của bạn</h3>
                <p className="text-sm" style={{ color: 'var(--text-soft)' }}>Những cột mốc bạn đã đạt được trong quá trình luyện tập.</p>
             </div>
          </div>
         <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { label: "Kẻ hủy diệt phỏng vấn", desc: "Hoàn thành 10 phiên liên tiếp", date: "22/03/2026" },
              { label: "Bậc thầy giao tiếp", desc: "Đạt 95 điểm Communication", date: "18/03/2026" },
              { label: "Kiên trì bền bỉ", desc: "Luyện tập 7 ngày trong tuần", date: "15/03/2026" }
            ].map(badge => (
               <div key={badge.label} className="p-4 rounded-2xl border flex flex-col items-center text-center" style={{ borderColor: 'var(--border)' }}>
                  <div className="w-12 h-12 rounded-full mb-3 flex items-center justify-center" style={{ backgroundColor: 'var(--card-soft)', color: 'var(--text-soft)' }}>
                     <Award size={24} />
                  </div>
                  <h4 className="text-sm font-bold" style={{ color: 'var(--text)' }}>{badge.label}</h4>
                  <p className="text-[10px]" style={{ color: 'var(--text-soft)' }}>{badge.desc}</p>
                  <span className="text-[9px] mt-2" style={{ color: 'var(--text-soft)', opacity: 0.6 }}>{badge.date}</span>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
}
