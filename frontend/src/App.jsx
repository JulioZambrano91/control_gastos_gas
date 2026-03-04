import React, { useState, useEffect } from "react";
import axios from "axios";
import { DollarSign, Plus, RefreshCw, Trash2, Calendar } from "lucide-react";

const API_BASE = "http://localhost:3001/api";

function App() {
  const [expenses, setExpenses] = useState([]);
  const [rate, setRate] = useState(null);
  const [description, setDescription] = useState("");
  const [amountVES, setAmountVES] = useState("");
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
        rate
      });
      setDescription("");
      setAmountVES("");
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-10">
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

        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Plus className="size-5 text-indigo-600" /> Nuevo Gasto
          </h2>
          <form onSubmit={handleAddExpense} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Descripción del gasto..."
              className="px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 text-sm">VES</span>
              <input
                type="number"
                placeholder="0.00"
                className="w-full pl-12 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={amountVES}
                onChange={(e) => setAmountVES(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
              disabled={!rate}
            >
              Registrar
            </button>
          </form>
        </section>

        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-700">Historial</h2>
          {loading ? (
            <p className="text-center italic py-10">Cargando datos...</p>
          ) : expenses.length === 0 ? (
            <p className="text-center text-slate-400 py-10 bg-slate-100 rounded-xl">No hay gastos registrados.</p>
          ) : (
            expenses.map((exp) => (
              <div key={exp.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="bg-slate-100 p-3 rounded-full text-slate-500">
                    <Calendar className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-bold">{exp.description}</h3>
                    <p className="text-xs text-slate-400">{new Date(exp.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-8">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{exp.amountVES.toLocaleString()} VES</p>
                    <p className="text-xs text-indigo-600 font-bold">≈ ${exp.amountUSD.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
