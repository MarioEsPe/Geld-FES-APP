import React, { useState } from 'react';
import Patrimonio from './Patrimonio';
import TransaccionForm from './TransaccionForm';
import HistorialLista from './HistorialLista';
import GraficaGastos from './GraficaGastos';
import TransaccionDetalle from './TransaccionDetalle';

export default function DashboardHub() {
  const [vistaActiva, setVistaActiva] = useState('resumen');
  // NUEVO: Estado para saber qué transacción se seleccionó
  const [transaccionActiva, setTransaccionActiva] = useState(null);

  // NUEVA: Función que se dispara al hacer clic en un elemento del historial
  const handleTransaccionClick = (tx) => {
    setTransaccionActiva(tx);
    setVistaActiva('detalle');
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full overflow-hidden bg-slate-50 relative">
      
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 flex-shrink-0 z-10 shadow-sm relative">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-800 tracking-tight">
              GELD <span className="text-emerald-600 font-medium">FES</span>
            </h1>
            <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2.5 py-1 rounded-full hidden sm:inline-block">
              Operativo
            </span>
          </div>
          
          <button 
            onClick={() => {
              localStorage.removeItem('geld_token');
              window.location.href = '/login';
            }}
            className="text-xs font-bold text-slate-400 hover:text-red-600 transition-colors bg-slate-50 hover:bg-red-50 px-3 py-1.5 rounded-lg"
          >
            Salir
          </button>
        </div>
      </header>

      {/* MAIN */}
      <main className="flex-1 overflow-y-auto px-4 pt-6 pb-24">
        
        {vistaActiva === 'resumen' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Mi Patrimonio
              </h3>
              <Patrimonio />
            </div>

            <GraficaGastos />
            
            <div className="bg-slate-800 text-white rounded-2xl p-6 shadow-sm mt-4">
              <h4 className="font-bold text-base mb-1">¿Registrar movimiento?</h4>
              <p className="text-slate-400 text-xs mb-4">Añade tus ingresos o gastos del día.</p>
              <button 
                onClick={() => setVistaActiva('nueva')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors shadow w-full"
              >
                + Capturar Ahora
              </button>
            </div>
          </div>
        )}

        {vistaActiva === 'nueva' && (
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

        {vistaActiva === 'historial' && (
          <div className="space-y-2 relative">
            <button 
              onClick={() => setVistaActiva('resumen')}
              className="text-xs text-slate-500 font-medium flex items-center gap-1 hover:text-slate-800 transition-colors mb-2"
            >
              ← Volver al Patrimonio
            </button>
            
            {/* NUEVO: Pasamos la función al componente hijo */}
            <HistorialLista onTransaccionClick={handleTransaccionClick} />

            <button
              onClick={() => setVistaActiva('nueva')}
              className="fixed bottom-20 right-6 w-14 h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full flex items-center justify-center text-3xl font-light shadow-xl transition-all hover:scale-105 active:scale-95 z-40 border border-emerald-500 animate-fade-in"
              title="Agregar transacción"
            >
              +
            </button>
          </div>
        )}

        {/* VISTA 3: DETALLE DE TRANSACCIÓN */}
     {vistaActiva === 'detalle' && transaccionActiva && (
       <TransaccionDetalle 
         transaccion={transaccionActiva}
         onRegresar={() => setVistaActiva('historial')}
         onTransaccionEliminada={() => {
           setTransaccionActiva(null);
           setVistaActiva('historial'); // Al borrar, regresa al historial
         }}
         onEditarClick={() => {
           // Por ahora lo mandamos al formulario común, en lo que pre-poblamos los datos
           setVistaActiva('nueva');
         }}
       />
     )}

      </main>

      {/* NAV */}
      <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 shadow-[0_-4px_15px_rgba(0,0,0,0.05)] py-2 px-6 z-50">
        <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
          
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

          {/* Hacemos que Historial se quede marcado en verde si estamos en la vista de detalle */}
          <button
            type="button"
            onClick={() => setVistaActiva('historial')}
            className={`flex flex-col items-center justify-center py-2 rounded-xl transition-all ${
              vistaActiva === 'historial' || vistaActiva === 'detalle'
                ? 'text-emerald-600 font-bold bg-emerald-50'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <span className="text-xs">📋 Historial</span>
          </button>

        </div>
      </nav>
      
    </div>
  );
}