import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Bot,
  CameraOff,
  Camera,
  CheckCircle2,
  Check,
  Clock3,
  FileText,
  Loader2,
  Mic,
  MicOff,
  Upload,
  X,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { INTERVIEW_WIZARD_STEPS } from "../features/aiInterview/constants/navigation";
import { INTERVIEW_QUESTIONS } from "../features/aiInterview/data/mockData";
import { Button } from "../features/aiInterview/components/shared";
import { findJobPostingById, JOB_POSTINGS } from "../features/aiInterview/data/mockData";
import { formatTime } from "../features/aiInterview/utils/formatters";
import { InterviewPrepOverlay } from "../components/ui/InterviewPrepOverlay";
import { PostInterviewProcessingScreen } from "../components/ui/PostInterviewProcessingScreen";
import { ThemeToggleButton } from "../components/ui/ThemeToggleButton";
import { getStoredTheme, subscribeTheme } from "../utils/themeController";
import "../features/aiInterview/legacy.css";
import "./interviewRoom.css";

const VALID_ROLES = ["candidate", "recruiter", "admin"];
const PRACTICE_SESSION_STORAGE_KEY = "aiia-practice-sessions";
const CUSTOM_CV_STORAGE_KEY = "aiia-custom-cv";
const LAST_RESULT_STORAGE_KEY = "aiia-last-interview-result";
const INTERVIEW_DURATION_SECONDS = 20 * 60;

const SIMULATION_LABEL = {
  "mock-general": "Giả lập tổng quát",
  "mock-behavioral": "Giả lập hành vi",
  "mock-technical": "Giả lập kỹ thuật",
  "job-focused": "Giả lập theo JD",
  "custom-practice": "Tự luyện từ CV/JD",
};

function getInitialTheme() {
  return getStoredTheme();
}

function getSessionById(sessionId) {
  if (!sessionId || typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(PRACTICE_SESSION_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return null;
    }
    return parsed.find((item) => item?.id === sessionId) ?? null;
  } catch {
    return null;
  }
}

function readStorageArray(key) {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStorageArray(key, value) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function addCustomCvToLibrary(filename) {
  if (!filename) {
    return;
  }
  const existing = readStorageArray(CUSTOM_CV_STORAGE_KEY);
  const next = Array.isArray(existing) ? [...existing] : [];
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = String(now.getFullYear());
  const updatedAt = `${dd}/${mm}/${yyyy}`;

  const already = next.find((row) => String(row?.name) === String(filename));
  if (already) {
    already.updatedAt = updatedAt;
    writeStorageArray(CUSTOM_CV_STORAGE_KEY, next);
    return;
  }
  next.unshift({
    id: `CV-${yyyy}-${Math.random().toString(16).slice(2, 8)}`,
    name: filename,
    updatedAt,
  });
  writeStorageArray(CUSTOM_CV_STORAGE_KEY, next);
}

function writeLastInterviewResult(payload) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(LAST_RESULT_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
}

function WaitingStepScreen({ onBack, onStart, isPreparing, progress }) {
  const cappedProgress = Math.max(0, Math.min(100, progress));
  const statusByProgress = (index) => {
    if (index === 0) {
      return cappedProgress >= 25 ? "done" : "active";
    }
    if (index === 1) {
      if (cappedProgress < 25) {
        return "pending";
      }
      return cappedProgress >= 85 ? "done" : "active";
    }
    if (cappedProgress < 85) {
      return "pending";
    }
    return cappedProgress >= 100 ? "done" : "active";
  };

  const steps = [
    {
      title: "Chuẩn bị phòng",
      subtitle: cappedProgress >= 25 ? "Phòng đã sẵn sàng" : "Đang cấu hình...",
    },
    {
      title: "Sinh kịch bản",
      subtitle: cappedProgress >= 85 ? "Hoàn tất" : cappedProgress >= 25 ? "Đang xử lý..." : "Đang chờ...",
    },
    {
      title: "Agent tham gia",
      subtitle: cappedProgress >= 100 ? "Sẵn sàng" : cappedProgress >= 85 ? "Đang kết nối..." : "Đang chờ...",
    },
  ];

  return (
    <section className="waiting-shell">
      <div className="waiting-overlay" />
      <article className="waiting-card">
        <header className="waiting-card-head">
          <span className="waiting-head-icon ai">
            <Bot className="h-7 w-7" />
          </span>
          <h2>Phòng chờ</h2>
          <p>AI đang chuẩn bị phiên phỏng vấn của bạn...</p>
        </header>

        <div className="waiting-card-body">
          <div className="waiting-step-list">
            {steps.map((item, idx) => {
              const status = statusByProgress(idx);
              return (
                <div key={item.title} className={`waiting-step ${status}`}>
                  <div className="waiting-step-icon">
                    {status === "done" ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : status === "active" ? (
                      <Loader2 className="h-5 w-5 waiting-spin" />
                    ) : (
                      <Bot className="h-5 w-5" />
                    )}
                  </div>
                  <div className="waiting-step-text">
                    <strong>{item.title}</strong>
                    <span>{item.subtitle}</span>
                  </div>
                  <span className="waiting-step-dot" />
                </div>
              );
            })}
          </div>

          <div className="waiting-progress-head">
            <span>Đang chuẩn bị...</span>
            <strong>{cappedProgress}%</strong>
          </div>
          <div className="waiting-progress-track">
            <span style={{ width: `${cappedProgress}%` }} />
          </div>

          <footer className="waiting-card-actions">
            <button type="button" className="waiting-ghost-btn" onClick={onBack} disabled={isPreparing}>
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </button>
            <button
              type="button"
              className="waiting-primary-btn"
              onClick={onStart}
              disabled={isPreparing || cappedProgress < 100}
              aria-disabled={isPreparing || cappedProgress < 100}
            >
              {isPreparing ? "Đang thiết lập phòng..." : "Vào phòng phỏng vấn"}
            </button>
          </footer>
        </div>
      </article>
    </section>
  );
}

function LiveStepScreen({
  isCvLocked,
  cvFile,
  cvOptions,
  onChangeCv,
  cameraOn,
  microOn,
  onToggleCamera,
  onToggleMic,
  positionTitle,
  isDark,
  jdTitle,
  remainingSeconds,
  question,
  activeQuestion,
  totalQuestions,
  questions,
  chatMessages,
  aiTyping,
  transcript,
  setTranscript,
  onSubmitAnswer,
  onEndInterview,
  userStream,
}) {
  const userVideoRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [aiAvatarError, setAiAvatarError] = useState(false);
  const aiAvatarSrc = "/AIBot.png";
  const [aiAvatarDisplaySrc, setAiAvatarDisplaySrc] = useState(aiAvatarSrc);
  const [aiBlinking, setAiBlinking] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const blinkTimersRef = useRef([]);
  const speakTimersRef = useRef([]);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (!userVideoRef.current) {
      return;
    }
    userVideoRef.current.srcObject = userStream ?? null;
  }, [userStream]);

  useEffect(() => {
    if (isRecording && !microOn) {
      setIsRecording(false);
    }
  }, [isRecording, microOn]);

  useEffect(() => {
    if (!isRecording) {
      return undefined;
    }
    setTranscript("");
    const seed = [
      "Em đã từng triển khai framework quản trị rủi ro CNTT cho ngân hàng số.",
      "Em tập trung vào kiểm soát, audit trail và KPI/KRI theo ISO 27001 và COBIT.",
      "Em phối hợp cùng Security và Engineering để giảm rủi ro vận hành.",
    ];
    let idx = 0;
    const timer = setInterval(() => {
      idx += 1;
      setTranscript(seed.slice(0, Math.min(seed.length, idx)).join(" "));
      if (idx >= seed.length) {
        clearInterval(timer);
      }
    }, 850);
    return () => clearInterval(timer);
  }, [isRecording, setTranscript]);

  useEffect(() => {
    // Crop transparent margins at runtime so facial region aligns better for clip-path animations.
    let cancelled = false;
    setAiAvatarError(false);
    setAiAvatarDisplaySrc(aiAvatarSrc);

    const cropTransparent = async () => {
      try {
        const img = new Image();
        img.decoding = "async";
        img.src = aiAvatarSrc;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });

        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        if (!w || !h) return;

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);

        const { data } = ctx.getImageData(0, 0, w, h);
        let minX = w;
        let minY = h;
        let maxX = 0;
        let maxY = 0;

        // Scan alpha channel for non-transparent pixels.
        for (let y = 0; y < h; y += 1) {
          const row = y * w * 4;
          for (let x = 0; x < w; x += 1) {
            const a = data[row + x * 4 + 3];
            if (a > 3) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        // If fully transparent (unexpected), keep original.
        if (minX >= maxX || minY >= maxY) return;

        const pad = Math.round(Math.min(w, h) * 0.02);
        minX = Math.max(0, minX - pad);
        minY = Math.max(0, minY - pad);
        maxX = Math.min(w - 1, maxX + pad);
        maxY = Math.min(h - 1, maxY + pad);

        const cw = Math.max(1, maxX - minX + 1);
        const ch = Math.max(1, maxY - minY + 1);
        const out = document.createElement("canvas");
        out.width = cw;
        out.height = ch;
        const outCtx = out.getContext("2d");
        if (!outCtx) return;
        outCtx.drawImage(canvas, minX, minY, cw, ch, 0, 0, cw, ch);

        const url = out.toDataURL("image/png");
        if (cancelled) return;
        setAiAvatarDisplaySrc(url);
      } catch {
        // Keep original asset if processing fails.
      }
    };

    cropTransparent();

    return () => {
      cancelled = true;
    };
  }, [aiAvatarSrc]);

  useEffect(() => {
    // Natural blink pattern: random interval + occasional double blink.
    const clearAll = () => {
      blinkTimersRef.current.forEach((t) => clearTimeout(t));
      blinkTimersRef.current = [];
    };
    clearAll();

    const scheduleNext = () => {
      const delay = 2200 + Math.round(Math.random() * 4200);
      const t = setTimeout(() => {
        setAiBlinking(true);
        const off = setTimeout(() => setAiBlinking(false), 140);
        blinkTimersRef.current.push(off);

        // 15% chance to double-blink.
        if (Math.random() < 0.15) {
          const t2 = setTimeout(() => {
            setAiBlinking(true);
            const off2 = setTimeout(() => setAiBlinking(false), 130);
            blinkTimersRef.current.push(off2);
          }, 240);
          blinkTimersRef.current.push(t2);
        }

        scheduleNext();
      }, delay);
      blinkTimersRef.current.push(t);
    };

    scheduleNext();
    return clearAll;
  }, []);

  useEffect(() => {
    // "Speaking" when question changes, plus light idle speaking so avatar doesn't look frozen.
    const clearAll = () => {
      speakTimersRef.current.forEach((t) => clearTimeout(t));
      speakTimersRef.current = [];
    };
    clearAll();

    const speakFor = (ms) => {
      setAiSpeaking(true);
      const off = setTimeout(() => setAiSpeaking(false), ms);
      speakTimersRef.current.push(off);
    };

    if (question) {
      speakFor(2400);
    }

    const loop = () => {
      const delay = 4200 + Math.round(Math.random() * 5200);
      const t = setTimeout(() => {
        speakFor(1200 + Math.round(Math.random() * 700));
        loop();
      }, delay);
      speakTimersRef.current.push(t);
    };
    loop();

    return clearAll;
  }, [question]);

  useEffect(() => {
    if (!chatEndRef.current) return;
    chatEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chatMessages, aiTyping]);

  const handleRecordClick = () => {
    if (!microOn) {
      window.dispatchEvent(
        new CustomEvent("aiia:notice", {
          detail: {
            tone: "warning",
            title: "Chưa bật Micro",
            message: "Hãy bật Micro để bắt đầu ghi âm/trả lời.",
          },
        }),
      );
      return;
    }
    if (isRecording) {
      setIsRecording(false);
      const safe = (transcript || "").trim() || "Câu trả lời demo (đã ghi âm).";
      onSubmitAnswer(safe);
      return;
    }
    setIsRecording(true);
  };

  const bgShell = isDark
    ? "bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-100"
    : "bg-gradient-to-b from-[#f4f8ff] via-[#f6faff] to-[#eef4fb] text-slate-900";
  const panel = isDark ? "bg-slate-900/60 border-slate-700/60" : "bg-white/80 border-slate-200";
  const panelSolid = isDark ? "bg-slate-950/40 border-slate-700/60" : "bg-white border-slate-200";
  const mutedText = isDark ? "text-slate-300" : "text-slate-700";
  // Square camera size: drive by width + aspect-ratio to avoid height % collapsing.
  const camSize = "clamp(220px, 30vh, 320px)";

  return (
    <section className={`min-h-screen ${bgShell}`}>
      <div className="mx-auto w-full max-w-none pl-6 pr-0 py-4">
        <header className={`flex items-center justify-between gap-4 rounded-2xl border px-5 py-3 shadow-sm ${panel}`}>
          <div className="min-w-0">
            <div className={`text-xs font-extrabold uppercase tracking-wider ${isDark ? "text-slate-300" : "text-slate-500"}`}>
              Phiên phỏng vấn
            </div>
            <div className="truncate text-lg font-extrabold">{positionTitle || jdTitle}</div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 shadow-sm ${panelSolid}`}>
              <Clock3 className="h-4 w-4 text-blue-600" />
              <span className="font-mono text-lg font-black tabular-nums">{formatTime(remainingSeconds)}</span>
            </div>
          </div>
        </header>

        <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="flex flex-col gap-5">
              <div className="rounded-2xl bg-gradient-to-r from-blue-500/50 via-indigo-500/45 to-emerald-400/45 p-[1px] shadow-sm">
                <div className={`relative overflow-hidden rounded-2xl border ${panelSolid}`}>
                  <div className={`flex items-center justify-between px-4 py-3 text-sm font-extrabold ${mutedText}`}>
                    <span>AI</span>
                    <span
                      className={`rounded-full bg-blue-500/10 px-2 py-1 text-xs font-black ${isDark ? "text-blue-200" : "text-blue-700"}`}
                    >
                      ONLINE
                    </span>
                  </div>
                  <div
                    className={`relative ${isDark ? "bg-slate-950/30" : "bg-slate-50"}`}
                    style={{ width: camSize, aspectRatio: "1 / 1", maxWidth: "100%", margin: "0 auto" }}
                  >
                    <div className="pointer-events-none absolute inset-0">
                      <div
                        className={`absolute -inset-10 aiia-ai-glow blur-3xl ${
                          isDark
                            ? "bg-gradient-to-r from-blue-500/25 via-indigo-500/20 to-emerald-400/15"
                            : "bg-gradient-to-r from-blue-500/20 via-indigo-500/18 to-emerald-400/14"
                        }`}
                        aria-hidden="true"
                      />
                      <div
                        className={`absolute inset-0 ${
                          isDark ? "bg-gradient-to-t from-slate-950/35 via-transparent to-transparent" : "bg-gradient-to-t from-white/40 via-transparent to-transparent"
                        }`}
                        aria-hidden="true"
                      />
                    </div>

                    <div className="absolute inset-0 grid place-items-center">
                      {!aiAvatarError ? (
                        <div className="relative grid place-items-center px-10">
                          <div
                            className={`relative inline-block h-[78%] select-none ${
                              aiBlinking ? "aiia-ai-blink" : ""
                            } ${aiSpeaking ? "aiia-ai-speaking" : ""} aiia-ai-float`}
                            style={{
                              // Tuned for AIBot.png after trimming transparent margins.
                              ["--aiia-face-left"]: "20%",
                              ["--aiia-face-right"]: "16%",
                              ["--aiia-eye-top"]: "14%",
                              ["--aiia-eye-bottom"]: "72%",
                              ["--aiia-mouth-top"]: "30%",
                              ["--aiia-mouth-bottom"]: "48%",
                            }}
                          >
                            <img
                              src={aiAvatarDisplaySrc}
                              alt="AI Avatar"
                              className={`block h-full w-auto object-contain drop-shadow-sm ${isDark ? "opacity-95" : "opacity-90"}`}
                              draggable={false}
                              onError={() => setAiAvatarError(true)}
                            />
                            <img
                              src={aiAvatarDisplaySrc}
                              alt=""
                              className="aiia-ai-layer aiia-ai-eyes"
                              aria-hidden="true"
                              draggable={false}
                            />
                            <img
                              src={aiAvatarDisplaySrc}
                              alt=""
                              className="aiia-ai-layer aiia-ai-mouth"
                              aria-hidden="true"
                              draggable={false}
                            />
                          </div>
                        <div className={`mt-3 text-xs font-black tracking-wider ${isDark ? "text-slate-300" : "text-slate-500"}`}>AI INTERVIEW</div>
                        </div>
                      ) : (
                        <div className="grid place-items-center">
                          <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-sm" />
                          <div className={`mt-3 text-xs font-black tracking-wider ${isDark ? "text-slate-300" : "text-slate-500"}`}>AI INTERVIEW</div>
                        </div>
                      )}
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 flex items-end justify-center gap-1 opacity-70">
                      {Array.from({ length: 18 }).map((_, idx) => (
                        <span
                          key={idx}
                          className={`w-1 rounded-full ${isDark ? "bg-blue-300/70" : "bg-blue-500/50"}`}
                          style={{ height: `${8 + ((idx * 7) % 18)}px`, animation: "pulse 1.2s ease-in-out infinite" }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className={`overflow-hidden rounded-2xl border shadow-sm ${panelSolid}`}>
                <div className={`flex items-center justify-between px-4 py-3 text-sm font-extrabold ${mutedText}`}>
                  <span>Ứng viên</span>
                  <span
                    className={`text-xs font-black ${
                      cameraOn ? "text-emerald-600" : isDark ? "text-slate-300" : "text-slate-500"
                    }`}
                  >
                    {cameraOn ? "CAM ON" : "CAM OFF"}
                  </span>
                </div>
                <div
                  className={`relative ${isDark ? "bg-slate-950/30" : "bg-slate-50"}`}
                  style={{ width: camSize, aspectRatio: "1 / 1", maxWidth: "100%", margin: "0 auto" }}
                >
                  <video ref={userVideoRef} autoPlay muted playsInline className={`absolute inset-0 h-full w-full object-cover ${cameraOn ? "" : "hidden"}`} />
                  {!cameraOn ? (
                    <div className="absolute inset-0 grid place-items-center">
                      <div className="grid place-items-center gap-3">
                        <CameraOff className="h-10 w-10 text-slate-400" />
                        <div className={`text-sm font-extrabold ${isDark ? "text-slate-200" : "text-slate-500"}`}>Camera đang tắt</div>
                      </div>
                    </div>
                  ) : null}
                  {cameraOn && !userStream ? (
                    <div className="absolute inset-0 grid place-items-center">
                      <div className="grid place-items-center gap-3">
                        <Camera className="h-10 w-10 text-slate-400" />
                        <div className={`text-sm font-extrabold ${isDark ? "text-slate-200" : "text-slate-500"}`}>Camera Preview</div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className={`mt-5 flex flex-wrap items-center gap-4 rounded-2xl border px-5 py-4 shadow-sm ${panel}`}>
              <div className="flex items-center gap-4">
                <div className="relative">
                  {isRecording ? <span className="absolute inset-0 -z-10 rounded-full bg-emerald-400/20 animate-ping" /> : null}
                  <button
                    type="button"
                    onClick={handleRecordClick}
                    disabled={!microOn}
                    aria-disabled={!microOn}
                    className={`grid h-16 w-16 place-items-center rounded-full border shadow-sm transition ${
                      isRecording ? "border-emerald-500 bg-emerald-500 text-white" : "border-emerald-600/40 bg-emerald-500/10 text-emerald-700"
                    } ${!microOn ? "opacity-50 cursor-not-allowed" : "hover:shadow"} `}
                    title={isRecording ? "Dừng & gửi câu trả lời" : "Bắt đầu ghi âm/trả lời"}
                  >
                    {isRecording ? <MicOff className="h-7 w-7" /> : <Mic className="h-7 w-7" />}
                  </button>
                </div>
              </div>

              <div className={`min-w-0 flex-1 ${mutedText}`}>
                <div className={`text-xs font-black ${isDark ? "text-slate-300" : "text-slate-500"}`}>Live Transcript</div>
                <div className="truncate text-sm font-semibold">
                  {transcript ? transcript : "Nội dung ứng viên đang nói sẽ chạy thời gian thực ở đây..."}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onToggleCamera}
                  title={cameraOn ? "Tắt Camera" : "Bật Camera"}
                  className={`grid h-11 w-11 place-items-center rounded-xl border transition ${panelSolid} hover:shadow-sm`}
                  aria-pressed={cameraOn}
                >
                  {cameraOn ? <Camera className="h-5 w-5" /> : <CameraOff className="h-5 w-5" />}
                </button>
                <button
                  type="button"
                  onClick={onToggleMic}
                  title={microOn ? "Tắt Mic" : "Bật Mic"}
                  className={`grid h-11 w-11 place-items-center rounded-xl border transition ${panelSolid} hover:shadow-sm`}
                  aria-pressed={microOn}
                >
                  {microOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </button>
              </div>

              <button
                type="button"
                onClick={onEndInterview}
                className={`rounded-xl border px-4 py-3 text-sm font-black shadow-sm transition ${
                  isDark
                    ? "border-rose-500/35 bg-rose-500/10 text-rose-200 hover:bg-rose-500/15"
                    : "border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100"
                }`}
              >
                Kết thúc phỏng vấn
              </button>
            </div>
          </div>

          <aside className="lg:col-span-7">
            <div className={`rounded-l-2xl rounded-r-none border p-5 shadow-sm ${panel}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-base font-extrabold">Chat phỏng vấn</div>
                  <div className={`mt-1 text-xs font-black ${isDark ? "text-slate-300" : "text-slate-500"}`}>
                    Câu {activeQuestion + 1}/{totalQuestions}
                  </div>
                </div>
                <div className={`inline-flex max-w-[60%] items-center gap-2 rounded-full border px-3 py-2 text-xs font-extrabold ${panelSolid}`} title={cvFile || ""}>
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="truncate">Hồ sơ: {cvFile || "Nguyen_Quang_Anh_CV.pdf"}</span>
                </div>
              </div>

              <div className={`mt-4 flex h-[calc(100vh-210px)] min-h-[360px] flex-col overflow-hidden rounded-2xl border ${panelSolid}`}>
                <div className={`flex-1 space-y-3 overflow-y-auto px-4 py-4 ${isDark ? "bg-slate-950/10" : "bg-white/40"}`}>
                  {(Array.isArray(chatMessages) ? chatMessages : []).map((msg) => {
                    const isAi = msg?.sender === "ai";
                    const bubbleBase = "max-w-[88%] rounded-2xl px-3 py-2 text-sm font-semibold leading-relaxed shadow-sm";
                    const aiBubble = isDark ? "bg-slate-950/40 text-slate-100 border border-slate-700/50 rounded-bl-md" : "bg-white text-slate-900 border border-slate-200 rounded-bl-md";
                    const userBubble = "bg-blue-600 text-white border border-blue-600 rounded-br-md";
                    const timeCls = isDark ? "text-slate-400" : "text-slate-500";

                    return isAi ? (
                      <div key={msg.id} className="flex items-end gap-2">
                        <div className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-xl bg-blue-600 text-white shadow-sm">
                          <Bot className="h-4 w-4" />
                        </div>
                        <div className={`${bubbleBase} ${aiBubble}`}>
                          <div className="whitespace-pre-wrap break-words">{msg.text}</div>
                          <div className={`mt-1 text-[11px] font-black ${timeCls}`}>{msg.time || ""}</div>
                        </div>
                      </div>
                    ) : (
                      <div key={msg.id} className="flex justify-end">
                        <div className={`${bubbleBase} ${userBubble}`}>
                          <div className="whitespace-pre-wrap break-words">{msg.text}</div>
                          <div className="mt-1 flex items-center justify-end gap-2 text-[11px] font-black text-white/80">
                            <span>{msg.time || ""}</span>
                            <span className="rounded-full bg-white/15 px-2 py-0.5">Đã gửi</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {aiTyping ? (
                    <div className="flex items-end gap-2">
                      <div className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-xl bg-blue-600 text-white shadow-sm">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className={`rounded-2xl rounded-bl-md border px-3 py-2 shadow-sm ${isDark ? "border-slate-700/50 bg-slate-950/40" : "border-slate-200 bg-white"}`}>
                        <div className="flex items-center gap-1">
                          <span className={`h-2 w-2 animate-bounce rounded-full ${isDark ? "bg-slate-300/70" : "bg-slate-400"}`} style={{ animationDelay: "0ms" }} />
                          <span className={`h-2 w-2 animate-bounce rounded-full ${isDark ? "bg-slate-300/70" : "bg-slate-400"}`} style={{ animationDelay: "120ms" }} />
                          <span className={`h-2 w-2 animate-bounce rounded-full ${isDark ? "bg-slate-300/70" : "bg-slate-400"}`} style={{ animationDelay: "240ms" }} />
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div ref={chatEndRef} />
                </div>

                <div className={`border-t px-4 py-3 text-xs font-semibold ${isDark ? "border-slate-700/60 text-slate-300" : "border-slate-200 text-slate-600"}`}>
                  Mẹo: Nhấn nút Micro để ghi âm. Khi dừng ghi âm, câu trả lời sẽ được gửi vào chat.
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

export default function InterviewWizardPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const urlParams = useMemo(() => new URLSearchParams(location.search), [location.search]);

  const [role, setRole] = useState("candidate");
  const [step, setStep] = useState(0);
  const [cvFile, setCvFile] = useState("");
  const [jdTitle, setJdTitle] = useState("Senior IT Risk - Techcombank");
  const [fixedJobId, setFixedJobId] = useState(() => urlParams.get("job") || "");
  const [lockCv, setLockCv] = useState(() => urlParams.get("lockCv") === "1");
  const [cameraOn, setCameraOn] = useState(true);
  const [microOn, setMicroOn] = useState(true);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [sessionQuestions, setSessionQuestions] = useState(INTERVIEW_QUESTIONS);
  const [chatMessages, setChatMessages] = useState([]);
  const [aiTyping, setAiTyping] = useState(false);
  const [simulationMode, setSimulationMode] = useState("mock-general");
  const [isPreparingInterview, setIsPreparingInterview] = useState(false);
  const [isProcessingResult, setIsProcessingResult] = useState(false);
  const [theme, setTheme] = useState(getInitialTheme);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [prepProgress, setPrepProgress] = useState(53);
  const [availableCameras, setAvailableCameras] = useState([]);
  const [availableMics, setAvailableMics] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");
  const [selectedMicId, setSelectedMicId] = useState("");
  const cvInputRef = useRef(null);
  const previewVideoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const [userStream, setUserStream] = useState(null);
  const mediaConfigKeyRef = useRef("");
  const chatTimersRef = useRef([]);

  const currentQuestions = sessionQuestions.length ? sessionQuestions : INTERVIEW_QUESTIONS;
  const remainingSeconds = Math.max(0, INTERVIEW_DURATION_SECONDS - sessionSeconds);
  const firstQuestion = currentQuestions[0] || "";

  const formatChatTime = (date = new Date()) => {
    try {
      return new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" }).format(date);
    } catch {
      const h = String(date.getHours()).padStart(2, "0");
      const m = String(date.getMinutes()).padStart(2, "0");
      return `${h}:${m}`;
    }
  };

  const makeChatId = () => {
    try {
      return crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
    } catch {
      return `${Date.now()}-${Math.random()}`;
    }
  };

  const pushChat = (sender, text) => {
    const clean = String(text || "").trim();
    if (!clean) return;
    setChatMessages((prev) => [
      ...prev,
      { id: makeChatId(), sender, text: clean, time: formatChatTime(new Date()) },
    ]);
  };

  const cvOptions = useMemo(() => {
    const stored = readStorageArray(CUSTOM_CV_STORAGE_KEY);
    const rows = Array.isArray(stored) ? stored : [];
    const demo = [
      { id: "CV-2026-001", name: "Nguyen_Quang_Anh_CV.pdf", updatedAt: "24/03/2026" },
      { id: "CV-2026-002", name: "Nguyen_Quang_Anh_CV_English.pdf", updatedAt: "20/03/2026" },
    ];

    const merged = rows.length ? rows : demo;
    return merged.map((row) => ({
      id: row.id || row.name,
      name: row.name,
      updatedAt: row.updatedAt || "",
    }));
  }, []);

  useEffect(() => {
    const roleParam = urlParams.get("role");
    const modeParam = urlParams.get("mode");
    const jobIdParam = urlParams.get("job");
    const jobTitleParam = urlParams.get("jobTitle");
    const sessionIdParam = urlParams.get("sessionId");
    const cvIdParam = urlParams.get("cv");
    const cvNameParam = urlParams.get("cvName");
    const lockCvParam = urlParams.get("lockCv");

    if (roleParam && VALID_ROLES.includes(roleParam)) {
      setRole(roleParam);
    }
    if (modeParam) {
      setSimulationMode(modeParam);
    }
    setLockCv(lockCvParam === "1");
    setFixedJobId(jobIdParam || "");

    // Resolve CV to a known option when possible (id -> name).
    const resolvedCvName =
      cvNameParam ||
      (cvIdParam ? cvOptions.find((row) => String(row.id) === String(cvIdParam))?.name : "") ||
      "";
    if (resolvedCvName) {
      setCvFile(resolvedCvName);
    } else if (!lockCvParam) {
      // Default for practice flows.
      setCvFile((previous) => previous || cvOptions[0]?.name || "");
    }
    if (sessionIdParam) {
      const practiceSession = getSessionById(sessionIdParam);
      const generatedQuestions = practiceSession?.questions;
      if (Array.isArray(generatedQuestions) && generatedQuestions.length) {
        setSessionQuestions(generatedQuestions);
      } else {
        setSessionQuestions(INTERVIEW_QUESTIONS);
      }
      if (!jobTitleParam && practiceSession?.jdTitle) {
        const practiceLabel = practiceSession.company
          ? `${practiceSession.jdTitle} - ${practiceSession.company}`
          : practiceSession.jdTitle;
        setJdTitle(practiceLabel);
      }
    } else {
      setSessionQuestions(INTERVIEW_QUESTIONS);
    }

    if (jobTitleParam) {
      setJdTitle(jobTitleParam);
    } else if (jobIdParam) {
      const jobData = findJobPostingById(jobIdParam);
      if (jobData) {
        setJdTitle(`${jobData.title} - ${jobData.company}`);
      }
    }

    if (jobIdParam) {
      setSelectedJobId(jobIdParam);
    } else {
      setSelectedJobId((previous) => previous || "");
    }
  }, [cvOptions, location.search, urlParams]);

  useEffect(() => {
    if (step !== 3 || isProcessingResult) {
      return undefined;
    }
    const timer = setInterval(() => {
      setSessionSeconds((previous) => previous + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [step, isProcessingResult]);

  useEffect(() => {
    if (step !== 3 || isProcessingResult) {
      return;
    }
    if (remainingSeconds <= 0) {
      setIsProcessingResult(true);
    }
  }, [isProcessingResult, remainingSeconds, step]);

  useEffect(() => {
    if (step !== 2) {
      return undefined;
    }
    setPrepProgress(53);
    const timer = setInterval(() => {
      setPrepProgress((previous) => {
        if (previous >= 100) {
          return 100;
        }
        const delta = previous < 75 ? 3 : 2;
        return Math.min(100, previous + delta);
      });
    }, 420);
    return () => clearInterval(timer);
  }, [step]);

  useEffect(() => {
    if (step !== 3) {
      setAiTyping(false);
      return;
    }

    setChatMessages((prev) => {
      if (prev.length) return prev;
      const now = new Date();
      const time = formatChatTime(now);
      return [
        { id: makeChatId(), sender: "ai", text: "Chào bạn, mình là AI Interviewer. Bắt đầu nhé.", time },
        {
          id: makeChatId(),
          sender: "ai",
          text: firstQuestion || "Mời bạn giới thiệu ngắn gọn về bản thân và kinh nghiệm phù hợp với vị trí này.",
          time,
        },
      ];
    });
  }, [step, firstQuestion]);

  useEffect(() => {
    return subscribeTheme(setTheme);
  }, []);

  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      chatTimersRef.current.forEach((t) => clearTimeout(t));
      chatTimersRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices) {
      return undefined;
    }
    // Only start media preview from Step 2 onward. Step 3/4 should reuse the same stream when possible.
    if (step === 0) {
      return undefined;
    }
    if (step === 2) {
      return undefined;
    }

    const configKey = JSON.stringify({
      cameraOn,
      microOn,
      selectedCameraId: selectedCameraId || "",
      selectedMicId: selectedMicId || "",
    });

    // Avoid restarting stream on step transitions if nothing changed; but do restart when toggles change.
    if (mediaStreamRef.current && mediaConfigKeyRef.current === configKey) {
      setUserStream(mediaStreamRef.current);
      if (previewVideoRef.current) {
        previewVideoRef.current.srcObject = mediaStreamRef.current;
      }
      return undefined;
    }

    const stopExisting = () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      setUserStream(null);
      if (previewVideoRef.current) {
        previewVideoRef.current.srcObject = null;
      }
    };

    const attachStreamToPreview = (stream) => {
      if (previewVideoRef.current) {
        previewVideoRef.current.srcObject = stream;
      }
    };

    const enumerate = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cams = devices.filter((d) => d.kind === "videoinput");
        const mics = devices.filter((d) => d.kind === "audioinput");
        setAvailableCameras(cams);
        setAvailableMics(mics);
        if (!selectedCameraId && cams[0]?.deviceId) {
          setSelectedCameraId(cams[0].deviceId);
        }
        if (!selectedMicId && mics[0]?.deviceId) {
          setSelectedMicId(mics[0].deviceId);
        }
      } catch {
        // ignore
      }
    };

    const startPreview = async () => {
      stopExisting();
      if (!cameraOn && !microOn) {
        enumerate();
        return;
      }
      try {
        const constraints = {
          video: cameraOn ? (selectedCameraId ? { deviceId: { exact: selectedCameraId } } : true) : false,
          audio: microOn ? (selectedMicId ? { deviceId: { exact: selectedMicId } } : true) : false,
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        mediaStreamRef.current = stream;
        setUserStream(stream);
        mediaConfigKeyRef.current = configKey;
        attachStreamToPreview(stream);
        enumerate();
      } catch {
        enumerate();
      }
    };

    startPreview();

    return undefined;
  }, [cameraOn, microOn, selectedCameraId, selectedMicId, step]);

  const startResultProcessing = () => {
    if (isProcessingResult) {
      return;
    }

    const jobId = fixedJobId || selectedJobId || "";
    const jobData = jobId ? findJobPostingById(jobId) : null;
    const score = typeof jobData?.cvFit === "number" ? jobData.cvFit : 82;
    const createdAt = new Date().toISOString();
    const durationSeconds = Math.max(60, Number.isFinite(sessionSeconds) ? sessionSeconds : 0);
    const jdMatch = Math.max(0, Math.min(100, (typeof jobData?.cvFit === "number" ? jobData.cvFit : score) + 3));
    const logic = Math.max(0, Math.min(100, score - 12));
    const confidence = Math.max(0, Math.min(100, score + 8));
    writeLastInterviewResult({
      id: `RES-${Math.random().toString(16).slice(2, 10)}`,
      role,
      jobId,
      jdTitle,
      cvFile,
      score,
      createdAt,
      durationSeconds,
      components: {
        jdMatch,
        logic,
        confidence,
      },
    });

    setIsProcessingResult(true);
  };

  const finishResultProcessing = () => {
    setIsProcessingResult(false);
    navigate(`/ket-qua-phong-van?role=${role}`);
  };

  const submitAnswer = (answerText) => {
    const isLastQuestion = activeQuestion >= currentQuestions.length - 1;
    pushChat("user", answerText);
    setLiveTranscript("");
    if (isLastQuestion) {
      startResultProcessing();
      return;
    }
    const nextIndex = activeQuestion + 1;
    setActiveQuestion((previous) => previous + 1);
    setAiTyping(true);
    const nextQuestion = currentQuestions[Math.min(nextIndex, currentQuestions.length - 1)] || "";
    const t = setTimeout(() => {
      pushChat("ai", nextQuestion);
      setAiTyping(false);
    }, 650);
    chatTimersRef.current.push(t);
  };

  const goBackDashboard = () => {
    if (fixedJobId) {
      navigate(`/dashboard?role=${role}&screen=jobMatch&job=${fixedJobId}`);
      return;
    }
    navigate(`/dashboard?role=${role}`);
  };

  const finishInterviewPreparation = () => {
    setIsPreparingInterview(false);
    setSessionSeconds(0);
    setActiveQuestion(0);
    setLiveTranscript("");
    setChatMessages([]);
    setAiTyping(false);
    setStep(3);
  };

  const startInterview = () => {
    if (isPreparingInterview) {
      return;
    }
    setIsPreparingInterview(true);
  };

  const handlePickCvFile = (file) => {
    if (!file) {
      return;
    }
    const filename = file.name || String(file);
    setCvFile(filename);
    addCustomCvToLibrary(filename);
  };

  const renderStep = () => {
    if (step === 0) {
      const lockJd = Boolean(fixedJobId) || simulationMode === "job-focused";
      const cvLocked = Boolean(lockCv);
      const effectiveJobId = lockJd ? fixedJobId : selectedJobId;
      const jobOptions = JOB_POSTINGS.map((job) => ({
        id: job.id,
        label: `${job.title} - ${job.company}`,
      }));
      const selectedJob = effectiveJobId ? findJobPostingById(effectiveJobId) : null;
      const canContinue = Boolean(cvFile.trim()) && (lockJd ? Boolean(jdTitle.trim()) : Boolean(effectiveJobId));
      return (
        <section className="wizard-card wizard-card-lg">
          <div className="wizard-card-head">
            <h1>Tải hồ sơ cho phiên phỏng vấn</h1>
            <p>
              Nhập CV và JD để hệ thống chuẩn bị kịch bản phù hợp. Chế độ hiện tại:
              <strong> {SIMULATION_LABEL[simulationMode] ?? "Giả lập tổng quát"}</strong>.
            </p>
          </div>

          <div className="wizard-grid two-col wizard-upload-grid">
            <section className="wizard-block">
              <header className="wizard-block-head">
                <strong>Tải CV</strong>
                <span>CV sẽ được dùng để cá nhân hóa câu hỏi và đánh giá.</span>
              </header>

              {cvFile ? (
                <div className="wizard-file-card">
                  <FileText className="h-5 w-5" />
                  <div className="wizard-file-meta">
                    <strong title={cvFile}>{cvFile}</strong>
                    <span>{cvLocked ? "Đã khóa theo phiên so sánh gần nhất" : "Đã sẵn sàng"}</span>
                  </div>
                  {!cvLocked ? (
                    <button type="button" className="wizard-file-remove" onClick={() => setCvFile("")} title="Xóa file">
                      <X className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              ) : (
                <button
                  type="button"
                  className={`wizard-dropzone ${cvLocked ? "locked" : ""}`}
                  onClick={() => cvInputRef.current?.click()}
                  onDragOver={(e) => {
                    if (cvLocked) return;
                    e.preventDefault();
                  }}
                  onDrop={(e) => {
                    if (cvLocked) return;
                    e.preventDefault();
                    const file = e.dataTransfer?.files?.[0];
                    handlePickCvFile(file);
                  }}
                  disabled={cvLocked}
                >
                  <Upload className="h-6 w-6" />
                  <div>
                    <strong>Kéo thả CV hoặc Bấm để tải lên</strong>
                    <span>Hỗ trợ PDF, DOCX. Dung lượng tối đa 10MB.</span>
                  </div>
                </button>
              )}

              <input
                ref={cvInputRef}
                type="file"
                accept=".pdf,.doc,.docx,application/pdf"
                style={{ display: "none" }}
                onChange={(e) => handlePickCvFile(e.target.files?.[0])}
                disabled={cvLocked}
              />

              {!cvLocked ? (
                <div className="wizard-subselect">
                  <span>Hoặc chọn từ CV của tôi</span>
                  <select value={cvFile} onChange={(event) => setCvFile(event.target.value)}>
                    <option value="" disabled>
                      Chọn CV đã có...
                    </option>
                    {cvOptions.map((row) => (
                      <option key={row.id} value={row.name}>
                        {row.name}
                        {row.updatedAt ? ` • ${row.updatedAt}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </section>

            <section className="wizard-block">
              <header className="wizard-block-head">
                <strong>Chọn JD</strong>
                <span>AI sẽ dựng kịch bản theo vị trí và yêu cầu của doanh nghiệp.</span>
              </header>

              <div className="wizard-input-box wizard-select-box">
                <select
                  value={effectiveJobId || ""}
                  disabled={lockJd}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    setSelectedJobId(nextId);
                    const job = findJobPostingById(nextId);
                    if (job) {
                      setJdTitle(`${job.title} - ${job.company}`);
                    }
                  }}
                >
                  <option value="" disabled>
                    Chọn vị trí/JD...
                  </option>
                  {jobOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {selectedJob ? (
                <article className="wizard-info-card">
                  <div className="wizard-info-row">
                    <span>Công ty</span>
                    <strong>{selectedJob.company}</strong>
                  </div>
                  <div className="wizard-info-row">
                    <span>Yêu cầu chính</span>
                    <strong title={(selectedJob.requirements || []).join(" • ")}>
                      {(selectedJob.requirements || []).slice(0, 2).join(" • ") || "Đang cập nhật"}
                    </strong>
                  </div>
                </article>
              ) : (
                <article className="wizard-info-card subtle">
                  <div className="wizard-info-row">
                    <span>Gợi ý</span>
                    <strong>Chọn một JD để xem tóm tắt yêu cầu ngay tại đây.</strong>
                  </div>
                </article>
              )}
            </section>
          </div>

          <div className="wizard-actions">
            <Button variant="ghost" onClick={goBackDashboard}>
              Quay lại
            </Button>
            <Button onClick={() => setStep(1)} disabled={!canContinue}>
              Tiếp tục
            </Button>
          </div>
        </section>
      );
    }

    if (step === 1) {
      return (
        <section className="wizard-card wizard-card-lg">
          <div className="wizard-card-head">
            <h1>Thiết lập thiết bị</h1>
            <p>
              Kiểm tra camera và microphone trước khi vào phòng chờ. Nếu bạn không cấp quyền, hệ thống vẫn có thể chạy
              demo bằng placeholder.
            </p>
          </div>

          <div className="wizard-device-layout">
            <section className="wizard-preview-card">
              <div className="wizard-preview-head">
                <strong>Video Preview</strong>
                <span>Tỷ lệ 16:9</span>
              </div>
              <div className={`wizard-preview ${cameraOn ? "" : "off"}`}>
                <video ref={previewVideoRef} autoPlay muted playsInline />
                {!cameraOn ? <div className="wizard-preview-placeholder">Camera đang tắt</div> : null}
                {cameraOn && !userStream ? <div className="wizard-preview-placeholder subtle">Preview camera</div> : null}
              </div>

              <div className="wizard-audio-head">
                <strong>Mic Test</strong>
                <span>{microOn ? "Đang ghi nhận tín hiệu" : "Micro đang tắt"}</span>
              </div>
              <div className={`wizard-audio-bars ${microOn ? "" : "off"}`}>
                {Array.from({ length: 14 }).map((_, idx) => (
                  <span key={idx} style={{ animationDelay: `${idx * 0.08}s` }} />
                ))}
              </div>
            </section>

            <section className="wizard-device-panel">
              <article className="wizard-device">
                <div className="wizard-device-head">
                  <Camera className="h-4 w-4" />
                  <strong>Camera</strong>
                </div>
                <select value={selectedCameraId} onChange={(e) => setSelectedCameraId(e.target.value)} disabled={!cameraOn}>
                  {availableCameras.length ? null : (
                    <option value="">{cameraOn ? "Đang tải danh sách camera..." : "Camera đang tắt"}</option>
                  )}
                  {availableCameras.map((device, index) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Camera ${index + 1}`}
                    </option>
                  ))}
                </select>
                <button type="button" className={`wizard-toggle ${cameraOn ? "on" : ""}`} onClick={() => setCameraOn((v) => !v)}>
                  {cameraOn ? "Bật" : "Tắt"}
                </button>
              </article>

              <article className="wizard-device">
                <div className="wizard-device-head">
                  <Mic className="h-4 w-4" />
                  <strong>Microphone</strong>
                </div>
                <select value={selectedMicId} onChange={(e) => setSelectedMicId(e.target.value)} disabled={!microOn}>
                  {availableMics.length ? null : (
                    <option value="">{microOn ? "Đang tải danh sách micro..." : "Micro đang tắt"}</option>
                  )}
                  {availableMics.map((device, index) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Micro ${index + 1}`}
                    </option>
                  ))}
                </select>
                <button type="button" className={`wizard-toggle ${microOn ? "on" : ""}`} onClick={() => setMicroOn((v) => !v)}>
                  {microOn ? "Bật" : "Tắt"}
                </button>
              </article>
            </section>
          </div>

          <div className="wizard-actions">
            <Button variant="ghost" onClick={() => setStep(0)}>
              Quay lại
            </Button>
            <Button onClick={() => setStep(2)}>Vào phòng chờ</Button>
          </div>
        </section>
      );
    }

    if (step === 2) {
      return (
        <WaitingStepScreen
          onBack={() => setStep(1)}
          onStart={startInterview}
          isPreparing={isPreparingInterview}
          progress={prepProgress}
        />
      );
    }

    return (
      <LiveStepScreen
        isCvLocked={Boolean(lockCv)}
        cvFile={cvFile}
        cvOptions={cvOptions}
        onChangeCv={setCvFile}
        cameraOn={cameraOn}
        microOn={microOn}
        onToggleCamera={() => setCameraOn((v) => !v)}
        onToggleMic={() => setMicroOn((v) => !v)}
        positionTitle={(jdTitle || "").split(" - ")[0]}
        isDark={theme === "dark"}
        jdTitle={jdTitle}
        remainingSeconds={remainingSeconds}
        question={currentQuestions[Math.min(activeQuestion, currentQuestions.length - 1)]}
        activeQuestion={activeQuestion}
        totalQuestions={currentQuestions.length}
        questions={currentQuestions}
        chatMessages={chatMessages}
        aiTyping={aiTyping}
        transcript={liveTranscript}
        setTranscript={setLiveTranscript}
        onSubmitAnswer={(answer) => submitAnswer(answer)}
        onEndInterview={startResultProcessing}
        userStream={userStream}
      />
    );
  };

  return (
    <main className={`interview-legacy interview-wizard theme-${theme} ${step >= 2 ? "immersive" : ""}`}>
         <header className={`wizard-stepper-wrap ${step >= 2 ? "floating" : ""} relative`}>
           <div className="wizard-stepper">
             {INTERVIEW_WIZARD_STEPS.map((label, index) => (
               <div key={label} className={`wizard-step ${index === step ? "active" : ""} ${index < step ? "done" : ""}`}>
                 <span>{index < step ? <Check className="h-4 w-4" /> : index + 1}</span>
                 <p>{label}</p>
               </div>
             ))}
           </div>
           <div className="absolute right-4 top-1/2 z-40 -translate-y-1/2">
             <ThemeToggleButton compact />
           </div>
         </header>

      <div className="wizard-content">{renderStep()}</div>
      <InterviewPrepOverlay isOpen={isPreparingInterview} onComplete={finishInterviewPreparation} />
      <PostInterviewProcessingScreen isOpen={isProcessingResult} onComplete={finishResultProcessing} />
    </main>
  );
}
