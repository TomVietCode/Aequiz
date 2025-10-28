import { Router } from 'express';
import { QuestionSetController } from '../controllers/questionSet.controller';
import { authenticate, authorizeAdmin, optionalAuth } from '../middleware/auth';
import multer from 'multer';

const router = Router();
const questionSetController = new QuestionSetController();
const upload = multer({ dest: 'uploads/' });

// Public routes (with optional auth to get user progress)
router.get('/', optionalAuth, questionSetController.getAll);
router.get('/:id', questionSetController.getById);

// Protected routes (Admin only)
router.post('/', authenticate, authorizeAdmin, questionSetController.create);
router.put('/:id', authenticate, authorizeAdmin, questionSetController.update);
router.delete('/:id', authenticate, authorizeAdmin, questionSetController.delete);
router.post('/:id/import', authenticate, authorizeAdmin, upload.single('file'), questionSetController.importQuestions);

export { router as questionSetRoutes };
