import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  User,
  CreditCard,
  Plus,
  Trash2,
  Building2,
  ChevronDown,
  Save,
  CheckCircle2,
  Pencil,
  X,
} from "lucide-react";
import venezuelanBanks from "../data/venezuelanBanks";
import BankCard from "./BankCard";

const API_BASE = "http://localhost:3001/api";

export default function UserPanel() {
  // --- Estado del usuario ---
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userSaved, setUserSaved] = useState(false);

  // --- Estado de tarjetas ---
  const [cards, setCards] = useState([]);
  const [showAddCard, setShowAddCard] = useState(false);

  // --- Formulario de nueva tarjeta ---
  const [selectedBankId, setSelectedBankId] = useState(venezuelanBanks[0].id);
  const [cardLast4, setCardLast4] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [isNomina, setIsNomina] = useState(false);
  const [cardAlias, setCardAlias] = useState("");

  // --- Tarjeta seleccionada para vista previa ---
  const [selectedCardIndex, setSelectedCardIndex] = useState(null);

  // --- Edición de tarjeta ---
  const [editingCardId, setEditingCardId] = useState(null);
  const [editBankId, setEditBankId] = useState("");
  const [editLast4, setEditLast4] = useState("");
  const [editHolder, setEditHolder] = useState("");
  const [editNomina, setEditNomina] = useState(false);
  const [editAlias, setEditAlias] = useState("");

  // Cargar datos al montar
  useEffect(() => {
    loadUserData();
    loadCards();
  }, []);

  const loadUserData = () => {
    const saved = localStorage.getItem("user_profile");
    if (saved) {
      const data = JSON.parse(saved);
      setUserName(data.name || "");
      setUserEmail(data.email || "");
    }
  };

  const loadCards = async () => {
    try {
      const res = await axios.get(`${API_BASE}/cards`);
      setCards(res.data);
    } catch {
      // Fallback a localStorage si el backend no tiene el endpoint
      const saved = localStorage.getItem("user_cards");
      if (saved) setCards(JSON.parse(saved));
    }
  };

  const saveUserData = () => {
    localStorage.setItem(
      "user_profile",
      JSON.stringify({ name: userName, email: userEmail })
    );
    setUserSaved(true);
    setTimeout(() => setUserSaved(false), 2000);
  };

  const handleAddCard = async (e) => {
    e.preventDefault();
    const bank = venezuelanBanks.find((b) => b.id === selectedBankId);
    if (!bank) return;

    const newCard = {
      id: Date.now(),
      bankId: bank.id,
      bankName: bank.name,
      bankCode: bank.code,
      last4: cardLast4,
      holderName: cardHolder || userName,
      isNomina,
      alias: cardAlias,
    };

    try {
      const res = await axios.post(`${API_BASE}/cards`, newCard);
      setCards((prev) => [...prev, res.data]);
    } catch {
      // Fallback local
      const updated = [...cards, newCard];
      setCards(updated);
      localStorage.setItem("user_cards", JSON.stringify(updated));
    }

    // Reset form
    setCardLast4("");
    setCardHolder("");
    setIsNomina(false);
    setCardAlias("");
    setShowAddCard(false);
  };

  const handleDeleteCard = async (cardId) => {
    try {
      await axios.delete(`${API_BASE}/cards/${cardId}`);
    } catch {
      // Fallback local
    }
    const updated = cards.filter((c) => c.id !== cardId);
    setCards(updated);
    localStorage.setItem("user_cards", JSON.stringify(updated));
    if (selectedCardIndex !== null) setSelectedCardIndex(null);
  };

  const startEditCard = (card) => {
    setEditingCardId(card.id);
    setEditBankId(card.bankId);
    setEditLast4(card.last4);
    setEditHolder(card.holderName);
    setEditNomina(card.isNomina);
    setEditAlias(card.alias || "");
  };

  const cancelEditCard = () => {
    setEditingCardId(null);
  };

  const handleSaveEditCard = async (cardId) => {
    const bank = venezuelanBanks.find((b) => b.id === editBankId);
    if (!bank) return;

    const updatedCard = {
      bankId: bank.id,
      bankName: bank.name,
      bankCode: bank.code,
      last4: editLast4,
      holderName: editHolder,
      isNomina: editNomina,
      alias: editAlias,
    };

    try {
      await axios.put(`${API_BASE}/cards/${cardId}`, updatedCard);
    } catch {
      // Fallback local
    }

    const updated = cards.map((c) =>
      c.id === cardId ? { ...c, ...updatedCard } : c
    );
    setCards(updated);
    localStorage.setItem("user_cards", JSON.stringify(updated));
    setEditingCardId(null);
  };

  const selectedBank = venezuelanBanks.find((b) => b.id === selectedBankId);

  return (
    <div className="space-y-8">
      {/* ===== PERFIL DE USUARIO ===== */}
      <section className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <User className="w-48 h-48 text-indigo-900" />
        </div>

        <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
          <div className="bg-indigo-100 p-2 rounded-xl">
            <User className="size-6 text-indigo-700" strokeWidth={3} />
          </div>
          Datos del Usuario
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
              Nombre Completo
            </label>
            <input
              type="text"
              placeholder="Tu nombre completo"
              className="w-full px-5 py-3.5 bg-slate-50 hover:bg-slate-100 focus:bg-white rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-400 font-medium text-slate-700"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              placeholder="correo@ejemplo.com"
              className="w-full px-5 py-3.5 bg-slate-50 hover:bg-slate-100 focus:bg-white rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-400 font-medium text-slate-700"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end mt-5 relative z-10">
          <button
            onClick={saveUserData}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold tracking-wide py-3 px-6 rounded-xl transition-all shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 active:scale-[0.98]"
          >
            {userSaved ? (
              <>
                <CheckCircle2 className="size-5" /> Guardado
              </>
            ) : (
              <>
                <Save className="size-5" /> Guardar Perfil
              </>
            )}
          </button>
        </div>
      </section>

      {/* ===== MIS TARJETAS ===== */}
      <section className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <div className="bg-emerald-100 p-2 rounded-xl">
              <CreditCard className="size-6 text-emerald-700" strokeWidth={3} />
            </div>
            Mis Tarjetas Bancarias
          </h2>
          <button
            onClick={() => setShowAddCard(!showAddCard)}
            className={`flex items-center gap-2 font-bold py-2.5 px-5 rounded-xl transition-all active:scale-[0.98] text-sm ${
              showAddCard
                ? "bg-slate-200 text-slate-600 hover:bg-slate-300"
                : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/30"
            }`}
          >
            <Plus className={`size-4 transition-transform ${showAddCard ? "rotate-45" : ""}`} />
            {showAddCard ? "Cancelar" : "Agregar Tarjeta"}
          </button>
        </div>

        {/* Vista previa de tarjeta seleccionada */}
        {selectedCardIndex !== null && cards[selectedCardIndex] && (
          <div className="mb-8 flex justify-center">
            <BankCard
              bank={venezuelanBanks.find((b) => b.id === cards[selectedCardIndex].bankId) || venezuelanBanks[0]}
              cardData={cards[selectedCardIndex]}
            />
          </div>
        )}

        {/* Formulario para agregar tarjeta */}
        {showAddCard && (
          <div className="mb-8 bg-slate-50 p-6 rounded-2xl border border-slate-200 border-dashed">
            {/* Preview de la nueva tarjeta */}
            <div className="flex justify-center mb-6">
              <BankCard
                bank={selectedBank}
                cardData={{
                  last4: cardLast4 || "0000",
                  holderName: cardHolder || userName || "NOMBRE TITULAR",
                  isNomina,
                }}
              />
            </div>

            <form onSubmit={handleAddCard} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Selector de banco */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                    Banco
                  </label>
                  <div className="relative">
                    <div
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full"
                      style={{ background: selectedBank?.colors.primary }}
                    />
                    <select
                      className="w-full pl-10 pr-10 py-3.5 bg-white rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all font-semibold text-slate-700 appearance-none cursor-pointer"
                      value={selectedBankId}
                      onChange={(e) => setSelectedBankId(e.target.value)}
                    >
                      {venezuelanBanks.map((bank) => (
                        <option key={bank.id} value={bank.id}>
                          {bank.code} — {bank.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <ChevronDown className="size-4" />
                    </div>
                  </div>
                </div>

                {/* Últimos 4 dígitos */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                    Últimos 4 dígitos
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    pattern="\d{4}"
                    placeholder="1234"
                    className="w-full px-5 py-3.5 bg-white rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all font-mono font-bold text-slate-700 tracking-widest text-center text-lg placeholder:text-slate-300"
                    value={cardLast4}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                      setCardLast4(v);
                    }}
                    required
                  />
                </div>

                {/* Nombre del titular */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                    Titular de la Tarjeta
                  </label>
                  <input
                    type="text"
                    placeholder={userName || "Nombre en la tarjeta"}
                    className="w-full px-5 py-3.5 bg-white rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all font-medium text-slate-700 placeholder:text-slate-400 uppercase"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                  />
                </div>

                {/* Alias */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                    Alias (opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Tarjeta principal, Ahorros..."
                    className="w-full px-5 py-3.5 bg-white rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all font-medium text-slate-700 placeholder:text-slate-400"
                    value={cardAlias}
                    onChange={(e) => setCardAlias(e.target.value)}
                  />
                </div>
              </div>

              {/* Cuenta Nómina Toggle */}
              <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsNomina(!isNomina)}
                  className={`relative w-12 h-7 rounded-full transition-colors ${
                    isNomina ? "bg-emerald-500" : "bg-slate-300"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                      isNomina ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
                <div>
                  <p className="font-bold text-slate-700 text-sm">Cuenta Nómina</p>
                  <p className="text-xs text-slate-400">
                    Marca si esta tarjeta está asociada a tu cuenta de nómina
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/50 active:scale-[0.98]"
                >
                  <CreditCard className="size-5" />
                  Agregar Tarjeta
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de tarjetas */}
        {cards.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <CreditCard className="size-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">No tienes tarjetas registradas</p>
            <p className="text-slate-300 text-sm mt-1">
              Agrega tu primera tarjeta bancaria
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {cards.map((card, index) => {
              const bank =
                venezuelanBanks.find((b) => b.id === card.bankId) || venezuelanBanks[0];
              const isEditing = editingCardId === card.id;
              const editBank = isEditing ? venezuelanBanks.find((b) => b.id === editBankId) || bank : bank;

              if (isEditing) {
                return (
                  <div key={card.id} className="rounded-2xl border-2 border-amber-400 shadow-lg shadow-amber-100 bg-white overflow-hidden">
                    <div className="p-4 bg-amber-50 border-b border-amber-200 flex justify-between items-center">
                      <span className="text-sm font-bold text-amber-700 flex items-center gap-2">
                        <Pencil className="size-4" /> Editando tarjeta
                      </span>
                      <button onClick={cancelEditCard} className="p-1 hover:bg-amber-100 rounded-lg text-amber-500 hover:text-amber-700 transition-colors">
                        <X className="size-4" />
                      </button>
                    </div>
                    <div className="p-4 space-y-3">
                      {/* Preview mini */}
                      <div className="flex justify-center mb-2">
                        <BankCard
                          bank={editBank}
                          cardData={{ last4: editLast4 || "0000", holderName: editHolder || "TITULAR", isNomina: editNomina }}
                          compact
                        />
                      </div>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full" style={{ background: editBank.colors.primary }} />
                        <select
                          className="w-full pl-8 pr-8 py-2.5 bg-white rounded-lg border border-slate-200 focus:border-amber-500 outline-none text-sm font-semibold text-slate-700 appearance-none"
                          value={editBankId}
                          onChange={(e) => setEditBankId(e.target.value)}
                        >
                          {venezuelanBanks.map((b) => (
                            <option key={b.id} value={b.id}>{b.code} — {b.name}</option>
                          ))}
                        </select>
                      </div>
                      <input
                        type="text" maxLength={4} placeholder="Últimos 4"
                        className="w-full px-3 py-2.5 bg-white rounded-lg border border-slate-200 focus:border-amber-500 outline-none font-mono font-bold text-center tracking-widest text-sm"
                        value={editLast4}
                        onChange={(e) => setEditLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      />
                      <input
                        type="text" placeholder="Titular"
                        className="w-full px-3 py-2.5 bg-white rounded-lg border border-slate-200 focus:border-amber-500 outline-none font-medium text-sm uppercase"
                        value={editHolder}
                        onChange={(e) => setEditHolder(e.target.value.toUpperCase())}
                      />
                      <input
                        type="text" placeholder="Alias (opcional)"
                        className="w-full px-3 py-2.5 bg-white rounded-lg border border-slate-200 focus:border-amber-500 outline-none text-sm"
                        value={editAlias}
                        onChange={(e) => setEditAlias(e.target.value)}
                      />
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setEditNomina(!editNomina)}
                          className={`relative w-10 h-6 rounded-full transition-colors ${editNomina ? "bg-emerald-500" : "bg-slate-300"}`}>
                          <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${editNomina ? "translate-x-4" : "translate-x-0.5"}`} />
                        </button>
                        <span className="text-xs font-semibold text-slate-600">Nómina</span>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button onClick={cancelEditCard} className="flex-1 py-2 rounded-lg border border-slate-200 text-slate-500 font-semibold text-sm hover:bg-slate-50 transition-colors">
                          Cancelar
                        </button>
                        <button onClick={() => handleSaveEditCard(card.id)} className="flex-1 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition-colors flex items-center justify-center gap-1">
                          <Save className="size-3.5" /> Guardar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={card.id}
                  onClick={() =>
                    setSelectedCardIndex(selectedCardIndex === index ? null : index)
                  }
                  className={`relative group cursor-pointer rounded-2xl border-2 transition-all ${
                    selectedCardIndex === index
                      ? "border-indigo-400 shadow-lg shadow-indigo-100"
                      : "border-slate-200 hover:border-slate-300 hover:shadow-md"
                  }`}
                >
                  {/* Mini card visual */}
                  <div
                    className="rounded-t-xl p-4 flex items-center gap-3"
                    style={{
                      background: `linear-gradient(135deg, ${bank.colors.primary}, ${bank.colors.secondary})`,
                    }}
                  >
                    <div
                      className="w-8 h-5 rounded"
                      style={{ background: `${bank.colors.text}30` }}
                    />
                    <p
                      className="font-mono text-sm tracking-wider"
                      style={{ color: bank.colors.text }}
                    >
                      **** **** **** {card.last4}
                    </p>
                  </div>

                  {/* Info */}
                  <div className="p-4 bg-white rounded-b-xl">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ background: bank.colors.primary }}
                          />
                          <p className="font-bold text-slate-800 text-sm">{bank.name}</p>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 ml-5">
                          {card.holderName}{" "}
                          {card.alias && (
                            <span className="text-slate-300">· {card.alias}</span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {card.isNomina && (
                          <span className="text-[10px] font-bold px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md">
                            NÓMINA
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditCard(card);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-amber-50 rounded-lg transition-all text-slate-300 hover:text-amber-500"
                          title="Editar tarjeta"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCard(card.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 rounded-lg transition-all text-slate-300 hover:text-red-500"
                          title="Eliminar tarjeta"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                      <span className="text-[10px] font-mono text-slate-300">
                        Código: {bank.code}
                      </span>
                      <Building2 className="size-3.5 text-slate-300" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
