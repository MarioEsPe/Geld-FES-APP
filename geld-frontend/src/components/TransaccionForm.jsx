import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';

export default function TransaccionForm({ transaccionAEditar, onGuardadoExitoso, onCancelar }) {
  // --- CATÁLOGOS DINÁMICOS DEL BACKEND ---
  const [cuentas, setCuentas] = useState([]);
  const [categoriasPrincipales, setFamilias] = useState([]); // Familias en backend
  const [subcategorias, setCategorias] = useState([]);       // Categorías en backend

  // --- ESTADOS DE CONTROL ---
  const [loadingCatalogos, setLoadingCatalogos] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // --- ESTADO DEL FORMULARIO ---
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0], // Fecha de hoy por defecto
    monto: '',
    tipo: 'CARGO',
    categoria_id: '',
    cuenta_id: '',
    cuenta_destino_id: '',
    tipo_de_cambio: '1.0000',
    descripcion: ''
  });

  // 1. Carga inicial de todos los catálogos requeridos
  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        setLoadingCatalogos(true);
        const [resCuentas, resFamilias, resCategorias] = await Promise.all([
          apiFetch('http://127.0.0.1:8000/cuentas/'),
          apiFetch('http://127.0.0.1:8000/familias/'),
          apiFetch('http://127.0.0.1:8000/categorias/')
        ]);

        if (!resCuentas.ok || !resFamilias.ok || !resCategorias.ok) {
          throw new Error('No se pudieron descargar los catálogos del servidor.');
        }

        const dataCuentas = await resCuentas.json();
        const dataFamilias = await resFamilias.json();
        const dataCategorias = await resCategorias.json();

        setCuentas(dataCuentas);
        setFamilias(dataFamilias);
        setCategorias(dataCategorias);

        // Si estamos editando un movimiento existente, precargamos su estado
        if (transaccionAEditar) {
          setFormData({
            fecha: transaccionAEditar.fecha || '',
            monto: Math.abs(transaccionAEditar.monto) || '',
            tipo: transaccionAEditar.tipo || 'CARGO',
            categoria_id: transaccionAEditar.categoria_id || '',
            cuenta_id: transaccionAEditar.cuenta_id || '',
            cuenta_destino_id: transaccionAEditar.cuenta_destino_id || '',
            tipo_de_cambio: transaccionAEditar.tipo_de_cambio || '1.0000',
            descripcion: transaccionAEditar.descripcion || ''
          });
        } else {
          // Si es una nueva captura, preseleccionamos la primera cuenta si existe
          if (dataCuentas.length > 0) {
            setFormData(prev => ({ ...prev, cuenta_id: dataCuentas[0].id }));
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingCatalogos(false);
      }
    };

    cargarCatalogos();
  }, [transaccionAEditar]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // UX: Si cambia el tipo y deja de ser TRANSFERENCIA, limpiamos la cuenta destino
      ...(name === 'tipo' && value !== 'TRANSFERENCIA' ? { cuenta_destino_id: '' } : {})
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Validaciones básicas de negocio antes de persistir en el backend
    if (formData.tipo === 'TRANSFERENCIA' && formData.cuenta_id === formData.cuenta_destino_id) {
      setError('La cuenta origen y destino no pueden ser la misma en una transferencia.');
      setIsSubmitting(false);
      return;
    }

    const esEdicion = !!transaccionAEditar;
    const url = esEdicion
      ? `http://127.0.0.1:8000/transacciones/${transaccionAEditar.id}`
      : 'http://127.0.0.1:8000/transacciones/';
    const method = esEdicion ? 'PUT' : 'POST';

    // Construcción limpia del payload conforme a los requerimientos de la DB
    const payload = {
      fecha: formData.fecha,
      monto: parseFloat(formData.monto),
      tipo: formData.tipo,
      categoria_id: formData.categoria_id,
      cuenta_id: formData.cuenta_id,
      cuenta_destino_id: formData.tipo === 'TRANSFERENCIA' ? formData.cuenta_destino_id : null,
      tipo_de_cambio: parseFloat(formData.tipo_de_cambio),
      descripcion: formData.descripcion || null
    };

    try {
      const response = await apiFetch(url, {
        method,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Ocurrió un error inesperado al procesar el movimiento.');
      }

      if (onGuardadoExitoso) onGuardadoExitoso();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingCatalogos) {
    return <div className="p-6 text-center text-sm font-semibold text-slate-500">Preparando panel de captura...</div>;
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm max-w-xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-black text-slate-800 tracking-tight">
          {transaccionAEditar ? '📝 Editar Movimiento' : '💰 Captura de Transacción'}
        </h2>
        {onCancelar && (
          <button 
            type="button" 
            onClick={onCancelar} 
            className="text-slate-400 hover:text-slate-600 font-bold p-1 text-sm"
          >
            ✕ Cancelar
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 bg-red-50 text-red-600 text-xs font-bold p-3 rounded-xl border border-red-100">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* FILA 1: Tipo de Movimiento */}
        <div>
          <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-1.5">Tipo de Movimiento</label>
          <div className="grid grid-cols-3 gap-2">
            {['CARGO', 'ABONO', 'TRANSFERENCIA'].map(t => (
              <button
                key={t}
                type="button"
                onClick={() => handleChange({ target: { name: 'tipo', value: t } })}
                className={`py-2.5 rounded-xl font-bold text-xs border transition-all ${
                  formData.tipo === t
                    ? t === 'ABONO'
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-500 shadow-sm'
                      : t === 'CARGO'
                      ? 'bg-red-50 text-red-600 border-red-500 shadow-sm'
                      : 'bg-blue-50 text-blue-600 border-blue-500 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                }`}
              >
                {t === 'CARGO' ? '📉 Gasto' : t === 'ABONO' ? '📈 Ingreso' : '🔄 Transf.'}
              </button>
            ))}
          </div>
        </div>

        {/* FILA 2: Monto y Fecha */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Monto ($)</label>
            <input
              type="number" name="monto" required min="0.01" step="0.01"
              placeholder="0.00" className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl font-mono text-sm focus:bg-white focus:ring-2 focus:ring-slate-800 outline-none transition-all"
              value={formData.monto} onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Fecha</label>
            <input
              type="date" name="fecha" required
              className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-slate-800 outline-none transition-all"
              value={formData.fecha} onChange={handleChange}
            />
          </div>
        </div>

        {/* FILA 3: Cuentas (Dinámicas) */}
        <div className={formData.tipo === 'TRANSFERENCIA' ? 'grid grid-cols-2 gap-4' : 'block'}>
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-1">
              {formData.tipo === 'TRANSFERENCIA' ? 'Cuenta Origen' : 'Cuenta'}
            </label>
            <select
              name="cuenta_id" required
              className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-slate-800 outline-none transition-all"
              value={formData.cuenta_id} onChange={handleChange}
            >
              <option value="" disabled>Selecciona cuenta...</option>
              {cuentas.map(c => (
                <option key={c.id} value={c.id}>{c.nombre_cuenta} ({c.moneda})</option>
              ))}
            </select>
          </div>

          {formData.tipo === 'TRANSFERENCIA' && (
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Cuenta Destino</label>
              <select
                name="cuenta_destino_id" required
                className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all animate-fade-in"
                value={formData.cuenta_destino_id} onChange={handleChange}
              >
                <option value="">Selecciona destino...</option>
                {cuentas.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre_cuenta} ({c.moneda})</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* FILA 4: Selector Dinámico y Agrupado de Subcategorías (Backend: Categorias) */}
        <div>
          <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Subcategoría</label>
          <select
            name="categoria_id" required
            className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-slate-800 outline-none transition-all"
            value={formData.categoria_id} onChange={handleChange}
          >
            <option value="" disabled>Selecciona una opción...</option>
            {categoriasPrincipales.map(familia => {
              // Filtramos las subcategorías (categorías backend) correspondientes a este grupo principal (familia)
              const hijas = subcategorias.filter(sub => sub.familia_id === familia.id);
              
              if (hijas.length === 0) return null;

              return (
                <optgroup key={familia.id} label={familia.nombre_familia.toUpperCase()}>
                  {hijas.map(sub => (
                    <option key={sub.id} value={sub.id}>
                      {sub.icono} {sub.nombre_categoria}
                    </option>
                  ))}
                </optgroup>
              );
            })}
          </select>
        </div>

        {/* FILA 5: Tipo de Cambio (Sólo visible opcionalmente si es necesario) */}
        {formData.tipo === 'TRANSFERENCIA' && (
          <div className="animate-fade-in">
            <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Tipo de Cambio (Destino / Origen)</label>
            <input
              type="number" name="tipo_de_cambio" required min="0.0001" step="0.0001"
              className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl font-mono text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={formData.tipo_de_cambio} onChange={handleChange}
            />
            <p className="text-[10px] text-slate-400 mt-1">Multiplica el monto origen para calcular el impacto en la cuenta destino si manejan divisas distintas.</p>
          </div>
        )}

        {/* FILA 6: Descripción */}
        <div>
          <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Descripción / Nota</label>
          <input
            type="text" name="descripcion" placeholder="Ej. Despensa mensual Chedraui, pago de luz..."
            className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-slate-800 outline-none transition-all"
            value={formData.descripcion} onChange={handleChange}
          />
        </div>

        {/* BOTÓN DE ACCIÓN */}
        <div className="pt-2">
          <button
            type="submit" disabled={isSubmitting}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm py-3 rounded-xl transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Procesando movimiento económico...' : transaccionAEditar ? 'Confirmar Cambios' : 'Registrar Transacción'}
          </button>
        </div>
      </form>
    </div>
  );
}