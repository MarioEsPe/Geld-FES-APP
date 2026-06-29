import React, { useState } from 'react';
import Patrimonio from './Patrimonio';
import TransaccionForm from './TransaccionForm';

export default function DashboardHub() {
  const [vistaActiva, setVistaActiva] = useState('resumen');

  return (
    // flex-1 hace que llene todo el Layout de Astro
    <div className="flex flex-col flex-1 h-full w-full">
      
      {/* 1. Header (flex-shrink-0 evita que se aplaste) */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 flex-shrink-0 z-10 shadow-sm">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-black text-slate-800 tracking-tight">
            GELD <span className="text-emerald-600 font-medium">FES</span>
          </h1>
          <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2.5 py-1 rounded-full">
            Operativo
          </span>
        </div>
      </header>

      {/* 2. Área Scrolleable Principal */}
      <main className="flex-1 overflow-y-auto px-4 pt-6 pb-6 bg-slate-50">
        {vistaActiva === 'resumen' ? (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Mi Patrimonio
              </h3>
              <Patrimonio />
            </div>
            
            <div className="bg-slate-800 text-white rounded-2xl p-6 shadow-sm">
              <h4 className="font-bold text-base mb-1">¿Registrar movimiento?</h4>
              <p className="text-slate-400 text-xs mb-4">Añade tus ingresos o gastos del día.</p>
              <button 
                onClick={() => setVistaActiva('nueva')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors shadow"
              >
                + Capturar Ahora
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <button 
              onClick={() => setVistaActiva('resumen')}
              className="text-xs text-slate-500 font-medium flex items-center gap-1 hover:text-slate-800 transition-colors mb-2"
            >
              ← Volver al Patrimonio
            </button>
            <TransaccionForm />
          </div>
        )}
      </main>

      {/* 3. Menú Inferior (En lugar de fixed, vive al final del flex de manera natural) */}
      <nav className="bg-white border-t border-slate-200 shadow-[0_-4px_15px_rgba(0,0,0,0.05)] py-2 px-6 flex-shrink-0 z-20">
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setVistaActiva('resumen')}
            className={`flex flex-col items-center justify-center py-2 rounded-xl transition-all ${
              vistaActiva === 'resumen'
                ? 'text-emerald-600 font-bold bg-emerald-50'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <span className="text-xs">📊 Resumen</span>
          </button>

          <button
            type="button"
            onClick={() => setVistaActiva('nueva')}
            className={`flex flex-col items-center justify-center py-2 rounded-xl transition-all ${
              vistaActiva === 'nueva'
                ? 'text-emerald-600 font-bold bg-emerald-50'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <span className="text-xs">➕ Captura</span>
          </button>
        </div>
      </nav>
      
    </div>
  );
}