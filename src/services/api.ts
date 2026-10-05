import { StorageService } from './storage';
import { Group, TestSettings, Question, TestResult, AuditLog, LoadTestResult } from '../types';

class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const session = StorageService.getSession();
  const headers = new Headers(options.headers || {});
  
  if (session?.token) {
    headers.set('Authorization', `Bearer ${session.token}`);
  }
  
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    const res = await fetch(endpoint, {
      ...options,
      headers
    });

    if (!res.ok) {
      let errorMessage = 'Kutilmagan xatolik yuz berdi.';
      try {
        const errorData = await res.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        errorMessage = `Server xatosi (${res.status})`;
      }
      throw new ApiError(errorMessage, res.status);
    }

    return await res.json();
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    if (!navigator.onLine) {
      throw new ApiError('Internet aloqasi mavjud emas. Javoblaringiz qurilmada saqlanadi va aloqa tiklangach sinxronlanadi.');
    }
    throw new ApiError(err.message || 'Server bilan bog‘lanishda xatolik.');
  }
}

export const Api = {
  // Auth
  async sendOtp(phone: string, firstName?: string, lastName?: string) {
    return request<{ success: boolean; message: string; devCode?: string; expiresInSeconds: number }>(
      '/api/auth/send-code',
      {
        method: 'POST',
        body: JSON.stringify({ phone, firstName, lastName })
      }
    );
  },

  async verifyOtp(phone: string, code: string) {
    return request<{ success: boolean; user: any; token: string }>('/api/auth/verify-code', {
      method: 'POST',
      body: JSON.stringify({ phone, code })
    });
  },

  async demoLogin(role: 'admin' | 'teacher' | 'student') {
    return request<{ success: boolean; user: any; token: string }>('/api/auth/demo-login', {
      method: 'POST',
      body: JSON.stringify({ role })
    });
  },

  async getMe() {
    return request<{ user: any }>('/api/auth/me');
  },

  // Groups
  async getGroups(params?: { teacherId?: string; studentId?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return request<Group[]>(`/api/groups${query ? `?${query}` : ''}`);
  },

  async createGroup(data: { name: string; description?: string; teacherId: string; studentIds?: string[] }) {
    return request<Group>('/api/groups', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateGroup(id: string, data: Partial<Group>) {
    return request<Group>(`/api/groups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async deleteGroup(id: string) {
    return request<{ success: boolean }>(`/api/groups/${id}`, {
      method: 'DELETE'
    });
  },

  // Tests
  async getTests(params?: { teacherId?: string; studentId?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return request<TestSettings[]>(`/api/tests${query ? `?${query}` : ''}`);
  },

  async getTestById(id: string) {
    return request<TestSettings & { questions: Question[] }>(`/api/tests/${id}`);
  },

  async createTest(data: any) {
    return request<{ success: boolean; test: TestSettings }>('/api/tests', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateTest(id: string, data: any) {
    return request<{ success: boolean; test: TestSettings }>(`/api/tests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async deleteTest(id: string) {
    return request<{ success: boolean }>(`/api/tests/${id}`, {
      method: 'DELETE'
    });
  },

  // Test Taking & Submission
  async startTest(testId: string, studentId: string, groupId?: string) {
    return request<{
      attemptId: string;
      test: {
        id: string;
        title: string;
        description: string;
        durationMinutes: number;
        serverTime: string;
        serverEndTime: string;
        passingPercentage: number;
      };
      questions: Question[];
    }>(`/api/tests/${testId}/start`, {
      method: 'POST',
      body: JSON.stringify({ studentId, groupId })
    });
  },

  async submitTest(testId: string, payload: {
    attemptId: string;
    studentId: string;
    answers: Record<string, string>;
    windowSwitches: number;
    timeSpentSeconds: number;
  }) {
    if (!navigator.onLine) {
      // Save offline queue
      StorageService.queueOfflineSubmission({ testId, payload, queuedAt: Date.now() });
      throw new ApiError('Siz oflayn holatdasiz. Natijangiz qurilma xotirasida saqlandi va internet qaytganda avtomatik serverga yuklanadi.');
    }

    return request<{ success: boolean; result: TestResult }>(`/api/tests/${testId}/submit`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // Process offline queue on reconnect
  async syncOfflineSubmissions(): Promise<number> {
    const queue = StorageService.getOfflineQueue();
    if (queue.length === 0) return 0;

    let synced = 0;
    const remaining: any[] = [];

    for (const item of queue) {
      try {
        await this.submitTest(item.testId, item.payload);
        synced++;
      } catch {
        remaining.push(item);
      }
    }

    if (remaining.length === 0) {
      StorageService.clearOfflineQueue();
    } else {
      localStorage.setItem('testhub_offline_answers_queue', JSON.stringify(remaining));
    }

    return synced;
  },

  // Results & Analytics
  async getResults(params?: { testId?: string; groupId?: string; studentId?: string; search?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return request<TestResult[]>(`/api/results${query ? `?${query}` : ''}`);
  },

  async getTestAnalytics(testId: string) {
    return request<{
      testTitle: string;
      totalSubmissions: number;
      notTakenCount: number;
      notTakenStudents: any[];
      questionStats: any[];
    }>(`/api/tests/${testId}/analytics`);
  },

  async allowRetake(resultId: string) {
    return request<{ success: boolean; message: string }>(`/api/results/${resultId}/retake`, {
      method: 'DELETE'
    });
  },

  // Question Bank & Word parser
  async getQuestionBank(params?: { subject?: string; topic?: string; search?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return request<Question[]>(`/api/questions/bank${query ? `?${query}` : ''}`);
  },

  async parseDocxOrText(data: { rawText?: string; fileBase64?: string }) {
    return request<{
      success: boolean;
      totalParsed: number;
      questions: any[];
      warnings: string[];
    }>('/api/questions/parse-docx', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Telegram settings & test
  async getTelegramSettings() {
    return request<{
      botTokenConfigured: boolean;
      defaultChatId: string;
      isEnabled: boolean;
      notifyOnSubmission: boolean;
      recentNotifications: any[];
    }>('/api/telegram/settings');
  },

  async updateTelegramSettings(data: any) {
    return request<{ success: boolean; settings: any }>('/api/telegram/settings', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async sendTestTelegramAlert(chatId?: string, message?: string) {
    return request<{ success: boolean; simulated: boolean }>('/api/telegram/test-send', {
      method: 'POST',
      body: JSON.stringify({ chatId, message })
    });
  },

  // Audit logs
  async getAuditLogs() {
    return request<AuditLog[]>('/api/audit-logs');
  },

  // Load Test runner (500 users)
  async runLoadTest() {
    return request<LoadTestResult>('/api/load-test/run', {
      method: 'POST'
    });
  },

  // Admin users management
  async getAdminUsers() {
    return request<any[]>('/api/admin/users');
  },

  async createTeacher(data: { firstName: string; lastName?: string; phone: string; subject?: string; telegramChatId?: string }) {
    return request<{ success: boolean; teacher: any }>('/api/admin/teachers', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async toggleBlockUser(id: string, isBlocked: boolean) {
    return request<{ success: boolean; user: any }>(`/api/admin/users/${id}/block`, {
      method: 'PUT',
      body: JSON.stringify({ isBlocked })
    });
  },

  async deleteUser(id: string) {
    return request<{ success: boolean }>(`/api/admin/users/${id}`, {
      method: 'DELETE'
    });
  }
};
