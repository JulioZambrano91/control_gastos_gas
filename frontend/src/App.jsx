import React, { useState, useEffect } from "react";
import axios from "axios";
import { DollarSign, Plus, RefreshCw, Trash2, Calendar, PieChart, Tag, TrendingUp } from "lucide-react";

const API_BASE = "http://localhost:3001/api";

function App() {
  const [expenses, setExpenses] = useState([]);
  const [rate, setRate] = useState(null);
  const [description, setDescription] = useState("");
  const [amountVES, setAmountVES] = useState("");
  const [category, setCategory] = useState("INGRESO");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rateRes, expensesRes] = await Promise.all([
        axios.get(`${API_BASE}/rate`),
        axios.get(`${API_BASE}/expenses`)
      ]);
      setRate(rateRes.data.rate);
      setExpenses(expensesRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!description || !amountVES || !rate) return;

    try {
      await axios.post(`${API_BASE}/expenses`, {
        description,
        amountVES: parseFloat(amountVES),
        rate,
        category
      });
      setDescription("");
      setAmountVES("");
      // No reiniciamos la categoría para facilitar registros múltiples parecidos
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const CATEGORIAS = [
    "INGRESO",
    "AHORROS / INVERSIONES",
    "IMPUESTOS / COMISIONES",
    "CACHEA / DEUDAS",
    "SUSCRIPCIONES / SERVICIOS",
    "DONACIONES / REGALOS",
    "ALIMENTOS",
    "TRANSPORTE",
    "SALUD",
    "EDUCACIÓN",
    "PERSONAL",
    "ENTRETENIMIENTO / VACACIONES",
    "OTROS / IMPREVISTOS"
  ];

  // --- Análisis de Gastos ---
  
  // 1. Por Categoría
  const categoryTotals = expenses.reduce((acc, exp) => {
    const cat = exp.category || "Otros";
    acc[cat] = (acc[cat] || 0) + exp.amountUSD;
    return acc;
  }, {});
  const categoryEntries = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

  // 2. Por Tiempo (Hoy, Semana, Mes)
  const now = new Date();
  
  // Lógica para "Hoy"
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  
  // Lógica para "Esta Semana" (Asumiendo que empieza en Lunes)
  const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1; // Ajuste para que Lunes sea 0 y Domingo 6
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek).getTime();
  
  // Lógica para "Este Mes"
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  let totalToday = 0;
  let totalWeek = 0;
  let totalMonth = 0;

  expenses.forEach(exp => {
    const time = new Date(exp.date).getTime();
    if (time >= startOfToday) totalToday += exp.amountUSD;
    if (time >= startOfWeek) totalWeek += exp.amountUSD;
    if (time >= startOfMonth) totalMonth += exp.amountUSD;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-indigo-700">Control de Gastos</h1>
            <p className="text-slate-500">Gestión personal de gastos VES / USD</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="bg-indigo-100 p-2 rounded-lg">
              <RefreshCw className="text-indigo-600 size-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Tasa BCV hoy</p>
              <p className="text-xl font-bold">{rate ? `${rate.toFixed(2)}` : "Cargando..."}</p>
            </div>
          </div>
        </header>

        {/* Tarjetas de Resumen de Tiempo */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4 border-l-4 border-l-blue-500">
            <div className="bg-blue-50 p-3 rounded-full text-blue-600">
              <Calendar className="size-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Gastos de Hoy</p>
              <p className="text-2xl font-bold text-slate-800">${totalToday.toFixed(2)}</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4 border-l-4 border-l-indigo-500">
            <div className="bg-indigo-50 p-3 rounded-full text-indigo-600">
              <TrendingUp className="size-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Esta Semana</p>
              <p className="text-2xl font-bold text-slate-800">${totalWeek.toFixed(2)}</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4 border-l-4 border-l-purple-500">
            <div className="bg-purple-50 p-3 rounded-full text-purple-600">
              <PieChart className="size-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Este Mes</p>
              <p className="text-2xl font-bold text-slate-800">${totalMonth.toFixed(2)}</p>
            </div>
          </div>
        </section>

        <section className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 mb-8 relative overflow-hidden">
          {/* Fondo decorativo sutil */}
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
            <Plus className="w-48 h-48 text-indigo-900" />
          </div>

          <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
            <div className="bg-indigo-100 p-2 rounded-xl">
              <Plus className="size-6 text-indigo-700" strokeWidth={3} />
            </div>
            Registrar Movimiento
          </h2>
          
          <form onSubmit={handleAddExpense} className="relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mb-5">
              
              <div className="md:col-span-4 space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Descripción / Fuente</label>
                <input
                  type="text"
                  placeholder="Ej: Sueldo, Supermercado, Netflix..."
                  className="w-full px-5 py-3.5 bg-slate-50 hover:bg-slate-100 focus:bg-white rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-400 font-medium text-slate-700"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>
              
              <div className="md:col-span-5 space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Categoría</label>
                <div className="relative">
                  <select
                    className="w-full pl-5 pr-10 py-3.5 bg-slate-50 hover:bg-slate-100 focus:bg-white rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all font-semibold text-slate-700 appearance-none cursor-pointer"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {CATEGORIAS.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  {/* Flecha personalizada para el select */}
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
              </div>

              <div className="md:col-span-3 space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Monto (VES)</label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold group-focus-within:text-indigo-600 transition-colors">Bs.</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full pl-12 pr-5 py-3.5 bg-slate-50 hover:bg-slate-100 focus:bg-white rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all font-mono font-bold text-slate-800 placeholder:text-slate-300"
                    value={amountVES}
                    onChange={(e) => setAmountVES(e.target.value)}
                    required
                  />
                </div>
              </div>

            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold tracking-wide py-3.5 px-8 rounded-xl transition-all shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 disabled:shadow-none flex items-center justify-center gap-2"
                disabled={!rate}
              >
                Guardar Movimiento
              </button>
            </div>
          </form>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Historial (Left Column) */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2">
              <Calendar className="size-5 text-indigo-500" /> Historial Reciente
            </h2>
            {loading ? (
              <p className="text-center italic py-10 text-slate-400">Cargando datos...</p>
            ) : expenses.length === 0 ? (
              <p className="text-center text-slate-400 py-10 bg-slate-100 rounded-xl">No hay gastos registrados.</p>
            ) : (
              expenses.map((exp) => (
                <div key={exp.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="bg-indigo-50 p-3 rounded-full text-indigo-500">
                      <Tag className="size-5" />
                    </div>
                    <div>
                      <h3 className="font-bold">{exp.description}</h3>
                      <div className="flex gap-2 text-xs text-slate-400 mt-1">
                        <span className="font-medium px-2 py-0.5 bg-slate-100 rounded-md">
                          {exp.category || "Otros"}
                        </span>
                        <span>{new Date(exp.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-800">{Number(exp.amountVES).toLocaleString('es-VE', {minimumFractionDigits: 2})} Bs.</p>
                    <p className="text-xs text-green-600 font-bold">≈ ${exp.amountUSD.toFixed(2)}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Resumen por Categorias (Right Column) */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2">
              <PieChart className="size-5 text-indigo-500" /> Gastos por Categoría
            </h2>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              {categoryEntries.length === 0 ? (
                <p className="text-sm text-center text-slate-400 italic">No hay datos suficientes.</p>
              ) : (
                <div className="space-y-4">
                  {categoryEntries.map(([cat, totalUsd]) => (
                    <div key={cat} className="flex justify-between items-center border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                      <span className="text-sm font-medium text-slate-600">{cat}</span>
                      <span className="text-sm font-bold text-slate-800">${totalUsd.toFixed(2)}</span>
                    </div>
                  ))}
                  
                  <div className="pt-4 mt-4 border-t-2 border-slate-100 flex justify-between items-center">
                    <span className="font-bold text-slate-700">Total USD:</span>
                    <span className="font-bold text-indigo-600 text-lg">
                      ${categoryEntries.reduce((sum, [_, val]) => sum + val, 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default App;
