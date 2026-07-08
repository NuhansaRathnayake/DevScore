import DashboardLayout from '../components/DashboardLayout.jsx';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Admin dashboard shell (FR 8). Member 1 owns the authenticated landing;
 * user CRUD and audit/metrics are owned by Member 4 and render into the
 * reserved slot.
 */
export default function AdminDashboard() {
  const { user } = useAuth();
  const firstName = user.firstName || 'Admin';

  return (
    <DashboardLayout>
      <h1 className="page-title">Welcome back, {firstName}!</h1>
      <p className="page-subtitle">
        Manage users and monitor system activity.
      </p>

      <div className="placeholder">
        User management &amp; audit trails — Member 4 module
      </div>
    </DashboardLayout>
  );
}
