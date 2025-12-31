const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace('/auth', '') || 'http://localhost:5001/api';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    SIGNUP: `${API_BASE_URL}/auth/signup`,
    ME: `${API_BASE_URL}/auth/me`,
    UPDATE_DETAILS: `${API_BASE_URL}/auth/updatedetails`,
    UPDATE_PASSWORD: `${API_BASE_URL}/auth/updatepassword`,
  },
  ATTENDANCE: {
    BASE: `${API_BASE_URL}/attendance`,
    CLOCK_IN: `${API_BASE_URL}/attendance/clock-in`,
    CLOCK_OUT: `${API_BASE_URL}/attendance/clock-out`,
  },
  DASHBOARD: {
    STATS: `${API_BASE_URL}/dashboard/stats`,
  },
  DOCUMENTS: {
    BASE: `${API_BASE_URL}/documents`,
    DOWNLOAD: (id: string) => `${API_BASE_URL}/documents/download/${id}`,
  },
  LEAVES: {
    BASE: `${API_BASE_URL}/leaves`,
    DETAIL: (id: string) => `${API_BASE_URL}/leaves/${id}`,
  },
  EMPLOYEES: {
    BASE: `${API_BASE_URL}/employees`,
  },
  SALARIES: {
    BASE: `${API_BASE_URL}/salaries`,
  },
};

export const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export default API_BASE_URL;