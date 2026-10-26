const API_BASE = import.meta.env.VITE_API_BASE_URL !== undefined
  ? import.meta.env.VITE_API_BASE_URL
  : (import.meta.env.PROD ? '' : 'http://localhost:8000');

export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('specsup_token');
  
  const headers = {
    ...options.headers,
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // If not calling login/register, clear invalid session
    if (!endpoint.includes('/api/auth/login') && !endpoint.includes('/api/auth/register')) {
      localStorage.removeItem('specsup_token');
      localStorage.removeItem('specsup_user');
      window.dispatchEvent(new Event('auth-changed'));
    }
  }

  if (!response.ok) {
    let errorMsg = 'An error occurred';
    try {
      const errData = await response.json();
      errorMsg = errData.detail || errData.message || JSON.stringify(errData);
    } catch {
      errorMsg = response.statusText || `Request failed with status ${response.status}`;
    }
    throw new Error(errorMsg);
  }

  // Handle binary responses (like PDF)
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/pdf')) {
    return response.blob();
  }

  return response.json();
}

export const api = {
  // Auth
  login: (email, password) =>
    apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (name, email, password) =>
    apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),
  getMe: () => apiFetch('/api/auth/me'),

  // Customer Profile
  getMyProfile: () => apiFetch('/api/customers/me'),
  updateProfile: (data) =>
    apiFetch('/api/customers/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Frames (Public & Recommended)
  getFrames: () => apiFetch('/api/frames'),
  getRecommendedFrames: () => apiFetch('/api/frames/recommended'),

  // Reservations
  prebookFrame: (frameId) =>
    apiFetch('/api/reservations', {
      method: 'POST',
      body: JSON.stringify({ frame_id: frameId }),
    }),
  getMyReservations: () => apiFetch('/api/reservations/me'),

  // Prescriptions
  getMyPrescriptions: () => apiFetch('/api/prescriptions/me'),
  getLatestPrescription: () => apiFetch('/api/prescriptions/me/latest'),
  getPrescriptionAnalysis: () => apiFetch('/api/prescriptions/me/analysis'),
  downloadPrescriptionPdf: () => apiFetch('/api/prescriptions/me/pdf'),

  // Admin APIs
  admin: {
    getFrames: () => apiFetch('/api/admin/frames'),
    createFrame: (frameData) =>
      apiFetch('/api/admin/frames', {
        method: 'POST',
        body: JSON.stringify(frameData),
      }),
    updateFrame: (frameId, frameData) =>
      apiFetch(`/api/admin/frames/${frameId}`, {
        method: 'PUT',
        body: JSON.stringify(frameData),
      }),
    deleteFrame: (frameId) =>
      apiFetch(`/api/admin/frames/${frameId}`, {
        method: 'DELETE',
      }),
    getCustomers: () => apiFetch('/api/admin/customers'),
    getCustomer: (customerId) => apiFetch(`/api/admin/customers/${customerId}`),
    getCustomerPrescriptions: (customerId) =>
      apiFetch(`/api/admin/customers/${customerId}/prescriptions`),
    addPrescription: (customerId, rxData) =>
      apiFetch(`/api/admin/customers/${customerId}/prescriptions`, {
        method: 'POST',
        body: JSON.stringify(rxData),
      }),
    getReservations: () => apiFetch('/api/admin/reservations'),
  },
};
