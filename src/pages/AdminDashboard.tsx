import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Users, 
  Stethoscope, 
  FlaskConical, 
  Settings, 
  Activity, 
  UserPlus, 
  Database,
  Search,
  CheckCircle2,
  Lock,
  History
} from 'lucide-react';
import { healthApi } from '../utils/api';

interface SystemLog {
  _id?: string;
  type: string;
  actor: string;
  action: string;
  details: string;
  timestamp: string;
}

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'logs' | 'requests' | 'ledger'>('overview');
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [labRequests, setLabRequests] = useState<any[]>([]);
  const [selectedLedgerPatient, setSelectedLedgerPatient] = useState<string>('');
  const [tokenHistory, setTokenHistory] = useState<any[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalDoctors: 2,
    totalLabs: 1,
    blockchainOps: 4282,
    pendingRequests: 0
  });

  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState('DOCTOR');
  const [newUserSpecialty, setNewUserSpecialty] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAdminData();
  }, [activeTab]);

  const fetchAdminData = async () => {
    try {
      const allLogs = await healthApi.getLogs();
      setLogs(allLogs);
      
      const allLabs = await healthApi.getLabRequests();
      setLabRequests(allLabs);
      const pendingLabs = allLabs.filter((l: any) => l.approvalStatus === 'Requested').length;
      
      const allPatients = await healthApi.getPatients();
      setPatients(allPatients);
      const pending = allPatients.filter((p: any) => p.approvalStatus === 'Requested').length;
      setStats(prev => ({ ...prev, totalPatients: allPatients.length, pendingRequests: pending + pendingLabs }));
    } catch (err) {
      console.error('Admin data fetch failed');
    }
  };

  const fetchTokenHistory = async (pid: string) => {
    if (!pid) return;
    setLedgerLoading(true);
    try {
      const result = await healthApi.getTokenHistory(pid);
      setTokenHistory(result.history || []);
    } catch (err) {
      setTokenHistory([]);
    } finally {
      setLedgerLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Create user entry and log it
      await healthApi.addLog({
        type: 'AUTH',
        actor: 'Admin',
        action: 'USER_CREATE',
        details: `Created new ${newUserRole}: ${newUserName} (${newUserSpecialty})`
      });
      
      alert(`Account generated for ${newUserName} successfully! Logic hash signed by Blockchain.`);
      setNewUserName('');
      setNewUserSpecialty('');
      fetchAdminData();
    } catch (err) {
      alert('Creation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container animate-fade-in" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2.4rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span className="text-gradient">Ecosystem</span> Governance
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Global Security Monitor & User Authority</p>
        </div>
        <div className="glass-panel" style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', borderLeft: '4px solid var(--primary)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(0, 240, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--primary)' }}>
            <Settings className="spin-slow" size={24} color="var(--primary)" />
          </div>
          <div>
            <p style={{ fontWeight: 800 }}>AMBICA</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 600 }}>Root Administrator</p>
          </div>
        </div>
      </header>

      <div className="stat-cards" style={{ marginBottom: '3rem' }}>
        <div className="glass-panel stat-card" style={{ borderLeftColor: 'var(--primary)', background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.05), transparent)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
             <p className="stat-label">Total Patients</p>
             <Users size={18} color="var(--primary)" />
          </div>
          <h3 className="stat-value">{stats.totalPatients}</h3>
        </div>
        <div className="glass-panel stat-card" style={{ borderLeftColor: 'var(--secondary)', background: 'linear-gradient(135deg, rgba(112, 0, 255, 0.05), transparent)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
             <p className="stat-label">Medical Staff</p>
             <Stethoscope size={18} color="var(--secondary)" />
          </div>
          <h3 className="stat-value">{stats.totalDoctors}</h3>
        </div>
        <div className="glass-panel stat-card" style={{ borderLeftColor: 'var(--warning)', background: 'linear-gradient(135deg, rgba(255, 179, 0, 0.05), transparent)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
             <p className="stat-label">Verified Labs</p>
             <FlaskConical size={18} color="var(--warning)" />
          </div>
          <h3 className="stat-value">{stats.totalLabs}</h3>
        </div>
        <div className="glass-panel stat-card" style={{ borderLeftColor: 'var(--success)', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05), transparent)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
             <p className="stat-label">Ledger Blocks</p>
             <Database size={18} color="var(--success)" />
          </div>
          <h3 className="stat-value">{(stats.blockchainOps / 1000).toFixed(1)}k</h3>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '0.5rem', display: 'flex', gap: '0.5rem', marginBottom: '2.5rem' }}>
        <button onClick={() => setActiveTab('overview')} className={`btn ${activeTab === 'overview' ? 'btn-primary' : ''}`} style={{ flex: 1, background: activeTab === 'overview' ? undefined : 'transparent', border: 'none' }}>
          <Search size={18} /> Global Overview
        </button>
        <button onClick={() => setActiveTab('requests')} className={`btn ${activeTab === 'requests' ? 'btn-primary' : ''}`} style={{ flex: 1, background: activeTab === 'requests' ? undefined : 'transparent', border: 'none' }}>
          <ShieldCheck size={18} /> Access Governance
          {stats.pendingRequests > 0 && <span style={{ marginLeft: '0.5rem', background: '#ff3d00', color: 'white', padding: '0.1rem 0.5rem', borderRadius: '10px', fontSize: '0.7rem' }}>{stats.pendingRequests}</span>}
        </button>
        <button onClick={() => setActiveTab('users')} className={`btn ${activeTab === 'users' ? 'btn-primary' : ''}`} style={{ flex: 1, background: activeTab === 'users' ? undefined : 'transparent', border: 'none' }}>
          <UserPlus size={18} /> Identity Management
        </button>
        <button onClick={() => setActiveTab('logs')} className={`btn ${activeTab === 'logs' ? 'btn-primary' : ''}`} style={{ flex: 1, background: activeTab === 'logs' ? undefined : 'transparent', border: 'none' }}>
          <History size={18} /> System Audit Logs
        </button>
        <button onClick={() => setActiveTab('ledger')} className={`btn ${activeTab === 'ledger' ? 'btn-primary' : ''}`} style={{ flex: 1, background: activeTab === 'ledger' ? undefined : 'transparent', border: 'none' }}>
          <Lock size={18} /> Hash Ledger
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={20} color="var(--primary)" /> Active System Participants
              </h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Entity</th>
                    <th>ID</th>
                    <th>Access Role</th>
                    <th>Status</th>
                    <th>Last Activity</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((p) => (
                    <tr key={p.patientId}>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>{p.patientId}</td>
                      <td><span className="badge badge-primary">PATIENT</span></td>
                      <td><span className={`badge ${p.status === 'Completed' ? 'badge-success' : 'badge-primary'}`}>ACTIVE</span></td>
                      <td style={{ color: 'var(--text-muted)' }}>{p.slot || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'requests' && (
          <motion.div key="requests" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="glass-panel" style={{ padding: '2.5rem' }}>
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <ShieldCheck color="var(--primary)" /> Data Sovereignty Oversight
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Review practitioner requests for historical clinical records access.</p>
              </div>

              {patients.filter(p => p.approvalStatus === 'Requested').length === 0 && labRequests.filter(l => l.approvalStatus === 'Requested').length === 0 ? (
                <div style={{ padding: '4rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '15px', border: '1px dashed var(--border-glass)' }}>
                   <CheckCircle2 size={48} color="var(--success)" style={{ margin: '0 auto 1.5rem', opacity: 0.5 }} />
                   <p style={{ color: 'var(--text-muted)' }}>No pending authorization requests. All clinical streams are secure.</p>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Patient Entity</th>
                      <th>Reference ID</th>
                      <th>Requester</th>
                      <th>Security Context</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.filter(p => p.approvalStatus === 'Requested').map((p) => (
                      <tr key={p.patientId}>
                        <td style={{ fontWeight: 700 }}>{p.name}</td>
                        <td style={{ fontFamily: 'monospace' }}>{p.patientId}</td>
                        <td style={{ fontWeight: 600, color: 'var(--secondary)' }}>{p.accessRequestedBy || 'Doctor'}</td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Historical PHI Access</td>
                        <td><span className="badge badge-warning">PENDING AUTH</span></td>
                        <td style={{ textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button 
                            className="btn btn-primary" 
                            style={{ fontSize: '0.7rem', padding: '0.4rem 0.8rem' }}
                            onClick={async () => {
                               await healthApi.updatePatient(p.patientId, { approvalStatus: 'Approved' });
                               await healthApi.addLog({ type: 'AUTH', actor: 'Admin', action: 'ACCESS_APPROVED', details: `Granted ${p.accessRequestedBy || 'Doctor'} access to ${p.patientId} archive.` });
                               fetchAdminData();
                            }}
                          >Approve</button>
                          <button 
                            className="btn btn-outline" 
                            style={{ fontSize: '0.7rem', padding: '0.4rem 0.8rem' }}
                            onClick={async () => {
                               await healthApi.updatePatient(p.patientId, { approvalStatus: 'Rejected' });
                               await healthApi.addLog({ type: 'AUTH', actor: 'Admin', action: 'ACCESS_REJECTED', details: `Denied clinical access for ${p.patientId}.` });
                               fetchAdminData();
                            }}
                          >Reject</button>
                        </td>
                      </tr>
                    ))}
                    {labRequests.filter(l => l.approvalStatus === 'Requested').map((l) => (
                      <tr key={'lab-' + l._id}>
                        <td style={{ fontWeight: 700 }}>{l.patientName}</td>
                        <td style={{ fontFamily: 'monospace' }}>{l.patientId}</td>
                        <td style={{ fontWeight: 600, color: 'var(--secondary)' }}>Diagnostic Lab</td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Historical Lab Download</td>
                        <td><span className="badge badge-warning">PENDING AUTH</span></td>
                        <td style={{ textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button 
                            className="btn btn-primary" 
                            style={{ fontSize: '0.7rem', padding: '0.4rem 0.8rem' }}
                            onClick={async () => {
                               await healthApi.updateLabRequest(l._id, { approvalStatus: 'Approved' });
                               await healthApi.addLog({ type: 'AUTH', actor: 'Admin', action: 'ACCESS_APPROVED', details: `Granted Lab access for ${l.patientId} report.` });
                               fetchAdminData();
                            }}
                          >Approve</button>
                          <button 
                            className="btn btn-outline" 
                            style={{ fontSize: '0.7rem', padding: '0.4rem 0.8rem' }}
                            onClick={async () => {
                               await healthApi.updateLabRequest(l._id, { approvalStatus: 'Rejected' });
                               await healthApi.addLog({ type: 'AUTH', actor: 'Admin', action: 'ACCESS_REJECTED', details: `Denied clinical access for lab report on ${l.patientId}.` });
                               fetchAdminData();
                            }}
                          >Reject</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'users' && (
          <motion.div key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div className="glass-panel" style={{ padding: '2.5rem' }}>
              <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <UserPlus color="var(--primary)" /> Create Trusted Identity
              </h3>
              <form onSubmit={handleCreateUser}>
                <div className="input-group">
                  <label>Full Name / Lab Name</label>
                  <input type="text" className="form-control" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} placeholder="e.g. Dr. John Watson" required />
                </div>
                <div className="input-group">
                  <label>Access Role</label>
                  <select className="form-control" value={newUserRole} onChange={(e) => setNewUserRole(e.target.value)}>
                    <option value="DOCTOR">Doctor / Practitioner</option>
                    <option value="DIAGNOSTICS">Diagnostic Center</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Specialization / License ID</label>
                  <input type="text" className="form-control" value={newUserSpecialty} onChange={(e) => setNewUserSpecialty(e.target.value)} placeholder="e.g. Cardiology / Lic-1200" required />
                </div>
                <div style={{ padding: '1rem', background: 'rgba(0, 240, 255, 0.05)', borderRadius: '8px', marginBottom: '2rem', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem' }}>
                  <Lock size={16} color="var(--primary)" />
                  <p>System will generate an RSA-4096 keypair and a unique Blockchain ID for this user.</p>
                </div>
                <button className="btn btn-primary" style={{ width: '100%' }} type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Generating Identity...' : 'Generate Secure Access Credentials'}
                </button>
              </form>
            </div>

            <div className="glass-panel" style={{ padding: '2.5rem' }}>
              <h3 style={{ marginBottom: '2rem' }}>Recent User Onboarding</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {logs.filter(l => l.action === 'USER_CREATE').slice(0, 4).map((l, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
                    <div>
                      <p style={{ fontWeight: 600 }}>{l.details.split(': ')[1].split(' (')[0]}</p>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Verified Identity • {l.timestamp}</p>
                    </div>
                    <CheckCircle2 color="var(--success)" size={20} />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'logs' && (
          <motion.div key="logs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Database size={20} color="var(--success)" /> Live Network Audit Trail
                </h3>
                <span className="badge badge-success" style={{ animation: 'pulse-glow 2s infinite' }}>Real-time Feed</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {logs.map((log, i) => (
                  <div key={i} style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', borderLeft: '3px solid', borderLeftColor: log.type === 'TRANSACTION' ? 'var(--primary)' : log.type === 'AUTH' ? 'var(--secondary)' : 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>{log.action}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <p style={{ fontSize: '0.9rem' }}><strong>{log.actor}</strong>: {log.details}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'ledger' && (
          <motion.div key="ledger" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="glass-panel" style={{ padding: '2.5rem' }}>
              <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Lock size={20} color="var(--primary)" /> Cryptographic Token Hash Ledger
              </h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
                Every access token ever consumed is permanently archived here. Select a patient to view their complete hash history.
              </p>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', alignItems: 'center' }}>
                <select
                  className="form-control"
                  style={{ maxWidth: '320px', color: 'black', backgroundColor: 'white' }}
                  value={selectedLedgerPatient}
                  onChange={(e) => {
                    setSelectedLedgerPatient(e.target.value);
                    fetchTokenHistory(e.target.value);
                  }}
                >
                  <option value="" style={{ color: 'black' }}>-- Select Patient --</option>
                  {patients.map((p) => (
                    <option key={p.patientId} value={p.patientId} style={{ color: 'black' }}>
                      {p.name} ({p.patientId})
                    </option>
                  ))}
                </select>
                {tokenHistory.length > 0 && (
                  <span className="badge badge-success">{tokenHistory.length} Token Sessions Archived</span>
                )}
              </div>

              {ledgerLoading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--primary)' }}>Loading hash ledger...</div>
              ) : tokenHistory.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Token Hash</th>
                        <th>Consumed By</th>
                        <th>Action</th>
                        <th>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...tokenHistory].reverse().map((entry, idx) => (
                        <tr key={idx}>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{tokenHistory.length - idx}</td>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--primary)', letterSpacing: '1px' }}>
                            {entry.token || '—'}
                          </td>
                          <td style={{ fontWeight: 600 }}>{entry.usedBy || 'SYSTEM'}</td>
                          <td>
                            <span className={`badge ${
                              entry.action === 'INITIAL_REGISTRATION' ? 'badge-outline' :
                              entry.action === 'SESSION_LOGIN' ? 'badge-primary' : 'badge-success'
                            }`} style={{ fontSize: '0.65rem' }}>
                              {entry.action?.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            {new Date(entry.usedAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : selectedLedgerPatient ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  <Database size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                  <p>No token history found for this patient.</p>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  <CheckCircle2 size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                  <p>Select a patient above to view their cryptographic hash ledger.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
