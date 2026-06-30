import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Una paleta de colores limpia y financiera (tonos esmeralda, azul y pizarra)
const COLORS = ['#059669', '#0ea5e9', '#6366f1', '#10b981', '#64748b', '#94a3b8', '#38bdf8', '#34d399'];

export default function GraficaGastos() {
  const [datos, setDatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalitica = async () => {
      try {
        setLoading(true);
        // Consultamos tu nuevo endpoint agrupado
        const response = await apiFetch('http://localhost:8000/transacciones/analitica/gastos');
        if (!response.ok) throw new Error('Error al cargar analítica');
        
        const json = await response.json();
        
        // Formateamos los datos para asegurar que 'total' sea un número válido para Recharts
        const formattedData = json.map(item => ({
          nombre: item.nombre,
          total: parseFloat(item.total)
        }));
        
        setDatos(formattedData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalitica();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <span className="text-xs font-medium text-slate-400">Analizando gastos...</span>
      </div>
    );
  }

  if (error) {
    return <div className="text-xs text-red-500 text-center py-4">{error}</div>;
  }

  if (datos.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-xs text-slate-400">Aún no hay gastos para graficar en este periodo.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mt-4 mb-4">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
        Desglose de Gastos (Histórico)
      </h3>
      
      {/* Contenedor que adapta la gráfica al tamaño del celular */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={datos}
              cx="50%"
              cy="50%"
              innerRadius={60} // Esto la convierte en una "Dona"
              outerRadius={80}
              paddingAngle={4}
              dataKey="total"
              nameKey="nombre"
            >
              {datos.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => [`$${value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 'Total']}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}
              itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}