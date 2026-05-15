import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Sparkles,
  History,
  FolderOpen,
  Settings,
  User,
  BarChart,
} from "lucide-react";
import { useUser } from "../../features/UserContext";

const Sidebar = ({ isOpen = false, onClose = () => {} }) => {
  const location = useLocation();
  const { user } = useUser();

  const isActive = (screenParam) => {
    const currentPath = location.pathname;
    const currentParams = new URLSearchParams(location.search);
    const currentScreen = currentParams.get("screen");

    if (currentPath !== "/dashboard") return false;

    if (screenParam === null) {
      return !currentScreen || currentScreen === "home";
    }

    return currentScreen === screenParam;
  };

  const navItemClass = (active) => `
    group flex items-center gap-x-3 rounded-xl p-3 text-sm font-semibold transition-all duration-200
    ${
      active
        ? "bg-indigo-600 text-white shadow-md dark:shadow-indigo-900/50"
        : "text-slate-600 hover:bg-slate-50 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-slate-800/50 dark:hover:text-indigo-400"
    }
  `;

  const mobileDrawerClass = isOpen ? "translate-x-0" : "-translate-x-full";

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-200 lg:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out dark:border-slate-800 dark:bg-slate-900 lg:static lg:translate-x-0 ${mobileDrawerClass}`}
      >
        <div className="flex h-16 shrink-0 items-center border-b border-slate-100 px-4 dark:border-slate-800/50">
          <Link to="/" className="flex items-center gap-x-3 truncate" onClick={onClose}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="truncate font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              CV AI Repository
            </span>
          </Link>
        </div>

        <nav className="custom-scrollbar flex flex-1 flex-col gap-y-1 overflow-y-auto px-3 py-6">
          <div className="px-2 pb-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Menu chinh
          </div>

          <Link to="/dashboard" onClick={onClose} className={navItemClass(isActive(null))} title="Tong quan">
            <LayoutDashboard
              className={`h-5 w-5 shrink-0 ${
                isActive(null)
                  ? "text-indigo-100"
                  : "text-slate-400 group-hover:text-indigo-600 dark:text-slate-500 dark:group-hover:text-indigo-400"
              }`}
            />
            <span>Tong quan</span>
          </Link>

          <Link
            to="/dashboard?screen=newAnalysis"
            onClick={onClose}
            className={navItemClass(isActive("newAnalysis"))}
            title="Phan tich moi"
          >
            <Sparkles
              className={`h-5 w-5 shrink-0 ${
                isActive("newAnalysis")
                  ? "text-indigo-100"
                  : "text-indigo-500 dark:text-indigo-400"
              }`}
            />
            <span>Phan tich moi</span>
          </Link>

          <Link
            to="/dashboard?screen=history"
            onClick={onClose}
            className={navItemClass(isActive("history"))}
            title="Lich su doi chieu"
          >
            <History
              className={`h-5 w-5 shrink-0 ${
                isActive("history")
                  ? "text-indigo-100"
                  : "text-slate-400 group-hover:text-indigo-600 dark:text-slate-500 dark:group-hover:text-indigo-400"
              }`}
            />
            <span>Lich su doi chieu</span>
          </Link>

          <Link
            to="/dashboard?screen=profileCv"
            onClick={onClose}
            className={navItemClass(isActive("profileCv"))}
            title="Kho ho so"
          >
            <FolderOpen
              className={`h-5 w-5 shrink-0 ${
                isActive("profileCv")
                  ? "text-indigo-100"
                  : "text-slate-400 group-hover:text-indigo-600 dark:text-slate-500 dark:group-hover:text-indigo-400"
              }`}
            />
            <span>Kho ho so</span>
          </Link>

          <Link
            to="/dashboard?screen=statistics"
            onClick={onClose}
            className={navItemClass(isActive("statistics"))}
            title="Thong ke"
          >
            <BarChart
              className={`h-5 w-5 shrink-0 ${
                isActive("statistics")
                  ? "text-indigo-100"
                  : "text-slate-400 group-hover:text-indigo-600 dark:text-slate-500 dark:group-hover:text-indigo-400"
              }`}
            />
            <span>Thong ke</span>
          </Link>
        </nav>

        <div className="relative border-t border-slate-100 p-4 dark:border-slate-800/50">
          <div className="flex items-center justify-between gap-x-3">
            <div className="flex min-w-0 items-center gap-x-3 rounded-xl transition-colors">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <User className="h-5 w-5" />
                )}
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                  {user?.name ? user.name.toUpperCase() : "NGUOI DUNG"}
                </span>
              </div>
            </div>

            <Link
              to="/thong-tin-nguoi-dung"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-indigo-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-indigo-400"
              title="Cai dat"
            >
              <Settings className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
