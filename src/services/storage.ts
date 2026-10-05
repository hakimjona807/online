// Local storage and offline session keys
const AUTH_KEY = 'testhub_auth_session';
const THEME_KEY = 'testhub_theme_mode';
const TEST_CACHE_KEY_PREFIX = 'testhub_active_test_';
const OFFLINE_ANSWERS_QUEUE = 'testhub_offline_answers_queue';

export interface LocalTestState {
  testId: string;
  attemptId: string;
  answers: Record<string, string>;
  windowSwitches: number;
  serverEndTime: string;
  lastUpdated: number;
}

export const StorageService = {
  // Auth Session (30 days persistence)
  saveSession(user: any, token: string) {
    try {
      const data = {
        user,
        token,
        savedAt: Date.now(),
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
      };
      localStorage.setItem(AUTH_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save session:', e);
    }
  },

  getSession() {
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (Date.now() > data.expiresAt) {
        localStorage.removeItem(AUTH_KEY);
        return null;
      }
      return data;
    } catch {
      return null;
    }
  },

  clearSession() {
    localStorage.removeItem(AUTH_KEY);
  },

  // Active Test In-Progress State (Instant offline persistence)
  saveActiveTestProgress(state: LocalTestState) {
    try {
      localStorage.setItem(`${TEST_CACHE_KEY_PREFIX}${state.testId}`, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to cache test progress:', e);
    }
  },

  getActiveTestProgress(testId: string): LocalTestState | null {
    try {
      const raw = localStorage.getItem(`${TEST_CACHE_KEY_PREFIX}${testId}`);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  clearActiveTestProgress(testId: string) {
    localStorage.removeItem(`${TEST_CACHE_KEY_PREFIX}${testId}`);
  },

  // Offline answers queue for background sync
  queueOfflineSubmission(payload: any) {
    try {
      const current = this.getOfflineQueue();
      current.push(payload);
      localStorage.setItem(OFFLINE_ANSWERS_QUEUE, JSON.stringify(current));
    } catch (e) {
      console.error('Failed to queue offline submission:', e);
    }
  },

  getOfflineQueue(): any[] {
    try {
      const raw = localStorage.getItem(OFFLINE_ANSWERS_QUEUE);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  clearOfflineQueue() {
    localStorage.removeItem(OFFLINE_ANSWERS_QUEUE);
  },

  // Theme
  getTheme(): 'light' | 'dark' {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  },

  setTheme(theme: 'light' | 'dark') {
    localStorage.setItem(THEME_KEY, theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
};
