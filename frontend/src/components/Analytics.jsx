import React, { useState, useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  TrendingUp, TrendingDown, DollarSign, BarChart2,
  PieChart as PieIcon, Calendar, CreditCard, Wallet2,
} from "lucide-react";
import venezuelanBanks from "../data/venezuelanBanks";

// ─── Colores fijos para categorías ───────────────────────────────────────────
const CAT_COLORS = {
  "INGRESO":               "#10b981",
  "INVERSIONES":           "#8b5cf6",
  "AHORROS":               "#3b82f6",
  "IMPUESTOS":             "#ef4444",
  "SERVICIOS":             "#64748b",
  "SUSCRIPCIONES":         "#06b6d4",
  "MERCADO / ALIMENTOS":   "#f59e0b",
  "TRANSPORTE":            "#0ea5e9",
  "SALUD / FARMACIA":      "#14b8a6",
  "EDUCACIÓN":             "#6366f1",
  "PERSONAL / CUIDADO":    "#a855f7",
  "OCIO / ENTRETENIMIENTO":"#d946ef",
  "VIAJES":                "#0284c7",
  "DEUDAS / PRESTAMOS":    "#f43f5e",
  "DONACIONES":            "#ec4899",
  "OTROS":                 "#78716c",
};
const PALETTE = [
  "#6366f1","#f59e0b","#10b981","#f43f5e","#8b5cf6",
  "#0ea5e9","#14b8a6","#d946ef","#64748b","#ef4444",
  "#06b6d4","#a855f7","#ec4899","#78716c","#3b82f6","#0284c7",
];

const INCOME_CATS = ["INGRESO", "INVERSIONES", "AHORROS"];

const PM_LABELS = {
  efectivo:      "💵 Efectivo",
  debito:        "🏧 Débito",
  credito:       "💳 Crédito",
  transferencia: "📤 Transf.",
  cachea:        "🤝 Cachea",
};

const PERIODS     = [
  { key: "7d",  label: "7 días" },
  { key: "30d", label: "30 días" },
  { key: "90d", label: "3 meses" },
  { key: "all", label: "Todo" },
];
const GRANULARITY = [
  { key: "day",   label: "Día" },
  { key: "week",  label: "Semana" },
  { key: "month", label: "Mes" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getWeekNumber(d) {
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const w1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - w1.getTime()) / 86400000 - 3 + ((w1.getDay() + 6) % 7)) / 7);
}

function getGroupKey(dateStr, gran) {
  const d = new Date(dateStr);
  if (gran === "month") return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  if (gran === "week")  return `${d.getFullYear()}-W${String(getWeekNumber(d)).padStart(2, "0")}`;
  return dateStr.slice(0, 10);
}

function formatLabel(dateStr, gran) {
  const d = new Date(dateStr);
  if (gran === "month") return d.toLocaleDateString("es-VE", { month: "short", year: "2-digit" });
  if (gran === "week")  return `Sem ${getWeekNumber(d)}`;
  return d.toLocaleDateString("es-VE", { day: "2-digit", month: "short" });
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white shadow-2xl border border-slate-100 rounded-2xl px-4 py-3 text-xs min-w-[140px]">
      <p className="font-black text-slate-700 mb-2 text-[11px] uppercase tracking-wider">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex justify-between gap-4">
          <span style={{ color: p.color }} className="font-semibold">{p.name}</span>
          <span className="font-mono font-bold text-slate-700">${Number(p.value).toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Pill button ─────────────────────────────────────────────────────────────
function Pill({ label, active, onClick, activeClass = "bg-white text-indigo-700 shadow-sm" }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${active ? activeClass : "text-slate-500 hover:text-slate-700"}`}
    >
      {label}
    </button>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────
function Card({ title, children, action }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div className="flex justify-between items-center mb-5">
        <h3 className="font-bold text-slate-700 text-[15px]">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function Analytics({ expenses = [], cards = [], rate }) {
  const [period, setPeriod]         = useState("30d");
  const [granularity, setGranularity] = useState("day");
  const [activeTab, setActiveTab]   = useState("time");
  const [catView, setCatView]       = useState("chart"); // "chart" | "table"

  // ── filter by period ──
  const filtered = useMemo(() => {
    if (period === "all") return expenses;
    const days   = { "7d": 7, "30d": 30, "90d": 90 }[period];
    const cutoff = Date.now() - days * 86_400_000;
    return expenses.filter(e => new Date(e.date).getTime() >= cutoff);
  }, [expenses, period]);

  const onlyExp = filtered.filter(e => !INCOME_CATS.includes(e.category));
  const onlyInc = filtered.filter(e =>  INCOME_CATS.includes(e.category));

  // ── KPIs ──
  const totalExpUSD = onlyExp.reduce((s, e) => s + (e.amountUSD || 0), 0);
  const totalIncUSD = onlyInc.reduce((s, e) => s + (e.amountUSD || 0), 0);
  const balance     = totalIncUSD - totalExpUSD;

  const avgDaily = useMemo(() => {
    if (!onlyExp.length) return 0;
    const unique = new Set(onlyExp.map(e => e.date?.slice(0, 10))).size;
    return totalExpUSD / (unique || 1);
  }, [onlyExp, totalExpUSD]);

  const topCat = useMemo(() => {
    const acc = {};
    onlyExp.forEach(e => { acc[e.category] = (acc[e.category] || 0) + (e.amountUSD || 0); });
    const sorted = Object.entries(acc).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] ?? "—";
  }, [onlyExp]);

  // ── time series ──
  const timeData = useMemo(() => {
    const groups = {};
    filtered.forEach(e => {
      const key = getGroupKey(e.date, granularity);
      if (!groups[key]) groups[key] = { key, label: formatLabel(e.date, granularity), gastos: 0, ingresos: 0 };
      (INCOME_CATS.includes(e.category) ? (groups[key].ingresos += e.amountUSD || 0) : (groups[key].gastos += e.amountUSD || 0));
    });
    return Object.values(groups)
      .sort((a, b) => a.key.localeCompare(b.key))
      .map(g => ({ ...g, gastos: +g.gastos.toFixed(2), ingresos: +g.ingresos.toFixed(2) }));
  }, [filtered, granularity]);

  // ── category donut ──
  const catData = useMemo(() => {
    const acc = {};
    onlyExp.forEach(e => { const k = e.category || "OTROS"; acc[k] = (acc[k] || 0) + (e.amountUSD || 0); });
    return Object.entries(acc)
      .map(([name, value]) => ({ name, value: +value.toFixed(2) }))
      .sort((a, b) => b.value - a.value);
  }, [onlyExp]);

  // ── card bar ──
  const cardData = useMemo(() => {
    const acc = {};
    onlyExp.forEach(e => {
      if (!e.cardId) { acc["Efectivo"] = (acc["Efectivo"] || 0) + (e.amountUSD || 0); return; }
      const card = cards.find(c => String(c.id) === String(e.cardId));
      const bank = card ? venezuelanBanks.find(b => b.id === card.bankId) : null;
      const key  = card ? `${bank?.shortName || card.bankName} ···${card.last4}` : `Tarj. #${e.cardId}`;
      acc[key] = (acc[key] || 0) + (e.amountUSD || 0);
    });
    return Object.entries(acc)
      .map(([name, value]) => ({ name, value: +value.toFixed(2) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [onlyExp, cards]);

  // ── payment method ──
  const payData = useMemo(() => {
    const acc = {};
    filtered.forEach(e => { const k = e.paymentMethod || "efectivo"; acc[k] = (acc[k] || 0) + (e.amountUSD || 0); });
    return Object.entries(acc)
      .map(([key, value]) => ({ name: PM_LABELS[key] || key, key, value: +value.toFixed(2) }))
      .sort((a, b) => b.value - a.value);
  }, [filtered]);

  const noData = filtered.length === 0;

  const TABS = [
    { key: "time",   label: "Evolución",   icon: <Calendar className="size-3.5" /> },
    { key: "cat",    label: "Categorías",  icon: <PieIcon   className="size-3.5" /> },
    { key: "card",   label: "Tarjetas",    icon: <CreditCard className="size-3.5" /> },
    { key: "method", label: "Métodos",     icon: <BarChart2 className="size-3.5" /> },
  ];

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Análisis</h2>
          <p className="text-sm text-slate-400 mt-0.5">Visión completa de tus movimientos históricos</p>
        </div>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          {PERIODS.map(p => (
            <Pill key={p.key} label={p.label} active={period === p.key} onClick={() => setPeriod(p.key)} />
          ))}
        </div>
      </div>

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Gastos totales", value: `$${totalExpUSD.toFixed(2)}`,
            sub: `${onlyExp.length} movimiento${onlyExp.length !== 1 ? "s" : ""}`,
            color: "text-rose-600", bg: "bg-rose-50 border-rose-100",
            icon: <TrendingDown className="size-5 text-rose-400" />,
          },
          {
            label: "Ingresos totales", value: `$${totalIncUSD.toFixed(2)}`,
            sub: `${onlyInc.length} movimiento${onlyInc.length !== 1 ? "s" : ""}`,
            color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100",
            icon: <TrendingUp className="size-5 text-emerald-400" />,
          },
          {
            label: "Balance neto",
            value: `${balance >= 0 ? "+" : ""}$${balance.toFixed(2)}`,
            sub: balance >= 0 ? "Superávit ✓" : "Déficit ✗",
            color: balance >= 0 ? "text-indigo-600" : "text-orange-500",
            bg: balance >= 0 ? "bg-indigo-50 border-indigo-100" : "bg-orange-50 border-orange-100",
            icon: <DollarSign className={`size-5 ${balance >= 0 ? "text-indigo-400" : "text-orange-400"}`} />,
          },
          {
            label: "Promedio / día",
            value: `$${avgDaily.toFixed(2)}`,
            sub: topCat !== "—" ? `Top: ${topCat.split(" / ")[0]}` : "Sin datos",
            color: "text-violet-600", bg: "bg-violet-50 border-violet-100",
            icon: <BarChart2 className="size-5 text-violet-400" />,
          },
        ].map(k => (
          <div key={k.label} className={`rounded-2xl border p-4 ${k.bg}`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">{k.label}</p>
              {k.icon}
            </div>
            <p className={`text-xl font-extrabold font-mono leading-none ${k.color}`}>{k.value}</p>
            <p className="text-[11px] text-slate-400 mt-1.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* ── No data ── */}
      {noData ? (
        <div className="text-center py-24 bg-white rounded-2xl border-2 border-dashed border-slate-200">
          <BarChart2 className="size-14 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 font-bold text-lg">Sin movimientos en este período</p>
          <p className="text-slate-300 text-sm mt-1">Registra gastos en el Dashboard para ver las gráficas</p>
        </div>
      ) : (
        <>
          {/* ── Tab bar ── */}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === t.key ? "bg-white text-indigo-700 shadow-sm" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {t.icon}
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {/* ═══ TAB: Evolución ═══ */}
          {activeTab === "time" && (
            <Card
              title="Gastos e ingresos en el tiempo"
              action={
                <div className="flex gap-0.5 bg-slate-100 p-0.5 rounded-lg">
                  {GRANULARITY.map(g => (
                    <Pill key={g.key} label={g.label} active={granularity === g.key} onClick={() => setGranularity(g.key)} />
                  ))}
                </div>
              }
            >
              {timeData.length === 0 ? (
                <p className="text-center text-slate-300 py-16">Sin datos</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={timeData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gGastos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#f43f5e" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="gIngresos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#10b981" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false}
                      tickFormatter={v => `$${v}`} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend iconType="circle" iconSize={7}
                      wrapperStyle={{ fontSize: 12, paddingTop: 16, color: "#64748b", fontWeight: 600 }} />
                    <Area type="monotone" dataKey="gastos"   name="Gastos"
                      stroke="#f43f5e" strokeWidth={2.5} fill="url(#gGastos)"
                      dot={false} activeDot={{ r: 5, strokeWidth: 0, fill: "#f43f5e" }} />
                    <Area type="monotone" dataKey="ingresos" name="Ingresos"
                      stroke="#10b981" strokeWidth={2.5} fill="url(#gIngresos)"
                      dot={false} activeDot={{ r: 5, strokeWidth: 0, fill: "#10b981" }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </Card>
          )}

          {/* ═══ TAB: Categorías ═══ */}
          {activeTab === "cat" && (
            <Card
              title="Distribución por categoría"
              action={
                <div className="flex gap-0.5 bg-slate-100 p-0.5 rounded-lg">
                  <Pill label="Gráfica" active={catView === "chart"} onClick={() => setCatView("chart")} />
                  <Pill label="Tabla"   active={catView === "table"} onClick={() => setCatView("table")} />
                </div>
              }
            >
              {catData.length === 0 ? (
                <p className="text-center text-slate-300 py-16">Sin gastos en el período</p>
              ) : catView === "chart" ? (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
                  {/* Donut */}
                  <div className="md:col-span-2">
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie data={catData} cx="50%" cy="50%"
                          innerRadius={68} outerRadius={110}
                          paddingAngle={2} dataKey="value" nameKey="name"
                          stroke="none">
                          {catData.map((entry, i) => (
                            <Cell key={entry.name}
                              fill={CAT_COLORS[entry.name] || PALETTE[i % PALETTE.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={v => [`$${Number(v).toFixed(2)}`, ""]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Legend with bars */}
                  <div className="md:col-span-3 space-y-2.5">
                    {catData.map((c, i) => {
                      const total = catData.reduce((s, x) => s + x.value, 0);
                      const pct   = total > 0 ? (c.value / total) * 100 : 0;
                      const color = CAT_COLORS[c.name] || PALETTE[i % PALETTE.length];
                      return (
                        <div key={c.name}>
                          <div className="flex justify-between items-center mb-1">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: color }} />
                              <span className="text-xs font-semibold text-slate-700 truncate">{c.name}</span>
                            </div>
                            <span className="text-xs font-bold font-mono text-slate-700 shrink-0 ml-2">
                              ${c.value.toFixed(2)}
                              <span className="text-slate-400 font-normal ml-1">({pct.toFixed(0)}%)</span>
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all"
                              style={{ width: `${pct}%`, background: color }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Table view */
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Categoría</th>
                        <th className="text-right py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Movimientos</th>
                        <th className="text-right py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Total USD</th>
                        <th className="text-right py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {catData.map((c, i) => {
                        const total = catData.reduce((s, x) => s + x.value, 0);
                        const pct   = total > 0 ? (c.value / total) * 100 : 0;
                        const color = CAT_COLORS[c.name] || PALETTE[i % PALETTE.length];
                        const count = onlyExp.filter(e => e.category === c.name).length;
                        return (
                          <tr key={c.name} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                            <td className="py-2.5">
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: color }} />
                                <span className="font-semibold text-slate-700">{c.name}</span>
                              </div>
                            </td>
                            <td className="py-2.5 text-right font-mono text-slate-500">{count}</td>
                            <td className="py-2.5 text-right font-mono font-bold text-slate-800">${c.value.toFixed(2)}</td>
                            <td className="py-2.5 text-right">
                              <span className="text-xs font-bold px-2 py-0.5 rounded-md"
                                style={{ background: color + "22", color }}>
                                {pct.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-200 bg-slate-50">
                        <td className="py-2.5 font-bold text-slate-700">Total</td>
                        <td className="py-2.5 text-right font-mono font-semibold text-slate-600">{onlyExp.length}</td>
                        <td className="py-2.5 text-right font-mono font-extrabold text-slate-800">
                          ${catData.reduce((s, c) => s + c.value, 0).toFixed(2)}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </Card>
          )}

          {/* ═══ TAB: Tarjetas ═══ */}
          {activeTab === "card" && (
            <Card title="Gastos por tarjeta / fuente de pago">
              {cardData.length === 0 ? (
                <p className="text-center text-slate-300 py-16">Sin gastos en el período</p>
              ) : (
                <ResponsiveContainer width="100%" height={Math.max(240, cardData.length * 56)}>
                  <BarChart data={cardData} layout="vertical"
                    margin={{ top: 0, right: 50, left: 4, bottom: 0 }} barSize={22}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false}
                      axisLine={false} tickFormatter={v => `$${v}`} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#475569" }}
                      tickLine={false} axisLine={false} width={148} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="value" name="Total USD" radius={[0, 8, 8, 0]}
                      label={{ position: "right", formatter: v => `$${v.toFixed(2)}`, fontSize: 11, fill: "#64748b", fontWeight: 700 }}>
                      {cardData.map((_, i) => (
                        <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}

              {/* Tabla resumen */}
              {cardData.length > 0 && (
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                  {cardData.map((c, i) => {
                    const total = cardData.reduce((s, x) => s + x.value, 0);
                    const pct   = total > 0 ? (c.value / total) * 100 : 0;
                    return (
                      <div key={c.name} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="w-2 h-2 rounded-full shrink-0"
                            style={{ background: PALETTE[i % PALETTE.length] }} />
                          <p className="text-[10px] font-bold text-slate-500 truncate">{c.name}</p>
                        </div>
                        <p className="font-extrabold font-mono text-slate-800 text-sm">${c.value.toFixed(2)}</p>
                        <p className="text-[10px] text-slate-400">{pct.toFixed(1)}% del total</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          )}

          {/* ═══ TAB: Métodos ═══ */}
          {activeTab === "method" && (
            <Card title="Distribución por método de pago">
              {payData.length === 0 ? (
                <p className="text-center text-slate-300 py-16">Sin movimientos en el período</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={payData} cx="50%" cy="50%"
                        innerRadius={65} outerRadius={108}
                        paddingAngle={3} dataKey="value" nameKey="name" stroke="none">
                        {payData.map((_, i) => (
                          <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={v => [`$${Number(v).toFixed(2)}`, ""]} />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="space-y-3">
                    {payData.map((p, i) => {
                      const total = payData.reduce((s, x) => s + x.value, 0);
                      const pct   = total > 0 ? (p.value / total) * 100 : 0;
                      const color = PALETTE[i % PALETTE.length];
                      return (
                        <div key={p.name}>
                          <div className="flex justify-between items-center mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full shrink-0" style={{ background: color }} />
                              <span className="text-sm font-semibold text-slate-700">{p.name}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-bold font-mono text-slate-800">${p.value.toFixed(2)}</span>
                              <span className="text-xs text-slate-400 ml-1.5">({pct.toFixed(0)}%)</span>
                            </div>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all"
                              style={{ width: `${pct}%`, background: color }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>
          )}
        </>
      )}
    </div>
  );
}
