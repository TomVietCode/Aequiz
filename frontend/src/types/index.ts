export type UserRole = 'ADMIN' | 'STUDENT';

export type QuizMode = 'TOEIC' | 'SCHOOL';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface Subject {
  id: string;
  name: string;
  description?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    questionSets: number;
  };
}

export interface QuestionSet {
  id: string;
  title: string;
  description?: string;
  mode: QuizMode;
  timeLimit?: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: string;
    name: string;
    email: string;
  };
  subjectId?: string;
  subject?: {
    id: string;
    name: string;
    color?: string;
  };
  _count?: {
    questions: number;
  };
  questions?: Question[]; // For full quiz data
  userProgress?: {
    score: number;
    correctAnswers: number;
    totalQuestions: number;
    completedAt?: string;
  } | null;
}

export interface Question {
  id: string;
  questionText: string;
  options: string[];
  correctAnswer: number | number[]; // Support single or multiple correct answers
  explanation?: string;
  passageText?: string;
  codeBlock?: string; // Code snippet for programming questions
  orderIndex: number;
  questionSetId: string;
  questionType?: 'single' | 'multiple'; // Single choice or multiple choice
  isRetry?: boolean; // Mark questions that are being retried in practice mode
}

export interface AttemptConfig {
  practiceMode: boolean;
  timedMode: boolean;
  customTimeLimit?: number;
  autoAdvance: boolean;
  autoAdvanceTime?: number;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  showAnswerMode?: 'immediate' | 'after-submit'; // For TOEIC and SCHOOL
}

export interface Attempt {
  id: string;
  score?: number;
  totalQuestions: number;
  correctAnswers: number;
  isCompleted: boolean;
  timeTaken?: number;
  startedAt: string;
  completedAt?: string;
  practiceMode: boolean;
  timedMode: boolean;
  customTimeLimit?: number;
  autoAdvance: boolean;
  autoAdvanceTime?: number;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  userId: string;
  questionSetId: string;
  questionSet?: QuestionSet;
  userAnswers?: UserAnswer[];
}

export interface UserAnswer {
  id: string;
  selectedOption: number | number[]; // Support multiple selections
  isCorrect: boolean;
  answeredAt: string;
  attemptId: string;
  questionId: string;
  question?: Question;
}

export interface AnswerResponse {
  userAnswer: UserAnswer;
  isCorrect: boolean;
  correctAnswer: number | number[]; // Support multiple correct answers
  explanation?: string;
}
