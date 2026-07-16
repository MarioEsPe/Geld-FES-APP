import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';

export default function ResumenMes() {
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarResumen = async () => {
      try {
        const res = await apiFetch('http://127.0.0.1:8000/transacciones/resumen/mes-actual');
        if (!res.ok) throw new Error('Error al cargar el resumen del mes');
        const data = await res.json();
        setResumen(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    cargarResumen();
  }, []);

  if (loading) return <div className="animate-pulse text-center text-slate-400 p-8 text-sm font-bold">Calculando tablero de control...</div>;
  if (error) return <div className="text-red-500 p-4 text-center text-sm font-bold bg-red-50 rounded-xl border border-red-100">{error}</div>;
  if (!resumen) return null;

  // Helper para dar formato de dinero bonito
  const formatoMoneda = (valor) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(valor);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* FILA 1: Tarjetas de Indicadores Principales */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-center items-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Total Gastos (Mes)</span>
          <span className="text-2xl font-black text-slate-800">{formatoMoneda(resumen.total_gastos)}</span>
        </div>
        
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-center items-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Promedio Diario</span>
          <span className="text-2xl font-black text-slate-800">{formatoMoneda(resumen.promedio_diario)}</span>
          <span className="text-[9px] font-bold text-slate-400 mt-0.5 bg-slate-100 px-2 py-0.5 rounded-full">
            Día {resumen.dias_transcurridos}
          </span>
        </div>
      </div>

      {/* FILA 2: Desglose con Barras de Progreso */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-5">
          Desglose de Presupuesto
        </h3>
        
        {resumen.desglose.length === 0 ? (
          <p className="text-sm text-slate-400 italic text-center py-4">No hay gastos registrados este mes.</p>
        ) : (
          <div className="space-y-6">
            {resumen.desglose.map((item, index) => {
              // Lógica de semáforo para la barra
              let colorBarra = "bg-emerald-500";
              if (item.porcentaje_usado > 75) colorBarra = "bg-yellow-400";
              if (item.porcentaje_usado >= 100) colorBarra = "bg-red-500";

              // Limitamos visualmente la barra al 100% para que no rompa el diseño si te pasas
              const anchoBarra = Math.min(item.porcentaje_usado, 100);

              return (
                <div key={index} className="space-y-1.5">
                  <div className="flex justify-between items-end">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl drop-shadow-sm">{item.icono}</span>
                      <div>
                        <p className="text-sm font-bold text-slate-700 leading-tight">
                          {item.categoria_principal} <span className="text-slate-400 font-normal ml-1">/ {item.subcategoria}</span>
                        </p>
                        <p className="text-[10px] font-bold text-slate-400">
                          {item.presupuesto_mensual > 0 
                            ? `Ppto: ${formatoMoneda(item.presupuesto_mensual)}` 
                            : 'Sin ppto. definido'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-800">{formatoMoneda(item.total_gastado)}</p>
                      <p className={`text-[10px] font-bold ${item.porcentaje_usado >= 100 ? 'text-red-500' : 'text-slate-400'}`}>
                        {item.porcentaje_usado}%
                      </p>
                    </div>
                  </div>
                  
                  {/* Barra Track */}
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                    <div
                      className={`h-2 rounded-full transition-all duration-1000 ease-out ${colorBarra}`}
                      style={{ width: `${anchoBarra}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}