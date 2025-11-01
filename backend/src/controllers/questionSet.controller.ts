import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import fs from 'fs/promises';

interface ImportedQuestion {
  questionText: string;
  options: string[];
  correctAnswer: number | number[]; // Support both single and multiple choice
  questionType?: 'single' | 'multiple';
  codeBlock?: string;
  explanation?: string;
  passageText?: string;
}

export class QuestionSetController {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { mode, includeUnpublished, subjectId } = req.query;
      
      // Only admins can see unpublished question sets
      const showUnpublished = includeUnpublished === 'true' && req.userRole === 'ADMIN';
      
      const questionSets = await prisma.questionSet.findMany({
        where: {
          ...(showUnpublished ? {} : { isPublished: true }),
          ...(mode && { mode: mode as any }),
          ...(subjectId && { subjectId: subjectId as string }),
        },
        include: {
          _count: {
            select: { questions: true },
          },
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          subject: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // If user is authenticated, include their progress
      if (req.userId) {
        const attempts = await prisma.attempt.findMany({
          where: {
            userId: req.userId,
            isCompleted: true,
          },
          select: {
            questionSetId: true,
            score: true,
            correctAnswers: true,
            totalQuestions: true,
            completedAt: true,
          },
          orderBy: {
            completedAt: 'desc',
          },
        });

        // Group by questionSetId and keep only the latest attempt for each
        const attemptsMap = new Map();
        attempts.forEach(attempt => {
          if (!attemptsMap.has(attempt.questionSetId)) {
            attemptsMap.set(attempt.questionSetId, {
              score: attempt.score,
              correctAnswers: attempt.correctAnswers,
              totalQuestions: attempt.totalQuestions,
              completedAt: attempt.completedAt,
            });
          }
        });

        const questionSetsWithProgress = questionSets.map(set => ({
          ...set,
          userProgress: attemptsMap.has(set.id) ? {
            ...attemptsMap.get(set.id),
            // Override totalQuestions with actual question count from questionSet
            totalQuestions: set._count.questions,
          } : null,
        }));

        return res.json({
          status: 'success',
          data: { questionSets: questionSetsWithProgress },
        });
      }

      res.json({
        status: 'success',
        data: { questionSets },
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const questionSet = await prisma.questionSet.findUnique({
        where: { id },
        include: {
          questions: {
            orderBy: { orderIndex: 'asc' },
          },
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!questionSet) {
        throw new AppError('Question set not found', 404);
      }

      // Parse JSON strings in questions
      const parsedQuestionSet = {
        ...questionSet,
        questions: questionSet.questions.map(q => ({
          ...q,
          options: JSON.parse(q.options),
          correctAnswer: JSON.parse(q.correctAnswer), // Parse back to number or array
        })),
      };

      res.json({
        status: 'success',
        data: { questionSet: parsedQuestionSet },
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { title, description, mode, timeLimit, isPublished, subjectId } = req.body;
      const userId = req.userId!;

      const questionSet = await prisma.questionSet.create({
        data: {
          title,
          description,
          mode,
          timeLimit,
          isPublished: isPublished || false,
          creatorId: userId,
          ...(subjectId && { subjectId }),
        },
        include: {
          _count: {
            select: { questions: true },
          },
          subject: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
        },
      });

      res.status(201).json({
        status: 'success',
        data: { questionSet },
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { title, description, timeLimit, isPublished, subjectId } = req.body;

      const questionSet = await prisma.questionSet.update({
        where: { id },
        data: {
          title,
          description,
          timeLimit,
          isPublished,
          ...(subjectId !== undefined && { subjectId }),
        },
        include: {
          subject: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
        },
      });

      res.json({
        status: 'success',
        data: { questionSet },
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      await prisma.questionSet.delete({
        where: { id },
      });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async importQuestions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const file = req.file;

      if (!file) {
        throw new AppError('No file uploaded', 400);
      }

      // Read and parse JSON file
      const fileContent = await fs.readFile(file.path, 'utf-8');
      const questions: ImportedQuestion[] = JSON.parse(fileContent);

      // Validate questions structure
      if (!Array.isArray(questions)) {
        throw new AppError('Invalid file format: expected an array of questions', 400);
      }

      // Get current max order index
      const lastQuestion = await prisma.question.findFirst({
        where: { questionSetId: id },
        orderBy: { orderIndex: 'desc' },
      });

      let startIndex = lastQuestion ? lastQuestion.orderIndex + 1 : 0;

      // Create questions
      const createdQuestions = await Promise.all(
        questions.map((q, index) =>
          prisma.question.create({
            data: {
              questionText: q.questionText,
              options: JSON.stringify(q.options),
              correctAnswer: JSON.stringify(q.correctAnswer), // Store as JSON string
              questionType: q.questionType || 'single',
              codeBlock: q.codeBlock,
              explanation: q.explanation,
              passageText: q.passageText,
              orderIndex: startIndex + index,
              questionSetId: id,
            },
          })
        )
      );

      // Delete uploaded file
      await fs.unlink(file.path);

      // Parse JSON strings in created questions before returning
      const parsedQuestions = createdQuestions.map(q => ({
        ...q,
        options: JSON.parse(q.options),
      }));

      res.json({
        status: 'success',
        data: { 
          message: `${createdQuestions.length} questions imported successfully`,
          questions: parsedQuestions 
        },
      });
    } catch (error) {
      // Clean up file on error
      if (req.file) {
        await fs.unlink(req.file.path).catch(() => {});
      }
      next(error);
    }
  }
}
