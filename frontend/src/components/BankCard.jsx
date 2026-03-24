import React from "react";
import { CreditCard, Wifi } from "lucide-react";

// Componente SVG del chip de la tarjeta
function CardChip() {
  return (
    <svg width="36" height="28" viewBox="0 0 36 28" fill="none">
      <rect x="1" y="1" width="34" height="26" rx="4" fill="#C5A84A" stroke="#B8973E" strokeWidth="1" />
      <line x1="1" y1="10" x2="35" y2="10" stroke="#B8973E" strokeWidth="0.7" />
      <line x1="1" y1="18" x2="35" y2="18" stroke="#B8973E" strokeWidth="0.7" />
      <line x1="12" y1="1" x2="12" y2="10" stroke="#B8973E" strokeWidth="0.7" />
      <line x1="24" y1="1" x2="24" y2="10" stroke="#B8973E" strokeWidth="0.7" />
      <line x1="12" y1="18" x2="12" y2="27" stroke="#B8973E" strokeWidth="0.7" />
      <line x1="24" y1="18" x2="24" y2="27" stroke="#B8973E" strokeWidth="0.7" />
      <line x1="18" y1="10" x2="18" y2="18" stroke="#B8973E" strokeWidth="0.7" />
    </svg>
  );
}

// Formato del número de tarjeta con asteriscos
function formatCardNumber(last4) {
  return `****  ****  ****  ${last4 || "0000"}`;
}

export default function BankCard({ bank, cardData, compact = false }) {
  const { colors } = bank;

  if (compact) {
    return (
      <div
        className="rounded-xl p-3 flex items-center gap-3 shadow-md min-w-[200px]"
        style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
      >
        <CreditCard className="size-5" style={{ color: colors.text }} />
        <div>
          <p className="text-xs font-bold" style={{ color: colors.text }}>{bank.shortName}</p>
          <p className="text-[10px] opacity-80" style={{ color: colors.text }}>
            **** {cardData?.last4 || "0000"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative w-full max-w-[380px] aspect-[1.586/1] rounded-2xl p-5 flex flex-col justify-between shadow-xl overflow-hidden select-none"
      style={{
        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
      }}
    >
      {/* Patrón decorativo */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div
          className="absolute -top-10 -right-10 w-56 h-56 rounded-full"
          style={{ background: colors.text }}
        />
        <div
          className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full"
          style={{ background: colors.text }}
        />
      </div>

      {/* Header: Banco + Contactless */}
      <div className="relative flex justify-between items-start">
        <div>
          <p className="text-lg font-black tracking-wide" style={{ color: colors.text }}>
            {bank.shortName}
          </p>
          <p className="text-[10px] uppercase tracking-widest opacity-70 mt-0.5" style={{ color: colors.text }}>
            {bank.name}
          </p>
        </div>
        <Wifi className="size-6 rotate-90 opacity-70" style={{ color: colors.text }} />
      </div>

      {/* Chip */}
      <div className="relative flex items-center gap-3">
        <CardChip />
      </div>

      {/* Número de tarjeta */}
      <div className="relative">
        <p
          className="font-mono text-lg tracking-[0.2em] font-semibold"
          style={{ color: colors.text }}
        >
          {formatCardNumber(cardData?.last4)}
        </p>
      </div>

      {/* Footer: Nombre + Tipo */}
      <div className="relative flex justify-between items-end">
        <div>
          <p className="text-[9px] uppercase tracking-widest opacity-60" style={{ color: colors.text }}>
            Titular
          </p>
          <p className="text-sm font-bold tracking-wider uppercase" style={{ color: colors.text }}>
            {cardData?.holderName || "NOMBRE TITULAR"}
          </p>
        </div>
        <div className="text-right">
          {cardData?.isNomina && (
            <span
              className="text-[9px] font-bold px-2 py-1 rounded-md"
              style={{
                background: `${colors.text}20`,
                color: colors.text,
              }}
            >
              NÓMINA
            </span>
          )}
          <p className="text-[10px] mt-1 opacity-60" style={{ color: colors.text }}>
            {bank.code}
          </p>
        </div>
      </div>
    </div>
  );
}
