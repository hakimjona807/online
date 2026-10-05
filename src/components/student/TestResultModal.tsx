import React, { useEffect } from 'react';
import { TestResult } from '../../types';
import confetti from 'canvas-confetti';
import { CheckCircle2, XCircle, Clock, AlertTriangle, ArrowRight, BookOpen } from 'lucide-react';

interface TestResultModalProps {
  result: TestResult;
  onClose: () => void;
}

export const TestResultModal: React.FC<TestResultModalProps> = ({ result, onClose }) => {
  useEffect(() => {
    if (result.isPassed) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [result.isPassed]);

  const mins = Math.floor(result.timeSpentSeconds / 60);
  const secs = result.timeSpentSeconds % 60;
  const timeFormatted = `${mins} daq ${secs} soniya`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 text-left my-8">
        
        {/* Top Status */}
        <div className="text-center pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="inline-flex p-3 rounded-2xl mb-3">
            {result.isPassed ? (
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <XCircle className="w-10 h-10" />
              </div>
            )}
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {result.isPassed ? "Tabriklaymiz, siz o‘tdingiz!" : "Afsuski, o‘tish balli to‘planmadi"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {result.testTitle}
          </p>
        </div>

        {/* Primary Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-6">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 text-center">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">To‘plangan ball</span>
            <span className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {result.score} <span className="text-sm font-normal text-slate-400">/ {result.maxScore}</span>
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 text-center">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">Foiz</span>
            <span className={`text-xl sm:text-2xl font-bold font-mono tabular-nums ${
              result.isPassed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {result.percentage}%
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 text-center">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1 flex items-center justify-center gap-1">
              <Clock className="w-3 h-3" /> Vaqt
            </span>
            <span className="text-sm sm:text-base font-semibold font-mono text-slate-900 dark:text-white tabular-nums">
              {timeFormatted}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 text-center">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1 flex items-center justify-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-500" /> Chiqishlar
            </span>
            <span className={`text-sm sm:text-base font-semibold font-mono tabular-nums ${
              result.windowSwitches > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'
            }`}>
              {result.windowSwitches} marta
            </span>
          </div>
        </div>

        {/* Detailed question review (if permitted by test settings) */}
        {result.detailedAnswers && result.detailedAnswers.length > 0 && (
          <div className="mt-2 border-t border-slate-100 dark:border-slate-800 pt-5">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Savollar bo‘yicha tahlil</h3>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {result.detailedAnswers.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border text-xs text-left ${
                    item.isCorrect
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                      : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm">
                      {idx + 1}. {item.questionText}
                    </p>
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] shrink-0 ${
                      item.isCorrect
                        ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                        : 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300'
                    }`}>
                      {item.isCorrect ? "To'g'ri" : "Noto'g'ri"}
                    </span>
                  </div>

                  <p className="text-slate-600 dark:text-slate-300 mt-1">
                    Sizning javobingiz: <strong className={item.isCorrect ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}>{item.selectedOptionText}</strong>
                  </p>

                  {!item.isCorrect && item.correctOptionText && (
                    <p className="text-slate-700 dark:text-slate-200 mt-0.5">
                      To‘g‘ri javob: <strong className="text-emerald-700 dark:text-emerald-300">{item.correctOptionText}</strong>
                    </p>
                  )}

                  {item.explanation && (
                    <div className="mt-2 pt-2 border-t border-slate-200/50 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 italic">
                      Izoh: {item.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <span>Bosh sahifaga qaytish</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
