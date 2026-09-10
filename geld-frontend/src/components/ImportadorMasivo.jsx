import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';

export default function ImportadorMasivo() {
  const [cuentas, setCuentas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [file, setFile] = useState(null);
  
  const [transacciones, setTransacciones] = useState([]);
  const [loadingIA, setLoadingIA] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [resCuentas, resCategorias, resHistorial] = await Promise.all([
          apiFetch('/cuentas/'),
          apiFetch('/categorias/'),
          apiFetch('/transacciones/?limit=1000') 
        ]);
        setCuentas(await resCuentas.json());
        setCategorias(await resCategorias.json());
        
        const dataHistorial = await resHistorial.json();
        // Asegurarnos de que siempre sea un arreglo para que el .some() no falle
        const historialLimpio = Array.isArray(dataHistorial) ? dataHistorial : (dataHistorial.data || []);
        console.log("Historial para cruzar:", historialLimpio); 
        setHistorial(historialLimpio);
      } catch (err) {
        setError('Error al cargar catálogos e historial.');
      }
    };
    cargarDatos();
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setTransacciones([]);
    setError(null);
    setSuccessMsg(null);
  };

  const handleExtract = async () => {
    if (!file) return;
    setLoadingIA(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('geld_token');
      
      const BASE_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${BASE_URL}/transacciones/extraer-pdf`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!res.ok) throw new Error('Error al procesar el PDF.');
      
      const data = await res.json();
      
      const txMapeadas = data.map(tx => {
        const esDuplicada = historial.some(h => {
            const fechaH = h.fecha ? String(h.fecha).substring(0, 10) : '';
            const fechaT = tx.fecha ? String(tx.fecha).substring(0, 10) : '';
            
            // ✨ MEJORA: Relajamos el candado. Solo exigimos que coincida Fecha y Monto.
            // Ignoramos el 'tipo' para atrapar las TRANSFERENCIAS históricas.
            return fechaH === fechaT && parseFloat(h.monto) === parseFloat(tx.monto);
        });

        return {
          ...tx,
          cuenta_id: '',
          cuenta_destino_id: '',
          categoria_id: '',
          incluir: !esDuplicada, 
          esDuplicada: esDuplicada 
        };
      });
      setTransacciones(txMapeadas);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingIA(false);
    }
  };

  const handleRowChange = (index, field, value) => {
    const nuevasTx = [...transacciones];
    nuevasTx[index][field] = value;
    if (field === 'tipo' && value !== 'TRANSFERENCIA') {
      nuevasTx[index]['cuenta_destino_id'] = '';
    }
    setTransacciones(nuevasTx);
  };

  const aplicarCuentaGlobal = (cuentaId) => {
    const nuevasTx = transacciones.map(tx => ({
      ...tx,
      cuenta_id: cuentaId
    }));
    setTransacciones(nuevasTx);
  };

  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    const validTx = transacciones.filter(tx => tx.incluir);
    let count = 0;

    try {
      for (let tx of validTx) {
        if (!tx.cuenta_id || !tx.categoria_id) {
           throw new Error(`Falta asignar cuenta u origen/categoría a: ${tx.descripcion}`);
        }
        if (tx.tipo === 'TRANSFERENCIA' && !tx.cuenta_destino_id) {
            throw new Error(`Falta Cuenta Destino en: ${tx.descripcion}`);
        }

        const payload = {
          fecha: tx.fecha,
          monto: parseFloat(tx.monto),
          tipo: tx.tipo,
          descripcion: tx.descripcion,
          cuenta_id: tx.cuenta_id,
          categoria_id: tx.categoria_id,
          tipo_de_cambio: 1.0 
        };

        if (tx.tipo === 'TRANSFERENCIA') {
            payload.cuenta_destino_id = tx.cuenta_destino_id;
        }

        const res = await apiFetch('/transacciones/', {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error(`Fallo al inyectar: ${tx.descripcion}`);
        count++;
      }
      setSuccessMsg(`¡${count} transacciones inyectadas con éxito!`);
      setTransacciones([]);
      setFile(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in mb-20">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-bold text-slate-800 mb-1">Conciliación Masiva (IA)</h2>
        <p className="text-xs text-slate-500 mb-4">Sube tu estado de cuenta en PDF y Gemini extraerá las transacciones.</p>
        
        {error && <div className="p-3 mb-4 text-xs text-red-700 bg-red-100 rounded-lg">{error}</div>}
        {successMsg && <div className="p-3 mb-4 text-xs text-emerald-700 bg-emerald-100 rounded-lg">{successMsg}</div>}

        <div className="flex gap-2 items-center">
          <input 
            type="file" 
            accept="application/pdf"
            onChange={handleFileChange}
            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <button
            onClick={handleExtract}
            disabled={!file || loadingIA}
            className="px-4 py-2 bg-slate-800 text-white text-sm font-bold rounded-lg shadow disabled:opacity-50"
          >
            {loadingIA ? 'Leyendo...' : 'Extraer'}
          </button>
        </div>
      </div>

      {transacciones.length > 0 && (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
            <div className="flex items-center gap-2 bg-blue-50 p-2.5 rounded-lg border border-blue-100 w-full sm:w-auto">
              <label className="text-xs font-bold text-blue-800 whitespace-nowrap">Cuenta Global:</label>
              <select 
                onChange={(e) => aplicarCuentaGlobal(e.target.value)}
                className="w-full sm:w-auto p-1.5 border border-blue-200 rounded-md bg-white text-xs outline-none focus:border-blue-500 text-slate-700"
              >
                <option value="">Aplicar a todas...</option>
                {cuentas.map(c => <option key={c.id} value={c.id}>{c.nombre_cuenta}</option>)}
              </select>
            </div>

            <button 
              onClick={handleSync}
              disabled={syncing}
              className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-emerald-700 disabled:opacity-50 whitespace-nowrap"
            >
              {syncing ? 'Sincronizando...' : 'Inyectar a PostgreSQL'}
            </button>
          </div>

          <table className="w-full text-left text-xs text-slate-600 min-w-[950px]">
            <thead className="bg-slate-50 text-slate-400 uppercase font-semibold">
              <tr>
                <th className="p-2 rounded-tl-lg w-10">Inc</th>
                <th className="p-2 w-24">Fecha</th>
                <th className="p-2 w-64">Concepto</th>
                <th className="p-2 w-24">Monto</th>
                <th className="p-2 w-28">Tipo</th>
                <th className="p-2 w-32">Origen</th>
                <th className="p-2 w-32">Destino</th>
                <th className="p-2 rounded-tr-lg w-40">Categoría</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transacciones.map((tx, idx) => (
                <tr key={idx} className={`hover:bg-slate-50/50 transition-colors ${tx.esDuplicada ? 'bg-yellow-100 hover:bg-yellow-200' : ''}`}>
                  <td className="p-2 text-center">
                    <input 
                      type="checkbox" 
                      checked={tx.incluir} 
                      onChange={(e) => handleRowChange(idx, 'incluir', e.target.checked)}
                      className="rounded text-emerald-500 focus:ring-emerald-500"
                    />
                  </td>
                  <td className="p-2">
                    <input 
                      type="date"
                      value={tx.fecha}
                      onChange={(e) => handleRowChange(idx, 'fecha', e.target.value)}
                      className="w-full p-1 border border-transparent hover:border-slate-200 focus:border-blue-500 rounded bg-transparent focus:bg-white outline-none"
                    />
                  </td>
                  
                  <td className="p-2 relative">
                    {tx.esDuplicada && (
                      <span className="absolute -top-1 -right-1 text-[10px] bg-amber-500 text-white px-1.5 py-0.5 rounded-full font-bold shadow-sm" title="Posible Duplicado">
                        ⚠️
                      </span>
                    )}
                    <input 
                      type="text"
                      value={tx.descripcion}
                      onChange={(e) => handleRowChange(idx, 'descripcion', e.target.value)}
                      className={`w-full p-1.5 border border-slate-200 rounded-md outline-none focus:border-blue-500 font-medium text-slate-700 ${tx.esDuplicada ? 'bg-amber-100 border-amber-300' : 'bg-white'}`}
                    />
                  </td>

                  <td className="p-2 font-medium text-slate-700">${parseFloat(tx.monto).toFixed(2)}</td>
                  
                  <td className="p-2">
                    <select
                      value={tx.tipo}
                      onChange={(e) => handleRowChange(idx, 'tipo', e.target.value)}
                      className={`w-full p-1.5 border border-slate-200 rounded-md text-[10px] font-bold outline-none focus:border-blue-500
                        ${tx.tipo === 'CARGO' ? 'bg-red-50 text-red-700' : 
                          tx.tipo === 'ABONO' ? 'bg-emerald-50 text-emerald-700' : 
                          'bg-blue-50 text-blue-700'}`}
                    >
                      <option value="CARGO">CARGO</option>
                      <option value="ABONO">ABONO</option>
                      <option value="TRANSFERENCIA">TRANSF</option>
                    </select>
                  </td>
                  
                  <td className="p-2">
                    <select 
                      value={tx.cuenta_id} 
                      onChange={(e) => handleRowChange(idx, 'cuenta_id', e.target.value)}
                      className="w-full p-1.5 border border-slate-200 rounded-md bg-white outline-none focus:border-blue-500"
                    >
                      <option value="">Origen...</option>
                      {cuentas.map(c => <option key={c.id} value={c.id}>{c.nombre_cuenta}</option>)}
                    </select>
                  </td>

                  <td className="p-2">
                    {tx.tipo === 'TRANSFERENCIA' ? (
                      <select 
                        value={tx.cuenta_destino_id || ''} 
                        onChange={(e) => handleRowChange(idx, 'cuenta_destino_id', e.target.value)}
                        className="w-full p-1.5 border border-blue-300 rounded-md bg-blue-50 outline-none focus:border-blue-600 text-blue-900 font-medium shadow-sm"
                      >
                        <option value="">Destino...</option>
                        {cuentas.map(c => (
                          <option key={c.id} value={c.id} disabled={c.id === tx.cuenta_id}>
                            {c.nombre_cuenta}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="w-full p-1.5 text-center text-slate-300 text-[10px] bg-slate-50 border border-slate-100 rounded-md">
                        N/A
                      </div>
                    )}
                  </td>

                  <td className="p-2">
                    <select 
                      value={tx.categoria_id} 
                      onChange={(e) => handleRowChange(idx, 'categoria_id', e.target.value)}
                      className="w-full p-1.5 border border-slate-200 rounded-md bg-white outline-none focus:border-blue-500"
                    >
                      <option value="">Categoría...</option>
                      {categorias.map(c => <option key={c.id} value={c.id}>{c.icono} {c.nombre_categoria}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}