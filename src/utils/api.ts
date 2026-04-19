const API_BASE = 'http://localhost:5000/api';

export const healthApi = {
  login: async (username: string, role: string, password?: string) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, role, password })
    });
    return res.json();
  },

  registerPatient: async (patientData: Record<string, unknown>) => {
    const res = await fetch(`${API_BASE}/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patientData)
    });
    return res.json();
  },

  getPatients: async () => {
    const res = await fetch(`${API_BASE}/patients`);
    return res.json();
  },

  getPatientById: async (id: string) => {
    const res = await fetch(`${API_BASE}/patients/${id}`);
    return res.json();
  },

  verifyPatientToken: async (id: string, token: string) => {
    const res = await fetch(`${API_BASE}/patients/${id}/verify-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
    return res.json();
  },

  updatePatient: async (id: string, data: Record<string, unknown>) => {
    const res = await fetch(`${API_BASE}/patients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  getLabRequests: async () => {
    const res = await fetch(`${API_BASE}/labs`);
    return res.json();
  },

  createLabRequest: async (data: Record<string, unknown>) => {
    const res = await fetch(`${API_BASE}/labs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  updateLabRequest: async (id: string, data: Record<string, unknown>) => {
    const res = await fetch(`${API_BASE}/labs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  getLogs: async () => {
    const res = await fetch(`${API_BASE}/logs`);
    return res.json();
  },

  addLog: async (log: Record<string, unknown>) => {
    const res = await fetch(`${API_BASE}/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log)
    });
    return res.json();
  },

  getLogsByPatient: async (id: string) => {
    const res = await fetch(`${API_BASE}/logs/patient/${id}`);
    return res.json();
  },

  rotateToken: async (patientId: string, usedBy: string, action: string) => {
    const res = await fetch(`${API_BASE}/patients/${patientId}/rotate-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usedBy, action })
    });
    return res.json();
  },

  getTokenHistory: async (patientId: string) => {
    const res = await fetch(`${API_BASE}/patients/${patientId}/token-history`);
    return res.json();
  }
};
