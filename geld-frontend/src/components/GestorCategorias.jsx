import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';

export default function GestorCategorias() {
  const [familias, setFamilias] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- ESTADOS: MODAL CATEGORÍA PRINCIPAL (Backend: Familia) ---
  const [modalFamiliaVisible, setModalFamiliaVisible] = useState(false);
  const [familiaForm, setFamiliaForm] = useState({ id: null, nombre_familia: '' });

  // --- ESTADOS: MODAL SUBCATEGORÍA (Backend: Categoria) ---
  const [modalSubVisible, setModalSubVisible] = useState(false);
  const [subForm, setSubForm] = useState({ 
    id: null, 
    nombre_categoria: '', 
    presupuesto_mensual: '', 
    icono: '🏷️', 
    familia_id: '' 
  });

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

      if (!resFamilias.ok || !resCategorias.ok) throw new Error('Error al cargar la información.');

      setFamilias(await resFamilias.json());
      setCategorias(await resCategorias.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // LÓGICA: CATEGORÍAS PRINCIPALES (Familias)
  // ==========================================
  const abrirModalFamilia = (familia = null) => {
    setModalError(null);
    setFamiliaForm(familia ? { id: familia.id, nombre_familia: familia.nombre_familia } : { id: null, nombre_familia: '' });
    setModalFamiliaVisible(true);
  };

  const cerrarModalFamilia = () => {
    setModalFamiliaVisible(false);
  };

  const guardarFamilia = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalError(null);

    const esEdicion = !!familiaForm.id;
    const url = esEdicion ? `http://127.0.0.1:8000/familias/${familiaForm.id}` : `http://127.0.0.1:8000/familias/`;
    const payload = esEdicion 
      ? { nombre_familia: familiaForm.nombre_familia }
      : { id: `FAM-${Date.now()}`, nombre_familia: familiaForm.nombre_familia };

    try {
      const res = await apiFetch(url, { method: esEdicion ? 'PUT' : 'POST', body: JSON.stringify(payload) });
      if (!res.ok) throw new Error((await res.json()).detail || 'Error al guardar');
      await cargarDatos();
      cerrarModalFamilia();
    } catch (err) { setModalError(err.message); } 
    finally { setIsSubmitting(false); }
  };

  const eliminarFamilia = async () => {
    if (!window.confirm(`¿Eliminar la categoría "${familiaForm.nombre_familia}"?`)) return;
    setIsSubmitting(true);
    setModalError(null);
    try {
      const res = await apiFetch(`http://127.0.0.1:8000/familias/${familiaForm.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).detail || 'Error al eliminar');
      await cargarDatos();
      cerrarModalFamilia();
    } catch (err) { setModalError(err.message); } 
    finally { setIsSubmitting(false); }
  };

  // ==========================================
  // LÓGICA: SUBCATEGORÍAS (Categorías)
  // ==========================================
  const abrirModalSub = (familiaId, subcategoria = null) => {
    setModalError(null);
    if (subcategoria) {
      setSubForm({
        id: subcategoria.id,
        nombre_categoria: subcategoria.nombre_categoria,
        presupuesto_mensual: subcategoria.presupuesto_mensual || '',
        icono: subcategoria.icono || '🏷️',
        familia_id: familiaId
      });
    } else {
      setSubForm({ id: null, nombre_categoria: '', presupuesto_mensual: '', icono: '🏷️', familia_id: familiaId });
    }
    setModalSubVisible(true);
  };

  const cerrarModalSub = () => {
    setModalSubVisible(false);
  };

  const guardarSub = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalError(null);

    const esEdicion = !!subForm.id;
    const url = esEdicion ? `http://127.0.0.1:8000/categorias/${subForm.id}` : `http://127.0.0.1:8000/categorias/`;
    
    const payload = {
      nombre_categoria: subForm.nombre_categoria,
      presupuesto_mensual: subForm.presupuesto_mensual ? parseFloat(subForm.presupuesto_mensual) : 0,
      icono: subForm.icono,
      familia_id: subForm.familia_id
    };

    // Si es creación, inyectamos el ID generado dinámicamente
    if (!esEdicion) payload.id = `CAT-${Date.now()}`;

    try {
      const res = await apiFetch(url, { method: esEdicion ? 'PUT' : 'POST', body: JSON.stringify(payload) });
      if (!res.ok) throw new Error((await res.json()).detail || 'Error al guardar subcategoría');
      await cargarDatos();
      cerrarModalSub();
    } catch (err) { setModalError(err.message); } 
    finally { setIsSubmitting(false); }
  };

  const eliminarSub = async () => {
    if (!window.confirm(`¿Eliminar la subcategoría "${subForm.nombre_categoria}"?`)) return;
    setIsSubmitting(true);
    setModalError(null);
    try {
      const res = await apiFetch(`http://127.0.0.1:8000/categorias/${subForm.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).detail || 'Error al eliminar');
      await cargarDatos();
      cerrarModalSub();
    } catch (err) { setModalError(err.message); } 
    finally { setIsSubmitting(false); }
  };


  if (loading) return <div className="p-8 text-center text-slate-500">Cargando datos...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Gestor de Categorías</h2>
        <button 
          onClick={() => abrirModalFamilia()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Nueva Categoría
        </button>
      </div>

      <div className="space-y-6">
        {familias.map((familia) => {
          const categoriasHijas = categorias.filter(c => c.familia_id === familia.id);

          return (
            <div key={familia.id} className="border border-slate-200 rounded-lg p-5 bg-white shadow-sm">
              <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                <h3 className="text-lg font-black text-slate-700">{familia.nombre_familia}</h3>
                <div className="space-x-3">
                  <button 
                    onClick={() => abrirModalFamilia(familia)}
                    className="text-sm text-slate-400 hover:text-blue-600 font-medium transition-colors"
                  >
                    Editar Categoría
                  </button>
                  <button 
                    onClick={() => abrirModalSub(familia.id)} // 🟢 Abrir modal de Subcategoría
                    className="text-sm bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-3 py-1 rounded-md font-medium transition-colors"
                  >
                    + Subcategoría
                  </button>
                </div>
              </div>

              {categoriasHijas.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoriasHijas.map(categoria => (
                    <div key={categoria.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-md border border-slate-200 group">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl bg-white w-10 h-10 flex items-center justify-center rounded shadow-sm border border-slate-100">
                          {categoria.icono}
                        </span>
                        <div>
                          <p className="font-bold text-slate-700 text-sm leading-tight">{categoria.nombre_categoria}</p>
                          <p className="text-xs text-slate-500 font-medium">Ppto: ${categoria.presupuesto_mensual}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => abrirModalSub(familia.id, categoria)} // 🟢 Editar Subcategoría
                        className="text-xs font-bold text-slate-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity bg-white px-2 py-1 rounded border border-slate-200"
                      >
                        Editar
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic py-2">No hay subcategorías registradas.</p>
              )}
            </div>
          );
        })}
      </div>

      {/* ========================================== */}
      {/* MODAL 1: CATEGORÍA PRINCIPAL (Familia)     */}
      {/* ========================================== */}
      {modalFamiliaVisible && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">
                {familiaForm.id ? 'Editar Categoría' : 'Nueva Categoría'}
              </h3>
              <button onClick={cerrarModalFamilia} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            
            <form onSubmit={guardarFamilia} className="p-6 space-y-4">
              {modalError && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">{modalError}</div>}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Nombre de la Categoría</label>
                <input
                  type="text" required autoFocus
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="Ej. Vivienda, Transporte..."
                  value={familiaForm.nombre_familia}
                  onChange={(e) => setFamiliaForm({ ...familiaForm, nombre_familia: e.target.value })}
                />
              </div>
              <div className="pt-4 flex justify-between items-center">
                {familiaForm.id ? (
                  <button type="button" onClick={eliminarFamilia} disabled={isSubmitting} className="text-sm text-red-500 hover:text-red-700 font-bold disabled:opacity-50">Eliminar</button>
                ) : <div></div>}
                <div className="space-x-3">
                  <button type="button" onClick={cerrarModalFamilia} className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg">Cancelar</button>
                  <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50">
                    {isSubmitting ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 2: SUBCATEGORÍA (Categoría)          */}
      {/* ========================================== */}
      {modalSubVisible && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">
                {subForm.id ? 'Editar Subcategoría' : 'Nueva Subcategoría'}
              </h3>
              <button onClick={cerrarModalSub} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            
            <form onSubmit={guardarSub} className="p-6 space-y-4">
              {modalError && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">{modalError}</div>}
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Ícono (Emoji)</label>
                <input
                  type="text" required maxLength="2"
                  className="w-16 text-center text-2xl px-2 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={subForm.icono}
                  onChange={(e) => setSubForm({ ...subForm, icono: e.target.value })}
                />
                <p className="text-xs text-slate-400 mt-1">Usa la tecla Windows + . (o Ctrl+Cmd+Espacio en Mac)</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Nombre de Subcategoría</label>
                <input
                  type="text" required autoFocus
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="Ej. Renta, Despensa, Gasolina..."
                  value={subForm.nombre_categoria}
                  onChange={(e) => setSubForm({ ...subForm, nombre_categoria: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Presupuesto Mensual Recomendado</label>
                <input
                  type="number" step="0.01" min="0"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                  placeholder="0.00"
                  value={subForm.presupuesto_mensual}
                  onChange={(e) => setSubForm({ ...subForm, presupuesto_mensual: e.target.value })}
                />
              </div>

              <div className="pt-4 flex justify-between items-center">
                {subForm.id ? (
                  <button type="button" onClick={eliminarSub} disabled={isSubmitting} className="text-sm text-red-500 hover:text-red-700 font-bold disabled:opacity-50">Eliminar</button>
                ) : <div></div>}
                <div className="space-x-3">
                  <button type="button" onClick={cerrarModalSub} className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg">Cancelar</button>
                  <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-50">
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