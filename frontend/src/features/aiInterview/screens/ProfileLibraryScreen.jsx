import React from "react";
import {
  Briefcase,
  CheckCircle2,
  FileText,
  Plus,
  Trash2,
  Upload,
  User,
} from "lucide-react";
import { Button, SectionCard } from "../components/shared";

export function ProfileLibraryScreen({
  userRole = "",
  extraCvRows = [],
  extraJdRows = [],
  onUploadCv,
  onCreateJd,
  onPublishJd,
  onOpenCvDetail,
  onOpenCustomJdDetail,
  onDeleteCv,
  onDeleteJd,
}) {
  const normalizedRole = String(userRole || "").toLowerCase();
  const isRecruiter =
    normalizedRole.includes("hr") || normalizedRole.includes("recruiter");
  const isCandidate = !isRecruiter;

  const handleCvFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) onUploadCv?.(file);
    event.target.value = "";
  };

  const handleJdFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) onCreateJd?.(file);
    event.target.value = "";
  };

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
          {isRecruiter ? "Thư viện JD để đăng bài" : "Thư viện CV để so sánh"}
        </h2>
        <p className="mt-2 text-sm" style={{ color: "var(--text-soft)" }}>
          {isRecruiter
            ? "Upload JD thủ công, quản lý danh sách JD có sẵn và bấm Đăng bài khi sẵn sàng."
            : "Upload CV cá nhân để dùng cho chức năng so sánh JD/CV."}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {isCandidate ? (
            <>
              <input
                type="file"
                id="cv-upload-input"
                className="hidden"
                accept=".pdf,.doc,.docx"
                onChange={handleCvFileChange}
              />
              <Button
                variant="secondary"
                onClick={() => document.getElementById("cv-upload-input")?.click()}
                className="flex-1 sm:flex-none"
              >
                <Upload size={16} className="mr-2" /> Upload CV
              </Button>
            </>
          ) : (
            <>
              <input
                type="file"
                id="jd-upload-input"
                className="hidden"
                accept=".pdf,.doc,.docx"
                onChange={handleJdFileChange}
              />
              <Button
                variant="primary"
                onClick={() => document.getElementById("jd-upload-input")?.click()}
                className="flex-1 sm:flex-none"
              >
                <Plus size={16} className="mr-2" /> Upload JD mới
              </Button>
            </>
          )}
        </div>
      </header>

      <main>
        {isCandidate ? (
          <SectionCard title={`Danh sách CV (${extraCvRows.length})`}>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {extraCvRows.map((cv) => (
                <div
                  key={cv.id}
                  className="group relative cursor-pointer rounded-2xl border p-5 transition hover:shadow-md"
                  style={{
                    backgroundColor: "var(--card-bg)",
                    borderColor: "var(--border)",
                  }}
                  onClick={() => onOpenCvDetail?.(cv.id, cv)}
                >
                  <div className="mb-4 flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <User size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4
                        className="truncate font-bold"
                        style={{ color: "var(--text)" }}
                        title={cv.name}
                      >
                        {cv.name}
                      </h4>
                      <p className="text-xs" style={{ color: "var(--text-soft)" }}>
                        {cv.role}
                      </p>
                    </div>
                  </div>

                  <div
                    className="flex items-center justify-between text-xs"
                    style={{ color: "var(--text-soft)" }}
                  >
                    <span>Cập nhật: {cv.updatedAt}</span>
                    <div className="flex gap-2 opacity-0 transition group-hover:opacity-100">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          onDeleteCv?.(cv.id);
                        }}
                        className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                        aria-label="Xóa CV"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {extraCvRows.length === 0 && (
                <div
                  className="col-span-full flex flex-col items-center rounded-2xl border-2 border-dashed py-12 text-center"
                  style={{ borderColor: "var(--border)", color: "var(--text-soft)" }}
                >
                  <FileText size={32} className="mb-2 opacity-20" />
                  <p className="text-sm font-medium">Chưa có CV nào được tải lên</p>
                  <button
                    onClick={() => document.getElementById("cv-upload-input")?.click()}
                    className="mt-1 text-xs font-bold text-blue-600 hover:underline"
                  >
                    Upload ngay
                  </button>
                </div>
              )}
            </div>
          </SectionCard>
        ) : (
          <SectionCard title={`Danh sách JD (${extraJdRows.length})`}>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {extraJdRows.map((jd) => (
                <div
                  key={jd.id}
                  className="group relative cursor-pointer rounded-2xl border p-5 transition hover:shadow-md"
                  style={{
                    backgroundColor: "var(--card-bg)",
                    borderColor: "var(--border)",
                  }}
                  onClick={() => onOpenCustomJdDetail?.(jd.id)}
                >
                  <div className="mb-4 flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                      <Briefcase size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate font-bold" style={{ color: "var(--text)" }}>
                        {jd.title}
                      </h4>
                      <p className="text-xs" style={{ color: "var(--text-soft)" }}>
                        {jd.company}
                      </p>
                    </div>
                  </div>

                  <div className="mb-3 flex items-center gap-2 text-xs text-emerald-700">
                    {jd.isPublished ? (
                      <>
                        <CheckCircle2 size={14} />
                        <span>Đã đăng bài{jd.publishedAt ? `: ${jd.publishedAt}` : ""}</span>
                      </>
                    ) : (
                      <span className="rounded-md bg-amber-50 px-2 py-1 text-amber-700">
                        Chưa đăng bài
                      </span>
                    )}
                  </div>

                  <div
                    className="flex items-center justify-between text-xs"
                    style={{ color: "var(--text-soft)" }}
                  >
                    <span>Tải lên: {jd.postedAt}</span>
                    <div className="flex gap-2 opacity-0 transition group-hover:opacity-100">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          onDeleteJd?.(jd.id);
                        }}
                        className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                        aria-label="Xóa JD"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Button
                      variant={jd.isPublished ? "ghost" : "primary"}
                      className="w-full"
                      onClick={(event) => {
                        event.stopPropagation();
                        onPublishJd?.(jd.id);
                      }}
                      disabled={jd.isPublished}
                    >
                      {jd.isPublished ? "Đã đăng" : "Đăng bài"}
                    </Button>
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={(event) => {
                        event.stopPropagation();
                        onOpenCustomJdDetail?.(jd.id);
                      }}
                    >
                      Xem JD
                    </Button>
                  </div>
                </div>
              ))}

              {extraJdRows.length === 0 && (
                <div
                  className="col-span-full flex flex-col items-center rounded-2xl border-2 border-dashed py-12 text-center"
                  style={{ borderColor: "var(--border)", color: "var(--text-soft)" }}
                >
                  <Briefcase size={32} className="mb-2 opacity-20" />
                  <p className="text-sm font-medium">Chưa có JD nào được tải lên</p>
                  <button
                    onClick={() => document.getElementById("jd-upload-input")?.click()}
                    className="mt-1 text-xs font-bold text-amber-600 hover:underline"
                  >
                    Upload ngay
                  </button>
                </div>
              )}
            </div>
          </SectionCard>
        )}
      </main>
    </div>
  );
}
