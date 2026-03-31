'use client';
import { useStore } from '@/store/useStore';
import { clsx } from 'clsx';

const SPORTS = [
  { slug: 'football',          label: 'Futebol' },
  { slug: 'basketball',        label: 'Basquete' },
  { slug: 'tennis',            label: 'Tênis' },
  { slug: 'baseball',          label: 'Beisebol' },
  { slug: 'american-football', label: 'Fut. Americano' },
  { slug: 'ice-hockey',        label: 'Hóquei no Gelo' },
  { slug: 'esports',           label: 'E-sports' },
  { slug: 'darts',             label: 'Dardos' },
  { slug: 'mixed-martial-arts',label: 'MMA' },
  { slug: 'boxing',            label: 'Boxe' },
  { slug: 'handball',          label: 'Handebol' },
  { slug: 'volleyball',        label: 'Vôlei' },
  { slug: 'snooker',           label: 'Snooker' },
  { slug: 'table-tennis',      label: 'Tênis de Mesa' },
  { slug: 'rugby',             label: 'Rúgbi' },
  { slug: 'cricket',           label: 'Críquete' },
  { slug: 'futsal',            label: 'Futsal' },
  { slug: 'golf',              label: 'Golfe' },
];

export default function SettingsPage() {
  const { bankroll, setBankroll, minMargin, setMinMargin, sportFilter, setSportFilter } = useStore();

  function handleBankrollChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = parseFloat(e.target.value);
    if (!isNaN(v) && v > 0) setBankroll(v);
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 animate-fade-in">
      <h1 className="font-heading text-[32px] text-ds-white mb-2">Configurações</h1>
      <p className="font-body text-[15px] text-ds-white-40 mb-8">
        Preferências salvas localmente no seu navegador.
      </p>

      <div className="space-y-4">
        {/* Bankroll padrão */}
        <section className="rounded-card border border-ds-border bg-ds-surface p-5 shadow-card">
          <h2 className="font-heading text-[17px] text-ds-white mb-1">Bankroll Padrão</h2>
          <p className="font-body text-[13px] text-ds-white-40 mb-4">
            Valor base para cálculo de stakes. Pode ser alterado no dashboard a qualquer momento.
          </p>
          <div className="flex items-center gap-3">
            <span className="font-body text-[15px] text-ds-white-40">R$</span>
            <input
              type="number"
              min="1"
              step="10"
              defaultValue={bankroll}
              onBlur={handleBankrollChange}
              className={clsx(
                'w-36 bg-ds-surface-4 border border-ds-border rounded-btn-sm px-3 py-2',
                'font-body text-[16px] text-ds-white outline-none',
                'focus:border-ds-blue focus:shadow-glow-blue transition-all duration-200',
              )}
            />
          </div>
        </section>

        {/* Margem mínima */}
        <section className="rounded-card border border-ds-border bg-ds-surface p-5 shadow-card">
          <h2 className="font-heading text-[17px] text-ds-white mb-1">Margem Mínima</h2>
          <p className="font-body text-[13px] text-ds-white-40 mb-4">
            Filtrar oportunidades abaixo desta margem de lucro.
          </p>
          <div className="flex flex-wrap gap-2">
            {[0.005, 0.01, 0.02, 0.03, 0.05].map((m) => (
              <button
                key={m}
                onClick={() => setMinMargin(m)}
                className={clsx(
                  'px-3 py-1.5 rounded-full font-body text-[13px] border transition-all duration-200',
                  minMargin === m
                    ? 'bg-ds-blue/20 border-ds-blue text-ds-blue'
                    : 'border-ds-border text-ds-white-40 hover:border-ds-border-2 hover:text-ds-white',
                )}
              >
                {(m * 100).toFixed(1)}%
              </button>
            ))}
          </div>
        </section>

        {/* Filtro de Esporte */}
        <section className="rounded-card border border-ds-border bg-ds-surface p-5 shadow-card">
          <h2 className="font-heading text-[17px] text-ds-white mb-1">Filtro de Esporte</h2>
          <p className="font-body text-[13px] text-ds-white-40 mb-4">
            Filtrar oportunidades por esporte. A API cobre 32 esportes automaticamente via Bet365 e Betano.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSportFilter('')}
              className={clsx(
                'px-3 py-1.5 rounded-full font-body text-[13px] border transition-all duration-200',
                sportFilter === ''
                  ? 'bg-ds-blue/20 border-ds-blue text-ds-blue'
                  : 'border-ds-border text-ds-white-40 hover:border-ds-border-2 hover:text-ds-white',
              )}
            >
              Todos
            </button>
            {SPORTS.map((s) => (
              <button
                key={s.slug}
                onClick={() => setSportFilter(s.slug)}
                className={clsx(
                  'px-3 py-1.5 rounded-full font-body text-[13px] border transition-all duration-200',
                  sportFilter === s.slug
                    ? 'bg-ds-blue/20 border-ds-blue text-ds-blue'
                    : 'border-ds-border text-ds-white-40 hover:border-ds-border-2 hover:text-ds-white',
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </section>

        {/* Casas de Apostas */}
        <section className="rounded-card border border-ds-border bg-ds-surface p-5 shadow-card">
          <h2 className="font-heading text-[17px] text-ds-white mb-1">Casas de Apostas</h2>
          <p className="font-body text-[13px] text-ds-white-40 mb-4">
            Bookmakers ativos no sistema. Oportunidades são detectadas apenas entre estas duas casas.
          </p>
          <div className="flex flex-wrap gap-3">
            {['Bet365', 'Betano'].map((bm) => (
              <div
                key={bm}
                className="flex items-center gap-2 px-4 py-2 rounded-card border border-ds-green/40 bg-ds-green/5"
              >
                <span className="w-2 h-2 rounded-full bg-ds-green" />
                <span className="font-body text-[14px] text-ds-white">{bm}</span>
                <span className="font-body text-[11px] text-ds-white-40">ativo</span>
              </div>
            ))}
          </div>
          <p className="font-body text-[11px] text-ds-white-40 mt-3">
            API: odds-api.io · Polling: 60s · ~60 req/hora (limite: 100)
          </p>
        </section>

        {/* Disclaimer */}
        <section className="rounded-card border border-ds-border bg-ds-surface-2 p-5">
          <p className="font-body text-[12px] text-ds-white-40 leading-relaxed">
            ⚠ <strong className="text-ds-white-60">Aviso Legal:</strong> Este sistema é uma ferramenta de análise e
            não realiza apostas automaticamente. Nenhum dado financeiro real é processado ou armazenado.
            O bankroll é apenas um número local para cálculo de stakes sugeridas. Sempre verifique as odds
            diretamente nas casas de apostas antes de apostar.
          </p>
        </section>
      </div>
    </div>
  );
}
