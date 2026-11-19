import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Trash2, UserPlus } from 'lucide-react';
import api, { parseError, uuid } from '../api/client';
import { Button, Field, Modal, Spinner } from '../components/ui';
import { useToast } from '../context/ToastContext';
import { dateTime, groupAcc, money } from '../utils/format';
import { validateAmount } from '../utils/validators';

export default function Transfer() {
  const toast = useToast();
  const [account, setAccount] = useState(null);
  const [benefs, setBenefs] = useState([]);
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState({});
  const [checking, setChecking] = useState(false);
  const [holder, setHolder] = useState(null); // masked name once the account has been verified
  const [saveBenef, setSaveBenef] = useState(false);
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const idemKey = useRef(uuid());

  const loadAll = () => {
    api.get('/account').then((r) => setAccount(r.data)).catch((e) => toast.error(parseError(e).message));
    api.get('/beneficiaries').then((r) => setBenefs(r.data)).catch(() => {});
  };
  useEffect(() => { loadAll(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const review = async (e) => {
    e.preventDefault();
    const v = {};
    if (!/^\d{12}$/.test(to)) v.to = 'Account number must be 12 digits';
    else if (to === account.accountNumber) v.to = 'You cannot transfer to your own account';
    const amtErr = validateAmount(amount);
    if (amtErr) v.amount = amtErr;
    else if (Number(amount) > Number(account.balance)) v.amount = 'Amount is more than your available balance';
    setErrors(v);
    if (Object.keys(v).length) return;

    setChecking(true);
    try {
      const { data } = await api.get(`/account/lookup/${to}`);
      setHolder(data.maskedHolderName);
      setSaveBenef(false);
    } catch (err) {
      setErrors({ to: parseError(err).message });
    } finally {
      setChecking(false);
    }
  };

  const confirm = async () => {
    setBusy(true);
    try {
      const { data } = await api.post('/transactions/transfer', {
        toAccountNumber: to, amount: Number(amount), description: description.trim() || null, idempotencyKey: idemKey.current,
      });
      if (saveBenef) await api.post('/beneficiaries', { accountNumber: to }).catch(() => {});
      setReceipt({ ...data, holder });
      setHolder(null);
      idemKey.current = uuid();
      toast.success('Transfer completed');
    } catch (err) {
      setHolder(null);
      const { message, fieldErrors } = parseError(err);
      setErrors({ amount: fieldErrors.amount, to: fieldErrors.toAccountNumber, form: message });
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  const removeBenef = async (id) => {
    try {
      await api.delete(`/beneficiaries/${id}`);
      setBenefs((l) => l.filter((b) => b.id !== id));
      toast.success('Beneficiary removed');
    } catch (err) { toast.error(parseError(err).message); }
  };

  const reset = () => { setReceipt(null); setTo(''); setAmount(''); setDescription(''); setErrors({}); loadAll(); };

  if (!account) return <Spinner />;

  if (receipt) {
    return (
      <>
        <h1 className="page-title">Transfer money</h1>
        <section className="card receipt">
          <CheckCircle2 size={40} className="ok-icon" />
          <h2>Transfer completed</h2>
          <dl className="detail-list">
            <div><dt>Transaction ID</dt><dd className="mono">{receipt.transactionId}</dd></div>
            <div><dt>Sent to</dt><dd>{receipt.holder} <span className="mono muted">({groupAcc(receipt.counterpartyAccount)})</span></dd></div>
            <div><dt>Amount</dt><dd>{money(receipt.amount)}</dd></div>
            <div><dt>New balance</dt><dd>{money(receipt.balanceAfter)}</dd></div>
            <div><dt>Date and time</dt><dd>{dateTime(receipt.createdAt)}</dd></div>
          </dl>
          <div className="row">
            <Button onClick={reset}>Make another transfer</Button>
            <Link className="btn ghost" to="/transactions">View transactions</Link>
          </div>
        </section>
      </>
    );
  }

  const alreadySaved = benefs.some((b) => b.accountNumber === to);

  return (
    <>
      <h1 className="page-title">Transfer money</h1>
      <div className="grid g-transfer gap">
        <form className="card form-card" onSubmit={review} noValidate>
          <p className="muted">Available balance: <strong>{money(account.balance)}</strong></p>
          {errors.form && <p className="err" role="alert">{errors.form}</p>}
          <Field label="Beneficiary account number" error={errors.to} htmlFor="to" hint="12 digits">
            <input id="to" className="input mono" inputMode="numeric" maxLength={12} value={to}
                   onChange={(e) => setTo(e.target.value.replace(/\D/g, ''))} />
          </Field>
          <Field label="Amount (INR)" error={errors.amount} htmlFor="amount">
            <input id="amount" className="input" inputMode="decimal" placeholder="0.00" value={amount}
                   onChange={(e) => setAmount(e.target.value)} />
          </Field>
          <Field label="Description (optional)" htmlFor="desc">
            <input id="desc" className="input" maxLength={255} value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          <Button type="submit" busy={checking}>Review transfer</Button>
        </form>

        <section className="card">
          <h2>Saved beneficiaries</h2>
          {benefs.length === 0 ? (
            <p className="muted">No saved beneficiaries yet. You can save one when you confirm a transfer.</p>
          ) : (
            <ul className="benef-list">
              {benefs.map((b) => (
                <li key={b.id}>
                  <button type="button" className="benef-pick" onClick={() => setTo(b.accountNumber)}>
                    <strong>{b.nickname || b.holderName}</strong>
                    <span className="mono muted">{groupAcc(b.accountNumber)}</span>
                  </button>
                  <button type="button" className="icon-btn" aria-label={`Remove ${b.nickname || b.holderName}`} onClick={() => removeBenef(b.id)}>
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {holder && (
        <Modal title="Confirm transfer" onClose={() => !busy && setHolder(null)}
          actions={<>
            <Button variant="ghost" onClick={() => setHolder(null)} disabled={busy}>Cancel</Button>
            <Button busy={busy} onClick={confirm}>Confirm transfer</Button>
          </>}>
          <dl className="detail-list">
            <div><dt>To</dt><dd>{holder}</dd></div>
            <div><dt>Account</dt><dd className="mono">{groupAcc(to)}</dd></div>
            <div><dt>Amount</dt><dd>{money(amount)}</dd></div>
            <div><dt>Your balance after</dt><dd>{money(Number(account.balance) - Number(amount))}</dd></div>
            <div><dt>Description</dt><dd>{description.trim() || '-'}</dd></div>
          </dl>
          {!alreadySaved && (
            <label className="check">
              <input type="checkbox" checked={saveBenef} onChange={(e) => setSaveBenef(e.target.checked)} />
              <UserPlus size={16} /> Save as a beneficiary
            </label>
          )}
          <p className="muted small">Check the name carefully. Transfers cannot be undone. Simulated funds only.</p>
        </Modal>
      )}
    </>
  );
}
