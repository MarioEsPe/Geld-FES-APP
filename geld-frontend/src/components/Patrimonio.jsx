import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api'; // Importamos tu nuevo interceptor centralizado

export default function Patrimonio() {
  const [saldo, setSaldo] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSaldos = async () => {
      try {
        setLoading(true);

        // 1. Obtenemos todas las cuentas usando tu apiFetch (se encarga del token solito)
        const responseCuentas = await apiFetch('http://localhost:8000/cuentas/');
        if (!responseCuentas.ok) throw new Error('Error al cargar cuentas');
        const cuentas = await responseCuentas.json();
        
        // 2. Calculamos los saldos reales de cada cuenta
        const promesasDeSaldos = cuentas.map(cuenta => 
          apiFetch(`http://localhost:8000/transacciones/cuenta/${cuenta.id}/saldo`)
            .then(res => res.json())
        );
        
        const saldosReales = await Promise.all(promesasDeSaldos);

        // 3. Suma total
        const totalPatrimonio = saldosReales.reduce((acumulador, data) => {
          return acumulador + parseFloat(data.saldo_actual || 0);
        }, 0);
        
        setSaldo(totalPatrimonio);
      } catch (err) {
        setError("Bóveda temporalmente bloqueada: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSaldos();
  }, []);

  if (loading) return <p className="text-sm font-medium text-gray-400 mt-2">Consultando bóveda...</p>;
  if (error) return <p className="text-sm text-red-500 mt-2">{error}</p>;

  return (
    <p className={`text-3xl font-bold mt-1 ${saldo >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
      ${saldo.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
      <span className="text-sm text-gray-400 font-normal ml-1">MXN</span>
    </p>
  );
}