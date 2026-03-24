import React, { useState, useEffect } from "react";
import axios from "axios";
import { DollarSign, Plus, RefreshCw, Trash2, Calendar, PieChart, Tag, TrendingUp, User, CreditCard, LayoutDashboard, Wallet, ArrowRightLeft, ChevronDown, Building2, Pencil, X, Save, Percent, Clock, BadgeDollarSign, AlertTriangle, Banknote, Send, BarChart2 } from "lucide-react";
import UserPanel from "./components/UserPanel";
import DebtManager from "./components/DebtManager";
import Analytics from "./components/Analytics";
import venezuelanBanks from "./data/venezuelanBanks";

const API_BASE = "http://localhost:3001/api";

// Métodos de pago
const PAYMENT_METHODS = [
  { key: "efectivo",      label: "Efectivo",    icon: "💵" },
  { key: "debito",       label: "Débito",      icon: "🏧" },
  { key: "credito",      label: "Crédito",     icon: "💳" },
  { key: "transferencia",label: "Transf.",     icon: "📤" },
  { key: "cachea",       label: "Cachea",      icon: "🤝" },
];

// Categorías con íconos, colores y subcategorías
const CATEGORIAS = [
  // — Entradas —
  { key: "INGRESO",               label: "Ingreso / Sueldo",       icon: "↑", color: "bg-emerald-100 text-emerald-700 border-emerald-300", isIncome: true,
    subcategories: ["Salario / Quincena", "Freelance", "Bono", "Dividendos", "Venta", "Otro ingreso"] },
  { key: "INVERSIONES",           label: "Inversiones / Divisas",  icon: "◈", color: "bg-violet-100 text-violet-700 border-violet-300",   isIncome: false,
    subcategories: ["Compra de divisas", "P2P / Crypto", "Binance", "Acciones", "Fondos", "Otro"] },
  { key: "AHORROS",               label: "Ahorros",                icon: "◎", color: "bg-blue-100 text-blue-700 border-blue-300",         isIncome: false,
    subcategories: ["Ahorro mensual", "Ahorro dólares", "Ahorro bolívares", "Premerita"] },
  // — Obligaciones —
  { key: "IMPUESTOS",             label: "Impuestos / ISLR",       icon: "✦", color: "bg-red-100 text-red-700 border-red-300",           isIncome: false,
    subcategories: ["ISLR", "IVA", "Municipal", "Aranceles", "Retención"] },
  { key: "SERVICIOS",             label: "Servicios del Hogar",    icon: "⌂", color: "bg-slate-100 text-slate-600 border-slate-300",     isIncome: false,
    subcategories: ["Electricidad (CORPOELEC)", "Agua", "Internet CANTV", "Internet privado", "Gas doméstico", "Aseo urbano", "TV cable"] },
  { key: "SUSCRIPCIONES",         label: "Suscripciones",          icon: "∞", color: "bg-cyan-100 text-cyan-700 border-cyan-300",        isIncome: false,
    subcategories: ["Netflix", "Spotify", "Disney+", "HBO Max", "Amazon Prime", "Adobe CC", "YouTube Premium", "Otro"] },
  // — Día a día —
  { key: "MERCADO / ALIMENTOS",   label: "Mercado / Alimentos",    icon: "≡", color: "bg-amber-100 text-amber-700 border-amber-300",    isIncome: false,
    subcategories: ["Supermercado", "Mercado popular", "Panadería", "Almuerzo", "Cena", "Desayuno", "Delivery", "Botiquín / Bodega"] },
  { key: "TRANSPORTE",            label: "Transporte",             icon: "→", color: "bg-sky-100 text-sky-700 border-sky-300",           isIncome: false,
    subcategories: ["Gasolina", "Metro / Bus", "Taxi / Uber", "Estacionamiento", "Peaje", "Moto"] },
  { key: "SALUD / FARMACIA",      label: "Salud / Farmacia",       icon: "✚", color: "bg-teal-100 text-teal-700 border-teal-300",       isIncome: false,
    subcategories: ["Farmacia", "Consulta médica", "Laboratorio", "Clínica / Emergencia", "Óptica", "Odontología"] },
  { key: "EDUCACIÓN",             label: "Educación",              icon: "◷", color: "bg-indigo-100 text-indigo-700 border-indigo-300", isIncome: false,
    subcategories: ["Matrícula / Mensualidad", "Libros / Materiales", "Curso online", "Transporte escolar", "Artículos escolares"] },
  // — Estilo de vida —
  { key: "PERSONAL / CUIDADO",    label: "Personal / Cuidado",     icon: "◇", color: "bg-purple-100 text-purple-700 border-purple-300", isIncome: false,
    subcategories: ["Barbería / Peluquería", "Ropa / Zapatos", "Cosméticos", "Gimnasio", "Manicure / Pedicure"] },
  { key: "OCIO / ENTRETENIMIENTO",label: "Ocio / Entretenimiento", icon: "◉", color: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-300", isIncome: false,
    subcategories: ["Cine", "Restaurante", "Bar / Licorería", "Juegos / Apps", "Salida / Paseo", "Cumpleaños"] },
  { key: "VIAJES",                label: "Viajes",                 icon: "⊕", color: "bg-sky-100 text-sky-700 border-sky-300",           isIncome: false,
    subcategories: ["Vuelo / Bus interurbano", "Hospedaje", "Comida en viaje", "Tour / Excursión", "Visa / Pasaporte"] },
  // — Financiero —
  { key: "DEUDAS / PRESTAMOS",    label: "Deudas / Préstamos",     icon: "⇄", color: "bg-rose-100 text-rose-700 border-rose-300",      isIncome: false,
    subcategories: ["Préstamo personal", "Cuota banco", "Cachea pendiente", "Deuda tarjeta", "Abono deuda"] },
  { key: "DONACIONES",            label: "Donaciones / Regalos",   icon: "◈", color: "bg-pink-100 text-pink-700 border-pink-300",       isIncome: false,
    subcategories: ["Regalo familiar", "Donación ONG", "Propina", "Ayuda a amigo"] },
  { key: "OTROS",                 label: "Otros / Imprevistos",    icon: "·", color: "bg-stone-100 text-stone-600 border-stone-300",   isIncome: false,
    subcategories: ["Imprevisto", "Reparación del hogar", "Electrodoméstico", "Mascota", "Otro"] },
];

function App() {
  const [currentView, setCurrentView] = useState("dashboard");
  const [expenses, setExpenses] = useState([]);
  const [cards, setCards] = useState([]);
  const [rate, setRate] = useState(null);
  const [description, setDescription] = useState("");
  const [amountVES, setAmountVES] = useState("");
  const [category, setCategory] = useState("INGRESO");
  const [selectedCardId, setSelectedCardId] = useState("");
  const [commission, setCommission] = useState("");
  const [commissionType, setCommissionType] = useState("percent"); // "percent" | "fixed"
  const [loading, setLoading] = useState(true);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [historyFilter, setHistoryFilter] = useState("month");
  // Método de pago
  const [paymentMethod, setPaymentMethod] = useState("efectivo");
  // Subcategoría
  const [subcategory, setSubcategory] = useState("");
  // Cachea
  const [cacheaCreditor, setCacheaCreditor] = useState("");
  const [cacheaAbono, setCacheaAbono] = useState("");
  // Deudas refresh trigger
  const [debtRefreshTick, setDebtRefreshTick] = useState(0);

  // --- Edición de movimiento ---
  const [editingExpId, setEditingExpId] = useState(null);
  const [editDesc, setEditDesc] = useState("");
  const [editAmountVES, setEditAmountVES] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editCardId, setEditCardId] = useState("");
  const [editCommission, setEditCommission] = useState("");
  const [editCommissionType, setEditCommissionType] = useState("percent");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rateRes, expensesRes, cardsRes] = await Promise.all([
        axios.get(`${API_BASE}/rate`),
        axios.get(`${API_BASE}/expenses`),
        axios.get(`${API_BASE}/cards`).catch(() => ({ data: [] })),
      ]);
      setRate(rateRes.data.rate);
      setExpenses(expensesRes.data);
      setCards(cardsRes.data);
      // Cargar tarjetas de localStorage como fallback
      if (cardsRes.data.length === 0) {
        const saved = localStorage.getItem("user_cards");
        if (saved) setCards(JSON.parse(saved));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!description || !amountVES || !rate) return;

    const commVal = parseFloat(commission) || 0;
    const commData = commVal > 0 ? { commission: commVal, commissionType } : {};
    const isCachea = paymentMethod === "cachea";
    const abonoVES = isCachea ? (parseFloat(cacheaAbono) || 0) : parseFloat(amountVES);
    const totalVES = parseFloat(amountVES);

    try {
      await axios.post(`${API_BASE}/expenses`, {
        description,
        amountVES: isCachea ? abonoVES : totalVES,
        rate,
        category,
        subcategory: subcategory || null,
        paymentMethod,
        cardId: selectedCardId || null,
        ...commData,
      });

      // Si es cachea y hay saldo por pagar, crear una deuda
      if (isCachea && totalVES > abonoVES) {
        const remaining = totalVES - abonoVES;
        const newDebt = {
          id: Date.now(),
          description,
          creditor: cacheaCreditor || "Sin especificar",
          currency: "VES",
          totalAmount: totalVES,
          paidAmount: abonoVES,
          notes: `Cachea registrado desde el movimiento de gasto`,
          payments: abonoVES > 0 ? [{ id: Date.now() + 1, amount: abonoVES, date: new Date().toISOString(), note: "Abono inicial" }] : [],
          createdAt: new Date().toISOString(),
          status: "active",
        };
        try {
          await axios.post(`${API_BASE}/debts`, newDebt);
        } catch {
          const saved = localStorage.getItem("user_debts");
          const existing = saved ? JSON.parse(saved) : [];
          localStorage.setItem("user_debts", JSON.stringify([...existing, newDebt]));
        }
        setDebtRefreshTick(t => t + 1);
      }

      setDescription("");
      setAmountVES("");
      setCommission("");
      setSubcategory("");
      setPaymentMethod("efectivo");
      setCacheaCreditor("");
      setCacheaAbono("");
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // --- Edición de movimiento ---
  const startEditExpense = (exp) => {
    setEditingExpId(exp.id);
    setEditDesc(exp.description);
    setEditAmountVES(String(exp.amountVES));
    setEditCategory(exp.category || "OTROS / IMPREVISTOS");
    setEditCardId(exp.cardId ? String(exp.cardId) : "");
    setEditCommission(exp.commission ? String(exp.commission) : "");
    setEditCommissionType(exp.commissionType || "percent");
  };

  const cancelEditExpense = () => setEditingExpId(null);

  const handleSaveExpense = async (expId) => {
    if (!editDesc || !editAmountVES || !rate) return;
    const commVal = parseFloat(editCommission) || 0;
    try {
      await axios.put(`${API_BASE}/expenses/${expId}`, {
        description: editDesc,
        amountVES: parseFloat(editAmountVES),
        rate,
        category: editCategory,
        cardId: editCardId || null,
        commission: commVal,
        commissionType: editCommissionType,
      });
    } catch {
      // Fallback: update locally
    }
    setEditingExpId(null);
    fetchData();
  };

  const handleDeleteExpense = async (expId) => {
    try {
      await axios.delete(`${API_BASE}/expenses/${expId}`);
    } catch {
      // Fallback
    }
    fetchData();
  };

  // Conversión en tiempo real con comisión
  const commissionVal = parseFloat(commission) || 0;
  const rawAmountUSD = amountVES && rate ? (parseFloat(amountVES) / rate) : 0;
  const commissionAmountUSD = commissionType === "percent"
    ? rawAmountUSD * (commissionVal / 100)
    : commissionVal > 0 ? (commissionVal / rate) : 0;
  const amountUSDPreview = Math.max(0, rawAmountUSD - commissionAmountUSD);
  const currentCatData = CATEGORIAS.find(c => c.key === category) || CATEGORIAS[0];

  // La comisión aplica en transferencias, divisas, deudas y suscripciones
  const COMMISSION_CATEGORIES = ["INVERSIONES", "DEUDAS / PRESTAMOS", "SUSCRIPCIONES", "SERVICIOS"];
  const showCommission = COMMISSION_CATEGORIES.includes(category) || parseFloat(commission) > 0;

  // Tarjeta seleccionada info
  const selectedCard = cards.find(c => String(c.id) === String(selectedCardId));
  const selectedCardBank = selectedCard ? venezuelanBanks.find(b => b.id === selectedCard.bankId) : null;

  // --- Análisis de Gastos ---
  
  // 1. Por Categoría
  const categoryTotals = expenses.reduce((acc, exp) => {
    const cat = exp.category || "Otros";
    acc[cat] = (acc[cat] || 0) + exp.amountUSD;
    return acc;
  }, {});
  const categoryEntries = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

  // 2. Por Tiempo
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1;
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek).getTime();
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

  // 3. Filtro de historial por período
  const filteredExpenses = expenses.filter(exp => {
    const time = new Date(exp.date).getTime();
    if (historyFilter === "today") return time >= startOfToday;
    if (historyFilter === "week") return time >= startOfWeek;
    return time >= startOfMonth;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-indigo-700">Control de Gastos</h1>
            <p className="text-slate-500">Gestión personal de gastos VES / USD</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Navegación */}
            <nav className="flex bg-slate-100 rounded-xl p-1 gap-1">
              <button
                onClick={() => setCurrentView("dashboard")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm transition-all ${
                  currentView === "dashboard"
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <LayoutDashboard className="size-4" />
                Dashboard
              </button>
              <button
                onClick={() => setCurrentView("analytics")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm transition-all ${
                  currentView === "analytics"
                    ? "bg-white text-violet-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <BarChart2 className="size-4" />
                Análisis
              </button>
              <button
                onClick={() => setCurrentView("debts")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm transition-all ${
                  currentView === "debts"
                    ? "bg-white text-rose-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <AlertTriangle className="size-4" />
                Deudas
              </button>
              <button
                onClick={() => setCurrentView("user")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm transition-all ${
                  currentView === "user"
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <User className="size-4" />
                Mi Perfil
              </button>
            </nav>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
              <div className="bg-indigo-100 p-2 rounded-lg">
                <RefreshCw className="text-indigo-600 size-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Tasa BCV hoy</p>
                <p className="text-xl font-bold">{rate ? `${rate.toFixed(2)}` : "Cargando..."}</p>
              </div>
            </div>
          </div>
        </header>

        {currentView === "user" ? (
          <UserPanel />
        ) : currentView === "analytics" ? (
          <Analytics expenses={expenses} cards={cards} rate={rate} />
        ) : currentView === "debts" ? (
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200">
            <DebtManager key={debtRefreshTick} rate={rate} />
          </div>
        ) : (
        <>
        {/* Tarjetas de Resumen de Tiempo — clickeables como filtro */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button onClick={() => setHistoryFilter("today")} className={`bg-white p-5 rounded-2xl shadow-sm border flex items-center gap-4 border-l-4 transition-all text-left ${historyFilter === "today" ? "border-l-blue-500 border-blue-300 ring-2 ring-blue-200 shadow-md" : "border-l-blue-500 border-slate-200 hover:shadow-md"}`}>
            <div className="bg-blue-50 p-3 rounded-full text-blue-600">
              <Calendar className="size-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Gastos de Hoy</p>
              <p className="text-2xl font-bold text-slate-800">${totalToday.toFixed(2)}</p>
            </div>
          </button>
          <button onClick={() => setHistoryFilter("week")} className={`bg-white p-5 rounded-2xl shadow-sm border flex items-center gap-4 border-l-4 transition-all text-left ${historyFilter === "week" ? "border-l-indigo-500 border-indigo-300 ring-2 ring-indigo-200 shadow-md" : "border-l-indigo-500 border-slate-200 hover:shadow-md"}`}>
            <div className="bg-indigo-50 p-3 rounded-full text-indigo-600">
              <TrendingUp className="size-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Esta Semana</p>
              <p className="text-2xl font-bold text-slate-800">${totalWeek.toFixed(2)}</p>
            </div>
          </button>
          <button onClick={() => setHistoryFilter("month")} className={`bg-white p-5 rounded-2xl shadow-sm border flex items-center gap-4 border-l-4 transition-all text-left ${historyFilter === "month" ? "border-l-purple-500 border-purple-300 ring-2 ring-purple-200 shadow-md" : "border-l-purple-500 border-slate-200 hover:shadow-md"}`}>
            <div className="bg-purple-50 p-3 rounded-full text-purple-600">
              <PieChart className="size-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Este Mes</p>
              <p className="text-2xl font-bold text-slate-800">${totalMonth.toFixed(2)}</p>
            </div>
          </button>
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
          
          <form onSubmit={handleAddExpense} className="relative z-10 space-y-5">
            {/* Fila 1: Descripción */}
            <div className="space-y-1.5">
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

            {/* Fila 2: Método de pago */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Método de pago</label>
              <div className="flex flex-wrap gap-2">
                {PAYMENT_METHODS.map(pm => (
                  <button
                    key={pm.key}
                    type="button"
                    onClick={() => { setPaymentMethod(pm.key); setSelectedCardId(""); }}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 font-bold text-sm transition-all ${
                      paymentMethod === pm.key
                        ? pm.key === "cachea"
                          ? "bg-rose-600 text-white border-rose-600 shadow-md"
                          : "bg-indigo-600 text-white border-indigo-600 shadow-md"
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span className="text-base leading-none">{pm.icon}</span>
                    {pm.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Fila 3a: Selector de tarjeta (solo débito / crédito / transferencia) */}
            {["debito", "credito", "transferencia"].includes(paymentMethod) && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                  <Wallet className="size-3 inline mr-1" />
                  Cuenta / Tarjeta
                </label>
                {cards.length === 0 ? (
                  <div className="w-full px-5 py-3.5 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-400 text-sm flex items-center gap-2">
                    <CreditCard className="size-4" />
                    <span>Sin tarjetas — <button type="button" onClick={() => setCurrentView("user")} className="text-indigo-500 font-semibold hover:underline">agregar una</button></span>
                  </div>
                ) : (
                  <div className="relative">
                    {selectedCardBank && (
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full" style={{ background: selectedCardBank.colors.primary }} />
                    )}
                    <select
                      className={`w-full ${selectedCardBank ? 'pl-10' : 'pl-5'} pr-10 py-3.5 bg-slate-50 hover:bg-slate-100 focus:bg-white rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all font-semibold text-slate-700 appearance-none cursor-pointer`}
                      value={selectedCardId}
                      onChange={(e) => setSelectedCardId(e.target.value)}
                    >
                      <option value="">Selecciona una tarjeta...</option>
                      {cards.map(card => {
                        const bank = venezuelanBanks.find(b => b.id === card.bankId);
                        return (
                          <option key={card.id} value={card.id}>
                            {bank?.shortName || card.bankName} **** {card.last4} {card.isNomina ? "(Nómina)" : ""} {card.alias ? `· ${card.alias}` : ""}
                          </option>
                        );
                      })}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <ChevronDown className="size-4" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Fila 3b: Campos de cachea */}
            {paymentMethod === "cachea" && (
              <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200 space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="size-4 text-rose-500" />
                  <span className="text-xs font-bold text-rose-700 uppercase tracking-widest">Datos del Cachea / Fiado</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Acreedor (a quién se le debe)</label>
                    <input type="text" placeholder="Ej: Tienda XYZ, Amigo Juan..."
                      className="w-full px-4 py-3 bg-white rounded-xl border border-rose-200 focus:border-rose-500 outline-none font-medium text-sm text-slate-700"
                      value={cacheaCreditor} onChange={e => setCacheaCreditor(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Abono inicial (Bs.)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-400 font-bold text-sm">Bs.</span>
                      <input type="number" step="0.01" placeholder="0.00"
                        className="w-full pl-10 pr-3 py-3 bg-white rounded-xl border border-rose-200 focus:border-rose-500 outline-none font-mono font-bold text-sm text-rose-800"
                        value={cacheaAbono} onChange={e => setCacheaAbono(e.target.value)} />
                    </div>
                  </div>
                </div>
                {amountVES && (
                  <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-rose-200 text-sm font-semibold">
                    <span className="text-slate-500">Precio total:</span>
                    <span className="font-mono font-bold text-slate-700">Bs. {parseFloat(amountVES || 0).toLocaleString('es-VE', {minimumFractionDigits: 2})}</span>
                    <span className="text-slate-300">—</span>
                    <span className="text-slate-500">Saldo restante:</span>
                    <span className="font-mono font-bold text-rose-600">
                      Bs. {Math.max(0, parseFloat(amountVES || 0) - parseFloat(cacheaAbono || 0)).toLocaleString('es-VE', {minimumFractionDigits: 2})}
                      {rate && ` ≈ $${(Math.max(0, parseFloat(amountVES || 0) - parseFloat(cacheaAbono || 0)) / rate).toFixed(2)}`}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Fila 2: Categoría visual */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Categoría</label>
              
              {/* Categoría seleccionada + botón para abrir picker */}
              <button
                type="button"
                onClick={() => setShowCategoryPicker(!showCategoryPicker)}
                className={`w-full flex items-center justify-between px-5 py-3.5 rounded-xl border-2 transition-all ${currentCatData.color} ${showCategoryPicker ? 'ring-4 ring-indigo-500/20' : ''}`}
              >
                <span className="flex items-center gap-3">
                  <span className="text-xl">{currentCatData.icon}</span>
                  <span className="font-bold text-sm">{currentCatData.label}</span>
                </span>
                <ChevronDown className={`size-4 transition-transform ${showCategoryPicker ? 'rotate-180' : ''}`} />
              </button>

              {/* Grid de categorías */}
              {showCategoryPicker && (
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2 pt-3 animate-in">
                  {CATEGORIAS.map(cat => (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => { setCategory(cat.key); setShowCategoryPicker(false); setSubcategory(""); }}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all hover:scale-[1.03] active:scale-[0.97] ${
                        category === cat.key
                          ? `${cat.color} shadow-md ring-2 ring-offset-1 ring-current`
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      <span className="text-2xl">{cat.icon}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider leading-tight text-center">{cat.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Subcategorías */}
              {!showCategoryPicker && currentCatData.subcategories && currentCatData.subcategories.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {currentCatData.subcategories.map(sub => (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => setSubcategory(sub === subcategory ? "" : sub)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        subcategory === sub
                          ? `${currentCatData.color} shadow-sm`
                          : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700"
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fila 3: Monto con conversión en tiempo real */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
              <div className="md:col-span-5 space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                  {paymentMethod === "cachea" ? "Precio total del cachea (VES)" : "Monto (VES)"}
                </label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold group-focus-within:text-indigo-600 transition-colors">Bs.</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full pl-12 pr-5 py-3.5 bg-slate-50 hover:bg-slate-100 focus:bg-white rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all font-mono font-bold text-slate-800 text-lg placeholder:text-slate-300"
                    value={amountVES}
                    onChange={(e) => setAmountVES(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Flecha de conversión */}
              <div className="md:col-span-2 flex justify-center items-center">
                <div className="flex flex-col items-center gap-1">
                  <ArrowRightLeft className="size-5 text-slate-400" />
                  <span className="text-[10px] text-slate-400 font-mono">÷ {rate?.toFixed(2) || '...'}</span>
                </div>
              </div>

              {/* Preview en USD */}
              <div className="md:col-span-5 space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Equivalente (USD)</label>
                <div className={`w-full px-5 py-3.5 rounded-xl border transition-all font-mono font-bold text-lg flex items-center gap-2 ${
                  amountUSDPreview > 0
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                    : 'bg-slate-50 border-slate-200 text-slate-300'
                }`}>
                  <DollarSign className="size-5" />
                  <span>{amountUSDPreview > 0 ? amountUSDPreview.toFixed(2) : '0.00'}</span>
                  {commissionAmountUSD > 0 && (
                    <span className="text-xs text-orange-500 font-semibold ml-auto">
                      -{commissionAmountUSD.toFixed(2)} comisión
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Fila 4: Comisión bancaria */}
            <div className={`overflow-hidden transition-all ${showCommission ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
                <div className="flex items-center gap-2 mb-3">
                  <Percent className="size-4 text-orange-600" />
                  <span className="text-xs font-bold text-orange-700 uppercase tracking-widest">Comisión Bancaria</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Tipo de comisión */}
                  <div className="flex bg-white rounded-lg border border-orange-200 overflow-hidden">
                    <button type="button"
                      onClick={() => setCommissionType("percent")}
                      className={`flex-1 py-2 text-sm font-bold transition-colors ${commissionType === "percent" ? "bg-orange-500 text-white" : "text-orange-600 hover:bg-orange-100"}`}>
                      %
                    </button>
                    <button type="button"
                      onClick={() => setCommissionType("fixed")}
                      className={`flex-1 py-2 text-sm font-bold transition-colors ${commissionType === "fixed" ? "bg-orange-500 text-white" : "text-orange-600 hover:bg-orange-100"}`}>
                      Bs. Fijo
                    </button>
                  </div>
                  {/* Valor de comisión */}
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400 font-bold text-sm">
                      {commissionType === "percent" ? "%" : "Bs."}
                    </span>
                    <input
                      type="number" step="0.01" placeholder={commissionType === "percent" ? "Ej: 1.5" : "0.00"}
                      className="w-full pl-10 pr-4 py-2 bg-white rounded-lg border border-orange-200 focus:border-orange-500 outline-none font-mono font-bold text-sm text-orange-800 placeholder:text-orange-300"
                      value={commission}
                      onChange={(e) => setCommission(e.target.value)}
                    />
                  </div>
                  {/* Preview deducción */}
                  {commissionAmountUSD > 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-orange-200">
                      <span className="text-xs text-orange-500">Descuento:</span>
                      <span className="font-mono font-bold text-sm text-orange-700">${commissionAmountUSD.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Botón para mostrar/ocultar comisión si no se muestra auto */}
            {!showCommission && (
              <button type="button" onClick={() => setCommission("0")}
                className="text-xs text-orange-500 hover:text-orange-700 font-semibold flex items-center gap-1 transition-colors">
                <Percent className="size-3" /> Agregar comisión bancaria
              </button>
            )}

            {/* Resumen visual antes de guardar */}
            {(description || amountVES) && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap items-center gap-3 text-sm">
                <span className="text-slate-400 font-medium">Resumen:</span>
                <span className="text-xl">{currentCatData.icon}</span>
                <span className="font-bold text-slate-700">{description || '...'}</span>
                {subcategory && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${currentCatData.color}`}>{subcategory}</span>
                )}
                <span className="text-slate-300">·</span>
                <span className="font-mono font-bold text-slate-600">{amountVES ? `${parseFloat(amountVES).toLocaleString('es-VE')} Bs.` : '...'}</span>
                <span className="text-slate-300">≈</span>
                <span className="font-mono font-bold text-emerald-600">${amountUSDPreview.toFixed(2)}</span>
                {paymentMethod !== "efectivo" && (
                  <>
                    <span className="text-slate-300">·</span>
                    <span className="text-xs font-semibold text-slate-500">
                      {PAYMENT_METHODS.find(pm => pm.key === paymentMethod)?.icon} {PAYMENT_METHODS.find(pm => pm.key === paymentMethod)?.label}
                    </span>
                  </>
                )}
                {paymentMethod === "cachea" && cacheaAbono && (
                  <span className="text-xs font-bold text-rose-600">
                    · Abono: Bs.{parseFloat(cacheaAbono).toLocaleString('es-VE')} · Deuda: Bs.{Math.max(0, parseFloat(amountVES||0) - parseFloat(cacheaAbono||0)).toLocaleString('es-VE')}
                  </span>
                )}
                {commissionAmountUSD > 0 && (
                  <>
                    <span className="text-slate-300">·</span>
                    <span className="text-xs font-semibold text-orange-500 flex items-center gap-1">
                      <Percent className="size-3" />
                      -{commissionAmountUSD.toFixed(2)} USD
                    </span>
                  </>
                )}
                {selectedCard && selectedCardBank && (
                  <>
                    <span className="text-slate-300">·</span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full" style={{ background: selectedCardBank.colors.primary }} />
                      <span className="font-semibold text-slate-600">{selectedCardBank.shortName} *{selectedCard.last4}</span>
                    </span>
                  </>
                )}
              </div>
            )}
            
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
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                <Calendar className="size-5 text-indigo-500" /> Historial
              </h2>
              <div className="flex bg-slate-100 rounded-lg p-0.5 gap-0.5">
                {[
                  { key: "today", label: "Hoy" },
                  { key: "week", label: "Semana" },
                  { key: "month", label: "Mes" },
                ].map(f => (
                  <button
                    key={f.key}
                    onClick={() => setHistoryFilter(f.key)}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                      historyFilter === f.key
                        ? "bg-white text-indigo-700 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            {loading ? (
              <p className="text-center italic py-10 text-slate-400">Cargando datos...</p>
            ) : filteredExpenses.length === 0 ? (
              <p className="text-center text-slate-400 py-10 bg-slate-100 rounded-xl">
                No hay movimientos {historyFilter === "today" ? "hoy" : historyFilter === "week" ? "esta semana" : "este mes"}.
              </p>
            ) : (
              filteredExpenses.map((exp) => {
                const expCat = CATEGORIAS.find(c => c.key === exp.category);
                const expCard = cards.find(c => String(c.id) === String(exp.cardId));
                const expBank = expCard ? venezuelanBanks.find(b => b.id === expCard.bankId) : null;
                const isEditing = editingExpId === exp.id;
                const expDate = new Date(exp.date);
                const isIncome = expCat?.isIncome ?? exp.category === "INGRESO";
                const editAmtUSD = isEditing && editAmountVES && rate ? parseFloat(editAmountVES) / rate : 0;

                if (isEditing) {
                  const editCatData = CATEGORIAS.find(c => c.key === editCategory) || CATEGORIAS[0];
                  return (
                    <div key={exp.id} className="bg-white rounded-2xl shadow-md border-2 border-amber-400 overflow-hidden">
                      <div className="px-4 py-3 bg-amber-50 border-b border-amber-200 flex justify-between items-center">
                        <span className="text-sm font-bold text-amber-700 flex items-center gap-2">
                          <Pencil className="size-4" /> Editando movimiento
                        </span>
                        <button onClick={cancelEditExpense} className="p-1 hover:bg-amber-100 rounded-lg text-amber-500">
                          <X className="size-4" />
                        </button>
                      </div>
                      <div className="p-4 space-y-3">
                        <input type="text" placeholder="Descripción"
                          className="w-full px-4 py-2.5 bg-white rounded-lg border border-slate-200 focus:border-amber-500 outline-none font-medium text-sm"
                          value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
                        <div className="grid grid-cols-2 gap-3">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">Bs.</span>
                            <input type="number" step="0.01"
                              className="w-full pl-10 pr-3 py-2.5 bg-white rounded-lg border border-slate-200 focus:border-amber-500 outline-none font-mono font-bold text-sm"
                              value={editAmountVES} onChange={(e) => setEditAmountVES(e.target.value)} />
                          </div>
                          <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-50 rounded-lg border border-emerald-200 font-mono font-bold text-sm text-emerald-700">
                            <DollarSign className="size-4" />{editAmtUSD > 0 ? editAmtUSD.toFixed(2) : '0.00'}
                          </div>
                        </div>
                        <select className="w-full px-4 py-2.5 bg-white rounded-lg border border-slate-200 focus:border-amber-500 outline-none text-sm font-semibold appearance-none"
                          value={editCategory} onChange={(e) => setEditCategory(e.target.value)}>
                          {CATEGORIAS.map(c => <option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}
                        </select>
                        {cards.length > 0 && (
                          <select className="w-full px-4 py-2.5 bg-white rounded-lg border border-slate-200 focus:border-amber-500 outline-none text-sm font-semibold appearance-none"
                            value={editCardId} onChange={(e) => setEditCardId(e.target.value)}>
                            <option value="">Efectivo / Sin tarjeta</option>
                            {cards.map(card => {
                              const bank = venezuelanBanks.find(b => b.id === card.bankId);
                              return <option key={card.id} value={card.id}>{bank?.shortName} **** {card.last4}</option>;
                            })}
                          </select>
                        )}
                        {/* Comisión en edición */}
                        <div className="grid grid-cols-3 gap-2">
                          <div className="flex bg-white rounded-lg border border-slate-200 overflow-hidden col-span-1">
                            <button type="button" onClick={() => setEditCommissionType("percent")}
                              className={`flex-1 py-2 text-xs font-bold ${editCommissionType === "percent" ? "bg-orange-500 text-white" : "text-orange-600"}`}>%</button>
                            <button type="button" onClick={() => setEditCommissionType("fixed")}
                              className={`flex-1 py-2 text-xs font-bold ${editCommissionType === "fixed" ? "bg-orange-500 text-white" : "text-orange-600"}`}>Bs.</button>
                          </div>
                          <input type="number" step="0.01" placeholder="Comisión"
                            className="col-span-2 px-3 py-2 bg-white rounded-lg border border-slate-200 focus:border-orange-500 outline-none font-mono text-sm"
                            value={editCommission} onChange={(e) => setEditCommission(e.target.value)} />
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button onClick={cancelEditExpense} className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-500 font-semibold text-sm hover:bg-slate-50">
                            Cancelar
                          </button>
                          <button onClick={() => handleSaveExpense(exp.id)} className="flex-1 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm flex items-center justify-center gap-1">
                            <Save className="size-3.5" /> Guardar
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                const isCacheaExp = exp.paymentMethod === 'cachea';
                const amtColor = isIncome ? 'text-emerald-600' : isCacheaExp ? 'text-rose-600' : 'text-slate-800';
                const cardBg = isIncome ? 'bg-emerald-50/50 border-emerald-200 shadow-emerald-100/50' :
                  isCacheaExp ? 'bg-rose-50/40 border-rose-200' : 'bg-white border-slate-200';

                return (
                  <div key={exp.id} className={`rounded-2xl border overflow-hidden group transition-all hover:shadow-lg ${cardBg} shadow-sm`}>

                    {/* Barra superior: banco (si tiene) o tira de color de categoría */}
                    {expBank ? (
                      <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${expBank.colors.primary} 0%, ${expBank.colors.secondary} 100%)` }} />
                    ) : (
                      <div className={`h-1 ${expCat ? expCat.color.split(' ')[0] : 'bg-slate-200'}`} />
                    )}

                    <div className="p-4 md:p-5">
                      <div className="flex items-start gap-3.5">

                        {/* Icono categoría (cuadrado redondeado) */}
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 border ${expCat ? expCat.color : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                          {expCat ? expCat.icon : '·'}
                        </div>

                        {/* Contenido */}
                        <div className="flex-1 min-w-0">

                          {/* Fila 1: título + badges + monto */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap min-w-0">
                                <h3 className="font-extrabold text-slate-800 text-[15px] leading-tight truncate">{exp.description}</h3>
                                {isIncome && (
                                  <span className="text-[9px] font-black px-2 py-0.5 bg-emerald-200 text-emerald-800 rounded-full uppercase tracking-widest shrink-0">↑ Ingreso</span>
                                )}
                                {isCacheaExp && (
                                  <span className="text-[9px] font-black px-2 py-0.5 bg-rose-200 text-rose-700 rounded-full uppercase tracking-widest shrink-0">🤝 Cachea</span>
                                )}
                              </div>
                              {/* Fecha y hora */}
                              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-medium">
                                <Clock className="size-3 shrink-0" />
                                {expDate.toLocaleDateString('es-VE', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                                <span className="text-slate-300">·</span>
                                {expDate.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>

                            {/* Monto + acciones */}
                            <div className="flex items-start gap-2 shrink-0">
                              <div className="text-right">
                                <p className={`text-base font-extrabold tracking-tight font-mono leading-tight ${amtColor}`}>
                                  {isIncome ? '+' : '−'}{Number(exp.amountVES).toLocaleString('es-VE', {minimumFractionDigits: 2})}
                                  <span className="text-[10px] font-bold text-slate-400 ml-1">Bs.</span>
                                </p>
                                <p className={`text-[11px] font-bold font-mono mt-0.5 ${isIncome ? 'text-emerald-400' : isCacheaExp ? 'text-rose-400' : 'text-slate-400'}`}>
                                  ≈ {isIncome ? '+' : '−'}${exp.amountUSD.toFixed(2)}
                                </p>
                              </div>
                              <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity pt-0.5">
                                <button onClick={() => startEditExpense(exp)}
                                  className="p-1.5 hover:bg-amber-50 rounded-lg text-slate-300 hover:text-amber-500 transition-colors" title="Editar">
                                  <Pencil className="size-3.5" />
                                </button>
                                <button onClick={() => handleDeleteExpense(exp.id)}
                                  className="p-1.5 hover:bg-red-50 rounded-lg text-slate-300 hover:text-red-500 transition-colors" title="Eliminar">
                                  <Trash2 className="size-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Fila 2: badges de metadata */}
                          <div className="flex flex-wrap gap-1.5 mt-3 items-center">
                            {/* Categoría */}
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg border ${expCat ? expCat.color : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                              {expCat?.icon} {expCat ? expCat.label : (exp.category || "Otros")}
                            </span>

                            {/* Subcategoría */}
                            {exp.subcategory && (
                              <span className="inline-flex items-center text-[10px] font-semibold px-2 py-1 rounded-lg bg-slate-100 text-slate-500 border border-slate-200">
                                {exp.subcategory}
                              </span>
                            )}

                            {/* Método de pago */}
                            {exp.paymentMethod && (
                              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg border ${
                                isCacheaExp ? 'bg-rose-100 text-rose-600 border-rose-200' :
                                exp.paymentMethod === 'efectivo' ? 'bg-slate-100 text-slate-500 border-slate-200' :
                                'bg-indigo-50 text-indigo-600 border-indigo-200'
                              }`}>
                                {PAYMENT_METHODS.find(pm => pm.key === exp.paymentMethod)?.icon}
                                {PAYMENT_METHODS.find(pm => pm.key === exp.paymentMethod)?.label}
                              </span>
                            )}

                            {/* Tarjeta bancaria */}
                            {expBank && expCard && (
                              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-600">
                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: expBank.colors.primary }} />
                                {expBank.shortName} ···{expCard.last4}
                                {expCard.isNomina && <span className="text-emerald-600">(N)</span>}
                              </span>
                            )}
                            {!expBank && !exp.cardId && exp.paymentMethod === 'efectivo' && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-medium px-2 py-1 rounded-lg bg-slate-50 border border-slate-100">
                                <BadgeDollarSign className="size-3" /> Efectivo
                              </span>
                            )}

                            {/* Comisión */}
                            {exp.commission > 0 && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg bg-orange-50 text-orange-600 border border-orange-200">
                                <Percent className="size-3" />
                                {exp.commissionType === "percent" ? `${exp.commission}%` : `${exp.commission} Bs.`} comisión
                              </span>
                            )}

                            {/* Tasa de cambio */}
                            <span className="text-[10px] font-mono text-slate-300 ml-auto">
                              @{Number(exp.exchangeRate).toFixed(2)}
                            </span>
                          </div>

                          {/* Banner especial para cachea: deuda generada */}
                          {isCacheaExp && (
                            <button
                              type="button"
                              onClick={() => setCurrentView('debts')}
                              className="mt-3 w-full flex items-center justify-between gap-2 px-3 py-2 bg-rose-100 hover:bg-rose-200 border border-rose-300 rounded-xl transition-colors text-left"
                            >
                              <span className="text-[11px] font-bold text-rose-700 flex items-center gap-1.5">
                                <AlertTriangle className="size-3.5" />
                                Deuda registrada automáticamente
                              </span>
                              <span className="text-[10px] font-bold text-rose-500 hover:underline">Ver deudas →</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
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
                <div className="space-y-3">
                  {categoryEntries.map(([cat, totalUsd]) => {
                    const catData = CATEGORIAS.find(c => c.key === cat);
                    const totalAll = categoryEntries.reduce((s, [, v]) => s + v, 0);
                    const pct = totalAll > 0 ? (totalUsd / totalAll * 100) : 0;
                    return (
                      <div key={cat} className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-slate-600 flex items-center gap-2">
                            <span className="text-base">{catData?.icon || '📦'}</span>
                            {catData?.label || cat}
                          </span>
                          <span className="text-sm font-bold text-slate-800">${totalUsd.toFixed(2)}</span>
                        </div>
                        {/* Barra de progreso */}
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  
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
        </>
        )}
      </div>
    </div>
  );
}

export default App;
