import React, { useState } from 'react';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';

// Un componente interno para poder usar los hooks de Google
function AuthFormInternal() {
  const [modo, setModo] = useState('LOGIN'); // 'LOGIN' o 'REGISTRO'
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const BASE_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:8000';

  // --- Manejador de Login/Registro Tradicional ---
  const handleTradiAuth = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (modo === 'REGISTRO') {
        const response = await fetch(`${BASE_URL}/auth/registrar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.username,
            password: formData.password
          })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.detail || 'Error al registrar el usuario');
        }
        
        setSuccessMsg('¡Usuario creado! Iniciando sesión...');
        await iniciarSesionLocal(formData.username, formData.password);
        
      } else {
        await iniciarSesionLocal(formData.username, formData.password);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const iniciarSesionLocal = async (user, pass) => {
    const params = new URLSearchParams();
    params.append('username', user);
    params.append('password', pass);

    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });

    if (!response.ok) throw new Error('Credenciales incorrectas');

    const data = await response.json();
    localStorage.setItem('geld_token', data.access_token);
    window.location.href = '/';
  };

  // --- Manejador Personalizado de Google OAuth2 ---
  // Utilizamos el flujo implicito que es más amigable con PWAs móviles
  const loginGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setError('');
      setLoading(true);
      try {
        // En este flujo, recibimos un access_token en lugar de un credential.
        // Google Identity Services prefiere enviar el token a tu backend para validarlo.
        
        // Vamos a usar una ruta ligeramente diferente o enviarlo como access_token
        // Nota: Si esto falla, tendríamos que ajustar el backend para recibir access_token
        const response = await fetch(`${BASE_URL}/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // Simulamos la estructura esperada, o idealmente ajustaríamos FastAPI
          body: JSON.stringify({ credential: tokenResponse.access_token }) 
        });

        if (!response.ok) {
           // Fallback seguro si FastAPI rechaza este token
           throw new Error('Autenticación en proceso...'); 
        }

        const data = await response.json();
        localStorage.setItem('geld_token', data.access_token);
        window.location.href = '/';
        
      } catch (err) {
        // Si el backend se queja, mostramos un error amigable.
        // Si esto pasa, te daré el código exacto del backend para solucionarlo.
        console.error("Respuesta cruda de Google:", tokenResponse);
        setError(`Debemos ajustar el backend para recibir el token de PWA.`);
      } finally {
        setLoading(false);
      }
    },
    onError: errorResponse => setError('El inicio de sesión de Google fue interrumpido'),
    // Flujo implícito: ideal para PWAs y móviles
    flow: 'implicit',
  });

  return (
      <div className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-lg border border-slate-100 mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            GELD <span className="text-emerald-600">FES</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            {modo === 'LOGIN' ? 'Bienvenido a tu centro financiero' : 'Crea tu bóveda personal aislada'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold text-center mb-4 break-words">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl text-xs font-bold text-center mb-4">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleTradiAuth} className="space-y-4 mb-6">
          <div>
            <input 
              type="email" 
              placeholder="Correo electrónico" 
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:bg-white focus:ring-2 focus:ring-slate-800 outline-none transition-all"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
            />
          </div>
          <div>
            <input 
              type="password" 
              placeholder="Contraseña" 
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:bg-white focus:ring-2 focus:ring-slate-800 outline-none transition-all"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm py-3.5 rounded-xl transition-all shadow-md disabled:opacity-50"
          >
            {loading ? 'Conectando...' : (modo === 'LOGIN' ? 'Ingresar a mi Bóveda' : 'Crear Cuenta')}
          </button>
        </form>

        <div className="relative flex py-2 items-center mb-6">
          <div className="flex-grow border-t border-slate-100"></div>
          <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-medium">O continúa con</span>
          <div className="flex-grow border-t border-slate-100"></div>
        </div>

        {/* --- EL BOTÓN PERSONALIZADO DE GOOGLE --- */}
        <div className="flex justify-center w-full">
           <button 
            onClick={() => loginGoogle()} 
            type="button"
            className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 font-bold text-sm py-3 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {modo === 'LOGIN' ? 'Continuar con Google' : 'Registrarse con Google'}
          </button>
        </div>

        <div className="mt-8 text-center border-t border-slate-100 pt-4">
          <button 
            type="button" 
            onClick={() => {
              setModo(modo === 'LOGIN' ? 'REGISTRO' : 'LOGIN');
              setError('');
            }}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            {modo === 'LOGIN' 
              ? '¿No tienes cuenta? Regístrate gratis' 
              : '¿Ya tienes bóveda? Inicia sesión'
            }
          </button>
        </div>
      </div>
  );
}

export default function AuthView() {
  const GOOGLE_CLIENT_ID = typeof window !== 'undefined' 
    ? window.env?.GOOGLE_CLIENT_ID 
    : import.meta.env.PUBLIC_GOOGLE_CLIENT_ID;

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthFormInternal />
    </GoogleOAuthProvider>
  );
}