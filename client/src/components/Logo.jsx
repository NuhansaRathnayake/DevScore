/**
 * DevScore brand mark — the hexagonal glyph + wordmark used in the Figma
 * sidebar and auth screens.
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
        <path
          d="M16 2 28 9v14L16 30 4 23V9L16 2Z"
          fill="var(--ds-primary)"
        />
        <path
          d="M16 9v14M11 12l10 8M21 12l-10 8"
          stroke="#fff"
          strokeWidth="1.6"
          strokeLinecap="round"
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
