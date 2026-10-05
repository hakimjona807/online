import React, { useState, useEffect } from 'react';
import { User, Group, TestSettings, Question, TestResult } from '../../types';
import { Api } from '../../services/api';
import {
  Users, BookOpen, Layers, Award, FileSpreadsheet, Plus, Search,
  Download, RotateCcw, AlertTriangle, CheckCircle2, XCircle, FileText,
  Copy, Trash2, Edit3, Eye, UploadCloud, HelpCircle, Check, ChevronRight
} from 'lucide-react';

interface TeacherDashboardProps {
  user: User;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  user,
  activeTab,
  setActiveTab
}) => {
  // Core state
  const [groups, setGroups] = useState<Group[]>([]);
  const [tests, setTests] = useState<TestSettings[]>([]);
  const [results, setResults] = useState<TestResult[]>([]);
  const [bankQuestions, setBankQuestions] = useState<Question[]>([]);
  const [allStudents, setAllStudents] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('');
  const [selectedTestFilter, setSelectedTestFilter] = useState('');

  // Modals
  const [showCreateTestModal, setShowCreateTestModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showWordImportModal, setShowWordImportModal] = useState(false);
  const [selectedTestForAnalytics, setSelectedTestForAnalytics] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  // Notifications
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [user.id]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [groupsData, testsData, resultsData, bankData, usersData] = await Promise.all([
        Api.getGroups({ teacherId: user.id }),
        Api.getTests({ teacherId: user.id }),
        Api.getResults(),
        Api.getQuestionBank(),
        Api.getAdminUsers()
      ]);
      setGroups(groupsData);
      setTests(testsData);
      setResults(resultsData);
      setBankQuestions(bankData);
      setAllStudents(usersData.filter((u: User) => u.role === 'student'));
    } catch (e) {
      console.error('Failed to load teacher data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTestAnalytics = async (testId: string) => {
    setSelectedTestForAnalytics(testId);
    try {
      const data = await Api.getTestAnalytics(testId);
      setAnalyticsData(data);
    } catch (e) {
      console.error('Analytics load error:', e);
    }
  };

  // Allow Retake
  const handleAllowRetake = async (resultId: string) => {
    if (!confirm("Haqiqatan ham bu o‘quvchining natijasini o‘chirib, testni qayta topshirishga ruxsat bermoqchimisiz?")) {
      return;
    }
    try {
      await Api.allowRetake(resultId);
      showToast("Natija o‘chirildi va o‘quvchiga qayta topshirish imkoniyati berildi.");
      loadData();
    } catch (err: any) {
      alert(err.message || 'Xatolik yuz berdi');
    }
  };

  // Excel Export
  const handleExcelExport = () => {
    const url = `/api/export/excel?testId=${selectedTestFilter}&groupId=${selectedGroupFilter}`;
    window.location.href = url;
  };

  // Filtered Results
  const filteredResults = results.filter(r => {
    if (selectedGroupFilter && r.groupId !== selectedGroupFilter) return false;
    if (selectedTestFilter && r.testId !== selectedTestFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        r.studentName.toLowerCase().includes(q) ||
        r.testTitle.toLowerCase().includes(q) ||
        r.groupName.toLowerCase().includes(q) ||
        r.studentPhone.includes(q)
      );
    }
    return true;
  });

  // KPI calculations
  const totalStudentsCount = new Set(groups.flatMap(g => g.studentIds)).size;
  const totalTestsCount = tests.length;
  const avgResult = results.length > 0
    ? Math.round(results.reduce((acc, curr) => acc + curr.percentage, 0) / results.length)
    : 0;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8 text-left">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* DASHBOARD HEADER & QUICK STATS */}
      {(activeTab === 'overview' || activeTab === 'main') && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                O‘qituvchi Boshqaruv Paneli
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Guruhlar, testlar, natijalar tahlili va Excel hisobotlari
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowWordImportModal(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <UploadCloud className="w-4 h-4 text-blue-500" />
                <span>Word (.docx) yuklash</span>
              </button>
              <button
                onClick={() => setShowCreateTestModal(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/25 flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Yangi test yaratish</span>
              </button>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider">O‘quvchilar</span>
                <Users className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                {totalStudentsCount}
              </div>
              <span className="text-[10px] text-slate-400">guruhlar bo‘yicha</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Guruhlar</span>
                <Layers className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                {groups.length}
              </div>
              <span className="text-[10px] text-slate-400">faol sinflar</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Jami testlar</span>
                <BookOpen className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                {totalTestsCount}
              </div>
              <span className="text-[10px] text-slate-400">yaratilgan</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Topshirildi</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                {results.length}
              </div>
              <span className="text-[10px] text-slate-400">barcha urinishlar</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider">O‘rtacha foiz</span>
                <Award className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                {avgResult}%
              </div>
              <span className="text-[10px] text-slate-400">umumiy ko‘rsatkich</span>
            </div>
          </div>
        </>
      )}

      {/* TAB 1: TESTS MANAGEMENT */}
      {(activeTab === 'tests' || activeTab === 'overview' || activeTab === 'main') && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              Testlar ro‘yxati ({tests.length})
            </h2>
            <button
              onClick={() => setShowCreateTestModal(true)}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Test qo‘shish
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tests.map(test => (
              <div
                key={test.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                      {test.subject}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {test.questionCount || 0} ta savol
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug mb-2">
                    {test.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                    {test.description || 'Tavsif yo‘q'}
                  </p>

                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Vaqt:</span>
                      <strong className="font-mono">{test.durationMinutes} daqiqa</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">O‘tish foizi:</span>
                      <strong className="font-mono">{test.passingPercentage}%</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Maks. urinish:</span>
                      <strong className="font-mono">{test.maxAttempts} ta</strong>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => loadTestAnalytics(test.id)}
                    className="flex-1 py-1.5 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Statistika & Tahlil</span>
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm(`"${test.title}" testini o‘chirishni tasdiqlaysizmi?`)) {
                        await Api.deleteTest(test.id);
                        showToast("Test o‘chirildi");
                        loadData();
                      }
                    }}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                    title="O‘chirish"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TAB 2: GROUPS MANAGEMENT */}
      {(activeTab === 'groups' || activeTab === 'overview') && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              Guruhlar ({groups.length})
            </h2>
            <button
              onClick={() => setShowCreateGroupModal(true)}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Yangi guruh
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map(group => (
              <div
                key={group.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                      Guruh
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                      {group.studentIds.length} ta o‘quvchi
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                    {group.name}
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    {group.description || 'Guruh tavsifi yo‘q'}
                  </p>

                  {/* Student avatars snippet */}
                  <div className="space-y-1 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-medium text-slate-400 block mb-1">A’zolar:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {group.studentIds.slice(0, 4).map(sid => {
                        const st = allStudents.find(s => s.id === sid);
                        return (
                          <span
                            key={sid}
                            className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-300"
                          >
                            {st ? `${st.firstName} ${st.lastName?.[0]}.` : 'O‘quvchi'}
                          </span>
                        );
                      })}
                      {group.studentIds.length > 4 && (
                        <span className="px-1.5 py-0.5 text-[11px] text-slate-400">
                          +{group.studentIds.length - 4} yana
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <button
                    onClick={async () => {
                      if (confirm(`"${group.name}" guruhini o‘chirishni xohlaysizmi?`)) {
                        await Api.deleteGroup(group.id);
                        showToast("Guruh o‘chirildi");
                        loadData();
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                    title="Guruhni o‘chirish"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TAB 3: RESULTS & EXCEL EXPORT */}
      {(activeTab === 'analytics' || activeTab === 'overview' || activeTab === 'main') && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                Natijalar jadvali & Excel yuklash
              </h2>
              <p className="text-xs text-slate-500">
                O‘quvchilar natijalarini ko‘rish, filterlash va .xlsx formatda yuklab olish
              </p>
            </div>

            <button
              onClick={handleExcelExport}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/25 flex items-center gap-2 transition cursor-pointer self-start sm:self-auto"
            >
              <Download className="w-4 h-4" />
              <span>Excel (.xlsx) yuklab olish</span>
            </button>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="O‘quvchi yoki test qidirish..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={selectedGroupFilter}
              onChange={(e) => setSelectedGroupFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Barcha guruhlar</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>

            <select
              value={selectedTestFilter}
              onChange={(e) => setSelectedTestFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Barcha testlar</option>
              {tests.map(t => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </div>

          {/* Results Table */}
          <div className="overflow-x-auto rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                <tr>
                  <th className="py-3 px-4">O‘quvchi</th>
                  <th className="py-3 px-4">Guruh</th>
                  <th className="py-3 px-4">Test</th>
                  <th className="py-3 px-4">Ball</th>
                  <th className="py-3 px-4">Foiz</th>
                  <th className="py-3 px-4">Sarflangan vaqt</th>
                  <th className="py-3 px-4">Oynadan chiqish</th>
                  <th className="py-3 px-4">Sana</th>
                  <th className="py-3 px-4 text-right">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                {filteredResults.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      Natijalar topilmadi.
                    </td>
                  </tr>
                ) : (
                  filteredResults.map(res => {
                    const mins = Math.floor(res.timeSpentSeconds / 60);
                    const secs = res.timeSpentSeconds % 60;
                    return (
                      <tr key={res.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                          <div>{res.studentName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{res.studentPhone}</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                          {res.groupName}
                        </td>
                        <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200">
                          {res.testTitle}
                        </td>
                        <td className="py-3.5 px-4 font-mono tabular-nums">
                          {res.score} / {res.maxScore}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`font-mono font-bold tabular-nums ${
                            res.isPassed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                          }`}>
                            {res.percentage}%
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono tabular-nums">
                          {mins}:{secs.toString().padStart(2, '0')}
                        </td>
                        <td className="py-3.5 px-4 font-mono tabular-nums">
                          {res.windowSwitches > 0 ? (
                            <span className="text-amber-600 dark:text-amber-400 font-bold">
                              {res.windowSwitches} marta
                            </span>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                          {new Date(res.submittedAt).toLocaleDateString('uz-UZ')}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleAllowRetake(res.id)}
                            title="Natijani o‘chirish va qayta topshirishga ruxsat berish"
                            className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 text-[11px] font-semibold flex items-center gap-1 ml-auto cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Qayta topshirish</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 4: QUESTION BANK */}
      {activeTab === 'bank' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Savollar banki ({bankQuestions.length})
              </h2>
              <p className="text-xs text-slate-500">
                Oldin yaratilgan savollar ombori, qayta ishlatish va nusxalash
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bankQuestions.map((q, idx) => (
              <div
                key={q.id || idx}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs"
              >
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span className="font-semibold text-blue-600 dark:text-blue-400 uppercase">
                    {q.topic || q.subject || 'Umumiy'}
                  </span>
                  <span>Ball: {q.points}</span>
                </div>

                <p className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                  {idx + 1}. {q.text}
                </p>

                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  {q.options.map((opt, oIdx) => (
                    <div
                      key={opt.id || oIdx}
                      className={`p-2 rounded-xl flex items-center justify-between ${
                        opt.isCorrect
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-semibold'
                          : 'bg-slate-50 dark:bg-slate-800/60'
                      }`}
                    >
                      <span>{String.fromCharCode(65 + oIdx)}) {opt.text}</span>
                      {opt.isCorrect && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </div>
                  ))}
                </div>

                {q.explanation && (
                  <p className="mt-3 text-[11px] text-slate-500 italic border-t border-slate-100 dark:border-slate-800 pt-2">
                    Izoh: {q.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TAB 5: TEACHER GUIDE / QO'LLANMA */}
      {activeTab === 'guide' && (
        <section className="max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
              O‘qituvchi Qo‘llanmasi
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Platformadan maksimal darajada samarali foydalanish bo‘yicha bosqichma-bosqich ko‘rsatma
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center mb-2">1</span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Guruh yaratish</h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                «Guruhlar» bo‘limiga o‘ting va «Yangi guruh» tugmasini bosing. Guruh nomini (masalan: 10-A Matematika) kiriting va o‘quvchilarni biriktiring.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center mb-2">2</span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Word (.docx) dan savollarni import qilish</h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Word faylingizda savollarni «1. Savol? A) ... *B) to‘g‘ri variant» ko‘rinishida tayyorlang. Yulduzcha (*) to‘g‘ri javobni bildiradi. Tizim avtomatik taniyadi va xatolarni ko‘rsatadi.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center mb-2">3</span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Test yaratish va sozlash</h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Test nomi, vaqt (daqiqada), maksimal urinishlar va o‘tish foizini belgilang. Savollar va variantlarni aralashtirish funksiyasini yoqing.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center mb-2">4</span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Telegram orqali xabarnoma</h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                O‘quvchi testni tugatgan zahoti sizning Telegram botingizga ball, foiz, sarflangan vaqt va oynadan chiqishlar soni haqida xabarnoma yuboriladi.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center mb-2">5</span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Excel (.xlsx) hisobot</h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                «Natijalar» bo‘limida «Excel (.xlsx) yuklab olish» tugmasini bossangiz, barcha o‘quvchilar ko‘rsatkichlari, vaqti va oynadan chiqishlari bilan tayyor jadval yuklanadi.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center mb-2">6</span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Qayta topshirishga ruxsat berish</h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Agar o‘quvchi texnik nosozlikka uchrasa, natijalar jadvalidagi «Qayta topshirish» tugmasi orqali uning urinishini tozalab, yana imkoniyat berishingiz mumkin.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* MODAL: TEST ANALYTICS & STUDENTS WHO HAVEN'T TAKEN TEST */}
      {selectedTestForAnalytics && analyticsData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 text-left my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Test Tahlili: {analyticsData.testTitle}
                </h3>
                <p className="text-xs text-slate-500">
                  Jami topshirganlar: <strong className="text-slate-900 dark:text-white">{analyticsData.totalSubmissions} ta</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedTestForAnalytics(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {/* Students who haven't taken test yet */}
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs mb-6">
              <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300 mb-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Bu testni hali ishlamagan o‘quvchilar: {analyticsData.notTakenCount} ta</span>
              </div>
              {analyticsData.notTakenStudents.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-2">
                  {analyticsData.notTakenStudents.map((st: any) => (
                    <span
                      key={st.id}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800/60 font-medium text-slate-800 dark:text-slate-200"
                    >
                      {st.name} ({st.phone})
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500">Barcha biriktirilgan o‘quvchilar ushbu testni topshirgan.</p>
              )}
            </div>

            {/* Question Statistics (accuracy %) */}
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                Savollar bo‘yicha to‘g‘ri javob foizi
              </h4>
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {analyticsData.questionStats.map((qs: any) => (
                  <div key={qs.questionId} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                        {qs.index}-savol: {qs.questionText}
                      </span>
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                        {qs.accuracyPercentage}% to‘g‘ri
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden mt-2">
                      <div
                        className={`h-full rounded-full ${
                          qs.accuracyPercentage >= 70
                            ? 'bg-emerald-500'
                            : qs.accuracyPercentage >= 40
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${qs.accuracyPercentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedTestForAnalytics(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE TEST */}
      {showCreateTestModal && (
        <CreateTestModal
          teacherId={user.id}
          groups={groups}
          onClose={() => setShowCreateTestModal(false)}
          onSuccess={() => {
            setShowCreateTestModal(false);
            showToast("Yangi test muvaffaqiyatli yaratildi!");
            loadData();
          }}
        />
      )}

      {/* MODAL: WORD (.DOCX) IMPORT WITH PREVIEW */}
      {showWordImportModal && (
        <WordImportModal
          teacherId={user.id}
          groups={groups}
          onClose={() => setShowWordImportModal(false)}
          onSuccess={() => {
            setShowWordImportModal(false);
            showToast("Word faylidagi savollar muvaffaqiyatli saqlandi!");
            loadData();
          }}
        />
      )}

      {/* MODAL: CREATE GROUP */}
      {showCreateGroupModal && (
        <CreateGroupModal
          teacherId={user.id}
          allStudents={allStudents}
          onClose={() => setShowCreateGroupModal(false)}
          onSuccess={() => {
            setShowCreateGroupModal(false);
            showToast("Yangi guruh yaratildi!");
            loadData();
          }}
        />
      )}

    </div>
  );
};

// ==========================================
// SUB-COMPONENT: CREATE TEST MODAL
// ==========================================
const CreateTestModal: React.FC<{
  teacherId: string;
  groups: Group[];
  onClose: () => void;
  onSuccess: () => void;
}> = ({ teacherId, groups, onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('Matematika');
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>(groups.map(g => g.id));
  const [durationMinutes, setDurationMinutes] = useState(20);
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [passingPercentage, setPassingPercentage] = useState(60);
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(true);
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(true);
  const [showExplanations, setShowExplanations] = useState(true);

  // Manual questions list
  const [questionsList, setQuestionsList] = useState<any[]>([
    {
      text: 'Trigonometriyada sin(90°) qiymati nimaga teng?',
      type: 'multiple_choice',
      points: 2,
      explanation: 'Birlik aylanada 90 gradus burchakda ordinata 1 ga teng.',
      options: [
        { id: '1', text: '0', isCorrect: false },
        { id: '2', text: '1', isCorrect: true },
        { id: '3', text: '-1', isCorrect: false },
        { id: '4', text: '0.5', isCorrect: false }
      ]
    }
  ]);

  const [isLoading, setIsLoading] = useState(false);

  const handleAddQuestion = () => {
    setQuestionsList([
      ...questionsList,
      {
        text: '',
        type: 'multiple_choice',
        points: 1,
        explanation: '',
        options: [
          { id: '1', text: '', isCorrect: true },
          { id: '2', text: '', isCorrect: false },
          { id: '3', text: '', isCorrect: false },
          { id: '4', text: '', isCorrect: false }
        ]
      }
    ]);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return alert("Test nomini kiriting!");

    setIsLoading(true);
    try {
      await Api.createTest({
        title,
        description,
        subject,
        teacherId,
        groupIds: selectedGroupIds,
        durationMinutes,
        maxAttempts,
        passingPercentage,
        shuffleQuestions,
        shuffleOptions,
        showCorrectAnswers,
        showExplanations,
        questionsList
      });
      onSuccess();
    } catch (err: any) {
      alert(err.message || 'Xatolik yuz berdi');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 text-left my-8">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-5">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Yangi Test Yaratish
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Test nomi</label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Masalan: 10-A Matematika 1-chorak nazorati"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Fan</label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Matematika"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tavsif</label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Test haqida qisqacha ko‘rsatma..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          {/* Test parameters */}
          <div className="grid grid-cols-3 gap-2.5 pt-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Vaqt (daqiqa)</label>
              <input
                type="number"
                min={1}
                value={durationMinutes}
                onChange={e => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Maks. urinish</label>
              <input
                type="number"
                min={1}
                value={maxAttempts}
                onChange={e => setMaxAttempts(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">O‘tish foizi (%)</label>
              <input
                type="number"
                min={1}
                max={100}
                value={passingPercentage}
                onChange={e => setPassingPercentage(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>

          {/* Checkbox settings */}
          <div className="grid grid-cols-2 gap-2 pt-2 text-xs text-slate-700 dark:text-slate-300">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={shuffleQuestions} onChange={e => setShuffleQuestions(e.target.checked)} />
              <span>Savollarni aralashtirish</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={shuffleOptions} onChange={e => setShuffleOptions(e.target.checked)} />
              <span>Variantlarni aralashtirish</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={showCorrectAnswers} onChange={e => setShowCorrectAnswers(e.target.checked)} />
              <span>To‘g‘ri javoblarni ko‘rsatish</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={showExplanations} onChange={e => setShowExplanations(e.target.checked)} />
              <span>Izohlarni ko‘rsatish</span>
            </label>
          </div>

          {/* Question inputs */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Savollar ({questionsList.length} ta)</h4>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="text-xs text-blue-600 font-bold hover:underline cursor-pointer"
              >
                + Savol qo‘shish
              </button>
            </div>

            <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
              {questionsList.map((q, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">#{idx + 1}-savol</span>
                    <button
                      type="button"
                      onClick={() => setQuestionsList(questionsList.filter((_, i) => i !== idx))}
                      className="text-rose-500 hover:text-rose-700 text-xs"
                    >
                      O‘chirish
                    </button>
                  </div>

                  <input
                    type="text"
                    required
                    value={q.text}
                    onChange={e => {
                      const updated = [...questionsList];
                      updated[idx].text = e.target.value;
                      setQuestionsList(updated);
                    }}
                    placeholder="Savol matnini kiriting..."
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-800"
                  />

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {q.options.map((opt: any, oIdx: number) => (
                      <div key={opt.id} className="flex items-center gap-1.5">
                        <input
                          type="radio"
                          name={`correct-${idx}`}
                          checked={opt.isCorrect}
                          onChange={() => {
                            const updated = [...questionsList];
                            updated[idx].options.forEach((o: any, oi: number) => {
                              o.isCorrect = oi === oIdx;
                            });
                            setQuestionsList(updated);
                          }}
                        />
                        <input
                          type="text"
                          required
                          value={opt.text}
                          onChange={e => {
                            const updated = [...questionsList];
                            updated[idx].options[oIdx].text = e.target.value;
                            setQuestionsList(updated);
                          }}
                          placeholder={`Variant ${String.fromCharCode(65 + oIdx)}`}
                          className="w-full px-2 py-1 rounded-md border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-800"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/25 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? 'Saqlanmoqda...' : 'Testni Saqlash'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// SUB-COMPONENT: WORD (.DOCX) / FAST TEXT IMPORT MODAL
// ==========================================
const WordImportModal: React.FC<{
  teacherId: string;
  groups: Group[];
  onClose: () => void;
  onSuccess: () => void;
}> = ({ teacherId, groups, onClose, onSuccess }) => {
  const [testTitle, setTestTitle] = useState('Worddan import qilingan test');
  const [subject, setSubject] = useState('Matematika');
  const [rawText, setRawText] = useState(`1. O'zbekiston poytaxti qaysi shahar?
A) Samarqand
*B) Toshkent
C) Buxoro
D) Xiva

2. 2 + 2 * 2 amali natijasi nimaga teng?
A) 8
*B) 6
C) 4
D) 10`);

  const [previewData, setPreviewData] = useState<any>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setIsParsing(true);
      try {
        const res = await Api.parseDocxOrText({ fileBase64: base64 });
        setPreviewData(res);
      } catch (err: any) {
        alert(err.message || 'Word faylni tahlil qilishda xatolik');
      } finally {
        setIsParsing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleParseText = async () => {
    setIsParsing(true);
    try {
      const res = await Api.parseDocxOrText({ rawText });
      setPreviewData(res);
    } catch (err: any) {
      alert(err.message || 'Matnni tahlil qilishda xatolik');
    } finally {
      setIsParsing(false);
    }
  };

  const handleSaveToTest = async () => {
    if (!previewData || previewData.questions.length === 0) return;

    setIsSaving(true);
    try {
      await Api.createTest({
        title: testTitle,
        description: 'Word (.docx) faylidan avtomatik import qilindi',
        subject: subject,
        teacherId,
        groupIds: groups.map(g => g.id),
        durationMinutes: 20,
        maxAttempts: 1,
        passingPercentage: 60,
        shuffleQuestions: true,
        shuffleOptions: true,
        showCorrectAnswers: true,
        showExplanations: true,
        questionsList: previewData.questions
      });
      onSuccess();
    } catch (err: any) {
      alert(err.message || 'Testni saqlashda xatolik');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 text-left my-8">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Word (.docx) yoki Matndan Savollarni Tezkor Import Qilish
            </h3>
            <p className="text-xs text-slate-500">
              Format: «1. Savol? A) ... *B) to‘g‘ri javob ...»
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">✕</button>
        </div>

        {!previewData ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200">
              <p className="font-bold mb-1">Avtomatik formatlash qoidasi:</p>
              <code className="block font-mono bg-white/60 dark:bg-slate-800 p-2 rounded-lg text-[11px] mt-1 text-slate-800 dark:text-slate-200">
                1. O‘zbekiston poytaxti qaysi shahar?<br />
                A) Samarqand<br />
                *B) Toshkent<br />
                C) Buxoro<br />
                D) Xiva
              </code>
              <p className="mt-2 text-[11px] text-slate-600 dark:text-slate-400">
                «*» (yulduzcha) to‘g‘ri javobni bildiradi. Tizim xatoliklarni aniqlaydi va sizga ko‘rsatadi.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Test nomi</label>
                <input
                  type="text"
                  value={testTitle}
                  onChange={e => setTestTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Fan</label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Word (.docx) faylini tanlang
              </label>
              <input
                type="file"
                accept=".docx"
                onChange={handleFileUpload}
                className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Yoki matnni to‘g‘ridan-to‘g‘ri joylashtiring
              </label>
              <textarea
                rows={6}
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                className="w-full p-3 font-mono text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleParseText}
                disabled={isParsing}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/25 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span>{isParsing ? 'Tahlil qilinmoqda...' : 'Tahlil qilish va Preview ko‘rish'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* PREVIEW STATE */
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200">
              <span>Muvaffaqiyatli ajratildi: <strong>{previewData.totalParsed} ta savol</strong></span>
              <button
                type="button"
                onClick={() => setPreviewData(null)}
                className="text-xs underline cursor-pointer"
              >
                Qayta tahrirlash
              </button>
            </div>

            {previewData.warnings && previewData.warnings.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 space-y-1">
                <span className="font-bold">Diqqat:</span>
                {previewData.warnings.map((w: string, i: number) => (
                  <p key={i}>• {w}</p>
                ))}
              </div>
            )}

            <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
              {previewData.questions.map((q: any, idx: number) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                  <p className="font-bold text-slate-900 dark:text-white mb-2">
                    {idx + 1}. {q.text}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {q.options.map((opt: any) => (
                      <div
                        key={opt.id}
                        className={`p-1.5 rounded-lg flex items-center justify-between ${
                          opt.isCorrect
                            ? 'bg-emerald-100 dark:bg-emerald-900/60 font-bold text-emerald-800 dark:text-emerald-200'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span>{opt.letter}) {opt.text}</span>
                        {opt.isCorrect && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setPreviewData(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold cursor-pointer"
              >
                Orqaga
              </button>
              <button
                type="button"
                onClick={handleSaveToTest}
                disabled={isSaving}
                className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/25 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span>{isSaving ? 'Saqlanmoqda...' : 'Barcha savollarni test sifatida saqlash'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// SUB-COMPONENT: CREATE GROUP MODAL
// ==========================================
const CreateGroupModal: React.FC<{
  teacherId: string;
  allStudents: User[];
  onClose: () => void;
  onSuccess: () => void;
}> = ({ teacherId, allStudents, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert("Guruh nomini kiriting!");

    setIsLoading(true);
    try {
      await Api.createGroup({
        name,
        description,
        teacherId,
        studentIds: selectedStudentIds
      });
      onSuccess();
    } catch (err: any) {
      alert(err.message || 'Xatolik yuz berdi');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStudent = (id: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 text-left">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Yangi Guruh Yaratish
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Guruh nomi</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Masalan: 11-B Fizika"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Guruh tavsifi</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Guruh maqsadi yoki dars vaqtlari..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              O‘quvchilarni biriktirish ({selectedStudentIds.length} ta tanlandi)
            </label>
            <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
              {allStudents.map(st => {
                const isSelected = selectedStudentIds.includes(st.id);
                return (
                  <label
                    key={st.id}
                    onClick={() => toggleStudent(st.id)}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-xs cursor-pointer select-none"
                  >
                    <span>{st.firstName} {st.lastName} ({st.phone})</span>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                    />
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/25 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? 'Saqlanmoqda...' : 'Guruhni Saqlash'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
