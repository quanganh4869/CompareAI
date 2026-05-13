import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, FileText, Image, Plus, Search, Upload, X } from "lucide-react";
import { Button } from "../shared";

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

function normalizeCvImages(selectedCv) {
  const raw = selectedCv?.images;
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((item, index) => {
      if (!item) {
        return null;
      }
      if (typeof item === "string") {
        return { url: item, name: `Trang ${index + 1}` };
      }
      const url = item.url || item.dataUrl || item.src || "";
      if (!url) {
        return null;
      }
      return { url, name: item.name || `Trang ${index + 1}` };
    })
    .filter(Boolean);
}

export function CvHistoryWindow({
  cvRows,
  selectedCvId,
  onSelectCv,
  selectedCv,
  cvFormName,
  setCvFormName,
  cvFormRole,
  setCvFormRole,
  openAddFormNonce = 0,
  onSubmitCv,
  onClose,
}) {
  const [query, setQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [uploadImages, setUploadImages] = useState([]);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const fileInputRef = useRef(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const previewImages = useMemo(() => normalizeCvImages(selectedCv), [selectedCv]);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [selectedCvId]);

  useEffect(() => {
    if (openAddFormNonce > 0) {
      setShowAddForm(true);
    }
  }, [openAddFormNonce]);

  const filteredRows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return cvRows;
    }
    return cvRows.filter((row) => {
      const haystack = `${row.name ?? ""} ${row.role ?? ""} ${row.id ?? ""}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [cvRows, query]);

  const handleUploadChange = async (event) => {
    const files = Array.from(event.target.files || []).filter(Boolean);
    if (!files.length) {
      setUploadImages([]);
      setUploadFiles([]);
      return;
    }

    const selected = files.slice(0, 8);
    setUploadFiles(selected);
    setUploading(true);
    setSubmitError("");
    try {
      const urls = await Promise.all(
        selected.map((file) => {
          if (!file?.type?.startsWith("image/")) {
            return Promise.resolve("");
          }
          return readFileAsDataUrl(file);
        }),
      );
      const images = urls
        .map((url, index) => (url ? { url, name: selected[index]?.name || `Trang ${index + 1}` } : null))
        .filter(Boolean);
      setUploadImages(images);

      if (!cvFormName.trim() && selected.length === 1 && selected[0]?.name) {
        setCvFormName(selected[0].name);
      }
    } catch {
      setUploadImages([]);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event) => {
    setSubmitting(true);
    setSubmitError("");
    try {
      const ok = await onSubmitCv?.(event, { images: uploadImages, file: uploadFiles[0] });
      if (ok === false) {
        return;
      }
      setShowAddForm(false);
      setUploadImages([]);
      setUploadFiles([]);
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Không thể lưu CV. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      className="legacy-window legacy-window--wide"
      role="dialog"
      aria-modal="true"
      aria-label="Lịch sử CV"
      onClick={(event) => event.stopPropagation()}
    >
      <header className="legacy-window-head">
        <div className="legacy-window-title-row">
          <span className="legacy-window-icon">
            <FileText className="h-4 w-4" />
          </span>
          <div>
            <h3>Lịch sử CV</h3>
            <p>{cvRows.length ? `${cvRows.length} CV tự luyện đã lưu` : "Chưa có CV tự luyện nào."}</p>
          </div>
        </div>

        <div className="legacy-window-actions">
          <Button
            variant="ghost"
            onClick={() => setShowAddForm((previous) => !previous)}
            className="legacy-window-action legacy-window-icon-action"
            aria-label="Thêm CV"
            dataTip="Thêm CV"
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
            placeholder="Tìm theo tên file, vị trí, mã CV..."
          />
        </label>
        <span className="legacy-window-chip">{filteredRows.length}/{cvRows.length} mục</span>
      </div>

      {showAddForm ? (
        <form className="legacy-window-form" onSubmit={handleSubmit}>
          <div className="legacy-window-form-grid">
            <label>
              Tên file CV
              <input
                value={cvFormName}
                onChange={(event) => setCvFormName(event.target.value)}
                placeholder="nguyen-minh-anh-cv.pdf"
              />
            </label>
            <label>
              Vị trí mục tiêu
              <input
                value={cvFormRole}
                onChange={(event) => setCvFormRole(event.target.value)}
                placeholder="Senior IT Risk Specialist"
              />
            </label>
          </div>

          <label className="legacy-window-form-full">
            Tải file CV (PNG/JPG/PDF — có thể chọn nhiều file, sẽ upload file đầu tiên)
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,application/pdf"
              multiple
              onChange={handleUploadChange}
            />
            <div className="legacy-file-row" aria-live="polite">
              <span className="legacy-file-pill">
                <Upload className="h-4 w-4" />
                {uploading
                  ? "Đang tải preview..."
                  : uploadFiles.length
                    ? `Đã chọn ${uploadFiles.length} file`
                    : "Chưa chọn file"}
              </span>
              {uploadImages.length ? (
                <span className="legacy-file-hint">Ảnh sẽ hiển thị ở phần Chi tiết CV sau khi lưu.</span>
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
            <Button type="submit" disabled={!cvFormName.trim() || uploading || submitting}>
              Lưu CV
            </Button>
          </div>
        </form>
      ) : null}

      <div className="legacy-window-body">
        <aside className="legacy-window-pane">
          <div className="legacy-window-pane-head">
            <strong>Danh sách CV</strong>
            <span>Chọn để xem chi tiết</span>
          </div>
          <div className="legacy-window-list-scroll">
            {filteredRows.length ? (
              filteredRows.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  className={`legacy-window-item ${row.id === selectedCvId ? "active" : ""}`}
                  onClick={() => onSelectCv(row.id)}
                >
                  <div className="legacy-window-item-top">
                    <strong className="legacy-window-item-title">{row.name}</strong>
                    <span className="legacy-window-badge">{row.updatedAt}</span>
                  </div>
                  <div className="legacy-window-item-sub">
                    <span className="legacy-window-item-meta">{row.role}</span>
                    <span className="legacy-window-id">{row.id}</span>
                  </div>
                </button>
              ))
            ) : (
              <div className="legacy-window-empty">
                <strong>Không có kết quả phù hợp.</strong>
                <p>Hãy thử từ khóa khác hoặc thêm CV mới.</p>
              </div>
            )}
          </div>
        </aside>

        <main className="legacy-window-pane legacy-window-pane-detail">
          <div className="legacy-window-pane-head">
            <strong>Chi tiết CV</strong>
            <span>Thông tin tóm tắt</span>
          </div>
          <div className="legacy-window-detail">
            {selectedCv ? (
              <>
                <div className="legacy-window-block legacy-cv-preview">
                  <strong className="legacy-window-block-title">Xem trước CV</strong>
                  {previewImages.length ? (
                    <div className="legacy-cv-preview-stage" role="region" aria-label="Xem trước ảnh CV">
                      <div
                        className="legacy-cv-preview-track"
                        style={{
                          transform: `translateX(-${activeImageIndex * 100}%)`,
                        }}
                      >
                        {previewImages.map((img, index) => (
                          <div key={`${index}-${img.name}`} className="legacy-cv-preview-slide">
                            <img src={img.url} alt={img.name || "Ảnh CV"} loading="lazy" />
                          </div>
                        ))}
                      </div>

                      {previewImages.length > 1 ? (
                        <>
                          <button
                            type="button"
                            className="legacy-cv-arrow prev"
                            onClick={() => setActiveImageIndex((previous) => Math.max(0, previous - 1))}
                            disabled={activeImageIndex <= 0}
                            aria-label="Ảnh trước"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="legacy-cv-arrow next"
                            onClick={() =>
                              setActiveImageIndex((previous) => Math.min(previewImages.length - 1, previous + 1))
                            }
                            disabled={activeImageIndex >= previewImages.length - 1}
                            aria-label="Ảnh tiếp theo"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                          <div className="legacy-cv-counter" aria-label="Số trang">
                            {activeImageIndex + 1}/{previewImages.length}
                          </div>
                        </>
                      ) : null}
                    </div>
                  ) : (
                    <div className="legacy-cv-preview-empty">
                      <span className="legacy-cv-preview-empty-icon" aria-hidden="true">
                        <Image className="h-4 w-4" />
                      </span>
                      <div>
                        <strong>Chưa có ảnh CV</strong>
                        <p>Hãy dùng nút “+” để upload ảnh CV và xem preview tại đây.</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="legacy-window-kv">
                  <span>Tên file</span>
                  <strong>{selectedCv.name}</strong>
                </div>
                <div className="legacy-window-kv">
                  <span>Vị trí</span>
                  <strong>{selectedCv.role}</strong>
                </div>
                <div className="legacy-window-kv">
                  <span>Cập nhật</span>
                  <strong>{selectedCv.updatedAt}</strong>
                </div>
                <div className="legacy-window-kv">
                  <span>Mã CV</span>
                  <strong>{selectedCv.id}</strong>
                </div>

              </>
            ) : (
              <div className="legacy-window-empty">
                <strong>Chọn một CV ở danh sách.</strong>
                <p>Chi tiết CV sẽ hiển thị tại đây.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </section>
  );
}
