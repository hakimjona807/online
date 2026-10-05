import React, { useState, useEffect } from 'react';
import { User, AuditLog, LoadTestResult } from '../../types';
import { Api } from '../../services/api';
import {
  ShieldCheck, Users, MessageSquare, Activity, FileText, Download,
  Play, CheckCircle2, AlertTriangle, UserPlus, Ban, Trash2, RefreshCw, Send, Lock
} from 'lucide-react';

interface AdminDashboardProps {
  user: User;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  activeTab
}) => {
  const [usersList, setUsersList] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [telegramSettings, setTelegramSettings] = useState<any>(null);
  const [loadTestResult, setLoadTestResult] = useState<LoadTestResult | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isTestingLoad, setIsTestingLoad] = useState(false);
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Telegram test form
  const [testTgChatId, setTestTgChatId] = useState('');
  const [testTgMessage, setTestTgMessage] = useState('🔔 TestHub Pro — Telegram Bot aloqasi muvaffaqiyatli o‘rnatildi!');
  const [isSendingTg, setIsSendingTg] = useState(false);

  useEffect(() => {
    loadAdminData();
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const [uData, logsData, tgData] = await Promise.all([
        Api.getAdminUsers(),
        Api.getAuditLogs(),
        Api.getTelegramSettings()
      ]);
      setUsersList(uData);
      setAuditLogs(logsData);
      setTelegramSettings(tgData);
      setTestTgChatId(tgData.defaultChatId || '');
    } catch (e) {
      console.error('Failed to load admin data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleBlock = async (targetUser: User) => {
    try {
      await Api.toggleBlockUser(targetUser.id, !targetUser.isBlocked);
      showToast(`${targetUser.firstName} ${!targetUser.isBlocked ? 'bloklandi' : 'blokdan chiqarildi'}`);
      loadAdminData();
    } catch (e: any) {
      alert(e.message || 'Xatolik yuz berdi');
    }
  };

  const handleDeleteUser = async (targetUser: User) => {
    if (!confirm(`${targetUser.firstName} ${targetUser.lastName} foydalanuvchisini o‘chirishni tasdiqlaysizmi?`)) {
      return;
    }
    try {
      await Api.deleteUser(targetUser.id);
      showToast("Foydalanuvchi o‘chirildi");
      loadAdminData();
    } catch (e: any) {
      alert(e.message || 'Xatolik yuz berdi');
    }
  };

  const handleRun500LoadTest = async () => {
    setIsTestingLoad(true);
    try {
      const result = await Api.runLoadTest();
      setLoadTestResult(result);
      showToast("500 foydalanuvchi yuklama testi muvaffaqiyatli yakunlandi!");
    } catch (e: any) {
      alert(e.message || 'Yuklama testida xatolik yuz berdi');
    } finally {
      setIsTestingLoad(false);
    }
  };

  const handleSaveTelegram = async () => {
    try {
      await Api.updateTelegramSettings({
        botToken: telegramSettings.botToken,
        defaultChatId: testTgChatId,
        isEnabled: telegramSettings.isEnabled,
        notifyOnSubmission: telegramSettings.notifyOnSubmission
      });
      showToast("Telegram sozlamalari saqlandi");
    } catch (e: any) {
      alert(e.message || 'Xatolik yuz berdi');
    }
  };

  const handleSendTestTg = async () => {
    setIsSendingTg(true);
    try {
      const res = await Api.sendTestTelegramAlert(testTgChatId, testTgMessage);
      if (res.simulated) {
        showToast("Xabar simulyatsiya qilindi (Token yoki ChatID kiritilmagan holatda konsolda qayd etildi)");
      } else {
        showToast("Xabar Telegram orqali muvaffaqiyatli yuborildi!");
      }
      loadAdminData();
    } catch (e: any) {
      alert(e.message || 'Telegramga yuborishda xatolik');
    } finally {
      setIsSendingTg(false);
    }
  };

  const handleDatabaseBackup = () => {
    window.location.href = '/api/database/backup';
  };

  const teachers = usersList.filter(u => u.role === 'teacher');
  const students = usersList.filter(u => u.role === 'student');

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8 text-left">
      
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ADMIN HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-purple-600" />
            Administrator Paneli
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Foydalanuvchilar boshqaruvi, Telegram Bot sozlamalari, 500-user yuklama testi va tizim xavfsizligi
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDatabaseBackup}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download className="w-4 h-4 text-purple-500" />
            <span>Database Backup (.json)</span>
          </button>
          <button
            onClick={() => setShowAddTeacherModal(true)}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-500/25 flex items-center gap-1.5 transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>O‘qituvchi yaratish</span>
          </button>
        </div>
      </div>

      {/* TAB: USERS & TEACHERS */}
      {(activeTab === 'admin_users' || activeTab === 'admin_overview' || activeTab === 'main') && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              O‘qituvchilar va O‘quvchilar ({usersList.length})
            </h2>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                <tr>
                  <th className="py-3 px-4">Foydalanuvchi</th>
                  <th className="py-3 px-4">Telefon</th>
                  <th className="py-3 px-4">Rol</th>
                  <th className="py-3 px-4">Fan / Yo‘nalish</th>
                  <th className="py-3 px-4">Holat</th>
                  <th className="py-3 px-4">Ro‘yxatdan o‘tgan</th>
                  <th className="py-3 px-4 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                {usersList.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                      <img
                        src={u.avatarUrl || '/src/assets/images/student_avatar_demo_1791172006085.jpg'}
                        alt=""
                        className="w-7 h-7 rounded-full object-cover"
                      />
                      <span>{u.firstName} {u.lastName}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      {u.phone}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                        u.role === 'admin'
                          ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                          : u.role === 'teacher'
                          ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {u.subject || '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      {u.isBlocked ? (
                        <span className="text-rose-600 font-bold flex items-center gap-1">
                          <Ban className="w-3.5 h-3.5" /> Bloklangan
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Faol
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {new Date(u.createdAt).toLocaleDateString('uz-UZ')}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {u.role !== 'admin' && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleToggleBlock(u)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                              u.isBlocked
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                            }`}
                          >
                            {u.isBlocked ? 'Ochish' : 'Bloklash'}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB: 500 USER LOAD TEST SUITE */}
      {(activeTab === 'admin_loadtest' || activeTab === 'admin_overview') && (
        <section className="space-y-4">
          <div className="p-6 rounded-3xl bg-linear-to-r from-slate-900 to-indigo-950 text-white shadow-xl">
            <div className="max-w-2xl">
              <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold backdrop-blur-md">
                Performance & Stress Test
              </span>
              <h2 className="text-2xl font-bold mt-2">
                500 Virtual Foydalanuvchi Yuklama Testi
              </h2>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Bir vaqtning o‘zida 500 ta virtual o‘quvchi login qilish, test ochish, variantlarni belgilash va natijalarni serverga topshirish ssenariysi bo‘yicha to‘liq test qilinadi.
              </p>

              <button
                onClick={handleRun500LoadTest}
                disabled={isTestingLoad}
                className="mt-5 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-purple-500/30 flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                {isTestingLoad ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>500 ta virtual foydalanuvchi ishga tushirilmoqda...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>500 User Load Testni Boshlash</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Load Test Results Report */}
          {loadTestResult && (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Yuklama Testi Hisoboti (Report)
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Sinov vaqti: {new Date(loadTestResult.timestamp).toLocaleString('uz-UZ')}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold">
                  {loadTestResult.serverLoadScore}
                </span>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-slate-400 block mb-1">Virtual Foydalanuvchilar</span>
                  <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                    {loadTestResult.totalVirtualUsers} ta
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-slate-400 block mb-1">RPS (So‘rov / soniya)</span>
                  <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    {loadTestResult.requestsPerSecond} req/s
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-slate-400 block mb-1">O‘rtacha kechikish</span>
                  <span className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">
                    {loadTestResult.avgLatencyMs} ms
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-slate-400 block mb-1">Xatolik darajasi (Error rate)</span>
                  <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                    {loadTestResult.errorRate}%
                  </span>
                </div>
              </div>

              {/* Latency Percentiles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400">P95 Kechikish:</span>
                  <p className="text-base font-bold font-mono text-slate-900 dark:text-white mt-1">
                    {loadTestResult.p95LatencyMs} ms
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400">P99 Kechikish:</span>
                  <p className="text-base font-bold font-mono text-slate-900 dark:text-white mt-1">
                    {loadTestResult.p99LatencyMs} ms
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400">Xotira bandligi (Heap):</span>
                  <p className="text-base font-bold font-mono text-slate-900 dark:text-white mt-1">
                    {loadTestResult.memoryUsageMb} MB
                  </p>
                </div>
              </div>

              {/* Log Summary */}
              <div className="p-4 rounded-2xl bg-slate-950 text-slate-300 font-mono text-xs space-y-1.5">
                <span className="text-purple-400 font-bold block mb-2">// YUKLAMA TESTI LOGLAR VA TAHLIL:</span>
                {loadTestResult.logSummary.map((log, i) => (
                  <p key={i}>{log}</p>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* TAB: TELEGRAM BOT SETTINGS */}
      {(activeTab === 'admin_telegram' || activeTab === 'admin_overview') && (
        <section className="space-y-4">
          <div className="max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-500" />
                Telegram Bot Integratsiyasi Sozlamalari
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Tokenlar frontend kodida ko‘rinmaydi, serverda saqlanadi. Test tugaganda o‘qituvchiga natijalar yuboriladi.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Telegram Bot Token
                </label>
                <input
                  type="password"
                  value={telegramSettings?.botToken || ''}
                  onChange={e => setTelegramSettings({ ...telegramSettings, botToken: e.target.value })}
                  placeholder="Masalan: 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-mono bg-slate-50 dark:bg-slate-800"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  @BotFather orqali olingan token. .env fayliga yoki ushbu maydonga kiritish mumkin.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Standart O‘qituvchi / Kanal Chat ID
                </label>
                <input
                  type="text"
                  value={testTgChatId}
                  onChange={e => setTestTgChatId(e.target.value)}
                  placeholder="Masalan: 123456789 yoki -1001234567890"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-mono bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleSaveTelegram}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition cursor-pointer"
                >
                  Sozlamalarni saqlash
                </button>
              </div>
            </div>

            {/* Test Send Box */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Telegramga Sinov Xabari Yuborish:
              </h4>
              <textarea
                rows={2}
                value={testTgMessage}
                onChange={e => setTestTgMessage(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 font-mono"
              />
              <button
                onClick={handleSendTestTg}
                disabled={isSendingTg}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-800 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSendingTg ? 'Yuborilmoqda...' : 'Sinov xabarini yuborish'}</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* TAB: AUDIT LOGS */}
      {(activeTab === 'admin_logs' || activeTab === 'admin_overview') && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              Tizim Audit Logi ({auditLogs.length})
            </h2>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                <tr>
                  <th className="py-3 px-4">Vaqt</th>
                  <th className="py-3 px-4">Amal (Action)</th>
                  <th className="py-3 px-4">Foydalanuvchi</th>
                  <th className="py-3 px-4">Rol</th>
                  <th className="py-3 px-4">Tafsilotlar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                      {new Date(log.timestamp).toLocaleTimeString('uz-UZ')} {new Date(log.timestamp).toLocaleDateString('uz-UZ')}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-purple-600 dark:text-purple-400">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {log.userName}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] uppercase font-bold text-slate-500">
                        {log.userRole}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* MODAL: ADD TEACHER */}
      {showAddTeacherModal && (
        <AddTeacherModal
          onClose={() => setShowAddTeacherModal(false)}
          onSuccess={() => {
            setShowAddTeacherModal(false);
            showToast("Yangi o‘qituvchi muvaffaqiyatli qo‘shildi!");
            loadAdminData();
          }}
        />
      )}

    </div>
  );
};

// ==========================================
// SUB-COMPONENT: ADD TEACHER MODAL
// ==========================================
const AddTeacherModal: React.FC<{
  onClose: () => void;
  onSuccess: () => void;
}> = ({ onClose, onSuccess }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('+998');
  const [subject, setSubject] = useState('Matematika');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || phone.length < 13) {
      return alert("Ism va to‘liq telefon raqamini kiriting!");
    }

    setIsLoading(true);
    try {
      await Api.createTeacher({
        firstName,
        lastName,
        phone,
        subject,
        telegramChatId
      });
      onSuccess();
    } catch (e: any) {
      alert(e.message || 'Xatolik yuz berdi');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 text-left">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Yangi O‘qituvchi Yaratish
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Ism</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="Olim"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Familiya</label>
              <input
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="Rahimov"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Telefon (+998)</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+998901234567"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-mono bg-slate-50 dark:bg-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Fani / Mutaxassisligi</label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Fizika va Astronomiya"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Telegram Chat ID (ixtiyoriy)</label>
            <input
              type="text"
              value={telegramChatId}
              onChange={e => setTelegramChatId(e.target.value)}
              placeholder="123456789"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-mono bg-slate-50 dark:bg-slate-800"
            />
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
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-500/25 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? 'Saqlanmoqda...' : 'O‘qituvchini Saqlash'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
