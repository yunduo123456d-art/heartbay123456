const normalizeBaseUrl = (url) => {
  if (!url) return null;
  return url.endsWith('/') ? url.slice(0, -1) : url;
};

const API_BASE_URL =
  normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL) || 'http://localhost:3001';

const API_ROOT = `${API_BASE_URL}/api`;

export { API_BASE_URL, API_ROOT };


