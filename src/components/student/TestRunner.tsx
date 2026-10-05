import React, { useState, useEffect, useRef } from 'react';
import { Api } from '../../services/api';
import { StorageService } from '../../services/storage';
import { Question, TestResult } from '../../types';
import { Clock, AlertTriangle, ArrowLeft, ArrowRight, Check, Send, CheckCircle2, HelpCircle } from 'lucide-react';

interface TestRunnerProps {
  testId: string;
  studentId: string;
  groupId: string;
  onFinish: (result: TestResult) => void;
  onExit: () => void;
}

export const TestRunner: React.FC<TestRunnerProps> = ({
  testId,
  studentId,
  groupId,
  onFinish,
  onExit
}) => {
  const [testData, setTestData] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [windowSwitches, setWindowSwitches] = useState(0);
  
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [serverEndTime, setServerEndTime] = useState<number>(0);
  const [attemptId, setAttemptId] = useState<string>('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSwitchWarning, setShowSwitchWarning] = useState(false);

  const startTimeRef = useRef<number>(Date.now());
  const isAutoSubmittedRef = useRef(false);

  // Initialize test and resume cached progress if available
  useEffect(() => {
    let isMounted = true;

    async function initTest() {
      setIsLoading(true);
      setError(null);

      try {
        const res = await Api.startTest(testId, studentId, groupId);
        if (!isMounted) return;

        setTestData(res.test);
        setQuestions(res.questions);
        setAttemptId(res.attemptId);

        const endTimestamp = new Date(res.test.serverEndTime).getTime();
        setServerEndTime(endTimestamp);

        const now = Date.now();
        const initialRemaining = Math.max(0, Math.floor((endTimestamp - now) / 1000));
        setRemainingSeconds(initialRemaining);

        // Check if there was cached progress from previous session
        const cached = StorageService.getActiveTestProgress(testId);
        if (cached && cached.attemptId === res.attemptId) {
          setAnswers(cached.answers || {});
          setWindowSwitches(cached.windowSwitches || 0);
        } else {
          // Initialize fresh cache
          StorageService.saveActiveTestProgress({
            testId,
            attemptId: res.attemptId,
            answers: {},
            windowSwitches: 0,
            serverEndTime: res.test.serverEndTime,
            lastUpdated: Date.now()
          });
        }
      } catch (err: any) {
        if (!isMounted) return;
        setError(err.message || 'Testni yuklashda xatolik yuz berdi');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initTest();

    return () => {
      isMounted = false;
    };
  }, [testId, studentId, groupId]);

  // Server-synced Timer countdown
  useEffect(() => {
    if (!serverEndTime || isLoading) return;

    const timer = setInterval(() => {
      const now = Date.now();
      const left = Math.max(0, Math.floor((serverEndTime - now) / 1000));
      setRemainingSeconds(left);

      if (left <= 0 && !isAutoSubmittedRef.current) {
        clearInterval(timer);
        isAutoSubmittedRef.current = true;
        handleFinalSubmit(true);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [serverEndTime, isLoading]);

  // Anti-cheat Window Blur / Tab Switch listener
  useEffect(() => {
    if (isLoading) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        recordWindowSwitch();
      }
    };

    const handleWindowBlur = () => {
      recordWindowSwitch();
    };

    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isLoading, answers]);

  const recordWindowSwitch = () => {
    setWindowSwitches(prev => {
      const next = prev + 1;
      setShowSwitchWarning(true);
      setTimeout(() => setShowSwitchWarning(false), 4000);

      // Save to local storage immediately
      StorageService.saveActiveTestProgress({
        testId,
        attemptId,
        answers,
        windowSwitches: next,
        serverEndTime: new Date(serverEndTime).toISOString(),
        lastUpdated: Date.now()
      });
      return next;
    });
  };

  // Option selection with instant LocalStorage caching
  const handleSelectOption = (optionId: string) => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    const updated = {
      ...answers,
      [currentQ.id]: optionId
    };
    setAnswers(updated);

    // Save offline immediately
    StorageService.saveActiveTestProgress({
      testId,
      attemptId,
      answers: updated,
      windowSwitches,
      serverEndTime: new Date(serverEndTime).toISOString(),
      lastUpdated: Date.now()
    });
  };

  // Submit test to server
  const handleFinalSubmit = async (isAuto = false) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setShowConfirmModal(false);

    const timeSpentSeconds = Math.max(5, Math.floor((Date.now() - startTimeRef.current) / 1000));

    try {
      const res = await Api.submitTest(testId, {
        attemptId,
        studentId,
        answers,
        windowSwitches,
        timeSpentSeconds
      });

      // Clear cached test on success
      StorageService.clearActiveTestProgress(testId);
      onFinish(res.result);
    } catch (err: any) {
      setError(err.message || 'Test natijasini yuborishda xatolik yuz berdi');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
          Test yuklanmoqda...
        </h3>
        <p className="text-xs text-slate-500 mt-1">Savollar tayyorlanmoqda va server vaqti sinxronlanmoqda</p>
      </div>
    );
  }

  if (error && !testData) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-lg">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Xatolik</h3>
        <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 mb-6">{error}</p>
        <button
          onClick={onExit}
          className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 cursor-pointer"
        >
          Orqaga qaytish
        </button>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const isTimeCritical = remainingSeconds < 120; // less than 2 minutes

  const timerMins = Math.floor(remainingSeconds / 60);
  const timerSecs = remainingSeconds % 60;
  const timerString = `${timerMins.toString().padStart(2, '0')}:${timerSecs.toString().padStart(2, '0')}`;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      
      {/* Tab Switch Warning Toast */}
      {showSwitchWarning && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-bounce">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Diqqat: Boshqa oynaga o‘tish qayd qilindi! ({windowSwitches}-marta)</span>
        </div>
      )}

      {/* TOP BAR: Test Name, Timer, Progress */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="truncate">
            <h1 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
              {testData?.title}
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">
              Progress: <strong className="text-blue-600 dark:text-blue-400 tabular-nums">{answeredCount}/{questions.length}</strong> ta javob berildi
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Server Synced Animated Timer */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs sm:text-sm font-bold border transition ${
              isTimeCritical
                ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900 animate-pulse'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700'
            }`}>
              <Clock className="w-3.5 h-3.5" />
              <span className="tabular-nums">{timerString}</span>
            </div>

            {/* Window blur indicator */}
            {windowSwitches > 0 && (
              <div
                title="Boshqa sahifaga o‘tishlar soni o‘qituvchiga hisobotda ko‘rinadi"
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-xs font-semibold border border-amber-200 dark:border-amber-900"
              >
                <AlertTriangle className="w-3 h-3" />
                <span className="tabular-nums">{windowSwitches}</span>
              </div>
            )}

            <button
              onClick={() => setShowConfirmModal(true)}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/25 flex items-center gap-1 transition cursor-pointer"
            >
              <Send className="w-3 h-3" />
              <span>Yakunlash</span>
            </button>
          </div>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className="max-w-3xl mx-auto px-4 pt-6">
        
        {/* Question Navigator Pills (1, 2, 3...) */}
        <div className="mb-6 p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {questions.map((q, idx) => {
            const isAnswered = !!answers[q.id];
            const isCurrent = idx === currentIndex;
            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={`w-8 h-8 rounded-xl font-mono text-xs font-bold transition flex items-center justify-center shrink-0 cursor-pointer ${
                  isCurrent
                    ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/30'
                    : isAnswered
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {/* ACTIVE QUESTION CARD */}
        {currentQ && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
            
            {/* Question Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-5">
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 tracking-wider">
                SAVOL #{currentIndex + 1}
              </span>
              <span className="text-[11px] font-medium text-slate-400">
                Ball: {currentQ.points}
              </span>
            </div>

            {/* Question Text */}
            <h2 className="text-base sm:text-xl font-semibold text-slate-900 dark:text-white leading-relaxed mb-6">
              {currentQ.text}
            </h2>

            {/* Large Mobile-First Touch Buttons */}
            <div className="space-y-3">
              {currentQ.options.map((opt, oIdx) => {
                const isSelected = answers[currentQ.id] === opt.id;
                const letter = String.fromCharCode(65 + oIdx);

                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectOption(opt.id)}
                    className={`w-full p-4 rounded-2xl border text-left flex items-start gap-3.5 transition cursor-pointer select-none ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 dark:border-blue-500 text-slate-900 dark:text-white ring-2 ring-blue-500/20 shadow-xs'
                        : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                    }`}>
                      {isSelected ? <Check className="w-4 h-4 stroke-[3]" /> : letter}
                    </div>
                    <span className="text-sm sm:text-base font-medium leading-snug pt-0.5">
                      {opt.text}
                    </span>
                  </button>
                );
              })}
            </div>

          </div>
        )}

        {/* BOTTOM NAVIGATION: Oldingi / Keyingi */}
        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm hover:bg-slate-100 dark:hover:bg-slate-750 transition disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Oldingi</span>
          </button>

          {currentIndex < questions.length - 1 ? (
            <button
              onClick={() => setCurrentIndex(i => Math.min(questions.length - 1, i + 1))}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-500/25 flex items-center gap-1.5 transition cursor-pointer"
            >
              <span>Keyingi</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => setShowConfirmModal(true)}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-emerald-500/25 flex items-center gap-1.5 transition cursor-pointer"
            >
              <span>Testni yakunlash</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>

      {/* CONFIRMATION SUBMIT MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
              <HelpCircle className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Testni yakunlamoqchimisiz?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-4">
              Jami {questions.length} ta savoldan <strong className="text-slate-800 dark:text-slate-200">{answeredCount} tasiga</strong> javob berdingiz.
              {answeredCount < questions.length && (
                <span className="block text-amber-600 dark:text-amber-400 font-semibold mt-1">
                  Diqqat: {questions.length - answeredCount} ta savol javobsiz qolgan!
                </span>
              )}
            </p>

            <div className="grid grid-cols-2 gap-2 mt-5">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Davom etish
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleFinalSubmit(false)}
                className="py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/25 flex items-center justify-center gap-1 transition cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Yuborilmoqda...' : 'Tasdiqlash'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
