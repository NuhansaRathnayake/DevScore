import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  getStats,
  listRecruiters,
  createRecruiter,
  setRecruiterPassword,
  deleteRecruiter,
} from '../controllers/adminController.js';

const router = Router();

router.use(requireAuth, requireRole('admin'));

router.get('/stats', getStats);
router.get('/recruiters', listRecruiters);
router.post('/recruiters', createRecruiter);
router.post('/recruiters/:id/password', setRecruiterPassword);
router.delete('/recruiters/:id', deleteRecruiter);

export default router;
