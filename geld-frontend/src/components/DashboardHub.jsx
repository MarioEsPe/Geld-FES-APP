import React, { useState } from 'react';
import Patrimonio from './Patrimonio';
import TransaccionForm from './TransaccionForm';
import HistorialLista from './HistorialLista';
import GraficaGastos from './GraficaGastos';
import TransaccionDetalle from './TransaccionDetalle';
import CuentasLista from './CuentasLista';
import CuentaForm from './CuentaForm';
import CuentaDetalle from './CuentaDetalle';
import GestorCategorias from './GestorCategorias';
import ResumenMes from './ResumenMes';

export default function DashboardHub() {
  const [vistaActiva, setVistaActiva] = useState('resumen');
  // Estado para saber qué transacción se seleccionó
  const [transaccionActiva, setTransaccionActiva] = useState(null);
  const [cuentaActiva, setCuentaActiva] = useState(null);

  // Función que se dispara al hacer clic en un elemento del historial
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
            
            {/* 🟢 MODIFICACIÓN B: Botón de Categorías en la parte superior */}
            <button
              onClick={() => {
                setTransaccionActiva(null);
                setCuentaActiva(null);
                setVistaActiva('gestorCategorias');
              }}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ml-2 ${
                vistaActiva === 'gestorCategorias'
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                  : 'bg-slate-50 text-slate-500 hover:text-slate-800 border border-transparent'
              }`}
            >
              ⚙️ Categorías
            </button>
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
            
            {/* NUEVO TABLERO DE CONTROL MENSUAL */}
            <ResumenMes />
            
            {/* BOTÓN DE CAPTURA RÁPIDA (Se mantiene) */}
            <div className="bg-slate-800 text-white rounded-2xl p-6 shadow-sm mt-4">
              <h4 className="font-bold text-base mb-1">¿Registrar movimiento?</h4>
              <p className="text-slate-400 text-xs mb-4">Añade tus ingresos o gastos del día.</p>
              <button 
                onClick={() => {
                  setTransaccionActiva(null);
                  setVistaActiva('nueva');
                }}
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
              onClick={() => {
                setVistaActiva(transaccionActiva ? 'historial' : 'resumen');
              }}
              className="text-xs text-slate-500 font-medium flex items-center gap-1 hover:text-slate-800 transition-colors mb-2"
            >
              ← Volver al {transaccionActiva ? 'Historial' : 'Patrimonio'}
            </button>
            
            <TransaccionForm 
              transaccionAEditar={transaccionActiva} 
              onGuardadoExitoso={() => {
                setTransaccionActiva(null); 
                setVistaActiva('historial'); 
              }}
              onCancelar={() => {
                setVistaActiva('historial'); 
              }}
            />
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
            
            <HistorialLista onTransaccionClick={handleTransaccionClick} />

            <button
              onClick={() => {
                setTransaccionActiva(null);
                setVistaActiva('nueva');
              }}
              className="fixed bottom-20 right-6 w-14 h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full flex items-center justify-center text-3xl font-light shadow-xl transition-all hover:scale-105 active:scale-95 z-40 border border-emerald-500 animate-fade-in"
              title="Agregar transacción"
            >
              +
            </button>
          </div>
        )}

        {vistaActiva === 'cuentas' && (
          <div className="space-y-2 animate-fade-in">
            <CuentasLista 
              onNuevaCuentaClick={() => {
                setCuentaActiva(null);
                setVistaActiva('nuevaCuenta');
              }}
              onCuentaClick={(cuenta) => {
                setCuentaActiva(cuenta); 
                setVistaActiva('detalleCuenta'); 
              }}
            />
          </div>
        )}

        {vistaActiva === 'nuevaCuenta' && (
          <div className="space-y-2 animate-fade-in">
            <button 
              onClick={() => {
                setVistaActiva(cuentaActiva ? 'detalleCuenta' : 'cuentas');
              }}
              className="text-xs text-slate-500 font-medium flex items-center gap-1 hover:text-slate-800 transition-colors mb-2"
            >
              ← Volver {cuentaActiva ? 'al Detalle' : 'a Mis Cuentas'}
            </button>
            
            <CuentaForm 
              cuentaAEditar={cuentaActiva} 
              onGuardadoExitoso={() => {
                setCuentaActiva(null);
                setVistaActiva('cuentas');
              }}
              onCancelar={() => {
                setVistaActiva(cuentaActiva ? 'detalleCuenta' : 'cuentas');
              }}
            />
          </div>
        )}

        {vistaActiva === 'detalleCuenta' && cuentaActiva && (
          <CuentaDetalle 
            cuenta={cuentaActiva}
            onRegresar={() => {
              setCuentaActiva(null);
              setVistaActiva('cuentas');
            }}
            onCuentaEliminada={() => {
              setCuentaActiva(null);
              setVistaActiva('cuentas');
            }}
            onEditarClick={() => {
              setVistaActiva('nuevaCuenta'); 
            }}
          />
        )}

        {vistaActiva === 'detalle' && transaccionActiva && (
          <TransaccionDetalle 
            transaccion={transaccionActiva}
            onRegresar={() => setVistaActiva('historial')}
            onTransaccionEliminada={() => {
              setTransaccionActiva(null);
              setVistaActiva('historial'); 
            }}
            onEditarClick={() => {
              setVistaActiva('nueva');
            }}
          />
        )}

        {/* 🟢 MODIFICACIÓN C: Renderizado Condicional del Gestor de Categorías */}
        {vistaActiva === 'gestorCategorias' && (
          <div className="space-y-2 animate-fade-in">
            <button 
              onClick={() => setVistaActiva('resumen')}
              className="text-xs text-slate-500 font-medium flex items-center gap-1 hover:text-slate-800 transition-colors mb-2"
            >
              ← Volver al Resumen
            </button>
            <GestorCategorias />
          </div>
        )}

      </main>

      {/* NAV (Barra Inferior) */}
      <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 shadow-[0_-4px_15px_rgba(0,0,0,0.05)] py-2 px-6 z-50">
        <div className="grid grid-cols-3 gap-2 max-w-lg mx-auto">
          
          <button
            type="button"
            onClick={() => {
              setTransaccionActiva(null);
              setVistaActiva('resumen');
            }}
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
            onClick={() => {
              setTransaccionActiva(null);
              setVistaActiva('cuentas');
            }}
            className={`flex flex-col items-center justify-center py-2 rounded-xl transition-all ${
              vistaActiva === 'cuentas' || vistaActiva === 'nuevaCuenta' || vistaActiva === 'detalleCuenta'
                ? 'text-emerald-600 font-bold bg-emerald-50'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <span className="text-xs">💳 Cuentas</span>
          </button>

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