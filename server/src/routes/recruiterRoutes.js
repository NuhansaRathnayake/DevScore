import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { listCandidates, getCandidate } from '../controllers/recruiterController.js';

const router = Router();

router.use(requireAuth, requireRole('recruiter'));

router.get('/candidates', listCandidates);
router.get('/candidates/:id', getCandidate);

export default router;
