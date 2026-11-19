import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

api.interceptors.request.use((cfg) => {
  const token = sessionStorage.getItem('sb_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    // Expired / invalid token while logged in -> clear session and go to the right login page.
    if (err.response?.status === 401 && sessionStorage.getItem('sb_token')) {
      const wasAdmin = window.location.pathname.startsWith('/admin');
      sessionStorage.clear();
      window.location.assign(wasAdmin ? '/admin/login' : '/login');
    }
    return Promise.reject(err);
  }
);

/** Normalises backend errors: { message, fieldErrors } */
export function parseError(e) {
  const d = e?.response?.data;
  if (!e?.response) return { message: 'Cannot reach the server. Check that the backend is running.', fieldErrors: {} };
  return {
    message: d?.message || d?.detail || 'Something went wrong. Please try again.',
    fieldErrors: d?.fieldErrors || {},
  };
}

export const uuid = () =>
  globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID()
    : 'k' + Date.now().toString(36) + Math.random().toString(36).slice(2, 12);

export default api;
