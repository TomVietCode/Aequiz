import { Router } from 'express';
import { SubjectController } from '../controllers/subject.controller';
import { authenticate, authorizeAdmin } from '../middleware/auth';

const router = Router();
const subjectController = new SubjectController();

// Public routes
router.get('/', subjectController.getAll.bind(subjectController));
router.get('/:id', subjectController.getById.bind(subjectController));

// Admin routes
router.post('/', authenticate, authorizeAdmin, subjectController.create.bind(subjectController));
router.post('/predefined', authenticate, authorizeAdmin, subjectController.createPredefined.bind(subjectController));
router.put('/:id', authenticate, authorizeAdmin, subjectController.update.bind(subjectController));
router.delete('/:id', authenticate, authorizeAdmin, subjectController.delete.bind(subjectController));

export default router;
