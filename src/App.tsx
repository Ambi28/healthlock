import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { PatientDashboard } from './pages/PatientDashboard';
import { DoctorDashboard } from './pages/DoctorDashboard';
import { DiagnosticsDashboard } from './pages/DiagnosticsDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

function App() {
  const [role, setRole] = useState('PATIENT');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = (selectedRole: string) => {
    setRole(selectedRole);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setIsLoggedIn(false);
  };

  return (
    <Router>
      <div className="app-container">
        <Navbar currentRole={role} isLoggedIn={isLoggedIn} onLogout={handleLogout} />

        <Routes>
          {/* <Route path="/" element={<Home />} /> */}
          <Route path="/" element={<LoginPage onLogin={handleLogin} />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/patient"
            element={isLoggedIn && role === 'PATIENT' ? <PatientDashboard /> : <Navigate to="/" replace />}
          />
          <Route
            path="/doctor"
            element={isLoggedIn && role === 'DOCTOR' ? <DoctorDashboard /> : <Navigate to="/" replace />}
          />
          <Route
            path="/diagnostics"
            element={isLoggedIn && role === 'DIAGNOSTICS' ? <DiagnosticsDashboard /> : <Navigate to="/" replace />}
          />
          <Route
            path="/admin"
            element={isLoggedIn && role === 'ADMIN' ? <AdminDashboard /> : <Navigate to="/" replace />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
