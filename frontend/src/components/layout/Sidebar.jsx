import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Sparkles,
  History,
  FolderOpen,
  Settings,
  User,
  FileText,
  BarChart
} from "lucide-react";
import { useUser } from "../../features/UserContext";

const Sidebar = () => {
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
    ${active 
      ? "bg-indigo-600 text-white shadow-md dark:shadow-indigo-900/50" 
      : "text-slate-600 hover:bg-slate-50 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-slate-800/50 dark:hover:text-indigo-400"
    }
  `;

  return (
    <aside
      className={`relative flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors duration-300 ease-in-out z-40 w-64`}
    >
      {/* Brand */}
      <div className="flex h-16 shrink-0 items-center px-4 border-b border-slate-100 dark:border-slate-800/50">
        <Link to="/" className="flex items-center gap-x-3 truncate">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="truncate font-display text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            CV AI Repository
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-y-1 overflow-y-auto px-3 py-6 custom-scrollbar">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 pb-2">
          Menu chính
        </div>

        <Link
          to="/dashboard"
          className={navItemClass(isActive(null))}
          title="Tổng quan"
        >
          <LayoutDashboard className={`h-5 w-5 shrink-0 ${isActive(null) ? "text-indigo-100" : "text-slate-400 group-hover:text-indigo-600 dark:text-slate-500 dark:group-hover:text-indigo-400"}`} />
          <span>Tổng quan</span>
        </Link>

        <Link
          to="/dashboard?screen=newAnalysis"
          className={navItemClass(isActive("newAnalysis"))}
          title="Phân tích mới"
        >
          <Sparkles className={`h-5 w-5 shrink-0 ${isActive("newAnalysis") ? "text-indigo-100" : "text-indigo-500 dark:text-indigo-400"}`} />
          <span>Phân tích mới</span>
        </Link>

        <Link
          to="/dashboard?screen=history"
          className={navItemClass(isActive("history"))}
          title="Lịch sử đối chiếu"
        >
          <History className={`h-5 w-5 shrink-0 ${isActive("history") ? "text-indigo-100" : "text-slate-400 group-hover:text-indigo-600 dark:text-slate-500 dark:group-hover:text-indigo-400"}`} />
          <span>Lịch sử đối chiếu</span>
        </Link>

        <Link
          to="/dashboard?screen=profileCv"
          className={navItemClass(isActive("profileCv"))}
          title="Kho hồ sơ"
        >
          <FolderOpen className={`h-5 w-5 shrink-0 ${isActive("profileCv") ? "text-indigo-100" : "text-slate-400 group-hover:text-indigo-600 dark:text-slate-500 dark:group-hover:text-indigo-400"}`} />
          <span>Kho hồ sơ</span>
        </Link>

        <Link
          to="/dashboard?screen=statistics"
          className={navItemClass(isActive("statistics"))}
          title="Thống kê"
        >
          <BarChart className={`h-5 w-5 shrink-0 ${isActive("statistics") ? "text-indigo-100" : "text-slate-400 group-hover:text-indigo-600 dark:text-slate-500 dark:group-hover:text-indigo-400"}`} />
          <span>Thống kê</span>
        </Link>
      </nav>

      {/* User Section */}
      <div className="relative border-t border-slate-100 dark:border-slate-800/50 p-4">
        <div className="flex items-center justify-between gap-x-3">
          <div className={`flex items-center gap-x-3 rounded-xl transition-colors min-w-0`}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden text-slate-500 dark:text-slate-400">
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
            <div className="flex flex-col min-w-0">
              <span className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                {user?.name ? user.name.toUpperCase() : "NGƯỜI DÙNG"}
              </span>
            </div>
          </div>
          
          <Link
            to="/thong-tin-nguoi-dung"
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800 dark:text-slate-500 dark:hover:text-indigo-400 transition-all"
            title="Cài đặt"
          >
            <Settings className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
