import React, { useState } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

export default function AuthView() {
  const [modo, setModo] = useState('LOGIN'); // 'LOGIN' o 'REGISTRO'
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const BASE_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:8000';
  const GOOGLE_CLIENT_ID = typeof window !== 'undefined' 
    ? window.env?.GOOGLE_CLIENT_ID 
    : import.meta.env.PUBLIC_GOOGLE_CLIENT_ID;

  // --- Manejador de Login/Registro Tradicional ---
  const handleTradiAuth = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (modo === 'REGISTRO') {
        // Lógica de Registro
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
        
        // Si se registra con éxito, automáticamente hacemos login para darle el token
        await iniciarSesionLocal(formData.username, formData.password);
        
      } else {
        // Lógica de Login Clásico
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

  // --- Manejadores de Google OAuth2 ---
  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential })
      });

      if (!response.ok) {
        throw new Error('Fallo la autenticación con el servidor');
      }

      const data = await response.json();
      localStorage.setItem('geld_token', data.access_token);
      window.location.href = '/';
      
    } catch (err) {
      setError(`Error de Google: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
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
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold text-center mb-4">
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

        {/* --- EL BOTÓN MÁGICO DE GOOGLE --- */}
        <div className="flex justify-center w-full">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('El inicio de sesión de Google fue interrumpido')}
            theme="outline"
            size="large"
            width="100%"
            text={modo === 'LOGIN' ? "signin_with" : "signup_with"}
            shape="rectangular"
          />
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
              ? '¿No tienes cuenta? Registrate gratis' 
              : '¿Ya tienes bóveda? Inicia sesión'
            }
          </button>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}