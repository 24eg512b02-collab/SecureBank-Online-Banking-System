import { useEffect, useState } from 'react';
import api, { parseError } from '../api/client';
import { Spinner } from '../components/ui';
import { useToast } from '../context/ToastContext';
import { dateOnly, groupAcc, money } from '../utils/format';

export default function Account() {
  const toast = useToast();
  const [a, setA] = useState(null);

  useEffect(() => {
    api.get('/account').then((r) => setA(r.data)).catch((e) => toast.error(parseError(e).message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!a) return <Spinner />;
  const rows = [
    ['Account number', <span className="mono">{groupAcc(a.accountNumber)}</span>],
    ['Account type', a.accountType === 'SAVINGS' ? 'Savings' : 'Current'],
    ['Account status', <span className={`chip ${a.status === 'ACTIVE' ? 'ok' : 'off'}`}>{a.status === 'ACTIVE' ? 'Active' : 'Inactive'}</span>],
    ['Available balance', money(a.balance)],
    ['Opened on', dateOnly(a.openedOn)],
    ['Customer name', a.customerName],
    ['Email', a.email],
    ['Mobile', a.mobile],
  ];
  return (
    <>
      <h1 className="page-title">My account</h1>
      <section className="card">
        <dl className="detail-list">
          {rows.map(([k, v]) => (<div key={k}><dt>{k}</dt><dd>{v}</dd></div>))}
        </dl>
      </section>
    </>
  );
}
