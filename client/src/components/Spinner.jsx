/** Small inline spinner — a rotating teal ring, sized for sitting next to text. */
export default function Spinner({ size = 16 }) {
  return (
    <span
      className="spinner"
      style={{ width: size, height: size }}
      role="status"
      aria-label="Loading"
    />
  );
}

/** Centered spinner + label for a page/section's only content while it loads. */
export function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="page-loader">
      <Spinner size={28} />
      <span className="page-loader__label">{label}</span>
    </div>
  );
}

/** Spinner + label on one line — the table/card "Loading…" row. */
export function InlineLoader({ label = 'Loading…', className = '' }) {
  return (
    <p className={`muted inline-loader ${className}`.trim()}>
      <Spinner size={14} />
      {label}
    </p>
  );
}
