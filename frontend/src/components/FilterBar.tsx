'use client';
import { useStore } from '@/store/useStore';
import { clsx } from 'clsx';

const MARKET_OPTIONS = [
  { value: '', label: 'Todos os mercados' },
  { value: 'h2h', label: '1X2' },
  { value: 'totals', label: 'Over/Under' },
  { value: 'btts', label: 'Ambos Marcam' },
  { value: 'double_chance', label: 'Chance Dupla' },
];

export function FilterBar() {
  const { marketFilter, setMarketFilter, minMargin, setMinMargin } = useStore();

  return (
    <div className="flex flex-wrap items-center gap-3 pb-4">
      {/* Filtro de mercado */}
      <div className="flex items-center gap-2 flex-wrap">
        {MARKET_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setMarketFilter(opt.value)}
            className={clsx(
              'px-3 py-1.5 rounded-full font-body text-[12px] border transition-all duration-200',
              marketFilter === opt.value
                ? 'bg-ds-blue/20 border-ds-blue text-ds-blue'
                : 'border-ds-border text-ds-white-40 hover:border-ds-border-2 hover:text-ds-white',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="h-4 w-px bg-ds-border ml-1" />

      {/* Margem mínima */}
      <div className="flex items-center gap-2">
        <span className="font-body text-[12px] text-ds-white-40">Margem min:</span>
        {[0.005, 0.01, 0.02, 0.03].map((m) => (
          <button
            key={m}
            onClick={() => setMinMargin(m)}
            className={clsx(
              'px-2.5 py-1 rounded-full font-body text-[12px] border transition-all duration-200',
              minMargin === m
                ? 'bg-ds-green/20 border-ds-green text-ds-green'
                : 'border-ds-border text-ds-white-40 hover:border-ds-border-2 hover:text-ds-white',
            )}
          >
            {(m * 100).toFixed(1)}%
          </button>
        ))}
      </div>
    </div>
  );
}
