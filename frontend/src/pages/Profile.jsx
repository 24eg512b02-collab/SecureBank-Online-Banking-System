import { useEffect, useState } from 'react';
import api, { parseError } from '../api/client';
import { Button, Field, PasswordInput, Spinner } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { dateOnly, groupAcc } from '../utils/format';
import { PASSWORD_MSG, PASSWORD_RE } from '../utils/validators';

export default function Profile() {
  const toast = useToast();
  const { updateName } = useAuth();
  const [p, setP] = useState(null);
  const [form, setForm] = useState({ fullName: '', mobile: '', address: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [pwBusy, setPwBusy] = useState(false);

  useEffect(() => {
    api.get('/profile').then((r) => {
      setP(r.data);
      setForm({ fullName: r.data.fullName, mobile: r.data.mobile, address: r.data.address });
    }).catch((e) => toast.error(parseError(e).message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async (e) => {
    e.preventDefault();
    const v = {};
    if (form.fullName.trim().length < 2) v.fullName = 'Enter your full name';
    if (!/^\d{10}$/.test(form.mobile)) v.mobile = 'Mobile number must be 10 digits';
    if (!form.address.trim()) v.address = 'Enter your address';
    setErrors(v);
    if (Object.keys(v).length) return;
    setSaving(true);
    try {
      const { data } = await api.put('/profile', form);
      setP(data);
      updateName(data.fullName);
      toast.success('Profile updated');
    } catch (err) {
      const { message, fieldErrors } = parseError(err);
      setErrors(fieldErrors);
      toast.error(message);
    } finally { setSaving(false); }
  };

  const changePw = async (e) => {
    e.preventDefault();
    const v = {};
    if (!pw.currentPassword) v.currentPassword = 'Enter your current password';
    if (!PASSWORD_RE.test(pw.newPassword)) v.newPassword = PASSWORD_MSG;
    if (pw.confirmPassword !== pw.newPassword) v.confirmPassword = 'Passwords do not match';
    setPwErrors(v);
    if (Object.keys(v).length) return;
    setPwBusy(true);
    try {
      await api.put('/profile/password', pw);
      setPw({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed');
    } catch (err) {
      const { message, fieldErrors } = parseError(err);
      setPwErrors(fieldErrors);
      toast.error(message);
    } finally { setPwBusy(false); }
  };

  if (!p) return <Spinner />;
  const setF = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setW = (k) => (e) => setPw((f) => ({ ...f, [k]: e.target.value }));

  return (
    <>
      <h1 className="page-title">Profile</h1>
      <div className="grid g2 gap">
        <form className="card form-card" onSubmit={save} noValidate>
          <h2>Personal details</h2>
          <Field label="Full name" error={errors.fullName} htmlFor="fullName">
            <input id="fullName" className="input" value={form.fullName} onChange={setF('fullName')} />
          </Field>
          <Field label="Mobile number" error={errors.mobile} htmlFor="mobile">
            <input id="mobile" className="input" inputMode="numeric" maxLength={10} value={form.mobile}
                   onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value.replace(/\D/g, '') }))} />
          </Field>
          <Field label="Address" error={errors.address} htmlFor="address">
            <input id="address" className="input" value={form.address} onChange={setF('address')} />
          </Field>
          <Button type="submit" busy={saving}>Save changes</Button>
          <dl className="detail-list compact">
            <div><dt>Email</dt><dd>{p.email}</dd></div>
            <div><dt>Date of birth</dt><dd>{dateOnly(p.dateOfBirth)}</dd></div>
            <div><dt>Account number</dt><dd className="mono">{groupAcc(p.accountNumber)}</dd></div>
            <div><dt>Account type</dt><dd>{p.accountType === 'SAVINGS' ? 'Savings' : 'Current'}</dd></div>
            <div><dt>Member since</dt><dd>{dateOnly(p.memberSince)}</dd></div>
          </dl>
        </form>

        <form className="card form-card" onSubmit={changePw} noValidate>
          <h2>Change password</h2>
          <Field label="Current password" error={pwErrors.currentPassword} htmlFor="cur">
            <PasswordInput id="cur" value={pw.currentPassword} onChange={setW('currentPassword')} autoComplete="current-password" />
          </Field>
          <Field label="New password" error={pwErrors.newPassword} htmlFor="new">
            <PasswordInput id="new" value={pw.newPassword} onChange={setW('newPassword')} autoComplete="new-password" />
          </Field>
          <Field label="Confirm new password" error={pwErrors.confirmPassword} htmlFor="conf">
            <PasswordInput id="conf" value={pw.confirmPassword} onChange={setW('confirmPassword')} autoComplete="new-password" />
          </Field>
          <Button type="submit" busy={pwBusy}>Change password</Button>
        </form>
      </div>
    </>
  );
}
