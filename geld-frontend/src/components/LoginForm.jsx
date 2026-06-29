import React, { useState } from 'react';

export default function LoginForm() {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // 1. Preparamos el cuerpo de la petición (FastAPI espera 'username' y 'password')
      const params = new URLSearchParams();
      params.append('username', formData.username);
      params.append('password', formData.password);

      // 2. Petición al endpoint de login
      const response = await fetch('http://localhost:8000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params,
      });

      if (!response.ok) throw new Error('Credenciales incorrectas');

      const data = await response.json();

      // 3. Guardamos el token en LocalStorage
      localStorage.setItem('geld_token', data.access_token);
      
      // 4. Redireccionamos al dashboard
      window.location.href = '/';
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xs bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <input 
        type="text" placeholder="Correo / Usuario" required
        className="w-full p-3 mb-3 border rounded-lg"
        onChange={(e) => setFormData({...formData, username: e.target.value})}
      />
      <input 
        type="password" placeholder="Contraseña" required
        className="w-full p-3 mb-4 border rounded-lg"
        onChange={(e) => setFormData({...formData, password: e.target.value})}
      />
      <button type="submit" className="w-full bg-slate-900 text-white p-3 rounded-lg font-bold">
        Ingresar
      </button>
      {error && <p className="text-red-500 text-sm mt-3 text-center">{error}</p>}
    </form>
  );
}