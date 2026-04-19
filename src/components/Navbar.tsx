import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield, Activity, LogOut, User } from 'lucide-react';

interface NavbarProps {
  currentRole: string;
  isLoggedIn: boolean;
  onLogout: () => void;
}

export function Navbar({ currentRole, isLoggedIn, onLogout }: NavbarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    onLogout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="brand">
        <Activity size={28} color="var(--primary)" />
        <span className="text-gradient">HealthLock</span>
      </Link>

      <div className="nav-links">
        {/* <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
          Home
        </Link> */}
        {isLoggedIn && currentRole === 'PATIENT' && (
          <Link to="/patient" className={`nav-link ${location.pathname === '/patient' ? 'active' : ''}`}>
            Patient Portal
          </Link>
        )}
        {isLoggedIn && currentRole === 'DOCTOR' && (
          <Link to="/doctor" className={`nav-link ${location.pathname === '/doctor' ? 'active' : ''}`}>
            Provider Access
          </Link>
        )}
        {isLoggedIn && currentRole === 'DIAGNOSTICS' && (
          <Link to="/diagnostics" className={`nav-link ${location.pathname === '/diagnostics' ? 'active' : ''}`}>
            Diagnostics Lab
          </Link>
        )}
        {isLoggedIn && currentRole === 'ADMIN' && (
          <Link to="/admin" className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}>
            Admin Panel
          </Link>
        )}
      </div>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        {isLoggedIn ? (
          <>
            <div className="glass-panel" style={{ padding: '0.4rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
              <User size={14} color="var(--primary)" />
              <span style={{ color: 'var(--text-muted)' }}>Role:</span> {currentRole}
            </div>
            <button className="btn btn-danger" onClick={handleLogoutClick} style={{ padding: '0.5rem 1rem' }}>
              <LogOut size={16} /> Logout
            </button>
          </>
        ) : (
          <Link to="/login" className="btn btn-primary">
            <Shield size={16} /> Login
          </Link>
        )}
      </div>
    </nav>
  );
}
