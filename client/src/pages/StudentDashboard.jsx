import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout.jsx';
import SkillChips from '../components/SkillChips.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { githubApi, jobsApi, resumeApi } from '../lib/api.js';
import { ResumeIcon, GithubMiningIcon } from '../components/FeatureIcons.jsx';
import { BriefcaseIcon } from '../components/DashboardIcons.jsx';

/**
 * A locked card still links through — the job-role gate is an ordering hint,
 * not an access control. The routes stay reachable and the server never
 * rejects an upload for a missing application.
 */
function SetupCard({
  Icon, done, locked = false, title, description,
  doneLabel, actionLabel, lockedHint, to, meta,
}) {
  return (
    <div className={`setup-card card ${done ? 'is-done' : ''} ${locked ? 'is-locked' : ''}`}>
      <div className="setup-card__header">
        <span className="setup-card__icon">
          <Icon />
        </span>
        <span className={`badge ${done ? 'badge--verified' : 'badge--pending'}`}>
          {done ? 'Done' : locked ? 'Locked' : 'Not started'}
        </span>
      </div>
      <h3>{title}</h3>
      <p className="muted">{description}</p>
      {locked && <p className="setup-card__hint">{lockedHint}</p>}
      {meta && <p className="setup-card__meta">{meta}</p>}
      <Link to={to} className={done || locked ? 'btn-secondary' : 'btn-primary'}>
        {done ? doneLabel : actionLabel}
      </Link>
    </div>
  );
}

/**
 * Student dashboard — a three-step setup checklist (job role, resume, GitHub)
 * that gates whether a recruiter has anything to score (FR 8, feeds FR 41-46).
 * The role comes first: everything else is evidence measured against it.
 */
export default function StudentDashboard() {
  const { user } = useAuth();
  const firstName = user.firstName || 'there';

  const [resume, setResume] = useState(null);
  const [github, setGithub] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [r, g, a] = await Promise.allSettled([
        resumeApi.status(),
        githubApi.status(),
        jobsApi.listApplied(),
      ]);
      if (r.status === 'fulfilled') setResume(r.value);
      if (g.status === 'fulfilled') setGithub(g.value);
      if (a.status === 'fulfilled') setApplications(a.value.applications);
      setLoading(false);
    })();
  }, []);

  const roleDone = applications.length > 0;
  const resumeDone = Boolean(resume?.uploaded);
  const githubDone = Boolean(github?.connected);
  const allDone = roleDone && resumeDone && githubDone;
  const stepsDone = Number(roleDone) + Number(resumeDone) + Number(githubDone);

  return (
    <DashboardLayout>
      <h1 className="page-title">Welcome back, {firstName}!</h1>
      <p className="page-subtitle">
        Pick the job roles you&rsquo;re applying for, then upload your resume and
        connect GitHub so we can analyse your job readiness.
      </p>

      {!loading && (
        <div className={`setup-banner ${allDone ? 'setup-banner--done' : ''}`}>
          <span className="setup-banner__icon">{allDone ? '✓' : stepsDone}</span>
          <span>
            {allDone ? (
              <>
                <strong>Your profile is complete.</strong> Recruiters can now
                see your verified skills and readiness score.
              </>
            ) : (
              <>
                <strong>{stepsDone} of 3 steps complete.</strong> Finish the
                setup below so recruiters have evidence to review.
              </>
            )}
          </span>
        </div>
      )}

      <div className="setup-grid">
        <SetupCard
          Icon={BriefcaseIcon}
          done={roleDone}
          title="Select a Job Role"
          description="Choose the roles you're applying for — everything else is evidence measured against them."
          doneLabel="Browse more roles"
          actionLabel="Browse Job Roles"
          to="/student/jobs"
          meta={
            roleDone
              ? `${applications.length} role${applications.length === 1 ? '' : 's'} selected`
              : null
          }
        />
        {/* locked only while still incomplete — a step finished before this
            feature shipped must never be drawn as locked */}
        <SetupCard
          Icon={ResumeIcon}
          done={resumeDone}
          locked={!roleDone && !resumeDone}
          lockedHint="Select a job role first."
          title="Upload Resume"
          description="We extract the skills you claim from a PDF resume."
          doneLabel="Replace resume"
          actionLabel="Upload Resume"
          to="/student/resume"
          meta={resumeDone ? resume.filename : null}
        />
        <SetupCard
          Icon={GithubMiningIcon}
          done={githubDone}
          locked={!roleDone && !githubDone}
          lockedHint="Select a job role first."
          title="Connect GitHub"
          description="We verify your claimed skills against real repository evidence."
          doneLabel="Manage connection"
          actionLabel="Connect GitHub Account"
          to="/student/github"
          meta={githubDone ? `@${github.username}` : null}
        />
      </div>

      {roleDone && (
        <div className="card" style={{ marginTop: 20 }}>
          <h3 style={{ marginTop: 0 }}>Roles You Applied To</h3>
          <p className="muted" style={{ marginTop: -8, marginBottom: 16 }}>
            Recruiters who posted these roles can see your profile.
          </p>
          <ul className="applied-list">
            {applications.map((a) => (
              <li className="applied-list__item" key={a.id}>
                <span className="applied-list__title">{a.job.title}</span>
                <span className="applied-list__meta">
                  {a.job.location || 'Remote'} · applied{' '}
                  {new Date(a.appliedAt).toLocaleDateString()}
                </span>
                {a.job.status === 'closed' && (
                  <span className="badge badge--neutral">Closed</span>
                )}
              </li>
            ))}
          </ul>
          <Link to="/student/jobs" className="btn-secondary applied-list__cta">
            Manage roles
          </Link>
        </div>
      )}

      {resumeDone && (
        <div className="card" style={{ marginTop: 20 }}>
          <h3 style={{ marginTop: 0 }}>Your Claimed Skills</h3>
          <p className="muted" style={{ marginTop: -8, marginBottom: 16 }}>
            Extracted from your resume — this is what recruiters see.
          </p>
          <SkillChips
            status={resume.skills?.status}
            byCategory={resume.skills?.byCategory}
            uncategorized={resume.skills?.uncategorized}
          />
        </div>
      )}
    </DashboardLayout>
  );
}
