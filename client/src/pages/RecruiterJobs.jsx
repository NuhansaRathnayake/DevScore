import { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout.jsx';
import StatCard from '../components/StatCard.jsx';
import { InlineLoader } from '../components/Spinner.jsx';
import { jobsApi } from '../lib/api.js';
import {
  BriefcaseIcon,
  CheckBadgeIcon,
  CandidatesIcon,
} from '../components/DashboardIcons.jsx';

const EMPTY_JOB_FORM = {
  title: '',
  description: '',
  requiredSkills: '',
  employmentType: 'full-time',
  location: '',
};

const EMPLOYMENT_OPTIONS = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'internship', label: 'Internship' },
  { value: 'contract', label: 'Contract' },
];

const EMPLOYMENT_LABELS = Object.fromEntries(
  EMPLOYMENT_OPTIONS.map((o) => [o.value, o.label]),
);

/** The form edits skills as one comma-separated line; the API takes an array. */
function parseSkills(value) {
  return value.split(',').map((s) => s.trim()).filter(Boolean);
}

/**
 * Recruiter job postings manager. Candidates apply to a specific role, so this
 * is where a recruiter's candidate list comes from — with no postings, their
 * dashboard has nothing to show.
 */
export default function RecruiterJobs() {
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // modal: null | { type: 'create' } | { type: 'edit', job }
  const [modal, setModal] = useState(null);
  const [jobForm, setJobForm] = useState(EMPTY_JOB_FORM);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function refresh() {
    const { jobs: rows, stats: s } = await jobsApi.listMine();
    setJobs(rows);
    setStats(s);
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

  function updateJobField(field) {
    return (e) => setJobForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function openCreate() {
    setJobForm(EMPTY_JOB_FORM);
    setModal({ type: 'create' });
  }

  function openEdit(job) {
    setJobForm({
      title: job.title,
      description: job.description,
      requiredSkills: job.requiredSkills.join(', '),
      employmentType: job.employmentType,
      location: job.location,
    });
    setModal({ type: 'edit', job });
  }

  function closeModal() {
    setModal(null);
    setJobForm(EMPTY_JOB_FORM);
    setFormError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');

    if (!jobForm.title.trim()) {
      return setFormError('A job title is required.');
    }

    setSubmitting(true);
    try {
      const payload = { ...jobForm, requiredSkills: parseSkills(jobForm.requiredSkills) };
      if (modal.type === 'edit') {
        await jobsApi.update(modal.job.id, payload);
      } else {
        await jobsApi.create(payload);
      }
      closeModal();
      await refresh();
    } catch (err) {
      setFormError(err.message || 'Could not save the job posting.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleStatus(job) {
    await jobsApi.setStatus(job.id, job.status === 'open' ? 'closed' : 'open');
    await refresh();
  }

  async function handleDelete(job) {
    const applicants = job.applicantCount
      ? ` ${job.applicantCount} application${job.applicantCount === 1 ? '' : 's'} will be removed too.`
      : '';
    if (!window.confirm(`Delete "${job.title}"?${applicants} This cannot be undone.`)) return;
    await jobsApi.remove(job.id);
    await refresh();
  }

  return (
    <DashboardLayout>
      <h1 className="page-title">Job Postings</h1>
      <p className="page-subtitle">
        Post the roles you&rsquo;re hiring for. Students apply to a specific role, and
        your dashboard shows you who applied to which.
      </p>

      {!loading && stats && (
        <div className="stat-grid">
          <StatCard label="Total Postings" value={stats.total} Icon={BriefcaseIcon} />
          <StatCard label="Open Roles" value={stats.open} Icon={CheckBadgeIcon} />
          <StatCard label="Applicants" value={stats.applicants} Icon={CandidatesIcon} />
        </div>
      )}

      <div className="card table-card">
        <div className="table-card__header">
          <h3>Your Postings</h3>
          <button type="button" className="btn-primary table-card__cta" onClick={openCreate}>
            + Post a Job
          </button>
        </div>

        {loading ? (
          <InlineLoader className="table-card__empty" />
        ) : jobs.length === 0 ? (
          <p className="muted table-card__empty">
            You haven&rsquo;t posted any roles yet. Candidates apply to a specific role, so
            post one to start receiving applicants.
          </p>
        ) : (
          <>
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Role</th>
                    <th>Type</th>
                    <th>Location</th>
                    <th>Required Skills</th>
                    <th>Status</th>
                    <th>Applicants</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id}>
                      <td>{job.title}</td>
                      <td>{EMPLOYMENT_LABELS[job.employmentType] || job.employmentType}</td>
                      <td>{job.location || '—'}</td>
                      <td>
                        {job.requiredSkills.length === 0 ? (
                          <span className="muted">—</span>
                        ) : (
                          <div className="skill-chips skill-chips--inline">
                            {job.requiredSkills.slice(0, 4).map((skill) => (
                              <span className="skill-chip" key={skill}>{skill}</span>
                            ))}
                            {job.requiredSkills.length > 4 && (
                              <span className="skill-chip skill-chip--more">
                                +{job.requiredSkills.length - 4}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td>
                        <span
                          className={`badge ${job.status === 'open' ? 'badge--verified' : 'badge--neutral'}`}
                        >
                          {job.status === 'open' ? 'Open' : 'Closed'}
                        </span>
                      </td>
                      <td>{job.applicantCount}</td>
                      <td className="data-table__actions">
                        <button type="button" className="btn-link" onClick={() => openEdit(job)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn-link"
                          onClick={() => handleToggleStatus(job)}
                        >
                          {job.status === 'open' ? 'Close' : 'Reopen'}
                        </button>
                        <button
                          type="button"
                          className="btn-link btn-link--danger"
                          onClick={() => handleDelete(job)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="muted table-card__footer">
              Showing {jobs.length} posting{jobs.length === 1 ? '' : 's'}
            </p>
          </>
        )}
      </div>

      {modal && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal card" onClick={(e) => e.stopPropagation()}>
            <h3>{modal.type === 'edit' ? 'Edit Posting' : 'Post a Job'}</h3>
            <p className="muted">
              {modal.type === 'edit'
                ? 'Changes are visible to students immediately.'
                : 'Students will see this role and can apply to it right away.'}
            </p>

            {formError && <div className="auth-error">{formError}</div>}

            <form className="auth-form" onSubmit={handleSubmit}>
              <label className="auth-field">
                <span>Job title</span>
                <input
                  type="text"
                  value={jobForm.title}
                  onChange={updateJobField('title')}
                  placeholder="Backend Engineer"
                  required
                />
              </label>

              <div className="auth-form__row">
                <label className="auth-field">
                  <span>Employment type</span>
                  <select
                    value={jobForm.employmentType}
                    onChange={updateJobField('employmentType')}
                  >
                    {EMPLOYMENT_OPTIONS.map((o) => (
                      <option value={o.value} key={o.value}>{o.label}</option>
                    ))}
                  </select>
                </label>
                <label className="auth-field">
                  <span>Location</span>
                  <input
                    type="text"
                    value={jobForm.location}
                    onChange={updateJobField('location')}
                    placeholder="Colombo / Remote"
                  />
                </label>
              </div>

              <label className="auth-field">
                <span>Description</span>
                <textarea
                  rows={5}
                  value={jobForm.description}
                  onChange={updateJobField('description')}
                  placeholder="What the role involves, and what you're looking for."
                />
              </label>

              <label className="auth-field">
                <span>Required skills</span>
                <input
                  type="text"
                  value={jobForm.requiredSkills}
                  onChange={updateJobField('requiredSkills')}
                  placeholder="React, Node.js, PostgreSQL"
                />
                <span className="auth-field__hint">
                  Comma-separated. These are what a candidate&rsquo;s evidence gets scored against.
                </span>
              </label>

              <div className="modal__footer">
                <button type="button" className="btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Saving…' : modal.type === 'edit' ? 'Save Changes' : 'Post Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
