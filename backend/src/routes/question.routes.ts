import { Router } from 'express';
import { QuestionController } from '../controllers/question.controller';
import { authenticate, authorizeAdmin } from '../middleware/auth';

const router = Router();
const questionController = new QuestionController();

// Protected routes (Admin only)
router.post('/', authenticate, authorizeAdmin, questionController.create);
router.put('/:id', authenticate, authorizeAdmin, questionController.update);
router.delete('/:id', authenticate, authorizeAdmin, questionController.delete);

// Public routes
router.get('/set/:questionSetId', questionController.getBySetId);
router.get('/:id', questionController.getById);

export { router as questionRoutes };
