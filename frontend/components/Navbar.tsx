import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Scale,
  FileText,
  User,
  ShieldCheck,
  Home,
  LayoutDashboard,
  LogIn,
  FileCheck,
  BookOpen,
  Search,
  Sun,
  Moon,
  HelpCircle,
  Plus,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";

const Navbar: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  // Use user.role from context, fallback to client if not ready but authenticated
  const userRole = user?.role || "client";
  const isLoggedIn = isAuthenticated;

  const isActive = (path: string) =>
    location.pathname === path
      ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400"
      : "text-slate-600 hover:text-blue-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-slate-800";

  return (
    <nav className="glass-header sticky top-0 z-50 w-full no-print transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="shrink-0 flex items-center gap-2.5">
              <div className="flex aspect-square size-8 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-md shadow-blue-500/25 border border-white/20">
                <Scale className="h-4 w-4" />
              </div>
              <span className="font-extrabold text-xl bg-gradient-to-r from-slate-900 via-slate-800 to-blue-700 dark:from-white dark:via-slate-200 dark:to-blue-400 bg-clip-text text-transparent tracking-tight">
                LexPortal
              </span>
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-4">
              <Link
                to="/"
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${isActive("/")}`}
              >
                <Home className="w-4 h-4" />
                Start
              </Link>

              <Link
                to="/knowledge-base"
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${isActive("/knowledge-base")}`}
              >
                <BookOpen className="w-4 h-4" />
                <span className="flex flex-col leading-tight">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Baza wiedzy
                  </span>
                  <span>Pisma procesowe & FAQ</span>
                </span>
              </Link>

              <Link
                to="/document-analysis"
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${isActive("/document-analysis")}`}
              >
                <FileCheck className="w-4 h-4" />
                <span className="flex flex-col leading-tight">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-800 dark:text-emerald-400">
                    PROFESJONALNA ANALIZA PRAWNA
                  </span>
                  <span>Analiza Dokumentów</span>
                </span>
              </Link>

              <Link
                to="/help"
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${isActive("/help")}`}
              >
                <HelpCircle className="w-4 h-4" />
                <span className="flex flex-col leading-tight">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">
                    WSPARCIE I POMOC 24/7
                  </span>
                  <span>Centrum Pomocy</span>
                </span>
              </Link>

              {isLoggedIn && (
                <Link
                  to="/assistant"
                  className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${isActive("/assistant")}`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  Asystent AI
                </Link>
              )}
              {isLoggedIn && (
                <Link
                  to="/resources"
                  className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${isActive("/resources")}`}
                >
                  <FileText className="w-4 h-4" />
                  Materiały Projektowe
                </Link>
              )}
              {isLoggedIn && (
                <Link
                  to="/document-creator"
                  className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${isActive("/document-creator")}`}
                >
                  <Plus className="w-4 h-4 text-emerald-500" />
                  <span className="flex flex-col leading-tight">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">
                      Nowość
                    </span>
                    <span>Kreator Dokumentów</span>
                  </span>
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isLoggedIn ? (
              <Link
                to="/login"
                className="hidden md:flex px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:text-blue-600 items-center gap-1 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Zaloguj
              </Link>
            ) : (
              <div className="hidden md:flex items-center gap-3">
                <Link
                  to={
                    userRole.toUpperCase() === "ADMIN"
                      ? "/admin-dashboard"
                      : userRole.toUpperCase() === "LAWYER" ||
                        userRole.toUpperCase() === "OPERATOR"
                        ? "/lawyer-dashboard"
                        : "/client-dashboard"
                  }
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  {userRole.toUpperCase() === "ADMIN"
                    ? "Panel Admina"
                    : userRole.toUpperCase() === "LAWYER" ||
                      userRole.toUpperCase() === "OPERATOR"
                      ? "Panel Operatora"
                      : "Panel Klienta"}
                </Link>
                <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Witaj,{" "}
                  {userRole.toUpperCase() === "ADMIN"
                    ? "Administratorze"
                    : userRole.toUpperCase() === "LAWYER" ||
                      userRole.toUpperCase() === "OPERATOR"
                      ? "Operatorze"
                      : "Kliencie"}
                </div>
              </div>
            )}

            <button
              onClick={() => {
                const event = new CustomEvent('open-omni-search');
                window.dispatchEvent(event);
              }}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors mx-2 border border-slate-200 dark:border-slate-700"
              title="Szukaj (Cmd+K)"
            >
              <Search className="w-4 h-4" />
              <span className="hidden lg:inline">Czego szukasz?</span>
              <kbd className="hidden lg:inline-block ml-2 text-[10px] font-semibold bg-slate-200 dark:bg-slate-700 px-1.5 rounded">⌘K</kbd>
            </button>

            <Link
              to={
                !isLoggedIn
                  ? "/login"
                  : userRole.toUpperCase() === "LAWYER" ||
                    userRole.toUpperCase() === "OPERATOR"
                    ? "/lawyer-dashboard"
                    : userRole.toUpperCase() === "ADMIN"
                      ? "/admin-dashboard"
                      : "/profile"
              }
              className={`p-2 rounded-full text-slate-400 hover:text-slate-500 hover:bg-slate-50`}
              title={isLoggedIn ? "Twój Profil / Panel" : "Zaloguj się"}
            >
              <span className="sr-only">
                {isLoggedIn ? "Profil" : "Zaloguj"}
              </span>
              <User className="h-6 w-6" />
            </Link>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-slate-400 hover:text-slate-500 hover:bg-slate-50 transition-colors"
              aria-label={
                theme === "dark"
                  ? "Przełącz na tryb jasny"
                  : "Przełącz na tryb ciemny"
              }
              title={
                theme === "dark"
                  ? "Przełącz na tryb jasny"
                  : "Przełącz na tryb ciemny"
              }
            >
              {theme === "dark" ? (
                <Sun className="h-6 w-6" />
              ) : (
                <Moon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>
      {/* Mobile menu */}
      <div className="sm:hidden flex justify-around border-t border-slate-200/50 dark:border-white/10 py-2.5 glass-panel">
        <Link
          to="/"
          className="p-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
        >
          <Home className="w-6 h-6" />
        </Link>
        <Link
          to="/knowledge-base"
          className="p-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
        >
          <BookOpen className="w-6 h-6" />
        </Link>
        <Link
          to="/document-analysis"
          className="p-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
        >
          <FileCheck className="w-6 h-6" />
        </Link>
        {isLoggedIn && (
          <Link
            to={
              userRole.toUpperCase() === "ADMIN"
                ? "/admin-dashboard"
                : userRole.toUpperCase() === "LAWYER" ||
                  userRole.toUpperCase() === "OPERATOR"
                  ? "/lawyer-dashboard"
                  : "/client-dashboard"
            }
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
          >
            <LayoutDashboard className="w-6 h-6" />
          </Link>
        )}
        {isLoggedIn && (
          <Link
            to="/assistant"
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
          >
            <ShieldCheck className="w-6 h-6" />
          </Link>
        )}
        {isLoggedIn && (
          <Link
            to="/resources"
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
          >
            <FileText className="w-6 h-6" />
          </Link>
        )}
        <Link
          to={isLoggedIn ? "/profile" : "/login"}
          className="p-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
        >
          <User className="w-6 h-6" />
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
