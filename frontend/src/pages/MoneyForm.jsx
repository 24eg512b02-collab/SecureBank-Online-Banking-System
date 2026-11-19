import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import api, { parseError, uuid } from '../api/client';
import { Button, Field, Modal, Spinner } from '../components/ui';
import { useToast } from '../context/ToastContext';
import { dateTime, money } from '../utils/format';
import { validateAmount } from '../utils/validators';

/** Deposit and withdrawal share one form. kind = 'deposit' | 'withdraw' */
export default function MoneyForm({ kind }) {
  const isDeposit = kind === 'deposit';
  const noun = isDeposit ? 'deposit' : 'withdrawal';
  const toast = useToast();
  const [account, setAccount] = useState(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [review, setReview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const idemKey = useRef(uuid()); // same key on retry = never processed twice

  const loadAccount = () => api.get('/account').then((r) => setAccount(r.data)).catch((e) => toast.error(parseError(e).message));
  useEffect(() => { loadAccount(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const next = (e) => {
    e.preventDefault();
    let msg = validateAmount(amount);
    if (!msg && !isDeposit && account && Number(amount) > Number(account.balance)) msg = 'Amount is more than your available balance';
    setError(msg);
    if (!msg) setReview(true);
  };

  const confirm = async () => {
    setBusy(true);
    try {
      const { data } = await api.post(`/transactions/${kind}`, {
        amount: Number(amount), description: description.trim() || null, idempotencyKey: idemKey.current,
      });
      setReview(false);
      setReceipt(data);
      idemKey.current = uuid();
      toast.success(`${isDeposit ? 'Deposit' : 'Withdrawal'} completed`);
    } catch (err) {
      setReview(false);
      const { message, fieldErrors } = parseError(err);
      setError(fieldErrors.amount || message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  const reset = () => { setReceipt(null); setAmount(''); setDescription(''); setError(''); loadAccount(); };

  if (!account) return <Spinner />;

  if (receipt) {
    return (
      <>
        <h1 className="page-title">{isDeposit ? 'Deposit' : 'Withdraw'}</h1>
        <section className="card receipt">
          <CheckCircle2 size={40} className="ok-icon" />
          <h2>{isDeposit ? 'Deposit' : 'Withdrawal'} completed</h2>
          <dl className="detail-list">
            <div><dt>Transaction ID</dt><dd className="mono">{receipt.transactionId}</dd></div>
            <div><dt>Amount</dt><dd>{money(receipt.amount)}</dd></div>
            <div><dt>New balance</dt><dd>{money(receipt.balanceAfter)}</dd></div>
            <div><dt>Date and time</dt><dd>{dateTime(receipt.createdAt)}</dd></div>
          </dl>
          <div className="row">
            <Button onClick={reset}>Make another {noun}</Button>
            <Link className="btn ghost" to="/dashboard">Back to dashboard</Link>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <h1 className="page-title">{isDeposit ? 'Deposit money' : 'Withdraw money'}</h1>
      <form className="card form-card" onSubmit={next} noValidate>
        <p className="muted">Available balance: <strong>{money(account.balance)}</strong></p>
        <Field label="Amount (INR)" error={error} htmlFor="amount">
          <input id="amount" className="input" inputMode="decimal" placeholder="0.00" value={amount}
                 onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Field label="Description (optional)" htmlFor="desc">
          <input id="desc" className="input" maxLength={255} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <Button type="submit">Review {noun}</Button>
      </form>

      {review && (
        <Modal title={`Confirm ${noun}`} onClose={() => !busy && setReview(false)}
          actions={<>
            <Button variant="ghost" onClick={() => setReview(false)} disabled={busy}>Cancel</Button>
            <Button busy={busy} onClick={confirm}>{isDeposit ? 'Confirm deposit' : 'Confirm withdrawal'}</Button>
          </>}>
          <dl className="detail-list">
            <div><dt>Amount</dt><dd>{money(amount)}</dd></div>
            <div><dt>Balance after</dt><dd>{money(Number(account.balance) + (isDeposit ? 1 : -1) * Number(amount))}</dd></div>
            <div><dt>Description</dt><dd>{description.trim() || '-'}</dd></div>
          </dl>
          <p className="muted small">Simulated funds only.</p>
        </Modal>
      )}
    </>
  );
}
