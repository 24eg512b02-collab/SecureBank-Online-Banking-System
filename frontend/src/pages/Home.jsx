import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, Zap, LineChart, Smartphone, ArrowLeftRight, PiggyBank, Banknote, ReceiptText, Users, Lock } from 'lucide-react';

function HeroArt() {
  return (
    <svg viewBox="0 0 520 420" className="hero-art" role="img" aria-label="Illustration of a bank card, a rising balance chart and a security shield">
      <defs>
        <linearGradient id="card" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1F5FD1" /><stop offset="1" stopColor="#0B2A5B" />
        </linearGradient>
      </defs>
      <rect x="20" y="150" width="480" height="250" rx="24" fill="#E8F0FE" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} x={60 + i * 62} y={360 - (40 + i * 24)} width="34" height={40 + i * 24} rx="6" fill={i === 5 ? '#1F5FD1' : '#B8CCF5'} />
      ))}
      <path d="M70 330 L132 300 L194 305 L256 262 L318 245 L380 205" fill="none" stroke="#1E9E6A" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="380" cy="205" r="8" fill="#1E9E6A" />
      <g transform="rotate(-8 260 120)">
        <rect x="120" y="30" width="300" height="180" rx="20" fill="url(#card)" />
        <rect x="148" y="66" width="46" height="34" rx="7" fill="#F5C86A" />
        <text x="148" y="150" fill="#fff" fontSize="22" fontFamily="Manrope, sans-serif" letterSpacing="3">4829 0027 1186</text>
        <text x="148" y="184" fill="#B8CCF5" fontSize="14" fontFamily="Manrope, sans-serif">Demo cardholder</text>
        <circle cx="372" cy="176" r="16" fill="#fff" opacity=".85" /><circle cx="390" cy="176" r="16" fill="#8FB1F5" opacity=".85" />
      </g>
      <g transform="translate(400 280)">
        <path d="M40 0 L80 14 V50 C80 78 60 94 40 104 C20 94 0 78 0 50 V14 Z" fill="#fff" stroke="#1F5FD1" strokeWidth="4" />
        <path d="M22 50 L36 64 L60 36" fill="none" stroke="#1E9E6A" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

const FEATURES = [
  { icon: ShieldCheck, title: 'Protected sign-in', text: 'Passwords are hashed with BCrypt and every session is secured with a signed token.' },
  { icon: Zap, title: 'Transfers that either complete or do not happen', text: 'Both accounts update together, so a transfer can never leave money half-moved.' },
  { icon: LineChart, title: 'See where money goes', text: 'Monthly charts and searchable history show your income and spending at a glance.' },
  { icon: Smartphone, title: 'Works on any screen', text: 'The same account on your phone, tablet or desktop.' },
];

const SERVICES = [
  { icon: ArrowLeftRight, title: 'Send money', text: 'Move funds to any SecureBank account with a confirmation step and a transaction ID.' },
  { icon: PiggyBank, title: 'Deposits', text: 'Add funds to your account and see the new balance right away.' },
  { icon: Banknote, title: 'Withdrawals', text: 'Withdraw what you need. Your balance can never go below zero.' },
  { icon: ReceiptText, title: 'Statements', text: 'Filter your history, then download it as CSV or PDF.' },
  { icon: Users, title: 'Saved beneficiaries', text: 'Keep the accounts you pay often and send to them in two taps.' },
  { icon: Lock, title: 'Account controls', text: 'Update your details and change your password whenever you need to.' },
];

export default function Home() {
  const { hash } = useLocation();
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
    else window.scrollTo(0, 0);
  }, [hash]);

  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <h1>Banking you can check in a glance and trust with every transfer.</h1>
            <p className="lead">
              SecureBank gives you one clear view of your balance, your spending and your payments,
              with every transfer checked before money moves.
            </p>
            <div className="hero-cta">
              <Link className="btn primary" to="/register">Open an account</Link>
              <Link className="btn ghost" to="/login">Log in</Link>
            </div>
            <p className="muted small">Demo project with simulated funds. No real money is involved.</p>
          </div>
          <HeroArt />
        </div>
      </section>

      <section className="section container" id="features">
        <h2>Built around keeping your money safe</h2>
        <div className="grid g4">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div className="card feature" key={title}>
              <span className="stat-icon"><Icon size={20} /></span>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section alt" id="services">
        <div className="container">
          <h2>Everyday banking services</h2>
          <div className="grid g3">
            {SERVICES.map(({ icon: Icon, title, text }) => (
              <div className="service" key={title}>
                <Icon size={22} />
                <div><h3>{title}</h3><p>{text}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section container about" id="about">
        <div>
          <h2>About SecureBank</h2>
          <p>
            SecureBank is an academic demonstration of a full online banking system: a React front end,
            a Spring Boot API and a MySQL database. It shows how registration, authentication, atomic
            money transfers and an administrator console fit together.
          </p>
          <p>
            Every balance on this site is simulated. Nothing here connects to a real bank, card network
            or payment system, so please do not enter real personal or financial information.
          </p>
        </div>
        <div className="card about-card">
          <h3>Ready to try it?</h3>
          <p>Create a demo account in under a minute and make your first simulated transfer.</p>
          <Link className="btn primary" to="/register">Open an account</Link>
        </div>
      </section>
    </>
  );
}
