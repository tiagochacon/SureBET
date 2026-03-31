'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format, formatDistanceToNow, differenceInSeconds } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useStore } from '@/store/useStore';
import { fetchOpportunityById } from '@/lib/api';
import type { ArbitrageOpportunity } from '@/types';
import { clsx } from 'clsx';

function OddsAgeAlert({ fetchedAt }: { fetchedAt: string }) {
  const [ageSeconds, setAgeSeconds] = useState<number | null>(null);

  useEffect(() => {
    setAgeSeconds(differenceInSeconds(new Date(), new Date(fetchedAt)));
  }, [fetchedAt]);

  if (ageSeconds === null || ageSeconds < 60) return null;

  return (
    <div className="flex items-center gap-2 rounded-btn-sm border border-ds-yellow/30 bg-ds-yellow/10 px-3 py-2 text-[12px]">
      <span className="text-ds-yellow">⚠</span>
      <span className="text-ds-yellow/80">
        Odds com {ageSeconds}s — verifique na casa de apostas antes de apostar
      </span>
    </div>
  );
}

export default function OpportunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { bankroll, opportunities } = useStore();
  const [opp, setOpp] = useState<ArbitrageOpportunity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Tentar store local primeiro
    const local = opportunities.find((o) => o.id === id);
    if (local) { setOpp(local); setLoading(false); return; }

    // Fallback: API
    fetchOpportunityById(id)
      .then(setOpp)
      .catch(() => router.push('/'))
      .finally(() => setLoading(false));
  }, [id, opportunities, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-ds-white-40 border-t-ds-blue rounded-full animate-spin-slow" />
      </div>
    );
  }

  if (!opp) return null;

  const ratio = bankroll / opp.bankrollUsed;
  const profit = Math.round(opp.guaranteedProfit * ratio * 100) / 100;
  const totalStake = Math.round(opp.totalStake * ratio * 100) / 100;
  const isStale = opp.status === 'stale';

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 animate-fade-in">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 font-body text-[13px] text-ds-white-40 hover:text-ds-white transition-colors mb-6"
      >
        ← Voltar
      </button>

      {/* Event header */}
      <div className="rounded-card border border-ds-border bg-ds-surface p-6 mb-4 shadow-card">
        <p className="font-body text-[11px] text-ds-white-40 uppercase tracking-wider mb-2">{opp.league}</p>
        <h1 className="font-heading text-[28px] text-ds-white leading-tight mb-2">{opp.eventName}</h1>
        <p className="font-body text-[14px] text-ds-white-40">
          {format(new Date(opp.commenceTime), "EEEE, dd 'de' MMMM · HH:mm", { locale: ptBR })}
          {' · '}
          <span className="text-ds-white">
            em {formatDistanceToNow(new Date(opp.commenceTime), { locale: ptBR })}
          </span>
        </p>

        {isStale && (
          <div className="mt-3 flex items-center gap-2 text-ds-yellow text-[13px]">
            <span>⚠</span>
            <span>Uma ou mais odds mudaram desde a detecção. Recalcule antes de apostar.</span>
          </div>
        )}
      </div>

      {/* Arbitrage details */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Margem de Arbitragem', value: `+${(opp.arbitrageMargin * 100).toFixed(2)}%`, color: 'text-ds-green' },
          { label: 'Lucro Garantido', value: `R$ ${profit.toFixed(2)}`, color: 'text-ds-white' },
          { label: 'Total a Investir', value: `R$ ${totalStake.toFixed(2)}`, color: 'text-ds-white-60' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-card border border-ds-border bg-ds-surface p-4 text-center shadow-card">
            <p className="font-body text-[11px] text-ds-white-40 mb-1">{stat.label}</p>
            <p className={clsx('font-heading text-[22px]', stat.color)}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Stake breakdown */}
      <div className="rounded-card border border-ds-border bg-ds-surface shadow-card mb-4 overflow-hidden">
        <div className="px-5 py-4 border-b border-ds-border">
          <h2 className="font-heading text-[17px] text-ds-white">Detalhamento das Apostas</h2>
          <p className="font-body text-[13px] text-ds-white-40 mt-0.5">
            Mercado: {opp.marketLabel}
          </p>
        </div>

        <div className="divide-y divide-ds-border">
          {opp.outcomes.map((outcome, i) => {
            const stake = Math.round(outcome.stake * ratio * 100) / 100;
            const ret = Math.round(outcome.expectedReturn * ratio * 100) / 100;
            return (
              <div key={i} className="px-5 py-4">
                <OddsAgeAlert fetchedAt={outcome.oddFetchedAt} />
                <div className="flex items-center justify-between mt-2">
                  <div>
                    <p className="font-heading text-[16px] text-ds-white">{outcome.selection}</p>
                    <p className="font-body text-[13px] text-ds-white-40 mt-0.5">
                      {outcome.bookmakerName} · odd{' '}
                      <span className="text-ds-white font-semibold">{outcome.odd.toFixed(2)}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-heading text-[18px] text-ds-blue">R$ {stake.toFixed(2)}</p>
                    <p className="font-body text-[12px] text-ds-white-40">
                      retorno: <span className="text-ds-white">R$ {ret.toFixed(2)}</span>
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="rounded-card border border-ds-border bg-ds-surface-2 px-5 py-4">
        <p className="font-body text-[12px] text-ds-white-40 leading-relaxed">
          ⚠ <strong className="text-ds-white-60">Atenção:</strong> Verifique as odds diretamente em cada casa de apostas
          antes de realizar qualquer operação. Odds podem mudar a qualquer momento. Este sistema calcula com base
          nos dados mais recentes disponíveis, mas não garante que as odds ainda estejam disponíveis no momento da sua aposta.
        </p>
      </div>
    </div>
  );
}
