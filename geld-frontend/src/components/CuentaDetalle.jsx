import React, { useState } from 'react';
import { apiFetch } from '../utils/api';

export default function CuentaDetalle({ cuenta, onRegresar, onCuentaEliminada, onEditarClick }) {
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState(null);

  const handleEliminar = async () => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar la cuenta "${cuenta.nombre_cuenta}"?`)) return;

    try {
      setEliminando(true);
      setError(null);
      
      const response = await apiFetch(`http://localhost:8000/cuentas/${cuenta.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Si el backend lanza un error de integridad (ej. tiene transacciones), lo mostramos.
        throw new Error(errorData.detail || 'No se pudo eliminar la cuenta. Verifica que no tenga movimientos asociados.');
      }

      if (onCuentaEliminada) onCuentaEliminada();
    } catch (err) {
      setError(err.message);
    } finally {
      setEliminando(false);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in relative h-full">
      
      {/* BARRA SUPERIOR */}
      <div className="flex justify-between items-center bg-white p-3 border border-slate-200 rounded-xl shadow-sm">
        <button 
          onClick={onRegresar}
          className="text-xs text-slate-500 font-bold hover:text-slate-800 transition-colors px-3 py-1.5 bg-slate-50 rounded-lg"
        >
          ← Regresar
        </button>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={onEditarClick}
            className="text-xs text-blue-600 font-bold hover:bg-blue-50 transition-colors px-3 py-1.5 rounded-lg"
          >
            ✏️ Editar
          </button>
          
          <button 
            onClick={handleEliminar}
            disabled={eliminando}
            className={`text-xs text-red-600 font-bold hover:bg-red-50 transition-colors px-3 py-1.5 rounded-lg ${
              eliminando ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {eliminando ? 'Borrando...' : '🗑️ Borrar'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {/* TARJETA DE DETALLE */}
      <div className="bg-slate-800 rounded-2xl p-8 shadow-lg relative overflow-hidden text-center mt-6">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10 pointer-events-none"></div>
        
        <span className="inline-block text-[10px] font-black uppercase tracking-wider px-3 py-1.5 bg-emerald-400/20 text-emerald-300 rounded-full mb-4">
          {cuenta.tipo_cuenta || 'CUENTA'}
        </span>
        
        <h2 className="text-4xl font-black text-white tracking-tight mb-2">
          ${parseFloat(cuenta.saldo_actual || cuenta.saldo_inicial).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
        </h2>
        
        <p className="text-lg font-bold text-slate-300 mb-6">
          {cuenta.nombre_cuenta}
        </p>

        <div className="grid grid-cols-2 gap-4 text-left border-t border-slate-700 pt-6">
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Moneda</p>
            <p className="text-white font-medium">{cuenta.moneda}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">ID Interno</p>
            <p className="text-white font-mono text-sm">{cuenta.id}</p>
          </div>
        </div>
      </div>
    </div>
  );
}