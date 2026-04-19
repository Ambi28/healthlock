import { motion } from 'framer-motion';
import { Shield, Lock, Activity, ArrowRight, Zap, Globe, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Home() {
  const navigate = useNavigate();

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="hero" style={{ padding: '8rem 2rem 6rem' }}>
        <motion.div 
          className="hero-badge"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Zap size={14} style={{ marginRight: '0.5rem' }} /> Next-Gen Health Ecosystem
        </motion.div>
        
        <motion.h1 
          className="hero-title"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
        >
          Secure Your <span className="text-gradient">Medical Future</span> with Blockchain
        </motion.h1>
        
        <motion.p 
          className="hero-subtitle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          HealthLock empowers patients, doctors, and diagnostics labs with an immutable, encrypted, and efficient platform for medical data exchange.
        </motion.p>
        
        <motion.div 
          style={{ display: 'flex', gap: '1.5rem' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <button className="btn btn-primary" onClick={() => navigate('/login')}>
            Get Started Now <ArrowRight size={18} />
          </button>
          <button className="btn btn-outline" onClick={() => navigate('/login')}>
            Documentation
          </button>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="container" style={{ paddingBottom: '8rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Global Security Standards</h2>
          <p style={{ color: 'var(--text-muted)' }}>Advanced architecture for sensitive medical environments</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          {[
            { 
              icon: <Lock color="var(--primary)" />, 
              title: 'AES-256 Encryption', 
              desc: 'High-grade client-side encryption ensures only you and your doctor can access your data.' 
            },
            { 
              icon: <Database color="var(--secondary)" />, 
              title: 'IPFS Storage', 
              desc: 'Decentralized document storage prevents single points of failure and data loss.' 
            },
            { 
              icon: <Shield color="var(--success)" />, 
              title: 'Audit Logging', 
              desc: 'Every interaction is recorded on the blockchain for permanent, immutable accountability.' 
            },
          ].map((feature, i) => (
            <motion.div 
              key={i}
              className="glass-panel" 
              style={{ padding: '2.5rem' }}
              whileHover={{ y: -10 }}
            >
              <div style={{ marginBottom: '1.5rem' }}>{feature.icon}</div>
              <h3 style={{ marginBottom: '1rem' }}>{feature.title}</h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Trust Section */}
      <section style={{ background: 'rgba(255,255,255,0.02)', padding: '6rem 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-around', opacity: 0.5 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><Globe size={20}/> GLOBAL NETWORK</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><Activity size={20}/> 99.9% UPTIME</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><Shield size={20}/> HIPAA COMPLIANT</div>
        </div>
      </section>
    </div>
  );
}
