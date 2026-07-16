import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';

export default function CuentaForm({ cuentaAEditar, onGuardadoExitoso, onCancelar }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    id: '', // Se calculará de manera automática por abajo
    nombre_cuenta: '',
    saldo_inicial: '',
    moneda: 'MXN',
    tipo_cuenta: 'Efectivo' 
  });

  // Efecto para precargar datos en Modo Edición o autogenerar ID consecutivo en Modo Creación
  useEffect(() => {
    if (cuentaAEditar) {
      setFormData({
        id: cuentaAEditar.id || '',
        nombre_cuenta: cuentaAEditar.nombre_cuenta || '',
        saldo_inicial: cuentaAEditar.saldo_inicial || '',
        moneda: cuentaAEditar.moneda || 'MXN',
        tipo_cuenta: cuentaAEditar.tipo_cuenta || 'Efectivo' 
      });
    } else {
      // MODO CREACIÓN: Consultar consecutividad de forma transparente por debajo
      const generarIdConsecutivo = async () => {
        try {
          const response = await apiFetch('http://localhost:8000/cuentas/');
          if (response.ok) {
            const cuentasExistentes = await response.json();
            // Si hay 2 cuentas, el siguiente número es 3 -> Formateamos a 'CTA-03'
            const siguienteNumero = cuentasExistentes.length + 1;
            const nuevoId = `CTA-${String(siguienteNumero).padStart(2, '0')}`;
            setFormData(prev => ({ ...prev, id: nuevoId }));
          }
        } catch (err) {
          console.error("Error al autogenerar el ID consecutivo:", err);
        }
      };
      generarIdConsecutivo();
    }
  }, [cuentaAEditar]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const payload = {
        id: formData.id,
        nombre_cuenta: formData.nombre_cuenta,
        saldo_inicial: parseFloat(formData.saldo_inicial),
        moneda: formData.moneda,
        tipo_cuenta: formData.tipo_cuenta 
      };

      const isEditing = !!cuentaAEditar;
      const endpoint = isEditing 
        ? `http://localhost:8000/cuentas/${cuentaAEditar.id}`
        : 'http://localhost:8000/cuentas/';
      const httpMethod = isEditing ? 'PUT' : 'POST';

      const response = await apiFetch(endpoint, {
        method: httpMethod,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.detail && Array.isArray(errorData.detail)) {
            const mensajesExactos = errorData.detail.map(err => `'${err.loc[err.loc.length - 1]}': ${err.msg}`).join(' | ');
            throw new Error(`El backend rechazó los datos: ${mensajesExactos}`);
        }
        throw new Error(errorData.detail || 'Error al registrar la cuenta en el backend.');
      }

      setSuccess(true);
      
      if (onGuardadoExitoso) {
        setTimeout(() => onGuardadoExitoso(), 1000);
      } else if (!isEditing) {
        setFormData({ id: '', nombre_cuenta: '', saldo_inicial: '', moneda: 'MXN', tipo_cuenta: 'Efectivo' });
      }

    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mt-4 mb-20 animate-fade-in">
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">
          {cuentaAEditar ? 'Editar Cuenta' : 'Nueva Cuenta'}
        </h2>
        {onCancelar && (
          <button
            type="button"
            onClick={onCancelar}
            className="text-slate-400 hover:bg-slate-100 hover:text-slate-800 w-8 h-8 flex items-center justify-center rounded-full transition-colors font-bold text-lg"
            title="Cancelar"
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
          {cuentaAEditar ? '¡Cuenta actualizada con éxito!' : '¡Cuenta creada con éxito!'}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* ID de Cuenta: Visible, con estilo limpio, pero bloqueado (disabled) para evitar cambios manuales */}
        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-1">ID de Cuenta (Autogenerado Consecutivo)</label>
          <input
            type="text"
            name="id"
            required
            disabled={true} // <-- Bloqueado para el usuario en cualquier modo
            value={formData.id}
            className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-slate-100 text-slate-500 font-mono outline-none uppercase font-bold tracking-wider"
            placeholder="Calculando código interno..."
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-1">Nombre de la Billetera/Cuenta</label>
          <input
            type="text"
            name="nombre_cuenta"
            required
            value={formData.nombre_cuenta}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            placeholder="Ej. BBVA Nómina, Efectivo, Cartera..."
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-1">Tipo de Cuenta</label>
          <select
            name="tipo_cuenta"
            required
            value={formData.tipo_cuenta}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-medium text-slate-700"
          >
            <option value="Efectivo">💵 Efectivo</option>
            <option value="Débito">💳 Débito</option>
            <option value="Tarjeta de Crédito">🛍️ Tarjeta de Crédito</option>
            <option value="Ahorros">📈 Ahorros</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">Saldo Inicial ($)</label>
            <input
              type="number"
              name="saldo_inicial"
              step="0.01"
              required
              value={formData.saldo_inicial}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium text-slate-800"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">Moneda</label>
            <select
              name="moneda"
              required
              value={formData.moneda}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-medium text-slate-700"
            >
              <option value="MXN">MXN - Pesos</option>
              <option value="USD">USD - Dólares</option>
              <option value="EUR">EUR - Euros</option>
            </select>
          </div>
        </div>

        {/* Deshabilitamos el botón de guardar si el ID consecutivo aún se está calculando en segundo plano */}
        <button
          type="submit"
          disabled={loading || !formData.id} 
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
            cuentaAEditar ? 'Guardar Cambios' : 'Crear Cuenta'
          )}
        </button>

      </form>
    </div>
  );
}