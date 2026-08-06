import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import TransaccionDetalle from './TransaccionDetalle';

export default function CuentaDetalle({ cuenta, onRegresar, onCuentaEliminada, onEditarClick }) {
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState(null);

  // Estados para el historial de la cuenta y categorías
  const [transacciones, setTransacciones] = useState([]);
  const [loadingTx, setLoadingTx] = useState(true);
  const [categorias, setCategorias] = useState([]);
  
  // Estado para ver el detalle de una transacción específica dentro de la cuenta
  const [txSeleccionada, setTxSeleccionada] = useState(null);

  const cargarTransaccionesYCategorias = async () => {
    try {
      setLoadingTx(true);
      const [resTx, resCat] = await Promise.all([
        apiFetch(`http://localhost:8000/transacciones/?cuenta_id=${cuenta.id}&limit=100`),
        apiFetch('http://localhost:8000/categorias/')
      ]);

      if (resTx.ok && resCat.ok) {
        const dataTx = await resTx.json();
        const dataCat = await resCat.json();
        setTransacciones(dataTx.data || []);
        setCategorias(dataCat || []);
      }
    } catch (err) {
      console.error('Error al cargar movimientos de la cuenta:', err);
    } finally {
      setLoadingTx(false);
    }
  };

  useEffect(() => {
    if (cuenta?.id) {
      cargarTransaccionesYCategorias();
    }
  }, [cuenta]);

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
        throw new Error(errorData.detail || 'No se pudo eliminar la cuenta. Verifica que no tenga movimientos asociados.');
      }

      if (onCuentaEliminada) onCuentaEliminada();
    } catch (err) {
      setError(err.message);
    } finally {
      setEliminando(false);
    }
  };

  // Mapa de categorías para resolución rápida de nombres e íconos
  const catMap = categorias.reduce((acc, cat) => {
    acc[cat.id] = cat;
    return acc;
  }, {});

  // Vista de detalle de una transacción seleccionada de la lista
  if (txSeleccionada) {
    return (
      <TransaccionDetalle
        transaccion={txSeleccionada}
        onRegresar={() => setTxSeleccionada(null)}
        onTransaccionEliminada={() => {
          setTxSeleccionada(null);
          cargarTransaccionesYCategorias();
        }}
        onEditarClick={() => {
          setTxSeleccionada(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* 1. BARRA SUPERIOR DE ACCIONES DE LA CUENTA */}
      <div className="flex justify-between items-center bg-white p-3 border border-slate-200 rounded-xl shadow-sm">
        <button 
          onClick={onRegresar}
          className="text-xs text-slate-500 font-bold hover:text-slate-800 transition-colors px-3 py-1.5 bg-slate-50 rounded-lg"
        >
          ← Volver a Cuentas
        </button>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={onEditarClick}
            className="text-xs text-blue-600 font-bold hover:bg-blue-50 transition-colors px-3 py-1.5 rounded-lg"
          >
            ✏️ Editar Cuenta
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
        <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-semibold">
          {error}
        </div>
      )}

      {/* 2. TARJETA RESUMEN DE LA CUENTA */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="flex justify-between items-start mb-2">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
              {cuenta.tipo_cuenta}
            </span>
            <h2 className="text-xl font-bold text-slate-800 mt-1">{cuenta.nombre_cuenta}</h2>
          </div>
          <span className="text-xs font-mono font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">
            {cuenta.moneda}
          </span>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-baseline">
          <span className="text-xs text-slate-400 font-medium">Saldo Actual</span>
          <span className="text-2xl font-black text-slate-900">
            ${parseFloat(cuenta.saldo_actual ?? cuenta.saldo_inicial).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* 3. HISTORIAL DE MOVIMIENTOS EXCLUSIVO DE ESTA CUENTA */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4 space-y-3">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span>📋</span> Movimientos de esta Cuenta
          </h3>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
            {transacciones.length}
          </span>
        </div>

        {loadingTx ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Cargando historial de la cuenta...
          </div>
        ) : transacciones.length === 0 ? (
          <div className="py-8 text-center space-y-1">
            <p className="text-sm font-medium text-slate-500">Sin movimientos en esta cuenta</p>
            <p className="text-xs text-slate-400">Los cargos, abonos y transferencias de esta cuenta aparecerán aquí.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {transacciones.map((tx) => {
              const cat = catMap[tx.categoria_id];
              const isAbono = tx.tipo === 'ABONO';
              const isTransferencia = tx.tipo === 'TRANSFERENCIA';
              
              // Determinar si para esta cuenta fue salida (-) o entrada (+)
              const esOrigen = tx.cuenta_id === cuenta.id;
              const esSalida = (!isAbono && !isTransferencia) || (isTransferencia && esOrigen);

              return (
                <div 
                  key={tx.id}
                  onClick={() => setTxSeleccionada(tx)}
                  className="py-3 flex items-center justify-between hover:bg-slate-50/80 rounded-xl px-2 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-lg shrink-0">
                      {cat?.icono || (isTransferencia ? '🔄' : isAbono ? '💵' : '💸')}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {tx.descripcion || cat?.nombre_categoria || 'Sin descripción'}
                      </p>

                      <p className="text-[11px] text-slate-400 font-medium">
                        {new Date(`${tx.fecha}T12:00:00`).toLocaleDateString('es-MX', { 
                          day: 'numeric', month: 'short', year: 'numeric' 
                        })}
                        {cat?.nombre_categoria && tx.descripcion ? ` • ${cat.nombre_categoria}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className={`text-sm font-black ${
                      esSalida ? 'text-slate-800' : 'text-emerald-600'
                    }`}>
                      {esSalida ? '-' : '+'}${parseFloat(tx.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </p>
                    <span className="text-[9px] font-bold uppercase text-slate-400">
                      {tx.tipo}
                    </span>
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