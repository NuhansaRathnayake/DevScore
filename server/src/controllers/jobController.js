import {
  EMPLOYMENT_TYPES,
  JOB_STATUSES,
  toPublicJob,
  createJob,
  findJobById,
  listJobsByRecruiter,
  listOpenJobs,
  listJobsByIds,
  updateJob,
  setJobStatus,
  deleteJob,
} from '../models/Job.js';
import {
  toPublicApplication,
  createApplication,
  findApplication,
  listApplicationsByStudent,
  listApplicationsByJobIds,
  deleteApplication,
} from '../models/JobApplication.js';

const MAX_TITLE = 120;
const MAX_DESCRIPTION = 4000;
const MAX_SKILLS = 30;

const EMPLOYMENT_VALUES = Object.values(EMPLOYMENT_TYPES);
const STATUS_VALUES = Object.values(JOB_STATUSES);

/**
 * Normalise the free-text skill list a recruiter typed into a clean array —
 * trimmed, blanks dropped, de-duped case-insensitively (first spelling wins),
 * capped. Stored as typed; see the note on Job.toPublicJob about matching.
 */
function normaliseSkills(input) {
  if (!Array.isArray(input)) return [];
  const seen = new Set();
  const skills = [];
  for (const raw of input) {
    const skill = String(raw).trim();
    const key = skill.toLowerCase();
    if (skill && !seen.has(key)) {
      seen.add(key);
      skills.push(skill);
    }
  }
  return skills.slice(0, MAX_SKILLS);
}

/**
 * Read + validate the posting fields shared by create and update. Returns
 * either { error } for the caller to surface as a 400, or { values }.
 */
function readJobInput(req) {
  const title = (req.body?.title || '').trim();
  const description = (req.body?.description || '').trim();
  const location = (req.body?.location || '').trim();
  const employmentType = (req.body?.employmentType || EMPLOYMENT_TYPES.FULL_TIME).trim();

  if (!title) {
    return { error: 'A job title is required' };
  }
  if (title.length > MAX_TITLE) {
    return { error: `Job title must be ${MAX_TITLE} characters or fewer` };
  }
  if (description.length > MAX_DESCRIPTION) {
    return { error: `Job description must be ${MAX_DESCRIPTION} characters or fewer` };
  }
  if (!EMPLOYMENT_VALUES.includes(employmentType)) {
    return { error: 'Choose a valid employment type' };
  }

  return {
    values: {
      title,
      description,
      location,
      employmentType,
      requiredSkills: normaliseSkills(req.body?.requiredSkills),
    },
  };
}

/**
 * Load a posting only if it belongs to the calling recruiter. A posting owned
 * by someone else reads as absent (404, not 403) so a recruiter cannot probe
 * which job ids exist — matching how recruiterController treats candidates.
 */
async function findOwnedJob(req) {
  const job = await findJobById(req.params.id);
  if (!job || job.recruiter_id !== req.user.id) return null;
  return job;
}

/** Narrow a posting to what a student may see — no recruiter id, no updatedAt. */
function toStudentJob(row, applied) {
  const job = toPublicJob(row);
  return {
    id: job.id,
    title: job.title,
    description: job.description,
    requiredSkills: job.requiredSkills,
    employmentType: job.employmentType,
    location: job.location,
    status: job.status,
    postedAt: job.createdAt,
    applied,
  };
}

/**
 * Roles a student can browse: everything open, plus any closed posting they
 * already applied to. Without that second set a role closing would silently
 * drop off their dashboard while their application still counted.
 */
export async function listJobs(req, res, next) {
  try {
    const applications = await listApplicationsByStudent(req.user.id);
    const appliedIds = new Set(applications.map((a) => a.job_id));

    const open = await listOpenJobs();
    const openIds = new Set(open.map((j) => j.id));
    const missing = [...appliedIds].filter((id) => !openIds.has(id));
    const closedApplied = missing.length ? await listJobsByIds(missing) : [];

    const jobs = [...open, ...closedApplied].map((job) =>
      toStudentJob(job, appliedIds.has(job.id)),
    );

    res.json({
      jobs,
      stats: { open: open.length, applied: appliedIds.size },
    });
  } catch (err) {
    next(err);
  }
}

/** The calling recruiter's own postings, each with its applicant count. */
export async function listMyJobs(req, res, next) {
  try {
    const rows = await listJobsByRecruiter(req.user.id);
    const jobIds = rows.map((j) => j.id);
    const applications = jobIds.length ? await listApplicationsByJobIds(jobIds) : [];

    const jobs = rows.map((row) => ({
      ...toPublicJob(row),
      applicantCount: applications.filter((a) => a.job_id === row.id).length,
    }));

    res.json({
      jobs,
      stats: {
        total: jobs.length,
        open: jobs.filter((j) => j.status === JOB_STATUSES.OPEN).length,
        applicants: applications.length,
      },
    });
  } catch (err) {
    next(err);
  }
}

/** The calling student's applications, each with the posting embedded. */
export async function listMyApplications(req, res, next) {
  try {
    const applications = await listApplicationsByStudent(req.user.id);
    const jobIds = applications.map((a) => a.job_id);
    const jobs = jobIds.length ? await listJobsByIds(jobIds) : [];
    const jobById = new Map(jobs.map((j) => [j.id, j]));

    res.json({
      applications: applications
        .filter((a) => jobById.has(a.job_id))
        .map((a) => ({
          id: a.id,
          appliedAt: a.applied_at,
          job: toStudentJob(jobById.get(a.job_id), true),
        })),
    });
  } catch (err) {
    next(err);
  }
}

/** Post a new job role (recruiter-owned). */
export async function createJobPosting(req, res, next) {
  try {
    const { error, values } = readJobInput(req);
    if (error) return res.status(400).json({ error });

    const job = await createJob({ recruiterId: req.user.id, ...values });
    res.status(201).json({ job: toPublicJob(job) });
  } catch (err) {
    next(err);
  }
}

/** Edit one of the calling recruiter's postings. */
export async function updateJobPosting(req, res, next) {
  try {
    const owned = await findOwnedJob(req);
    if (!owned) return res.status(404).json({ error: 'Job not found' });

    const { error, values } = readJobInput(req);
    if (error) return res.status(400).json({ error });

    const job = await updateJob(owned.id, values);
    res.json({ job: toPublicJob(job) });
  } catch (err) {
    next(err);
  }
}

/** Open or close one of the calling recruiter's postings. */
export async function updateJobStatus(req, res, next) {
  try {
    const owned = await findOwnedJob(req);
    if (!owned) return res.status(404).json({ error: 'Job not found' });

    const status = (req.body?.status || '').trim();
    if (!STATUS_VALUES.includes(status)) {
      return res.status(400).json({ error: 'Job status must be open or closed' });
    }

    const job = await setJobStatus(owned.id, status);
    res.json({ job: toPublicJob(job) });
  } catch (err) {
    next(err);
  }
}

/** Delete one of the calling recruiter's postings, and with it its applications. */
export async function deleteJobPosting(req, res, next) {
  try {
    const owned = await findOwnedJob(req);
    if (!owned) return res.status(404).json({ error: 'Job not found' });

    await deleteJob(owned.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

/** Apply to an open posting. */
export async function applyToJob(req, res, next) {
  try {
    const job = await findJobById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (job.status !== JOB_STATUSES.OPEN) {
      return res.status(400).json({ error: 'This role is no longer accepting applications' });
    }

    const existing = await findApplication(job.id, req.user.id);
    if (existing) {
      return res.status(409).json({ error: 'You have already applied to this role' });
    }

    const application = await createApplication({ jobId: job.id, studentId: req.user.id });
    res.status(201).json({ application: toPublicApplication(application) });
  } catch (err) {
    next(err);
  }
}

/** Withdraw from a posting. Allowed even once the role is closed. */
export async function withdrawApplication(req, res, next) {
  try {
    const existing = await findApplication(req.params.id, req.user.id);
    if (!existing) return res.status(404).json({ error: 'Application not found' });

    await deleteApplication(req.params.id, req.user.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
