import { useState } from 'react';
import { Link, NavLink, Outlet, Navigate, useNavigate } from 'react-router-dom';
import {
  Landmark, Menu, X, LayoutDashboard, UserSquare, ArrowLeftRight, PiggyBank, Banknote,
  ReceiptText, UserCog, LogOut, Users, ShieldCheck, Activity,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Logo({ to = '/' }) {
  return (
    <Link to={to} className="logo" aria-label="SecureBank home">
      <span className="logo-mark"><Landmark size={20} /></span>
      <span>SecureBank</span>
    </Link>
  );
}

export function DemoNotice() {
  return (
    <p className="demo-notice">
      Academic demo. All funds are simulated, and this site is not connected to any real bank or payment network.
    </p>
  );
}

export function PublicLayout() {
  const [open, setOpen] = useState(false);
  const { user, isAdmin } = useAuth();
  const close = () => setOpen(false);
  return (
    <div className="public">
      <header className="nav">
        <div className="container nav-inner">
          <Logo />
          <nav className={`nav-links ${open ? 'open' : ''}`} aria-label="Main">
            <Link to="/" onClick={close}>Home</Link>
            <Link to="/#about" onClick={close}>About</Link>
            <Link to="/#services" onClick={close}>Services</Link>
            <Link to="/#contact" onClick={close}>Contact</Link>
            <span className="nav-actions">
              {user ? (
                <Link className="btn primary sm" to={isAdmin ? '/admin' : '/dashboard'} onClick={close}>Go to dashboard</Link>
              ) : (
                <>
                  <Link className="btn ghost sm" to="/login" onClick={close}>Log in</Link>
                  <Link className="btn primary sm" to="/register" onClick={close}>Open an account</Link>
                </>
              )}
            </span>
          </nav>
          <button className="icon-btn menu-btn" aria-label="Toggle menu" onClick={() => setOpen((o) => !o)}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>
      <main><Outlet /></main>
      <footer className="footer" id="contact">
        <div className="container footer-grid">
          <div>
            <Logo />
            <p className="muted">A demonstration banking application built for academic study.</p>
          </div>
          <div>
            <h3>Contact</h3>
            <p>Email: support@securebank.example</p>
            <p>Phone: +91 40 0000 0000</p>
            <p>Address: 1 Demo Plaza, Hyderabad, Telangana, India</p>
          </div>
          <div>
            <h3>Explore</h3>
            <p><Link to="/login">Customer login</Link></p>
            <p><Link to="/register">Open an account</Link></p>
            <p><Link to="/admin/login">Administrator login</Link></p>
          </div>
        </div>
        <div className="container"><DemoNotice /></div>
      </footer>
    </div>
  );
}

export function ProtectedRoute({ role }) {
  const { user, isAdmin } = useAuth();
  if (!user) return <Navigate to={role === 'ADMIN' ? '/admin/login' : '/login'} replace />;
  if (role === 'ADMIN' && !isAdmin) return <Navigate to="/dashboard" replace />;
  if (role === 'USER' && isAdmin) return <Navigate to="/admin" replace />;
  return <Outlet />;
}

const USER_NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/account', label: 'My account', icon: UserSquare },
  { to: '/transfer', label: 'Transfer money', icon: ArrowLeftRight },
  { to: '/deposit', label: 'Deposit', icon: PiggyBank },
  { to: '/withdraw', label: 'Withdraw', icon: Banknote },
  { to: '/transactions', label: 'Transactions', icon: ReceiptText },
  { to: '/profile', label: 'Profile', icon: UserCog },
];
const ADMIN_NAV = [
  { to: '/admin', label: 'Overview', icon: Activity, end: true },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/transactions', label: 'Transactions', icon: ReceiptText },
];

export function AppShell({ admin }) {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const items = admin ? ADMIN_NAV : USER_NAV;

  const logout = () => {
    signOut();
    navigate(admin ? '/admin/login' : '/login', { replace: true });
  };

  return (
    <div className="shell">
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <Logo to={admin ? '/admin' : '/dashboard'} />
        {admin && <span className="chip admin-chip"><ShieldCheck size={14} /> Administrator</span>}
        <nav aria-label="Sidebar">
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)}
                     className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}>
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>
        <button className="side-link logout" onClick={logout}><LogOut size={18} /> Log out</button>
      </aside>
      {open && <div className="scrim" onClick={() => setOpen(false)} />}
      <div className="main">
        <header className="topbar">
          <button className="icon-btn menu-btn" aria-label="Open menu" onClick={() => setOpen(true)}><Menu size={22} /></button>
          <div className="topbar-user">
            <span className="avatar" aria-hidden="true">{user?.fullName?.[0] || '?'}</span>
            <span>{user?.fullName}</span>
          </div>
        </header>
        <div className="content">
          <Outlet />
          <DemoNotice />
        </div>
      </div>
    </div>
  );
}
