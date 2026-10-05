import React from 'react';
import { User } from '../../types';
import { PWAInstallButton } from './PWAInstallButton';
import { Sun, Moon, LogOut, ShieldCheck, GraduationCap, UserCheck, BookOpen } from 'lucide-react';

interface HeaderProps {
  user: User | null;
  currentRole: 'admin' | 'teacher' | 'student';
  onSwitchRole: (role: 'admin' | 'teacher' | 'student') => void;
  onLogout: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  currentRole,
  onSwitchRole,
  onLogout,
  isDark,
  onToggleTheme,
  activeTab,
  setActiveTab
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3">
          <a
            href="/"
            onClick={(e) => { e.preventDefault(); setActiveTab('main'); }}
            className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2 group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition">
              <span className="font-extrabold text-sm">TH</span>
            </div>
            <span className="font-extrabold">TestHub<span className="text-blue-600 dark:text-blue-400">Pro</span></span>
          </a>
        </div>

        {/* Zone 2: Navigation Links (single-line, based on role) */}
        {user && (
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-600 dark:text-slate-300">
            {currentRole === 'teacher' && (
              <>
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === 'overview' ? 'text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-900/30' : 'hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Boshqaruv
                </button>
                <button
                  onClick={() => setActiveTab('tests')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === 'tests' ? 'text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-900/30' : 'hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Testlar
                </button>
                <button
                  onClick={() => setActiveTab('groups')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === 'groups' ? 'text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-900/30' : 'hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Guruhlar
                </button>
                <button
                  onClick={() => setActiveTab('bank')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === 'bank' ? 'text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-900/30' : 'hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Savollar banki
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === 'analytics' ? 'text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-900/30' : 'hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Natijalar & Excel
                </button>
                <button
                  onClick={() => setActiveTab('guide')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                    activeTab === 'guide' ? 'text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-900/30' : 'hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Qo‘llanma
                </button>
              </>
            )}

            {currentRole === 'admin' && (
              <>
                <button
                  onClick={() => setActiveTab('admin_overview')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === 'admin_overview' ? 'text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-900/30' : 'hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Tizim
                </button>
                <button
                  onClick={() => setActiveTab('admin_users')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === 'admin_users' ? 'text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-900/30' : 'hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  O‘qituvchilar & O‘quvchilar
                </button>
                <button
                  onClick={() => setActiveTab('admin_telegram')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === 'admin_telegram' ? 'text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-900/30' : 'hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Telegram Bot
                </button>
                <button
                  onClick={() => setActiveTab('admin_loadtest')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === 'admin_loadtest' ? 'text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-900/30' : 'hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  500 User Load Test
                </button>
                <button
                  onClick={() => setActiveTab('admin_logs')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === 'admin_logs' ? 'text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-900/30' : 'hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Audit Log
                </button>
              </>
            )}

            {currentRole === 'student' && (
              <>
                <button
                  onClick={() => setActiveTab('student_tests')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === 'student_tests' ? 'text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-900/30' : 'hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Mening testlarim
                </button>
                <button
                  onClick={() => setActiveTab('student_history')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === 'student_history' ? 'text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-900/30' : 'hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Natijalar tarixi
                </button>
                <button
                  onClick={() => setActiveTab('student_profile')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === 'student_profile' ? 'text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-900/30' : 'hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Profilim
                </button>
              </>
            )}
          </nav>
        )}

        {/* Zone 3: Primary Actions (Theme, Role Selector, PWA, User Info, Logout) */}
        <div className="flex items-center gap-2 sm:gap-3">
          <PWAInstallButton compact />

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="Mavzuni almashtirish"
            title={isDark ? "Yorug' rejimga o'tish" : "Qorong'i rejimga o'tish"}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Fast Role Switcher for Development & Testing */}
          {user && (
            <div className="hidden sm:flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                onClick={() => onSwitchRole('student')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1 ${
                  currentRole === 'student'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <GraduationCap className="w-3 h-3" />
                O‘quvchi
              </button>
              <button
                onClick={() => onSwitchRole('teacher')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1 ${
                  currentRole === 'teacher'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <UserCheck className="w-3 h-3" />
                O‘qituvchi
              </button>
              <button
                onClick={() => onSwitchRole('admin')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1 ${
                  currentRole === 'admin'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3 h-3" />
                Admin
              </button>
            </div>
          )}

          {/* User profile & Logout */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <img
                  src={user.avatarUrl || '/src/assets/images/student_avatar_demo_1791172006085.jpg'}
                  alt={user.firstName}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                />
                <div className="hidden lg:block text-left text-xs">
                  <p className="font-semibold text-slate-900 dark:text-white leading-tight truncate max-w-[110px]">
                    {user.firstName} {user.lastName?.[0]}.
                  </p>
                  <p className="text-[10px] text-slate-500 capitalize">{user.role}</p>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                title="Chiqish"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setActiveTab('auth')}
              className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition cursor-pointer whitespace-nowrap"
            >
              Kirish
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
