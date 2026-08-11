import { supabase } from '../config/db.js';

/**
 * Job role data-access module — recruiter-authored postings that students
 * apply to. Backed by the Supabase `job_roles` table (see
 * server/supabase/schema.sql).
 */

/** Employment types a posting can carry (mirrors the job_roles check constraint). */
export const EMPLOYMENT_TYPES = Object.freeze({
  FULL_TIME: 'full-time',
  PART_TIME: 'part-time',
  INTERNSHIP: 'internship',
  CONTRACT: 'contract',
});

/** Lifecycle of a posting — a closed role stops accepting new applications. */
export const JOB_STATUSES = Object.freeze({
  OPEN: 'open',
  CLOSED: 'closed',
});

/**
 * Map a DB row (snake_case) to the public shape returned to the client.
 * `requiredSkills` is stored as the recruiter typed it (trimmed, de-duped
 * case-insensitively) — it is NOT normalised against the CV parser's canonical
 * vocabulary, so any future claimed-vs-required comparison must case-fold both
 * sides rather than matching these strings literally.
 */
export function toPublicJob(row) {
  return {
    id: row.id,
    recruiterId: row.recruiter_id,
    title: row.title,
    description: row.description || '',
    requiredSkills: row.required_skills || [],
    employmentType: row.employment_type,
    location: row.location || '',
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** True if the posting is still accepting applications. */
export function isJobOpen(row) {
  return row.status === JOB_STATUSES.OPEN;
}

/** Create a posting owned by a recruiter. */
export async function createJob({
  recruiterId,
  title,
  description = '',
  requiredSkills = [],
  employmentType = EMPLOYMENT_TYPES.FULL_TIME,
  location = '',
}) {
  const { data, error } = await supabase
    .from('job_roles')
    .insert({
      recruiter_id: recruiterId,
      title,
      description,
      required_skills: requiredSkills,
      employment_type: employmentType,
      location,
      status: JOB_STATUSES.OPEN,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

/** Look up one posting; null when it does not exist. */
export async function findJobById(id) {
  const { data, error } = await supabase
    .from('job_roles')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

/** Every posting a recruiter owns, newest first. */
export async function listJobsByRecruiter(recruiterId) {
  const { data, error } = await supabase
    .from('job_roles')
    .select('*')
    .eq('recruiter_id', recruiterId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

/** Every posting currently accepting applications, newest first. */
export async function listOpenJobs() {
  const { data, error } = await supabase
    .from('job_roles')
    .select('*')
    .eq('status', JOB_STATUSES.OPEN)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

/** Fetch several postings by id. Callers must guard against an empty `ids`. */
export async function listJobsByIds(ids) {
  const { data, error } = await supabase
    .from('job_roles')
    .select('*')
    .in('id', ids)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

/** Update a posting's editable fields. */
export async function updateJob(id, {
  title,
  description,
  requiredSkills,
  employmentType,
  location,
}) {
  const { data, error } = await supabase
    .from('job_roles')
    .update({
      title,
      description,
      required_skills: requiredSkills,
      employment_type: employmentType,
      location,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

/** Open or close a posting. Closing keeps existing applications intact. */
export async function setJobStatus(id, status) {
  const { data, error } = await supabase
    .from('job_roles')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

/** Delete a posting outright. Cascades to its job_applications rows. */
export async function deleteJob(id) {
  const { error } = await supabase.from('job_roles').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
