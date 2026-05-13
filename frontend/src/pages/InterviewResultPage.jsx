import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart,
  CalendarDays,
  CheckCircle2,
  FileText,
  Lightbulb,
  RefreshCcw,
  X,
} from "lucide-react";
import "../features/aiInterview/legacy.css";
import { ThemeToggleButton } from "../components/ui/ThemeToggleButton";
import { getStoredTheme, subscribeTheme } from "../utils/themeController";
const LAST_RESULT_STORAGE_KEY = "aiia-last-interview-result";

function getInitialTheme() {
  return getStoredTheme();
}

function readLastResult() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LAST_RESULT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function formatDate(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = String(d.getFullYear());
    return `${dd}/${mm}/${yyyy}`;
  } catch {
    return "";
  }
}

function clampScore(value, fallback = 0) {
  const number = typeof value === "number" ? value : fallback;
  if (!Number.isFinite(number)) return fallback;
  return Math.max(0, Math.min(100, Math.round(number)));
}

function formatDuration(seconds) {
  const safe = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const minutes = Math.max(1, Math.round(safe / 60));
  return `${minutes} phút`;
}

function scoreTone(score) {
  if (score >= 80) return "good";
  if (score >= 60) return "mid";
  return "bad";
}

export default function InterviewResultPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const urlParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const role = urlParams.get("role") || "candidate";

  const [theme, setTheme] = useState(getInitialTheme);
  const [result, setResult] = useState(() => readLastResult());
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    return subscribeTheme(setTheme);
  }, []);

  useEffect(() => {
    setResult(readLastResult());
  }, [location.key]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") setShowDetail(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const isDark = theme === "dark";
  const score = clampScore(result?.score, 0);
  const jobId = result?.jobId || "";

  const jdTitle = result?.jdTitle || "JD";
  const cvFile = result?.cvFile || "Nguyen_Quang_Anh_CV.pdf";

  const jdMatch = clampScore(result?.components?.jdMatch, Math.min(100, score + 3));
  const logic = clampScore(result?.components?.logic, Math.max(0, score - 12));
  const confidence = clampScore(result?.components?.confidence, Math.min(100, score + 8));
  const percentile = Math.max(10, Math.min(95, Math.round((score - 50) * 1.2 + 60)));

  const circle = { size: 136, stroke: 12, radius: 52 };
  const circumference = 2 * Math.PI * circle.radius;
  const dash = (score / 100) * circumference;
  const dashOffset = circumference - dash;

  const tone = scoreTone(score);

  const onPracticeAgain = () =>
    navigate(`/phong-van-moi?role=${role}&mode=job-focused&job=${jobId || "JD-TCB-2026-01"}&lockCv=0`);

  const surface = isDark ? "border-slate-700/60 bg-slate-900/50" : "border-slate-200 bg-white";
  const subtleSurface = isDark ? "border-slate-700/60 bg-slate-950/20" : "border-slate-200 bg-white";
  const subtleSurfaceHover = isDark ? "hover:bg-slate-950/30" : "hover:bg-slate-50";
  const mutedText = isDark ? "text-slate-300" : "text-slate-600";
  const bodyText = isDark ? "text-slate-200" : "text-slate-700";
  const borderSubtle = isDark ? "border-slate-700/60" : "border-slate-200";

  if (!result) {
    return (
      <main className={`interview-legacy theme-${theme}`}>
        <div className="mx-auto w-full max-w-[1120px] px-6 py-10">
          <div className={`rounded-2xl border p-6 shadow-sm ${surface}`}>
            <h1 className="text-xl font-extrabold">Kết quả phỏng vấn</h1>
            <p className={`mt-2 text-sm leading-relaxed ${mutedText}`}>
              Chưa có dữ liệu kết quả. Hãy hoàn thành một phiên phỏng vấn để xem báo cáo nhanh.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                className={`rounded-xl border px-4 py-3 text-sm font-black shadow-sm transition ${subtleSurface} ${subtleSurfaceHover}`}
                onClick={() => navigate(`/dashboard?role=${role}`)}
              >
                Về Dashboard
              </button>
              <button
                type="button"
                className="rounded-xl border border-blue-600 bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-700"
                onClick={onPracticeAgain}
              >
                Luyện tập lại
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={`interview-legacy theme-${theme}`}>
      <div className="mx-auto w-full max-w-[1120px] px-6 py-10">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <button
              onClick={() => navigate(`/dashboard?role=${role}`)}
              className={`grid h-10 w-10 place-items-center rounded-xl border transition ${subtleSurface} ${subtleSurfaceHover} shadow-sm`}
              title="Quay lại Dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">Kết quả phỏng vấn</h1>
              <p className={`mt-2 text-sm leading-relaxed ${mutedText}`}>Báo cáo nhanh cho phiên vừa hoàn thành.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="rounded-xl border border-blue-600 bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-700"
              onClick={() => setShowDetail(true)}
            >
              Xem báo cáo chi tiết
            </button>
            <button
              type="button"
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-black shadow-sm transition ${subtleSurface} ${subtleSurfaceHover}`}
              onClick={onPracticeAgain}
            >
              <RefreshCcw className="h-4 w-4" />
              Luyện tập lại
            </button>
            <ThemeToggleButton compact className="ml-1" />
          </div>
        </header>

        <section className="mt-6 grid grid-cols-12 gap-4">
          <article
            className={`col-span-12 lg:col-span-8 rounded-2xl border p-6 shadow-sm ${
              isDark
                ? "border-slate-700/60 bg-gradient-to-br from-blue-950/40 via-slate-950/60 to-emerald-950/30"
                : "border-slate-200 bg-gradient-to-br from-blue-50 via-white to-emerald-50"
            }`}
          >
            <div className="flex flex-col gap-6 md:flex-row md:items-center">
              <div className="flex items-center gap-5">
                <div className="relative grid h-[136px] w-[136px] place-items-center">
                  <svg width={circle.size} height={circle.size} className="rotate-[-90deg]">
                    <circle
                      cx={circle.size / 2}
                      cy={circle.size / 2}
                      r={circle.radius}
                      strokeWidth={circle.stroke}
                      fill="transparent"
                      className={isDark ? "stroke-slate-700/60" : "stroke-slate-200"}
                    />
                    <circle
                      cx={circle.size / 2}
                      cy={circle.size / 2}
                      r={circle.radius}
                      strokeWidth={circle.stroke}
                      fill="transparent"
                      strokeLinecap="round"
                      strokeDasharray={`${dash} ${circumference}`}
                      strokeDashoffset={dashOffset}
                      className={tone === "good" ? "stroke-emerald-500" : tone === "mid" ? "stroke-amber-500" : "stroke-rose-500"}
                    />
                  </svg>

                  <div className="absolute inset-0 grid place-items-center text-center">
                    <div className="text-3xl font-black tabular-nums">
                      {score}
                      <span className={`text-sm font-black ${isDark ? "text-slate-300" : "text-slate-500"}`}>/100</span>
                    </div>
                    <div className={`mt-1 text-xs font-extrabold ${mutedText}`}>Điểm AI</div>
                  </div>
                </div>

                <div>
                  <div
                    className={`text-sm font-extrabold ${
                      tone === "good" ? "text-emerald-600" : tone === "mid" ? "text-amber-600" : "text-rose-600"
                    }`}
                  >
                    {tone === "good" ? "Hiệu suất tốt!" : tone === "mid" ? "Khá ổn!" : "Cần cải thiện!"}
                  </div>
                  <div className={`mt-2 max-w-[46ch] text-sm leading-relaxed ${bodyText}`}>
                    Bạn đã vượt qua <span className="font-black">{percentile}%</span> ứng viên khác.
                  </div>
                </div>
              </div>

              <div className="flex-1">
                <div className="grid gap-4">
                  {[
                    { label: "Chuyên môn (JD Match)", value: jdMatch, tone: "emerald" },
                    { label: "Mạch lạc & Logic", value: logic, tone: "blue" },
                    { label: "Thái độ & Tự tin", value: confidence, tone: "amber" },
                  ].map((row) => (
                    <div key={row.label}>
                      <div className="flex items-center justify-between gap-3">
                        <div className={`text-sm font-extrabold ${isDark ? "text-slate-200" : "text-slate-800"}`}>{row.label}</div>
                        <div className={`text-sm font-black tabular-nums ${isDark ? "text-slate-200" : "text-slate-800"}`}>{row.value}/100</div>
                      </div>
                      <div className={`mt-2 h-2 w-full overflow-hidden rounded-full ${isDark ? "bg-slate-800/70" : "bg-slate-200"}`}>
                        <div
                          className={`h-full rounded-full ${
                            row.tone === "emerald" ? "bg-emerald-500" : row.tone === "blue" ? "bg-blue-600" : "bg-amber-500"
                          }`}
                          style={{ width: `${row.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </article>

          <article className={`col-span-12 lg:col-span-4 rounded-2xl border p-6 shadow-sm ${surface}`}>
            <div className="text-sm font-extrabold">Thông tin phiên</div>
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { icon: <BarChart className="h-4 w-4" />, label: jdTitle },
                { icon: <FileText className="h-4 w-4" />, label: cvFile },
                { icon: <CalendarDays className="h-4 w-4" />, label: formatDate(result?.createdAt) || "—" },
                { icon: <span className="font-mono text-xs font-black">⏱</span>, label: formatDuration(result?.durationSeconds ?? 15 * 60) },
              ].map((tag) => (
                <span
                  key={tag.label}
                  className={`inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-2 text-xs font-extrabold ${
                    isDark ? "border-slate-700/60 bg-slate-950/20 text-slate-100" : "border-slate-200 bg-slate-50 text-slate-800"
                  }`}
                  title={tag.label}
                >
                  <span className={isDark ? "text-blue-300" : "text-blue-700"}>{tag.icon}</span>
                  <span className="truncate">{tag.label}</span>
                </span>
              ))}
            </div>
          </article>
        </section>

        <section className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <article className={`rounded-2xl border p-6 shadow-sm ${isDark ? "border-emerald-500/25 bg-slate-900/50" : "border-emerald-200 bg-white"}`}>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <div className="text-sm font-extrabold">Điểm mạnh</div>
            </div>
            <ul className={`mt-4 grid gap-2 text-sm leading-relaxed ${bodyText}`}>
              <li>Trả lời có cấu trúc rõ ràng, bám sát yêu cầu JD.</li>
              <li>Thể hiện sự tự tin và chủ động trong cách trình bày.</li>
            </ul>
          </article>

          <article className={`rounded-2xl border p-6 shadow-sm ${isDark ? "border-amber-500/25 bg-slate-900/50" : "border-amber-200 bg-white"}`}>
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <div className="text-sm font-extrabold">Cần cải thiện</div>
            </div>
            <ul className={`mt-4 grid gap-2 text-sm leading-relaxed ${bodyText}`}>
              <li>Làm rõ impact bằng số liệu định lượng (KPI/KRI, % cải thiện, thời gian xử lý).</li>
              <li>Chốt câu trả lời nhanh hơn, tránh lặp ý.</li>
            </ul>
          </article>

          <article className={`rounded-2xl border p-6 shadow-sm ${isDark ? "border-blue-500/25 bg-slate-900/50" : "border-blue-200 bg-white"}`}>
            <div className="flex items-center gap-3">
              <Lightbulb className="h-5 w-5 text-blue-700" />
              <div className="text-sm font-extrabold">Gợi ý hành động</div>
            </div>
            <p className={`mt-4 text-sm leading-relaxed ${bodyText}`}>
              Nên ôn lại cách lấy ví dụ định lượng (số liệu) khi nói về kết quả dự án. Hãy luyện thêm bộ câu hỏi Technical cho vị trí Senior IT Risk để tăng độ mạch lạc.
            </p>
          </article>
        </section>

        {showDetail ? (
          <div className="fixed inset-0 z-[200] grid place-items-center bg-black/40 p-6" role="dialog" aria-modal="true">
            <div className={`w-full max-w-[860px] rounded-2xl border shadow-xl ${isDark ? "border-slate-700 bg-slate-950 text-slate-100" : "border-slate-200 bg-white text-slate-900"}`}>
              <div className={`flex items-start justify-between gap-4 border-b px-6 py-4 ${borderSubtle}`}>
                <div>
                  <div className="text-lg font-extrabold">Báo cáo chi tiết</div>
                  <div className={`mt-1 text-sm ${mutedText}`}>
                    {jdTitle} • {formatDate(result?.createdAt) || "—"}
                  </div>
                </div>
                <button
                  type="button"
                  className={`grid h-10 w-10 place-items-center rounded-xl border ${isDark ? "border-slate-700 bg-slate-950/20" : "border-slate-200 bg-slate-50"}`}
                  onClick={() => setShowDetail(false)}
                  aria-label="Đóng"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="px-6 py-5">
                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    { label: "Chuyên môn (JD Match)", value: jdMatch, color: "bg-emerald-500" },
                    { label: "Mạch lạc & Logic", value: logic, color: "bg-blue-600" },
                    { label: "Thái độ & Tự tin", value: confidence, color: "bg-amber-500" },
                  ].map((row) => (
                    <div key={row.label} className={`rounded-2xl border p-4 ${isDark ? "border-slate-700/60 bg-slate-900/40" : "border-slate-200 bg-slate-50"}`}>
                      <div className={`text-xs font-black ${isDark ? "text-slate-400" : "text-slate-500"}`}>{row.label}</div>
                      <div className="mt-2 text-2xl font-black tabular-nums">{row.value}/100</div>
                      <div className={`mt-3 h-2 w-full overflow-hidden rounded-full ${isDark ? "bg-slate-800" : "bg-slate-200"}`}>
                        <div className={`h-full ${row.color}`} style={{ width: `${row.value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="rounded-xl border border-blue-600 bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-700"
                    onClick={() => navigate(`/dashboard?role=${role}&screen=interviewHistory`)}
                  >
                    Mở lịch sử phỏng vấn
                  </button>
                  <button
                    type="button"
                    className={`rounded-xl border px-4 py-3 text-sm font-black shadow-sm transition ${subtleSurface} ${subtleSurfaceHover}`}
                    onClick={() => setShowDetail(false)}
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
