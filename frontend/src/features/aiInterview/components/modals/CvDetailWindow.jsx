import { X, RefreshCcw } from "lucide-react";

function formatSize(sizeBytes) {
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) return "N/A";
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`;
  return `${(sizeBytes / (1024 * 1024)).toFixed(2)} MB`;
}

function renderList(values) {
  if (!Array.isArray(values) || !values.length) {
    return <span className="text-slate-500">N/A</span>;
  }
  return (
    <ul className="mt-0.5 list-disc space-y-0.5 pl-5 text-sm text-slate-700 dark:text-slate-300">
      {values.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export function CvDetailWindow({ selectedCv, onClose, onParse }) {
  const previewUrl =
    selectedCv?.cvPdf || selectedCv?.downloadUrl || selectedCv?.previewUrl || "";
  const parseStatus = selectedCv?.cvParseStatus || "idle";
  const parseData = selectedCv?.cvParseData;

  return (
    <section
      className="flex flex-col h-[85vh] max-h-[900px] w-full bg-white dark:bg-slate-900"
      role="dialog"
      aria-modal="true"
      aria-label="Chi tiết CV"
      onClick={(event) => event.stopPropagation()}
    >
      <header className="flex items-center justify-between gap-3 px-6 py-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Chi tiết CV</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-md">
            {selectedCv?.file_name || selectedCv?.name || "N/A"}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Đóng"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-2">
        {/* Left: Preview */}
        <section className="border-r border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Bản gốc PDF</h4>
          </div>
          <div className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden relative">
            {previewUrl ? (
              <iframe
                title="cv-preview"
                src={`${previewUrl}#zoom=page-fit&navpanes=0`}
                className="h-full w-full"
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center text-sm text-slate-400 italic">
                Xem trực tiếp PDF trên hệ thống.
              </div>
            )}
          </div>
        </section>

        {/* Right: Info */}
        <section className="p-0 flex flex-col overflow-hidden bg-white dark:bg-slate-900">
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
            <div>
              <h4 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-3">Thông tin file</h4>
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <span className="text-slate-500 dark:text-slate-400">ID:</span>
                <span className="font-semibold text-slate-900 dark:text-white">#{selectedCv?.id ?? "N/A"}</span>
                <span className="text-slate-500 dark:text-slate-400">Dung lượng:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{formatSize(selectedCv?.sizeBytes)}</span>
                <span className="text-slate-500 dark:text-slate-400">Loại file:</span>
                <span className="font-semibold text-slate-900 dark:text-white">PDF Document</span>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Dữ liệu phân tích AI</h4>
                {onParse && (
                  <button 
                    onClick={onParse}
                    disabled={parseStatus === "loading"}
                    className="text-xs font-bold text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 transition-colors disabled:opacity-50"
                  >
                    <RefreshCcw className={`h-3 w-3 ${parseStatus === "loading" ? "animate-spin" : ""}`} />
                    {parseStatus === "success" ? "Cập nhật dữ liệu" : "Trích xuất ngay"}
                  </button>
                )}
              </div>
              
              {parseStatus === "loading" ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3 text-slate-500 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                  <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm font-medium">AI đang đọc nội dung hồ sơ...</span>
                </div>
              ) : null}

              {parseStatus === "error" ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-900/10 p-3 text-sm text-rose-700 dark:text-rose-400">
                  {selectedCv?.cvParseError || "Không thể đọc dữ liệu CV."}
                </div>
              ) : null}

              {parseStatus === "success" && parseData ? (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Số trang</p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">{parseData.page_count ?? "1"}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Ký tự</p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">{parseData.character_count ?? "N/A"}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                      Tóm tắt hồ sơ
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed italic bg-indigo-50/30 dark:bg-indigo-500/5 p-3 rounded-xl border border-indigo-100/50 dark:border-indigo-500/10">
                      "{parseData.profile_summary || "N/A"}"
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white mb-2">Email</p>
                      {renderList(parseData.contacts?.emails)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white mb-2">Điện thoại</p>
                      {renderList(parseData.contacts?.phones)}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white mb-2">Điểm nhấn (Highlights)</p>
                    {renderList(parseData.highlights)}
                  </div>

                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white mb-2">Trích xuất văn bản</p>
                    <pre className="max-h-[180px] overflow-auto whitespace-pre-wrap rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 text-[11px] text-slate-600 dark:text-slate-400 custom-scrollbar">
                      {parseData.extracted_text || "N/A"}
                    </pre>
                  </div>
                </div>
              ) : null}

              {parseStatus === "idle" ? (
                <p className="text-sm text-slate-500 italic py-4">Chưa có dữ liệu phân tích.</p>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
