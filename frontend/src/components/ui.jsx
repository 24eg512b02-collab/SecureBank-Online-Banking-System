import { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { TYPE_LABEL, dateTime, money } from '../utils/format';

export function Spinner({ label = 'Loading' }) {
  return (
    <div className="center-pad" role="status" aria-live="polite">
      <Loader2 className="spin" size={28} />
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function Field({ label, error, hint, children, htmlFor }) {
  return (
    <div className={`field ${error ? 'has-error' : ''}`}>
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {hint && !error && <small className="hint">{hint}</small>}
      {error && <small className="err" role="alert">{error}</small>}
    </div>
  );
}

export function PasswordInput({ id, value, onChange, autoComplete, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div className="pw">
      <input id={id} className="input" type={show ? 'text' : 'password'} value={value}
             onChange={onChange} autoComplete={autoComplete} placeholder={placeholder} />
      <button type="button" className="icon-btn" onClick={() => setShow((s) => !s)}
              aria-label={show ? 'Hide password' : 'Show password'}>
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

export function Button({ busy, children, variant = 'primary', size, ...rest }) {
  return (
    <button className={`btn ${variant} ${size || ''}`} disabled={busy || rest.disabled} {...rest}>
      {busy && <Loader2 className="spin" size={16} />}
      {children}
    </button>
  );
}

export function Modal({ title, children, onClose, actions }) {
  const ref = useRef(null);
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    ref.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref}>
        <h2>{title}</h2>
        <div className="modal-body">{children}</div>
        <div className="modal-actions">{actions}</div>
      </div>
    </div>
  );
}

export function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  return (
    <div className="pager">
      <button className="btn ghost sm" disabled={page === 0} onClick={() => onChange(page - 1)}>
        <ChevronLeft size={16} /> Previous
      </button>
      <span>Page {page + 1} of {totalPages}</span>
      <button className="btn ghost sm" disabled={page + 1 >= totalPages} onClick={() => onChange(page + 1)}>
        Next <ChevronRight size={16} />
      </button>
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, tone }) {
  return (
    <div className={`card stat ${tone || ''}`}>
      <span className="stat-icon"><Icon size={20} /></span>
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
      </div>
    </div>
  );
}

export function EmptyState({ title, text }) {
  return (
    <div className="empty">
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}

export function TxTable({ rows, showAccount }) {
  if (!rows?.length) {
    return <EmptyState title="No transactions found" text="Transactions will appear here once money moves in or out of the account." />;
  }
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Transaction ID</th>
            <th>Date and time</th>
            {showAccount && <th>Account</th>}
            <th>Type</th>
            <th className="num">Amount</th>
            <th>Status</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.transactionId}>
              <td className="mono">{t.transactionId}</td>
              <td>{dateTime(t.createdAt)}</td>
              {showAccount && <td className="mono">{t.accountNumber}</td>}
              <td>{TYPE_LABEL[t.type] || t.type}</td>
              <td className={`num amt ${t.direction === 'CREDIT' ? 'in' : 'out'}`}>
                {t.direction === 'CREDIT' ? '+' : '-'}{money(t.amount)}
              </td>
              <td><span className={`chip ${t.direction === 'CREDIT' ? 'credit' : 'debit'}`}>{t.direction === 'CREDIT' ? 'Credit' : 'Debit'}</span></td>
              <td className="desc">{t.description || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
