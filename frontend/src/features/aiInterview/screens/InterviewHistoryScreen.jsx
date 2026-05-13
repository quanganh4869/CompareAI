import React, { useMemo, useState, useEffect } from "react";
import { Search, History, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { SectionCard, Pill } from "../components/shared";
import { HISTORY_DATA } from "../data/mockData";

export function InterviewHistoryScreen() {
  const PAGE_SIZE = 8;
  const [query, setQuery] = useState("");
  const [modeFilter, setModeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedReport, setSelectedReport] = useState(null);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return HISTORY_DATA.filter((row) => {
      const matchesQuery = !q || `${row.id} ${row.role}`.toLowerCase().includes(q);
      const matchesMode = modeFilter === "all" || row.type === modeFilter;
      return matchesQuery && matchesMode;
    });
  }, [query, modeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const pageRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Lịch sử phỏng vấn</h2>
        <p className="text-sm" style={{ color: 'var(--text-soft)' }}>Xem lại các phiên luyện tập và kết quả đánh giá chi tiết.</p>
      </header>

      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5" size={18} style={{ color: 'var(--text-soft)' }} />
          <input 
            type="text" 
            placeholder="Tìm kiếm vị trí hoặc mã phiên..." 
            className="w-full rounded-xl border pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
           <select 
             className="px-4 py-2 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-blue-500"
             style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
             value={modeFilter}
             onChange={e => setModeFilter(e.target.value)}
           >
              <option value="all">Tất cả chế độ</option>
              <option value="behavioral">Hành vi</option>
              <option value="technical">Kỹ thuật</option>
              <option value="case">Tình huống</option>
           </select>
        </div>
      </section>

      <SectionCard title="Danh sách lịch sử">
        <div className="saas-table-wrap">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-4 px-4 font-semibold uppercase tracking-wider text-[10px]">Ngày & Mã</th>
                <th className="py-4 px-4 font-semibold uppercase tracking-wider text-[10px]">Vị trí</th>
                <th className="py-4 px-4 font-semibold uppercase tracking-wider text-[10px]">Chế độ</th>
                <th className="py-4 px-4 font-semibold uppercase tracking-wider text-[10px]">Điểm AI</th>
                <th className="py-4 px-4 font-semibold uppercase tracking-wider text-[10px]">Kết quả</th>
                <th className="py-4 px-4 font-semibold uppercase tracking-wider text-[10px] text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pageRows.map((row) => (
                <tr key={row.id} className="transition" style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="py-4 px-4">
                    <div className="font-bold" style={{ color: 'var(--text)' }}>{row.id}</div>
                    <div className="text-[10px]" style={{ color: 'var(--text-soft)' }}>{row.date}</div>
                  </td>
                  <td className="py-4 px-4 font-medium" style={{ color: 'var(--text)' }}>{row.role}</td>
                  <td className="py-4 px-4">
                    <Pill tone="default">{row.type === 'behavioral' ? 'Hành vi' : row.type === 'technical' ? 'Kỹ thuật' : 'Tình huống'}</Pill>
                  </td>
                  <td className="py-4 px-4 font-bold text-blue-600">{row.score}/100</td>
                  <td className="py-4 px-4" style={{ color: 'var(--text-soft)' }}>{row.verdict}</td>
                  <td className="py-4 px-4 text-right">
                    <button 
                      onClick={() => setSelectedReport(row)}
                      className="text-blue-600 font-bold hover:underline"
                    >
                      Chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-4">
           <p className="text-xs text-slate-500">
             Hiển thị {(page-1)*PAGE_SIZE + 1} - {Math.min(page*PAGE_SIZE, filteredRows.length)} của {filteredRows.length} phiên
           </p>
           <div className="flex gap-2">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white"
              >
                 <ChevronLeft size={16} />
              </button>
              <button 
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white"
              >
                 <ChevronRight size={16} />
              </button>
           </div>
        </div>
      </SectionCard>

      {/* Report Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
           <div className="rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200" style={{ backgroundColor: 'var(--card-bg)' }}>
              <header className="flex justify-between items-start mb-8">
                 <div>
                    <h3 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Báo cáo chi tiết {selectedReport.id}</h3>
                    <p style={{ color: 'var(--text-soft)' }}>Phiên {selectedReport.type} cho vị trí {selectedReport.role}</p>
                 </div>
                 <button onClick={() => setSelectedReport(null)} className="p-2 hover:bg-slate-100 rounded-full">
                    <History size={20} style={{ color: 'var(--text-soft)' }} />
                 </button>
              </header>

              <div className="grid md:grid-cols-3 gap-8">
                 <aside className="space-y-6">
                    <div className="p-6 rounded-2xl bg-blue-50 text-center">
                       <div className="text-4xl font-bold text-blue-600 mb-1">{selectedReport.score}</div>
                       <div className="text-xs font-bold text-blue-800 uppercase tracking-widest">Điểm AI</div>
                    </div>
                    <div className="space-y-4">
                       <h4 className="font-bold text-sm">Thông tin phiên</h4>
                       <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                             <span className="text-slate-500">Ngày thực hiện:</span>
                             <span className="font-medium">{selectedReport.date}</span>
                          </div>
                          <div className="flex justify-between">
                             <span className="text-slate-500">Chế độ:</span>
                             <span style={{ color: 'var(--text-soft)' }}>Ngày thực hiện:</span>
                             <span className="font-medium" style={{ color: 'var(--text)' }}>{selectedReport.date}</span>
                          </div>
                          <div className="flex justify-between">
                             <span style={{ color: 'var(--text-soft)' }}>Chế độ:</span>
                             <span className="font-medium italic" style={{ color: 'var(--text)' }}>{selectedReport.mode}</span>
                          </div>
                       </div>
                    </div>
                 </aside>

                 <main className="md:col-span-2 space-y-8">
                    <div className="space-y-4">
                       <h4 className="flex items-center gap-2 font-bold" style={{ color: 'var(--text)' }}>
                          <FileText size={18} className="text-blue-500" />
                          Kết luận của AI
                       </h4>
                       <p className="text-sm leading-relaxed p-4 rounded-xl border" style={{ color: 'var(--text)', backgroundColor: 'var(--card-soft)', borderColor: 'var(--border)' }}>
                          {selectedReport.verdict}. Buổi phỏng vấn cho thấy bạn có khả năng trình bày tốt, tư duy logic vững vàng nhưng cần chú ý hơn vào việc đưa ra các ví dụ định lượng thực tế.
                       </p>
                    </div>

                    <div className="space-y-4">
                       <h4 className="font-bold" style={{ color: 'var(--text)' }}>Khuyến nghị cải thiện</h4>
                       <ul className="space-y-3">
                          {[
                            "Tập trung sâu hơn vào cấu trúc trả lời STAR.",
                            "Bổ sung ví dụ về số liệu KPI/Impact cụ thể.",
                            "Tối ưu độ trễ trong phản xạ trả lời (cần dưới 3s)."
                          ].map((item, idx) => (
                             <li key={idx} className="flex gap-3 text-sm" style={{ color: 'var(--text)' }}>
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                                   {idx + 1}
                                </span>
                                {item}
                             </li>
                          ))}
                       </ul>
                    </div>
                 </main>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
