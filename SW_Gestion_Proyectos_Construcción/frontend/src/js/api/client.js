const API_BASE_URL = window.SIGC_API_BASE_URL || 'http://localhost:4000/api/v1';

export function getToken() {
  return localStorage.getItem('sigc_token');
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem('sigc_user'));
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem('sigc_token');
  localStorage.removeItem('sigc_user');
}

export async function apiRequest(path, options = {}) {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (response.status === 401 && path !== '/auth/login') {
    logout();
    location.hash = '';
    location.reload();
    throw new Error('La sesión expiró. Inicie sesión nuevamente.');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || 'Error en la solicitud');
  }

  if (response.status === 204) return null;
  return response.json();
}

export async function login(email, password) {
  const data = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  localStorage.setItem('sigc_token', data.token);
  localStorage.setItem('sigc_user', JSON.stringify(data.user));
  return data.user;
}
