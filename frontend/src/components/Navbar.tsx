import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  ShieldCheck, MapPin, PlusCircle, ClipboardList, BarChart3,
  Sun, Moon, Globe, LogIn, LogOut, User as UserIcon, CheckCircle2, AlertOctagon
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, logout, quickLogin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [showDemoMenu, setShowDemoMenu] = useState(false);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-civic-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight">
                Fix<span className="text-civic-500">Proof</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-medium uppercase tracking-wider text-slate-400 border border-slate-200 dark:border-slate-800 px-1.5 py-0.5 rounded">
                Verification-First
              </span>
            </div>
          </Link>

          {/* Navigation links */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              to="/map"
              className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
                isActive('/map')
                  ? 'bg-civic-50 dark:bg-slate-800 text-civic-600 dark:text-civic-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              {t('nav.explore', 'Civic Map')}
            </Link>

            <Link
              to="/report"
              className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
                isActive('/report')
                  ? 'bg-civic-50 dark:bg-slate-800 text-civic-600 dark:text-civic-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5 text-civic-500" />
              {t('nav.report', 'Report Defect')}
            </Link>

            <Link
              to="/queue"
              className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
                isActive('/queue')
                  ? 'bg-civic-50 dark:bg-slate-800 text-civic-600 dark:text-civic-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              {t('nav.queue', 'Officer Queue')}
            </Link>

            <Link
              to="/accountability"
              className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
                isActive('/accountability')
                  ? 'bg-civic-50 dark:bg-slate-800 text-civic-600 dark:text-civic-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              {t('nav.accountability', 'Accountability Score')}
            </Link>

            {user?.role === 'admin' && (
              <Link
                to="/supervision"
                className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
                  isActive('/supervision')
                    ? 'bg-amber-500/10 text-amber-600 font-semibold'
                    : 'text-amber-600 dark:text-amber-400 hover:bg-amber-500/10'
                }`}
              >
                <AlertOctagon className="w-3.5 h-3.5" />
                Supervisor Queue
              </Link>
            )}
          </div>

          {/* Right utility toolbar */}
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <div className="relative group">
              <button
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 text-xs"
                title="Change language"
              >
                <Globe className="w-4 h-4" />
                <span className="uppercase font-mono font-medium">{i18n.language}</span>
              </button>
              <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 hidden group-hover:block z-50">
                <button
                  onClick={() => changeLanguage('en')}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-700 ${
                    i18n.language === 'en' ? 'font-bold text-civic-500' : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => changeLanguage('ta')}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-700 ${
                    i18n.language === 'ta' ? 'font-bold text-civic-500' : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  தமிழ் (Tamil)
                </button>
                <button
                  onClick={() => changeLanguage('hi')}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-700 ${
                    i18n.language === 'hi' ? 'font-bold text-civic-500' : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  हिंदी (Hindi)
                </button>
              </div>
            </div>

            {/* Dark / Light toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* User Account or Demo Shortcuts */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                <div className="hidden sm:block text-right">
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-none">
                    {user.name}
                  </div>
                  <div className="text-[10px] uppercase font-mono font-bold text-civic-600 dark:text-civic-400">
                    {user.role}
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-slate-500 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setShowDemoMenu(!showDemoMenu)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-civic-600 text-white hover:bg-civic-700 flex items-center gap-1.5 shadow-sm transition"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  Try Demo Login
                </button>

                {showDemoMenu && (
                  <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 z-50">
                    <div className="text-[11px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider">
                      One-Click Demo Roles
                    </div>
                    <button
                      onClick={() => { quickLogin('citizen'); setShowDemoMenu(false); }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between"
                    >
                      <span className="font-medium text-slate-800 dark:text-slate-200">Citizen</span>
                      <span className="text-[10px] text-slate-400">Report & Confirm</span>
                    </button>
                    <button
                      onClick={() => { quickLogin('officer'); setShowDemoMenu(false); }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between"
                    >
                      <span className="font-medium text-slate-800 dark:text-slate-200">Field Officer</span>
                      <span className="text-[10px] text-slate-400">Resolve & Prove</span>
                    </button>
                    <button
                      onClick={() => { quickLogin('admin'); setShowDemoMenu(false); }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between"
                    >
                      <span className="font-medium text-slate-800 dark:text-slate-200">Zonal Admin</span>
                      <span className="text-[10px] text-slate-400">Audit & Override</span>
                    </button>
                    <div className="mt-1 pt-1 border-t border-slate-100 dark:border-slate-700">
                      <Link
                        to="/login"
                        onClick={() => setShowDemoMenu(false)}
                        className="block text-center text-xs text-civic-600 dark:text-civic-400 font-medium py-1"
                      >
                        Standard Sign In &rarr;
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
