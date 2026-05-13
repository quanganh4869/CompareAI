import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../features/aiInterview/legacy.css";
import { useUser } from "../features/UserContext";
import { getUserRole, normalizeUserRole } from "../utils/authSession";
import { subscribeTheme, getStoredTheme } from "../utils/themeController";
import { dispatchNotice } from "../utils/notice";
import { EmployerDashboardScreen } from "../features/aiInterview/screens/EmployerDashboardScreen";
import { CandidateDashboardScreen } from "../features/aiInterview/screens/CandidateFlowScreens";

function resolveDashboardRole(search) {
  const query = new URLSearchParams(search);
  const roleFromQuery = normalizeUserRole(query.get("role"));
  if (roleFromQuery) return roleFromQuery;

  const stored = normalizeUserRole(getUserRole());
  if (stored) return stored;

  return "candidate";
}

export default function InterviewLegacyPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();
  const [theme, setTheme] = useState(getStoredTheme);

  useEffect(() => subscribeTheme(setTheme), []);

  const role = useMemo(() => resolveDashboardRole(location.search), [location.search]);
  const isRecruiter = role === "recruiter";

  return (
    <div className={`interview-legacy ${theme === "dark" ? "theme-dark" : ""}`}>
      {isRecruiter ? (
        <EmployerDashboardScreen
          companyName={user?.company_name || user?.company || ""}
          recruiterName={user?.name || ""}
          onOpenProfile={() => navigate("/thong-tin-nguoi-dung")}
        />
      ) : (
        <CandidateDashboardScreen
          onStartJourney={() => navigate("/phong-van-moi")}
          onHistory={() =>
            dispatchNotice({
              tone: "info",
              title: "Chưa hỗ trợ",
              message: "Trang lịch sử ứng viên đang được hoàn thiện.",
            })
          }
          onAnalytics={() =>
            dispatchNotice({
              tone: "info",
              title: "Chưa hỗ trợ",
              message: "Trang phân tích ứng viên đang được hoàn thiện.",
            })
          }
        />
      )}
    </div>
  );
}

