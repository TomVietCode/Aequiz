import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

export class QuestionController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const {
        questionText,
        options,
        correctAnswer,
        questionType,
        codeBlock,
        explanation,
        passageText,
        questionSetId,
      } = req.body;

      // Get current max order index for this question set
      const lastQuestion = await prisma.question.findFirst({
        where: { questionSetId },
        orderBy: { orderIndex: 'desc' },
      });

      const orderIndex = lastQuestion ? lastQuestion.orderIndex + 1 : 0;

      const question = await prisma.question.create({
        data: {
          questionText,
          options: JSON.stringify(options),
          correctAnswer: JSON.stringify(correctAnswer), // Store as JSON string
          questionType: questionType || 'single',
          codeBlock,
          explanation,
          passageText,
          orderIndex,
          questionSetId,
        },
      });

      res.status(201).json({
        status: 'success',
        data: { question },
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const {
        questionText,
        options,
        correctAnswer,
        questionType,
        codeBlock,
        explanation,
        passageText,
        orderIndex,
      } = req.body;

      const question = await prisma.question.update({
        where: { id },
        data: {
          questionText,
          options: options ? JSON.stringify(options) : undefined,
          correctAnswer: correctAnswer !== undefined ? JSON.stringify(correctAnswer) : undefined,
          questionType,
          codeBlock,
          explanation,
          passageText,
          orderIndex,
        },
      });

      res.json({
        status: 'success',
        data: { question },
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      await prisma.question.delete({
        where: { id },
      });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async getBySetId(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { questionSetId } = req.params;

      const questions = await prisma.question.findMany({
        where: { questionSetId },
        orderBy: { orderIndex: 'asc' },
      });

      // Parse JSON strings back to objects
      const parsedQuestions = questions.map(q => ({
        ...q,
        options: JSON.parse(q.options),
        correctAnswer: JSON.parse(q.correctAnswer), // Parse back to number or array
      }));

      res.json({
        status: 'success',
        data: { questions: parsedQuestions },
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const question = await prisma.question.findUnique({
        where: { id },
      });

      if (!question) {
        throw new AppError('Question not found', 404);
      }

      // Parse JSON strings back to objects
      const parsedQuestion = {
        ...question,
        options: JSON.parse(question.options),
        correctAnswer: JSON.parse(question.correctAnswer), // Parse back to number or array
      };

      res.json({
        status: 'success',
        data: { question: parsedQuestion },
      });
    } catch (error) {
      next(error);
    }
  }
}
