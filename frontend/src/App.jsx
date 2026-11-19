import { Route, Routes } from 'react-router-dom';
import { AppShell, ProtectedRoute, PublicLayout } from './components/Layouts';
import Home from './pages/Home';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Account from './pages/Account';
import Transfer from './pages/Transfer';
import MoneyForm from './pages/MoneyForm';
import Transactions from './pages/Transactions';
import Profile from './pages/Profile';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminTransactions from './pages/admin/AdminTransactions';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route element={<ProtectedRoute role="USER" />}>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/account" element={<Account />} />
          <Route path="/transfer" element={<Transfer />} />
          <Route path="/deposit" element={<MoneyForm kind="deposit" />} />
          <Route path="/withdraw" element={<MoneyForm kind="withdraw" />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute role="ADMIN" />}>
        <Route element={<AppShell admin />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/customers" element={<AdminCustomers />} />
          <Route path="/admin/transactions" element={<AdminTransactions />} />
        </Route>
      </Route>
    </Routes>
  );
}
