import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { parseError } from '../api/client';
import { Button, Field, PasswordInput } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { isEmail } from '../utils/validators';

/** Shared by customer and administrator login. */
export function LoginForm({ admin }) {
  const { user, isAdmin, signIn } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate(isAdmin ? '/admin' : '/dashboard', { replace: true });
  }, [user, isAdmin, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    const v = {};
    if (!isEmail(email)) v.email = 'Enter a valid email address';
    if (!password) v.password = 'Enter your password';
    setErrors(v);
    if (Object.keys(v).length) return;
    setBusy(true);
    try {
      const { data } = await api.post(admin ? '/auth/admin/login' : '/auth/login', { email: email.trim(), password });
      signIn(data);
      toast.success(`Welcome, ${data.fullName}`);
    } catch (err) {
      toast.error(parseError(err).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <form className={`card auth-card ${admin ? 'admin-card' : ''}`} onSubmit={submit} noValidate>
        <h1>{admin ? 'Administrator log in' : 'Log in to your account'}</h1>
        <Field label="Email address" error={errors.email} htmlFor="email">
          <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
        </Field>
        <Field label="Password" error={errors.password} htmlFor="password">
          <PasswordInput id="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </Field>
        <Button type="submit" busy={busy}>Log in</Button>
        {!admin ? (
          <p className="muted small">
            <Link to="/forgot-password">Forgot your password?</Link> &nbsp;|&nbsp; New here? <Link to="/register">Open an account</Link>
          </p>
        ) : (
          <p className="muted small"><Link to="/login">Customer log in</Link></p>
        )}
      </form>
    </div>
  );
}

export default function Login() { return <LoginForm admin={false} />; }
