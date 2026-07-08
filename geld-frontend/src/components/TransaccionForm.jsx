import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';

export default function TransaccionForm({ transaccionAEditar, onGuardadoExitoso, onCancelar }) {
  const [cuentas, setCuentas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    tipo: 'Gasto',
    monto: '',
    concepto: '',
    id_cuenta: '',
    id_categoria: '',
    id_cuenta_destino: '', 
    fecha: new Date().toISOString().split('T')[0] 
  });

  // EFECTO 1: Cargar catálogos (se mantiene igual)
  useEffect(() => {
    const fetchCatalogos = async () => {
      try {
        const [resCuentas, resCategorias] = await Promise.all([
          apiFetch('http://localhost:8000/cuentas/'),
          apiFetch('http://localhost:8000/categorias/')
        ]);
        
        setCuentas(await resCuentas.json());
        setCategorias(await resCategorias.json());
      } catch (err) {
        setError('No pudimos cargar tus cuentas o categorías. Verifica tu conexión.');
      }
    };
    fetchCatalogos();
  }, []);

  // NUEVO EFECTO 2: Precargar datos si estamos en Modo Edición
  useEffect(() => {
    if (transaccionAEditar) {
      // Traducir el enum de PostgreSQL al texto de la UI
      let tipoUI = 'Gasto';
      if (transaccionAEditar.tipo === 'ABONO') tipoUI = 'Ingreso';
      if (transaccionAEditar.tipo === 'TRANSFERENCIA') tipoUI = 'Transferencia';

      setFormData({
        tipo: tipoUI,
        monto: transaccionAEditar.monto || '',
        concepto: transaccionAEditar.descripcion || '',
        id_cuenta: transaccionAEditar.cuenta_id || '',
        id_categoria: transaccionAEditar.categoria_id || '',
        id_cuenta_destino: transaccionAEditar.cuenta_destino_id || '',
        // Cortar la hora si el backend devuelve un timestamp completo
        fecha: transaccionAEditar.fecha ? transaccionAEditar.fecha.split('T')[0] : new Date().toISOString().split('T')[0]
      });
    }
  }, [transaccionAEditar]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      let tipoEnum = 'CARGO'; 
      if (formData.tipo === 'Ingreso') tipoEnum = 'ABONO';
      if (formData.tipo === 'Transferencia') tipoEnum = 'TRANSFERENCIA';

      const payload = {
        cuenta_id: String(formData.id_cuenta),
        monto: parseFloat(formData.monto),
        tipo: tipoEnum,
        fecha: formData.fecha,
        tipo_de_cambio: 1.0,
        descripcion: formData.concepto || null,
      };

      if (formData.tipo === 'Transferencia') {
        payload.cuenta_destino_id = String(formData.id_cuenta_destino);
      } else {
        payload.categoria_id = String(formData.id_categoria);
      }

      // LÓGICA DINÁMICA: Elegir endpoint y método según el modo
      const isEditing = !!transaccionAEditar;
      const endpoint = isEditing 
        ? `http://localhost:8000/transacciones/${transaccionAEditar.id}`
        : 'http://localhost:8000/transacciones/';
      const httpMethod = isEditing ? 'PUT' : 'POST';

      const response = await apiFetch(endpoint, {
        method: httpMethod,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData.detail) || 'Error en las validaciones del backend.');
      }

      setSuccess(true);
      
      // Si todo sale bien, ejecutamos la función de éxito (si nos la pasaron)
      if (onGuardadoExitoso) {
        setTimeout(() => onGuardadoExitoso(), 1000); // 1 segundo para que el usuario lea "Éxito"
      } else if (!isEditing) {
        // Solo limpiamos si es una inserción nueva y no hay redirección
        setFormData({
          ...formData,
          monto: '',
          concepto: '',
          id_cuenta: '',
          id_categoria: '',
          id_cuenta_destino: ''
        });
      }

    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mt-4 mb-20">
      {/* Título dinámico y Botón de Cancelar */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">
          {transaccionAEditar ? 'Editar Movimiento' : 'Nueva Transacción'}
        </h2>
        {/* Si estamos editando y nos pasaron la función onCancelar, mostramos la tacha */}
        {transaccionAEditar && onCancelar && (
          <button
            type="button"
            onClick={onCancelar}
            className="text-slate-400 hover:bg-slate-100 hover:text-slate-800 w-8 h-8 flex items-center justify-center rounded-full transition-colors font-bold text-lg"
            title="Cancelar edición"
          >
            ✕
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm break-words">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {transaccionAEditar ? '¡Cambios guardados con éxito!' : '¡Movimiento registrado con éxito!'}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-2">Tipo de Movimiento</label>
          <div className="grid grid-cols-3 gap-2">
            {['Gasto', 'Ingreso', 'Transferencia'].map((tipo) => (
              <button
                type="button"
                key={tipo}
                onClick={() => setFormData({ ...formData, tipo, id_categoria: '', id_cuenta_destino: '' })}
                className={`py-2 text-sm font-medium rounded-lg border transition-colors ${
                  formData.tipo === tipo 
                    ? 'bg-slate-800 text-white border-slate-800' 
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                }`}
              >
                {tipo}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">Monto ($)</label>
            <input
              type="number"
              name="monto"
              step="0.01"
              required
              min="0.01"
              value={formData.monto}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-lg font-medium"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">Fecha</label>
            <input
              type="date"
              name="fecha"
              required
              value={formData.fecha}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-1">
            {formData.tipo === 'Ingreso' ? 'Depositar en' : 'Cuenta de Origen'}
          </label>
          <select
            name="id_cuenta"
            required
            value={formData.id_cuenta}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
          >
            <option value="">Selecciona una cuenta...</option>
            {Array.isArray(cuentas) && cuentas.map(c => <option key={c.id} value={c.id}>{c.nombre_cuenta}</option>)}
          </select>
        </div>

        {formData.tipo === 'Transferencia' && (
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">Cuenta Destino</label>
            <select
              name="id_cuenta_destino"
              required={formData.tipo === 'Transferencia'}
              value={formData.id_cuenta_destino}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
            >
              <option value="">Selecciona la cuenta destino...</option>
              {Array.isArray(cuentas) && cuentas.map(c => (
                <option key={c.id} value={c.id} disabled={c.id === String(formData.id_cuenta)}>
                  {c.nombre_cuenta}
                </option>
              ))}
            </select>
          </div>
        )}

        {formData.tipo !== 'Transferencia' && (
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">Categoría</label>
            <select
              name="id_categoria"
              required={formData.tipo !== 'Transferencia'}
              value={formData.id_categoria}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
            >
              <option value="">Selecciona una categoría...</option>
              {Array.isArray(categorias) && categorias.map(c => (
                <option key={c.id} value={c.id}>{c.nombre_categoria}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-1">Concepto (Opcional)</label>
          <input
            type="text"
            name="concepto"
            value={formData.concepto}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            placeholder="Ej. Tacos de la esquina"
          />
        </div>

        {/* Botón dinámico */}
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-6 bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Guardando...
            </span>
          ) : (
            transaccionAEditar ? 'Guardar Cambios' : 'Registrar Movimiento'
          )}
        </button>

      </form>
    </div>
  );
}