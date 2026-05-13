import { useEffect, useMemo, useRef, useState } from "react";
import { BriefcaseBusiness, Paperclip, Plus, Search, Upload, X } from "lucide-react";
import { Button } from "../shared";
import { dispatchNotice } from "../../../../utils/notice";

function normalizeAttachments(selectedJd) {
  const raw = selectedJd?.attachments;
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((item, index) => {
      if (!item) {
        return null;
      }
      if (typeof item === "string") {
        return { name: item, type: "", size: 0, index };
      }
      const name = item.name || `attachment-${index + 1}`;
      return {
        name,
        type: item.type || "",
        size: Number.isFinite(item.size) ? item.size : 0,
        index,
      };
    })
    .filter(Boolean);
}

export function JdHistoryWindow({
  jobs,
  selectedJdId,
  onSelectJd,
  selectedJd,
  jdFormTitle,
  setJdFormTitle,
  jdFormCompany,
  setJdFormCompany,
  jdFormSummary,
  setJdFormSummary,
  openAddFormNonce = 0,
  onSubmitJd,
  onUseJd,
  onClose,
}) {
  const [query, setQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [attachmentFiles, setAttachmentFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const fileInputRef = useRef(null);
  const normalizedAttachments = useMemo(() => normalizeAttachments(selectedJd), [selectedJd]);

  useEffect(() => {
    if (openAddFormNonce > 0) {
      setShowAddForm(true);
    }
  }, [openAddFormNonce]);

  const filteredJobs = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return jobs;
    }
    return jobs.filter((job) => {
      const haystack = `${job.title ?? ""} ${job.company ?? ""} ${job.id ?? ""}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [jobs, query]);

  const handleAttachmentChange = (event) => {
    const files = Array.from(event.target.files || []).filter(Boolean);
    setAttachmentFiles(files.slice(0, 8));
    const selected = files.slice(0, 8).map((file) => ({
      name: file.name,
      type: file.type || "",
      size: file.size || 0,
      lastModified: file.lastModified || 0,
    }));
    setAttachments(selected);
    setSubmitError("");
  };

  const handleSubmit = async (event) => {
    if (!onSubmitJd) {
      event.preventDefault();
      setSubmitError("Bạn cần quyền HR để tạo JD.");
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    try {
      const ok = await onSubmitJd(event, { attachments, file: attachmentFiles[0] });
      if (ok === false) {
        return;
      }
      setShowAddForm(false);
      setAttachments([]);
      setAttachmentFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Không thể lưu JD. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      className="legacy-window legacy-window--wide"
      role="dialog"
      aria-modal="true"
      aria-label="Lịch sử JD"
      onClick={(event) => event.stopPropagation()}
    >
      <header className="legacy-window-head">
        <div className="legacy-window-title-row">
          <span className="legacy-window-icon">
            <BriefcaseBusiness className="h-4 w-4" />
          </span>
          <div>
            <h3>Lịch sử JD</h3>
            <p>{jobs.length ? `${jobs.length} JD tự luyện đã lưu` : "Chưa có JD tự luyện nào."}</p>
          </div>
        </div>

        <div className="legacy-window-actions">
          <Button
            variant="ghost"
            onClick={() => {
              if (!onSubmitJd) {
                dispatchNotice({
                  tone: "info",
                  title: "JD",
                  message: "Chỉ tài khoản HR mới có thể tạo/tải JD.",
                });
                return;
              }
              setShowAddForm((previous) => !previous);
            }}
            className="legacy-window-action legacy-window-icon-action"
            aria-label="Thêm JD"
            dataTip="Thêm JD"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <button type="button" className="legacy-window-close" onClick={onClose} aria-label="Đóng cửa sổ">
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="legacy-window-toolbar">
        <label className="legacy-window-search">
          <Search className="h-4 w-4" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm theo vị trí, công ty, mã JD..."
          />
        </label>
        <span className="legacy-window-chip">{filteredJobs.length}/{jobs.length} mục</span>
      </div>

      {showAddForm ? (
        <form className="legacy-window-form" onSubmit={handleSubmit}>
          <div className="legacy-window-form-grid">
            <label>
              Tên vị trí JD
              <input
                value={jdFormTitle}
                onChange={(event) => setJdFormTitle(event.target.value)}
                placeholder="IT Governance Manager"
              />
            </label>
            <label>
              Công ty
              <input
                value={jdFormCompany}
                onChange={(event) => setJdFormCompany(event.target.value)}
                placeholder="Doanh nghiệp mục tiêu"
              />
            </label>
          </div>
          <label className="legacy-window-form-full">
            Mô tả ngắn JD
            <textarea
              rows={3}
              value={jdFormSummary}
              onChange={(event) => setJdFormSummary(event.target.value)}
              placeholder="Mô tả ngắn để AI hiểu ngữ cảnh công việc."
            />
          </label>
          <label className="legacy-window-form-full">
            Tải file JD (PDF/DOCX)
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              multiple
              onChange={handleAttachmentChange}
            />
            <div className="legacy-file-row" aria-live="polite">
              <span className="legacy-file-pill">
                <Upload className="h-4 w-4" />
                {attachments.length ? `Đã chọn ${attachments.length} file` : "Chưa chọn file"}
              </span>
              {attachments.length ? (
                <span className="legacy-file-hint">{attachments[0]?.name}{attachments.length > 1 ? ` +${attachments.length - 1} file` : ""}</span>
              ) : null}
            </div>
          </label>
          {submitError ? (
            <div className="legacy-window-alert" role="alert">
              {submitError}
            </div>
          ) : null}
          <div className="legacy-window-form-actions">
            <Button variant="ghost" type="button" onClick={() => setShowAddForm(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={!onSubmitJd || !jdFormTitle.trim() || submitting}>
              Lưu JD
            </Button>
          </div>
        </form>
      ) : null}

      <div className="legacy-window-body">
        <aside className="legacy-window-pane">
          <div className="legacy-window-pane-head">
            <strong>Danh sách JD</strong>
            <span>Chọn để xem chi tiết</span>
          </div>
          <div className="legacy-window-list-scroll">
            {filteredJobs.length ? (
              filteredJobs.map((job) => (
                <button
                  key={job.id}
                  type="button"
                  className={`legacy-window-item ${job.id === selectedJdId ? "active" : ""}`}
                  onClick={() => onSelectJd(job.id)}
                >
                  <div className="legacy-window-item-top">
                    <strong className="legacy-window-item-title">{job.title}</strong>
                    <span className="legacy-window-badge">{job.postedAt}</span>
                  </div>
                  <div className="legacy-window-item-sub">
                    <span className="legacy-window-item-meta">{job.company}</span>
                    <span className="legacy-window-id">{job.id}</span>
                  </div>
                </button>
              ))
            ) : (
              <div className="legacy-window-empty">
                <strong>Không có kết quả phù hợp.</strong>
                <p>Hãy thử từ khóa khác hoặc thêm JD mới.</p>
              </div>
            )}
          </div>
        </aside>

        <main className="legacy-window-pane legacy-window-pane-detail">
          <div className="legacy-window-pane-head">
            <strong>Chi tiết JD</strong>
            <span>Thông tin & mô tả</span>
          </div>
          <div className="legacy-window-detail">
            {selectedJd ? (
              <>
                <div className="legacy-window-kv">
                  <span>Vị trí</span>
                  <strong>{selectedJd.title}</strong>
                </div>
                <div className="legacy-window-kv">
                  <span>Công ty</span>
                  <strong>{selectedJd.company}</strong>
                </div>
                <div className="legacy-window-kv">
                  <span>Đăng</span>
                  <strong>{selectedJd.postedAt}</strong>
                </div>
                {selectedJd.summary ? (
                  <div className="legacy-window-block">
                    <strong className="legacy-window-block-title">Mô tả</strong>
                    <p className="legacy-window-paragraph">{selectedJd.summary}</p>
                  </div>
                ) : null}
                {Array.isArray(selectedJd.responsibilities) && selectedJd.responsibilities.length ? (
                  <div className="legacy-window-block">
                    <strong className="legacy-window-block-title">Trách nhiệm</strong>
                    <ul className="legacy-window-bullets">
                      {selectedJd.responsibilities.slice(0, 6).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {Array.isArray(selectedJd.requirements) && selectedJd.requirements.length ? (
                  <div className="legacy-window-block">
                    <strong className="legacy-window-block-title">Yêu cầu</strong>
                    <ul className="legacy-window-bullets">
                      {selectedJd.requirements.slice(0, 6).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="legacy-window-block">
                  <strong className="legacy-window-block-title">Tệp đính kèm</strong>
                  {normalizedAttachments.length ? (
                    <ul className="legacy-attachment-list" aria-label="Danh sách file JD">
                      {normalizedAttachments.slice(0, 8).map((file) => (
                        <li key={`${file.name}-${file.index}`} className="legacy-attachment-item">
                          <Paperclip className="h-4 w-4" />
                          <span className="legacy-attachment-name">{file.name}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="legacy-window-paragraph">Chưa có file đính kèm. Bạn có thể upload ở nút “+”.</p>
                  )}
                </div>

                <div className="legacy-window-form-actions">
                  <Button onClick={() => onUseJd?.(selectedJd)} disabled={!onUseJd}>
                    Dùng JD này tạo phỏng vấn
                  </Button>
                </div>
              </>
            ) : (
              <div className="legacy-window-empty">
                <strong>Chọn một JD ở danh sách.</strong>
                <p>Chi tiết JD sẽ hiển thị tại đây.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </section>
  );
}
