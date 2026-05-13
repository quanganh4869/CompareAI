import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import SiteFooter from "../components/marketing/SiteFooter";
import SiteHeader from "../components/marketing/SiteHeader";

const plans = [
  {
    name: "Khởi đầu",
    price: "$49",
    period: "/tháng",
    features: ["Tối đa 50 phiên/tháng", "Bảng điều khiển cơ bản", "Hỗ trợ email"],
  },
  {
    name: "Tăng trưởng",
    price: "$149",
    period: "/tháng",
    features: ["Tối đa 300 phiên/tháng", "So sánh ứng viên nâng cao", "Làm việc nhóm"],
    highlight: true,
  },
  {
    name: "Doanh nghiệp",
    price: "Liên hệ",
    period: "",
    features: ["Không giới hạn phiên", "SSO và quản trị", "SLA và onboarding riêng"],
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#f8fbff]">
      <SiteHeader />

      <div className="mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">Bảng giá</p>
          <h1 className="mt-3 font-display text-4xl font-extrabold text-slate-900">
            Chọn gói phù hợp với quy mô đội ngũ.
          </h1>
          <p className="mt-3 max-w-2xl text-base text-slate-700">
            Đơn giản, minh bạch, mở rộng theo nhu cầu tuyển dụng.
          </p>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`rounded-2xl border p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md ${
                plan.highlight ? "border-blue-300 bg-blue-50/40" : "border-slate-200 bg-white"
              }`}
            >
              <p className="text-sm font-semibold text-slate-700">{plan.name}</p>
              <p className="mt-3 text-4xl font-extrabold text-slate-900">
                {plan.price}
                <span className="text-base font-semibold text-slate-500">{plan.period}</span>
              </p>
              <ul className="mt-5 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="inline-flex items-center gap-2 text-sm text-slate-700">
                    <Check className="h-4 w-4 text-emerald-600" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                to="/login"
                className={`mt-6 inline-flex w-full justify-center rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  plan.highlight
                    ? "bg-blue-700 text-white hover:bg-blue-800"
                    : "border border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                Bắt đầu
              </Link>
            </article>
          ))}
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
