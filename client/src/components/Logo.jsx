/**
 * DevScore brand mark — the rounded-square checkmark tile + wordmark, matching
 * the marketing site. The fill tracks --ds-primary so a retheme stays one line.
 */
export default function Logo({ size = 28, showText = true, subtitle }) {
  return (
    <span className="sidebar__brand" style={{ padding: 0 }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
      >
        <rect x="2" y="2" width="28" height="28" rx="8" fill="var(--ds-primary)" />
        <path
          d="M10 16.5l4 4 8-9"
          stroke="#fff"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      {showText && (
        <span className="sidebar__brand-text">
          <span className="sidebar__brand-name">DevScore</span>
          {subtitle && <span className="sidebar__brand-sub">{subtitle}</span>}
        </span>
      )}
    </span>
  );
}
