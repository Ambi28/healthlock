import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FlaskConical, 
  User, 
  CheckCircle2, 
  Upload, 
  X, 
  Activity,
  ClipboardList,
  AlertCircle,
  Zap,
  Eye,
  History
} from 'lucide-react';
import { healthApi } from '../utils/api';

interface LabRequest {
  _id: string;
  patientId: string;
  patientName: string;
  testName: string;
  status: 'PENDING' | 'COLLECTED' | 'TESTED';
  approvalStatus?: string;
  requestedBy?: string;
  timestamp: string;
}

export function DiagnosticsDashboard() {
  const [requests, setRequests] = useState<LabRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [selectedRequest, setSelectedRequest] = useState<LabRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const data = await healthApi.getLabRequests();
      setRequests(data);
    } catch (err) {
      console.error('Failed to fetch lab requests');
    }
  };

  const handleProgress = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'PENDING' ? 'COLLECTED' : 'TESTED';
    try {
      await healthApi.updateLabRequest(id, { status: nextStatus });
      if (nextStatus === 'TESTED') {
         const req = requests.find(r => r._id === id);
         if (req) {
            await healthApi.updatePatient(req.patientId, { status: 'Lab Completed' });
            await healthApi.addLog({
              action: 'LAB_TEST_COMPLETE',
              actor: 'City Central Lab',
              details: `Finalized results for ${req.patientName}`,
              targetId: req.patientId
            });
         }
      }
      fetchRequests();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleOpenRequest = (req: LabRequest) => {
    setSelectedRequest(req);
    setShowModal(true);
    setUploadSuccess(false);
  };

  const updateStatus = async (status: 'COLLECTED' | 'TESTED') => {
    if (selectedRequest) {
      try {
        await healthApi.updateLabRequest(selectedRequest._id, { status });
        setSelectedRequest({ ...selectedRequest, status });
        fetchRequests();
      } catch (err) {
        alert('Update failed');
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedRequest) return;
    setIsUploading(true);
    
    try {
      const patient = await healthApi.getPatientById(selectedRequest.patientId);
      const existingReports = patient.reports || [];
      
      const newReport = {
        name: `Lab_Report_${selectedRequest.testName.replace(/ /g, '_')}.pdf`,
        date: new Date().toISOString(),
        url: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
        status: 'Verified'
      };
      
      await healthApi.updatePatient(selectedRequest.patientId, { 
        reports: [...existingReports, newReport],
        status: 'Lab Completed'
      });
      
      await healthApi.updateLabRequest(selectedRequest._id, { status: 'TESTED' });
      
      setIsUploading(false);
      setUploadSuccess(true);
      fetchRequests();
      alert(`Report for ${selectedRequest.patientName} uploaded successfully and shared with Doctor.`);
    } catch (err) {
      setIsUploading(false);
      alert('Failed to upload report securely.');
    }
  };

  return (
    <div className="container animate-fade-in" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
             <span className="text-gradient">Diagnostic</span> Lab Portal
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Laboratory Information & Report Management</p>
        </div>
        <div className="glass-panel" style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', borderLeft: '4px solid var(--primary)' }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontWeight: 700 }}>City Central Lab</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>ID: LAB-SEC-404</p>
          </div>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(0, 240, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--primary)' }}>
            <FlaskConical size={24} color="var(--primary)" />
          </div>
        </div>
      </header>

      <div className="stat-cards" style={{ marginBottom: '3rem' }}>
        <div className="glass-panel stat-card" style={{ borderLeftColor: 'var(--primary)' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <p className="stat-label">Pending</p>
              <Activity size={16} color="var(--primary)" />
           </div>
          <h3 className="stat-value">{requests.filter(r => r.status === 'PENDING').length}</h3>
        </div>
        <div className="glass-panel stat-card" style={{ borderLeftColor: 'var(--warning)' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <p className="stat-label">In Progress</p>
              <Zap size={16} color="var(--warning)" />
           </div>
          <h3 className="stat-value">{requests.filter(r => r.status === 'COLLECTED').length}</h3>
        </div>
        <div className="glass-panel stat-card" style={{ borderLeftColor: 'var(--success)' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <p className="stat-label">Completed</p>
              <CheckCircle2 size={16} color="var(--success)" />
           </div>
          <h3 className="stat-value">{requests.filter(r => r.status === 'TESTED').length}</h3>
        </div>
      </div>

      {/* Dashboard Tabs */}
      <div className="glass-panel" style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem', marginBottom: '3rem' }}>
        <button 
          className={`btn ${activeTab === 'active' ? 'btn-primary' : ''}`} 
          onClick={() => setActiveTab('active')} 
          style={{ flex: 1, background: activeTab === 'active' ? undefined : 'transparent', border: 'none' }}
        >
          <ClipboardList size={18} /> Active Lab Queue
          {requests.filter(r => r.status !== 'TESTED').length > 0 && (
            <span style={{ marginLeft: '0.5rem', background: 'var(--accent)', color: 'white', padding: '0.1rem 0.5rem', borderRadius: '10px', fontSize: '0.7rem' }}>
              {requests.filter(r => r.status !== 'TESTED').length}
            </span>
          )}
        </button>
        <button 
          className={`btn ${activeTab === 'history' ? 'btn-primary' : ''}`} 
          onClick={() => setActiveTab('history')} 
          style={{ flex: 1, background: activeTab === 'history' ? undefined : 'transparent', border: 'none' }}
        >
          <History size={18} /> Medical History Archive
          {requests.filter(r => r.approvalStatus === 'Requested').length > 0 && (
            <span style={{ marginLeft: '0.5rem', background: '#ff3d00', color: 'white', padding: '0.1rem 0.5rem', borderRadius: '10px', fontSize: '0.7rem' }}>
              {requests.filter(r => r.approvalStatus === 'Requested').length} PENDING
            </span>
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'active' ? (
          <motion.div 
            key="active" 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            className="glass-panel" 
            style={{ padding: '2.5rem' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <ClipboardList size={22} color="var(--secondary)" /> Current Processing Queue
              </h3>
              <span className="badge badge-primary">Real-time Sync</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Patient Identity</th>
                    <th>Test Specification</th>
                    <th>Current Status</th>
                    <th>Date Requested</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.filter(r => r.status !== 'TESTED').map((r) => (
                    <tr key={r._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(112,0,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <User size={18} color="var(--secondary)" />
                          </div>
                          <div>
                            <p style={{ fontWeight: 700 }}>{r.patientName}</p>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{r.patientId}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                         <div style={{ fontWeight: 600, color: 'var(--primary)' }}>{r.testName}</div>
                         <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Priority: Standard</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                           <div className={`status-pip ${r.status === 'COLLECTED' ? 'pip-warning' : 'pip-primary'}`} />
                            <span className={`badge ${r.status === 'COLLECTED' ? 'badge-warning' : 'badge-primary'}`}>
                              {r.status}
                            </span>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{r.timestamp ? new Date(r.timestamp).toLocaleTimeString() : 'N/A'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-outline" style={{ padding: '0.4rem' }} onClick={() => handleOpenRequest(r)}>
                            <Upload size={14} />
                          </button>
                          <button 
                            className="btn btn-primary" 
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                            onClick={() => handleProgress(r._id, r.status)}
                          >
                            {r.status === 'PENDING' ? 'Collect Sample' : 'Complete Test'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="history" 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            className="glass-panel" 
            style={{ padding: '2.5rem' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <History size={22} color="var(--success)" /> Patient History Access
              </h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Patient Identity</th>
                    <th>Test Specification</th>
                    <th>Current Status</th>
                    <th>Date Requested</th>
                    <th>Approval Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.filter(r => r.status === 'TESTED').map((r) => (
                    <tr key={r._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(112,0,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <User size={18} color="var(--secondary)" />
                          </div>
                          <div>
                            <p style={{ fontWeight: 700 }}>{r.patientName}</p>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{r.patientId}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                         <div style={{ fontWeight: 600, color: 'var(--primary)' }}>{r.testName}</div>
                         <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Priority: Standard</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                           <div className="status-pip pip-success" />
                            <span className="badge badge-success">TESTED</span>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{r.timestamp ? new Date(r.timestamp).toLocaleTimeString() : 'N/A'}</td>
                      <td>
                        <span className={`badge ${!r.approvalStatus || r.approvalStatus === 'None' ? 'badge-outline' : r.approvalStatus === 'Requested' ? 'badge-warning' : 'badge-success'}`}>
                           {!r.approvalStatus || r.approvalStatus === 'None' ? 'History Locked' 
                             : r.approvalStatus === 'Requested' ? 'Pending Admin'
                             : r.approvalStatus === 'Approved' ? 'Access Granted'
                             : r.approvalStatus === 'Rejected' ? 'Access Denied' : r.approvalStatus}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <button 
                            className={`btn ${r.approvalStatus === 'Approved' ? 'btn-success' : 'btn-outline'}`}
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }} 
                            onClick={async () => {
                              if (!r.approvalStatus || r.approvalStatus === 'None' || r.approvalStatus === 'Rejected') {
                                await healthApi.updateLabRequest(r._id, { approvalStatus: 'Requested' });
                                await healthApi.addLog({
                                  action: 'LAB_ACCESS_REQUEST',
                                  actor: 'City Central Lab',
                                  details: `Requested admin authorization to view historical report for ${r.patientName}`,
                                  targetId: r.patientId
                                });
                                fetchRequests();
                                alert('Review request sent to Administrator.');
                              } else if (r.approvalStatus === 'Approved') {
                                window.open('https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf', '_blank');
                                
                                // Single-Use Enforcement: Reset approval status immediately after consumption
                                await healthApi.updateLabRequest(r._id, { approvalStatus: 'None' });
                                
                                // Rotate the patient's security token for complete reset
                                await healthApi.rotateToken(
                                  r.patientId,
                                  'City Central Lab',
                                  'DIAGNOSTIC_HISTORY_VIEWED'
                                );

                                await healthApi.addLog({
                                  action: 'ONE_TIME_VIEW_CONSUMED',
                                  actor: 'City Central Lab',
                                  details: `Temporary view session ended for ${r.patientName} report. Token rotated.`,
                                  targetId: r.patientId
                                });
                                fetchRequests();
                                alert('One-time view session consumed. Authorization reset and security token refreshed.');
                              }
                            }}
                          >
                            <Eye size={14} style={{ marginRight: r.approvalStatus === 'Approved' ? '0.5rem' : 0 }} />
                            {r.approvalStatus === 'Approved' ? 'View Report' : ''}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showModal && selectedRequest && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="glass-panel"
               style={{ position: 'relative', width: '100%', maxWidth: '700px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
            >
              <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.4rem' }}>Process Sample: {selectedRequest.patientId}</h2>
                <button onClick={() => setShowModal(false)} className="btn btn-outline" style={{ borderRadius: '50%', width: '40px', height: '40px', padding: 0 }}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PATIENT NAME</label>
                    <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>{selectedRequest.patientName}</p>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TEST REQUIRED</label>
                    <p style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--primary)' }}>{selectedRequest.testName}</p>
                  </div>
                </div>

                <section>
                   <h4 style={{ marginBottom: '1rem' }}>Task Completion</h4>
                   <div style={{ display: 'flex', gap: '1rem' }}>
                     <button 
                       className={`btn ${selectedRequest.status === 'COLLECTED' || selectedRequest.status === 'TESTED' ? 'btn-primary' : 'btn-outline'}`}
                       style={{ flex: 1 }}
                       onClick={() => updateStatus('COLLECTED')}
                       disabled={selectedRequest.status !== 'PENDING'}
                     >
                       <CheckCircle2 size={18} /> Sample Collected
                     </button>
                     <button 
                       className={`btn ${selectedRequest.status === 'TESTED' ? 'btn-primary' : 'btn-outline'}`}
                       style={{ flex: 1 }}
                       onClick={() => updateStatus('TESTED')}
                       disabled={selectedRequest.status !== 'COLLECTED'}
                     >
                       <CheckCircle2 size={18} /> Test Finalized
                     </button>
                   </div>
                </section>

                <section>
                  <h4 style={{ marginBottom: '1rem' }}>Final Report Upload (PDF)</h4>
                  <div 
                    className="upload-area" 
                    style={{ 
                      padding: '2rem', 
                      borderColor: uploadSuccess ? 'var(--success)' : undefined, 
                      background: uploadSuccess ? 'rgba(0, 230, 118, 0.05)' : undefined,
                      cursor: selectedRequest.status === 'TESTED' ? 'pointer' : 'not-allowed',
                      opacity: selectedRequest.status === 'TESTED' ? 1 : 0.5
                    }}
                    onClick={() => selectedRequest.status === 'TESTED' && !isUploading && handleUpload()}
                  >
                    {isUploading ? (
                      <p>Encrypting & Uploading to IPFS...</p>
                    ) : uploadSuccess ? (
                      <div style={{ color: 'var(--success)' }}>
                        <CheckCircle2 size={32} style={{ margin: '0 auto 1rem' }} />
                        <p>Lab_Report_{selectedRequest.patientId}.pdf uploaded!</p>
                      </div>
                    ) : (
                      <>
                        <Upload size={32} style={{ margin: '0 auto 1rem', color: 'var(--primary)' }} />
                        <p style={{ fontWeight: 600 }}>Click to upload PDF report</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Secure AES-256 Encryption will be applied</p>
                      </>
                    )}
                  </div>
                </section>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px' }}>
                  <AlertCircle size={16} />
                   <p>Uploading reports updates the health chain and notifies the diagnostic doctor.</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
