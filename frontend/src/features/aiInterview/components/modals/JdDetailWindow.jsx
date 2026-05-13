import { X } from "lucide-react";

export function JdDetailWindow({ selectedJd, onClose }) {
  const canOpenFile = Boolean(selectedJd?.downloadUrl);

  return (
    <section
      className="legacy-window"
      style={{ width: "min(100%, 920px)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Chi tiết JD"
      onClick={(event) => event.stopPropagation()}
    >
      <header className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Chi tiết JD</h3>
          <p className="mt-1 text-sm text-slate-600">
            {selectedJd?.title || "N/A"} • {selectedJd?.company || "N/A"}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-slate-200 bg-slate-100 p-2 text-slate-700"
          aria-label="Đóng cửa sổ"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="legacy-window-kv">
          <span>ID</span>
          <strong>{selectedJd?.id ?? "N/A"}</strong>
        </div>
        <div className="legacy-window-kv">
          <span>Ngày tạo</span>
          <strong>{selectedJd?.postedAt || "N/A"}</strong>
        </div>
        <div className="legacy-window-kv">
          <span>Tên file</span>
          <strong>{selectedJd?.fileName || selectedJd?.title || "N/A"}</strong>
        </div>
        <div className="legacy-window-kv">
          <span>Loại file</span>
          <strong>{selectedJd?.mimeType || "N/A"}</strong>
        </div>
      </div>

      {selectedJd?.summary ? (
        <div className="legacy-window-block mt-4">
          <strong className="legacy-window-block-title">Tóm tắt JD</strong>
          <p className="legacy-window-paragraph">{selectedJd.summary}</p>
        </div>
      ) : null}

      <div className="mt-5 flex items-center justify-end gap-2">
        {canOpenFile ? (
          <a
            href={selectedJd.downloadUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700"
          >
            Xem file JD
          </a>
        ) : null}
      </div>
    </section>
  );
}
