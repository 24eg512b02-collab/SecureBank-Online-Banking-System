import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import api, { parseError } from '../api/client';
import { Button, Field, PasswordInput } from '../components/ui';
import { useToast } from '../context/ToastContext';
import { validateRegister } from '../utils/validators';
import { groupAcc } from '../utils/format';

const EMPTY = { fullName: '', email: '', mobile: '', dateOfBirth: '', address: '', password: '', confirmPassword: '', accountType: 'SAVINGS' };

export default function Register() {
  const toast = useToast();
  const [f, setF] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);

  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const v = validateRegister(f);
    setErrors(v);
    if (Object.keys(v).length) return;
    setBusy(true);
    try {
      const { data } = await api.post('/auth/register', { ...f, mobile: f.mobile.trim() });
      setDone(data);
    } catch (err) {
      const { message, fieldErrors } = parseError(err);
      setErrors(fieldErrors);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="auth-wrap">
        <div className="card auth-card center">
          <CheckCircle2 size={44} className="ok-icon" />
          <h1>Your account is ready</h1>
          <p>Your account number is</p>
          <p className="acct-big mono">{groupAcc(done.accountNumber)}</p>
          <p className="muted">Keep it handy: other customers need it to send you money.</p>
          <Link className="btn primary" to="/login">Continue to log in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrap">
      <form className="card auth-card wide" onSubmit={submit} noValidate>
        <h1>Open an account</h1>
        <p className="muted">Demo registration. Use made-up details, not real personal information.</p>
        <div className="form-grid">
          <Field label="Full name" error={errors.fullName} htmlFor="fullName">
            <input id="fullName" className="input" value={f.fullName} onChange={set('fullName')} autoComplete="name" />
          </Field>
          <Field label="Email address" error={errors.email} htmlFor="email">
            <input id="email" type="email" className="input" value={f.email} onChange={set('email')} autoComplete="email" />
          </Field>
          <Field label="Mobile number" error={errors.mobile} hint="10 digits" htmlFor="mobile">
            <input id="mobile" inputMode="numeric" maxLength={10} className="input" value={f.mobile}
                   onChange={(e) => setF((p) => ({ ...p, mobile: e.target.value.replace(/\D/g, '') }))} autoComplete="tel-national" />
          </Field>
          <Field label="Date of birth" error={errors.dateOfBirth} htmlFor="dob">
            <input id="dob" type="date" className="input" value={f.dateOfBirth} onChange={set('dateOfBirth')} autoComplete="bday" />
          </Field>
          <Field label="Address" error={errors.address} htmlFor="address">
            <input id="address" className="input" value={f.address} onChange={set('address')} autoComplete="street-address" />
          </Field>
          <Field label="Account type" htmlFor="type">
            <select id="type" className="input" value={f.accountType} onChange={set('accountType')}>
              <option value="SAVINGS">Savings</option>
              <option value="CURRENT">Current</option>
            </select>
          </Field>
          <Field label="Password" error={errors.password} htmlFor="password">
            <PasswordInput id="password" value={f.password} onChange={set('password')} autoComplete="new-password" />
          </Field>
          <Field label="Confirm password" error={errors.confirmPassword} htmlFor="confirm">
            <PasswordInput id="confirm" value={f.confirmPassword} onChange={set('confirmPassword')} autoComplete="new-password" />
          </Field>
        </div>
        <Button type="submit" busy={busy}>Create account</Button>
        <p className="muted small">Already registered? <Link to="/login">Log in</Link></p>
      </form>
    </div>
  );
}
