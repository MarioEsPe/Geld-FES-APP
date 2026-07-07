import React, { useState } from 'react';
import { apiFetch } from '../utils/api';

export default function TransaccionDetalle({ transaccion, onRegresar, onTransaccionEliminada, onEditarClick }) {
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState(null);

  const handleEliminar = async () => {
    // Confirmación nativa simple antes de ejecutar
    if (!window.confirm('¿Estás seguro de que deseas eliminar este movimiento de forma permanente?')) return;

    try {
      setEliminando(true);
      setError(null);
      
      const response = await apiFetch(`http://localhost:8000/transacciones/${transaccion.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('No se pudo eliminar el movimiento');

      // Si todo sale bien, notificamos al padre para limpiar el estado y refrescar la lista
      if (onTransaccionEliminada) onTransaccionEliminada();
    } catch (err) {
      setError(err.message);
    } finally {
      setEliminando(false);
    }
  };

  const isAbono = transaccion.tipo === 'ABONO';
  const isTransferencia = transaccion.tipo === 'TRANSFERENCIA';

  return (
    <div className="space-y-4 animate-fade-in relative h-full">
      
      {/* 1. BARRA SUPERIOR DE HERRAMIENTAS */}
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
        <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs">
          {error}
        </div>
      )}

      {/* 2. TARJETA DE DETALLE PRINCIPAL */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 text-center border-b border-slate-100 bg-slate-50/50">
          <span className={`inline-block text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full mb-3 shadow-sm
            ${isAbono ? 'bg-emerald-100 text-emerald-700' : 
              isTransferencia ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}
          >
            {transaccion.tipo}
          </span>
          
          <h2 className={`text-3xl font-black tracking-tight ${isAbono ? 'text-emerald-600' : isTransferencia ? 'text-slate-600' : 'text-slate-800'}`}>
            {isAbono ? '+' : isTransferencia ? '' : '-'}$
            {parseFloat(transaccion.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </h2>
          
          <p className="text-sm font-bold text-slate-700 mt-2">
            {transaccion.descripcion || 'Sin concepto'}
          </p>
        </div>

        {/* METADATOS SECUNDARIOS */}
        <div className="p-4 divide-y divide-slate-100 text-sm">
          <div className="py-3 flex justify-between">
            <span className="text-slate-400 font-medium">Fecha:</span>
            <span className="font-bold text-slate-700">
              {new Date(transaccion.fecha).toLocaleDateString('es-MX', { 
                year: 'numeric', month: 'long', day: 'numeric' 
              })}
            </span>
          </div>

          <div className="py-3 flex justify-between">
            <span className="text-slate-400 font-medium">Cuenta Origen:</span>
            <span className="font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-bold">
              {transaccion.cuenta_id}
            </span>
          </div>

          {isTransferencia && (
            <div className="py-3 flex justify-between">
              <span className="text-slate-400 font-medium">Cuenta Destino:</span>
              <span className="font-mono bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-xs font-bold">
                {transaccion.cuenta_destino_id}
              </span>
            </div>
          )}

          <div className="py-3 flex justify-between">
            <span className="text-slate-400 font-medium">Categoría ID:</span>
            <span className="text-slate-700 font-semibold">{transaccion.categoria_id || 'N/A'}</span>
          </div>
          
          <div className="py-3 flex justify-between">
            <span className="text-slate-400 font-medium">ID Transacción:</span>
            <span className="text-xs font-mono text-slate-400">{transaccion.id}</span>
          </div>
        </div>
      </div>

      {/* 3. BOTÓN FLOTANTE INFERIOR DERECHA (FAB DE EDICIÓN) */}
      <button
        onClick={onEditarClick}
        className="fixed bottom-20 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center text-xl shadow-xl transition-all hover:scale-105 active:scale-95 z-40 border border-blue-500"
        title="Editar transacción"
      >
        ✏️
      </button>

    </div>
  );
}