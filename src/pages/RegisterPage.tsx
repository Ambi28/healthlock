import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Calendar, ArrowLeft, Lock, ChevronDown, Download, CheckCircle2, Clock } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { healthApi } from '../utils/api';

export function RegisterPage() {
  const navigate = useNavigate();
  const [isRegistered, setIsRegistered] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    dob: '',
    gender: 'Other',
    bloodGroup: '',
    address: '',
    emergencyContact: '',
    password: '',
    assignedDoctor: 'DOC-101',
    slot: ''
  });

  const [accessToken] = useState(() => {
    let code = '';
    for (let i = 0; i < 16; i++) {
      code += Math.floor(Math.random() * 10).toString();
    }
    return `${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8, 12)}-${code.slice(12, 16)}`;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        dob: formData.dob,
        slot: formData.slot,
        address: formData.address,
        password: formData.password,
        assignedDoctor: formData.assignedDoctor,
        qrToken: accessToken
      };

      const result = await healthApi.registerPatient(payload);
      if (result.success) {
        // Dual Persistence: MongoDB + LocalStorage
        const patientRecord = { ...payload, patientId: result.patient.patientId };
        localStorage.setItem(`patient_profile_${result.patient.patientId}`, JSON.stringify(patientRecord));

        setIsRegistered(true);
        // Log the new registration
        await healthApi.addLog({
          action: 'PATIENT_REGISTER',
          actor: formData.fullName,
          details: `New patient identity established with ID: ${result.patient.patientId}`
        });
      } else {
        alert('Registration failed: ' + (result.error || 'System error'));
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Network error during registration. Please check backend.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const doctors = [
    { id: 'Dr. Vinnu', name: 'Dr. Vinnu (General Medicine)', dept: 'General Medicine' },
    { id: 'Dr. Sony', name: 'Dr. Sony (Surgery)', dept: 'Surgical Dept' },
    { id: 'Dr. Lalitha', name: 'Dr. Lalitha (Pediatrics)', dept: 'Pediatrics' }
  ];

  if (isRegistered) {
    return (
      <div className="hero" style={{ minHeight: 'calc(100vh - 80px)', justifyContent: 'center', padding: '2rem' }}>
        <motion.div
          className="glass-panel"
          style={{ width: '100%', maxWidth: '400px', padding: '3rem', textAlign: 'center' }}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <div style={{ color: 'var(--success)', marginBottom: '1.5rem' }}>
            <CheckCircle2 size={64} style={{ margin: '0 auto' }} />
          </div>
          <h2 style={{ marginBottom: '1rem' }}>Success!</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
            Your digital health identity has been generated and anchored on the blockchain.
          </p>

          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '20px',
            marginBottom: '2rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            color: '#000'
          }}>
            <QRCodeSVG
              value={`Verification Token: ${accessToken}`}
              size={180}
              level="H"
              includeMargin={true}
            />
            <div style={{ marginTop: '1.5rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
              <div style={{ fontSize: '0.7rem', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>Secure Verification QR</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--secondary)', fontWeight: '600', marginTop: '0.2rem' }}>Patient: {formData.fullName}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => window.print()}>
              <Download size={16} /> Print ID
            </button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => navigate('/login')}>
              Login Now
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '4rem 1rem' }}>
      <button
        className="btn btn-outline"
        style={{ marginBottom: '2rem', border: 'none', background: 'transparent' }}
        onClick={() => navigate('/login')}
      >
        <ArrowLeft size={18} /> Back to Login
      </button>

      <motion.div
        className="glass-panel"
        style={{ padding: '3rem', maxWidth: '800px', margin: '0 auto' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }} className="text-gradient">Patient Enrollment</h2>
          <p style={{ color: 'var(--text-muted)' }}>Complete your profile to generate your blockchain-based medical ID.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="input-group">
              <label>Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                <input type="text" name="fullName" className="form-control" placeholder="John Doe" style={{ paddingLeft: '40px' }} onChange={handleChange} required />
              </div>
            </div>

            <div className="input-group">
              <label>Assign Primary Doctor</label>
              <div style={{ position: 'relative' }}>
                <select name="assignedDoctor" className="form-control" onChange={handleChange} style={{ appearance: 'none', color: 'black', backgroundColor: 'white' }} required>
                  {doctors.map(doc => (
                    <option key={doc.id} value={doc.id} style={{ color: 'black', backgroundColor: 'white' }}>{doc.name}</option>
                  ))}
                </select>
                <ChevronDown size={18} style={{ position: 'absolute', right: '12px', top: '12px', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              </div>
            </div>

            <div className="input-group">
              <label>Account Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                <input type="password" name="password" className="form-control" placeholder="••••••••" style={{ paddingLeft: '40px' }} onChange={handleChange} required />
              </div>
            </div>

            <div className="input-group">
              <label>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                <input type="email" name="email" className="form-control" placeholder="john@example.com" style={{ paddingLeft: '40px' }} onChange={handleChange} required />
              </div>
            </div>

            <div className="input-group">
              <label>Phone Number</label>
              <div style={{ position: 'relative' }}>
                <Phone size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                <input type="tel" name="phone" className="form-control" placeholder="+91 98765 43210" style={{ paddingLeft: '40px' }} onChange={handleChange} required />
              </div>
            </div>

            <div className="input-group">
              <label>Date of Birth</label>
              <div style={{ position: 'relative' }}>
                <Calendar size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                <input
                  type="date"
                  name="dob"
                  className="form-control"
                  style={{ paddingLeft: '40px', colorScheme: 'dark' }}
                  onChange={handleChange}
                  onClick={(e) => {
                    const target = e.target as HTMLInputElement;
                    if ('showPicker' in target) {
                      (target as any).showPicker();
                    }
                  }}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label>Consultation Slot Time</label>
              <div style={{ position: 'relative' }}>
                <Clock size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                <input
                  type="time"
                  name="slot"
                  className="form-control"
                  style={{ paddingLeft: '40px', colorScheme: 'dark' }}
                  onChange={handleChange}
                  onClick={(e) => {
                    const target = e.target as HTMLInputElement;
                    if ('showPicker' in target) {
                      (target as any).showPicker();
                    }
                  }}
                  required
                />
              </div>
            </div>
          </div>

          <div className="input-group" style={{ marginTop: '1.5rem' }}>
            <label>Residential Address</label>
            <div style={{ position: 'relative' }}>
              <MapPin size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <textarea name="address" className="form-control" rows={3} placeholder="Full address details..." style={{ paddingLeft: '40px', resize: 'none' }} onChange={handleChange}></textarea>
            </div>
          </div>

          <button className="btn btn-primary" style={{ width: '100%', padding: '1.25rem', fontSize: '1.1rem' }} type="submit">
            Register & Generate Digital ID
          </button>
        </form>
      </motion.div>
    </div>
  );
}
