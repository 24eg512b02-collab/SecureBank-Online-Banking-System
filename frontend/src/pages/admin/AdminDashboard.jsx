import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Landmark, PiggyBank, Banknote, Users, ReceiptText, Wallet } from 'lucide-react';
import api, { parseError } from '../../api/client';
import { Spinner, StatCard, TxTable } from '../../components/ui';
import MonthlyChart from '../../components/MonthlyChart';
import { useToast } from '../../context/ToastContext';
import { money } from '../../utils/format';

export default function AdminDashboard() {
  const toast = useToast();
  const [s, setS] = useState(null);
  useEffect(() => {
    api.get('/admin/summary').then((r) => setS(r.data)).catch((e) => toast.error(parseError(e).message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (!s) return <Spinner />;
  return (
    <>
      <h1 className="page-title">Bank overview</h1>
      <div className="grid g3 gap">
        <StatCard icon={Users} label="Registered customers" value={s.totalCustomers} />
        <StatCard icon={Landmark} label="Bank accounts" value={s.totalAccounts} />
        <StatCard icon={ReceiptText} label="Transactions recorded" value={s.totalTransactions} />
        <StatCard icon={PiggyBank} label="Total deposits" value={money(s.totalDeposits)} tone="in" />
        <StatCard icon={Banknote} label="Total withdrawals" value={money(s.totalWithdrawals)} tone="out" />
        <StatCard icon={Wallet} label="Funds held in accounts" value={money(s.totalBalance)} />
      </div>
      <div className="grid g-chart gap">
        <section className="card">
          <h2>Deposits and withdrawals, last six months</h2>
          <MonthlyChart data={s.monthly} inLabel="Deposits" outLabel="Withdrawals" />
        </section>
        <section className="card">
          <div className="card-head"><h2>Latest activity</h2><Link to="/admin/transactions">View all</Link></div>
          <TxTable rows={s.recentTransactions} showAccount />
        </section>
      </div>
    </>
  );
}
