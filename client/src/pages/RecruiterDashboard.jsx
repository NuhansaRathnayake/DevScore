import DashboardLayout from '../components/DashboardLayout.jsx';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Recruiter dashboard shell (FR 8). Member 1 owns the authenticated landing;
 * candidate lists, readiness scores and the evidence-gap view are owned by
 * Member 3 and render into the reserved slot.
 */
export default function RecruiterDashboard() {
  const { user } = useAuth();
  const firstName = user.firstName || 'there';

  return (
    <DashboardLayout>
      <h1 className="page-title">Welcome back, {firstName}!</h1>
      <p className="page-subtitle">
        Evaluate candidates with verified skill insights and AI-powered
        readiness scoring.
      </p>

      <div className="placeholder">
        Candidate list &amp; readiness scores — Member 3 module
      </div>
    </DashboardLayout>
  );
}
