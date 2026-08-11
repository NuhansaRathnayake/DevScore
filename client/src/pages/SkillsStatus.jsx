import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout.jsx';
import SkillChips from '../components/SkillChips.jsx';
import { InlineLoader } from '../components/Spinner.jsx';
import { resumeApi } from '../lib/api.js';

const STATUS_LABEL = {
  pending: { text: 'Extracting…', badge: 'badge--pending' },
  success: { text: 'Extracted', badge: 'badge--verified' },
  success_no_skills_found: { text: 'No skills found', badge: 'badge--pending' },
  failed: { text: 'Extraction failed', badge: 'badge--missing' },
};

/**
 * Skills Status screen (FR 28-32 "Display Extracted Skills Status") — its
 * own page, separate from the upload flow, so a student can check what was
 * parsed from their resume without re-triggering an upload.
 */
export default function SkillsStatus() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setStatus(await resumeApi.status());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const skillsStatus = status?.skills?.status;
  const label = STATUS_LABEL[skillsStatus];

  return (
    <DashboardLayout>
      <h1 className="page-title">Skills Status</h1>
      <p className="page-subtitle">
        The skills we extracted from your resume — this is exactly what
        recruiters see.
      </p>

      {loading ? (
        <InlineLoader />
      ) : !status?.uploaded ? (
        <div className="card" style={{ maxWidth: 480 }}>
          <p className="muted">
            You haven&rsquo;t uploaded a resume yet, so there&rsquo;s nothing
            to extract.
          </p>
          <Link to="/student/resume" className="btn-primary" style={{ width: 'auto' }}>
            Upload Resume
          </Link>
        </div>
      ) : (
        <div className="card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}
          >
            <div>
              <h3 style={{ margin: 0 }}>{status.filename}</h3>
              {status.skills?.extractedAt && (
                <p className="muted" style={{ margin: '2px 0 0' }}>
                  Extracted {new Date(status.skills.extractedAt).toLocaleString()}
                </p>
              )}
            </div>
            {label && <span className={`badge ${label.badge}`}>{label.text}</span>}
          </div>

          <SkillChips
            status={skillsStatus}
            byCategory={status.skills?.byCategory}
            uncategorized={status.skills?.uncategorized}
          />

          {skillsStatus === 'failed' && (
            <Link
              to="/student/resume"
              className="btn-secondary"
              style={{ width: 'auto', marginTop: 16 }}
            >
              Re-upload resume
            </Link>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
