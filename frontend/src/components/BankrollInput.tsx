'use client';
import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { clsx } from 'clsx';

export function BankrollInput() {
  const { bankroll, setBankroll } = useStore();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(bankroll));

  function commit() {
    const val = parseFloat(draft.replace(',', '.'));
    if (!isNaN(val) && val > 0) {
      setBankroll(val);
    } else {
      setDraft(String(bankroll));
    }
    setEditing(false);
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-card border border-ds-border bg-ds-surface">
      <div>
        <p className="font-body text-[11px] text-ds-white-40 uppercase tracking-wider mb-0.5">Bankroll</p>
        {editing ? (
          <div className="flex items-center gap-2">
            <span className="font-body text-ds-white-40 text-[14px]">R$</span>
            <input
              type="number"
              min="1"
              step="10"
              value={draft}
              autoFocus
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
              className={clsx(
                'w-28 bg-ds-surface-4 border border-ds-border rounded-btn-sm px-2 py-1',
                'font-body text-[16px] text-ds-white outline-none',
                'focus:border-ds-blue focus:shadow-glow-blue',
                'transition-all duration-200',
              )}
            />
          </div>
        ) : (
          <button
            onClick={() => { setDraft(String(bankroll)); setEditing(true); }}
            className="font-heading text-[22px] text-ds-white hover:text-ds-blue transition-colors duration-200"
          >
            R$ {bankroll.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </button>
        )}
      </div>
      {!editing && (
        <button
          onClick={() => { setDraft(String(bankroll)); setEditing(true); }}
          className="ml-auto text-ds-white-40 hover:text-ds-white transition-colors text-[12px] font-body"
        >
          Editar
        </button>
      )}
    </div>
  );
}
