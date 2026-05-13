import { ArrowLeft, Building2, Mail, Phone, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { useNavigate, Navigate } from "react-router-dom";
import { useUser } from "../features/UserContext";

const ROLE_LABEL = {
  candidate: "Ứng viên",
  recruiter: "Tuyển dụng",
  admin: "Quản trị",
};

export default function UserProfilePage() {
  const navigate = useNavigate();
  const { user, logout, isLoading } = useUser();

  if (isLoading && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f7fb]">
        <div className="text-slate-600 font-medium">Đang tải thông tin...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const role = user.role || "candidate";
  const initial = user.name?.charAt(0)?.toUpperCase() || "U";

  const handleBack = () => {
    navigate(`/dashboard?role=${role}`);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <main className="user-profile-page min-h-screen bg-[#f4f7fb] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="user-profile-header flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <div className="inline-flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              aria-label="Quay lại Dashboard"
              title="Quay lại Dashboard"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="hidden h-8 w-px bg-slate-200 sm:block" />
            <div className="inline-flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-700 text-white">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display text-lg font-bold text-slate-900">Thông tin người dùng</p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
          >
            Đăng xuất
          </button>
        </header>

        <section className="user-profile-card rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-5 border-b border-slate-200 pb-6">
            <div className="inline-flex items-center gap-4">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-blue-100 text-xl font-bold text-blue-700">
                {initial}
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {ROLE_LABEL[role] || user.role || ""}
                </p>
                <h1 className="font-display text-2xl font-bold text-slate-900 sm:text-3xl">{user.name}</h1>
                <p className="text-sm text-slate-600">Gói dịch vụ: {user.plan_id ? "Premium" : "Free"}</p>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
              <ShieldCheck className="h-4 w-4" />
              Tài khoản đang hoạt động
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</p>
              <p className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-slate-800">
                <Mail className="h-4 w-4 text-slate-500" />
                {user.email}
              </p>
            </article>

            <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Số điện thoại</p>
              <p className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-slate-800">
                <Phone className="h-4 w-4 text-slate-500" />
                {user.phone || "Chưa cập nhật"}
              </p>
            </article>

            <article className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tổ chức</p>
              <p className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-slate-800">
                <Building2 className="h-4 w-4 text-slate-500" />
                {user.company || "Chưa cập nhật"}
              </p>
            </article>
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Trạng thái hồ sơ</p>
            <p className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-slate-800">
              <UserRound className="h-4 w-4 text-slate-500" />
              Hồ sơ đã đồng bộ và sẵn sàng cho các phiên phỏng vấn AI.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

