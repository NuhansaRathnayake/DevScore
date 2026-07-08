import DashboardLayout from '../components/DashboardLayout.jsx';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Student dashboard shell (FR 8). Member 1 owns the authenticated landing and
 * welcome header; the feature widgets (Resume Status, GitHub Activity, Skill
 * Extraction) are owned by Members 2 & 3 and render into the reserved slots.
 */
export default function StudentDashboard() {
  const { user } = useAuth();
  const firstName = user.firstName || 'there';

  return (
    <DashboardLayout>
      <h1 className="page-title">Welcome back, {firstName}!</h1>
      <p className="page-subtitle">
        Upload your resume and connect GitHub so we can analyse your job
        readiness.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 20,
        }}
      >
        <div className="placeholder">Resume Status — Member 2 module</div>
        <div className="placeholder">GitHub Activity — Member 2 module</div>
        <div className="placeholder">Skill Extraction — Member 3 module</div>
      </div>
    </DashboardLayout>
  );
}
