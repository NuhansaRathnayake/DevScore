import {
  ROLES,
  toPublicUser,
  findByEmail,
  createUser,
  listUsersByRole,
  countUsersByRole,
  findById,
  deleteUser,
  setPasswordHash,
} from '../models/User.js';
import { hashPassword, generateTempPassword, isPasswordValid } from '../utils/password.js';

/** Dashboard counters (FR 47 — admin user list overview). */
export async function getStats(req, res, next) {
  try {
    const [students, recruiters, admins] = await Promise.all([
      countUsersByRole(ROLES.STUDENT),
      countUsersByRole(ROLES.RECRUITER),
      countUsersByRole(ROLES.ADMIN),
    ]);
    res.json({ students, recruiters, admins });
  } catch (err) {
    next(err);
  }
}

/** List every recruiter account (FR 47). */
export async function listRecruiters(req, res, next) {
  try {
    const rows = await listUsersByRole(ROLES.RECRUITER);
    res.json({ recruiters: rows.map(toPublicUser) });
  } catch (err) {
    next(err);
  }
}

/**
 * Create a recruiter account (FR 48-50 — admin CRUD). Recruiters cannot
 * self-register (the public sign-up flow always creates students); this is
 * the only way a recruiter login comes into existence. A random one-time
 * password is generated and returned in the response — it is never stored
 * or shown again, so the admin must relay it to the recruiter now.
 */
export async function createRecruiter(req, res, next) {
  try {
    const email = (req.body?.email || '').trim().toLowerCase();
    const firstName = (req.body?.firstName || '').trim();
    const lastName = (req.body?.lastName || '').trim();

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'A valid email address is required' });
    }
    if (!firstName) {
      return res.status(400).json({ error: 'First name is required' });
    }

    const existing = await findByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const tempPassword = generateTempPassword();
    const passwordHash = await hashPassword(tempPassword);
    const user = await createUser({
      email,
      firstName,
      lastName,
      role: ROLES.RECRUITER,
      passwordHash,
    });

    res.status(201).json({ recruiter: toPublicUser(user), tempPassword });
  } catch (err) {
    next(err);
  }
}

/**
 * Set or reset a recruiter's password (FR 47-50 — admin CRUD). If the admin
 * supplies `password` in the body it's used as-is (validated against the
 * same 8-char minimum as self-service accounts); otherwise a random one-time
 * password is generated, exactly like account creation. Either way the
 * plaintext is returned once in the response and never stored or logged.
 */
export async function setRecruiterPassword(req, res, next) {
  try {
    const target = await findById(req.params.id);
    if (!target || target.role !== ROLES.RECRUITER) {
      return res.status(404).json({ error: 'Recruiter not found' });
    }

    const supplied = req.body?.password;
    if (supplied !== undefined && supplied !== '') {
      if (!isPasswordValid(supplied)) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
      }
    }
    const newPassword = supplied || generateTempPassword();

    const passwordHash = await hashPassword(newPassword);
    await setPasswordHash(target.id, passwordHash);

    res.json({ recruiter: toPublicUser(target), tempPassword: newPassword });
  } catch (err) {
    next(err);
  }
}

/** Remove a recruiter account (FR 47-50 — admin CRUD). Scoped to recruiters only. */
export async function deleteRecruiter(req, res, next) {
  try {
    const target = await findById(req.params.id);
    if (!target || target.role !== ROLES.RECRUITER) {
      return res.status(404).json({ error: 'Recruiter not found' });
    }
    await deleteUser(target.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
