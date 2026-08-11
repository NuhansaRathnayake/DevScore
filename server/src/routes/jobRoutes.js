import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  listJobs,
  listMyJobs,
  listMyApplications,
  createJobPosting,
  updateJobPosting,
  updateJobStatus,
  deleteJobPosting,
  applyToJob,
  withdrawApplication,
} from '../controllers/jobController.js';

const router = Router();

// Students and recruiters share this router, so the role gate goes per route
// rather than on router.use().
//
// Static segments are registered before any ':id' route. If a GET /:id is ever
// added it MUST go last, or '/mine' resolves as id === 'mine' and hits the
// wrong role gate.
router.get('/mine', requireAuth, requireRole('recruiter'), listMyJobs);
router.get('/applied', requireAuth, requireRole('student'), listMyApplications);
router.get('/', requireAuth, requireRole('student'), listJobs);

router.post('/', requireAuth, requireRole('recruiter'), createJobPosting);
router.post('/:id/status', requireAuth, requireRole('recruiter'), updateJobStatus);
router.post('/:id/apply', requireAuth, requireRole('student'), applyToJob);
router.post('/:id', requireAuth, requireRole('recruiter'), updateJobPosting);

router.delete('/:id/apply', requireAuth, requireRole('student'), withdrawApplication);
router.delete('/:id', requireAuth, requireRole('recruiter'), deleteJobPosting);

export default router;
