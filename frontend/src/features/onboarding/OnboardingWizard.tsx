import { AnimatePresence, motion } from "framer-motion";
import {
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Rocket,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../config/api";
import { getAccessToken, setOnboardingDone, syncUserSessionFromBackend } from "../../utils/authSession";

type Role = "" | "candidate" | "recruiter";

type PlanOption = {
  id: number;
  backendName: string;
  name: string;
  price: string;
  features: string[];
  accent: string;
  popular?: boolean;
};

type BackendPlan = {
  id: number;
  name: string;
  price: number;
  description?: string | null;
};

type UserData = {
  role: Role;
  source: string;
  goal: string;
  plan_id: number;
};

type OnboardingWizardProps = {
  initialRole?: string | null;
};

const TOTAL_STEPS = 3;

const SOURCE_OPTIONS = [
  "LinkedIn",
  "Facebook",
  "Tìm kiếm Google",
  "Bạn bè/Đồng nghiệp",
  "Khác",
];

const GOALS_BY_ROLE: Record<Exclude<Role, "">, string[]> = {
  candidate: [
    "Chuẩn bị phỏng vấn tech đầu tiên",
    "Cải thiện kỹ năng mềm",
    "Luyện câu hỏi tình huống",
    "Chỉ đang khám phá",
  ],
  recruiter: [
    "Tối ưu quy trình sàng lọc",
    "Đánh giá kỹ năng giao tiếp",
    "Giảm thiên vị trong đánh giá",
    "Chỉ đang khám phá",
  ],
};

const PLANS = [
  {
    id: 1,
    backendName: "free",
    name: "Miễn phí",
    price: "$0/tháng",
    features: ["1 buổi phỏng vấn AI/tháng", "Phản hồi cơ bản"],
    accent: "from-slate-100 to-slate-50",
  },
  {
    id: 2,
    backendName: "pro",
    name: "Pro",
    price: "$19/tháng",
    features: ["Phỏng vấn không giới hạn", "Đối sánh CV chuyên sâu", "Rubrics nâng cao"],
    accent: "from-blue-100 to-cyan-100",
    popular: true,
  },
  {
    id: 3,
    backendName: "enterprise",
    name: "Doanh nghiệp",
    price: "Liên hệ",
    features: ["API cho đội nhóm", "Kịch bản tùy chỉnh"],
    accent: "from-amber-100 to-orange-100",
  },
];

const PLAN_ACCENTS_BY_NAME: Record<string, string> = {
  FREE: "from-slate-100 to-slate-50",
  PRO: "from-blue-100 to-cyan-100",
  ENTERPRISE: "from-amber-100 to-orange-100",
};

const PLAN_LABEL_BY_NAME: Record<string, string> = {
  FREE: "Miễn phí",
  PRO: "Pro",
  ENTERPRISE: "Doanh nghiệp",
};

const PLAN_FEATURES_BY_NAME: Record<string, string[]> = {
  FREE: ["Lượt phỏng vấn cơ bản", "Phản hồi cơ bản"],
  PRO: ["Phỏng vấn không giới hạn", "Đối sánh CV chuyên sâu", "Rubrics nâng cao"],
  ENTERPRISE: ["API cho đội nhóm", "Kịch bản tùy chỉnh"],
};

function formatPlanPrice(price: number, normalizedName: string): string {
  if (price <= 0 || normalizedName === "FREE") {
    return "$0/tháng";
  }
  if (normalizedName === "ENTERPRISE") {
    return "Liên hệ";
  }

  const formattedPrice = new Intl.NumberFormat("vi-VN").format(price);
  return `${formattedPrice}đ/tháng`;
}

function normalizePlanName(name: string | null | undefined): string {
  return String(name || "")
    .trim()
    .toUpperCase();
}

function mapBackendPlansToOptions(plans: BackendPlan[]): PlanOption[] {
  return plans.map((plan) => {
    const normalizedName = normalizePlanName(plan.name);
    const description = (plan.description || "").trim();
    const backendName = String(plan.name || "").trim();

    return {
      id: plan.id,
      backendName,
      name: PLAN_LABEL_BY_NAME[normalizedName] || description || normalizedName || "Gói dịch vụ",
      price: formatPlanPrice(plan.price, normalizedName),
      features: description ? [description] : PLAN_FEATURES_BY_NAME[normalizedName] || ["Gói tiêu chuẩn"],
      accent: PLAN_ACCENTS_BY_NAME[normalizedName] || "from-slate-100 to-slate-50",
      popular: normalizedName === "PRO",
    };
  });
}

const stepAnimation = {
  initial: { opacity: 0, x: 24, scale: 0.98 },
  animate: { opacity: 1, x: 0, scale: 1 },
  exit: { opacity: 0, x: -24, scale: 0.98 },
};

function normalizeRole(role: string | null | undefined): Role {
  const normalized = String(role || "")
    .trim()
    .toLowerCase();

  if (normalized === "candidate" || normalized === "user") return "candidate";
  if (normalized === "recruiter" || normalized === "hr") return "recruiter";
  return "";
}

function RoleSelectionStep({
  selectedRole,
  onSelectRole,
  onContinue,
}: {
  selectedRole: Role;
  onSelectRole: (role: Exclude<Role, "">) => void;
  onContinue: () => void;
}) {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h2 className="font-display text-2xl font-bold text-slate-900 sm:text-3xl">
          Chào mừng bạn! Hãy cho chúng tôi biết bạn là ai
        </h2>
        <p className="text-sm text-slate-600 sm:text-base">
          Điều này giúp AI cá nhân hóa trải nghiệm phù hợp với bạn.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <button
          type="button"
          onClick={() => onSelectRole("candidate")}
          className={`group relative flex min-h-40 flex-col items-start rounded-2xl border bg-white p-5 text-left transition ${
            selectedRole === "candidate"
              ? "scale-[1.01] border-blue-500 shadow-[0_10px_30px_-16px_rgba(37,99,235,0.8)]"
              : "border-slate-200 hover:border-blue-300 hover:bg-blue-50/50"
          }`}
        >
          <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
            <UserRound className="h-5 w-5" />
          </span>
          <h3 className="text-base font-semibold text-slate-900">Tôi là Ứng viên</h3>
          <p className="mt-2 text-sm text-slate-600">
            Tôi muốn luyện phỏng vấn và nhận phản hồi từ AI.
          </p>
        </button>

        <button
          type="button"
          onClick={() => onSelectRole("recruiter")}
          className={`group relative flex min-h-40 flex-col items-start rounded-2xl border bg-white p-5 text-left transition ${
            selectedRole === "recruiter"
              ? "scale-[1.01] border-blue-500 shadow-[0_10px_30px_-16px_rgba(37,99,235,0.8)]"
              : "border-slate-200 hover:border-blue-300 hover:bg-blue-50/50"
          }`}
        >
          <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
            <Building2 className="h-5 w-5" />
          </span>
          <h3 className="text-base font-semibold text-slate-900">Tôi là Recruiter / HR</h3>
          <p className="mt-2 text-sm text-slate-600">
            Tôi muốn sàng lọc ứng viên và tạo rubric phỏng vấn.
          </p>
        </button>
      </div>

      <button
        type="button"
        onClick={onContinue}
        disabled={!selectedRole}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
      >
        Tiếp tục
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function SurveyStep({
  role,
  source,
  goal,
  onChangeSource,
  onChangeGoal,
  onBack,
  onContinue,
}: {
  role: Exclude<Role, "">;
  source: string;
  goal: string;
  onChangeSource: (value: string) => void;
  onChangeGoal: (value: string) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const goalOptions = GOALS_BY_ROLE[role];

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h2 className="font-display text-2xl font-bold text-slate-900 sm:text-3xl">
          Hãy tùy chỉnh trải nghiệm của bạn
        </h2>
      </header>

      <div className="space-y-5">
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-slate-800">
            Bạn biết đến chúng tôi qua kênh nào?
          </span>
          <select
            value={source}
            onChange={(event) => onChangeSource(event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Chọn một tùy chọn</option>
            {SOURCE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <section className="space-y-2">
          <p className="text-sm font-semibold text-slate-800">Mục tiêu chính của bạn là gì?</p>
          <div className="flex flex-wrap gap-2">
            {goalOptions.map((option) => {
              const selected = option === goal;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => onChangeGoal(option)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                    selected
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <div className="flex flex-col gap-3 pt-1 sm:flex-row">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <ChevronLeft className="h-4 w-4" />
          Quay lại
        </button>
        <button
          type="button"
          onClick={onContinue}
          disabled={!source || !goal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Tiếp tục
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function PlanSelectionStep({
  plans,
  isPlansLoading,
  plansError,
  submitError,
  selectedPlanId,
  isSubmitting,
  isSuccess,
  onSelectPlan,
  onBack,
  onComplete,
}: {
  plans: PlanOption[];
  isPlansLoading: boolean;
  plansError: string;
  submitError: string;
  selectedPlanId: number;
  isSubmitting: boolean;
  isSuccess: boolean;
  onSelectPlan: (planId: number) => void;
  onBack: () => void;
  onComplete: () => void;
}) {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h2 className="font-display text-2xl font-bold text-slate-900 sm:text-3xl">
          Chọn gói để bắt đầu
        </h2>
        <p className="text-sm text-slate-600 sm:text-base">Bạn luôn có thể thay đổi sau.</p>
      </header>

      {isPlansLoading ? (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-600">
          Đang tải danh sách gói...
        </div>
      ) : null}

      {plansError ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{plansError}</div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => {
          const selected = plan.id === selectedPlanId;
          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => onSelectPlan(plan.id)}
              className={`relative rounded-2xl border bg-white p-5 text-left transition ${
                selected
                  ? "scale-[1.01] border-blue-500 shadow-[0_10px_30px_-16px_rgba(37,99,235,0.9)]"
                  : "border-slate-200 hover:border-blue-300"
              }`}
            >
              {plan.popular ? (
                <span className="absolute right-4 top-4 inline-flex items-center rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-blue-700">
                  Phổ biến nhất
                </span>
              ) : null}

              <div className={`mb-4 h-10 rounded-xl bg-gradient-to-r ${plan.accent}`} aria-hidden="true" />

              <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
              <p className="mt-1 text-sm font-semibold text-slate-700">{plan.price}</p>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-blue-600" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 pt-1 sm:flex-row">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <ChevronLeft className="h-4 w-4" />
          Quay lại
        </button>
        <button
          type="button"
          onClick={onComplete}
          disabled={isSubmitting || !selectedPlanId || isSuccess}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
          {isSubmitting ? "Đang lưu thiết lập..." : isSuccess ? "Thiết lập hoàn tất" : "Hoàn tất thiết lập"}
        </button>
      </div>

      {isSuccess ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          Bạn đã hoàn tất onboarding. Đang chuyển đến dashboard...
        </div>
      ) : null}

      {submitError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {submitError}
        </div>
      ) : null}
    </div>
  );
}
async function fetchSubscriptionPlans(accessToken: string): Promise<PlanOption[]> {
  const response = await fetch(`${API_BASE_URL}/v1_0/user/plans`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.success || !Array.isArray(body?.data)) {
    throw new Error(body?.message || "Không thể tải danh sách gói.");
  }

  const mappedPlans = mapBackendPlansToOptions(body.data as BackendPlan[]);
  return mappedPlans.length ? mappedPlans : PLANS;
}

async function submitUserRole(accessToken: string, role: Role) {
  const roleName = role === "recruiter" ? "HR" : "user";
  const response = await fetch(`${API_BASE_URL}/v1_0/user/role/${roleName}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.success || !body?.data) {
    throw new Error(body?.message || "Không thể lưu role.");
  }

  return body.data;
}

async function submitUserPlan(accessToken: string, planName: string) {
  const safePlanName = String(planName || "").trim() || "free";
  const response = await fetch(`${API_BASE_URL}/v1_0/user/plan/${safePlanName}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.success || !body?.data) {
    throw new Error(body?.message || "Không thể lưu plan.");
  }

  return body.data;
}

export default function OnboardingWizard({ initialRole }: OnboardingWizardProps) {
  const navigate = useNavigate();
  const accessToken = getAccessToken();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [plans, setPlans] = useState<PlanOption[]>(PLANS);
  const [isPlansLoading, setIsPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [userData, setUserData] = useState<UserData>({
    role: normalizeRole(initialRole),
    source: "",
    goal: "",
    plan_id: 0,
  });

  const progressPercent = useMemo(() => Math.round((currentStep / TOTAL_STEPS) * 100), [currentStep]);

  useEffect(() => {
    let cancelled = false;

    const loadPlans = async () => {
      if (!accessToken) {
        setPlansError("Thiếu access token. Vui lòng đăng nhập lại.");
        setIsPlansLoading(false);
        return;
      }

      setIsPlansLoading(true);
      setPlansError("");

      try {
        const fetchedPlans = await fetchSubscriptionPlans(accessToken);
        if (cancelled) return;

        setPlans(fetchedPlans);
        setUserData((previous) => {
          const hasSelectedPlan = fetchedPlans.some((item) => item.id === previous.plan_id);
          return hasSelectedPlan ? previous : { ...previous, plan_id: fetchedPlans[0]?.id ?? 0 };
        });
      } catch (error) {
        if (cancelled) return;

        setPlans(PLANS);
        setPlansError(error instanceof Error ? error.message : "Không thể tải danh sách gói. Đang dùng gói mặc định.");
        setUserData((previous) => ({
          ...previous,
          plan_id: previous.plan_id || PLANS[0]?.id || 0,
        }));
      } finally {
        if (!cancelled) {
          setIsPlansLoading(false);
        }
      }
    };

    loadPlans();

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const setRole = (role: Exclude<Role, "">) => {
    setUserData((previous) => ({
      ...previous,
      role,
      goal: "",
    }));
  };

  const completeSetup = async () => {
    if (!userData.plan_id || !userData.role || !userData.goal || !userData.source) return;
    if (!accessToken) {
      setSubmitError("Thiếu access token. Vui lòng đăng nhập lại.");
      return;
    }

    setSubmitError("");
    setIsSubmitting(true);

    try {
      await submitUserRole(accessToken, userData.role);
      const selectedPlan = plans.find((plan) => plan.id === userData.plan_id) || plans[0];
      const updatedUser = await submitUserPlan(accessToken, selectedPlan?.backendName);

      if (typeof window !== "undefined") {
        window.localStorage.setItem("aiia_onboarding_payload", JSON.stringify(userData));
      }

      const normalizedRole = syncUserSessionFromBackend(updatedUser) || userData.role;
      setOnboardingDone(true);
      setIsSuccess(true);

      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 700);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Không thể lưu role/plan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="onboarding-page relative min-h-screen overflow-hidden bg-[#f2f8ff] px-4 py-10 sm:px-6">
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background:
            "radial-gradient(circle at 15% 20%, rgba(59,130,246,.18), transparent 32%), radial-gradient(circle at 85% 12%, rgba(14,165,233,.14), transparent 35%), linear-gradient(180deg, #f7fbff 0%, #eef5ff 100%)",
        }}
      />

      <section className="relative mx-auto w-full max-w-4xl rounded-3xl border border-white/70 bg-white/95 p-5 shadow-[0_30px_90px_-45px_rgba(30,64,175,0.55)] backdrop-blur sm:p-8">
        <header className="mb-8 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            <Sparkles className="h-3.5 w-3.5" />
            Thiết lập không gian làm việc
          </div>

          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Bước {currentStep}/{TOTAL_STEPS}
              </p>
              <p className="mt-1 text-sm text-slate-600">Hoàn thiện hồ sơ trước khi vào dashboard.</p>
            </div>
            <p className="text-sm font-semibold text-slate-700">Hoàn thành {progressPercent}%</p>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500"
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            variants={stepAnimation}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.26, ease: "easeOut" }}
          >
            {currentStep === 1 ? (
              <RoleSelectionStep
                selectedRole={userData.role}
                onSelectRole={setRole}
                onContinue={() => setCurrentStep(2)}
              />
            ) : null}

            {currentStep === 2 && userData.role ? (
              <SurveyStep
                role={userData.role}
                source={userData.source}
                goal={userData.goal}
                onChangeSource={(source) => setUserData((previous) => ({ ...previous, source }))}
                onChangeGoal={(goal) => setUserData((previous) => ({ ...previous, goal }))}
                onBack={() => setCurrentStep(1)}
                onContinue={() => setCurrentStep(3)}
              />
            ) : null}

            {currentStep === 3 ? (
              <PlanSelectionStep
                plans={plans}
                isPlansLoading={isPlansLoading}
                plansError={plansError}
                submitError={submitError}
                selectedPlanId={userData.plan_id}
                isSubmitting={isSubmitting}
                isSuccess={isSuccess}
                onSelectPlan={(plan_id) => setUserData((previous) => ({ ...previous, plan_id }))}
                onBack={() => setCurrentStep(2)}
                onComplete={completeSetup}
              />
            ) : null}
          </motion.div>
        </AnimatePresence>
      </section>
    </main>
  );
}
