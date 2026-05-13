import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import FaqPage from "./pages/FaqPage";
import DashboardPage from "./pages/DashboardPage";
import InterviewResultPage from "./pages/InterviewResultPage";
import InterviewWizardPage from "./pages/InterviewWizardPage";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import OnboardingPage from "./pages/OnboardingPage";
import PricingPage from "./pages/PricingPage";
import ProductPage from "./pages/ProductPage";
import UserProfilePage from "./pages/UserProfilePage";
import { UserProvider } from "./features/UserContext";
import { NoticeModal } from "./components/ui/NoticeModal";
import { getAccessToken, isOnboardingDone } from "./utils/authSession";
import { getStoredTheme, subscribeTheme } from "./utils/themeController";
import CVScreeningResultScreen from "./features/aiInterview/screens/CVScreeningResultScreen";

function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname, search]);

  return null;
}

function GlobalThemeScope() {
  const location = useLocation();
  const [theme, setTheme] = useState(getStoredTheme);

  useEffect(() => subscribeTheme(setTheme), []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const darkEnabled = theme === "dark";
    document.documentElement.classList.toggle("dark", darkEnabled);
    document.body.classList.toggle("dark", darkEnabled);
  }, [location.pathname, theme]);

  return null;
}

function RootEntryPage() {
  const hasAccessToken = Boolean(getAccessToken());
  if (hasAccessToken && !isOnboardingDone()) {
    return <Navigate to="/onboarding" replace />;
  }
  return <LandingPage />;
}

export default function App() {
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    const handler = (event) => {
      const detail = event?.detail || {};
      setNotice({
        tone: detail.tone || "info",
        title: detail.title || "",
        message: detail.message || "",
      });
    };
    window.addEventListener("aiia:notice", handler);
    return () => window.removeEventListener("aiia:notice", handler);
  }, []);

  return (
    <BrowserRouter>
      <UserProvider>
        <ScrollToTop />
        <GlobalThemeScope />
        <Routes>
          <Route path="/" element={<RootEntryPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/phong-van-moi" element={<InterviewWizardPage />} />
          <Route path="/ket-qua-phong-van" element={<InterviewResultPage />} />
          <Route path="/interview" element={<Navigate to="/dashboard" replace />} />
          <Route path="/san-pham" element={<ProductPage />} />
          <Route path="/bang-gia" element={<PricingPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/google-callback" element={<LoginPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/thong-tin-nguoi-dung" element={<UserProfilePage />} />
          <Route path="/cv-screening-demo" element={<CVScreeningResultScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <NoticeModal
          isOpen={Boolean(notice)}
          tone={notice?.tone}
          title={notice?.title}
          message={notice?.message}
          onClose={() => setNotice(null)}
        />
      </UserProvider>
    </BrowserRouter>
  );
}
