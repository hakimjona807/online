import React, { useState, useEffect } from 'react';
import { Api } from '../../services/api';
import { StorageService } from '../../services/storage';
import { User } from '../../types';
import { Send, CheckCircle2, ShieldCheck, UserCheck, GraduationCap, ArrowRight, Clock, MessageSquare, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  onSuccess: (user: User) => void;
  onCancel?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('+998');
  const [otp, setOtp] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [simulatedCode, setSimulatedCode] = useState<string | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(300);

  // OTP countdown
  useEffect(() => {
    let interval: any = null;
    if (step === 'otp' && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(s => s - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timerSeconds]);

  // Phone input formatter (+998 90 123 45 67)
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (!val.startsWith('+998')) {
      val = '+998';
    }
    setPhone(val);
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = phone.replace(/\s+/g, '');
    if (cleanPhone.length < 13) {
      setError("Telefon raqamini to‘liq kiriting (masalan: +998901234567)");
      return;
    }
    if (!firstName.trim()) {
      setError("Ismingizni kiriting");
      return;
    }

    setIsLoading(true);
    try {
      const res = await Api.sendOtp(cleanPhone, firstName, lastName);
      setSimulatedCode(res.devCode || null);
      setTimerSeconds(res.expiresInSeconds || 300);
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Kod yuborishda xatolik yuz berdi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (otp.length < 6) {
      setError("6 xonali tasdiqlash kodini to‘liq kiriting");
      return;
    }

    setIsLoading(true);
    try {
      const cleanPhone = phone.replace(/\s+/g, '');
      const res = await Api.verifyOtp(cleanPhone, otp);
      StorageService.saveSession(res.user, res.token);
      onSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Kodni tasdiqlashda xatolik yuz berdi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (role: 'admin' | 'teacher' | 'student') => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await Api.demoLogin(role);
      StorageService.saveSession(res.user, res.token);
      onSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Demo kirishda xatolik yuz berdi');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 sm:p-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-6 sm:p-8 text-slate-900 dark:text-slate-100">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white mx-auto mb-3 shadow-lg shadow-blue-500/30">
            <span className="font-extrabold text-lg">TH</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {step === 'phone' ? 'TestHub Pro-ga Xush Kelibsiz' : 'Telegram Kodini Tasdiqlash'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {step === 'phone'
              ? 'SMS emas, Telegram orqali xavfsiz va bir martalik kirish kodi oling.'
              : `${phone} raqamiga Telegram bot orqali 6 xonali kod jo‘natildi.`}
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Phone & Name Form */}
        {step === 'phone' ? (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Ismingiz
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jasur"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Familiyangiz
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Mahmudov"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Telefon raqamingiz (+998)
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={handlePhoneChange}
                placeholder="+998901234567"
                maxLength={13}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Raqam +998 bilan boshlanishi va 9 ta raqamdan iborat bo‘lishi lozim.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-semibold text-sm shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Telegram orqali kod olish</span>
                </>
              )}
            </button>
          </form>
        ) : (
          /* Step 2: OTP Verification */
          <form onSubmit={handleVerifyCode} className="space-y-4">
            {/* Telegram Bot Helper Banner */}
            <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200 space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Telegram Bot faollashuvi</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                Telegramdagi bir martalik kodingizni kiriting.
              </p>
              {simulatedCode && (
                <div className="mt-2 p-2 rounded-lg bg-blue-100/70 dark:bg-blue-900/60 border border-blue-300 dark:border-blue-700 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">Simulyatsiya kodi:</span>
                  <span className="font-mono font-bold text-base text-blue-700 dark:text-blue-300 tracking-wider">
                    {simulatedCode}
                  </span>
                  <button
                    type="button"
                    onClick={() => setOtp(simulatedCode)}
                    className="text-[11px] text-blue-600 dark:text-blue-400 underline font-semibold cursor-pointer"
                  >
                    Kiritish
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                6 xonali tasdiqlash kodi
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                autoFocus
                className="w-full text-center tracking-[0.4em] text-xl font-mono py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Muddati: {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}
                </span>
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Raqamni o‘zgartirish
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || otp.length < 6}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-semibold text-sm shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Kodni tasdiqlash va kirish</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Fast 1-Click Demo Login options */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-left">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3">
            Tezkor sinov (1-Click Demo rejimlar):
          </p>
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin('student')}
              className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-medium flex items-center justify-between transition cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-emerald-500" />
                <span>O‘quvchi: <strong>Jasur Mahmudov</strong> (10-A)</span>
              </span>
              <ArrowRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('teacher')}
              className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-medium flex items-center justify-between transition cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-500" />
                <span>O‘qituvchi: <strong>Olim Rahimov</strong> (Matematika)</span>
              </span>
              <ArrowRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('admin')}
              className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-medium flex items-center justify-between transition cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-500" />
                <span>Administrator: <strong>Azamat Karimov</strong></span>
              </span>
              <ArrowRight className="w-3.5 h-3.5 opacity-60" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
