import { Navigate } from 'react-router-dom';
import { useAuth, ROLE_HOME } from '../context/AuthContext.jsx';
import { PageLoader } from './Spinner.jsx';

/**
 * Client-side role-based access control (FR 6 / FR 16). Blocks unauthenticated
 * users and redirects authenticated users who lack the required role back to
 * their own dashboard.
 */
export default function ProtectedRoute({ allow, children }) {
  const { user, status } = useAuth();

  if (status === 'loading') {
    return (
      <div className="centered-status">
        <PageLoader />
      </div>
    );
  }

  if (status === 'guest' || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allow && !allow.includes(user.role)) {
    return <Navigate to={ROLE_HOME[user.role] || '/'} replace />;
  }

  return children;
}
