export const isAuthenticated = () => {
  // Verifica si existe el token en el almacenamiento del navegador
  return !!localStorage.getItem('geld_token');
};