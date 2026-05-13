import { ChevronRight } from "lucide-react";
import SiteFooter from "../components/marketing/SiteFooter";
import SiteHeader from "../components/marketing/SiteHeader";

const faqs = [
  {
    question: "Có cần tích hợp ATS trước khi sử dụng không?",
    answer: "Không. Bạn có thể chạy độc lập, sau đó kết nối ATS khi cần.",
  },
  {
    question: "Dữ liệu phỏng vấn được bảo mật ra sao?",
    answer: "Phân quyền theo vai trò, có audit log và chính sách lưu trữ rõ ràng.",
  },
  {
    question: "Mất bao lâu để onboard đội ngũ?",
    answer: "Thông thường 3-7 ngày để setup workflow và mẫu rubric đầu tiên.",
  },
  {
    question: "Nền tảng có hỗ trợ tiếng Việt không?",
    answer: "Có. Hệ thống hỗ trợ giao diện và kịch bản phỏng vấn tiếng Việt.",
  },
];

export default function FaqPage() {
  return (
    <main className="min-h-screen bg-[#f8fbff]">
      <SiteHeader />

      <div className="mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 lg:px-8">
        <section className="grid gap-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">FAQ</p>
            <h1 className="mt-3 font-display text-4xl font-extrabold text-slate-900">
              Câu hỏi thường gặp trước khi triển khai.
            </h1>
            <p className="mt-3 text-base text-slate-700">
              Tất cả thông tin cần thiết để bắt đầu nhanh.
            </p>
          </div>
          <div className="lg:col-span-5">
            <img
              src="https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=900&q=80"
              alt="Minh họa trang câu hỏi thường gặp"
              className="h-64 w-full rounded-2xl object-cover"
              loading="lazy"
            />
          </div>
        </section>

        <section className="mt-8 grid gap-4">
          {faqs.map((item) => (
            <article
              key={item.question}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">{item.question}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-700">{item.answer}</p>
                </div>
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-500" />
              </div>
            </article>
          ))}
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
