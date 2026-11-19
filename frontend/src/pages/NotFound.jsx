import { Link } from 'react-router-dom';
export default function NotFound() {
  return (
    <div className="auth-wrap">
      <div className="card auth-card center">
        <h1>Page not found</h1>
        <p className="muted">The page you asked for does not exist or has moved.</p>
        <Link className="btn primary" to="/">Go to the home page</Link>
      </div>
    </div>
  );
}
