import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Bell,
  BriefcaseBusiness,
  FileText,
  LayoutDashboard,
  Moon,
  Plus,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Sun,
  UserRound,
  Users,
  WandSparkles,
  X,
} from "lucide-react";
import {
  getStoredTheme,
  setStoredTheme,
  subscribeTheme,
} from "../../../utils/themeController";

const MENUS = [
  { id: "dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { id: "jobs", label: "Danh sách JD", icon: BriefcaseBusiness },
  { id: "applicants", label: "Danh sách ứng viên", icon: Users },
  { id: "reports", label: "Lịch sử phỏng vấn", icon: FileText },
];

const VIEW_BY_MENU = {
  dashboard: "dashboard",
  jobs: "job-list",
  applicants: "candidate-list",
  reports: "report-list",
  settings: "settings",
};
const DETAIL_MENU_BY_TYPE = {
  "job-detail": "jobs",
  analytics: "jobs",
  ranking: "jobs",
  profile: "applicants",
};

const STATUS_OPTIONS = ["Đang mở", "Đóng", "Nháp"];

const INITIAL_JOBS = [
  {
    id: "jd01",
    title: "Senior Frontend Engineer",
    dept: "Kỹ thuật",
    level: "Senior",
    salary: "35 - 50 triệu",
    date: "2026-03-24",
    status: "Đang mở",
    total: 42,
    description: "Phát triển dashboard SaaS, tối ưu hiệu năng.",
    hardSkills: ["React", "TypeScript", "Performance"],
    softSkills: ["Giao tiếp", "Làm việc nhóm"],
  },
  {
    id: "jd02",
    title: "Product Designer",
    dept: "Sản phẩm",
    level: "Middle",
    salary: "28 - 40 triệu",
    date: "2026-03-20",
    status: "Đang mở",
    total: 26,
    description: "Thiết kế trải nghiệm sản phẩm end-to-end.",
    hardSkills: ["Figma", "UX Research", "Design System"],
    softSkills: ["Tư duy người dùng", "Kể chuyện sản phẩm"],
  },
  {
    id: "jd03",
    title: "Data Analyst",
    dept: "Dữ liệu",
    level: "Middle",
    salary: "25 - 38 triệu",
    date: "2026-03-16",
    status: "Đóng",
    total: 31,
    description: "Phân tích dữ liệu kinh doanh và trình bày insight.",
    hardSkills: ["SQL", "Power BI", "Python"],
    softSkills: ["Phân tích", "Trình bày dữ liệu"],
  },
];

const INITIAL_CANDIDATES = [
  {
    id: "uv01",
    name: "Nguyễn Minh Anh",
    jobId: "jd01",
    exp: "5 năm",
    ai: 92,
    match: 89,
    email: "minhanh@mail.com",
    phone: "0901 567 222",
    matchedSkills: ["React", "TypeScript", "Performance"],
    missingSkills: ["Testing E2E"],
    potential: "Có tiềm năng dẫn dắt nhóm kỹ thuật.",
    strengths: ["Tư duy hệ thống", "Giải quyết vấn đề tốt"],
    improvements: ["Bổ sung KPI định lượng"],
    activityHistory: [
      "Quan tâm JD Frontend - 20/03/2026",
      "Mock interview - 26/03/2026",
    ],
  },
  {
    id: "uv02",
    name: "Trần Bảo Châu",
    jobId: "jd02",
    exp: "4 năm",
    ai: 84,
    match: 81,
    email: "baochau@mail.com",
    phone: "0908 321 456",
    matchedSkills: ["Figma", "UX Research"],
    missingSkills: ["Design System quy mô lớn"],
    potential: "Phát triển tốt ở vai trò Product Designer.",
    strengths: ["Portfolio rõ ràng", "Hiểu người dùng"],
    improvements: ["Bổ sung kết quả impact"],
    activityHistory: [
      "Quan tâm JD Product Designer - 19/03/2026",
      "Interview mô phỏng - 23/03/2026",
    ],
  },
  {
    id: "uv03",
    name: "Lê Thành Long",
    jobId: "jd03",
    exp: "3 năm",
    ai: 76,
    match: 79,
    email: "thanhlong@mail.com",
    phone: "0933 998 875",
    matchedSkills: ["SQL", "Power BI"],
    missingSkills: ["Python nâng cao"],
    potential: "Có thể tăng tốc nhanh nếu cải thiện storytelling dữ liệu.",
    strengths: ["SQL chắc", "Nắm business metric"],
    improvements: ["Cải thiện trình bày insight"],
    activityHistory: [
      "Nộp hồ sơ Data Analyst - 17/03/2026",
      "Làm bài test dữ liệu - 24/03/2026",
    ],
  },
];

const DEMO_INTERVIEW_VIDEO_URL =
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

const INITIAL_INTERVIEWS = [
  {
    id: "pv01",
    candidateId: "uv01",
    jobId: "jd01",
    date: "2026-03-28",
    duration: "42 phút",
    score: 92,
    logic: 91,
    expression: 88,
    transcript: "Ứng viên trình bày rõ về tối ưu render và cache.",
    recordingUrl: DEMO_INTERVIEW_VIDEO_URL,
  },
  {
    id: "pv02",
    candidateId: "uv02",
    jobId: "jd02",
    date: "2026-03-27",
    duration: "35 phút",
    score: 84,
    logic: 82,
    expression: 87,
    transcript: "Ứng viên mô tả tốt flow UX và kiểm thử prototype.",
    recordingUrl: DEMO_INTERVIEW_VIDEO_URL,
  },
  {
    id: "pv03",
    candidateId: "uv03",
    jobId: "jd03",
    date: "2026-03-25",
    duration: "31 phút",
    score: 76,
    logic: 79,
    expression: 73,
    transcript: "Ứng viên xử lý bài toán dữ liệu tốt nhưng trình bày ngắn.",
    recordingUrl: DEMO_INTERVIEW_VIDEO_URL,
  },
];

const INITIAL_NOTIFICATIONS = [
  {
    id: "ntf01",
    title: "Ứng viên mới nộp hồ sơ",
    description: "Lê Thành Long vừa ứng tuyển vị trí Data Analyst.",
    time: "2 phút trước",
    isRead: false,
  },
  {
    id: "ntf02",
    title: "AI đề xuất ứng viên nổi bật",
    description: "Nguyễn Minh Anh đạt điểm AI 92% cho Frontend Engineer.",
    time: "14 phút trước",
    isRead: false,
  },
];

const JD_LEVEL_OPTIONS = [
  "Intern",
  "Fresher",
  "Junior",
  "Middle",
  "Senior",
  "Lead",
  "Principal",
  "Manager",
  "Head",
  "Director",
];
const JD_SALARY_OPTIONS = [
  "10 - 15 triệu",
  "15 - 20 triệu",
  "20 - 25 triệu",
  "25 - 35 triệu",
  "25 - 38 triệu",
  "28 - 40 triệu",
  "35 - 50 triệu",
  "40 - 60 triệu",
  "50 - 70 triệu",
  "70 - 100 triệu",
];
const DEFAULT_JD_LEVEL = JD_LEVEL_OPTIONS[3];
const DEFAULT_JD_SALARY_RANGE = JD_SALARY_OPTIONS[3];
const EMPTY_FORM = {
  title: "",
  dept: "",
  level: DEFAULT_JD_LEVEL,
  description: "",
  hardSkills: "",
  softSkills: "",
  salary: DEFAULT_JD_SALARY_RANGE,
};

const themeClass = (light, dark, isDark) => (isDark ? dark : light);
const toTags = (value) =>
  String(value || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
const parseYears = (text) => Number(String(text || "").match(/\d+/)?.[0] || 0);
const clamp = (value, min = 0, max = 100) =>
  Math.max(min, Math.min(max, value));
const toCommaText = (value) =>
  Array.isArray(value) ? value.join(", ") : String(value || "");
const toFormData = (job = null) => ({
  title: job?.title || "",
  dept: job?.dept || "",
  level: job?.level || DEFAULT_JD_LEVEL,
  description: job?.description || "",
  hardSkills: toCommaText(job?.hardSkills),
  softSkills: toCommaText(job?.softSkills),
  salary: job?.salary || DEFAULT_JD_SALARY_RANGE,
});

const formatDate = (value) => {
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString("vi-VN");
};

const suggestSkills = (description) => {
  const text = String(description || "").toLowerCase();
  const hard = [];
  const soft = [];
  if (text.includes("react")) hard.push("React");
  if (text.includes("typescript")) hard.push("TypeScript");
  if (text.includes("sql")) hard.push("SQL");
  if (text.includes("figma")) hard.push("Figma");
  if (text.includes("hiệu năng")) hard.push("Performance");
  if (text.includes("giao tiếp")) soft.push("Giao tiếp");
  if (text.includes("team")) soft.push("Làm việc nhóm");
  if (!hard.length) hard.push("Phân tích yêu cầu", "Giải quyết vấn đề");
  if (!soft.length) soft.push("Tư duy phản biện", "Giao tiếp");
  return { hard: Array.from(new Set(hard)), soft: Array.from(new Set(soft)) };
};

function buildDemoPdfDataUri() {
  if (typeof window === "undefined") return "";
  const stream =
    "BT\n/F1 16 Tf\n72 740 Td\n(CV Demo - AI Interview) Tj\n0 -24 Td\n(Preview PDF in Candidate Drawer) Tj\nET";
  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n",
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
    `5 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((obj) => {
    offsets.push(pdf.length);
    pdf += obj;
  });
  const startXref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF`;
  return `data:application/pdf;base64,${window.btoa(pdf)}`;
}

function Card({ isDark, className = "", children }) {
  return (
    <section
      className={`${themeClass("rounded-2xl border border-slate-200 bg-white shadow-sm", "rounded-2xl border border-slate-800 bg-slate-900 shadow-sm", isDark)} ${className}`}
    >
      {children}
    </section>
  );
}

function Progress({ value, isDark }) {
  return (
    <div
      className={themeClass(
        "h-2 w-full rounded-full bg-slate-100",
        "h-2 w-full rounded-full bg-slate-800",
        isDark,
      )}
    >
      <div
        className="h-2 rounded-full bg-emerald-500"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

function TagList({ items, isDark, tone = "blue" }) {
  const toneMap = {
    blue: themeClass(
      "border-blue-200 bg-blue-50 text-blue-700",
      "border-blue-900 bg-blue-950/40 text-blue-200",
      isDark,
    ),
    green: themeClass(
      "border-emerald-200 bg-emerald-50 text-emerald-700",
      "border-emerald-900 bg-emerald-950/40 text-emerald-200",
      isDark,
    ),
    amber: themeClass(
      "border-amber-200 bg-amber-50 text-amber-700",
      "border-amber-900 bg-amber-950/40 text-amber-200",
      isDark,
    ),
  };
  if (!items.length)
    return (
      <span
        className={themeClass(
          "text-xs text-slate-500",
          "text-xs text-slate-400",
          isDark,
        )}
      >
        Không có dữ liệu
      </span>
    );
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${toneMap[tone]}`}
        >
          {item}
        </span>
      ))}
    </div>
  );
}
export function EmployerDashboardScreen({
  companyName,
  recruiterName,
  onOpenProfile,
}) {
  const [menu, setMenu] = useState("dashboard");
  const [view, setView] = useState("dashboard");
  const [theme, setTheme] = useState(getStoredTheme);
  const [jobs, setJobs] = useState(INITIAL_JOBS);
  const [jobFilter, setJobFilter] = useState("");
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [jdModalOpen, setJdModalOpen] = useState(false);
  const [jdForm, setJdForm] = useState(() => ({ ...EMPTY_FORM }));
  const [editingJobId, setEditingJobId] = useState("");
  const [detailView, setDetailView] = useState("none");
  const [selectedJobId, setSelectedJobId] = useState("");
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [selectedInterviewVideoId, setSelectedInterviewVideoId] = useState("");
  const [interviewBookOpen, setInterviewBookOpen] = useState(false);
  const [interviewBookPage, setInterviewBookPage] = useState(0);
  const [backContext, setBackContext] = useState(null);
  const [pendingJobStatusChanges, setPendingJobStatusChanges] = useState({});
  const [leaveWarningOpen, setLeaveWarningOpen] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const [candidateSort, setCandidateSort] = useState("fit-desc");
  const [filters, setFilters] = useState({
    aiMin: 0,
    expMin: 0,
    interviewMin: 0,
  });
  const notifyRef = useRef(null);

  const isDark = theme === "dark";
  const hasPendingJobStatusChanges =
    Object.keys(pendingJobStatusChanges).length > 0;
  const unreadCount = notifications.filter((item) => !item.isRead).length;
  const userInitial = (recruiterName || companyName || "U")
    .trim()
    .charAt(0)
    .toUpperCase();
  const demoPdf = useMemo(() => buildDemoPdfDataUri(), []);

  useEffect(() => subscribeTheme(setTheme), []);
  useEffect(() => {
    if (!notifyOpen || typeof window === "undefined") return undefined;
    const closeOnOutside = (event) => {
      if (!notifyRef.current?.contains(event.target)) setNotifyOpen(false);
    };
    window.addEventListener("mousedown", closeOnOutside);
    return () => window.removeEventListener("mousedown", closeOnOutside);
  }, [notifyOpen]);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    if (!interviewBookOpen && !jdModalOpen && !leaveWarningOpen)
      return undefined;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [interviewBookOpen, jdModalOpen, leaveWarningOpen]);

  useEffect(() => {
    if (detailView === "none") setBackContext(null);
  }, [detailView]);

  useEffect(() => {
    if (typeof window === "undefined" || !hasPendingJobStatusChanges)
      return undefined;
    const warnBeforeLeave = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeLeave);
    return () => window.removeEventListener("beforeunload", warnBeforeLeave);
  }, [hasPendingJobStatusChanges]);

  const candidates = useMemo(
    () =>
      INITIAL_CANDIDATES.map((candidate) => {
        const job = jobs.find((item) => item.id === candidate.jobId);
        const interviewHistory = INITIAL_INTERVIEWS.filter(
          (item) => item.candidateId === candidate.id,
        ).sort((a, b) => b.date.localeCompare(a.date));
        return {
          ...candidate,
          jobTitle: job?.title || "Vị trí",
          interviewHistory,
          interviewScore: interviewHistory[0]?.score || 0,
          cvPdf: demoPdf,
        };
      }),
    [jobs, demoPdf],
  );

  const interviews = useMemo(
    () =>
      INITIAL_INTERVIEWS.map((item) => {
        const candidate = candidates.find((c) => c.id === item.candidateId);
        const job = jobs.find((j) => j.id === item.jobId);
        return {
          ...item,
          candidateName: candidate?.name || "Ứng viên",
          jobTitle: job?.title || "Vị trí",
        };
      }),
    [candidates, jobs],
  );

  const jobsFiltered = useMemo(
    () => jobs.filter((job) => !jobFilter || job.id === jobFilter),
    [jobs, jobFilter],
  );
  const candidatesFiltered = useMemo(
    () =>
      candidates.filter(
        (candidate) => !jobFilter || candidate.jobId === jobFilter,
      ),
    [candidates, jobFilter],
  );
  const candidatesSorted = useMemo(() => {
    const items = [...candidatesFiltered];
    if (candidateSort === "name-asc")
      return items.sort((a, b) => a.name.localeCompare(b.name, "vi"));
    if (candidateSort === "name-desc")
      return items.sort((a, b) => b.name.localeCompare(a.name, "vi"));
    return items.sort(
      (a, b) => b.match - a.match || a.name.localeCompare(b.name, "vi"),
    );
  }, [candidatesFiltered, candidateSort]);
  const reportsFiltered = useMemo(
    () => interviews.filter((item) => !jobFilter || item.jobId === jobFilter),
    [interviews, jobFilter],
  );

  const selectedJob = jobs.find((job) => job.id === selectedJobId) || null;
  const selectedProfile =
    candidates.find((candidate) => candidate.id === selectedProfileId) || null;

  const analyticsCandidates = useMemo(() => {
    if (!selectedJob) return [];
    return candidates
      .filter((candidate) => candidate.jobId === selectedJob.id)
      .filter((candidate) => candidate.ai >= filters.aiMin)
      .filter((candidate) => parseYears(candidate.exp) >= filters.expMin)
      .filter((candidate) => candidate.interviewScore >= filters.interviewMin)
      .sort((a, b) => b.match - a.match);
  }, [selectedJob, candidates, filters]);

  const rankedCandidates = useMemo(() => {
    if (!selectedJob) return [];
    return candidates
      .filter((candidate) => candidate.jobId === selectedJob.id)
      .sort((a, b) => b.match - a.match);
  }, [selectedJob, candidates]);

  const stats = [
    {
      label: "JD đang mở",
      value: jobs.filter((job) => job.status === "Đang mở").length,
    },
    {
      label: "Tổng hồ sơ",
      value: jobs.reduce((sum, job) => sum + job.total, 0),
    },
    { label: "Phỏng vấn AI", value: INITIAL_INTERVIEWS.length },
    {
      label: "Ứng viên đề xuất",
      value: INITIAL_CANDIDATES.filter((candidate) => candidate.ai >= 85)
        .length,
    },
  ];

  const jdByStatus = useMemo(
    () => ({
      open: jobs.filter((job) => job.status === "Đang mở").length,
      closed: jobs.filter((job) => job.status === "Đóng").length,
      draft: jobs.filter((job) => job.status === "Nháp").length,
    }),
    [jobs],
  );

  const topJobsByApplications = useMemo(
    () => [...jobs].sort((a, b) => b.total - a.total).slice(0, 5),
    [jobs],
  );
  const maxApplications = Math.max(
    1,
    ...topJobsByApplications.map((job) => job.total || 0),
  );

  const aiBands = useMemo(
    () => ({
      high: candidates.filter((candidate) => candidate.ai >= 85).length,
      medium: candidates.filter(
        (candidate) => candidate.ai >= 70 && candidate.ai < 85,
      ).length,
      low: candidates.filter((candidate) => candidate.ai < 70).length,
    }),
    [candidates],
  );

  const tableHead = themeClass(
    "bg-slate-50 text-xs uppercase text-slate-500",
    "bg-slate-900/70 text-xs uppercase text-slate-400",
    isDark,
  );
  const rowClass = themeClass(
    "border-t border-slate-100",
    "border-t border-slate-800",
    isDark,
  );
  const th = "px-4 py-3 whitespace-nowrap";

  const saveJobStatusChanges = () => {
    if (!hasPendingJobStatusChanges) return;
    setJobs((prev) =>
      prev.map((job) =>
        pendingJobStatusChanges[job.id]
          ? { ...job, status: pendingJobStatusChanges[job.id] }
          : job,
      ),
    );
    setPendingJobStatusChanges({});
  };

  const discardJobStatusChanges = () => {
    setPendingJobStatusChanges({});
  };

  const updatePendingJobStatus = (job, nextStatus) => {
    setPendingJobStatusChanges((prev) => {
      const next = { ...prev };
      if (nextStatus === job.status) {
        delete next[job.id];
      } else {
        next[job.id] = nextStatus;
      }
      return next;
    });
  };

  const openMenuCore = (id) => {
    setMenu(id);
    setView(VIEW_BY_MENU[id] || "dashboard");
    setDetailView("none");
    setSelectedJobId("");
    setSelectedProfileId("");
    setSelectedInterviewVideoId("");
    setInterviewBookOpen(false);
    setInterviewBookPage(0);
    setBackContext(null);
    if (id !== "applicants") setJobFilter("");
  };

  const openDetailCore = (type, jobId = "", profileId = "") => {
    const targetMenu = DETAIL_MENU_BY_TYPE[type] || menu;
    if (targetMenu !== menu) {
      setBackContext({
        menu,
        view,
        detailView,
        selectedJobId,
        selectedProfileId,
        selectedInterviewVideoId,
        interviewBookOpen,
        interviewBookPage,
      });
      setMenu(targetMenu);
      setView(VIEW_BY_MENU[targetMenu] || view);
    }
    setDetailView(type);
    setSelectedJobId(jobId);
    setSelectedProfileId(profileId);
    setSelectedInterviewVideoId("");
    setInterviewBookOpen(false);
    setInterviewBookPage(0);
  };

  const goBackToPreviousContextCore = () => {
    if (backContext) {
      setMenu(backContext.menu);
      setView(backContext.view);
      setDetailView(backContext.detailView);
      setSelectedJobId(backContext.selectedJobId);
      setSelectedProfileId(backContext.selectedProfileId);
      setSelectedInterviewVideoId(backContext.selectedInterviewVideoId);
      setInterviewBookOpen(backContext.interviewBookOpen);
      setInterviewBookPage(backContext.interviewBookPage);
      setBackContext(null);
      return;
    }
    setDetailView("none");
    setSelectedJobId("");
    setSelectedProfileId("");
    setSelectedInterviewVideoId("");
    setInterviewBookOpen(false);
    setInterviewBookPage(0);
  };

  const runNavigation = (action) => {
    if (!action) return;
    if (action.type === "menu") {
      openMenuCore(action.id);
      return;
    }
    if (action.type === "detail") {
      openDetailCore(action.detailType, action.jobId, action.profileId);
      return;
    }
    if (action.type === "back") {
      goBackToPreviousContextCore();
      return;
    }
    if (action.type === "profile") {
      onOpenProfile?.();
    }
  };

  const requestNavigation = (action) => {
    if (hasPendingJobStatusChanges) {
      setPendingNavigation(action);
      setLeaveWarningOpen(true);
      return;
    }
    runNavigation(action);
  };

  const openMenu = (id) => requestNavigation({ type: "menu", id });
  const openDetail = (type, jobId = "", profileId = "") =>
    requestNavigation({ type: "detail", detailType: type, jobId, profileId });
  const goBackToPreviousContext = () => requestNavigation({ type: "back" });

  const closeLeaveWarning = () => {
    setLeaveWarningOpen(false);
    setPendingNavigation(null);
  };

  const confirmLeaveDiscard = () => {
    const nextAction = pendingNavigation;
    discardJobStatusChanges();
    setLeaveWarningOpen(false);
    setPendingNavigation(null);
    runNavigation(nextAction);
  };

  const confirmLeaveSave = () => {
    const nextAction = pendingNavigation;
    saveJobStatusChanges();
    setLeaveWarningOpen(false);
    setPendingNavigation(null);
    runNavigation(nextAction);
  };

  const openCreateJdModal = () => {
    setEditingJobId("");
    setJdForm({ ...EMPTY_FORM });
    setJdModalOpen(true);
  };

  const openEditJdModal = (job) => {
    if (!job) return;
    setEditingJobId(job.id);
    setJdForm(toFormData(job));
    setJdModalOpen(true);
  };

  const closeJdModal = () => {
    setJdModalOpen(false);
    setEditingJobId("");
    setJdForm({ ...EMPTY_FORM });
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(setStoredTheme(next));
  };

  const optimizeByAi = () => {
    const suggestion = suggestSkills(jdForm.description);
    const nextHard = Array.from(
      new Set([...toTags(jdForm.hardSkills), ...suggestion.hard]),
    );
    const nextSoft = Array.from(
      new Set([...toTags(jdForm.softSkills), ...suggestion.soft]),
    );
    setJdForm((prev) => ({
      ...prev,
      hardSkills: nextHard.join(", "),
      softSkills: nextSoft.join(", "),
    }));
  };

  const submitJd = (event) => {
    event.preventDefault();
    if (
      !jdForm.title.trim() ||
      !jdForm.dept.trim() ||
      !jdForm.description.trim()
    )
      return;
    const payload = {
      title: jdForm.title.trim(),
      dept: jdForm.dept.trim(),
      level: jdForm.level.trim() || DEFAULT_JD_LEVEL,
      salary: jdForm.salary.trim() || DEFAULT_JD_SALARY_RANGE,
      description: jdForm.description.trim(),
      hardSkills: toTags(jdForm.hardSkills),
      softSkills: toTags(jdForm.softSkills),
    };

    if (editingJobId) {
      setJobs((prev) =>
        prev.map((item) =>
          item.id === editingJobId ? { ...item, ...payload } : item,
        ),
      );
      closeJdModal();
      return;
    }

    const newJd = {
      id: `jd${Date.now()}`,
      ...payload,
      date: new Date().toISOString().slice(0, 10),
      status: "Nháp",
      total: 0,
    };
    setJobs((prev) => [newJd, ...prev]);
    closeJdModal();
    setMenu("jobs");
    setView("job-list");
  };

  const renderOverviewCharts = () => (
    <section className="grid gap-4 xl:grid-cols-3">
      <Card isDark={isDark} className="p-4">
        <h3 className="text-sm font-bold">Phân bố trạng thái JD</h3>
        <div className="mt-4 space-y-3">
          {[
            {
              label: "Đang mở",
              value: jdByStatus.open,
              color: "bg-emerald-500",
            },
            { label: "Đóng", value: jdByStatus.closed, color: "bg-slate-500" },
            { label: "Nháp", value: jdByStatus.draft, color: "bg-amber-500" },
          ].map((item) => {
            const total =
              jdByStatus.open + jdByStatus.closed + jdByStatus.draft || 1;
            const percent = Math.round((item.value / total) * 100);
            return (
              <div key={item.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span>{item.label}</span>
                  <span className="font-semibold">
                    {item.value} ({percent}%)
                  </span>
                </div>
                <div
                  className={themeClass(
                    "h-2 rounded-full bg-slate-100",
                    "h-2 rounded-full bg-slate-800",
                    isDark,
                  )}
                >
                  <div
                    className={`h-2 rounded-full ${item.color}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card isDark={isDark} className="p-4">
        <h3 className="text-sm font-bold">Hồ sơ theo JD</h3>
        <div className="mt-4 space-y-3">
          {topJobsByApplications.map((job) => (
            <div key={job.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="truncate pr-2">{job.title}</span>
                <span className="font-semibold">{job.total}</span>
              </div>
              <div
                className={themeClass(
                  "h-2 rounded-full bg-slate-100",
                  "h-2 rounded-full bg-slate-800",
                  isDark,
                )}
              >
                <div
                  className="h-2 rounded-full bg-blue-600"
                  style={{
                    width: `${Math.round(((job.total || 0) / maxApplications) * 100)}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card isDark={isDark} className="p-4">
        <h3 className="text-sm font-bold">Phân bố chất lượng ứng viên (AI)</h3>
        <div className="mt-4 grid gap-3">
          <div
            className={themeClass(
              "rounded-xl border border-emerald-200 bg-emerald-50 p-3",
              "rounded-xl border border-emerald-900 bg-emerald-950/30 p-3",
              isDark,
            )}
          >
            <p className="text-xs uppercase">Điểm cao (&gt;=85)</p>
            <p className="mt-1 text-2xl font-bold">{aiBands.high}</p>
          </div>
          <div
            className={themeClass(
              "rounded-xl border border-amber-200 bg-amber-50 p-3",
              "rounded-xl border border-amber-900 bg-amber-950/30 p-3",
              isDark,
            )}
          >
            <p className="text-xs uppercase">Trung bình (70-84)</p>
            <p className="mt-1 text-2xl font-bold">{aiBands.medium}</p>
          </div>
          <div
            className={themeClass(
              "rounded-xl border border-slate-200 bg-slate-100 p-3",
              "rounded-xl border border-slate-700 bg-slate-800 p-3",
              isDark,
            )}
          >
            <p className="text-xs uppercase">Cần xem lại (&lt;70)</p>
            <p className="mt-1 text-2xl font-bold">{aiBands.low}</p>
          </div>
        </div>
      </Card>
    </section>
  );
  const renderJobs = () => (
    <Card isDark={isDark}>
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">
            Quản lý Tin tuyển dụng ({jobs.length})
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={saveJobStatusChanges}
              disabled={!hasPendingJobStatusChanges}
              className={themeClass(
                `inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${hasPendingJobStatusChanges ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-500/30" : "border-slate-300 bg-white text-slate-500 opacity-60"}`,
                `inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${hasPendingJobStatusChanges ? "border-blue-500 bg-blue-500 text-white shadow-md shadow-blue-900/40" : "border-slate-700 bg-slate-900 text-slate-400 opacity-60"}`,
                isDark,
              )}
            >
              Lưu trạng thái{" "}
              {hasPendingJobStatusChanges
                ? `(${Object.keys(pendingJobStatusChanges).length})`
                : ""}
            </button>
            <button
              type="button"
              onClick={openCreateJdModal}
              className={themeClass(
                "inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700",
                "inline-flex items-center gap-2 rounded-lg border border-blue-900 bg-blue-950/40 px-3 py-2 text-sm font-semibold text-blue-200",
                isDark,
              )}
            >
              <Plus className="h-4 w-4" />
              Thêm JD
            </button>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[1040px] w-full text-left text-sm">
            <thead className={tableHead}>
              <tr>
                <th className={th}>Tiêu đề</th>
                <th className={th}>Phòng ban</th>
                <th className={th}>Cấp bậc</th>
                <th className={th}>Lương</th>
                <th className={th}>Ngày đăng</th>
                <th className={th}>Hồ sơ</th>
                <th className={th}>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {jobsFiltered.map((job) => (
                <tr
                  key={job.id}
                  onClick={() => openDetail("job-detail", job.id)}
                  className={`${rowClass} cursor-pointer ${themeClass("hover:bg-slate-50", "hover:bg-slate-800/50", isDark)}`}
                >
                  <td className="px-4 py-3 font-semibold">{job.title}</td>
                  <td className="px-4 py-3">{job.dept}</td>
                  <td className="px-4 py-3">{job.level}</td>
                  <td className="px-4 py-3">{job.salary}</td>
                  <td className="px-4 py-3">{formatDate(job.date)}</td>
                  <td className="px-4 py-3">{job.total}</td>
                  <td className="px-4 py-3">
                    <select
                      value={pendingJobStatusChanges[job.id] || job.status}
                      onClick={(event) => event.stopPropagation()}
                      onChange={(event) =>
                        updatePendingJobStatus(job, event.target.value)
                      }
                      className={themeClass(
                        "rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700",
                        "rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs font-semibold text-slate-200",
                        isDark,
                      )}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );

  const renderCandidates = () => (
    <Card isDark={isDark}>
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">
            Danh sách ứng viên ({candidatesSorted.length})
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setCandidateSort("name-asc")}
              className={themeClass(
                `rounded-lg border px-3 py-1.5 text-xs font-semibold ${candidateSort === "name-asc" ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-300 bg-white text-slate-700"}`,
                `rounded-lg border px-3 py-1.5 text-xs font-semibold ${candidateSort === "name-asc" ? "border-blue-900 bg-blue-950/40 text-blue-200" : "border-slate-700 bg-slate-900 text-slate-200"}`,
                isDark,
              )}
            >
              A → Z
            </button>
            <button
              type="button"
              onClick={() => setCandidateSort("name-desc")}
              className={themeClass(
                `rounded-lg border px-3 py-1.5 text-xs font-semibold ${candidateSort === "name-desc" ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-300 bg-white text-slate-700"}`,
                `rounded-lg border px-3 py-1.5 text-xs font-semibold ${candidateSort === "name-desc" ? "border-blue-900 bg-blue-950/40 text-blue-200" : "border-slate-700 bg-slate-900 text-slate-200"}`,
                isDark,
              )}
            >
              Z → A
            </button>
            <button
              type="button"
              onClick={() => setCandidateSort("fit-desc")}
              className={themeClass(
                `rounded-lg border px-3 py-1.5 text-xs font-semibold ${candidateSort === "fit-desc" ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-300 bg-white text-slate-700"}`,
                `rounded-lg border px-3 py-1.5 text-xs font-semibold ${candidateSort === "fit-desc" ? "border-blue-900 bg-blue-950/40 text-blue-200" : "border-slate-700 bg-slate-900 text-slate-200"}`,
                isDark,
              )}
            >
              Độ phù hợp
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[900px] w-full text-left text-sm">
            <thead className={tableHead}>
              <tr>
                <th className={th}>Ứng viên</th>
                <th className={th}>JD</th>
                <th className={th}>Kinh nghiệm</th>
                <th className={th}>Điểm đánh giá tổng quát từ AI</th>
                <th className={th}>Độ matching CV với JD</th>
              </tr>
            </thead>
            <tbody>
              {candidatesSorted.map((candidate) => (
                <tr key={candidate.id} className={rowClass}>
                  <td className="px-4 py-3 font-semibold">
                    <a
                      href={`/candidates/${candidate.id}`}
                      onClick={(event) => {
                        event.preventDefault();
                        openDetail("profile", candidate.jobId, candidate.id);
                      }}
                      className={themeClass(
                        "text-blue-700 hover:underline",
                        "text-blue-300 hover:underline",
                        isDark,
                      )}
                    >
                      {candidate.name}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={`/jobs/${candidate.jobId}`}
                      onClick={(event) => {
                        event.preventDefault();
                        openDetail("job-detail", candidate.jobId);
                      }}
                      className={themeClass(
                        "text-blue-700 hover:underline",
                        "text-blue-300 hover:underline",
                        isDark,
                      )}
                    >
                      {candidate.jobTitle}
                    </a>
                  </td>
                  <td className="px-4 py-3">{candidate.exp}</td>
                  <td className="px-4 py-3">{candidate.ai}%</td>
                  <td className="px-4 py-3">
                    <div className="w-44 space-y-1">
                      <Progress value={candidate.match} isDark={isDark} />
                      <p
                        className={themeClass(
                          "text-xs text-slate-600",
                          "text-xs text-slate-300",
                          isDark,
                        )}
                      >
                        {candidate.match}%
                      </p>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );

  const renderReports = () => (
    <Card isDark={isDark}>
      <div className="p-5 sm:p-6">
        <h2 className="text-lg font-bold">Lịch sử phỏng vấn ({jobs.length})</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[960px] w-full text-left text-sm">
            <thead className={tableHead}>
              <tr>
                <th className={th}>Ứng viên</th>
                <th className={th}>JD</th>
                <th className={th}>Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {reportsFiltered.map((item) => (
                <tr key={item.id} className={rowClass}>
                  <td className="px-4 py-3 font-semibold">
                    {item.candidateName}
                  </td>
                  <td className="px-4 py-3">{item.jobTitle}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() =>
                        openDetail("profile", item.jobId, item.candidateId)
                      }
                      className={themeClass(
                        "text-sm font-semibold text-blue-700",
                        "text-sm font-semibold text-blue-300",
                        isDark,
                      )}
                    >
                      Mở hồ sơ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );

  const renderDetailView = () => {
    if (!selectedJob && detailView !== "profile") return null;

    if (detailView === "job-detail") {
      const jobCandidates = candidates.filter(
        (candidate) => candidate.jobId === selectedJob.id,
      );
      const averageAi = jobCandidates.length
        ? Math.round(
            jobCandidates.reduce((sum, candidate) => sum + candidate.ai, 0) /
              jobCandidates.length,
          )
        : 0;
      const averageMatching = jobCandidates.length
        ? Math.round(
            jobCandidates.reduce((sum, candidate) => sum + candidate.match, 0) /
              jobCandidates.length,
          )
        : 0;

      return (
        <Card isDark={isDark} className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold">Chi tiết JD</h3>
              <p
                className={themeClass(
                  "mt-1 text-sm text-slate-600",
                  "mt-1 text-sm text-slate-300",
                  isDark,
                )}
              >
                {selectedJob.title} • {selectedJob.dept}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => openEditJdModal(selectedJob)}
                className={themeClass(
                  "rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700",
                  "rounded-lg border border-blue-900 bg-blue-950/40 px-3 py-2 text-sm font-semibold text-blue-200",
                  isDark,
                )}
              >
                Cập nhật JD
              </button>
              <button
                type="button"
                onClick={() => setDetailView("none")}
                className={themeClass(
                  "rounded-xl border border-slate-200 bg-slate-100 p-2 text-slate-700",
                  "rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-200",
                  isDark,
                )}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <section
              className={themeClass(
                "rounded-2xl border border-slate-200 bg-slate-50 p-4",
                "rounded-2xl border border-slate-700 bg-slate-800 p-4",
                isDark,
              )}
            >
              <h4 className="text-sm font-bold">Thông tin JD</h4>
              <div className="mt-3 space-y-2 text-sm">
                <p>
                  <span
                    className={themeClass(
                      "text-slate-500",
                      "text-slate-400",
                      isDark,
                    )}
                  >
                    Cấp bậc:
                  </span>{" "}
                  <strong>{selectedJob.level}</strong>
                </p>
                <p>
                  <span
                    className={themeClass(
                      "text-slate-500",
                      "text-slate-400",
                      isDark,
                    )}
                  >
                    Range lương:
                  </span>{" "}
                  <strong>{selectedJob.salary}</strong>
                </p>
                <p>
                  <span
                    className={themeClass(
                      "text-slate-500",
                      "text-slate-400",
                      isDark,
                    )}
                  >
                    Ngày đăng:
                  </span>{" "}
                  <strong>{formatDate(selectedJob.date)}</strong>
                </p>
                <p>
                  <span
                    className={themeClass(
                      "text-slate-500",
                      "text-slate-400",
                      isDark,
                    )}
                  >
                    Trạng thái:
                  </span>{" "}
                  <strong>{selectedJob.status}</strong>
                </p>
              </div>
            </section>

            <section
              className={themeClass(
                "rounded-2xl border border-slate-200 bg-slate-50 p-4",
                "rounded-2xl border border-slate-700 bg-slate-800 p-4",
                isDark,
              )}
            >
              <h4 className="text-sm font-bold">Ứng viên</h4>
              <div className="mt-3 space-y-2 text-sm">
                <p>
                  <span
                    className={themeClass(
                      "text-slate-500",
                      "text-slate-400",
                      isDark,
                    )}
                  >
                    Tổng hồ sơ:
                  </span>{" "}
                  <strong>{selectedJob.total}</strong>
                </p>
                <p>
                  <span
                    className={themeClass(
                      "text-slate-500",
                      "text-slate-400",
                      isDark,
                    )}
                  >
                    Đã vào danh sách:
                  </span>{" "}
                  <strong>{jobCandidates.length}</strong>
                </p>
                <p>
                  <span
                    className={themeClass(
                      "text-slate-500",
                      "text-slate-400",
                      isDark,
                    )}
                  >
                    AI trung bình:
                  </span>{" "}
                  <strong>{averageAi}%</strong>
                </p>
                <p>
                  <span
                    className={themeClass(
                      "text-slate-500",
                      "text-slate-400",
                      isDark,
                    )}
                  >
                    Matching trung bình:
                  </span>{" "}
                  <strong>{averageMatching}%</strong>
                </p>
              </div>
            </section>

            <section
              className={themeClass(
                "rounded-2xl border border-slate-200 bg-slate-50 p-4",
                "rounded-2xl border border-slate-700 bg-slate-800 p-4",
                isDark,
              )}
            >
              <h4 className="text-sm font-bold">Kỹ năng</h4>
              <div className="mt-3 space-y-3">
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide">
                    Hard Skills
                  </p>
                  <TagList
                    items={selectedJob.hardSkills || []}
                    tone="blue"
                    isDark={isDark}
                  />
                </div>
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide">
                    Soft Skills
                  </p>
                  <TagList
                    items={selectedJob.softSkills || []}
                    tone="green"
                    isDark={isDark}
                  />
                </div>
              </div>
            </section>
          </div>

          <section
            className={themeClass(
              "mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4",
              "mt-4 rounded-2xl border border-slate-700 bg-slate-800 p-4",
              isDark,
            )}
          >
            <h4 className="text-sm font-bold">Mô tả công việc</h4>
            <p
              className={themeClass(
                "mt-2 text-sm text-slate-700",
                "mt-2 text-sm text-slate-200",
                isDark,
              )}
            >
              {selectedJob.description}
            </p>
          </section>

          <section
            className={themeClass(
              "mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4",
              "mt-4 rounded-2xl border border-slate-700 bg-slate-800 p-4",
              isDark,
            )}
          >
            <h4 className="text-sm font-bold">
              Danh sách ứng viên đã apply JD này
            </h4>
            {jobCandidates.length ? (
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-[760px] w-full text-left text-sm">
                  <thead className={tableHead}>
                    <tr>
                      <th className={th}>Ứng viên</th>
                      <th className={th}>Kinh nghiệm</th>
                      <th className={th}>AI</th>
                      <th className={th}>Matching</th>
                      <th className={th}>Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...jobCandidates]
                      .sort(
                        (a, b) =>
                          b.match - a.match ||
                          a.name.localeCompare(b.name, "vi"),
                      )
                      .map((candidate) => (
                        <tr key={candidate.id} className={rowClass}>
                          <td className="px-4 py-3 font-semibold">
                            <a
                              href={`/candidates/${candidate.id}`}
                              onClick={(event) => {
                                event.preventDefault();
                                openDetail(
                                  "profile",
                                  candidate.jobId,
                                  candidate.id,
                                );
                              }}
                              className={themeClass(
                                "text-blue-700 hover:underline",
                                "text-blue-300 hover:underline",
                                isDark,
                              )}
                            >
                              {candidate.name}
                            </a>
                          </td>
                          <td className="px-4 py-3">{candidate.exp}</td>
                          <td className="px-4 py-3">{candidate.ai}%</td>
                          <td className="px-4 py-3">{candidate.match}%</td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() =>
                                openDetail(
                                  "profile",
                                  candidate.jobId,
                                  candidate.id,
                                )
                              }
                              className={themeClass(
                                "rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700",
                                "rounded-lg border border-blue-900 bg-blue-950/40 px-3 py-1 text-xs font-semibold text-blue-200",
                                isDark,
                              )}
                            >
                              Xem hồ sơ
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p
                className={themeClass(
                  "mt-2 text-sm text-slate-600",
                  "mt-2 text-sm text-slate-300",
                  isDark,
                )}
              >
                Chưa có ứng viên apply cho JD này.
              </p>
            )}
          </section>
        </Card>
      );
    }

    if (detailView === "analytics") {
      return (
        <Card isDark={isDark} className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold">Phân tích Ứng viên theo JD</h3>
              <p
                className={themeClass(
                  "mt-1 text-sm text-slate-600",
                  "mt-1 text-sm text-slate-300",
                  isDark,
                )}
              >
                {selectedJob.title} • {selectedJob.dept}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDetailView("none")}
              className={themeClass(
                "rounded-xl border border-slate-200 bg-slate-100 p-2 text-slate-700",
                "rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-200",
                isDark,
              )}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div
            className={themeClass(
              "mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3",
              "mt-4 rounded-2xl border border-slate-700 bg-slate-800 p-3",
              isDark,
            )}
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1 text-sm font-semibold">
                <SlidersHorizontal className="h-4 w-4" />
                Bộ lọc thông minh
              </span>
              <label className="inline-flex items-center gap-2 text-sm">
                AI từ
                <select
                  value={filters.aiMin}
                  onChange={(event) =>
                    setFilters((prev) => ({
                      ...prev,
                      aiMin: Number(event.target.value),
                    }))
                  }
                  className={themeClass(
                    "rounded-lg border border-slate-300 bg-white px-2 py-1",
                    "rounded-lg border border-slate-700 bg-slate-900 px-2 py-1",
                    isDark,
                  )}
                >
                  {[0, 70, 80, 85, 90].map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                KN từ
                <select
                  value={filters.expMin}
                  onChange={(event) =>
                    setFilters((prev) => ({
                      ...prev,
                      expMin: Number(event.target.value),
                    }))
                  }
                  className={themeClass(
                    "rounded-lg border border-slate-300 bg-white px-2 py-1",
                    "rounded-lg border border-slate-700 bg-slate-900 px-2 py-1",
                    isDark,
                  )}
                >
                  {[0, 2, 3, 4, 5].map((v) => (
                    <option key={v} value={v}>
                      {v} năm
                    </option>
                  ))}
                </select>
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                PV từ
                <select
                  value={filters.interviewMin}
                  onChange={(event) =>
                    setFilters((prev) => ({
                      ...prev,
                      interviewMin: Number(event.target.value),
                    }))
                  }
                  className={themeClass(
                    "rounded-lg border border-slate-300 bg-white px-2 py-1",
                    "rounded-lg border border-slate-700 bg-slate-900 px-2 py-1",
                    isDark,
                  )}
                >
                  {[0, 70, 80, 85, 90].map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-[1160px] w-full text-left text-sm">
              <thead className={tableHead}>
                <tr>
                  <th className={th}>Ứng viên</th>
                  <th className={th}>AI</th>
                  <th className={th}>Matching</th>
                  <th className={th}>Kỹ năng khớp</th>
                  <th className={th}>Kỹ năng thiếu</th>
                  <th className={th}>Tiềm năng</th>
                  <th className={th}>Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {analyticsCandidates.map((c) => (
                  <tr key={c.id} className={rowClass}>
                    <td className="px-4 py-3 font-semibold">{c.name}</td>
                    <td className="px-4 py-3">{c.ai}%</td>
                    <td className="px-4 py-3">
                      <div className="w-40 space-y-1">
                        <Progress value={c.match} isDark={isDark} />
                        <p
                          className={themeClass(
                            "text-xs text-slate-600",
                            "text-xs text-slate-300",
                            isDark,
                          )}
                        >
                          {c.match}%
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <TagList
                        items={c.matchedSkills}
                        tone="green"
                        isDark={isDark}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <TagList
                        items={c.missingSkills}
                        tone="amber"
                        isDark={isDark}
                      />
                    </td>
                    <td className="px-4 py-3">{c.potential}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() =>
                          openDetail("profile", selectedJob.id, c.id)
                        }
                        className={themeClass(
                          "rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700",
                          "rounded-lg border border-blue-900 bg-blue-950/40 px-3 py-1 text-xs font-semibold text-blue-200",
                          isDark,
                        )}
                      >
                        Mở hồ sơ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      );
    }

    if (detailView === "ranking") {
      return (
        <Card isDark={isDark} className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold">Ứng viên theo % Matching</h3>
              <p
                className={themeClass(
                  "mt-1 text-sm text-slate-600",
                  "mt-1 text-sm text-slate-300",
                  isDark,
                )}
              >
                {selectedJob.title}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDetailView("none")}
              className={themeClass(
                "rounded-xl border border-slate-200 bg-slate-100 p-2 text-slate-700",
                "rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-200",
                isDark,
              )}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {rankedCandidates.map((c) => (
              <article
                key={c.id}
                className={themeClass(
                  "rounded-2xl border border-slate-200 bg-slate-50 p-4",
                  "rounded-2xl border border-slate-700 bg-slate-800 p-4",
                  isDark,
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{c.name}</p>
                    <p
                      className={themeClass(
                        "mt-0.5 text-xs text-slate-600",
                        "mt-0.5 text-xs text-slate-300",
                        isDark,
                      )}
                    >
                      {c.exp} • AI {c.ai}%
                    </p>
                  </div>
                  <span
                    className={themeClass(
                      "rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700",
                      "rounded-full border border-emerald-900 bg-emerald-950/40 px-2.5 py-1 text-xs font-semibold text-emerald-200",
                      isDark,
                    )}
                  >
                    {c.match}%
                  </span>
                </div>
                <div className="mt-3">
                  <Progress value={c.match} isDark={isDark} />
                </div>
                <button
                  type="button"
                  onClick={() => openDetail("profile", selectedJob.id, c.id)}
                  className={themeClass(
                    "mt-3 inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700",
                    "mt-3 inline-flex items-center gap-1 rounded-lg border border-blue-900 bg-blue-950/40 px-3 py-1 text-xs font-semibold text-blue-200",
                    isDark,
                  )}
                >
                  <UserRound className="h-3.5 w-3.5" />
                  Chi tiết ứng viên
                </button>
              </article>
            ))}
          </div>
        </Card>
      );
    }

    if (detailView === "profile" && selectedProfile) {
      const activeInterviewVideo =
        selectedProfile.interviewHistory.find(
          (item) => item.id === selectedInterviewVideoId,
        ) ||
        selectedProfile.interviewHistory.find((item) => item.recordingUrl) ||
        null;
      const interviewCount = selectedProfile.interviewHistory.length;
      const averageInterviewScore = interviewCount
        ? Math.round(
            selectedProfile.interviewHistory.reduce(
              (sum, item) => sum + item.score,
              0,
            ) / interviewCount,
          )
        : 0;
      const averageInterviewLogic = interviewCount
        ? Math.round(
            selectedProfile.interviewHistory.reduce(
              (sum, item) => sum + item.logic,
              0,
            ) / interviewCount,
          )
        : 0;
      const averageInterviewExpression = interviewCount
        ? Math.round(
            selectedProfile.interviewHistory.reduce(
              (sum, item) => sum + item.expression,
              0,
            ) / interviewCount,
          )
        : 0;
      const latestInterview = selectedProfile.interviewHistory[0] || null;
      const cvMatchScore = Math.max(
        0,
        Math.min(100, selectedProfile.match || 0),
      );
      const cvAiScore = Math.max(0, Math.min(100, selectedProfile.ai || 0));
      const cvGapScore = Math.max(0, 100 - cvMatchScore);
      const matchedSkillCount = selectedProfile.matchedSkills.length;
      const missingSkillCount = selectedProfile.missingSkills.length;
      const totalSkillCount = Math.max(
        1,
        matchedSkillCount + missingSkillCount,
      );
      const cvSkillCoverage = Math.round(
        (matchedSkillCount / totalSkillCount) * 100,
      );
      const expectedYearsByLevel = {
        Intern: 0,
        Fresher: 0,
        Junior: 1,
        Middle: 3,
        Senior: 5,
        Lead: 6,
        Principal: 7,
        Manager: 6,
        Head: 8,
        Director: 10,
      };
      const expectedYears = expectedYearsByLevel[selectedJob?.level] ?? 3;
      const experienceYears = parseYears(selectedProfile.exp);
      const experienceFitScore = clamp(
        70 + (experienceYears - expectedYears) * 8,
      );
      const achievementEvidenceScore = clamp(
        85 - selectedProfile.improvements.length * 10,
      );
      const cvClarityScore = clamp(
        Math.round(cvAiScore * 0.6 + cvMatchScore * 0.4),
      );
      const cvDecisionScore = Math.round(
        cvSkillCoverage * 0.35 +
          experienceFitScore * 0.25 +
          achievementEvidenceScore * 0.2 +
          cvClarityScore * 0.2,
      );
      const cvDecision =
        cvDecisionScore >= 85
          ? "Đề xuất shortlist ngay"
          : cvDecisionScore >= 70
            ? "Đưa vào vòng đánh giá thêm"
            : "Cần bổ sung CV trước khi xét tiếp";
      const cvRiskFlags = [];
      if (missingSkillCount >= 2)
        cvRiskFlags.push(
          `Thiếu ${missingSkillCount} kỹ năng trọng yếu so với JD.`,
        );
      if (experienceFitScore < 65)
        cvRiskFlags.push(
          "Số năm kinh nghiệm thấp hơn kỳ vọng của cấp bậc tuyển.",
        );
      if (achievementEvidenceScore < 70)
        cvRiskFlags.push(
          "CV thiếu bằng chứng định lượng thành tích (KPI/KRI).",
        );
      if (!cvRiskFlags.length)
        cvRiskFlags.push("Không phát hiện rủi ro lớn từ hồ sơ CV.");
      const cvPriorityPlan = [
        {
          priority: "P1",
          task: `Bổ sung 2-3 case thực chiến cho kỹ năng: ${selectedProfile.missingSkills[0] || "kỹ năng cốt lõi JD"}.`,
        },
        {
          priority: "P2",
          task: "Viết lại phần thành tựu theo mẫu Problem - Action - Result, có số liệu cụ thể.",
        },
        {
          priority: "P3",
          task: "Rà soát CV theo JD và ưu tiên keyword ở phần Kinh nghiệm gần nhất.",
        },
      ];
      const cvMatrix = [
        {
          label: "Độ phủ kỹ năng",
          score: cvSkillCoverage,
          note: `${matchedSkillCount}/${totalSkillCount} kỹ năng`,
        },
        {
          label: "Phù hợp kinh nghiệm",
          score: experienceFitScore,
          note: `${experienceYears} năm vs kỳ vọng ${expectedYears}`,
        },
        {
          label: "Bằng chứng thành tích",
          score: achievementEvidenceScore,
          note: `${selectedProfile.improvements.length} điểm cần bổ sung`,
        },
        {
          label: "Rõ ràng hồ sơ",
          score: cvClarityScore,
          note: "Mức mạch lạc nội dung CV",
        },
      ];

      const interviewScores = selectedProfile.interviewHistory.map(
        (item) => item.score,
      );
      const maxInterviewScore = interviewScores.length
        ? Math.max(...interviewScores)
        : 0;
      const minInterviewScore = interviewScores.length
        ? Math.min(...interviewScores)
        : 0;
      const consistencyScore = interviewCount
        ? clamp(100 - (maxInterviewScore - minInterviewScore) * 3)
        : 0;
      const oldestInterview =
        selectedProfile.interviewHistory[interviewCount - 1] || null;
      const trendDelta =
        latestInterview && oldestInterview
          ? latestInterview.score - oldestInterview.score
          : 0;
      const trendText =
        trendDelta > 0
          ? `Tăng +${trendDelta}%`
          : trendDelta < 0
            ? `Giảm ${trendDelta}%`
            : "Ổn định";
      const passRate80 = interviewCount
        ? Math.round(
            (selectedProfile.interviewHistory.filter((item) => item.score >= 80)
              .length /
              interviewCount) *
              100,
          )
        : 0;
      const answerDepthScore = clamp(
        Math.round(averageInterviewScore * 0.55 + averageInterviewLogic * 0.45),
      );
      const collaborationScore = clamp(
        Math.round(
          averageInterviewExpression * 0.6 + averageInterviewLogic * 0.4 - 5,
        ),
      );
      const interviewDecisionScore = Math.round(
        averageInterviewScore * 0.35 +
          averageInterviewLogic * 0.25 +
          averageInterviewExpression * 0.2 +
          consistencyScore * 0.2,
      );
      const interviewDecision =
        interviewDecisionScore >= 85
          ? "Đủ điều kiện vào vòng cuối"
          : interviewDecisionScore >= 70
            ? "Cần thêm 1 buổi technical deep-dive"
            : "Cần huấn luyện trước khi phỏng vấn lại";
      const interviewRiskFlags = [];
      if (averageInterviewLogic < 80)
        interviewRiskFlags.push(
          "Điểm logic dưới ngưỡng kỳ vọng cho vòng chính thức.",
        );
      if (averageInterviewExpression < 80)
        interviewRiskFlags.push("Phong thái/trình bày chưa ổn định.");
      if (consistencyScore < 65)
        interviewRiskFlags.push("Biến động điểm lớn giữa các phiên phỏng vấn.");
      if (!interviewRiskFlags.length)
        interviewRiskFlags.push(
          "Hiệu suất phỏng vấn ổn định, không có rủi ro lớn.",
        );
      const interviewPriorityPlan = [
        {
          priority: "P1",
          task: "Luyện 5 câu hỏi tình huống khó, trả lời theo cấu trúc STAR/PAR.",
        },
        {
          priority: "P2",
          task: "Rà soát transcript để rút gọn câu trả lời, tăng trọng tâm kỹ thuật.",
        },
        {
          priority: "P3",
          task: "Thực hành mock interview 30 phút tập trung vào phản biện và follow-up.",
        },
      ];
      const interviewMatrix = [
        {
          label: "Năng lực tổng thể",
          score: averageInterviewScore,
          note: `${interviewCount} phiên`,
        },
        {
          label: "Tư duy logic",
          score: averageInterviewLogic,
          note: "Phân tích bài toán & lập luận",
        },
        {
          label: "Giao tiếp/phong thái",
          score: averageInterviewExpression,
          note: "Rõ ràng, tự tin, mạch lạc",
        },
        {
          label: "Độ sâu câu trả lời",
          score: answerDepthScore,
          note: "Khả năng đi sâu kỹ thuật",
        },
        {
          label: "Độ ổn định",
          score: consistencyScore,
          note: `${trendText} so với phiên đầu`,
        },
        {
          label: "Khả năng phối hợp",
          score: collaborationScore,
          note: "Tương tác, teamwork mindset",
        },
      ];
      const openInterviewBook = (page = 0, interviewId = "") => {
        const firstVideoInterviewId =
          selectedProfile.interviewHistory.find((item) => item.recordingUrl)
            ?.id || "";
        setInterviewBookPage(page);
        setSelectedInterviewVideoId(interviewId || firstVideoInterviewId);
        setInterviewBookOpen(true);
      };
      const closeInterviewBook = () => {
        setInterviewBookOpen(false);
        setInterviewBookPage(0);
      };
      const interviewBookPages = [
        {
          id: "ai-overview",
          title: "Tổng Quan AI",
          content: (
            <div className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <div
                  className={themeClass(
                    "rounded-lg border border-blue-200 bg-blue-50 p-3",
                    "rounded-lg border border-blue-900 bg-blue-950/40 p-3",
                    isDark,
                  )}
                >
                  <p
                    className={themeClass(
                      "text-xs text-blue-700",
                      "text-xs text-blue-200",
                      isDark,
                    )}
                  >
                    Đánh giá CV
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    AI CV: {cvAiScore}% • Khớp JD: {cvMatchScore}%
                  </p>
                  <p
                    className={themeClass(
                      "mt-1 text-xs text-blue-700",
                      "mt-1 text-xs text-blue-200",
                      isDark,
                    )}
                  >
                    Kết luận: {cvDecision}
                  </p>
                </div>
                <div
                  className={themeClass(
                    "rounded-lg border border-emerald-200 bg-emerald-50 p-3",
                    "rounded-lg border border-emerald-900 bg-emerald-950/40 p-3",
                    isDark,
                  )}
                >
                  <p
                    className={themeClass(
                      "text-xs text-emerald-700",
                      "text-xs text-emerald-200",
                      isDark,
                    )}
                  >
                    Đánh giá phỏng vấn
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    TB: {averageInterviewScore}% • Logic:{" "}
                    {averageInterviewLogic}%
                  </p>
                  <p
                    className={themeClass(
                      "mt-1 text-xs text-emerald-700",
                      "mt-1 text-xs text-emerald-200",
                      isDark,
                    )}
                  >
                    Kết luận: {interviewDecision}
                  </p>
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <div
                  className={themeClass(
                    "rounded-lg border border-slate-200 bg-slate-50 p-2.5",
                    "rounded-lg border border-slate-700 bg-slate-800 p-2.5",
                    isDark,
                  )}
                >
                  <p
                    className={themeClass(
                      "text-xs text-slate-500",
                      "text-xs text-slate-400",
                      isDark,
                    )}
                  >
                    Điểm quyết định CV
                  </p>
                  <p className="text-sm font-bold">{cvDecisionScore}%</p>
                </div>
                <div
                  className={themeClass(
                    "rounded-lg border border-slate-200 bg-slate-50 p-2.5",
                    "rounded-lg border border-slate-700 bg-slate-800 p-2.5",
                    isDark,
                  )}
                >
                  <p
                    className={themeClass(
                      "text-xs text-slate-500",
                      "text-xs text-slate-400",
                      isDark,
                    )}
                  >
                    Điểm quyết định PV
                  </p>
                  <p className="text-sm font-bold">{interviewDecisionScore}%</p>
                </div>
                <div
                  className={themeClass(
                    "rounded-lg border border-slate-200 bg-slate-50 p-2.5",
                    "rounded-lg border border-slate-700 bg-slate-800 p-2.5",
                    isDark,
                  )}
                >
                  <p
                    className={themeClass(
                      "text-xs text-slate-500",
                      "text-xs text-slate-400",
                      isDark,
                    )}
                  >
                    Xu hướng
                  </p>
                  <p className="text-sm font-bold">{trendText}</p>
                </div>
              </div>
            </div>
          ),
        },
        {
          id: "cv-detail",
          title: "Chi Tiết CV",
          content: (
            <div className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-3">
                <div
                  className={themeClass(
                    "rounded-lg border border-slate-200 bg-slate-50 p-2.5",
                    "rounded-lg border border-slate-700 bg-slate-800 p-2.5",
                    isDark,
                  )}
                >
                  <p
                    className={themeClass(
                      "text-xs text-slate-500",
                      "text-xs text-slate-400",
                      isDark,
                    )}
                  >
                    Kỹ năng khớp
                  </p>
                  <p className="text-sm font-bold">{matchedSkillCount}</p>
                </div>
                <div
                  className={themeClass(
                    "rounded-lg border border-slate-200 bg-slate-50 p-2.5",
                    "rounded-lg border border-slate-700 bg-slate-800 p-2.5",
                    isDark,
                  )}
                >
                  <p
                    className={themeClass(
                      "text-xs text-slate-500",
                      "text-xs text-slate-400",
                      isDark,
                    )}
                  >
                    Kỹ năng thiếu
                  </p>
                  <p className="text-sm font-bold">{missingSkillCount}</p>
                </div>
                <div
                  className={themeClass(
                    "rounded-lg border border-slate-200 bg-slate-50 p-2.5",
                    "rounded-lg border border-slate-700 bg-slate-800 p-2.5",
                    isDark,
                  )}
                >
                  <p
                    className={themeClass(
                      "text-xs text-slate-500",
                      "text-xs text-slate-400",
                      isDark,
                    )}
                  >
                    Độ phủ kỹ năng
                  </p>
                  <p className="text-sm font-bold">{cvSkillCoverage}%</p>
                </div>
              </div>
              <div
                className={themeClass(
                  "rounded-lg border border-slate-200 bg-slate-50 p-3",
                  "rounded-lg border border-slate-700 bg-slate-800 p-3",
                  isDark,
                )}
              >
                <p className="text-xs font-semibold uppercase tracking-wide">
                  Ma trận đánh giá CV
                </p>
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full min-w-[420px] text-left text-xs">
                    <thead>
                      <tr>
                        <th className="py-1.5 pr-2 font-semibold">Tiêu chí</th>
                        <th className="py-1.5 pr-2 font-semibold">Điểm</th>
                        <th className="py-1.5 font-semibold">Nhận xét</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cvMatrix.map((row) => (
                        <tr
                          key={row.label}
                          className={themeClass(
                            "border-t border-slate-200",
                            "border-t border-slate-700",
                            isDark,
                          )}
                        >
                          <td className="py-1.5 pr-2 font-medium">
                            {row.label}
                          </td>
                          <td className="py-1.5 pr-2">{row.score}%</td>
                          <td className="py-1.5">{row.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide">
                  Rủi ro CV
                </p>
                <div className="mt-1 space-y-1">
                  {cvRiskFlags.map((risk) => (
                    <p
                      key={risk}
                      className={themeClass(
                        "text-sm text-slate-700",
                        "text-sm text-slate-200",
                        isDark,
                      )}
                    >
                      - {risk}
                    </p>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide">
                  Kế hoạch cải thiện CV
                </p>
                <div className="mt-1 space-y-1">
                  {cvPriorityPlan.map((item) => (
                    <p
                      key={item.priority}
                      className={themeClass(
                        "text-sm text-slate-700",
                        "text-sm text-slate-200",
                        isDark,
                      )}
                    >
                      <strong>{item.priority}:</strong> {item.task}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          ),
        },
        {
          id: "overview",
          title: "Tổng Quan",
          content: (
            <div className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <div
                  className={themeClass(
                    "rounded-lg border border-slate-200 bg-slate-50 p-3",
                    "rounded-lg border border-slate-700 bg-slate-800 p-3",
                    isDark,
                  )}
                >
                  <p
                    className={themeClass(
                      "text-xs text-slate-500",
                      "text-xs text-slate-400",
                      isDark,
                    )}
                  >
                    Điểm phỏng vấn trung bình
                  </p>
                  <p className="mt-1 text-xl font-bold">
                    {averageInterviewScore}%
                  </p>
                </div>
                <div
                  className={themeClass(
                    "rounded-lg border border-slate-200 bg-slate-50 p-3",
                    "rounded-lg border border-slate-700 bg-slate-800 p-3",
                    isDark,
                  )}
                >
                  <p
                    className={themeClass(
                      "text-xs text-slate-500",
                      "text-xs text-slate-400",
                      isDark,
                    )}
                  >
                    Kết luận AI
                  </p>
                  <p className="mt-1 text-sm font-bold">{interviewDecision}</p>
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <div
                  className={themeClass(
                    "rounded-lg border border-slate-200 bg-slate-50 p-2.5",
                    "rounded-lg border border-slate-700 bg-slate-800 p-2.5",
                    isDark,
                  )}
                >
                  <p
                    className={themeClass(
                      "text-xs text-slate-500",
                      "text-xs text-slate-400",
                      isDark,
                    )}
                  >
                    Logic
                  </p>
                  <p className="text-sm font-semibold">
                    {averageInterviewLogic}%
                  </p>
                </div>
                <div
                  className={themeClass(
                    "rounded-lg border border-slate-200 bg-slate-50 p-2.5",
                    "rounded-lg border border-slate-700 bg-slate-800 p-2.5",
                    isDark,
                  )}
                >
                  <p
                    className={themeClass(
                      "text-xs text-slate-500",
                      "text-xs text-slate-400",
                      isDark,
                    )}
                  >
                    Phong thái
                  </p>
                  <p className="text-sm font-semibold">
                    {averageInterviewExpression}%
                  </p>
                </div>
                <div
                  className={themeClass(
                    "rounded-lg border border-slate-200 bg-slate-50 p-2.5",
                    "rounded-lg border border-slate-700 bg-slate-800 p-2.5",
                    isDark,
                  )}
                >
                  <p
                    className={themeClass(
                      "text-xs text-slate-500",
                      "text-xs text-slate-400",
                      isDark,
                    )}
                  >
                    Xu hướng
                  </p>
                  <p className="text-sm font-semibold">{trendText}</p>
                </div>
              </div>
              <p
                className={themeClass(
                  "text-sm text-slate-700",
                  "text-sm text-slate-200",
                  isDark,
                )}
              >
                {latestInterview
                  ? `Phiên gần nhất (${formatDate(latestInterview.date)}): ${latestInterview.score}% • ${latestInterview.duration}.`
                  : "Chưa có dữ liệu phiên phỏng vấn."}
              </p>
            </div>
          ),
        },
        {
          id: "video",
          title: "Video Phỏng Vấn",
          content: (
            <div className="space-y-3 max-w-3xl">
              {activeInterviewVideo?.recordingUrl ? (
                <div
                  className={themeClass(
                    "rounded-xl border border-slate-200 bg-white p-3",
                    "rounded-xl border border-slate-700 bg-slate-900 p-3",
                    isDark,
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">
                      Video phiên {formatDate(activeInterviewVideo.date)}
                    </p>
                    <a
                      href={activeInterviewVideo.recordingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={themeClass(
                        "text-xs font-semibold text-blue-700",
                        "text-xs font-semibold text-blue-300",
                        isDark,
                      )}
                    >
                      Mở tab mới
                    </a>
                  </div>
                  <video
                    controls
                    className="mt-2 aspect-video w-full max-h-[420px] rounded-lg border border-slate-200 object-contain dark:border-slate-700"
                    src={activeInterviewVideo.recordingUrl}
                  >
                    Trình duyệt không hỗ trợ phát video.
                  </video>
                </div>
              ) : (
                <p
                  className={themeClass(
                    "text-sm text-slate-600",
                    "text-sm text-slate-300",
                    isDark,
                  )}
                >
                  Ứng viên chưa có video ghi hình phỏng vấn.
                </p>
              )}
            </div>
          ),
        },
      ];
      const totalInterviewBookPages = interviewBookPages.length;
      const safeInterviewBookPage = Math.max(
        0,
        Math.min(totalInterviewBookPages - 1, interviewBookPage),
      );
      const currentInterviewBookPage =
        interviewBookPages[safeInterviewBookPage];
      const getInterviewBookPageIndex = (pageId, fallback = 0) => {
        const index = interviewBookPages.findIndex(
          (page) => page.id === pageId,
        );
        return index >= 0 ? index : fallback;
      };

      return (
        <Card isDark={isDark} className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold">Hồ sơ ứng viên chi tiết</h3>
              <p
                className={themeClass(
                  "mt-1 text-sm text-slate-600",
                  "mt-1 text-sm text-slate-300",
                  isDark,
                )}
              >
                {selectedProfile.name} • {selectedProfile.jobTitle}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setDetailView("none");
                closeInterviewBook();
              }}
              className={themeClass(
                "rounded-xl border border-slate-200 bg-slate-100 p-2 text-slate-700",
                "rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-200",
                isDark,
              )}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <section
              className={themeClass(
                "rounded-2xl border border-slate-200 bg-slate-50 p-4",
                "rounded-2xl border border-slate-700 bg-slate-800 p-4",
                isDark,
              )}
            >
              <h4 className="text-base font-bold">CV gốc (Preview PDF)</h4>
              <div className="mt-3 h-[calc(100vh-280px)] min-h-[560px] rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950">
                <iframe
                  title="cv-preview"
                  src={`${selectedProfile.cvPdf}#zoom=page-fit`}
                  className="h-full w-full rounded-xl"
                />
              </div>
            </section>
            <section
              className={themeClass(
                "rounded-2xl border border-slate-200 bg-slate-50 p-4",
                "rounded-2xl border border-slate-700 bg-slate-800 p-4",
                isDark,
              )}
            >
              <h4 className="text-base font-bold">Đánh giá AI (thu gọn)</h4>
              <div
                className={themeClass(
                  "mt-3 rounded-xl border border-slate-200 bg-white p-3",
                  "mt-3 rounded-xl border border-slate-700 bg-slate-900 p-3",
                  isDark,
                )}
              >
                <div className="grid gap-2 sm:grid-cols-2">
                  <div
                    className={themeClass(
                      "rounded-lg border border-blue-200 bg-blue-50 p-2.5",
                      "rounded-lg border border-blue-900 bg-blue-950/40 p-2.5",
                      isDark,
                    )}
                  >
                    <p
                      className={themeClass(
                        "text-xs text-blue-700",
                        "text-xs text-blue-200",
                        isDark,
                      )}
                    >
                      CV
                    </p>
                    <p className="text-sm font-semibold">
                      AI {cvAiScore}% • Khớp JD {cvMatchScore}% • Quyết định{" "}
                      {cvDecisionScore}%
                    </p>
                  </div>
                  <div
                    className={themeClass(
                      "rounded-lg border border-emerald-200 bg-emerald-50 p-2.5",
                      "rounded-lg border border-emerald-900 bg-emerald-950/40 p-2.5",
                      isDark,
                    )}
                  >
                    <p
                      className={themeClass(
                        "text-xs text-emerald-700",
                        "text-xs text-emerald-200",
                        isDark,
                      )}
                    >
                      Phỏng vấn
                    </p>
                    <p className="text-sm font-semibold">
                      TB {averageInterviewScore}% • Logic{" "}
                      {averageInterviewLogic}% • Quyết định{" "}
                      {interviewDecisionScore}%
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => openInterviewBook(0)}
                    className={themeClass(
                      "rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700",
                      "rounded-lg border border-blue-900 bg-blue-950/40 px-3 py-2 text-sm font-semibold text-blue-200",
                      isDark,
                    )}
                  >
                    Xem chi tiết
                  </button>
                </div>
              </div>
            </section>
          </div>

          {interviewBookOpen && typeof document !== "undefined"
            ? createPortal(
                <div className="fixed inset-0 z-[120] grid place-items-center bg-slate-950/65 px-3 py-5">
                  <section
                    className={themeClass(
                      "w-full max-w-5xl rounded-2xl border border-slate-200 bg-white shadow-2xl",
                      "w-full max-w-5xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl",
                      isDark,
                    )}
                  >
                    <header
                      className={themeClass(
                        "flex items-start justify-between border-b border-slate-200 px-4 py-3 sm:px-5",
                        "flex items-start justify-between border-b border-slate-700 px-4 py-3 sm:px-5",
                        isDark,
                      )}
                    >
                      <div>
                        <h4 className="text-lg font-bold">
                          Sổ tay đánh giá phỏng vấn
                        </h4>
                        <p
                          className={themeClass(
                            "mt-0.5 text-sm text-slate-600",
                            "mt-0.5 text-sm text-slate-300",
                            isDark,
                          )}
                        >
                          Trang {safeInterviewBookPage + 1}/
                          {totalInterviewBookPages} •{" "}
                          {currentInterviewBookPage.title}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={closeInterviewBook}
                        className={themeClass(
                          "rounded-lg border border-slate-200 bg-slate-100 p-2 text-slate-700",
                          "rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-200",
                          isDark,
                        )}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </header>

                    <div className="px-4 py-4 sm:px-5 sm:py-5">
                      <div
                        className={themeClass(
                          "relative overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-4",
                          "relative overflow-hidden rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-4",
                          isDark,
                        )}
                      >
                        <div
                          className={themeClass(
                            "absolute bottom-0 left-8 top-0 w-1 bg-amber-200",
                            "absolute bottom-0 left-8 top-0 w-1 bg-slate-700",
                            isDark,
                          )}
                        />
                        <div className="relative pl-8">
                          {currentInterviewBookPage.content}
                        </div>
                      </div>
                    </div>

                    <footer
                      className={themeClass(
                        "flex items-center justify-between border-t border-slate-200 px-4 py-3 sm:px-5",
                        "flex items-center justify-between border-t border-slate-700 px-4 py-3 sm:px-5",
                        isDark,
                      )}
                    >
                      <button
                        type="button"
                        disabled={safeInterviewBookPage <= 0}
                        onClick={() =>
                          setInterviewBookPage((prev) => Math.max(0, prev - 1))
                        }
                        className={themeClass(
                          "rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:opacity-40",
                          "rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm font-semibold text-slate-200 disabled:opacity-40",
                          isDark,
                        )}
                      >
                        Trang trước
                      </button>
                      <p
                        className={themeClass(
                          "text-xs text-slate-600",
                          "text-xs text-slate-300",
                          isDark,
                        )}
                      >
                        Lật trang như một cuốn sách để xem toàn bộ thông tin.
                      </p>
                      <button
                        type="button"
                        disabled={
                          safeInterviewBookPage >= totalInterviewBookPages - 1
                        }
                        onClick={() =>
                          setInterviewBookPage((prev) =>
                            Math.min(totalInterviewBookPages - 1, prev + 1),
                          )
                        }
                        className={themeClass(
                          "rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:opacity-40",
                          "rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm font-semibold text-slate-200 disabled:opacity-40",
                          isDark,
                        )}
                      >
                        Trang sau
                      </button>
                    </footer>
                  </section>
                </div>,
                document.body,
              )
            : null}
        </Card>
      );
    }

    return null;
  };

  const renderMain = () => {
    if (detailView !== "none") {
      return (
        <div className="space-y-3">
          <button
            type="button"
            onClick={goBackToPreviousContext}
            className={themeClass(
              "inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700",
              "inline-flex items-center rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm font-semibold text-slate-200",
              isDark,
            )}
          >
            ←
          </button>
          {renderDetailView()}
        </div>
      );
    }

    if (view === "dashboard") {
      return (
        <div className="space-y-6">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((s) => (
              <Card key={s.label} isDark={isDark} className="p-4">
                <p
                  className={themeClass(
                    "text-sm text-slate-500",
                    "text-sm text-slate-400",
                    isDark,
                  )}
                >
                  {s.label}
                </p>
                <p className="mt-2 text-3xl font-bold">{s.value}</p>
              </Card>
            ))}
          </section>
          {renderOverviewCharts()}
        </div>
      );
    }
    if (view === "job-list") return renderJobs();
    if (view === "candidate-list") return renderCandidates();
    if (view === "report-list") return renderReports();
    return (
      <Card isDark={isDark} className="p-5 sm:p-6">
        <h2 className="text-lg font-bold">Cài đặt tài khoản</h2>
        <p
          className={themeClass(
            "mt-2 text-sm text-slate-600",
            "mt-2 text-sm text-slate-300",
            isDark,
          )}
        >
          {companyName || "Doanh nghiệp"} • {recruiterName || "Nhà tuyển dụng"}
        </p>
      </Card>
    );
  };

  return (
    <main
      className={`interview-legacy theme-${theme} ${themeClass("min-h-screen bg-[#f8fbff] text-slate-900", "min-h-screen bg-slate-950 text-slate-100", isDark)}`}
    >
      <header className="legacy-header">
        <div className="legacy-header-inner gap-3">
          <div className="inline-flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-blue-700 text-white">
              <Sparkles className="h-4 w-4" />
            </span>
            <p className="font-display text-base font-bold">AI Interview</p>
          </div>

          <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              aria-pressed={isDark}
              className="legacy-theme-toggle"
            >
              {isDark ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
              <span>{isDark ? "Sáng" : "Tối"}</span>
            </button>

            <div ref={notifyRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotifyOpen((prev) => !prev);
                  setNotifications((items) =>
                    items.map((item) => ({ ...item, isRead: true })),
                  );
                }}
                className={themeClass(
                  "relative grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-slate-600",
                  "relative grid h-10 w-10 place-items-center rounded-full border border-slate-700 text-slate-300",
                  isDark,
                )}
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 ? (
                  <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                ) : null}
              </button>

              {notifyOpen ? (
                <div
                  className={themeClass(
                    "absolute right-0 z-50 mt-3 w-[420px] max-w-[calc(100vw-24px)] rounded-2xl border border-slate-200 bg-white shadow-2xl",
                    "absolute right-0 z-50 mt-3 w-[420px] max-w-[calc(100vw-24px)] rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl",
                    isDark,
                  )}
                >
                  {notifications.map((item) => (
                    <article
                      key={item.id}
                      className={themeClass(
                        "border-b border-slate-100 px-4 py-3 last:border-b-0",
                        "border-b border-slate-800 px-4 py-3 last:border-b-0",
                        isDark,
                      )}
                    >
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p
                        className={themeClass(
                          "mt-1 text-xs text-slate-600",
                          "mt-1 text-xs text-slate-300",
                          isDark,
                        )}
                      >
                        {item.description}
                      </p>
                    </article>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <div className="legacy-layout">
        <aside className="legacy-sidebar">
          <div className="legacy-sidebar-inner !top-0">
            <div className="legacy-sidebar-nav">
              <div className="legacy-nav-group">
                <div className="legacy-nav-list">
                  {MENUS.map((m) => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => openMenu(m.id)}
                        className={`legacy-nav-btn ${menu === m.id ? "active" : ""}`}
                      >
                        <span className="legacy-nav-icon">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="truncate">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => requestNavigation({ type: "profile" })}
              className="legacy-user-summary"
            >
              <span className="legacy-user-avatar">{userInitial}</span>
              <span className="legacy-user-meta">
                <strong>{recruiterName || "Người dùng"}</strong>
                <small>{companyName || "Doanh nghiệp"}</small>
              </span>
            </button>
          </div>
        </aside>

        <section className="legacy-main">
          <div className="legacy-main-inner">
            <div className="legacy-main-content !mx-0 !max-w-none !px-4 md:!px-6 lg:!px-8">
              <div
                className={themeClass(
                  "rounded-3xl border border-slate-200 bg-white/60 p-5 shadow-sm sm:p-6",
                  "rounded-3xl border border-slate-800 bg-slate-950/80 p-5 shadow-sm sm:p-6",
                  isDark,
                )}
              >
                {renderMain()}
              </div>
            </div>
          </div>
        </section>
      </div>

      {leaveWarningOpen ? (
        <div className="fixed inset-0 z-[125] grid place-items-center bg-slate-950/45 px-4 py-6">
          <section
            className={themeClass(
              "w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl",
              "w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl",
              isDark,
            )}
          >
            <h3 className="text-base font-bold">Bạn có thay đổi chưa lưu</h3>
            <p
              className={themeClass(
                "mt-2 text-sm text-slate-600",
                "mt-2 text-sm text-slate-300",
                isDark,
              )}
            >
              Cột trạng thái JD đang có thay đổi. Bạn muốn lưu trước khi rời
              trang không?
            </p>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={closeLeaveWarning}
                className={themeClass(
                  "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700",
                  "rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-semibold text-slate-200",
                  isDark,
                )}
              >
                Ở lại
              </button>
              <button
                type="button"
                onClick={confirmLeaveDiscard}
                className={themeClass(
                  "rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700",
                  "rounded-lg border border-amber-900 bg-amber-950/40 px-3 py-2 text-sm font-semibold text-amber-200",
                  isDark,
                )}
              >
                Rời đi không lưu
              </button>
              <button
                type="button"
                onClick={confirmLeaveSave}
                className={themeClass(
                  "rounded-lg border border-blue-600 bg-blue-600 px-3 py-2 text-sm font-semibold text-white",
                  "rounded-lg border border-blue-500 bg-blue-500 px-3 py-2 text-sm font-semibold text-white",
                  isDark,
                )}
              >
                Lưu và rời đi
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {jdModalOpen ? (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/45 px-4 py-6">
          <section
            className={themeClass(
              "w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl",
              "w-full max-w-3xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl",
              isDark,
            )}
          >
            <form onSubmit={submitJd}>
              <header
                className={themeClass(
                  "flex items-center justify-between border-b border-slate-200 px-5 py-4",
                  "flex items-center justify-between border-b border-slate-700 px-5 py-4",
                  isDark,
                )}
              >
                <h3 className="text-lg font-bold">
                  {editingJobId ? "Cập nhật JD" : "Thêm mới JD"}
                </h3>
                <button
                  type="button"
                  onClick={closeJdModal}
                  className={themeClass(
                    "rounded-lg border border-slate-200 bg-slate-100 p-2 text-slate-700",
                    "rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-200",
                    isDark,
                  )}
                >
                  <X className="h-4 w-4" />
                </button>
              </header>

              <div className="grid gap-4 p-5 sm:grid-cols-2">
                <label className="grid gap-1.5 sm:col-span-2">
                  <span className="text-sm font-semibold">Tiêu đề</span>
                  <input
                    value={jdForm.title}
                    onChange={(event) =>
                      setJdForm((prev) => ({
                        ...prev,
                        title: event.target.value,
                      }))
                    }
                    className={themeClass(
                      "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm",
                      "rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm",
                      isDark,
                    )}
                    required
                  />
                </label>

                <label className="grid gap-1.5">
                  <span className="text-sm font-semibold">Phòng ban</span>
                  <input
                    value={jdForm.dept}
                    onChange={(event) =>
                      setJdForm((prev) => ({
                        ...prev,
                        dept: event.target.value,
                      }))
                    }
                    className={themeClass(
                      "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm",
                      "rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm",
                      isDark,
                    )}
                    required
                  />
                </label>

                <label className="grid gap-1.5">
                  <span className="text-sm font-semibold">Cấp bậc</span>
                  <select
                    value={jdForm.level}
                    onChange={(event) =>
                      setJdForm((prev) => ({
                        ...prev,
                        level: event.target.value,
                      }))
                    }
                    className={themeClass(
                      "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm",
                      "rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm",
                      isDark,
                    )}
                  >
                    {JD_LEVEL_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1.5 sm:col-span-2">
                  <span className="text-sm font-semibold">Mô tả công việc</span>
                  <textarea
                    rows={5}
                    value={jdForm.description}
                    onChange={(event) =>
                      setJdForm((prev) => ({
                        ...prev,
                        description: event.target.value,
                      }))
                    }
                    className={themeClass(
                      "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm",
                      "rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm",
                      isDark,
                    )}
                    required
                  />
                </label>

                <label className="grid gap-1.5">
                  <span className="text-sm font-semibold">
                    Hard skills (phân tách bằng dấu phẩy)
                  </span>
                  <input
                    value={jdForm.hardSkills}
                    onChange={(event) =>
                      setJdForm((prev) => ({
                        ...prev,
                        hardSkills: event.target.value,
                      }))
                    }
                    className={themeClass(
                      "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm",
                      "rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm",
                      isDark,
                    )}
                  />
                </label>

                <label className="grid gap-1.5">
                  <span className="text-sm font-semibold">
                    Soft skills (phân tách bằng dấu phẩy)
                  </span>
                  <input
                    value={jdForm.softSkills}
                    onChange={(event) =>
                      setJdForm((prev) => ({
                        ...prev,
                        softSkills: event.target.value,
                      }))
                    }
                    className={themeClass(
                      "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm",
                      "rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm",
                      isDark,
                    )}
                  />
                </label>

                <label className="grid gap-1.5 sm:col-span-2">
                  <span className="text-sm font-semibold">Range lương</span>
                  <select
                    value={jdForm.salary}
                    onChange={(event) =>
                      setJdForm((prev) => ({
                        ...prev,
                        salary: event.target.value,
                      }))
                    }
                    className={themeClass(
                      "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm",
                      "rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm",
                      isDark,
                    )}
                  >
                    {JD_SALARY_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <footer
                className={themeClass(
                  "flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-5 py-4",
                  "flex flex-wrap items-center justify-between gap-2 border-t border-slate-700 px-5 py-4",
                  isDark,
                )}
              >
                <button
                  type="button"
                  onClick={optimizeByAi}
                  className={themeClass(
                    "inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700",
                    "inline-flex items-center gap-2 rounded-lg border border-blue-900 bg-blue-950/40 px-3 py-2 text-sm font-semibold text-blue-200",
                    isDark,
                  )}
                >
                  <WandSparkles className="h-4 w-4" />
                  Tối ưu hóa bằng AI
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={closeJdModal}
                    className={themeClass(
                      "rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700",
                      "rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200",
                      isDark,
                    )}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className={themeClass(
                      "rounded-lg border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-semibold text-white",
                      "rounded-lg border border-blue-500 bg-blue-500 px-4 py-2 text-sm font-semibold text-white",
                      isDark,
                    )}
                  >
                    {editingJobId ? "Cập nhật JD" : "Lưu JD"}
                  </button>
                </div>
              </footer>
            </form>
          </section>
        </div>
      ) : null}
    </main>
  );
}
