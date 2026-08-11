import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout.jsx';
import { InlineLoader } from '../components/Spinner.jsx';
import { jobsApi } from '../lib/api.js';

const EMPLOYMENT_LABELS = {
  'full-time': 'Full-time',
  'part-time': 'Part-time',
  internship: 'Internship',
  contract: 'Contract',
};

// Server-side redirect landings — the client already hides the resume/GitHub
// actions until a role is picked, but the server enforces it too (e.g. a
// direct hit on the connect URL), and redirects back here with this code.
const ERROR_MESSAGES = {
  select_role_first: 'Select a job role before uploading a resume or connecting GitHub.',
};

/**
 * Job roles browser — step 1 of the student setup checklist. A student picks
 * the roles they're applying for before uploading a resume or connecting
 * GitHub; the resume and GitHub link are shared across every application.
 */
export default function BrowseJobs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState(() => {
    const code = searchParams.get('error');
    return code ? ERROR_MESSAGES[code] || '' : '';
  });

  useEffect(() => {
    if (!searchParams.get('error')) return;
    searchParams.delete('error');
    setSearchParams(searchParams, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refresh() {
    const { jobs: rows } = await jobsApi.listOpen();
    setJobs(rows);
  }

  useEffect(() => {
    (async () => {
      try {
        await refresh();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleApply(job) {
    setError('');
    setBusyId(job.id);
    try {
      await jobsApi.apply(job.id);
      await refresh();
    } catch (err) {
      setError(err.message || 'Could not apply to this role. Please try again.');
    } finally {
      setBusyId('');
    }
  }

  async function handleWithdraw(job) {
    if (!window.confirm(`Withdraw your application for "${job.title}"?`)) return;
    setError('');
    setBusyId(job.id);
    try {
      await jobsApi.withdraw(job.id);
      await refresh();
    } catch (err) {
      setError(err.message || 'Could not withdraw. Please try again.');
    } finally {
      setBusyId('');
    }
  }

  const appliedCount = jobs.filter((j) => j.applied).length;

  return (
    <DashboardLayout>
      <h1 className="page-title">Job Roles</h1>
      <p className="page-subtitle">
        Pick the roles you&rsquo;re applying for. Your resume and GitHub connection are
        shared across every application, so you only set them up once.
      </p>

      {error && (
        <div className="alert alert--error" style={{ marginBottom: 16 }}>{error}</div>
      )}

      {loading ? (
        <InlineLoader />
      ) : jobs.length === 0 ? (
        <div className="card" style={{ maxWidth: 480 }}>
          <p className="muted">
            No open roles have been posted yet. Check back once a recruiter publishes one.
          </p>
        </div>
      ) : (
        <>
          <div className="job-grid">
            {jobs.map((job) => {
              const closed = job.status === 'closed';
              const busy = busyId === job.id;
              return (
                <article
                  className={`job-card card ${job.applied ? 'is-applied' : ''}`}
                  key={job.id}
                >
                  <div className="job-card__header">
                    <h3 className="job-card__title">{job.title}</h3>
                    {job.applied && <span className="badge badge--verified">Applied</span>}
                  </div>

                  <div className="job-card__meta">
                    <span className="job-tag">
                      {EMPLOYMENT_LABELS[job.employmentType] || job.employmentType}
                    </span>
                    {job.location && <span className="job-tag">{job.location}</span>}
                    {closed && <span className="badge badge--neutral">Closed</span>}
                  </div>

                  <p className="job-card__desc">
                    {job.description || 'No description provided.'}
                  </p>

                  {job.requiredSkills.length > 0 && (
                    <div className="skill-chips skill-chips--inline job-card__skills">
                      {job.requiredSkills.map((skill) => (
                        <span className="skill-chip" key={skill}>{skill}</span>
                      ))}
                    </div>
                  )}

                  <div className="job-card__footer">
                    {job.applied ? (
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => handleWithdraw(job)}
                        disabled={busy}
                      >
                        {busy ? 'Working…' : 'Withdraw'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => handleApply(job)}
                        disabled={busy || closed}
                      >
                        {busy ? 'Applying…' : 'Apply for this role'}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {appliedCount > 0 && (
            <div className="card" style={{ marginTop: 20 }}>
              <h3 style={{ marginTop: 0 }}>Next step</h3>
              <p className="muted" style={{ marginTop: -8, marginBottom: 16 }}>
                You&rsquo;ve applied to {appliedCount} role{appliedCount === 1 ? '' : 's'}. Upload
                your resume and connect GitHub so recruiters have evidence to review.
              </p>
              <Link to="/student/resume" className="btn-primary job-card__cta">
                Upload Resume
              </Link>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
