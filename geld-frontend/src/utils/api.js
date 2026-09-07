const BASE_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:8000';

export const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('geld_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };

  // Aseguramos que la URL se construya correctamente
  const cleanEndpoint = endpoint.startsWith('http') ? endpoint.replace('http://localhost:8000', '') : endpoint;
  const finalEndpoint = cleanEndpoint.startsWith('/') ? cleanEndpoint : `/${cleanEndpoint}`;
  const url = `${BASE_URL}${finalEndpoint}`;

  const response = await fetch(url, { ...options, headers });
  
  if (response.status === 401) {
    // Si el token expiró, borramos el localstorage y mandamos a login
    localStorage.removeItem('geld_token');
    window.location.href = '/login';
  }
  
  return response;
};