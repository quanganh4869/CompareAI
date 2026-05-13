import React, { useEffect, useMemo, useState } from "react";
import { Briefcase, FolderOpen, Upload } from "lucide-react";
import { Button, Pill, SectionCard } from "../components/shared";
import { LoadingModal } from "../../../components/ui/LoadingModal";

function buildTextFromUploadedJd(jd) {
  if (!jd) return "";
  return [jd.title || "", jd.company || "", jd.summary || ""]
    .filter(Boolean)
    .join("\n")
    .trim();
}

export function JobDetailScreen({
  selectedJd,
  jdRows = [],
  onSelectJd,
  cvRows = [],
  userRole = "",
  onCompareCvJd,
  onGoToLibrary,
}) {
  const [compareState, setCompareState] = useState("idle");
  const [compareResult, setCompareResult] = useState(null);
  const [compareError, setCompareError] = useState("");
  const [compareOpen, setCompareOpen] = useState(false);
  const [selectedCvId, setSelectedCvId] = useState("");
  const [jdSource, setJdSource] = useState("selected");
  const [jdInputText, setJdInputText] = useState("");
  const isManualJdInput = jdSource === "manual";
  const normalizedRole = String(userRole || "").toLowerCase();
  const isRecruiter =
    normalizedRole.includes("hr") || normalizedRole.includes("recruiter");

  const selectedJdText = useMemo(
    () => buildTextFromUploadedJd(selectedJd),
    [selectedJd],
  );

  useEffect(() => {
    setCompareState("idle");
    setCompareResult(null);
    setCompareError("");
    setCompareOpen(false);
    setSelectedCvId("");
    setJdSource("selected");
    setJdInputText(selectedJdText);
  }, [selectedJd?.id, selectedJdText]);

  useEffect(() => {
    if (jdSource === "selected") {
      setJdInputText(selectedJdText);
      return;
    }

    if (jdSource.startsWith("uploaded:")) {
      const jdId = Number(jdSource.split(":")[1] || 0);
      const target = jdRows.find((item) => Number(item.id) === jdId);
      setJdInputText(buildTextFromUploadedJd(target));
    }
  }, [jdSource, jdRows, selectedJdText]);

  const handleCompare = async () => {
    const finalJdText = String(jdInputText || "").trim();

    if (!selectedJd && jdSource !== "manual" && !jdSource.startsWith("uploaded:")) {
      setCompareError("Bạn chưa có JD. Hãy upload JD hoặc nhập tay nội dung JD.");
      return;
    }

    if (!finalJdText) {
      setCompareError("Vui lòng nhập nội dung JD trước khi so sánh.");
      return;
    }

    setCompareOpen(false);
    setCompareError("");
    setCompareState("loading");

    try {
      const result = await onCompareCvJd?.({
        cvDocumentId: Number(selectedCvId),
        jdText: finalJdText,
      });

      if (!result) {
        throw new Error("No match result returned.");
      }

      setCompareResult({
        total: Math.round(Number(result.match_score || 0)),
        cvId: Number(selectedCvId),
        met: Array.isArray(result.matched_skills) ? result.matched_skills : [],
        missing: Array.isArray(result.missing_skills) ? result.missing_skills : [],
        semanticScore: Number(result.semantic_score || 0),
        skillScore: Number(result.skill_score || 0),
        experienceScore: Number(result.experience_score || 0),
        recommendation: result.recommendation || "N/A",
        evaluation: result.evaluation || "",
      });
      setCompareState("done");
    } catch (error) {
      setCompareState("idle");
      setCompareError(error?.message || "Không thể chấm điểm CV/JD.");
    }
  };

  const hasJds = jdRows.length > 0;

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <aside className="space-y-4 lg:col-span-4">
        <div
          className="rounded-2xl border p-4 shadow-sm"
          style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border)" }}
        >
          <h3 className="mb-3 text-sm font-bold" style={{ color: "var(--text)" }}>
            JD có sẵn trong hệ thống
          </h3>

          {hasJds ? (
            <div className="max-h-[600px] space-y-2 overflow-y-auto pr-2">
              {jdRows.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onSelectJd?.(item.id)}
                  className={`w-full rounded-xl border p-4 text-left transition ${
                    Number(item.id) === Number(selectedJd?.id)
                      ? "border-blue-200 bg-blue-50"
                      : "border-transparent hover:bg-slate-50"
                  }`}
                >
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <h4 className="line-clamp-1 font-bold" style={{ color: "var(--text)" }}>
                      {item.title || item.fileName || `JD #${item.id}`}
                    </h4>
                    <Briefcase size={14} style={{ color: "var(--text-soft)" }} />
                  </div>
                  <p className="mb-2 text-xs" style={{ color: "var(--text-soft)" }}>
                    {item.company || "N/A"}
                  </p>
                  <Pill>{item.postedAt || "N/A"}</Pill>
                </button>
              ))}
            </div>
          ) : (
            <div
              className="rounded-xl border border-dashed p-4 text-sm"
              style={{ color: "var(--text-soft)", borderColor: "var(--border)" }}
            >
              Chưa có JD nào trong hệ thống. Bạn vẫn có thể nhập tay JD để so sánh.
            </div>
          )}
        </div>

        <div
          className="rounded-2xl border p-4"
          style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border)" }}
        >
          <h4 className="mb-2 text-sm font-bold" style={{ color: "var(--text)" }}>
            Nguồn dữ liệu so sánh
          </h4>
          <ul className="space-y-2 text-xs" style={{ color: "var(--text-soft)" }}>
            <li>• CV: upload từ thư viện CV cá nhân</li>
            <li>• JD: chọn từ hệ thống hoặc nhập tay trong popup so sánh</li>
            {isRecruiter ? <li>• HR: có thể đăng bài từ JD ở màn thư viện</li> : null}
          </ul>
          <Button variant="secondary" className="mt-3 w-full" onClick={onGoToLibrary}>
            <FolderOpen size={15} className="mr-2" /> Mở thư viện
          </Button>
        </div>
      </aside>

      <main className="space-y-6 lg:col-span-8">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
              {selectedJd?.title || "So sánh CV với JD"}
            </h2>
            <div
              className="mt-1 flex items-center gap-3 text-sm"
              style={{ color: "var(--text-soft)" }}
            >
              <span>{selectedJd?.company || "JD nhập tay"}</span>
              {selectedJd?.postedAt ? (
                <>
                  <span>•</span>
                  <span>{selectedJd.postedAt}</span>
                </>
              ) : null}
            </div>
          </div>
          <Button variant="primary" onClick={() => setCompareOpen(true)}>
            <Upload size={16} className="mr-2" /> So sánh ngay
          </Button>
        </header>

        <section className="rounded-2xl border border-blue-100 bg-blue-50/30 p-6">
          <div className="flex flex-col items-center gap-8 md:flex-row">
            <div className="flex flex-col items-center gap-2">
              <div className="relative flex h-24 w-24 items-center justify-center">
                <svg className="h-full w-full -rotate-90">
                  <circle cx="48" cy="48" r="40" fill="transparent" stroke="#e2e8f0" strokeWidth="8" />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    fill="transparent"
                    stroke="#2563eb"
                    strokeWidth="8"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 - (251.2 * (compareResult?.total || 0)) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <span className="absolute text-xl font-bold text-blue-700">
                  {compareResult ? `${compareResult.total}%` : "--"}
                </span>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-800">
                Độ phù hợp
              </span>
            </div>

            <div className="flex-1">
              {compareError ? (
                <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  {compareError}
                </div>
              ) : null}

              {compareState === "idle" ? (
                <div className="text-center md:text-left">
                  <h3 className="mb-2 font-bold" style={{ color: "var(--text)" }}>
                    Chấm điểm CV theo JD
                  </h3>
                  <p className="mb-4 text-sm" style={{ color: "var(--text-soft)" }}>
                    Chọn CV, chọn JD có sẵn hoặc nhập tay JD để phân tích độ phù hợp.
                  </p>
                  <Button variant="primary" onClick={() => setCompareOpen(true)}>
                    Bắt đầu phân tích
                  </Button>
                </div>
              ) : null}

              {compareState === "loading" ? (
                <div className="flex flex-col items-center gap-3 md:items-start">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-blue-600" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-blue-600 [animation-delay:-0.3s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-blue-600 [animation-delay:-0.5s]" />
                  </div>
                  <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
                    AI đang phân tích hồ sơ...
                  </p>
                </div>
              ) : null}

              {compareState === "done" && compareResult ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-2 text-xs text-slate-600 md:grid-cols-3">
                    <div>Semantic: {compareResult.semanticScore}%</div>
                    <div>Skill: {compareResult.skillScore}%</div>
                    <div>Experience: {compareResult.experienceScore}%</div>
                  </div>
                  <div className="text-xs font-semibold text-blue-700">
                    Recommendation: {compareResult.recommendation}
                  </div>
                  {compareResult.evaluation ? (
                    <p className="text-xs text-slate-600">{compareResult.evaluation}</p>
                  ) : null}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <h4 className="mb-2 whitespace-nowrap text-sm font-bold text-emerald-700">
                        Kỹ năng đáp ứng
                      </h4>
                      <ul className="space-y-1 text-xs" style={{ color: "var(--text-soft)" }}>
                        {(compareResult.met.length ? compareResult.met : ["N/A"]).map((item) => (
                          <li key={item}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="mb-2 whitespace-nowrap text-sm font-bold text-amber-700">
                        Cần bổ sung
                      </h4>
                      <ul className="space-y-1 text-xs" style={{ color: "var(--text-soft)" }}>
                        {(compareResult.missing.length
                          ? compareResult.missing
                          : ["N/A"]).map((item) => (
                          <li key={item}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <SectionCard title="Nội dung JD đang dùng để so sánh">
          <div className="space-y-3 text-sm leading-relaxed" style={{ color: "var(--text)" }}>
            {selectedJd?.summary ? (
              <p>{selectedJd.summary}</p>
            ) : (
              <p>JD đang được nhập tay trong popup so sánh.</p>
            )}
            <p className="text-xs" style={{ color: "var(--text-soft)" }}>
              Mẹo: Nếu JD quá ngắn, bạn nên mở popup "So sánh ngay" và dán đầy đủ mô tả
              để semantic score chính xác hơn.
            </p>
          </div>
        </SectionCard>
      </main>

      {compareOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div
            className="w-full max-w-2xl animate-in zoom-in-95 rounded-3xl p-6 shadow-2xl duration-200"
            style={{ backgroundColor: "var(--card-bg)" }}
          >
            <h3 className="mb-2 text-xl font-bold" style={{ color: "var(--text)" }}>
              Chọn CV và nội dung JD để so sánh
            </h3>
            <p className="mb-4 text-sm" style={{ color: "var(--text-soft)" }}>
              Chọn JD đã upload hoặc nhập tay. Nội dung trong khung sẽ là dữ liệu gửi sang backend.
            </p>

            <div className="grid gap-4">
              <select
                className="w-full rounded-xl border p-3 outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  backgroundColor: "var(--card-soft)",
                  borderColor: "var(--border)",
                  color: "var(--text)",
                }}
                value={selectedCvId}
                onChange={(event) => setSelectedCvId(event.target.value)}
              >
                <option value="">-- Chọn CV của tôi --</option>
                {cvRows.map((cv) => (
                  <option key={cv.id} value={cv.id}>
                    {cv.name}
                  </option>
                ))}
              </select>

              {cvRows.length === 0 ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
                  Bạn chưa có CV trong hệ thống. Hãy vào thư viện để upload CV trước khi so sánh.
                </div>
              ) : null}

              <select
                className="w-full rounded-xl border p-3 outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  backgroundColor: "var(--card-soft)",
                  borderColor: "var(--border)",
                  color: "var(--text)",
                }}
                value={jdSource}
                onChange={(event) => setJdSource(event.target.value)}
              >
                <option value="selected">JD đang chọn</option>
                {jdRows.map((jd) => (
                  <option key={jd.id} value={`uploaded:${jd.id}`}>
                    JD đã upload: {jd.title || jd.fileName || `JD #${jd.id}`}
                  </option>
                ))}
                <option value="manual">Nhập tay JD</option>
              </select>

              {isManualJdInput ? (
                <textarea
                  rows={12}
                  className="w-full rounded-xl border p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  style={{
                    backgroundColor: "var(--card-soft)",
                    borderColor: "var(--border)",
                    color: "var(--text)",
                  }}
                  value={jdInputText}
                  onChange={(event) => setJdInputText(event.target.value)}
                  placeholder="Nhập hoặc chỉnh sửa JD để so sánh..."
                />
              ) : (
                <div
                  className="rounded-xl border p-3 text-sm"
                  style={{
                    backgroundColor: "var(--card-soft)",
                    borderColor: "var(--border)",
                    color: "var(--text-soft)",
                  }}
                >
                  JD sẽ được lấy tự động từ lựa chọn hiện tại.
                </div>
              )}
            </div>

            <div className="mt-4 flex gap-3">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => setCompareOpen(false)}
              >
                Hủy bỏ
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                disabled={!selectedCvId || compareState === "loading"}
                onClick={handleCompare}
              >
                Phân tích
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <LoadingModal isOpen={compareState === "loading"} />
    </div>
  );
}
