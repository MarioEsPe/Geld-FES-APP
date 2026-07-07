import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';

export default function HistorialLista({ onTransaccionClick }) { // <-- Prop nueva
  const [transacciones, setTransacciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistorial = async () => {
      try {
        setLoading(true);
        const response = await apiFetch('http://localhost:8000/transacciones/');
        if (!response.ok) throw new Error('Error al cargar el historial');
        
        const json = await response.json();
        setTransacciones(json.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHistorial();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <span className="text-sm font-medium text-slate-400">Cargando movimientos...</span>
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
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-20">
      <div className="p-4 border-b border-slate-100 bg-slate-50">
        <h3 className="text-sm font-bold text-slate-700">Últimos Movimientos</h3>
      </div>
      
      <div className="divide-y divide-slate-100">
        {transacciones.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-400">No hay movimientos registrados.</p>
        ) : (
          transacciones.map((tx) => {
            const isAbono = tx.tipo === 'ABONO';
            const isTransferencia = tx.tipo === 'TRANSFERENCIA';
            
            return (
              // NUEVO: Agregamos onClick y cursor-pointer para que sea un "botón"
              <div 
                key={tx.id} 
                onClick={() => onTransaccionClick && onTransaccionClick(tx)}
                className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors cursor-pointer active:bg-slate-100"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-sm
                    ${isAbono ? 'bg-emerald-100 text-emerald-600' : 
                      isTransferencia ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-500'}`}
                  >
                    {isAbono ? '↓' : isTransferencia ? '⇄' : '↑'}
                  </div>
                  
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      {tx.descripcion || (isTransferencia ? 'Transferencia' : 'Sin concepto')}
                    </p>
                    <p className="text-xs text-slate-400 font-medium">
                      {new Date(tx.fecha).toLocaleDateString('es-MX', { 
                        year: 'numeric', month: 'short', day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className={`text-sm font-bold ${isAbono ? 'text-emerald-600' : isTransferencia ? 'text-slate-600' : 'text-slate-800'}`}>
                    {isAbono ? '+' : isTransferencia ? '' : '-'}$
                    {tx.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}