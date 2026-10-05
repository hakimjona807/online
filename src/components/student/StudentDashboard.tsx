import React, { useState, useEffect } from 'react';
import { User, TestSettings, TestResult, Group } from '../../types';
import { Api } from '../../services/api';
import { Play, Clock, Award, Calendar, CheckCircle2, XCircle, AlertCircle, Users, BarChart3, BookOpen, Layers } from 'lucide-react';

interface StudentDashboardProps {
  user: User;
  onStartTest: (testId: string, groupId: string) => void;
  activeTab: string;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  user,
  onStartTest,
  activeTab
}) => {
  const [tests, setTests] = useState<TestSettings[]>([]);
  const [results, setResults] = useState<TestResult[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pre-test briefing modal state
  const [selectedTestForBrief, setSelectedTestForBrief] = useState<TestSettings | null>(null);

  useEffect(() => {
    loadStudentData();
  }, [user.id]);

  const loadStudentData = async () => {
    setIsLoading(true);
    try {
      const [testsData, resultsData, groupsData] = await Promise.all([
        Api.getTests({ studentId: user.id }),
        Api.getResults({ studentId: user.id }),
        Api.getGroups({ studentId: user.id })
      ]);
      setTests(testsData);
      setResults(resultsData);
      setGroups(groupsData);
    } catch (e) {
      console.error('Failed to load student data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const getTestAttemptsLeft = (test: TestSettings) => {
    const takenCount = results.filter(r => r.testId === test.id).length;
    return Math.max(0, test.maxAttempts - takenCount);
  };

  // Performance calculations
  const totalTaken = results.length;
  const passedCount = results.filter(r => r.isPassed).length;
  const averagePercentage = totalTaken > 0
    ? Math.round(results.reduce((acc, curr) => acc + curr.percentage, 0) / totalTaken)
    : 0;

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-4">
        <div className="h-28 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="h-44 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="h-44 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="h-44 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-8">
      
      {/* Welcome Banner */}
      <div className="p-6 rounded-3xl bg-linear-to-r from-blue-900 to-indigo-900 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <span className="px-3 py-1 rounded-full bg-white/10 text-blue-200 text-xs font-semibold backdrop-blur-md">
            O‘quvchi Kabineti
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-3 tracking-tight">
            Xush kelibsiz, {user.firstName}!
          </h1>
          <p className="text-xs sm:text-sm text-blue-200 mt-1 leading-relaxed">
            Sizga biriktirilgan guruhlar va topshirish uchun tayyor testlar ro‘yxati.
          </p>

          <div className="flex flex-wrap items-center gap-4 mt-5 text-xs">
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-xs">
              <Layers className="w-4 h-4 text-blue-300" />
              <span>Guruhlar: <strong className="font-bold">{groups.length} ta</strong></span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-xs">
              <Award className="w-4 h-4 text-emerald-300" />
              <span>O‘rtacha natija: <strong className="font-bold font-mono tabular-nums">{averagePercentage}%</strong></span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-xs">
              <CheckCircle2 className="w-4 h-4 text-amber-300" />
              <span>Topshirilgan: <strong className="font-bold font-mono tabular-nums">{passedCount}/{totalTaken}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: AVAILABLE TESTS */}
      {(activeTab === 'student_tests' || activeTab === 'main') && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                Topshirish uchun ochiq testlar
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Guruhlaringiz bo‘yicha faol testlar
              </p>
            </div>
          </div>

          {tests.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Hozircha sizning guruhlaringiz uchun ochiq testlar yo‘q.
              </p>
              <p className="text-xs text-slate-400 mt-1">O‘qituvchi yangi test ochganda bu yerda paydo bo‘ladi.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tests.map(test => {
                const attemptsLeft = getTestAttemptsLeft(test);
                const isOutOfAttempts = attemptsLeft <= 0;

                return (
                  <div
                    key={test.id}
                    className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 shadow-xs hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                          {test.subject || 'Umumiy'}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isOutOfAttempts
                            ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        }`}>
                          {isOutOfAttempts ? 'Topshirilgan' : `${attemptsLeft} ta urinish qoldi`}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug mb-2">
                        {test.title}
                      </h3>

                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
                        {test.description || 'Tavsif kiritilmagan'}
                      </p>

                      {/* Info Badges */}
                      <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 pb-4 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-mono tabular-nums">{test.durationMinutes} daqiqa</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-mono tabular-nums">{test.passingPercentage}% o‘tish</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-mono tabular-nums">{test.questionCount || 0} ta savol</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{test.endDate ? new Date(test.endDate).toLocaleDateString('uz-UZ') : 'Muddatsiz'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-2">
                      <button
                        onClick={() => setSelectedTestForBrief(test)}
                        disabled={isOutOfAttempts}
                        className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition cursor-pointer"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        <span>{isOutOfAttempts ? 'Urinishlar tugagan' : 'Testni boshlash'}</span>
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* SECTION 2: TEST RESULTS HISTORY */}
      {(activeTab === 'student_history' || activeTab === 'main') && (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              Natijalar tarixi
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Avval topshirgan testlaringiz natijalari va statistikasi
            </p>
          </div>

          {results.length === 0 ? (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Hali hech qanday test topshirmagansiz.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Test</th>
                    <th className="py-3 px-4">Ball</th>
                    <th className="py-3 px-4">Foiz</th>
                    <th className="py-3 px-4">Holat</th>
                    <th className="py-3 px-4">Sarflangan vaqt</th>
                    <th className="py-3 px-4">Oynadan chiqish</th>
                    <th className="py-3 px-4">Sana</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                  {results.map((res) => {
                    const mins = Math.floor(res.timeSpentSeconds / 60);
                    const secs = res.timeSpentSeconds % 60;
                    return (
                      <tr key={res.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
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
                        <td className="py-3.5 px-4">
                          {res.isPassed ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="w-3.5 h-3.5" /> O‘tdi
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                              <XCircle className="w-3.5 h-3.5" /> O‘tmadi
                            </span>
                          )}
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
                          {new Date(res.submittedAt).toLocaleDateString('uz-UZ')} {new Date(res.submittedAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* SECTION 3: STUDENT PROFILE */}
      {activeTab === 'student_profile' && (
        <section className="max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-4">
            <img
              src={user.avatarUrl || '/src/assets/images/student_avatar_demo_1791172006085.jpg'}
              alt={user.firstName}
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-2xl object-cover border border-slate-200 dark:border-slate-700"
            />
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-xs text-slate-500 font-mono mt-0.5">{user.phone}</p>
              <span className="inline-block mt-2 px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                O‘quvchi
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              A’zo bo‘lgan guruhlar
            </h3>
            <div className="space-y-2">
              {groups.map(g => (
                <div key={g.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{g.name}</p>
                      <p className="text-[11px] text-slate-500">{g.description || 'Guruh tavsifi yo‘q'}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">
                    O‘qituvchi: {g.teacherName}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* PRE-TEST BRIEFING MODAL */}
      {selectedTestForBrief && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Testga tayyormisiz?
              </h3>
              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold">
                {selectedTestForBrief.durationMinutes} daqiqa
              </span>
            </div>

            <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              {selectedTestForBrief.title}
            </h4>
            <p className="text-xs text-slate-500 mb-5">
              {selectedTestForBrief.description}
            </p>

            {/* Test rules */}
            <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 mb-6">
              <div className="flex items-center justify-between">
                <span>Savollar soni:</span>
                <strong className="font-mono">{selectedTestForBrief.questionCount || 0} ta</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Ajratilgan vaqt:</span>
                <strong className="font-mono">{selectedTestForBrief.durationMinutes} daqiqa</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>O‘tish foizi:</span>
                <strong className="font-mono">{selectedTestForBrief.passingPercentage}%</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Maksimal urinishlar:</span>
                <strong className="font-mono">{selectedTestForBrief.maxAttempts} ta</strong>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-[11px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Test paytida boshqa oynaga o‘tishlar hisoblanadi!</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedTestForBrief(null)}
                className="py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetGid = selectedTestForBrief.groupIds[0] || '';
                  const tId = selectedTestForBrief.id;
                  setSelectedTestForBrief(null);
                  onStartTest(tId, targetGid);
                }}
                className="py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/25 flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Boshlash</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
