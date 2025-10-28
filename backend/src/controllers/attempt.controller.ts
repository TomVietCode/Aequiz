import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

export class AttemptController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const {
        questionSetId,
        practiceMode,
        timedMode,
        customTimeLimit,
        autoAdvance,
        autoAdvanceTime,
      } = req.body;

      // Get question set and count questions
      const questionSet = await prisma.questionSet.findUnique({
        where: { id: questionSetId },
        include: {
          _count: {
            select: { questions: true },
          },
        },
      });

      if (!questionSet) {
        throw new AppError('Question set not found', 404);
      }

      // If practice mode, get incorrect questions from previous attempt
      let questionsToInclude = questionSet._count.questions;
      let incorrectQuestionIds: Set<string> = new Set();
      
      if (practiceMode) {
        const lastAttempt = await prisma.attempt.findFirst({
          where: {
            userId,
            questionSetId,
            isCompleted: true,
          },
          orderBy: { completedAt: 'desc' },
          include: {
            userAnswers: {
              orderBy: {
                answeredAt: 'desc', // Get most recent answers first
              },
            },
          },
        });

        if (lastAttempt && lastAttempt.userAnswers.length > 0) {
          // Get the last answer for each question (most recent attempt per question)
          const lastAnswerPerQuestion = new Map<string, boolean>();
          
          for (const ua of lastAttempt.userAnswers) {
            // Only store the first occurrence (most recent due to desc order)
            if (!lastAnswerPerQuestion.has(ua.questionId)) {
              lastAnswerPerQuestion.set(ua.questionId, ua.isCorrect);
            }
          }
          
          // Get IDs of incorrectly answered questions
          for (const [questionId, isCorrect] of lastAnswerPerQuestion.entries()) {
            if (!isCorrect) {
              incorrectQuestionIds.add(questionId);
            }
          }
          
          questionsToInclude = incorrectQuestionIds.size;
          
          // If all questions were answered correctly, practice all questions again
          if (questionsToInclude === 0) {
            questionsToInclude = questionSet._count.questions;
            incorrectQuestionIds.clear(); // Clear the set so no questions are marked as retry
          }
        }
        // If no previous attempt exists, practice all questions
      }

      const attempt = await prisma.attempt.create({
        data: {
          userId,
          questionSetId,
          totalQuestions: questionsToInclude,
          practiceMode: practiceMode || false,
          timedMode: timedMode || false,
          customTimeLimit,
          autoAdvance: autoAdvance || false,
          autoAdvanceTime,
        },
        include: {
          questionSet: {
            include: {
              questions: {
                orderBy: { orderIndex: 'asc' },
              },
            },
          },
        },
      });

      // Parse JSON strings in questions and mark retry questions
      if (attempt.questionSet) {
        attempt.questionSet.questions = attempt.questionSet.questions.map(q => ({
          ...q,
          options: JSON.parse(q.options),
          correctAnswer: JSON.parse(q.correctAnswer), // Parse back to number or array
          isRetry: practiceMode && incorrectQuestionIds.has(q.id), // Mark as retry if it was incorrect
        }));
      }

      res.status(201).json({
        status: 'success',
        data: { attempt },
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      const attempt = await prisma.attempt.findFirst({
        where: {
          id,
          userId,
        },
        include: {
          questionSet: {
            include: {
              questions: {
                orderBy: { orderIndex: 'asc' },
              },
            },
          },
          userAnswers: {
            include: {
              question: true,
            },
          },
        },
      });

      if (!attempt) {
        throw new AppError('Attempt not found', 404);
      }

      // Parse JSON strings in questions
      if (attempt.questionSet) {
        attempt.questionSet.questions = attempt.questionSet.questions.map(q => ({
          ...q,
          options: JSON.parse(q.options),
          correctAnswer: JSON.parse(q.correctAnswer), // Parse back to number or array
        }));
      }

      // Parse JSON strings in userAnswers
      if (attempt.userAnswers) {
        attempt.userAnswers = attempt.userAnswers.map(ua => ({
          ...ua,
          selectedOption: JSON.parse(ua.selectedOption), // Parse back to number or array
        }));
      }

      res.json({
        status: 'success',
        data: { attempt },
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserAttempts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const requestingUserId = req.userId!;

      // Users can only view their own attempts
      if (userId !== requestingUserId) {
        throw new AppError('Unauthorized', 403);
      }

      const attempts = await prisma.attempt.findMany({
        where: { userId },
        include: {
          questionSet: {
            select: {
              id: true,
              title: true,
              mode: true,
            },
          },
        },
        orderBy: { startedAt: 'desc' },
      });

      res.json({
        status: 'success',
        data: { attempts },
      });
    } catch (error) {
      next(error);
    }
  }

  async submitAnswer(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { questionId, selectedOption } = req.body;
      const userId = req.userId!;

      // Verify attempt belongs to user
      const attempt = await prisma.attempt.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!attempt) {
        throw new AppError('Attempt not found', 404);
      }

      if (attempt.isCompleted) {
        throw new AppError('Attempt already completed', 400);
      }

      // Get question to check correct answer
      const question = await prisma.question.findUnique({
        where: { id: questionId },
      });

      if (!question) {
        throw new AppError('Question not found', 404);
      }

      // Parse correct answer from JSON string
      const correctAnswer = JSON.parse(question.correctAnswer);
      
      // Check if answer is correct (handle both single and multiple choice)
      let isCorrect: boolean;
      if (Array.isArray(correctAnswer)) {
        // Multiple choice: compare arrays (order doesn't matter)
        const selectedArray = Array.isArray(selectedOption) ? selectedOption : [selectedOption];
        isCorrect = 
          correctAnswer.length === selectedArray.length &&
          correctAnswer.every((val: number) => selectedArray.includes(val));
      } else {
        // Single choice: direct comparison
        isCorrect = correctAnswer === selectedOption;
      }

      // Check if this question was already answered correctly before
      const previousCorrectAnswer = await prisma.userAnswer.findFirst({
        where: {
          attemptId: id,
          questionId,
          isCorrect: true,
        },
      });

      // Create user answer
      const userAnswer = await prisma.userAnswer.create({
        data: {
          attemptId: id,
          questionId,
          selectedOption: JSON.stringify(selectedOption), // Store as JSON string
          isCorrect,
        },
      });

      // Update attempt correct answers count (only if first time answering correctly)
      if (isCorrect && !previousCorrectAnswer) {
        await prisma.attempt.update({
          where: { id },
          data: {
            correctAnswers: {
              increment: 1,
            },
          },
        });
      }

      res.json({
        status: 'success',
        data: {
          userAnswer,
          isCorrect,
          correctAnswer, // Already parsed
          explanation: question.explanation,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async completeAttempt(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { timeTaken } = req.body;
      const userId = req.userId!;

      // Verify attempt belongs to user
      const attempt = await prisma.attempt.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!attempt) {
        throw new AppError('Attempt not found', 404);
      }

      if (attempt.isCompleted) {
        throw new AppError('Attempt already completed', 400);
      }

      // Calculate score (cap at 100%)
      const score = Math.min(
        100,
        Math.round((attempt.correctAnswers / attempt.totalQuestions) * 100)
      );

      // Update attempt
      const updatedAttempt = await prisma.attempt.update({
        where: { id },
        data: {
          isCompleted: true,
          completedAt: new Date(),
          score,
          timeTaken,
        },
        include: {
          questionSet: {
            select: {
              id: true,
              title: true,
              mode: true,
            },
          },
          userAnswers: {
            include: {
              question: true,
            },
          },
        },
      });

      res.json({
        status: 'success',
        data: { attempt: updatedAttempt },
      });
    } catch (error) {
      next(error);
    }
  }
}
