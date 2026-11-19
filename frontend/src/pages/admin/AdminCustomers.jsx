import { useCallback, useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import api, { parseError } from '../../api/client';
import { Button, EmptyState, Modal, Pagination, Spinner } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import { dateOnly, groupAcc, money } from '../../utils/format';

export default function AdminCustomers() {
  const toast = useToast();
  const [q, setQ] = useState('');
  const [applied, setApplied] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [target, setTarget] = useState(null); // customer pending activate/deactivate
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await api.get('/admin/customers', { params: { q: applied, page, size: 10 } });
      setData(r.data);
    } catch (e) { toast.error(parseError(e).message); }
  }, [applied, page]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [load]);

  const search = (e) => { e.preventDefault(); setPage(0); setApplied(q.trim()); };

  const toggle = async () => {
    setBusy(true);
    try {
      const { data: row } = await api.patch(`/admin/customers/${target.id}/status`, { active: !target.enabled });
      setData((d) => ({ ...d, content: d.content.map((c) => (c.id === row.id ? row : c)) }));
      toast.success(row.enabled ? 'Customer activated' : 'Customer deactivated');
      setTarget(null);
    } catch (e) { toast.error(parseError(e).message); }
    finally { setBusy(false); }
  };

  return (
    <>
      <h1 className="page-title">Customers</h1>
      <form className="card filters" onSubmit={search}>
        <div className="field grow">
          <label htmlFor="cq">Search customers</label>
          <input id="cq" className="input" placeholder="Name, email, mobile or account number" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="filter-actions"><Button type="submit"><Search size={16} /> Search</Button></div>
      </form>

      <section className="card">
        {!data ? <Spinner /> : data.content.length === 0 ? (
          <EmptyState title="No customers found" text="Try a different name, email, mobile number or account number." />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Customer</th><th>Account</th><th>Type</th><th className="num">Balance</th><th>Joined</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {data.content.map((c) => (
                  <tr key={c.id}>
                    <td><strong>{c.fullName}</strong><div className="muted small">{c.email} | {c.mobile}</div></td>
                    <td className="mono">{groupAcc(c.accountNumber)}</td>
                    <td>{c.accountType === 'SAVINGS' ? 'Savings' : 'Current'}</td>
                    <td className="num">{money(c.balance)}</td>
                    <td>{dateOnly(c.createdAt)}</td>
                    <td><span className={`chip ${c.enabled ? 'ok' : 'off'}`}>{c.enabled ? 'Active' : 'Deactivated'}</span></td>
                    <td><Button size="sm" variant={c.enabled ? 'danger' : 'ghost'} onClick={() => setTarget(c)}>{c.enabled ? 'Deactivate' : 'Activate'}</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />}
      </section>

      {target && (
        <Modal title={target.enabled ? 'Deactivate customer' : 'Activate customer'} onClose={() => !busy && setTarget(null)}
          actions={<>
            <Button variant="ghost" onClick={() => setTarget(null)} disabled={busy}>Cancel</Button>
            <Button variant={target.enabled ? 'danger' : 'primary'} busy={busy} onClick={toggle}>
              {target.enabled ? 'Deactivate account' : 'Activate account'}
            </Button>
          </>}>
          <p>
            {target.enabled
              ? `${target.fullName} will be signed out and unable to log in or move money until the account is activated again.`
              : `${target.fullName} will be able to log in and use the account again.`}
          </p>
        </Modal>
      )}
    </>
  );
}
