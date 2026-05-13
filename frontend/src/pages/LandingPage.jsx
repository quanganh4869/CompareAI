import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import SiteFooter from "../components/marketing/SiteFooter";
import SiteHeader from "../components/marketing/SiteHeader";

const stats = [
  { value: "12,408", label: "Phiên phỏng vấn đã xử lý", growth: "+18.4%" },
  { value: "+26%", label: "Giảm thời gian tuyển dụng", growth: "+4.2%" },
  { value: "41%", label: "Tăng tỉ lệ qua vòng cuối", growth: "+9.7%" },
];

const featureCards = [
  {
    title: "Trải nghiệm ứng viên",
    description: "Mô phỏng hội thoại AI và phản hồi ngay sau mỗi câu trả lời.",
    image:
      "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Bảng điều khiển tuyển dụng",
    description: "So sánh năng lực ứng viên theo mức phù hợp vị trí trên một màn hình.",
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Quản trị và tuân thủ",
    description: "Phân quyền rõ ràng, lưu vết đầy đủ, dễ kiểm tra và mở rộng.",
    image:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=900&q=80",
  },
];

const bars = [28, 44, 26, 54, 38, 46, 30, 50, 34, 42, 26, 36];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#f8fbff]">
      <SiteHeader />

      <div className="mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 lg:px-8">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="grid gap-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm lg:grid-cols-12 lg:items-center"
        >
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700">
              <Sparkles className="h-4 w-4" />
              Nền tảng phỏng vấn AI cho doanh nghiệp
            </div>

            <h1 className="mt-6 font-display text-4xl font-extrabold leading-tight text-slate-900 sm:text-5xl">
              Luyện thông minh hơn.
              <br />
              Tuyển nhanh hơn.
            </h1>

            <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-700">
              Tập trung mô phỏng phỏng vấn, chấm điểm năng lực và báo cáo tuyển dụng trong một
              luồng duy nhất.
            </p>

            <div className="mt-8 flex items-center">
              <Link
                to="/login"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="inline-flex items-center rounded-xl bg-blue-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
              >
                Bắt đầu trải nghiệm
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
              <img
                src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=900&q=80"
                alt="Minh họa phiên phỏng vấn AI"
                className="h-48 w-full object-cover"
                loading="lazy"
              />
              <div className="p-5">
                <p className="text-sm font-semibold text-slate-900">Phiên AI thời gian thực</p>
                <div className="mt-4 flex h-14 items-end gap-1">
                  {bars.map((height, index) => (
                    <motion.span
                      key={`${height}-${index}`}
                      style={{ height }}
                      className="w-2 rounded-full bg-blue-600/90"
                      animate={{ scaleY: [0.7, 1, 0.8, 1] }}
                      transition={{
                        duration: 1.2,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                        delay: index * 0.04,
                      }}
                    />
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-white p-3">
                    <p className="text-slate-500">Chất lượng trả lời</p>
                    <p className="font-semibold text-slate-900">89/100</p>
                  </div>
                  <div className="rounded-lg bg-white p-3">
                    <p className="text-slate-500">Mức khớp vị trí</p>
                    <p className="font-semibold text-slate-900">93%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {stats.map((item) => (
            <article
              key={item.value}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md"
            >
              <p className="text-3xl font-extrabold text-slate-900">{item.value}</p>
              <p className="mt-2 text-sm text-slate-700">{item.label}</p>
              <p className="mt-3 text-sm font-semibold text-emerald-600">{item.growth}</p>
            </article>
          ))}
        </section>

        <section id="features" className="mt-12">
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 className="font-display text-2xl font-bold text-slate-900 sm:text-3xl">
              3 trụ cột cho quy trình phỏng vấn
            </h2>
            <Link to="/san-pham" className="text-sm font-semibold text-blue-700 hover:text-blue-800">
              Xem trang sản phẩm
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featureCards.map((item) => (
              <article
                key={item.title}
                className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md"
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="h-40 w-full object-cover"
                  loading="lazy"
                />
                <div className="p-5">
                  <p className="text-lg font-bold text-slate-900">{item.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-700">{item.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
