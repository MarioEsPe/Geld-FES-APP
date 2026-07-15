import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';

export default function CuentasLista({ onNuevaCuentaClick, onCuentaClick }) {
  const [cuentas, setCuentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCuentas = async () => {
      try {
        setLoading(true);
        const response = await apiFetch('http://localhost:8000/cuentas/resumen/saldos');
        if (!response.ok) throw new Error('Error al cargar las cuentas');
        
        const data = await response.json();
        setCuentas(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCuentas();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <span className="text-sm font-medium text-slate-400">Cargando billetera...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-4">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4 relative min-h-[50vh]">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
          Mis Cuentas
        </h3>
      </div>

      {cuentas.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center">
          <p className="text-slate-500 mb-4">No tienes cuentas registradas aún.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {cuentas.map((cuenta) => (
            <div 
              key={cuenta.id}
              onClick={() => onCuentaClick && onCuentaClick(cuenta)}
              className="bg-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform"
            >
              {/* Decoración visual de tarjeta */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10 pointer-events-none"></div>
              
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="text-emerald-400">
                  <span className="text-xs font-black tracking-widest bg-emerald-400/10 px-2 py-1 rounded">
                    {cuenta.moneda}
                  </span>
                </div>
                <div className="text-slate-400 text-xs font-mono">
                  {cuenta.id}
                </div>
              </div>
              
              <div className="relative z-10">
                <p className="text-slate-300 text-xs mb-1">Saldo Disponible</p>
                <p className="text-2xl font-black text-white tracking-tight">
                  ${parseFloat(cuenta.saldo_actual).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm font-medium text-slate-400 mt-4 uppercase tracking-wide">
                  {cuenta.nombre_cuenta}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FAB para agregar cuenta */}
      <button
        onClick={onNuevaCuentaClick}
        className="fixed bottom-20 right-6 w-14 h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full flex items-center justify-center text-3xl font-light shadow-xl transition-all hover:scale-105 active:scale-95 z-40 border border-emerald-500 animate-fade-in"
        title="Crear nueva cuenta"
      >
        +
      </button>
    </div>
  );
}