import { NavLink } from 'react-router-dom';
import Logo from './Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
  ResumeIcon,
  GithubMiningIcon,
  ScoreIcon,
  EvidenceGapIcon,
} from './FeatureIcons.jsx';
import { CheckBadgeIcon, ClockIcon } from './DashboardIcons.jsx';

function LogoutIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 17v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 12h11M18 9l3 3-3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Role-aware navigation shell matching the Figma dashboard sidebar.
 * Screens not yet built (Candidates, Scores, Skills Status, …) appear as
 * inactive placeholders until their modules land.
 */
const NAV_BY_ROLE = {
  student: {
    subtitle: 'Candidate Portal',
    links: [
      { to: '/student', label: 'Dashboard', end: true, Icon: EvidenceGapIcon },
      { to: '/student/resume', label: 'Upload Resume', Icon: ResumeIcon },
      { to: '/student/github', label: 'Connect GitHub', Icon: GithubMiningIcon },
      { to: '/student/skills', label: 'Skills Status', Icon: CheckBadgeIcon },
    ],
  },
  recruiter: {
    subtitle: 'Recruiter Portal',
    links: [
      { to: '/recruiter', label: 'Dashboard', end: true, Icon: EvidenceGapIcon },
      { to: '/recruiter/scores', label: 'Scores', disabled: true, Icon: ScoreIcon },
    ],
  },
  admin: {
    subtitle: 'Admin Portal',
    links: [
      { to: '/admin', label: 'Dashboard', end: true, Icon: EvidenceGapIcon },
      { to: '/admin/audit-log', label: 'Audit Log', disabled: true, Icon: ClockIcon },
    ],
  },
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const config = NAV_BY_ROLE[user?.role] || NAV_BY_ROLE.student;

  return (
    <aside className="sidebar">
      <Logo subtitle={config.subtitle} />

      <nav className="sidebar__nav">
        {config.links.map((link) =>
          link.disabled ? (
            <span
              key={link.to}
              className="sidebar__link"
              style={{ opacity: 0.5, cursor: 'not-allowed' }}
              title="Available in a later implementation phase"
            >
              <link.Icon />
              <span>{link.label}</span>
            </span>
          ) : (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              title={link.label}
              className={({ isActive }) =>
                `sidebar__link${isActive ? ' is-active' : ''}`
              }
            >
              <link.Icon />
              <span>{link.label}</span>
            </NavLink>
          ),
        )}
      </nav>

      <button
        type="button"
        className="sidebar__logout"
        onClick={logout}
        title="Logout"
        aria-label="Logout"
      >
        <LogoutIcon />
        <span>Logout</span>
      </button>
    </aside>
  );
}
