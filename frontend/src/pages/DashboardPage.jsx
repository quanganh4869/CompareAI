import React, { useEffect, useRef, useState, useCallback } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useLocation, useNavigate } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import { useUser } from "../features/UserContext";
import { getAccessToken } from "../utils/authSession";
import { dispatchNotice } from "../utils/notice";
import {
  uploadCvDocument,
  matchCvWithJdText,
  deleteDocument,
  createDocumentDownloadUrl,
  parseCvDocument,
  fetchMyDocuments,
  fetchMatchHistory,
  fetchMatchHistoryDetail,
} from "../api/documents";
import {
  BarChart,
  Target,
  CheckCircle2,
  FileText,
  Briefcase,
  ArrowRight,
  Sparkles,
  X,
  TrendingUp,
  Clock,
  Loader2,
  History,
  AlignLeft,
  Search,
  Check,
  FolderOpen,
  Plus,
  Trash2,
  ArrowLeft
} from "lucide-react";
import { CvDetailWindow } from "../features/aiInterview/components/modals";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { ComparingOverlay } from "../components/ui/ComparingOverlay";

/* Helpers */
function getScoreColorClass(score) {
  if (score >= 80) return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30";
  if (score >= 60) return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30";
  return "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30";
}

function getScoreRingColor(score) {
  if (score >= 80) return "#10B981"; // emerald-500
  if (score >= 60) return "#F59E0B"; // amber-500
  return "#F43F5E"; // rose-500
}

/* Mini Circular Progress */
function MiniProgressRing({ value, size = 56, strokeWidth = 5 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const color = getScoreRingColor(value);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-slate-100 dark:text-slate-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <span className="absolute text-xs font-bold text-slate-700 dark:text-slate-200">{value}%</span>
    </div>
  );
}

/* Upload Slot */
function UploadSlot({ label, hint, file, onRemove, onOpenLibrary, onOpenDetail, icon: Icon }) {
  return (
    <div 
      className={`relative flex flex-col items-center justify-center p-8 rounded-3xl border-2 border-dashed transition-all duration-300 min-h-[300px] group
        ${file ? "border-indigo-300 dark:border-indigo-500/50 bg-indigo-50/30 dark:bg-indigo-500/5 shadow-inner" : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:border-indigo-400 dark:hover:border-indigo-500 shadow-sm cursor-pointer"}
      `}
      onClick={() => !file && onOpenLibrary()}
    >
      {file && (
        <button
          className="absolute top-6 right-6 p-2 rounded-full bg-white dark:bg-slate-800 text-slate-400 shadow-md border border-slate-100 dark:border-slate-700 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all duration-200 z-10"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          title="Bỏ chọn"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      
      <div 
        className={`flex h-20 w-20 items-center justify-center rounded-2xl mb-5 transition-all duration-500 ${file ? "bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-lg shadow-indigo-200 dark:shadow-none scale-110" : "bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 shadow-sm border border-slate-100 dark:border-slate-700 group-hover:scale-110 group-hover:text-indigo-500"}`}
      >
        <Icon className="h-10 w-10" strokeWidth={1.5} />
      </div>
      
      <div className="text-center">
        <h4 className={`text-lg font-bold mb-2 ${file ? "text-indigo-900 dark:text-indigo-300" : "text-slate-900 dark:text-slate-100"}`}>
          {file ? "Đã chọn hồ sơ" : label}
        </h4>
        
        {file ? (
          <div className="flex flex-col items-center gap-1">
            <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400 break-all max-w-[240px]">
              {file.file_name}
            </span>
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500">
              PDF Document â€¢ ID: #{file.id}
            </span>
            
            <div className="flex items-center gap-2 mt-4">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onOpenDetail(file); }}
                className="px-4 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Xem chi tiết
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onOpenLibrary(); }}
                className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Thay đổi
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-[220px] leading-relaxed mx-auto">
              {hint}
            </p>
            
            <button
              type="button"
              className="inline-flex items-center justify-center px-8 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-xl transition-all shadow-md shadow-indigo-500/20 active:scale-95"
            >
              <Search className="h-4 w-4 mr-2" />
              Chọn từ kho hồ sơ
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const DashboardPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();

  const queryParams = new URLSearchParams(location.search);
  const currentScreen = queryParams.get("screen");

  /* Upload state */
  const [cvFile, setCvFile] = useState(null);
  const [selectedCvForDetail, setSelectedCvForDetail] = useState(null);
  const [cvPreviewUrl, setCvPreviewUrl] = useState("");
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [jdFile, setJdFile] = useState(null);
  const [jdText, setJdText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
  const [libraryDocuments, setLibraryDocuments] = useState([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [libraryType, setLibraryType] = useState('cv');
  const [isUploading, setIsUploading] = useState(false);
  const libraryInputRef = useRef(null);

  /* Confirmation state */
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    onCancel: () => {},
    tone: "danger"
  });

  const askConfirmation = (config) => {
    setConfirmConfig({
      isOpen: true,
      title: config.title || "Xác nhận",
      message: config.message || "Bạn có chắc chắn muốn thực hiện hành động này?",
      confirmText: config.confirmText,
      cancelText: config.cancelText,
      tone: config.tone || "danger",
      onConfirm: () => {
        config.onConfirm();
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      },
      onCancel: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
    });
  };

  /* Data state */
  const [recentActivity, setRecentActivity] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [stats, setStats] = useState({
    totalAnalyses: 0,
    avgScore: 0,
    optimizedCvs: 0,
  });

  useEffect(() => {
    if (!getAccessToken()) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const loadMatchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const payload = await fetchMatchHistory({ limit: 30, offset: 0 });
      const items = payload?.items || [];
      setRecentActivity(items);

      const totalAnalyses = payload?.total || 0;
      const avgScore = items.length
        ? Math.round(
            items.reduce((acc, item) => acc + (Number(item.overall_score) || 0), 0) /
              items.length,
          )
        : 0;
      const optimizedCvs = items.filter(
        (item) => Number(item.overall_score) >= 80,
      ).length;

      setStats({
        totalAnalyses,
        avgScore,
        optimizedCvs,
      });
    } catch (err) {
      console.error("Failed to load match history:", err);
      dispatchNotice({
        tone: "danger",
        title: "Lỗi",
        message: "Không thể tải lịch sử đối chiếu.",
      });
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    if (currentScreen === "profileCv") {
      loadLibrary();
    }
  }, [currentScreen]);

  useEffect(() => {
    if (currentScreen === "history" || !currentScreen) {
      loadMatchHistory();
    }
  }, [currentScreen, loadMatchHistory]);

  const loadLibrary = async () => {
    setLoadingLibrary(true);
    try {
      const docs = await fetchMyDocuments({ documentType: 'cv' });
      setLibraryDocuments(docs || []);
    } catch (err) {
      console.error("Failed to load library:", err);
      dispatchNotice({
        tone: "danger",
        title: "Lỗi",
        message: "Không thể tải danh sách tài liệu từ kho.",
      });
    } finally {
      setLoadingLibrary(false);
    }
  };

  const handleOpenLibrary = () => {
    setIsLibraryModalOpen(true);
    loadLibrary();
  };

  const handleViewReport = async (analysisId) => {
    try {
      const detail = await fetchMatchHistoryDetail({ analysisId });
      const result = detail?.result || {};
      const cvFileName = detail?.cv_file_name || "Ứng viên";
      const cvRole = detail?.cv_metadata_json?.target_role || "Chưa xác định";
      const jdText = detail?.jd_text || "";

      const enrichedResult = {
        ...result,
        candidate_name: cvFileName.split(".")[0] || "Ứng viên",
        candidate_title: cvRole,
        job_title: jdText.trim().split("\n")[0].substring(0, 80) || "Vị trí tuyển dụng",
        years_of_experience: "N/A",
        education: detail?.cv_metadata_json?.education || "N/A",
      };

      navigate("/cv-screening-demo", {
        state: {
          matchResult: enrichedResult,
          reportId: analysisId,
          timestamp: Date.now(),
        },
      });
    } catch (error) {
      dispatchNotice({
        tone: "danger",
        title: "Lỗi",
        message: error?.message || "Không thể tải chi tiết báo cáo.",
      });
    }
  };

  /* Handlers */
  const handleAnalyze = async () => {
    if (!cvFile || !jdText.trim()) {
      dispatchNotice({
        tone: "warning",
        title: "Thiếu dữ liệu",
        message: "Vui lòng chọn hồ sơ từ kho và nhập Mô tả công việc (JD) trước khi phân tích.",
      });
      return;
    }

    setAnalyzing(true);
    try {
      const cvId = cvFile.id;
      
      // Add a minimum delay of 3.5s to show the beautiful AI scanning animation
      const [matchResult] = await Promise.all([
        matchCvWithJdText({
          cvDocumentId: cvId,
          jdText: jdText.trim(),
        }),
        new Promise(resolve => setTimeout(resolve, 3500))
      ]);

      // Enrich result with metadata for display
      const enrichedResult = {
        ...matchResult,
        candidate_name: cvFile?.file_name?.split('.')[0] || "Ứng viên",
        candidate_title: cvFile?.metadata_json?.target_role || "Chưa xác định",
        job_title: jdText.trim().split("\n")[0].substring(0, 50) || "Vị trí tuyển dụng",
        years_of_experience: `${matchResult?.experience?.cv || 0} năm`,
        education: cvFile?.metadata_json?.education || "N/A"
      };

      navigate("/cv-screening-demo", {
        state: { 
          matchResult: enrichedResult, 
          cvId: cvId, 
          jdId: null,
          timestamp: Date.now() // Force refresh for different files
        },
      });

      dispatchNotice({
        tone: "success",
        title: "Hoàn tất",
        message: "Phân tích CV & JD hoàn tất!",
      });
    } catch (error) {
      dispatchNotice({
        tone: "danger",
        title: "Lỗi",
        message: error?.message || "Không thể phân tích. Vui lòng thử lại.",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const userName = user?.name?.split(" ").pop() || "bạn";

  /* Handlers: Detail Window */
  const handleOpenCvDetail = async (doc) => {
    setSelectedCvForDetail(doc);
    setLoadingPreview(true);
    setCvPreviewUrl(""); 
    try {
      // 1. Fetch preview URL
      const result = await createDocumentDownloadUrl({ documentId: doc.id });
      if (result?.download_url) {
        setCvPreviewUrl(result.download_url);
      }

      // 2. Check if parsed data exists, if not, try parsing it
      if (!doc.metadata_json?.profile_summary || !doc.metadata_json?.extracted_text) {
        setLoadingPreview(true); // Keep loading state for parsing
        try {
          const parsed = await parseCvDocument({ documentId: doc.id });
          if (parsed) {
            // Update the document in the list if it's there
            setLibraryDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, metadata_json: parsed } : d));
            // Also update the selected doc
            setSelectedCvForDetail(prev => ({ ...prev, metadata_json: parsed }));
          }
        } catch (err) {
          console.error("Auto-parsing failed:", err);
        }
      }
    } catch (error) {
      console.error("Failed to fetch preview URL:", error);
      dispatchNotice({
        tone: "danger",
        title: "Lỗi xem trước",
        message: "Không thể lấy đường dẫn xem trước tài liệu."
      });
    } finally {
      setLoadingPreview(false);
    }
  };

  /* View A: Overview */
  const renderOverview = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="mb-8">
        <h1 className="text-3xl font-display font-extrabold text-slate-900 dark:text-white tracking-tight">
          Tổng quan hiệu suất
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400 text-lg">
          Chào mừng trở lại, <span className="font-semibold text-indigo-600 dark:text-indigo-400">{userName}</span>! Dưới đây là tóm tắt hành trình của bạn.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Card 1 */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-md transition duration-300">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400">
              <BarChart className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Tổng số lần phân tích</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-bold text-slate-900 dark:text-white">{stats.totalAnalyses}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-md transition duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">?i?m ph? h?p trung b?nh</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-bold text-slate-900 dark:text-white">{stats.avgScore}%</span>
              </div>
            </div>
            <MiniProgressRing value={stats.avgScore} size={60} strokeWidth={6} />
          </div>
        </div>

        {/* Card 3 */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-md transition duration-300">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">CV đã được tối ưu</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-bold text-slate-900 dark:text-white">{stats.optimizedCvs}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Activity Table */}
      <section className="mt-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 px-6 py-5">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
            Hoạt động gần đây
            <span className="ml-2 inline-flex items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-500/20 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
              {recentActivity.length}
            </span>
          </h3>
        </div>
        
        {loadingHistory ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <Loader2 className="h-8 w-8 text-indigo-500 animate-spin mb-3" />
            <p className="text-sm text-slate-500 dark:text-slate-400">?ang t?i l?ch s? ??i chi?u...</p>
          </div>
        ) : recentActivity.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
              <thead className="bg-white dark:bg-slate-900">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Vị trí ứng tuyển</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tên CV đã dùng</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">?i?m ph? h?p</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Ngày phân tích</th>
                  <th scope="col" className="relative px-6 py-4"><span className="sr-only">Hành động</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {recentActivity.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-slate-900 dark:text-white">{row.jd_text_preview || "V? tr? tuy?n d?ng"}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                      {row.cv_file_name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold border ${getScoreColorClass(Number(row.overall_score) || 0)}`}>
                        {Math.round(Number(row.overall_score) || 0)}%
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{new Date(row.created_at).toLocaleString("vi-VN")}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <button
                        onClick={() => handleViewReport(row.id)}
                        className="inline-flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 font-semibold transition-colors"
                      >
                        Xem báo cáo
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
              <BarChart className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Chưa có hoạt động nào</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-sm">
              Hãy chuyển sang thẻ "Phân tích mới" để bắt đầu đối chiếu CV với JD đầu tiên của bạn!
            </p>
          </div>
        )}
      </section>
    </div>
  );

  /* View B: AI Workspace */
  const renderWorkspace = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Workspace</span>
        </div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Đối chiếu hồ sơ bằng AI</h2>
      </header>

      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-10 shadow-xl shadow-slate-200/40 dark:shadow-none">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 relative">
          
          <div className="flex flex-col h-full">
             <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
               <FileText className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
               Hồ sơ của bạn (CV)
             </h3>
             <UploadSlot
               label="Hồ sơ năng lực"
               hint="Chọn một bản CV từ thư viện hồ sơ của bạn để bắt đầu."
               icon={FileText}
               file={cvFile}
               onRemove={() => setCvFile(null)}
               onOpenLibrary={handleOpenLibrary}
               onOpenDetail={handleOpenCvDetail}
             />
          </div>

          <div className="flex flex-col h-full">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
               <AlignLeft className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
               Mô tả công việc (JD)
            </h3>
            <div className={`relative flex flex-col w-full h-full min-h-[280px] rounded-2xl border transition-all ${
              jdText.trim() 
                ? "border-indigo-300 dark:border-indigo-500/50 bg-indigo-50/30 dark:bg-indigo-500/5" 
                : "border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
            }`}>
              <textarea
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                placeholder="Dán nội dung mô tả công việc (Job Description) vào đây..."
                className="w-full h-full min-h-[280px] resize-none bg-transparent p-6 outline-none text-slate-700 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-2xl custom-scrollbar"
              ></textarea>
              {jdText.trim() && (
                <button
                  className="absolute top-4 right-4 p-1.5 rounded-full bg-white dark:bg-slate-800 text-slate-400 shadow-sm border border-slate-200 dark:border-slate-700 hover:text-rose-500 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-500/30 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition z-10"
                  onClick={() => setJdText("")}
                  title="Xóa nội dung"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-12 flex justify-center">
          <button
            disabled={!cvFile || !jdText.trim() || analyzing}
            onClick={handleAnalyze}
            className={`group relative inline-flex items-center justify-center gap-3 rounded-2xl px-12 py-5 text-xl font-bold text-white transition-all duration-300 overflow-hidden
              ${(!cvFile || !jdText.trim()) 
                ? "bg-slate-200 dark:bg-slate-800 cursor-not-allowed text-slate-400 dark:text-slate-500" 
                : "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-xl shadow-indigo-200 dark:shadow-indigo-900/20 hover:shadow-indigo-400/40 hover:-translate-y-1 active:scale-95"}
            `}
          >
            {(!(!cvFile || !jdText.trim()) && !analyzing) && (
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] transition-transform"></span>
            )}
            
            {analyzing ? (
              <span className="tracking-tight">Đang chuẩn bị kết quả...</span>
            ) : (
              <>
                <Sparkles className={`h-7 w-7 ${(!cvFile || !jdText.trim()) ? "text-slate-400" : "text-indigo-200 group-hover:rotate-12 transition-transform"}`} />
                <span className="tracking-tight">Phân tích độ phù hợp</span>
                <ArrowRight className={`h-6 w-6 ml-1 transition-all group-hover:translate-x-2 ${(!cvFile || !jdText.trim()) ? "opacity-30" : ""}`} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  /* View: History */
  const renderHistory = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="mb-8">
        <h1 className="text-3xl font-display font-extrabold text-slate-900 dark:text-white tracking-tight">
          Lịch sử đối chiếu
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400 text-lg">
          Xem lại toàn bộ các lượt phân tích và đánh giá CV của bạn trước đây.
        </p>
      </header>
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        {loadingHistory ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <Loader2 className="h-8 w-8 text-indigo-500 animate-spin mb-3" />
            <p className="text-sm text-slate-500 dark:text-slate-400">?ang t?i l?ch s? ??i chi?u...</p>
          </div>
        ) : recentActivity.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
              <thead className="bg-white dark:bg-slate-900">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Vị trí ứng tuyển</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tên CV đã dùng</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">?i?m ph? h?p</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Ngày phân tích</th>
                  <th scope="col" className="relative px-6 py-4"><span className="sr-only">Hành động</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {recentActivity.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-slate-900 dark:text-white">{row.jd_text_preview || "V? tr? tuy?n d?ng"}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                      {row.cv_file_name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold border ${getScoreColorClass(Number(row.overall_score) || 0)}`}>
                        {Math.round(Number(row.overall_score) || 0)}%
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{new Date(row.created_at).toLocaleString("vi-VN")}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <button
                        onClick={() => handleViewReport(row.id)}
                        className="inline-flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 font-semibold transition-colors"
                      >
                        Xem báo cáo
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
              <History className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Chưa có lịch sử</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-sm">
              Bạn chưa thực hiện bất kỳ phân tích nào.
            </p>
          </div>
        )}
      </section>
    </div>
  );

  /* View: Library (CVs & JDs) */

  const handleLibraryUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      dispatchNotice({ tone: "info", title: "Đang tải lên", message: `Đang tải ${file.name} vào kho...` });
      if (libraryType === 'cv') {
        const newDoc = await uploadCvDocument({ file });
        if (newDoc) {
          setCvFile(newDoc); // Automatically select the new CV
        }
      } else {
        // Simple JD upload mock for now as it needs more fields
        dispatchNotice({ tone: "warning", title: "Thông báo", message: "Chức năng upload JD trực tiếp đang được hoàn thiện." });
        return;
      }
      dispatchNotice({ tone: "success", title: "Thành công", message: "Đã thêm tài liệu vào kho hồ sơ." });
      loadLibrary(); // Refresh
    } catch (err) {
      dispatchNotice({ tone: "danger", title: "Lỗi upload", message: err.message });
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const renderLibrary = (type) => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {type !== 'modal' && (
        <header className="mb-8">
          <h1 className="text-3xl font-display font-extrabold text-slate-900 dark:text-white tracking-tight">
            Kho hồ sơ (CV)
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400 text-lg">
            Quản lý danh sách các bản CV cá nhân của bạn.
          </p>
        </header>
      )}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => libraryInputRef.current?.click()}
              disabled={isUploading}
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95 disabled:opacity-50"
            >
              {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
              Tải lên hồ sơ mới
            </button>
            <input 
              ref={libraryInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleLibraryUpload}
            />
          </div>
        </div>
        
        {loadingLibrary ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <Loader2 className="h-12 w-12 text-indigo-500 animate-spin" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">Đang truy xuất dữ liệu từ kho...</p>
          </div>
        ) : libraryDocuments.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {libraryDocuments.map((doc) => (
              <div 
                key={doc.id}
                onClick={() => handleOpenCvDetail(doc)}
                className="group relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-500">
                    <FileText className="h-7 w-7" />
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      askConfirmation({
                        title: "Xóa hồ sơ",
                        message: `Bạn có chắc chắn muốn xóa hồ sơ "${doc.file_name}" khỏi kho lưu trữ? Hành động này không thể hoàn tác.`,
                        confirmText: "Xóa ngay",
                        tone: "danger",
                        onConfirm: async () => {
                          try {
                            await deleteDocument({ documentId: doc.id });
                            dispatchNotice({ tone: "success", title: "Đã xóa", message: "Hồ sơ đã được loại bỏ khỏi kho." });
                            loadLibrary();
                          } catch (err) {
                            dispatchNotice({ tone: "danger", title: "Lỗi xóa", message: err.message });
                          }
                        }
                      });
                    }}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/20 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                
                <h4 className="font-bold text-slate-900 dark:text-white mb-1 truncate pr-4" title={doc.file_name}>
                  {doc.file_name}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  ID: #{doc.id} • PDF Document
                </p>
                
                <div className="pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    {new Date(doc.created_at).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 px-4 text-center rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-50 dark:bg-slate-800 text-indigo-200 dark:text-indigo-900/50">
              <FileText className="h-10 w-10" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Thư viện trống</h3>
            <p className="mt-3 text-lg text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Bạn chưa tải bất kỳ hồ sơ nào lên kho lưu trữ. Hãy bắt đầu bằng cách tải lên CV đầu tiên của bạn!
            </p>
            <button 
              onClick={() => libraryInputRef.current?.click()}
              className="mt-8 inline-flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all shadow-lg active:scale-95"
            >
              <Plus className="h-5 w-5" />
              Tải hồ sơ đầu tiên
            </button>
          </div>
        )}
      </div>
  );

  /* View: Statistics */
  const renderStatistics = () => {
    const chartData = [
      { name: 'Thu 2', value: 40 },
      { name: 'Thu 3', value: 30 },
      { name: 'Thu 4', value: 65 },
      { name: 'Thu 5', value: 45 },
      { name: 'Thu 6', value: 80 },
      { name: 'Thu 7', value: 55 },
      { name: 'CN', value: 90 },
    ];

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <header className="mb-8">
          <h1 className="text-3xl font-display font-extrabold text-slate-900 dark:text-white tracking-tight">
            Thống kê phân tích
          </h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            Theo dõi hiệu suất và tần suất sử dụng AI của bạn.
          </p>
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-500" /> Xu hướng phù hợp tuần này
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-indigo-600 p-8 text-white shadow-lg shadow-indigo-200 dark:shadow-none">
              <Sparkles className="h-10 w-10 mb-4 text-indigo-200" />
              <h3 className="text-xl font-bold mb-2">Tối ưu hóa mạnh mẽ</h3>
              <p className="text-indigo-100 text-sm leading-relaxed mb-6">
                Tiếp tục thực hiện các lượt phân tích để AI có thêm dữ liệu đưa ra các gợi ý tối ưu chính xác nhất cho bạn.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Hành trình của bạn</span>
                <span className="text-sm font-black text-indigo-600">Bắt đầu</span>
              </div>
              <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 rounded-full" style={{ width: '10%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* Render Routing Logic */
  const renderContent = () => {
    switch (currentScreen) {
      case "newAnalysis":
        return renderWorkspace();
      case "history":
        return renderHistory();
      case "profileCv":
        return renderLibrary('cv');
      case "statistics":
        return renderStatistics();
      default:
        return renderOverview();
    }
  };

  return (
    <MainLayout>
      {renderContent()}

      {/* CV Detail Modal */}
      {selectedCvForDetail && (
        <div 
          onClick={() => setSelectedCvForDetail(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 w-full max-w-7xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-300"
          >
             <CvDetailWindow 
              selectedCv={{
                ...selectedCvForDetail,
                cvPdf: cvPreviewUrl,
                cvParseStatus: loadingPreview ? "loading" : "success",
                cvParseData: selectedCvForDetail.metadata_json
              }} 
              onClose={() => setSelectedCvForDetail(null)} 
              onParse={() => handleOpenCvDetail(selectedCvForDetail)}
            />
          </div>
        </div>
      )}

      {/* Library Selection Modal */}
      {isLibraryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-300">
            <header className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                  <FolderOpen className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Chọn từ thư viện</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Danh sách CV bạn đã tải lên trước đó</p>
                </div>
              </div>
              <button 
                onClick={() => setIsLibraryModalOpen(false)}
                className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {loadingLibrary ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
                  <p className="text-slate-500 dark:text-slate-400 font-medium">Đang tải tài liệu...</p>
                </div>
              ) : libraryDocuments.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {libraryDocuments.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => {
                        setCvFile(doc);
                        setIsLibraryModalOpen(false);
                      }}
                      className="group flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:bg-indigo-50/30 dark:hover:bg-indigo-500/5 transition-all text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          <FileText className="h-6 w-6" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 dark:text-white truncate max-w-[300px]">
                            {doc.file_name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            ID: #{doc.id} • Tải lên ngày {new Date(doc.created_at).toLocaleDateString('vi-VN')}
                          </p>
                        </div>
                      </div>
                      <div className="h-8 w-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center group-hover:border-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-sm">
                        <Check className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="h-16 w-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-600 mb-4">
                    <FileText className="h-8 w-8" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white">Chưa có tài liệu nào</h4>
                  <p className="text-slate-500 dark:text-slate-400 max-w-[280px] mt-2">
                    Bạn chưa có CV nào trong kho. Hãy tải file mới để lưu trữ vào thư viện.
                  </p>
                </div>
              )}
            </div>

            <footer className="px-8 py-6 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button 
                onClick={() => setIsLibraryModalOpen(false)}
                className="px-6 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Đóng
              </button>
            </footer>
          </div>
        </div>
      )}
      {/* Confirmation Dialog */}
      <ConfirmDialog {...confirmConfig} />

      {/* Comparing AI Overlay */}
      <ComparingOverlay isOpen={analyzing} />
    </MainLayout>
  );
};

export default DashboardPage;


