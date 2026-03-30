'use client';
import { useStore } from '@/store/useStore';
import { clsx } from 'clsx';

const LEAGUES = [
  { slug: 'soccer_brazil_campeonato', label: 'Brasileirão Série A' },
  { slug: 'soccer_epl', label: 'Premier League' },
  { slug: 'soccer_spain_la_liga', label: 'La Liga' },
  { slug: 'soccer_germany_bundesliga', label: 'Bundesliga' },
  { slug: 'soccer_italy_serie_a', label: 'Serie A' },
  { slug: 'soccer_france_ligue_one', label: 'Ligue 1' },
  { slug: 'soccer_uefa_champs_league', label: 'Champions League' },
  { slug: 'soccer_conmebol_libertadores', label: 'Copa Libertadores' },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={clsx(
        'relative w-10 h-5 rounded-full transition-colors duration-200',
        checked ? 'bg-ds-blue' : 'bg-ds-surface-4 border border-ds-border',
      )}
    >
      <span
        className={clsx(
          'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200',
          checked ? 'translate-x-5' : 'translate-x-0',
        )}
      />
    </button>
  );
}

export default function SettingsPage() {
  const { bankroll, setBankroll, minMargin, setMinMargin, leagueFilter, setLeagueFilter } = useStore();

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

        {/* Ligas */}
        <section className="rounded-card border border-ds-border bg-ds-surface p-5 shadow-card">
          <h2 className="font-heading text-[17px] text-ds-white mb-1">Filtro de Liga</h2>
          <p className="font-body text-[13px] text-ds-white-40 mb-4">
            Filtrar oportunidades por liga específica. Deixe em branco para ver todas.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setLeagueFilter('')}
              className={clsx(
                'px-3 py-1.5 rounded-full font-body text-[13px] border transition-all duration-200',
                leagueFilter === ''
                  ? 'bg-ds-blue/20 border-ds-blue text-ds-blue'
                  : 'border-ds-border text-ds-white-40 hover:border-ds-border-2 hover:text-ds-white',
              )}
            >
              Todas
            </button>
            {LEAGUES.map((l) => (
              <button
                key={l.slug}
                onClick={() => setLeagueFilter(l.label)}
                className={clsx(
                  'px-3 py-1.5 rounded-full font-body text-[13px] border transition-all duration-200',
                  leagueFilter === l.label
                    ? 'bg-ds-blue/20 border-ds-blue text-ds-blue'
                    : 'border-ds-border text-ds-white-40 hover:border-ds-border-2 hover:text-ds-white',
                )}
              >
                {l.label}
              </button>
            ))}
          </div>
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
