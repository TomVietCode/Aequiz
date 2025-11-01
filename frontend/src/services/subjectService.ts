import api from './api';

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

export interface SubjectCreateInput {
  name: string;
  description?: string;
  color?: string;
}

export interface SubjectUpdateInput {
  name?: string;
  description?: string;
  color?: string;
}

class SubjectService {
  async getAll(): Promise<Subject[]> {
    const response = await api.get('/subjects');
    return response.data.data.subjects;
  }

  async getById(id: string): Promise<Subject> {
    const response = await api.get(`/subjects/${id}`);
    return response.data.data.subject;
  }

  async create(data: SubjectCreateInput): Promise<Subject> {
    const response = await api.post('/subjects', data);
    return response.data.data.subject;
  }

  async update(id: string, data: SubjectUpdateInput): Promise<Subject> {
    const response = await api.put(`/subjects/${id}`, data);
    return response.data.data.subject;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/subjects/${id}`);
  }

  async createPredefined(): Promise<{ created: Subject[]; skipped: string[] }> {
    const response = await api.post('/subjects/predefined');
    return response.data.data;
  }
}

export const subjectService = new SubjectService();
