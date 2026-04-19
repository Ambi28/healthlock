import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, User, Lock, ArrowRight, UserPlus, AlertCircle } from 'lucide-react';
import { healthApi } from '../utils/api';

interface LoginPageProps {
  onLogin: (role: string) => void;
}

const STAFF_NAMES: Record<string, string> = {
  'vinnu@health.com': 'Dr. Vinnu',
  'sony@health.com': 'Dr. Sony',
  'lalitha@health.com': 'Dr. Lalitha',
  'ambica@health.com': 'Ambica',
  'lab@health.com': 'Lab Technician',
};

export function LoginPage({ onLogin }: LoginPageProps) {
  const [role, setRole] = useState('PATIENT');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (role === 'PATIENT') {
        const result = await healthApi.login(username, role, password);
        if (result.success) {
          // Server-side rotation: archives old hash, issues new cryptographic token
          const rotation = await healthApi.rotateToken(
            result.user.patientId,
            result.user.name,
            'SESSION_LOGIN'
          );

          const updatedUser = { ...result.user, qrToken: rotation.newToken };
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));

          await healthApi.addLog({
            action: 'DYNAMIC_TOKEN_ROTATION',
            actor: result.user.name,
            details: `Cryptographic token rotated on login. Previous hash archived in patient ledger.`,
            targetId: result.user.patientId
          });

          onLogin(role);
          navigate('/patient');
        } else {
          setError(result.error || 'Incorrect Patient ID or password.');
        }
      } else {
        // Staff roles validated via backend
        const result = await healthApi.login(username, role, password);
        if (result.success) {
          localStorage.setItem('currentUser', JSON.stringify({ username, role, name: STAFF_NAMES[username] || username }));
          onLogin(role);
          await healthApi.addLog({
            action: 'STAFF_LOGIN',
            actor: username,
            details: `Secure staff login verified for role: ${role}`
          });

          const destination = role === 'DOCTOR' ? '/doctor' :
            role === 'DIAGNOSTICS' ? '/diagnostics' :
              role === 'ADMIN' ? '/admin' : '/';
          navigate(destination);
        } else {
          setError(result.error || 'Incorrect email or password for this role.');
        }
      }
    } catch (err) {
      setError('Connection failed. Please check backend.');
    }
  };

  return (
    <div className="hero" style={{ minHeight: 'calc(100vh - 80px)', justifyContent: 'center', padding: '2rem' }}>
      <motion.div
        className="glass-panel animate-fade-in"
        style={{ width: '100%', maxWidth: '450px', padding: '3rem' }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, var(--secondary), var(--primary))',
            margin: '0 auto 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 20px var(--primary-glow)'
          }}>
            <Shield size={32} color="white" />
          </div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Welcome Back</h1>
          <p style={{ color: 'var(--text-muted)' }}>Secure access to your medical ecosystem</p>
        </div>

        {error && (
          <div style={{ padding: '1rem', background: 'rgba(255, 61, 0, 0.1)', color: '#ff5252', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid rgba(255, 61, 0, 0.2)' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Access Role</label>
            <select
              className="form-control"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{ appearance: 'none', color: 'black', backgroundColor: 'white' }}
            >
              <option value="PATIENT" style={{ color: 'black', backgroundColor: 'white' }}>Patient (ID Login)</option>
              <option value="DOCTOR" style={{ color: 'black', backgroundColor: 'white' }}>Doctor (Email Login)</option>
              <option value="ADMIN" style={{ color: 'black', backgroundColor: 'white' }}>Administrator (Email Login)</option>
              <option value="DIAGNOSTICS" style={{ color: 'black', backgroundColor: 'white' }}>Diagnostics Lab (Email Login)</option>
            </select>
          </div>

          <div className="input-group">
            <label>Identity (Email or ID)</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-control"
                placeholder={role === 'PATIENT' ? 'Enter Patient ID' : 'Enter Email Address'}
                style={{ paddingLeft: '40px' }}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group" style={{ marginBottom: '2rem' }}>
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                style={{ paddingLeft: '40px' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1rem' }} type="submit">
            Sign In <ArrowRight size={18} />
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center', borderTop: '1px solid var(--border-glass)', paddingTop: '1.5rem' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>New to HealthLock?</p>
          <button
            className="btn btn-outline"
            style={{ width: '100%' }}
            onClick={() => navigate('/register')}
          >
            <UserPlus size={18} /> Create Patient Account
          </button>
        </div>
      </motion.div>
    </div>
  );
}
