import { Menu, Sparkles } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { API_BASE_URL } from "../../config/api";

const navItems = [
  { label: "Sản phẩm", to: "/san-pham" },
  { label: "Bảng giá", to: "/bang-gia" },
  { label: "FAQ", to: "/faq" },
];

export default function SiteHeader({ showNav = true }) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-[#f8fbff]/95 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="inline-flex items-center gap-3 rounded-xl px-2 py-1 transition hover:bg-blue-50"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-700 text-white">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="font-display text-base font-bold text-slate-900">AI interview</span>
        </Link>

        {showNav ? (
          <nav className="hidden items-center gap-8 lg:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `text-sm font-semibold transition ${
                    isActive ? "text-blue-700" : "text-slate-700 hover:text-blue-700"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        ) : (
          <div />
        )}

        <div className="hidden items-center sm:flex">
          <Link
            to="/login"
            className="text-sm font-semibold text-slate-700 transition hover:text-blue-700"
          >
            Đăng nhập
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-white sm:hidden"
          aria-label="Mở điều hướng"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
