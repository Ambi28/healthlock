import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Calendar,
  X,
  History,
  Lock,
  ShieldCheck,
  Activity,
  Eye,
  Clock,
  Users,
  AlertCircle
} from 'lucide-react';
import { healthApi } from '../utils/api';

interface PatientReport {
  name: string;
  date: string;
  url: string;
  status?: string;
}

interface PatientDetail {
  patientId: string;
  name: string;
  phone: string;
  slot: string;
  status: string;
  approvalStatus?: string;
  completedDate?: string;
  reports?: PatientReport[];
}

interface User {
  username: string;
  role: string;
  name: string;
}

interface ActivityLog {
  action: string;
  details: string;
  timestamp: string;
}

export function DoctorDashboard() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'previous' | 'activity'>('upcoming');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [patients, setPatients] = useState<PatientDetail[]>([]);
  const [previousPatients, setPreviousPatients] = useState<PatientDetail[]>([]);

  useEffect(() => {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) setCurrentUser(JSON.parse(userStr));
  }, []);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      const allPatients = await healthApi.getPatients();
      setPatients(allPatients.filter((p: PatientDetail) => p.status !== 'Completed'));
      setPreviousPatients(allPatients.filter((p: PatientDetail) => p.status === 'Completed'));

      const allLogs = await healthApi.getLogs();
      setLogs(allLogs);
    } catch (err) {
      console.error('Failed to fetch data from backend', err);
    }
  };

  const addLog = async (action: string, details: string, targetId?: string) => {
    try {
      const actorName = currentUser?.name || 'Doctor';
      await healthApi.addLog({ action, details, actor: actorName, targetId });
      const allLogs = await healthApi.getLogs();
      setLogs(allLogs);
    } catch (err) {
      console.error('Failed to log activity', err);
    }
  };



  const handleRequestAccess = async (pid: string) => {
    try {
      const actorName = currentUser?.name || 'Doctor';
      await healthApi.updatePatient(pid, { approvalStatus: 'Requested', accessRequestedBy: actorName });
      await addLog('ACCESS_REQUESTED', `Access request sent to Admin for history of ${pid}`, pid);
      fetchData();
    } catch (err) {
      alert('Failed to send request');
    }
  };

  const sortedPatients = useMemo(() => {
    return [...patients].sort((a, b) => (a.slot || '').localeCompare(b.slot || ''));
  }, [patients]);

  const [selectedPatient, setSelectedPatient] = useState<PatientDetail | null>(null);
  const [showModal, setShowModal] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [nextDate, setNextDate] = useState('');
  const [precautions, setPrecautions] = useState<string[]>([]);
  const [viewingPdf, setViewingPdf] = useState<string | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verifyingPatient, setVerifyingPatient] = useState<PatientDetail | null>(null);
  const [enteredToken, setEnteredToken] = useState('');
  const [verificationError, setVerificationError] = useState('');

  const handleOpenPatient = async (patient: PatientDetail) => {
    // For previous patients, check admin approval and implement One-Time View
    if (activeTab === 'previous') {
      if (patient.approvalStatus === 'Approved') {
        // Bypass token verification for approved historical records
        setSelectedPatient(patient);
        setShowModal(true);
        setViewingPdf(null);
        setPrecautions([]);
        
        // Single-Use Logic: Reset approval status immediately after opening
        try {
          await healthApi.updatePatient(patient.patientId, { approvalStatus: 'None' });
          await addLog('ONE_TIME_ACCESS', `One-time view session consumed for ${patient.name} history.`, patient.patientId);
          // Refresh list in background so it updates visually once modal closes
          fetchData();
        } catch (err) {
          console.error('Failed to reset one-time access status');
        }
        return;
      } else {
        alert('Access Restricted: Admin approval pending or session expired');
        return;
      }
    }

    // For upcoming patients, keep regular token verification
    setVerifyingPatient(patient);
    setShowVerificationModal(true);
    setEnteredToken('');
    setVerificationError('');
  };

  const handleVerifyToken = async () => {
    if (!verifyingPatient) return;
    try {
      const response = await healthApi.verifyPatientToken(verifyingPatient.patientId, enteredToken.trim());
      if (response.success) {
        setShowVerificationModal(false);
        setSelectedPatient(response.patient);
        setShowModal(true);
        setPrecautions([]);
        setViewingPdf(null);

        // ONE-TIME-USE ENFORCEMENT: Immediately rotate token after successful access
        // The old hash is archived in tokenHistory, a new cryptographic token is issued
        await healthApi.rotateToken(
          verifyingPatient.patientId,
          currentUser?.name || 'Doctor',
          'CLINICAL_ACCESS_CONSUMED'
        );

        await addLog(
          'ACCESS_GRANTED',
          `Clinical access verified for ${verifyingPatient.name}. Token consumed & rotated.`,
          verifyingPatient.patientId
        );
      } else {
        setVerificationError(response.error || 'Invalid or already-used access token.');
        await addLog('ACCESS_DENIED', `Failed token attempt for ${verifyingPatient.name}`, verifyingPatient.patientId);
      }
    } catch (err) {
      setVerificationError('Error connecting to backend for verification.');
    }
  };

  const handleAssignLab = async () => {
    if (!selectedPatient) return;
    await healthApi.updatePatient(selectedPatient.patientId, { status: 'Lab Assigned' });
    await healthApi.createLabRequest({
      patientId: selectedPatient.patientId,
      patientName: selectedPatient.name,
      testName: 'General Diagnostic Suite',
      requestedBy: currentUser?.name || 'Doctor'
    });
    addLog('LAB_TEST_REQUESTED', `Assigned lab tests for ${selectedPatient.name}`, selectedPatient.patientId);
    setShowModal(false);
    fetchData();
  };

  const handleFinalSubmit = async () => {
    if (!selectedPatient) return;
    
    // Create a final assessment report entry
    const finalReport = {
      name: `Final_Assessment_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`,
      date: new Date().toISOString(),
      url: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf', // Mock PDF URL
      type: 'FINAL_ASSESSMENT',
      details: {
        precautions,
        nextDate
      }
    };

    const updatedReports = [...(selectedPatient.reports || []), finalReport];

    await healthApi.updatePatient(selectedPatient.patientId, { 
      status: 'Completed', 
      approvalStatus: 'None', 
      completedDate: new Date().toISOString(),
      reports: updatedReports
    });

    addLog('ASSESSMENT_FINALIZED', `Archive created for ${selectedPatient.name}. Final assessment report generated.`, selectedPatient.patientId);
    setShowModal(false);
    setActiveTab('previous');
    fetchData();
  };

  const togglePrecaution = (p: string) => {
    setPrecautions(prev => prev.includes(p) ? prev.filter(item => item !== p) : [...prev, p]);
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2.4rem', letterSpacing: '-0.02em' }}>
            <span className="text-gradient">Medical</span> Practitioner Portal
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Secure Diagnostic & Patient Workflow</p>
        </div>
        <div className="glass-panel" style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', borderLeft: '4px solid var(--secondary)' }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '1rem', fontWeight: 700 }}>{currentUser ? currentUser.name : 'Loading...'}</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>Senior Specialist</p>
          </div>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, var(--secondary), var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px var(--secondary-glow)' }}>
            <Activity color="white" size={24} />
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="glass-panel" style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem', marginBottom: '3rem' }}>
        <button className={`btn ${activeTab === 'upcoming' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('upcoming')} style={{ flex: 1, background: activeTab === 'upcoming' ? undefined : 'transparent', border: 'none' }}>
          <Clock size={16} /> Upcoming Appointments
        </button>
        <button className={`btn ${activeTab === 'previous' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('previous')} style={{ flex: 1, background: activeTab === 'previous' ? undefined : 'transparent', border: 'none' }}>
          <History size={16} /> Previous Patients
        </button>
        <button className={`btn ${activeTab === 'activity' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('activity')} style={{ flex: 1, background: activeTab === 'activity' ? undefined : 'transparent', border: 'none' }}>
          <ShieldCheck size={16} /> Security Logs
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'upcoming' ? (
          <motion.div key="upcoming" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="glass-panel" style={{ padding: '2.5rem' }}>
              <h3 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Users color="var(--primary)" size={24} /> Daily Consultation Queue
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr><th>Patient Name</th><th>Contact Number</th><th>Slot Time</th><th>Status</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {sortedPatients.map((p) => (
                      <tr key={p.patientId}>
                        <td>{p.name}<div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{p.patientId}</div></td>
                        <td>{p.phone}</td>
                        <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{p.slot}</td>
                        <td><span className={`badge ${p.status === 'Lab Completed' ? 'badge-primary' : 'badge-outline'}`}>{p.status}</span></td>
                        <td>
                          <button className="btn btn-primary" onClick={() => handleOpenPatient(p)}>
                            Diagnose
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        ) : activeTab === 'previous' ? (
          <motion.div key="previous" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="glass-panel" style={{ padding: '2.5rem' }}>
            <h2 style={{ marginBottom: '2rem' }}><History color="var(--secondary)" /> Medical History Archive</h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Patient Name</th>
                  <th>Treatment Status</th>
                  <th>Submitted Date</th>
                  <th>Reports</th>
                  <th>Request Status</th>
                </tr>
              </thead>
              <tbody>
                {previousPatients.map((p, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 700 }}>
                      {p.name}
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{p.patientId}</div>
                    </td>
                    <td><span className="badge badge-success">COMPLETED</span></td>
                    <td>{p.completedDate ? new Date(p.completedDate).toLocaleDateString() : 'N/A'}</td>
                    <td>
                      {!p.approvalStatus || p.approvalStatus === 'None' ? (
                        <button className="btn btn-primary" style={{ fontSize: '0.7rem' }} onClick={() => handleRequestAccess(p.patientId)}>
                          Request View
                        </button>
                      ) : p.approvalStatus === 'Requested' ? (
                        <button className="btn btn-outline" style={{ fontSize: '0.7rem' }} disabled>
                          Request sent to Admin
                        </button>
                      ) : p.approvalStatus === 'Rejected' || p.approvalStatus === 'Denied' ? (
                        <button className="btn btn-outline" style={{ fontSize: '0.7rem', borderColor: '#ff4757', color: '#ff4757' }} disabled>
                          Access Denied
                        </button>
                      ) : (
                        <button className="btn btn-success" style={{ fontSize: '0.7rem' }} onClick={() => handleOpenPatient(p)}>
                          <Eye size={12} /> View Records
                        </button>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${!p.approvalStatus || p.approvalStatus === 'None' ? 'badge-outline' : p.approvalStatus === 'Requested' ? 'badge-warning' : p.approvalStatus === 'Rejected' || p.approvalStatus === 'Denied' ? '' : 'badge-success'}`}
                        style={p.approvalStatus === 'Rejected' || p.approvalStatus === 'Denied' ? { background: 'rgba(255, 71, 87, 0.1)', color: '#ff4757', border: '1px solid rgba(255, 71, 87, 0.3)' } : {}}>
                        {!p.approvalStatus || p.approvalStatus === 'None' ? '-' :
                          p.approvalStatus === 'Requested' ? 'Request sent to Admin' :
                            p.approvalStatus === 'Rejected' || p.approvalStatus === 'Denied' ? 'Admin Denied' : 'Admin Approved'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        ) : (
          <motion.div key="activity" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="glass-panel" style={{ padding: '2.5rem' }}>
            <h2 style={{ marginBottom: '2rem' }}><Activity color="var(--primary)" /> Activity Logs</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {logs.map((log, i) => (
                <div key={i} style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', borderLeft: '3px solid var(--primary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 700 }}>{log.action}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{log.timestamp}</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{log.details}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Patient Detail Modal */}
      <AnimatePresence>
        {showModal && selectedPatient && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-panel" style={{ position: 'relative', width: '100%', maxWidth: '1000px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.4rem' }}>{selectedPatient.name}</h2>
                <button onClick={() => setShowModal(false)} className="btn btn-outline" style={{ borderRadius: '50%', width: '40px', height: '40px' }}><X size={20} /></button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', display: viewingPdf ? 'block' : 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
                {viewingPdf ? (
                  <div style={{ height: '70vh' }}>
                    <iframe src={`https://docs.google.com/viewer?url=${encodeURIComponent(viewingPdf)}&embedded=true`} style={{ width: '100%', height: '100%', border: 'none' }} />
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                      <section>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                          <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FileText size={18} color="var(--primary)" /> Diagnostic Reports
                          </h4>
                          {selectedPatient.status === 'Completed' && (
                            <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>History Archive</span>
                          )}
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {selectedPatient.status === 'Completed' && selectedPatient.reports && selectedPatient.reports.length > 0 && (
                            <div className="glass-panel" style={{ padding: '1.25rem', border: '1px solid var(--success)', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '12px' }}>
                               <p style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                 <ShieldCheck size={12} /> Latest Finalized Report
                               </p>
                               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <p style={{ fontWeight: 600 }}>{selectedPatient.reports?.[selectedPatient.reports.length - 1]?.name}</p>
                                  <button className="btn btn-success" style={{ padding: '0.5rem' }} onClick={() => setViewingPdf(selectedPatient.reports?.[selectedPatient.reports.length - 1]?.url || '')}>
                                    <Eye size={14} /> View Final
                                  </button>
                               </div>
                            </div>
                          )}

                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem', marginBottom: '0.5rem' }}>Clinical Documents:</div>

                          {(selectedPatient.reports && selectedPatient.reports.length > 0 ? selectedPatient.reports : [{ name: 'Initial_Assessment.pdf', url: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf', date: new Date().toISOString() }]).map((r: PatientReport, idx: number) => (
                            <div key={idx} className="glass-panel" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                              <div>
                                <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>{r.name}</p>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{r.date ? new Date(r.date).toLocaleDateString() : 'Baseline'}</p>
                              </div>
                              <button className="btn btn-outline" onClick={() => setViewingPdf(r.url)}><Eye size={14} /></button>
                            </div>
                          ))}
                        </div>
                      </section>
                      <section>
                        <h4 style={{ marginBottom: '1rem' }}><AlertCircle size={18} color="var(--warning)" /> Precautions</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                          {['Diet Control', 'Bed Rest', 'Fluid Intake', 'Daily BPM Check'].map(p => (
                            <div key={p} onClick={() => togglePrecaution(p)} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-glass)', background: precautions.includes(p) ? 'var(--primary-glow)' : 'transparent', fontSize: '0.8rem', cursor: 'pointer' }}>{p}</div>
                          ))}
                        </div>
                      </section>
                    </div>
                    <div>
                      <section style={{ marginBottom: '2rem' }}>
                        <h4 style={{ marginBottom: '1rem' }}><Calendar size={18} color="var(--secondary)" /> Next Date</h4>
                        <input type="date" className="form-control" style={{ colorScheme: 'dark' }} onChange={(e) => setNextDate(e.target.value)} />
                      </section>
                      {selectedPatient.status === 'Pending' ? (
                        <button className="btn btn-warning" style={{ width: '100%', padding: '1rem' }} onClick={handleAssignLab}>Assign Lab Tests</button>
                      ) : (
                        <button className="btn btn-primary" style={{ width: '100%', padding: '1rem' }} onClick={handleFinalSubmit}>Finalize & Submit</button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Verification Modal */}
      <AnimatePresence>
        {showVerificationModal && verifyingPatient && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowVerificationModal(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(15px)' }} />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="glass-panel" style={{ position: 'relative', width: '100%', maxWidth: '500px', padding: '3rem', textAlign: 'center' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(0, 240, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <Lock color="var(--primary)" size={30} />
              </div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Encrypted Access Required</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
                Please enter the secure token for <strong>{verifyingPatient.name}</strong> to decrypt their medical history.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter Token (LLLL-NN-NL)"
                  value={enteredToken}
                  onChange={(e) => setEnteredToken(e.target.value)}
                  style={{ textAlign: 'center', fontSize: '1.1rem', letterSpacing: '2px', fontWeight: 'bold' }}
                />

                {verificationError && (
                  <p style={{ color: '#ff5252', fontSize: '0.8rem', fontWeight: '600' }}>{verificationError}</p>
                )}

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowVerificationModal(false)}>Cancel</button>
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleVerifyToken}>Verify Access</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
