import Sidebar from './Sidebar.jsx';
import { useAuth } from '../context/AuthContext.jsx';

/** Initials fallback avatar when the OAuth provider gives no photo. */
function initials(user) {
  const a = user.firstName?.[0] || user.email?.[0] || '?';
  const b = user.lastName?.[0] || '';
  return (a + b).toUpperCase();
}

/**
 * Shared authenticated shell (sidebar + topbar + content) used by every role
 * dashboard, matching the Figma layout. Feature screens render into `children`.
 */
export default function DashboardLayout({ children }) {
  const { user } = useAuth();

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <header className="topbar">
          <input
            className="topbar__search"
            placeholder="Search resources, jobs, or skills..."
            aria-label="Search"
          />
          <div className="topbar__user">
            <div className="topbar__user-meta">
              <div className="topbar__user-name">{user.fullName || user.email}</div>
              <div className="topbar__user-role">{user.role}</div>
            </div>
            {user.avatarUrl ? (
              <img className="avatar" src={user.avatarUrl} alt="" />
            ) : (
              <span className="avatar">{initials(user)}</span>
            )}
          </div>
        </header>
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
