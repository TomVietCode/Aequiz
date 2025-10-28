import api from './api';
import { Question } from '../types';

export const questionService = {
  async getById(id: string): Promise<Question> {
    const response = await api.get(`/questions/${id}`);
    return response.data.data.question;
  },

  async getBySetId(questionSetId: string): Promise<Question[]> {
    const response = await api.get(`/questions/set/${questionSetId}`);
    return response.data.data.questions;
  },

  async create(data: Partial<Question>): Promise<Question> {
    const response = await api.post('/questions', data);
    return response.data.data.question;
  },

  async update(id: string, data: Partial<Question>): Promise<Question> {
    const response = await api.put(`/questions/${id}`, data);
    return response.data.data.question;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/questions/${id}`);
  },
};
