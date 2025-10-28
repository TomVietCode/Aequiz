import api from './api';
import { Attempt, AttemptConfig, AnswerResponse } from '../types';

export const attemptService = {
  async create(
    questionSetId: string,
    config: AttemptConfig
  ): Promise<Attempt> {
    const response = await api.post('/attempts', {
      questionSetId,
      ...config,
    });
    return response.data.data.attempt;
  },

  async getById(id: string): Promise<Attempt> {
    const response = await api.get(`/attempts/${id}`);
    return response.data.data.attempt;
  },

  async getUserAttempts(userId: string): Promise<Attempt[]> {
    const response = await api.get(`/attempts/user/${userId}`);
    return response.data.data.attempts;
  },

  async submitAnswer(
    attemptId: string,
    questionId: string,
    selectedOption: number | number[]
  ): Promise<AnswerResponse> {
    const response = await api.post(`/attempts/${attemptId}/answer`, {
      questionId,
      selectedOption,
    });
    return response.data.data;
  },

  async complete(attemptId: string, timeTaken: number): Promise<Attempt> {
    const response = await api.post(`/attempts/${attemptId}/complete`, {
      timeTaken,
    });
    return response.data.data.attempt;
  },
};
