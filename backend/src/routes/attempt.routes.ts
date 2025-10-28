import { Router } from 'express';
import { AttemptController } from '../controllers/attempt.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
const attemptController = new AttemptController();

// All routes require authentication
router.use(authenticate);

router.post('/', attemptController.create);
router.get('/user/:userId', attemptController.getUserAttempts);
router.get('/:id', attemptController.getById);
router.post('/:id/answer', attemptController.submitAnswer);
router.post('/:id/complete', attemptController.completeAttempt);

export { router as attemptRoutes };
