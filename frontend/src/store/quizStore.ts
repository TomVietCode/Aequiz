import { create } from 'zustand';
import { Attempt, Question, AnswerResponse } from '../types';

interface QuizState {
  attempt: Attempt | null;
  questions: Question[];
  currentQuestionIndex: number;
  answers: Map<string, AnswerResponse>;
  startTime: number;
  setAttempt: (attempt: Attempt) => void;
  setQuestions: (questions: Question[]) => void;
  nextQuestion: () => void;
  previousQuestion: () => void; // Only for TOEIC mode
  goToQuestion: (index: number) => void; // For navigation
  setAnswer: (questionId: string, answer: AnswerResponse) => void;
  getAnswer: (questionId: string) => AnswerResponse | undefined;
  reset: () => void;
}

export const useQuizStore = create<QuizState>((set) => ({
  attempt: null,
  questions: [],
  currentQuestionIndex: 0,
  answers: new Map(),
  startTime: Date.now(),

  setAttempt: (attempt) => set({ attempt, startTime: Date.now() }),

  setQuestions: (questions) => set({ questions }),

  nextQuestion: () =>
    set((state) => ({
      currentQuestionIndex: Math.min(
        state.currentQuestionIndex + 1,
        state.questions.length - 1
      ),
    })),

  previousQuestion: () =>
    set((state) => ({
      currentQuestionIndex: Math.max(state.currentQuestionIndex - 1, 0),
    })),

  goToQuestion: (index) =>
    set({
      currentQuestionIndex: index,
    }),

  setAnswer: (questionId, answer) =>
    set((state) => {
      const newAnswers = new Map(state.answers);
      newAnswers.set(questionId, answer);
      return { answers: newAnswers };
    }),

  getAnswer: (questionId: string): AnswerResponse | undefined => {
    // Access state directly from set callback
    return undefined;
  },

  reset: () =>
    set({
      attempt: null,
      questions: [],
      currentQuestionIndex: 0,
      answers: new Map(),
      startTime: Date.now(),
    }),
}));
