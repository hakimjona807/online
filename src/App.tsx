import React, { useState, useEffect } from 'react';
import { User, UserRole, TestResult } from './types';
import { StorageService } from './services/storage';
import { Header } from './components/common/Header';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { AuthModal } from './components/auth/AuthModal';
import { StudentDashboard } from './components/student/StudentDashboard';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { TestRunner } from './components/student/TestRunner';
import { TestResultModal } from './components/student/TestResultModal';
import {
  ShieldCheck, Zap, FileSpreadsheet, Send, Award, Clock, ArrowRight,
  Smartphone, BookOpen, Layers, CheckCircle2
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>('student');
  const [activeTab, setActiveTab] = useState<string>('main');
  const [isDark, setIsDark] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  // Active Test Execution State
  const [activeTestTake, setActiveTestTake] = useState<{
    testId: string;
    studentId: string;
    groupId: string;
  } | null>(null);

  // Completed Test Result Modal
  const [completedResult, setCompletedResult] = useState<TestResult | null>(null);

  // Initialize theme and session
  useEffect(() => {
    const savedTheme = StorageService.getTheme();
    setIsDark(savedTheme === 'dark');
    StorageService.setTheme(savedTheme);

    const session = StorageService.getSession();
    if (session?.user) {
      setUser(session.user);
      setCurrentRole(session.user.role);
    } else {
      // Default to demo student for instantaneous first view if desired, or show login
      // Let's check session or auto-load student
    }
  }, []);

  const handleToggleTheme = () => {
    const next = isDark ? 'light' : 'dark';
    setIsDark(!isDark);
    StorageService.setTheme(next);
  };

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    setCurrentRole(loggedInUser.role);
    setShowAuthModal(false);
    setActiveTab('main');
  };

  const handleLogout = () => {
    StorageService.clearSession();
    setUser(null);
    setActiveTestTake(null);
    setActiveTab('main');
  };

  const handleSwitchRole = (newRole: UserRole) => {
    setCurrentRole(newRole);
    setActiveTab('main');
  };

  // If student is actively taking a test, show full screen TestRunner
  if (activeTestTake && user) {
    return (
      <div className={`min-h-screen ${isDark ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
        <OfflineIndicator />
        <TestRunner
          testId={activeTestTake.testId}
          studentId={activeTestTake.studentId}
          groupId={activeTestTake.groupId}
          onFinish={(result) => {
            setActiveTestTake(null);
            setCompletedResult(result);
          }}
          onExit={() => setActiveTestTake(null)}
        />
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Global Connectivity Indicator */}
      <OfflineIndicator />

      {/* Top Bar Header */}
      <Header
        user={user}
        currentRole={currentRole}
        onSwitchRole={handleSwitchRole}
        onLogout={handleLogout}
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* MAIN CONTENT AREA */}
      <main className="flex-1">
        {user ? (
          /* AUTHENTICATED USER PORTALS */
          <div className="py-6">
            {currentRole === 'student' && (
              <StudentDashboard
                user={user}
                activeTab={activeTab}
                onStartTest={(testId, groupId) => {
                  setActiveTestTake({
                    testId,
                    studentId: user.id,
                    groupId
                  });
                }}
              />
            )}

            {currentRole === 'teacher' && (
              <TeacherDashboard
                user={user}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
              />
            )}

            {currentRole === 'admin' && (
              <AdminDashboard
                user={user}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
              />
            )}
          </div>
        ) : (
          /* LANDING & WELCOME SCREEN */
          <div className="space-y-16 py-8 sm:py-14">
            
            {/* HERO SECTION */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                
                {/* Hero Left Content */}
                <div className="lg:col-span-7 space-y-6 text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-xs font-semibold text-blue-700 dark:text-blue-300">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                    <span>500+ Foydalanuvchi uchun Maxsus Ishlab Chiqilgan</span>
                  </div>

                  <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
                    Professional va Xavfsiz <span className="text-blue-600 dark:text-blue-400">Onlayn Test</span> Platformasi
                  </h1>

                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                    Telegram bot orqali bir martalik kod bilan kirish, Word (.docx) fayllarni bir zumda testga aylantirish, anti-cheat va natijalarni avtomatik Telegramga jo‘natish tizimi.
                  </p>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      onClick={() => setShowAuthModal(true)}
                      className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-sm shadow-xl shadow-blue-500/25 flex items-center gap-2 transition cursor-pointer"
                    >
                      <span>Tizimga kirish</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        // Quick demo as teacher
                        StorageService.saveSession({
                          id: 'usr-teacher-1',
                          phone: '+998935551122',
                          firstName: 'Olim',
                          lastName: 'Rahimov',
                          role: 'teacher',
                          avatarUrl: '/src/assets/images/teacher_avatar_demo_1791171994714.jpg'
                        }, 'th_demo_token');
                        setUser({
                          id: 'usr-teacher-1',
                          phone: '+998935551122',
                          firstName: 'Olim',
                          lastName: 'Rahimov',
                          role: 'teacher',
                          avatarUrl: '/src/assets/images/teacher_avatar_demo_1791171994714.jpg',
                          createdAt: new Date().toISOString()
                        });
                        setCurrentRole('teacher');
                      }}
                      className="px-5 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-sm transition cursor-pointer"
                    >
                      O‘qituvchi sifatida sinab ko‘rish
                    </button>
                  </div>

                  {/* Key guarantees */}
                  <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-500">
                    <div>
                      <strong className="block text-slate-900 dark:text-white font-bold font-mono">100% Xavfsiz</strong>
                      Telegram OTP orqali
                    </div>
                    <div>
                      <strong className="block text-slate-900 dark:text-white font-bold font-mono">Oflayn Rejim</strong>
                      Aloqa uzilsa ham ishlaydi
                    </div>
                    <div>
                      <strong className="block text-slate-900 dark:text-white font-bold font-mono">Anti-Cheat</strong>
                      Oynadan chiqish nazorati
                    </div>
                  </div>
                </div>

                {/* Hero Right Visual Banner */}
                <div className="lg:col-span-5 relative">
                  <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 bg-slate-900">
                    <img
                      src="/src/assets/images/hero_testhub_banner_1791171975540.jpg"
                      alt="TestHub Pro Platformasi"
                      referrerPolicy="no-referrer"
                      className="w-full h-auto object-cover transform hover:scale-102 transition duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex flex-col justify-end p-6 text-white text-left">
                      <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">
                        Real Vaqt Rejimi
                      </span>
                      <p className="text-base font-bold mt-1">
                        Telegram Bot bilan integratsiyalangan avtomatik baholash
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* KEY FEATURES BENTO SECTION */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
              <div className="text-center max-w-2xl mx-auto mb-10">
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Zamonaviy Ta’lim Uchun Barcha Zarur Imkoniyatlar
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-2">
                  Maktablar, universitetlar va o‘quv markazlari uchun qulay, tezkor va professional test tizimi
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                
                {/* Feature 1 */}
                <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Send className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Telegram Bot Tasdiqlash
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    SMS kutish shart emas. O‘quvchi Telegram bot orqali bir martalik 6 xonali xavfsiz kod oladi va 30 kunga eslab qolinadi.
                  </p>
                </div>

                {/* Feature 2 */}
                <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Zap className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Word (.docx) dan Avtomatik Import
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Savollarni qo‘lda bittalab kiritish shart emas. Word faylini yuklang, tizim savollarni ajratadi va saqlashdan oldin preview beradi.
                  </p>
                </div>

                {/* Feature 3 */}
                <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Excel (.xlsx) Eksport & Hisobot
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Barcha guruhlar, sinflar va o‘quvchilar natijalarini to‘liq ma’lumotlari, vaqti va ko‘rsatkichlari bilan bir zumda Excel formatida yuklab oling.
                  </p>
                </div>

              </div>
            </div>

            {/* Quick Login Modal Trigger */}
            {showAuthModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
                <div className="relative w-full max-w-md my-8">
                  <button
                    onClick={() => setShowAuthModal(false)}
                    className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-lg hover:bg-slate-800 cursor-pointer"
                  >
                    ✕
                  </button>
                  <AuthModal
                    onSuccess={handleLoginSuccess}
                    onCancel={() => setShowAuthModal(false)}
                  />
                </div>
              </div>
            )}

          </div>
        )}
      </main>

      {/* RESULT MODAL (ON TEST FINISH) */}
      {completedResult && (
        <TestResultModal
          result={completedResult}
          onClose={() => setCompletedResult(null)}
        />
      )}

      {/* FOOTER */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 TestHub Pro — Onlayn Test va Baholash Platformasi. Barcha huquqlar himoyalangan.</p>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span>O‘zbekiston, Toshkent</span>
            <span aria-hidden="true">·</span>
            <span>Versiya 1.0.0</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
