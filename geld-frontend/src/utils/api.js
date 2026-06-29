export const apiFetch = async (url, options = {}) => {
  const token = localStorage.getItem('geld_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };

  const response = await fetch(url, { ...options, headers });
  
  if (response.status === 401) {
    // Si el token expiró, borramos el localstorage y mandamos a login
    localStorage.removeItem('geld_token');
    window.location.href = '/login';
  }
  
  return response;
};