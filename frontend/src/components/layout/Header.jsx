import React, { useEffect, useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { LogOut, User, Sun, Moon, Bell, ChevronRight, Menu } from "lucide-react";
import { useUser } from "../../features/UserContext";
import {
  toggleStoredTheme,
  getStoredTheme,
  subscribeTheme,
} from "../../utils/themeController";

const BREADCRUMB_MAP = {
  home: "Tổng quan",
  newAnalysis: "Phân tích mới",
  history: "Lịch sử đối chiếu",
  profileCv: "Hồ sơ của tôi",
  statistics: "Thống kê",
  jobMatch: "So sánh CV/JD",
};

const Header = ({ onMenuClick }) => {
  const { user, logout } = useUser();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [theme, setTheme] = useState(getStoredTheme);
  const location = useLocation();
  const dropdownRef = useRef(null);

  useEffect(() => subscribeTheme(setTheme), []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const handleToggleTheme = () => {
    const nextTheme = toggleStoredTheme();
    setTheme(nextTheme);
  };

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  const handleLogout = () => {
    setIsDropdownOpen(false);
    logout();
  };

  const getScreenName = () => {
    const query = new URLSearchParams(location.search);
    const screen = query.get("screen");
    return BREADCRUMB_MAP[screen] || BREADCRUMB_MAP["home"];
  };

  const currentScreenName = getScreenName();

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-x-4 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 px-4 shadow-sm backdrop-blur-md sm:gap-x-6 sm:px-6 lg:px-8 transition-colors duration-300">
      {/* Mobile menu button (optional) */}
      <button type="button" onClick={onMenuClick} className="-m-2.5 p-2.5 text-slate-700 dark:text-slate-300 lg:hidden">
        <span className="sr-only">Mở menu</span>
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      {/* Separator for mobile */}
      <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 lg:hidden" aria-hidden="true" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <nav className="flex flex-1 items-center" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm font-medium">
            <li>
              <div className="flex items-center">
                <span className="text-slate-500 dark:text-slate-400">Menu</span>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                <span className="ml-2 text-slate-900 dark:text-white font-semibold">{currentScreenName}</span>
              </div>
            </li>
          </ol>
        </nav>

        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <button
            type="button"
            onClick={handleToggleTheme}
            className="-m-2.5 p-2.5 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition"
            title="Đổi giao diện"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          <button type="button" className="relative -m-2.5 p-2.5 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition" title="Thông báo">
            <span className="sr-only">Xem thông báo</span>
            <Bell className="h-5 w-5" aria-hidden="true" />
            <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
          </button>

          {/* Separator */}
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-slate-200 dark:lg:bg-slate-700" aria-hidden="true" />

          {/* Profile dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              className="-m-1.5 flex items-center p-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 rounded-full"
              onClick={toggleDropdown}
              aria-expanded={isDropdownOpen}
            >
              <span className="sr-only">Mở menu người dùng</span>
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white overflow-hidden border border-indigo-100 dark:border-indigo-900">
                {user?.avatar_url ? (
                  <img
                    className="h-full w-full object-cover"
                    src={user.avatar_url}
                    alt={user.name}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="text-xs font-bold">{user?.name ? user.name.charAt(0).toUpperCase() : "U"}</span>
                )}
              </div>
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 z-10 mt-2.5 w-48 origin-top-right rounded-xl bg-white dark:bg-slate-800 py-2 shadow-lg ring-1 ring-slate-900/5 dark:ring-white/10 focus:outline-none transform opacity-100 scale-100 transition-all duration-200 ease-out border border-slate-100 dark:border-slate-700">
                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user?.name || "Người dùng"}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email || "Ứng viên"}</p>
                </div>
                <Link
                  to="/thong-tin-nguoi-dung"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                >
                  <User className="mr-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
                  Thông tin cá nhân
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition"
                >
                  <LogOut className="mr-3 h-4 w-4 text-rose-400 dark:text-rose-500" />
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
