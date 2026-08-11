import { supabase } from '../config/db.js';

/**
 * Job application data-access module — the student -> job_role join. Backed by
 * the Supabase `job_applications` table (see server/supabase/schema.sql).
 *
 * Rows are intentionally thin: the resume and GitHub link live once on
 * public.users and are shared across every application a student makes, so
 * there is nothing per-application to store beyond who applied to what, when.
 *
 * Queries here deliberately avoid PostgREST embedding (`select('*, job:job_roles(*)')`)
 * — nothing else in this codebase embeds, and a stale schema cache after the
 * tables are first created surfaces as a confusing PGRST200. Callers join the
 * two plain result sets in JS instead.
 */

/** Map a DB row (snake_case) to the public shape returned to the client. */
export function toPublicApplication(row) {
  return {
    id: row.id,
    jobId: row.job_id,
    studentId: row.student_id,
    appliedAt: row.applied_at,
  };
}

/** Record a student's application to a posting. */
export async function createApplication({ jobId, studentId }) {
  const { data, error } = await supabase
    .from('job_applications')
    .insert({ job_id: jobId, student_id: studentId })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

/** One application by (job, student); null when the student has not applied. */
export async function findApplication(jobId, studentId) {
  const { data, error } = await supabase
    .from('job_applications')
    .select('*')
    .eq('job_id', jobId)
    .eq('student_id', studentId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

/**
 * True if the student has applied to at least one posting — the check behind
 * gating resume upload / GitHub connect on having picked a role first.
 */
export async function hasAnyApplication(studentId) {
  const { count, error } = await supabase
    .from('job_applications')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', studentId);
  if (error) throw new Error(error.message);
  return (count || 0) > 0;
}

/** Every application a student has made, newest first. */
export async function listApplicationsByStudent(studentId) {
  const { data, error } = await supabase
    .from('job_applications')
    .select('*')
    .eq('student_id', studentId)
    .order('applied_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

/** Applications to any of the given postings. Callers must guard an empty `jobIds`. */
export async function listApplicationsByJobIds(jobIds) {
  const { data, error } = await supabase
    .from('job_applications')
    .select('*')
    .in('job_id', jobIds)
    .order('applied_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

/**
 * One student's applications restricted to a set of postings — the ownership
 * check behind a recruiter opening a candidate profile. Guard an empty `jobIds`.
 */
export async function listApplicationsForStudentInJobs(studentId, jobIds) {
  const { data, error } = await supabase
    .from('job_applications')
    .select('*')
    .eq('student_id', studentId)
    .in('job_id', jobIds)
    .order('applied_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

/** Withdraw an application. */
export async function deleteApplication(jobId, studentId) {
  const { error } = await supabase
    .from('job_applications')
    .delete()
    .eq('job_id', jobId)
    .eq('student_id', studentId);
  if (error) throw new Error(error.message);
}
