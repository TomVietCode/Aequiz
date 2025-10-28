import api from './api';
import { QuestionSet, Question } from '../types';

export const questionSetService = {
  async getAll(mode?: 'TOEIC' | 'SCHOOL'): Promise<QuestionSet[]> {
    const response = await api.get('/question-sets', {
      params: mode ? { mode } : {},
    });
    return response.data.data.questionSets;
  },

  async getAllAdmin(): Promise<QuestionSet[]> {
    // Admin endpoint returns all question sets including unpublished ones
    const response = await api.get('/question-sets', {
      params: { includeUnpublished: true },
    });
    return response.data.data.questionSets;
  },

  async getById(id: string): Promise<QuestionSet> {
    const response = await api.get(`/question-sets/${id}`);
    return response.data.data.questionSet;
  },

  async create(data: Partial<QuestionSet>): Promise<QuestionSet> {
    const response = await api.post('/question-sets', data);
    return response.data.data.questionSet;
  },

  async update(id: string, data: Partial<QuestionSet>): Promise<QuestionSet> {
    const response = await api.put(`/question-sets/${id}`, data);
    return response.data.data.questionSet;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/question-sets/${id}`);
  },

  async importQuestions(id: string, file: File): Promise<Question[]> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/question-sets/${id}/import`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data.questions;
  },
};
