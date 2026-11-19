import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftRight, Banknote, PiggyBank, ReceiptText, TrendingDown, TrendingUp } from 'lucide-react';
import api, { parseError } from '../api/client';
import { Spinner, StatCard, TxTable } from '../components/ui';
import MonthlyChart from '../components/MonthlyChart';
import { useToast } from '../context/ToastContext';
import { groupAcc, money } from '../utils/format';

export default function Dashboard() {
  const toast = useToast();
  const [d, setD] = useState(null);

  useEffect(() => {
    api.get('/dashboard').then((r) => setD(r.data)).catch((e) => toast.error(parseError(e).message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!d) return <Spinner />;
  const first = d.fullName.split(' ')[0];

  return (
    <>
      <h1 className="page-title">Welcome back, {first}</h1>
      <section className="balance-panel">
        <div>
          <div className="bp-label">Available balance</div>
          <div className="bp-amount">{money(d.balance)}</div>
        </div>
        <dl className="bp-meta">
          <div><dt>Account number</dt><dd className="mono">{groupAcc(d.accountNumber)}</dd></div>
          <div><dt>Account type</dt><dd>{d.accountType === 'SAVINGS' ? 'Savings' : 'Current'}</dd></div>
          <div><dt>Status</dt><dd><span className={`chip ${d.accountStatus === 'ACTIVE' ? 'ok' : 'off'}`}>{d.accountStatus === 'ACTIVE' ? 'Active' : 'Inactive'}</span></dd></div>
        </dl>
        <div className="quick">
          <Link className="btn light" to="/transfer"><ArrowLeftRight size={16} /> Transfer</Link>
          <Link className="btn light" to="/deposit"><PiggyBank size={16} /> Deposit</Link>
          <Link className="btn light" to="/withdraw"><Banknote size={16} /> Withdraw</Link>
          <Link className="btn light" to="/transactions"><ReceiptText size={16} /> History</Link>
        </div>
      </section>

      <div className="grid g2 gap">
        <StatCard icon={TrendingUp} label="Total deposits" value={money(d.totalDeposits)} tone="in" />
        <StatCard icon={TrendingDown} label="Total withdrawals" value={money(d.totalWithdrawals)} tone="out" />
      </div>

      <div className="grid g-chart gap">
        <section className="card">
          <h2>Last six months</h2>
          <MonthlyChart data={d.monthly} />
        </section>
        <section className="card">
          <div className="card-head"><h2>Recent transactions</h2><Link to="/transactions">View all</Link></div>
          <TxTable rows={d.recentTransactions} />
        </section>
      </div>
    </>
  );
}
