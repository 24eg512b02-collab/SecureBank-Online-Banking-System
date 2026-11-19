import { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { parseError } from '../api/client';
import { Button, Field } from '../components/ui';
import { useToast } from '../context/ToastContext';
import { isEmail } from '../utils/validators';

export default function ForgotPassword() {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!isEmail(email)) return setError('Enter a valid email address');
    setError('');
    setBusy(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email: email.trim() });
      setMessage(data.message);
    } catch (err) {
      toast.error(parseError(err).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <form className="card auth-card" onSubmit={submit} noValidate>
        <h1>Reset your password</h1>
        {message ? (
          <>
            <p>{message}</p>
            <Link className="btn primary" to="/login">Back to log in</Link>
          </>
        ) : (
          <>
            <p className="muted">Enter the email you registered with. This demo does not send real email.</p>
            <Field label="Email address" error={error} htmlFor="email">
              <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Button type="submit" busy={busy}>Send reset instructions</Button>
            <p className="muted small"><Link to="/login">Back to log in</Link></p>
          </>
        )}
      </form>
    </div>
  );
}
