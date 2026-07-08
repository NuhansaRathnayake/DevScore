import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="centered-status">
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: 48, margin: 0 }}>404</h1>
        <p>This page could not be found.</p>
        <Link to="/" className="btn-primary" style={{ width: 'auto' }}>
          Back to DevScore
        </Link>
      </div>
    </div>
  );
}
