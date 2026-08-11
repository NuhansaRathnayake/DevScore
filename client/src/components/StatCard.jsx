/** Small metric tile used across the Admin and Recruiter dashboards. */
export default function StatCard({ label, value, Icon }) {
  return (
    <div className="stat-card card">
      <div>
        <p className="stat-card__label">{label}</p>
        <p className="stat-card__value">{value}</p>
      </div>
      {Icon && (
        <span className="stat-card__icon">
          <Icon />
        </span>
      )}
    </div>
  );
}
