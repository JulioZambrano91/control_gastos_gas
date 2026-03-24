import React, { useState, useEffect } from "react";
import axios from "axios";
import { AlertTriangle, Plus, X, CheckCircle2, Pencil, Trash2, DollarSign, ChevronDown, ArrowDownLeft, Clock } from "lucide-react";

const API_BASE = "http://localhost:3001/api";

function ProgressBar({ value, max, color = "bg-rose-500" }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const remaining = 100 - pct;
  return (
    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function DebtManager({ rate }) {
  const [debts, setDebts] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [payingDebtId, setPayingDebtId] = useState(null);
  const [payAmount, setPayAmount] = useState("");

  // Formulario nueva deuda
  const [debtDesc, setDebtDesc] = useState("");
  const [debtTotal, setDebtTotal] = useState("");
  const [debtAbono, setDebtAbono] = useState("");
  const [debtCurrency, setDebtCurrency] = useState("VES");
  const [debtCreditor, setDebtCreditor] = useState("");
  const [debtNotes, setDebtNotes] = useState("");

  useEffect(() => {
    loadDebts();
  }, []);

  const loadDebts = async () => {
    try {
      const res = await axios.get(`${API_BASE}/debts`);
      setDebts(res.data);
    } catch {
      const saved = localStorage.getItem("user_debts");
      if (saved) setDebts(JSON.parse(saved));
    }
  };

  const saveLocal = (updated) => {
    localStorage.setItem("user_debts", JSON.stringify(updated));
  };

  const handleAddDebt = async (e) => {
    e.preventDefault();
    const total = parseFloat(debtTotal) || 0;
    const abono = parseFloat(debtAbono) || 0;
    if (!debtDesc || total <= 0) return;

    const newDebt = {
      id: Date.now(),
      description: debtDesc,
      creditor: debtCreditor,
      currency: debtCurrency,
      totalAmount: total,
      paidAmount: abono,
      notes: debtNotes,
      payments: abono > 0 ? [{ id: Date.now(), amount: abono, date: new Date().toISOString(), note: "Abono inicial" }] : [],
      createdAt: new Date().toISOString(),
      status: abono >= total ? "paid" : "active",
    };

    try {
      const res = await axios.post(`${API_BASE}/debts`, newDebt);
      const updated = [...debts, res.data];
      setDebts(updated);
      saveLocal(updated);
    } catch {
      const updated = [...debts, newDebt];
      setDebts(updated);
      saveLocal(updated);
    }

    setDebtDesc(""); setDebtTotal(""); setDebtAbono("");
    setDebtCreditor(""); setDebtNotes(""); setDebtCurrency("VES");
    setShowAdd(false);
  };

  const handleAddPayment = async (debtId) => {
    const amount = parseFloat(payAmount) || 0;
    if (amount <= 0) return;

    const debt = debts.find(d => d.id === debtId);
    if (!debt) return;

    const newPaidAmount = debt.paidAmount + amount;
    const payment = { id: Date.now(), amount, date: new Date().toISOString(), note: "" };
    const updatedDebt = {
      ...debt,
      paidAmount: newPaidAmount,
      payments: [...(debt.payments || []), payment],
      status: newPaidAmount >= debt.totalAmount ? "paid" : "active",
    };

    try {
      await axios.put(`${API_BASE}/debts/${debtId}`, updatedDebt);
    } catch { /* fallback */ }

    const updated = debts.map(d => d.id === debtId ? updatedDebt : d);
    setDebts(updated);
    saveLocal(updated);
    setPayingDebtId(null);
    setPayAmount("");
  };

  const handleDeleteDebt = async (debtId) => {
    try {
      await axios.delete(`${API_BASE}/debts/${debtId}`);
    } catch { /* fallback */ }
    const updated = debts.filter(d => d.id !== debtId);
    setDebts(updated);
    saveLocal(updated);
  };

  const toUSD = (amount, currency) => {
    if (currency === "USD") return amount;
    return rate ? amount / rate : 0;
  };

  const activeDebts = debts.filter(d => d.status !== "paid");
  const paidDebts = debts.filter(d => d.status === "paid");
  const totalDebtUSD = activeDebts.reduce((s, d) => s + toUSD(d.totalAmount - d.paidAmount, d.currency), 0);

  return (
    <div className="space-y-4">
      {/* Cabecera con total */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2">
            <AlertTriangle className="size-5 text-rose-500" /> Deudas / Cachea
          </h2>
          {activeDebts.length > 0 && (
            <p className="text-sm text-rose-600 font-semibold mt-0.5">
              Pendiente total: <span className="font-mono">${totalDebtUSD.toFixed(2)}</span>
            </p>
          )}
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className={`flex items-center gap-2 text-sm font-bold py-2 px-4 rounded-xl transition-all ${
            showAdd
              ? "bg-slate-200 text-slate-600"
              : "bg-rose-600 text-white hover:bg-rose-700 shadow-md shadow-rose-600/20"
          }`}
        >
          <Plus className={`size-4 transition-transform ${showAdd ? "rotate-45" : ""}`} />
          {showAdd ? "Cancelar" : "Nueva deuda"}
        </button>
      </div>

      {/* Formulario nueva deuda */}
      {showAdd && (
        <div className="bg-rose-50 p-5 rounded-2xl border border-rose-200 space-y-4">
          <h3 className="text-sm font-bold text-rose-700 uppercase tracking-wider">Registrar deuda / cachea</h3>
          <form onSubmit={handleAddDebt} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Descripción</label>
                <input type="text" placeholder="Ej: TV Samsung, Préstamo Juan..."
                  className="w-full px-4 py-3 bg-white rounded-xl border border-rose-200 focus:border-rose-500 outline-none font-medium text-sm"
                  value={debtDesc} onChange={e => setDebtDesc(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Acreedor / A quién se debe</label>
                <input type="text" placeholder="Ej: Tienda, Amigo, Banco..."
                  className="w-full px-4 py-3 bg-white rounded-xl border border-rose-200 focus:border-rose-500 outline-none font-medium text-sm"
                  value={debtCreditor} onChange={e => setDebtCreditor(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Moneda</label>
                <div className="flex bg-white rounded-xl border border-rose-200 overflow-hidden">
                  {["VES", "USD"].map(c => (
                    <button key={c} type="button" onClick={() => setDebtCurrency(c)}
                      className={`flex-1 py-3 text-sm font-bold transition-colors ${debtCurrency === c ? "bg-rose-600 text-white" : "text-rose-600 hover:bg-rose-50"}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Monto total</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">
                    {debtCurrency === "USD" ? "$" : "Bs."}
                  </span>
                  <input type="number" step="0.01" placeholder="0.00"
                    className="w-full pl-9 pr-3 py-3 bg-white rounded-xl border border-rose-200 focus:border-rose-500 outline-none font-mono font-bold text-sm"
                    value={debtTotal} onChange={e => setDebtTotal(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Abono inicial</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">
                    {debtCurrency === "USD" ? "$" : "Bs."}
                  </span>
                  <input type="number" step="0.01" placeholder="0.00"
                    className="w-full pl-9 pr-3 py-3 bg-white rounded-xl border border-rose-200 focus:border-rose-500 outline-none font-mono font-bold text-sm"
                    value={debtAbono} onChange={e => setDebtAbono(e.target.value)} />
                </div>
              </div>
            </div>
            {/* Preview abono */}
            {debtTotal && (
              <div className="bg-white p-3 rounded-xl border border-rose-200 space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-600">
                  <span>Pagado: <span className="font-mono text-emerald-600">{debtCurrency === "USD" ? "$" : "Bs."}{parseFloat(debtAbono || 0).toFixed(2)}</span></span>
                  <span>Restante: <span className="font-mono text-rose-600">{debtCurrency === "USD" ? "$" : "Bs."}{Math.max(0, parseFloat(debtTotal || 0) - parseFloat(debtAbono || 0)).toFixed(2)}</span></span>
                </div>
                <ProgressBar
                  value={parseFloat(debtAbono || 0)}
                  max={parseFloat(debtTotal || 1)}
                  color="bg-emerald-500"
                />
              </div>
            )}
            <input type="text" placeholder="Notas adicionales (opcional)"
              className="w-full px-4 py-3 bg-white rounded-xl border border-rose-200 focus:border-rose-500 outline-none text-sm"
              value={debtNotes} onChange={e => setDebtNotes(e.target.value)} />
            <div className="flex justify-end">
              <button type="submit"
                className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-rose-600/20">
                <Plus className="size-4" /> Registrar Deuda
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de deudas activas */}
      {activeDebts.length === 0 && !showAdd && (
        <div className="text-center py-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
          <CheckCircle2 className="size-10 text-emerald-400 mx-auto mb-2" />
          <p className="text-slate-400 font-medium text-sm">Sin deudas activas</p>
        </div>
      )}

      {activeDebts.map(debt => {
        const remaining = debt.totalAmount - debt.paidAmount;
        const pct = debt.totalAmount > 0 ? (debt.paidAmount / debt.totalAmount) * 100 : 0;
        const sym = debt.currency === "USD" ? "$" : "Bs.";
        const remainingUSD = toUSD(remaining, debt.currency);
        const isPaying = payingDebtId === debt.id;

        return (
          <div key={debt.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group">
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800 truncate">{debt.description}</h3>
                    {debt.creditor && (
                      <span className="text-[10px] text-slate-400 font-medium shrink-0">→ {debt.creditor}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                    <span className="text-xs text-rose-600 font-bold font-mono">
                      Restante: {sym}{remaining.toFixed(2)}
                      {debt.currency === "VES" && rate && (
                        <span className="text-rose-400 ml-1">(≈${remainingUSD.toFixed(2)})</span>
                      )}
                    </span>
                    <span className="text-xs text-emerald-600 font-semibold font-mono">
                      Pagado: {sym}{debt.paidAmount.toFixed(2)}
                    </span>
                    <span className="text-xs text-slate-400">
                      Total: {sym}{debt.totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button onClick={() => { setPayingDebtId(isPaying ? null : debt.id); setPayAmount(""); }}
                    className="p-1.5 hover:bg-emerald-50 rounded-lg text-slate-300 hover:text-emerald-600 transition-colors"
                    title="Registrar pago">
                    <ArrowDownLeft className="size-4" />
                  </button>
                  <button onClick={() => handleDeleteDebt(debt.id)}
                    className="p-1.5 hover:bg-red-50 rounded-lg text-slate-300 hover:text-red-500 transition-colors"
                    title="Eliminar">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>

              {/* Barra de progreso */}
              <div className="mt-3 space-y-1">
                <ProgressBar value={debt.paidAmount} max={debt.totalAmount} color={pct >= 75 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-500" : "bg-rose-500"} />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>{pct.toFixed(0)}% pagado</span>
                  <span>{(100 - pct).toFixed(0)}% restante</span>
                </div>
              </div>

              {debt.notes && (
                <p className="text-xs text-slate-400 mt-2 italic">{debt.notes}</p>
              )}

              {/* Historial de pagos mini */}
              {debt.payments && debt.payments.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pagos realizados</p>
                  {debt.payments.slice(-3).map(pay => (
                    <div key={pay.id} className="flex justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Clock className="size-3" />
                        {new Date(pay.date).toLocaleDateString('es-VE', { day: '2-digit', month: 'short' })}
                        {pay.note && ` · ${pay.note}`}
                      </span>
                      <span className="font-mono font-bold text-emerald-600">+{sym}{pay.amount.toFixed(2)}</span>
                    </div>
                  ))}
                  {debt.payments.length > 3 && (
                    <p className="text-[10px] text-slate-300">+{debt.payments.length - 3} más</p>
                  )}
                </div>
              )}
            </div>

            {/* Panel de pago inline */}
            {isPaying && (
              <div className="px-4 pb-4 pt-3 bg-emerald-50 border-t border-emerald-100 flex gap-3 items-center">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">{sym}</span>
                  <input type="number" step="0.01" placeholder={`Hasta ${sym}${remaining.toFixed(2)}`}
                    className="w-full pl-9 pr-3 py-2.5 bg-white rounded-xl border border-emerald-300 focus:border-emerald-500 outline-none font-mono text-sm"
                    value={payAmount} onChange={e => setPayAmount(e.target.value)}
                    max={remaining} />
                </div>
                <button onClick={() => handleAddPayment(debt.id)}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-all shrink-0">
                  <CheckCircle2 className="size-4" /> Abonar
                </button>
                <button onClick={() => setPayingDebtId(null)}
                  className="p-2 hover:bg-emerald-100 rounded-xl text-emerald-500 shrink-0">
                  <X className="size-4" />
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* Deudas pagadas colapsables */}
      {paidDebts.length > 0 && (
        <details className="group">
          <summary className="text-xs font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-600 flex items-center gap-2 py-2">
            <CheckCircle2 className="size-3.5 text-emerald-400" />
            {paidDebts.length} deuda{paidDebts.length > 1 ? "s" : ""} saldada{paidDebts.length > 1 ? "s" : ""}
            <ChevronDown className="size-3 transition-transform group-open:rotate-180" />
          </summary>
          <div className="mt-2 space-y-2">
            {paidDebts.map(debt => (
              <div key={debt.id} className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 flex justify-between items-center opacity-60">
                <div>
                  <p className="text-sm font-semibold text-slate-600 line-through">{debt.description}</p>
                  <p className="text-xs text-emerald-600 font-mono">{debt.currency === "USD" ? "$" : "Bs."}{debt.totalAmount.toFixed(2)} · Saldado</p>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="size-4 text-emerald-500" />
                  <button onClick={() => handleDeleteDebt(debt.id)}
                    className="p-1 hover:bg-red-50 rounded-lg text-slate-300 hover:text-red-400 transition-colors">
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
