import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FileText, Award, ArrowLeft, Sparkles, AlertTriangle } from 'lucide-react';

export default function CVScreeningResultScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const { matchResult } = location.state || {};
  
  if (!matchResult) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Không tìm thấy dữ liệu phân tích</h2>
          <button onClick={() => navigate('/dashboard')} className="px-6 py-2 bg-indigo-600 text-white rounded-xl">Quay lại Dashboard</button>
        </div>
      </div>
    );
  }

  // Use the new schema fields
  const score = matchResult.overall_score ?? 0;
  const summary = matchResult.executive_summary ?? "";
  const skillGap = matchResult.skill_gap || {};
  const alignments = matchResult.deep_experience_alignment || [];
  const recommendations = matchResult.actionable_recommendations || [];

  const handleBack = () => navigate(-1);

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900 font-sans p-6 md:p-10">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <button onClick={handleBack} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 shadow-sm transition-all">
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </button>
          <div className="flex items-center gap-2 text-indigo-600 font-bold">
            <Award className="w-5 h-5" />
            <span className="uppercase tracking-widest text-xs">AI Deep Analysis</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-4 lg:sticky lg:top-10 space-y-6">
            <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden">
               <div className="relative z-10">
                  <h3 className="text-indigo-200 text-xs font-black uppercase tracking-widest mb-6">Độ phù hợp</h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-7xl font-black">{score}</span>
                    <span className="text-2xl font-bold text-indigo-300">%</span>
                  </div>
                  <div className="h-2 w-full bg-indigo-400/30 rounded-full mt-6 overflow-hidden">
                    <div className="h-full bg-white transition-all duration-1000" style={{ width: `${score}%` }}></div>
                  </div>
               </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-16 w-16 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400">
                  <FileText className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-xl font-black text-slate-900">{matchResult.candidate_name || "Ứng viên"}</h4>
                  <p className="text-sm text-slate-500 font-medium">{matchResult.candidate_title || "Chưa xác định"}</p>
                </div>
              </div>
              <div className="space-y-4 pt-4 border-t border-slate-100 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-black uppercase tracking-widest">Kinh nghiệm</span>
                  <span className="text-slate-900 font-bold">{matchResult.years_of_experience || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-black uppercase tracking-widest">Học vấn</span>
                  <span className="text-slate-900 font-bold">{matchResult.education || "N/A"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-10">
            <section className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-6 flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-indigo-500" /> Tóm tắt đánh giá
              </h2>
              <div className="text-slate-600 text-lg leading-[1.8] font-medium whitespace-pre-line">
                {summary}
              </div>
            </section>

            <section className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-8">Kỹ năng</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div>
                  <h4 className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-4">Phù hợp</h4>
                  <div className="flex flex-wrap gap-2">
                    {skillGap.matched_hard_skills?.map(s => <span key={s} className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-bold">{s}</span>)}
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-black text-rose-600 uppercase tracking-widest mb-4">Thiếu</h4>
                  <div className="flex flex-wrap gap-2">
                    {skillGap.missing_hard_skills?.map(s => <span key={s} className="px-3 py-1 bg-rose-50 text-rose-700 rounded-lg text-sm font-bold">{s}</span>)}
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Đối chiếu kinh nghiệm</h2>
              {alignments.map((item, i) => (
                <div key={i} className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Yêu cầu JD</span>
                      <p className="text-slate-900 font-bold leading-relaxed">{item.requirement}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Thực tế ứng viên</span>
                      <p className="text-slate-900 font-bold leading-relaxed">{item.candidate_reality}</p>
                    </div>
                  </div>
                  <div className={`p-4 rounded-xl border ${item.severity === 'High' ? 'bg-rose-50 border-rose-100' : 'bg-amber-50 border-amber-100'}`}>
                    <p className="text-sm font-bold text-slate-800">{item.hr_comment}</p>
                  </div>
                </div>
              ))}
            </section>

            <section className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-10">Kiến nghị</h2>
              <div className="space-y-10">
                {recommendations.map((rec, i) => (
                  <div key={i} className="relative pl-10 border-l-4 border-indigo-100">
                    <div className="absolute -left-[22px] top-0 h-10 w-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black">
                      {i + 1}
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-lg font-black text-slate-900">Vấn đề: {rec.issue}</h4>
                      <p className="text-slate-500 font-medium">{rec.solution}</p>
                      <div className="bg-slate-50 p-6 rounded-2xl border-l-4 border-indigo-600 text-slate-700 italic font-medium">
                        "{rec.cv_rewrite_example}"
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
