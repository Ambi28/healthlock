import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Stethoscope, 
  FileText, 
  Eye, 
  Calendar, 
  Phone, 
  ShieldCheck, 
  Activity,
  Heart,
  Droplets,
  Zap,
  Lock,
  ArrowUpRight,
  Upload,
  Receipt,
  MessageSquare,
  AlertCircle,
  Loader2,
  QrCode,
  History
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { healthApi } from '../utils/api';

export function PatientDashboard() {
  const [patientData, setPatientData] = useState<any>(null);
  const [localReports, setLocalReports] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isRotating, setIsRotating] = useState(false);
  const [showRotateSuccess, setShowRotateSuccess] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (user.role === 'PATIENT') {
      fetchPatient(user.username);
      // Load locally stored reports/receipts
      const stored = localStorage.getItem(`reports_${user.username}`);
      if (stored) setLocalReports(JSON.parse(stored));

      // Real-time synchronization: Poll for token changes every 5 seconds
      // This ensures the QR updates immediately when a doctor consumes the one-time token
      const interval = setInterval(() => {
        fetchPatient(user.username);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, []);

  const saveLocalReport = (report: any) => {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const updated = [...localReports, report];
    setLocalReports(updated);
    if (user.username) {
      localStorage.setItem(`reports_${user.username}`, JSON.stringify(updated));
    }
  };

  const fetchPatient = async (pid: string) => {
    try {
      const [data, logs] = await Promise.all([
        healthApi.getPatientById(pid),
        healthApi.getLogsByPatient(pid)
      ]);
      
      if (data && !data.error) {
        setPatientData(data);
        setAuditLogs(logs || []);
      } else {
        setPatientData({ error: 'Patient not found' });
      }
    } catch (err) {
      setPatientData({ error: 'Connection failed' });
    }
  };

  const handleRotateToken = async () => {
    if (!patientData || isRotating) return;
    setIsRotating(true);
    try {
      const result = await healthApi.rotateToken(patientData.patientId, 'PATIENT', 'MANUAL_ROTATION');
      if (result.success) {
        await fetchPatient(patientData.patientId);
        // Log the rotation activity
        await healthApi.addLog({
          action: 'TOKEN_ROTATED_MANUALLY',
          details: `Patient manual token rotation triggered. New token generated: ${result.newToken}`,
          actor: 'PATIENT',
          targetId: patientData.patientId
        });
        setShowRotateSuccess(true);
        setTimeout(() => setShowRotateSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to rotate token:', err);
    } finally {
      setIsRotating(false);
    }
  };

  if (!patientData) return (
    <div style={{ textAlign: 'center', padding: '10rem', color: 'var(--primary)' }}>
       <Loader2 className="spin-slow" size={48} style={{ margin: '0 auto 2rem' }} />
       <h2>Establishing Secure Connection...</h2>
    </div>
  );

  if (patientData.error) return (
    <div style={{ textAlign: 'center', padding: '10rem', color: 'var(--warning)' }}>
       <AlertCircle size={48} style={{ margin: '0 auto 2rem' }} />
       <h2>Access Denied</h2>
       <p>{patientData.error}</p>
       <button className="btn btn-primary" style={{ marginTop: '2rem' }} onClick={() => {
         const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
         if (user.username) fetchPatient(user.username);
       }}>Retry Sync</button>
    </div>
  );

  const CardWrapper = ({ children, title, icon: Icon, color, subtitle }: any) => (
    <motion.div 
      className="glass-panel" 
      style={{ padding: '2rem', height: '100%', position: 'relative', overflow: 'hidden' }}
      whileHover={{ y: -8 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ 
            background: `${color}15`, 
            padding: '0.75rem', 
            borderRadius: '12px',
            color: color,
            border: `1px solid ${color}30`
          }}>
            <Icon size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', letterSpacing: '-0.01em' }}>{title}</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{subtitle}</p>
          </div>
        </div>
        <ArrowUpRight size={18} color="var(--text-muted)" />
      </div>
      {children}
    </motion.div>
  );

  return (
    <div className="container animate-fade-in" style={{ paddingTop: '3rem', paddingBottom: '6rem' }}>
      {/* Header Profile Section */}
      <section style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4rem' }}>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <div style={{ 
            width: '100px', height: '100px', borderRadius: '30px', 
            background: 'linear-gradient(135deg, var(--secondary), var(--primary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 30px var(--primary-glow)'
          }}>
            <User color="white" size={48} />
          </div>
          <div>
            <h1 style={{ fontSize: '2.8rem', marginBottom: '0.5rem' }}>
              Welcome, <span className="text-gradient">{patientData.name}</span>
            </h1>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
               <span className="badge badge-primary">ID: {patientData.patientId}</span>
               <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ShieldCheck size={16} color="var(--success)" /> Blockchain Verified Record
               </span>
            </div>
          </div>
        </div>
        
        <div className="glass-panel" style={{ padding: '1rem 2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>SECURITY CLEARANCE</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--success)', fontWeight: 700 }}>
             <Lock size={16} /> LEVEL 4 ACCESS
          </div>
        </div>
      </section>

      {/* Security Token / QR Code Section */}
      <section className="glass-panel" style={{ padding: '2rem', marginBottom: '4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '3rem', border: '1px solid var(--primary-glow)' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ padding: '0.6rem', borderRadius: '10px', background: 'rgba(0, 240, 255, 0.1)', color: 'var(--primary)' }}>
              <QrCode size={20} />
            </div>
            <h2 style={{ fontSize: '1.5rem' }}>One-Time Security QR</h2>
          </div>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            Show this QR code to your medical practitioner to grant them <strong style={{ color: 'var(--primary)' }}>one-time</strong> access to your encrypted health records. The code refreshes automatically after each use.
          </p>
          <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ padding: '0.75rem 1.25rem', background: 'rgba(0,240,255,0.05)', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Security Version</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>
                v{(patientData.tokenHistory ? patientData.tokenHistory.length : 0) + 1}
              </div>
            </div>
            <div style={{ padding: '0.75rem 1.25rem', background: 'rgba(16,185,129,0.05)', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Current Status</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--success)' }}>🟢 Active</div>
            </div>
            <div style={{ padding: '0.75rem 1.25rem', background: 'rgba(112,0,255,0.05)', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Token Type</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--secondary)', fontFamily: 'monospace' }}>AES-256 Hash</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <button 
              className="btn btn-primary" 
              style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem 1.5rem' }}
              onClick={handleRotateToken}
              disabled={isRotating}
            >
              {isRotating ? <Loader2 className="spin" size={18} /> : <Zap size={18} />}
              Regenerate Secure Token
            </button>
            {showRotateSuccess && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                style={{ color: 'var(--success)', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <ShieldCheck size={16} /> Database Updated
              </motion.div>
            )}
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
          <div style={{ 
            background: 'white', 
            padding: '1.5rem', 
            borderRadius: '24px', 
            boxShadow: '0 20px 50px rgba(0, 240, 255, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            {patientData.qrToken && (
              <QRCodeSVG 
                value={patientData.qrToken}
                size={140} 
                level="H" 
              />
            )}
            <div style={{ marginTop: '1rem', color: '#000', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '1px' }}>HEALTHLOCK SECURE ID</div>
            <div style={{ fontSize: '0.6rem', color: '#666', marginTop: '0.25rem' }}>One-Time Use Only</div>
          </div>
          
          <div style={{ 
            marginTop: '1.5rem',
            padding: '0.75rem 2rem', 
            background: 'var(--primary)', 
            borderRadius: '12px', 
            boxShadow: '0 0 20px var(--primary-glow)',
            fontFamily: 'monospace',
            fontSize: '1rem',
            color: 'black',
            fontWeight: '900',
            letterSpacing: '2px',
            textAlign: 'center',
            minWidth: '200px'
          }}>
            {patientData.qrToken || 'TOKEN-NOT-FOUND'}
          </div>
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '2rem' }}>
        
        {/* Personal Vitals Card */}
        <CardWrapper title="System Vitals" subtitle="Real-time Health Telemetry" icon={Zap} color="var(--primary)">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', textAlign: 'center' }}>
               <Heart color="var(--accent)" size={18} style={{ marginBottom: '0.5rem' }} />
               <div style={{ fontSize: '2rem', fontWeight: 800 }}>74</div>
               <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>BPM</div>
            </div>
            <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', textAlign: 'center' }}>
               <Droplets color="var(--primary)" size={18} style={{ marginBottom: '0.5rem' }} />
               <div style={{ fontSize: '2rem', fontWeight: 800 }}>B+</div>
               <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>BLOOD TYPE</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '12px' }}>
             <Activity size={20} color="var(--success)" />
             <div style={{ fontSize: '0.85rem' }}>Heart rate and Blood pressure within optimal range.</div>
          </div>
        </CardWrapper>

        {/* Doctor Details */}
        <CardWrapper title="Care Provider" subtitle="Assigned Practitioner" icon={Stethoscope} color="var(--secondary)">
           <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-glass)' }}>
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                 <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    <User size={28} />
                 </div>
                 <div>
                    <h4 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{patientData.doctor?.name || 'Dr. VINNU'}</h4>
                    <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>{patientData.doctor?.id || 'DOC-SEC-101'}</span>
                 </div>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>{patientData.doctor?.specialty || 'General Practitioner & Health Analyst'}</p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                 <button className="btn btn-primary" style={{ flex: 2, padding: '0.6rem' }}><Phone size={14} /> Contact</button>
                 <button className="btn btn-outline" style={{ flex: 1, padding: '0.6rem' }}><Activity size={14} /></button>
              </div>
           </div>
        </CardWrapper>

        {/* Diagnostic Reports */}
        <CardWrapper title="Latest Reports" subtitle="Encrypted Lab Results" icon={FileText} color="var(--success)">
           <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[...(patientData.reports || []), ...localReports].map((report: any, idx: number) => (
                <div key={idx} className="glass-panel" style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: 'none', background: 'rgba(255,255,255,0.02)' }}>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', marginBottom: '0.2rem' }}>{report.name}</h4>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{report.date ? new Date(report.date).toLocaleDateString() : 'Self-Uploaded'} • {report.type || 'Verified'}</p>
                  </div>
                  <button 
                    style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}
                    onClick={() => window.open(report.url || 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf', '_blank')}
                  >
                    <Eye size={20} />
                  </button>
                </div>
              ))}
           </div>
        </CardWrapper>

        {/* Medical History */}
        <CardWrapper title="Medical Timeline" subtitle="Immutable Health Ledger" icon={Calendar} color="var(--warning)">
           <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {(patientData.history || patientData.visits || []).map((visit: any, i: number) => (
                <div key={i} style={{ display: 'flex', gap: '1.25rem' }}>
                   <div style={{ textAlign: 'center', minWidth: '45px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--warning)', fontWeight: 800 }}>
                        {visit.date ? new Date(visit.date).toLocaleString('default', { month: 'short' }).toUpperCase() : 'MEM'}
                      </div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                        {visit.date ? new Date(visit.date).getDate() : (12 + i)}
                      </div>
                   </div>
                   <div style={{ paddingLeft: '1.25rem', borderLeft: '2px solid var(--border-glass)', position: 'relative' }}>
                      <div style={{ position: 'absolute', width: '10px', height: '10px', background: 'var(--warning)', borderRadius: '50%', left: '-6px', top: '5px' }} />
                      <h4 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{visit.purpose || visit.action}</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{visit.location || visit.details}</p>
                   </div>
                </div>
              ))}
           </div>
        </CardWrapper>

        {/* 1. Manual Lab Report Upload */}
        <CardWrapper title="Previous Lab Reports" subtitle="Self-Managed History" icon={Upload} color="var(--primary)">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
             <div 
                className="upload-area" 
                style={{ padding: '1.5rem', borderStyle: 'dashed', borderRadius: '16px', background: 'rgba(0, 240, 255, 0.02)', cursor: 'pointer' }}
                onClick={() => document.getElementById('lab-upload')?.click()}
             >
                <div style={{ textAlign: 'center' }}>
                  <Upload size={24} color="var(--primary)" style={{ marginBottom: '0.75rem' }} />
                  <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>Click to upload Previous Lab PDF</p>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Supported: PDF, JPG, PNG</p>
                </div>
                <input type="file" id="lab-upload" hidden accept=".pdf,.png,.jpg" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) saveLocalReport({ name: file.name, date: new Date(), type: 'LAB_HISTORY' });
                }} />
             </div>
             <div 
                style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid var(--border-glass)', cursor: 'pointer' }}
                onClick={() => window.open('https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf', '_blank')}
             >
                <FileText size={14} color="var(--primary)" />
                <span>My_Last_Surgery_Report.pdf</span>
             </div>
          </div>
        </CardWrapper>

        {/* 2. Medical Receipts Upload */}
        <CardWrapper title="Medical Receipts" subtitle="Billing & Insurance Docs" icon={Receipt} color="var(--secondary)">
           <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
             <div 
                className="upload-area" 
                style={{ padding: '1.5rem', borderStyle: 'dashed', borderRadius: '16px', background: 'rgba(112, 0, 255, 0.02)', cursor: 'pointer' }}
                onClick={() => document.getElementById('receipt-upload')?.click()}
             >
                <div style={{ textAlign: 'center' }}>
                  <Receipt size={24} color="var(--secondary)" style={{ marginBottom: '0.75rem' }} />
                  <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>Upload Medical Bills</p>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Helpful for claims and history</p>
                </div>
                <input type="file" id="receipt-upload" hidden accept=".pdf,.png,.jpg" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) saveLocalReport({ name: file.name, date: new Date(), type: 'RECEIPT' });
                }} />
             </div>
             <div 
                style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid var(--border-glass)', cursor: 'pointer' }}
                onClick={() => window.open('https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf', '_blank')}
             >
                <FileText size={14} color="var(--secondary)" />
                <span>Hospital_Invoice_2025.pdf</span>
             </div>
          </div>
        </CardWrapper>

        {/* 3. Health Problems Entry */}
        <CardWrapper title="Health Profile" subtitle="Manual Condition Log" icon={AlertCircle} color="#ff4757">
           <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>PAST HEALTH ISSUES / ALLERGIES</label>
              <textarea 
                className="form-control" 
                style={{ minHeight: '100px', padding: '1rem', background: 'rgba(0,0,0,0.2)', fontSize: '0.9rem', borderRadius: '12px', resize: 'none' }}
                placeholder="List any chronic conditions, allergies, or past surgeries here..."
                defaultValue="Slight dust allergy. Appendectomy in 2018."
              />
              <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%' }}>
                 <ShieldCheck size={16} /> Update Health Profile
              </button>
           </div>
        </CardWrapper>

        {/* 4. Doctor Assessment Reports */}
        <CardWrapper title="Doctor Assessments" subtitle="Clinical Descriptions" icon={MessageSquare} color="var(--success)">
           <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.03)', padding: '1.25rem', borderRadius: '16px', borderLeft: '4px solid var(--success)', position: 'relative' }}>
                 <div style={{ position: 'absolute', top: '1rem', right: '1rem', opacity: 0.1 }}>
                    <Stethoscope size={40} />
                 </div>
                 <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--success)', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>LATEST FROM DR. VINNU</p>
                 <p style={{ fontSize: '0.95rem', lineHeight: 1.6, color: 'white' }}>
                   "Patient shows good recovery. Recommended moderate exercise and low-carb diet. Verified all current vitals as stable."
                 </p>
                 <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Timestamp: 12 Feb 2026 • Block: #88421
                 </div>
              </div>
           </div>
        </CardWrapper>

      </div>

      {/* 5. Security & Access Audit Log */}
      <section className="glass-panel" style={{ marginTop: '4rem', padding: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
             <div style={{ padding: '0.6rem', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
               <ShieldCheck size={20} />
             </div>
             <h2 style={{ fontSize: '1.5rem' }}>Security & Access Log</h2>
          </div>
          <span className="badge badge-success">Encrypted Ledger</span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
           {auditLogs.length > 0 ? auditLogs.map((log, idx) => (
             <div key={idx} style={{ 
               display: 'flex', 
               justifyContent: 'space-between', 
               alignItems: 'center', 
               padding: '1.25rem 2rem', 
               background: 'rgba(255,255,255,0.02)', 
               borderRadius: '12px',
               border: '1px solid var(--border-glass)'
             }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                 <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                   {new Date(log.timestamp).toLocaleTimeString()}
                 </div>
                 <div>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: 800, 
                      color: log.action.includes('GRANTED') ? 'var(--success)' : log.action.includes('DENIED') ? 'var(--warning)' : 'var(--primary)',
                      marginRight: '1rem',
                      textTransform: 'uppercase'
                    }}>
                      {log.action.replace(/_/g, ' ')}
                    </span>
                    <span style={{ fontSize: '0.9rem', color: 'white' }}>{log.details}</span>
                 </div>
               </div>
               <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                 Ref: {log.actor}
               </div>
             </div>
           )) : (
             <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                <History size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                <p>No recent security activities detected.</p>
             </div>
           )}
        </div>
      </section>
    </div>
  );
}
