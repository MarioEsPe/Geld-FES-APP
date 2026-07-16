import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';

export default function GestorCategorias() {
  const [familias, setFamilias] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    setError(null);
    try {
      // Hacemos ambas peticiones al mismo tiempo para mayor rapidez
      const [resFamilias, resCategorias] = await Promise.all([
        apiFetch('http://127.0.0.1:8000/familias/'),
        apiFetch('http://127.0.0.1:8000/categorias/')
      ]);

      if (!resFamilias.ok || !resCategorias.ok) {
        throw new Error('Error al cargar la información del servidor.');
      }

      const dataFamilias = await resFamilias.json();
      const dataCategorias = await resCategorias.json();

      setFamilias(dataFamilias);
      setCategorias(dataCategorias);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Cargando categorías...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Gestor de Categorías</h2>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          + Nueva Familia
        </button>
      </div>

      <div className="space-y-6">
        {familias.map((familia) => {
          // Relación Padre-Hijo: Filtramos las categorías que le pertenecen a esta familia
          const categoriasHijas = categorias.filter(c => c.familia_id === familia.id);

          return (
            <div key={familia.id} className="border border-slate-200 rounded-lg p-5 bg-white">
              {/* Cabecera de la Familia */}
              <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                <h3 className="text-lg font-bold text-slate-700">{familia.nombre_familia}</h3>
                <div className="space-x-3">
                  <button className="text-sm text-slate-400 hover:text-blue-600 font-medium transition-colors">Editar</button>
                  <button className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors">+ Subcategoría</button>
                </div>
              </div>

              {/* Lista de Categorías Hijas */}
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
    </div>
  );
}