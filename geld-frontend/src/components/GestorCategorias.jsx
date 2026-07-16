import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';

export default function GestorCategorias() {
  const [familias, setFamilias] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- ESTADOS DEL MODAL DE FAMILIAS ---
  const [modalFamiliaVisible, setModalFamiliaVisible] = useState(false);
  const [familiaForm, setFamiliaForm] = useState({ id: null, nombre_familia: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    setError(null);
    try {
      const [resFamilias, resCategorias] = await Promise.all([
        apiFetch('http://127.0.0.1:8000/familias/'),
        apiFetch('http://127.0.0.1:8000/categorias/')
      ]);

      if (!resFamilias.ok || !resCategorias.ok) {
        throw new Error('Error al cargar la información del servidor.');
      }

      setFamilias(await resFamilias.json());
      setCategorias(await resCategorias.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- CONTROLADORES DEL MODAL DE FAMILIAS ---
  const abrirModalFamilia = (familia = null) => {
    setModalError(null);
    if (familia) {
      // Modo Edición
      setFamiliaForm({ id: familia.id, nombre_familia: familia.nombre_familia });
    } else {
      // Modo Creación
      setFamiliaForm({ id: null, nombre_familia: '' });
    }
    setModalFamiliaVisible(true);
  };

  const cerrarModalFamilia = () => {
    setModalFamiliaVisible(false);
    setFamiliaForm({ id: null, nombre_familia: '' });
  };

  const guardarFamilia = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalError(null);

    const esEdicion = !!familiaForm.id;
    const url = esEdicion 
      ? `http://127.0.0.1:8000/familias/${familiaForm.id}` 
      : `http://127.0.0.1:8000/familias/`;
    const method = esEdicion ? 'PUT' : 'POST';
    
    const payload = esEdicion 
      ? { nombre_familia: familiaForm.nombre_familia }
      : { 
          id: `FAM-${Date.now()}`, // Se generará algo como "FAM-1704283991234"
          nombre_familia: familiaForm.nombre_familia 
        };

    try {
      const res = await apiFetch(url, {
        method,
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Error al guardar la familia');
      }

      await cargarDatos(); // Refrescamos la vista
      cerrarModalFamilia();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const eliminarFamilia = async () => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar la familia "${familiaForm.nombre_familia}"?`)) return;

    setIsSubmitting(true);
    setModalError(null);

    try {
      const res = await apiFetch(`http://127.0.0.1:8000/familias/${familiaForm.id}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const errData = await res.json();
        // Aquí atraparemos el error 400 del backend si la familia tiene categorías hijas
        throw new Error(errData.detail || 'Error al eliminar la familia');
      }

      await cargarDatos();
      cerrarModalFamilia();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };


  if (loading) return <div className="p-8 text-center text-slate-500">Cargando categorías...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Gestor de Categorías</h2>
        <button 
          onClick={() => abrirModalFamilia()} // 🟢 Dispara el Modal de Creación
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Nueva Familia
        </button>
      </div>

      <div className="space-y-6">
        {familias.map((familia) => {
          const categoriasHijas = categorias.filter(c => c.familia_id === familia.id);

          return (
            <div key={familia.id} className="border border-slate-200 rounded-lg p-5 bg-white">
              <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                <h3 className="text-lg font-bold text-slate-700">{familia.nombre_familia}</h3>
                <div className="space-x-3">
                  <button 
                    onClick={() => abrirModalFamilia(familia)} // 🟢 Dispara el Modal de Edición
                    className="text-sm text-slate-400 hover:text-blue-600 font-medium transition-colors"
                  >
                    Editar
                  </button>
                  <button className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors">
                    + Subcategoría
                  </button>
                </div>
              </div>

              {categoriasHijas.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoriasHijas.map(categoria => (
                    <div key={categoria.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-md border border-slate-100 group">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl bg-white p-1 rounded shadow-sm">{categoria.icono || '🏷️'}</span>
                        <div>
                          <p className="font-semibold text-slate-700 text-sm">{categoria.nombre_categoria}</p>
                          <p className="text-xs text-slate-500">Ppto: ${categoria.presupuesto_mensual}</p>
                        </div>
                      </div>
                      <button className="text-xs text-slate-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        Editar
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic py-2">No hay subcategorías en esta familia.</p>
              )}
            </div>
          );
        })}
      </div>

      {/* 🟢 MODAL DE FAMILIAS (Superpuesto) */}
      {modalFamiliaVisible && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">
                {familiaForm.id ? 'Editar Familia' : 'Nueva Familia'}
              </h3>
              <button onClick={cerrarModalFamilia} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            
            <form onSubmit={guardarFamilia} className="p-6 space-y-4">
              {modalError && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">
                  {modalError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de la Familia</label>
                <input
                  type="text"
                  required
                  autoFocus
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="Ej. Vivienda, Transporte..."
                  value={familiaForm.nombre_familia}
                  onChange={(e) => setFamiliaForm({ ...familiaForm, nombre_familia: e.target.value })}
                />
              </div>

              <div className="pt-4 flex justify-between items-center">
                {/* Botón Eliminar: Solo aparece si estamos editando (tiene id) */}
                {familiaForm.id ? (
                  <button
                    type="button"
                    onClick={eliminarFamilia}
                    disabled={isSubmitting}
                    className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors disabled:opacity-50"
                  >
                    Eliminar
                  </button>
                ) : <div></div>}

                <div className="space-x-3">
                  <button
                    type="button"
                    onClick={cerrarModalFamilia}
                    className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}