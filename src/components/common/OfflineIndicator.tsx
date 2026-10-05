import React, { useEffect, useState } from 'react';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Api } from '../../services/api';
import { StorageService } from '../../services/storage';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);
  const [queueCount, setQueueCount] = useState(StorageService.getOfflineQueue().length);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      const queue = StorageService.getOfflineQueue();
      if (queue.length > 0) {
        setIsSyncing(true);
        try {
          const syncedCount = await Api.syncOfflineSubmissions();
          if (syncedCount > 0) {
            setSyncSuccessMsg(`${syncedCount} ta saqlangan natija serverga muvaffaqiyatli yuklandi!`);
            setTimeout(() => setSyncSuccessMsg(null), 5000);
          }
        } catch (e) {
          console.error('Sync failed:', e);
        } finally {
          setIsSyncing(false);
          setQueueCount(StorageService.getOfflineQueue().length);
        }
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setQueueCount(StorageService.getOfflineQueue().length);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const interval = setInterval(() => {
      setQueueCount(StorageService.getOfflineQueue().length);
    }, 3000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  if (syncSuccessMsg) {
    return (
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xl animate-bounce">
        <CheckCircle2 className="w-4 h-4" />
        <span>{syncSuccessMsg}</span>
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xl">
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        <span>Server bilan ma‘lumotlar sinxronlanmoqda...</span>
      </div>
    );
  }

  if (isOnline && queueCount === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-medium text-white shadow-2xl backdrop-blur-md">
      <WifiOff className="w-4 h-4 animate-pulse shrink-0" />
      <div>
        <p className="font-bold leading-tight">Internet aloqasi uzilgan</p>
        <p className="text-[11px] text-amber-100">
          Javoblaringiz xotirada saqlanmoqda ({queueCount} ta kutmoqda). Aloqa tiklanganda avtomatik yuboriladi.
        </p>
      </div>
    </div>
  );
};
