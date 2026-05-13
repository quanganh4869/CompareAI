import { Github, Linkedin, Mail, Phone, Youtube } from "lucide-react";
import { Link } from "react-router-dom";

const footerColumns = [
  {
    title: "Sản phẩm",
    links: ["Mô phỏng phỏng vấn AI", "Bảng điểm năng lực", "Báo cáo tuyển dụng"],
  },
  {
    title: "Doanh nghiệp",
    links: ["Giải pháp cho HRBP", "Giải pháp cho Talent Team", "Tình huống thực tế"],
  },
  {
    title: "Tài nguyên",
    links: ["Trung tâm trợ giúp", "Tài liệu triển khai", "Webinar"],
  },
];

const socialIcons = [
  { icon: Linkedin, label: "LinkedIn" },
  { icon: Youtube, label: "YouTube" },
  { icon: Github, label: "GitHub" },
];

export default function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-[#F8FAFC] text-slate-700">
      <div className="mx-auto max-w-7xl px-4 pb-8 pt-12 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="font-display text-2xl font-bold text-slate-900">
                Sẵn sàng nâng cấp quy trình tuyển dụng bằng AI?
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Tối ưu thời gian tuyển dụng và nâng chất lượng đánh giá ứng viên.
              </p>
            </div>
            <Link
              to="/"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="inline-flex w-fit rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
            >
              Bắt đầu trải nghiệm
            </Link>
          </div>
        </section>

        <section className="mt-12 grid gap-8 lg:grid-cols-4">
          <div>
            <h4 className="font-display text-lg font-bold text-slate-900">AI Interview</h4>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Nền tảng SaaS cho quy trình phỏng vấn có đo lường.
            </p>
            <div className="mt-5 space-y-3 text-sm text-slate-700">
              <p className="inline-flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-blue-700" />
                <span>contact@aiinterviewassistant.com</span>
              </p>
              <p className="inline-flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-blue-700" />
                <span>+84 28 7109 8899</span>
              </p>
            </div>
          </div>

          {footerColumns.map((column) => (
            <div key={column.title}>
              <h5 className="text-sm font-bold uppercase tracking-wider text-slate-900">{column.title}</h5>
              <ul className="mt-3 space-y-2">
                {column.links.map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-slate-600 transition hover:text-blue-700">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section className="mt-10 flex flex-col gap-4 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} AI Interview. Mọi quyền được bảo lưu.
          </p>
          <div className="flex items-center gap-3">
            {socialIcons.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.label}
                  href="#"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                  aria-label={item.label}
                >
                  <Icon className="h-4 w-4" />
                </a>
              );
            })}
          </div>
        </section>
      </div>
    </footer>
  );
}
