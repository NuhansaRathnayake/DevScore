import { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout.jsx';
import StatCard from '../components/StatCard.jsx';
import { InlineLoader } from '../components/Spinner.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { adminApi } from '../lib/api.js';
import { UsersIcon, BriefcaseIcon, ShieldIcon } from '../components/DashboardIcons.jsx';

const EMPTY_CREATE_FORM = { firstName: '', lastName: '', email: '' };
const EMPTY_PASSWORD_FORM = { mode: 'generate', password: '' };

/**
 * Admin dashboard (FR 8, 47-50). Admins are the only actor who can create a
 * recruiter login — recruiters cannot self-register (Signup.jsx always
 * creates a student). This screen covers that flow plus recruiter account
 * CRUD, including setting/resetting a recruiter's password.
 */
export default function AdminDashboard() {
  const { user } = useAuth();
  const firstName = user.firstName || 'Admin';

  const [stats, setStats] = useState(null);
  const [recruiters, setRecruiters] = useState([]);
  const [loading, setLoading] = useState(true);

  // modal: null | { type: 'create' } | { type: 'password', recruiter }
  const [modal, setModal] = useState(null);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE_FORM);
  const [passwordForm, setPasswordForm] = useState(EMPTY_PASSWORD_FORM);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // { recruiter, tempPassword }
  const [copied, setCopied] = useState(false);

  async function refresh() {
    const [s, r] = await Promise.all([adminApi.stats(), adminApi.listRecruiters()]);
    setStats(s);
    setRecruiters(r.recruiters);
  }

  useEffect(() => {
    (async () => {
      try {
        await refresh();
      } finally {
        setLoading(false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    })();
  }, []);

  function updateCreateField(field) {
    return (e) => setCreateForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setFormError('');
    if (!createForm.firstName.trim() || !createForm.email.trim()) {
      return setFormError('First name and email are required.');
    }

    setSubmitting(true);
    try {
      const res = await adminApi.createRecruiter(createForm);
      setResult({ recruiter: res.recruiter, tempPassword: res.tempPassword, isNew: true });
      setCreateForm(EMPTY_CREATE_FORM);
      await refresh();
    } catch (err) {
      setFormError(err.message || 'Could not create the recruiter account.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSetPassword(e) {
    e.preventDefault();
    setFormError('');
    if (passwordForm.mode === 'choose' && passwordForm.password.length < 8) {
      return setFormError('Password must be at least 8 characters.');
    }

    setSubmitting(true);
    try {
      const payload = passwordForm.mode === 'choose' ? { password: passwordForm.password } : {};
      const res = await adminApi.setRecruiterPassword(modal.recruiter.id, payload);
      setResult({ recruiter: res.recruiter, tempPassword: res.tempPassword, isNew: false });
    } catch (err) {
      setFormError(err.message || 'Could not update the password.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Remove ${name}'s recruiter account? This cannot be undone.`)) return;
    await adminApi.deleteRecruiter(id);
    await refresh();
  }

  function closeModal() {
    setModal(null);
    setCreateForm(EMPTY_CREATE_FORM);
    setPasswordForm(EMPTY_PASSWORD_FORM);
    setFormError('');
    setResult(null);
    setCopied(false);
  }

  async function copyPassword() {
    try {
      await navigator.clipboard.writeText(result.tempPassword);
      setCopied(true);
    } catch {
      /* clipboard unavailable — the value is still selectable/visible */
    }
  }

  return (
    <DashboardLayout>
      <h1 className="page-title">Welcome back, {firstName}!</h1>
      <p className="page-subtitle">Manage recruiter access and monitor platform activity.</p>

      {!loading && stats && (
        <div className="stat-grid">
          <StatCard label="Students" value={stats.students} Icon={UsersIcon} />
          <StatCard label="Recruiters" value={stats.recruiters} Icon={BriefcaseIcon} />
          <StatCard label="Admins" value={stats.admins} Icon={ShieldIcon} />
        </div>
      )}

      <div className="card table-card">
        <div className="table-card__header">
          <h3>Recruiter Accounts</h3>
          <button
            type="button"
            className="btn-primary table-card__cta"
            onClick={() => setModal({ type: 'create' })}
          >
            + Add Recruiter
          </button>
        </div>

        {loading ? (
          <InlineLoader className="table-card__empty" />
        ) : recruiters.length === 0 ? (
          <p className="muted table-card__empty">
            No recruiter accounts yet. Create the first one above.
          </p>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Created</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {recruiters.map((r) => (
                  <tr key={r.id}>
                    <td>{r.fullName || '—'}</td>
                    <td>{r.email}</td>
                    <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="data-table__actions">
                      <button
                        type="button"
                        className="btn-link"
                        onClick={() => setModal({ type: 'password', recruiter: r })}
                      >
                        Set Password
                      </button>
                      <button
                        type="button"
                        className="btn-link btn-link--danger"
                        onClick={() => handleDelete(r.id, r.fullName || r.email)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal card" onClick={(e) => e.stopPropagation()}>
            {result ? (
              <>
                <h3>{result.isNew ? 'Recruiter account created' : 'Password updated'}</h3>
                <p className="muted">
                  Share these one-time credentials with{' '}
                  {result.recruiter.fullName || result.recruiter.email}. The
                  password can&rsquo;t be shown again after you close this.
                </p>
                <div className="credential-box">
                  <div className="credential-box__row">
                    <span className="credential-box__label">Email</span>
                    <span className="credential-box__value">{result.recruiter.email}</span>
                  </div>
                  <div className="credential-box__row">
                    <span className="credential-box__label">
                      {result.isNew ? 'Temporary password' : 'New password'}
                    </span>
                    <span className="credential-box__value credential-box__value--mono">
                      {result.tempPassword}
                    </span>
                  </div>
                  <button type="button" className="btn-secondary" onClick={copyPassword}>
                    {copied ? 'Copied!' : 'Copy password'}
                  </button>
                </div>
                <div className="modal__footer">
                  <button type="button" className="btn-primary" onClick={closeModal}>
                    Done
                  </button>
                </div>
              </>
            ) : modal.type === 'create' ? (
              <>
                <h3>Add Recruiter</h3>
                <p className="muted">
                  Creates a login for a recruiter. Only admins can do this —
                  recruiters can&rsquo;t sign themselves up.
                </p>
                {formError && <div className="auth-error">{formError}</div>}
                <form className="auth-form" onSubmit={handleCreate}>
                  <div className="auth-form__row">
                    <label className="auth-field">
                      <span>First name</span>
                      <input
                        type="text"
                        value={createForm.firstName}
                        onChange={updateCreateField('firstName')}
                        required
                      />
                    </label>
                    <label className="auth-field">
                      <span>Last name</span>
                      <input
                        type="text"
                        value={createForm.lastName}
                        onChange={updateCreateField('lastName')}
                      />
                    </label>
                  </div>
                  <label className="auth-field">
                    <span>Email</span>
                    <input
                      type="email"
                      value={createForm.email}
                      onChange={updateCreateField('email')}
                      required
                    />
                  </label>
                  <div className="modal__footer">
                    <button type="button" className="btn-secondary" onClick={closeModal}>
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary" disabled={submitting}>
                      {submitting ? 'Creating…' : 'Create Recruiter'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <h3>Set Password</h3>
                <p className="muted">
                  For {modal.recruiter.fullName || modal.recruiter.email}. This
                  replaces their current password immediately.
                </p>
                {formError && <div className="auth-error">{formError}</div>}
                <form className="auth-form" onSubmit={handleSetPassword}>
                  <div className="radio-group">
                    <label className="radio-option">
                      <input
                        type="radio"
                        name="password-mode"
                        checked={passwordForm.mode === 'generate'}
                        onChange={() => setPasswordForm((f) => ({ ...f, mode: 'generate' }))}
                      />
                      <span>Generate a random password</span>
                    </label>
                    <label className="radio-option">
                      <input
                        type="radio"
                        name="password-mode"
                        checked={passwordForm.mode === 'choose'}
                        onChange={() => setPasswordForm((f) => ({ ...f, mode: 'choose' }))}
                      />
                      <span>Set a specific password</span>
                    </label>
                  </div>
                  {passwordForm.mode === 'choose' && (
                    <label className="auth-field">
                      <span>New password</span>
                      <input
                        type="text"
                        value={passwordForm.password}
                        onChange={(e) =>
                          setPasswordForm((f) => ({ ...f, password: e.target.value }))
                        }
                        minLength={8}
                        placeholder="At least 8 characters"
                        autoComplete="new-password"
                        required
                      />
                    </label>
                  )}
                  <div className="modal__footer">
                    <button type="button" className="btn-secondary" onClick={closeModal}>
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary" disabled={submitting}>
                      {submitting ? 'Saving…' : 'Update Password'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
