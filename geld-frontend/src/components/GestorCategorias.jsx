import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';

export default function GestorCategorias() {
  const [familias, setFamilias] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Estados de navegación y edición: 'LISTA', 'CREAR_FAMILIA', 'EDITAR_FAMILIA', 'CREAR_CAT', 'EDITAR_CAT'
  const [modo, setModo] = useState('LISTA');
  const [itemAEditar, setItemAEditar] = useState(null);

  // Form states
  const [familiaForm, setFamiliaForm] = useState({ nombre_familia: '', tipo: 'GASTO' });
  const [categoriaForm, setCategoriaForm] = useState({ nombre_categoria: '', familia_id: '', icono: '🏷️' });

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);
      const [resFam, resCat] = await Promise.all([
        apiFetch('http://localhost:8000/familias/'),
        apiFetch('http://localhost:8000/categorias/')
      ]);

      if (resFam.ok && resCat.ok) {
        let dataFam = await resFam.json();
        let dataCat = await resCat.json();

        // 1. Aseguramos que existan datos (fallback a un arreglo vacío)
        dataFam = dataFam || [];
        dataCat = dataCat || [];

        // 2. ORDENAMIENTO ALFABÉTICO (A-Z) para Familias
        dataFam.sort((a, b) => a.nombre_familia.localeCompare(b.nombre_familia));
        
        // 3. ORDENAMIENTO ALFABÉTICO (A-Z) para Subcategorías
        dataCat.sort((a, b) => a.nombre_categoria.localeCompare(b.nombre_categoria));

        // 4. Guardamos en el estado
        setFamilias(dataFam);
        setCategorias(dataCat);
      } else {
        throw new Error('Error al cargar catálogos de categorías');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const mostrarExito = (mensaje) => {
    setSuccessMsg(mensaje);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // --- HANDLERS FAMILIAS ---
  const handleGuardarFamilia = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      const isEditing = modo === 'EDITAR_FAMILIA';
      const url = isEditing
        ? `http://localhost:8000/familias/${itemAEditar.id}`
        : 'http://localhost:8000/familias/';
      const method = isEditing ? 'PUT' : 'POST';

      // Armamos el payload inyectando el ID si es creación nueva
      const payload = { ...familiaForm };
      if (!isEditing) {
        // Genera un ID basado en el nombre (Ej. "ALIMENTACION") máximo 50 caracteres
        payload.id = payload.nombre_familia.toUpperCase().replace(/\s+/g, '_').substring(0, 50);
      }

      const res = await apiFetch(url, {
        method,
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Error al guardar la familia');
      }

      mostrarExito(isEditing ? 'Familia actualizada correctamente' : 'Familia creada exitosamente');
      setModo('LISTA');
      cargarDatos();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleBorrarFamilia = async (fam) => {
    if (!window.confirm(`¿Borrar la familia "${fam.nombre_familia}"? Se eliminarán o afectarán sus subcategorías.`)) return;
    try {
      setError(null);
      const res = await apiFetch(`http://localhost:8000/familias/${fam.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'No se pudo eliminar la familia. Verifica que no tenga subcategorías en uso.');
      }
      mostrarExito('Familia eliminada');
      cargarDatos();
    } catch (err) {
      setError(err.message);
    }
  };

  // --- HANDLERS CATEGORÍAS (SUBCATEGORÍAS) ---
  const handleGuardarCategoria = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      const isEditing = modo === 'EDITAR_CAT';
      const url = isEditing
        ? `http://localhost:8000/categorias/${itemAEditar.id}`
        : 'http://localhost:8000/categorias/';
      const method = isEditing ? 'PUT' : 'POST';

      // Armamos el payload inyectando el ID si es creación nueva
      const payload = { ...categoriaForm };
      if (!isEditing) {
        // Genera un ID corto para cumplir con el max_length=20 del backend
        payload.id = `CAT-${Math.floor(Math.random() * 1000000)}`;
      }

      const res = await apiFetch(url, {
        method,
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Error al guardar la subcategoría');
      }

      mostrarExito(isEditing ? 'Subcategoría actualizada' : 'Subcategoría creada exitosamente');
      setModo('LISTA');
      cargarDatos();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleBorrarCategoria = async (cat) => {
    if (!window.confirm(`¿Borrar la subcategoría "${cat.nombre_categoria}"?`)) return;
    try {
      setError(null);
      const res = await apiFetch(`http://localhost:8000/categorias/${cat.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'No se pudo eliminar la subcategoría. Verifica que no tenga transacciones ligadas.');
      }
      mostrarExito('Subcategoría eliminada');
      cargarDatos();
    } catch (err) {
      setError(err.message);
    }
  };

  // Prepara apertura de formularios
  const abrirCrearFamilia = () => {
    setFamiliaForm({ nombre_familia: '', tipo: 'GASTO' });
    setModo('CREAR_FAMILIA');
  };

  const abrirEditarFamilia = (fam) => {
    setItemAEditar(fam);
    setFamiliaForm({ nombre_familia: fam.nombre_familia, tipo: fam.tipo });
    setModo('EDITAR_FAMILIA');
  };

  const abrirCrearCategoria = (familiaIdOpcional = '') => {
    setCategoriaForm({
      nombre_categoria: '',
      familia_id: familiaIdOpcional || (familias[0]?.id || ''),
      icono: '🏷️'
    });
    setModo('CREAR_CAT');
  };

  const abrirEditarCategoria = (cat) => {
    setItemAEditar(cat);
    setCategoriaForm({
      nombre_categoria: cat.nombre_categoria,
      familia_id: cat.familia_id,
      icono: cat.icono || '🏷️'
    });
    setModo('EDITAR_CAT');
  };

  // Emojis sugeridos para selección rápida
  const emojisSugeridos = ['🏷️', '🛒', '🍔', '🚗', '🏠', '💡', '💊', '🎮', '✈️', '🎓', '💼', '💰', '🎁', '🏦', '🐕'];

  return (
    <div className="space-y-5 animate-fade-in pb-10">
      
      {/* MENSAJES FEEDBACK */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-3.5 rounded-xl text-xs font-semibold flex justify-between items-center">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 font-bold">✕</button>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3.5 rounded-xl text-xs font-semibold animate-pulse">
          ✓ {successMsg}
        </div>
      )}

      {/* VISTA 1: FORMULARIO CREAR / EDITAR FAMILIA */}
      {(modo === 'CREAR_FAMILIA' || modo === 'EDITAR_FAMILIA') && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm max-w-lg mx-auto">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-800">
              {modo === 'CREAR_FAMILIA' ? '📁 Nueva Familia de Categorías' : '✏️ Editar Familia'}
            </h3>
            <button
              onClick={() => setModo('LISTA')}
              className="text-xs text-slate-400 hover:text-slate-600 font-bold px-2 py-1 bg-slate-50 rounded-lg"
            >
              Cancelar
            </button>
          </div>

          <form onSubmit={handleGuardarFamilia} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Nombre de la Familia</label>
              <input
                type="text"
                required
                maxLength={40}
                placeholder="Ej. Alimentación, Transporte, Servicios..."
                value={familiaForm.nombre_familia}
                onChange={(e) => setFamiliaForm({ ...familiaForm, nombre_familia: e.target.value.toUpperCase() })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Tipo de Clasificación</label>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setFamiliaForm({ ...familiaForm, tipo: 'GASTO' })}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                    familiaForm.tipo === 'GASTO'
                      ? 'bg-red-50 border-red-300 text-red-700 shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  🔻 Gasto / Salida
                </button>

                <button
                  type="button"
                  onClick={() => setFamiliaForm({ ...familiaForm, tipo: 'INGRESO' })}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                    familiaForm.tipo === 'INGRESO'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  🟢 Ingreso / Entrada
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModo('LISTA')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-colors"
              >
                {modo === 'CREAR_FAMILIA' ? 'Guardar Familia' : 'Actualizar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VISTA 2: FORMULARIO CREAR / EDITAR SUBCATEGORÍA */}
      {(modo === 'CREAR_CAT' || modo === 'EDITAR_CAT') && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm max-w-lg mx-auto">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-800">
              {modo === 'CREAR_CAT' ? '🏷️ Nueva Subcategoría' : '✏️ Editar Subcategoría'}
            </h3>
            <button
              onClick={() => setModo('LISTA')}
              className="text-xs text-slate-400 hover:text-slate-600 font-bold px-2 py-1 bg-slate-50 rounded-lg"
            >
              Cancelar
            </button>
          </div>

          <form onSubmit={handleGuardarCategoria} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Familia Perteneciente</label>
              <select
                required
                value={categoriaForm.familia_id}
                onChange={(e) => setCategoriaForm({ ...categoriaForm, familia_id: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500"
              >
                <option value="" disabled>-- Selecciona una familia --</option>
                {familias.map((fam) => (
                  <option key={fam.id} value={fam.id}>
                    {fam.nombre_familia} ({fam.tipo})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Nombre de la Subcategoría</label>
              <input
                type="text"
                required
                maxLength={30}
                placeholder="Ej. Supermercado, Gasolina, Netflix..."
                value={categoriaForm.nombre_categoria}
                onChange={(e) => setCategoriaForm({ ...categoriaForm, nombre_categoria: e.target.value.toUpperCase() })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Ícono / Emoji</label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  required
                  maxLength={4}
                  value={categoriaForm.icono}
                  onChange={(e) => setCategoriaForm({ ...categoriaForm, icono: e.target.value })}
                  className="w-16 text-center text-xl p-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
                <div className="flex-1 flex flex-wrap gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-100 max-h-24 overflow-y-auto">
                  {emojisSugeridos.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setCategoriaForm({ ...categoriaForm, icono: emoji })}
                      className="w-8 h-8 flex items-center justify-center text-base hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModo('LISTA')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-colors"
              >
                {modo === 'CREAR_CAT' ? 'Guardar Subcategoría' : 'Actualizar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VISTA PRINCIPAL: MODO LISTA DE CATEGORÍAS ORGANIZADAS POR FAMILIA */}
      {modo === 'LISTA' && (
        <div className="space-y-4">
          
          {/* BARRA SUPERIOR DE ACCIONES */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span>📁</span> Gestor de Categorías y Familias
              </h2>
              <p className="text-xs text-slate-400">Organiza tus ingresos y gastos en catálogos estructurados.</p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={abrirCrearFamilia}
                className="flex-1 sm:flex-initial px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <span>➕</span> Familia
              </button>

              <button
                onClick={() => abrirCrearCategoria()}
                disabled={familias.length === 0}
                className={`flex-1 sm:flex-initial px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm ${
                  familias.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <span>➕</span> Subcategoría
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-10 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
              Cargando catálogo de categorías...
            </div>
          ) : familias.length === 0 ? (
            <div className="p-10 text-center space-y-3 bg-white rounded-2xl border border-slate-200">
              <p className="text-sm font-bold text-slate-600">No hay familias registradas</p>
              <p className="text-xs text-slate-400">Crea primero una Familia (ej. "Alimentación") para poder agregar subcategorías.</p>
              <button
                onClick={abrirCrearFamilia}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                + Crear Primera Familia
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {familias.map((fam) => {
                const subcategorias = categorias.filter((c) => c.familia_id === fam.id);
                const isIngreso = fam.tipo === 'INGRESO';

                return (
                  <div key={fam.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    
                    {/* ENCABEZADO DE LA FAMILIA */}
                    <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md shrink-0 ${
                          isIngreso ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {fam.tipo}
                        </span>

                        <h3 className="text-sm font-bold text-slate-800 truncate">
                          {fam.nombre_familia}
                        </h3>

                        <span className="text-[11px] font-semibold text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded-full shrink-0">
                          {subcategorias.length}
                        </span>
                      </div>

                      {/* BOTONES DE ACCIÓN DE LA FAMILIA */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => abrirCrearCategoria(fam.id)}
                          title="Añadir subcategoría a esta familia"
                          className="px-2.5 py-1 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <span className="text-sm">+</span>
                          <span className="hidden sm:inline">Subcat</span>
                        </button>

                        <button
                          onClick={() => abrirEditarFamilia(fam)}
                          title="Editar Familia"
                          className="p-1.5 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors"
                        >
                          ✏️
                        </button>

                        <button
                          onClick={() => handleBorrarFamilia(fam)}
                          title="Borrar Familia"
                          className="p-1.5 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    {/* LISTA DE SUBCATEGORÍAS (1 SOLA COLUMNA) */}
                    <div className="p-3 bg-white">
                      {subcategorias.length === 0 ? (
                        <div className="py-4 text-center">
                          <p className="text-xs text-slate-400">Sin subcategorías asignadas a esta familia.</p>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {subcategorias.map((cat) => (
                            <div
                              key={cat.id}
                              className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all flex items-center justify-between gap-3 group"
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <span className="text-xl shrink-0 leading-none">{cat.icono || '🏷️'}</span>
                                <span className="block text-sm font-bold text-slate-700 leading-snug break-words whitespace-normal min-w-0">
                                  {cat.nombre_categoria}
                                </span>
                              </div>

                              {/* BOTONES DE ACCIÓN DE LA SUBCATEGORÍA */}
                              <div className="flex items-center gap-1 shrink-0 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => abrirEditarCategoria(cat)}
                                  title="Editar Subcategoría"
                                  className="p-1.5 text-sm text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => handleBorrarCategoria(cat)}
                                  title="Borrar Subcategoría"
                                  className="p-1.5 text-sm text-red-400 hover:text-red-700 hover:bg-red-100 rounded-lg transition-colors"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

    </div>
  );
}