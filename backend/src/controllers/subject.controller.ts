import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

export class SubjectController {
  // Get all subjects
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const subjects = await prisma.subject.findMany({
        include: {
          _count: {
            select: { questionSets: true },
          },
        },
        orderBy: { name: 'asc' },
      });

      res.json({
        status: 'success',
        data: { subjects },
      });
    } catch (error) {
      next(error);
    }
  }

  // Get subject by ID
  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const subject = await prisma.subject.findUnique({
        where: { id },
        include: {
          _count: {
            select: { questionSets: true },
          },
        },
      });

      if (!subject) {
        throw new AppError('Subject not found', 404);
      }

      res.json({
        status: 'success',
        data: { subject },
      });
    } catch (error) {
      next(error);
    }
  }

  // Create new subject (Admin only)
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { name, description, color } = req.body;

      // Check if subject already exists
      const existingSubject = await prisma.subject.findUnique({
        where: { name },
      });

      if (existingSubject) {
        throw new AppError('Subject with this name already exists', 400);
      }

      const subject = await prisma.subject.create({
        data: {
          name,
          description,
          color: color || '#3B82F6', // Default blue color
        },
      });

      res.status(201).json({
        status: 'success',
        data: { subject },
      });
    } catch (error) {
      next(error);
    }
  }

  // Update subject (Admin only)
  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { name, description, color } = req.body;

      // Check if subject exists
      const existingSubject = await prisma.subject.findUnique({
        where: { id },
      });

      if (!existingSubject) {
        throw new AppError('Subject not found', 404);
      }

      // If name is being changed, check if new name already exists
      if (name && name !== existingSubject.name) {
        const duplicateSubject = await prisma.subject.findUnique({
          where: { name },
        });

        if (duplicateSubject) {
          throw new AppError('Subject with this name already exists', 400);
        }
      }

      const subject = await prisma.subject.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(color && { color }),
        },
      });

      res.json({
        status: 'success',
        data: { subject },
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete subject (Admin only)
  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // Check if subject has any question sets
      const subject = await prisma.subject.findUnique({
        where: { id },
        include: {
          _count: {
            select: { questionSets: true },
          },
        },
      });

      if (!subject) {
        throw new AppError('Subject not found', 404);
      }

      if (subject._count.questionSets > 0) {
        throw new AppError(
          'Cannot delete subject with existing question sets. Please reassign or delete the question sets first.',
          400
        );
      }

      await prisma.subject.delete({
        where: { id },
      });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  // Create predefined subjects (Admin only - for initialization)
  async createPredefined(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const predefinedSubjects = [
        { name: 'Toán học', description: 'Các bài tập và đề thi môn Toán', color: '#EF4444' },
        { name: 'Vật lý', description: 'Các bài tập và đề thi môn Vật lý', color: '#3B82F6' },
        { name: 'Hóa học', description: 'Các bài tập và đề thi môn Hóa học', color: '#10B981' },
        { name: 'Sinh học', description: 'Các bài tập và đề thi môn Sinh học', color: '#8B5CF6' },
        { name: 'Tiếng Anh', description: 'Các bài tập và đề thi môn Tiếng Anh', color: '#F59E0B' },
        { name: 'Ngữ văn', description: 'Các bài tập và đề thi môn Ngữ văn', color: '#EC4899' },
        { name: 'Lịch sử', description: 'Các bài tập và đề thi môn Lịch sử', color: '#14B8A6' },
        { name: 'Địa lý', description: 'Các bài tập và đề thi môn Địa lý', color: '#06B6D4' },
        { name: 'Tin học', description: 'Các bài tập và đề thi môn Tin học', color: '#6366F1' },
        { name: 'GDCD', description: 'Giáo dục công dân', color: '#84CC16' },
      ];

      const createdSubjects = [];
      const skippedSubjects = [];

      for (const subjectData of predefinedSubjects) {
        const existing = await prisma.subject.findUnique({
          where: { name: subjectData.name },
        });

        if (!existing) {
          const subject = await prisma.subject.create({
            data: subjectData,
          });
          createdSubjects.push(subject);
        } else {
          skippedSubjects.push(subjectData.name);
        }
      }

      res.json({
        status: 'success',
        data: {
          message: `Created ${createdSubjects.length} subjects`,
          created: createdSubjects,
          skipped: skippedSubjects,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
