export type UserRole = 'admin' | 'teacher' | 'student';

export interface User {
  id: string;
  phone: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isBlocked?: boolean;
  avatarUrl?: string;
  createdAt: string;
  subject?: string; // for teachers
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  teacherId: string;
  teacherName?: string;
  studentIds: string[];
  createdAt: string;
}

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect?: boolean; // Only present on server or in test editor, hidden in test taking!
}

export interface Question {
  id: string;
  testId?: string;
  bankId?: string;
  type: 'multiple_choice' | 'true_false';
  text: string;
  options: QuestionOption[];
  correctOptionId?: string; // Hidden during test taking!
  points: number;
  explanation?: string;
  subject?: string;
  topic?: string;
}

export interface TestSettings {
  id: string;
  title: string;
  description: string;
  teacherId: string;
  teacherName?: string;
  subject?: string;
  groupIds: string[];
  durationMinutes: number;
  maxAttempts: number;
  passingPercentage: number;
  startDate?: string;
  endDate?: string;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showCorrectAnswers: boolean;
  showExplanations: boolean;
  questionCount?: number;
  createdAt: string;
  isActive: boolean;
}

export interface Attempt {
  id: string;
  testId: string;
  studentId: string;
  studentName: string;
  studentPhone: string;
  groupId: string;
  groupName: string;
  startedAt: string;
  submittedAt?: string;
  serverEndTime: string;
  windowSwitches: number;
  answers: Record<string, string>; // questionId -> optionId
  isCompleted: boolean;
}

export interface TestResult {
  id: string;
  attemptId: string;
  testId: string;
  testTitle: string;
  studentId: string;
  studentName: string;
  studentPhone: string;
  groupId: string;
  groupName: string;
  score: number;
  maxScore: number;
  percentage: number;
  isPassed: boolean;
  timeSpentSeconds: number;
  windowSwitches: number;
  submittedAt: string;
  detailedAnswers?: Array<{
    questionId: string;
    questionText: string;
    selectedOptionId: string;
    selectedOptionText: string;
    correctOptionId?: string;
    correctOptionText?: string;
    isCorrect: boolean;
    explanation?: string;
  }>;
}

export interface QuestionStatistic {
  questionId: string;
  questionText: string;
  totalAttempts: number;
  correctCount: number;
  incorrectCount: number;
  accuracyPercentage: number;
}

export interface AuditLog {
  id: string;
  action: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  details: string;
  timestamp: string;
}

export interface TelegramConfig {
  botToken: string;
  defaultChatId: string;
  isEnabled: boolean;
  notifyOnSubmission: boolean;
}

export interface LoadTestResult {
  totalVirtualUsers: number;
  concurrentBatches: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  errorRate: number;
  durationMs: number;
  requestsPerSecond: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  serverLoadScore: string;
  memoryUsageMb: number;
  timestamp: string;
  logSummary: string[];
}
