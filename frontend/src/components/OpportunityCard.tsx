'use client';
import { formatDistanceToNow, format, differenceInSeconds } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import type { ArbitrageOpportunity } from '@/types';
import { clsx } from 'clsx';
import Link from 'next/link';

interface Props {
  opportunity: ArbitrageOpportunity;
  bankroll?: number;
}

function CountdownBadge({ expiresAt }: { expiresAt: string }) {
  const [seconds, setSeconds] = useState(() =>
    Math.max(0, differenceInSeconds(new Date(expiresAt), new Date())),
  );

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setInterval(() => {
      setSeconds((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [seconds]);

  const pct = Math.min(100, (seconds / 90) * 100);
  const isExpiring = seconds < 20;

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1 rounded-full bg-ds-surface-4 overflow-hidden">
        <div
          className={clsx(
            'h-full rounded-full transition-all duration-1000',
            isExpiring ? 'bg-ds-red' : 'bg-ds-blue',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={clsx(
          'font-body text-[11px] tabular-nums',
          isExpiring ? 'text-ds-red' : 'text-ds-white-40',
        )}
      >
        {seconds}s
      </span>
    </div>
  );
}

export function OpportunityCard({ opportunity: opp, bankroll }: Props) {
  const marginPct = (opp.arbitrageMargin * 100).toFixed(2);
  const isHighMargin = opp.arbitrageMargin >= 0.03;
  const isMediumMargin = opp.arbitrageMargin >= 0.015 && opp.arbitrageMargin < 0.03;
  const isStale = opp.status === 'stale';
  const hasAlert = opp.outcomes.some((o) => o.oddChangedAlert);

  // Ajuste de stakes pelo bankroll atual do usuário
  const ratio = bankroll ? bankroll / opp.bankrollUsed : 1;
  const profit = Math.round(opp.guaranteedProfit * ratio * 100) / 100;

  return (
    <Link
      href={`/opportunity/${opp.id}`}
      className={clsx(
        'block rounded-card border transition-all duration-200 animate-fade-in',
        'hover:-translate-y-0.5 hover:shadow-card-hover hover:border-ds-border-2',
        'bg-ds-surface border-ds-border shadow-card',
        isStale && 'opacity-75',
      )}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0 flex-1">
            <p className="font-body text-ds-white-40 text-[11px] uppercase tracking-widest mb-1">
              {opp.league}
            </p>
            <h3 className="font-heading text-ds-white text-[17px] leading-tight truncate">
              {opp.eventName}
            </h3>
            <p className="font-body text-ds-white-40 text-[13px] mt-0.5">
              {format(new Date(opp.commenceTime), "dd/MM · HH:mm", { locale: ptBR })}
              {' · '}
              <span className="text-ds-white-60">
                em {formatDistanceToNow(new Date(opp.commenceTime), { locale: ptBR })}
              </span>
            </p>
          </div>

          {/* Margem de lucro */}
          <div
            className={clsx(
              'shrink-0 rounded-btn-sm px-2.5 py-1 text-center',
              isHighMargin && 'bg-ds-green/15 text-ds-green',
              isMediumMargin && 'bg-ds-yellow/15 text-ds-yellow',
              !isHighMargin && !isMediumMargin && 'bg-ds-blue/15 text-ds-blue',
            )}
          >
            <p className="font-heading text-[22px] leading-none">+{marginPct}%</p>
            <p className="font-body text-[10px] opacity-70 mt-0.5">margem</p>
          </div>
        </div>

        {/* Mercado + lucro */}
        <div className="flex items-center gap-3 mb-4">
          <span className="inline-flex items-center rounded-full bg-ds-surface-4 border border-ds-border px-2.5 py-1 font-body text-[12px] text-ds-white-60">
            {opp.marketLabel}
          </span>
          <span className="font-body text-[13px] text-ds-white-60">
            Lucro: <span className="text-ds-white font-semibold">R$ {profit.toFixed(2)}</span>
          </span>
          {isStale && (
            <span className="inline-flex items-center gap-1 text-ds-yellow text-[11px]">
              <span>⚠</span> Odds alteradas
            </span>
          )}
        </div>

        {/* Outcomes */}
        <div className="space-y-2">
          {opp.outcomes.map((outcome, i) => {
            const stake = Math.round(outcome.stake * ratio * 100) / 100;
            const ret = Math.round(outcome.expectedReturn * ratio * 100) / 100;
            return (
              <div
                key={i}
                className={clsx(
                  'flex items-center justify-between rounded-btn-sm px-3 py-2',
                  'bg-ds-surface-3 border border-ds-border',
                  outcome.oddChangedAlert && 'border-ds-yellow/30',
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-body text-[13px] text-ds-white truncate">
                    <span className="text-ds-white-40 mr-1.5">{outcome.bookmakerName}</span>
                    {outcome.selection}
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-4 ml-3">
                  <span className="font-heading text-[15px] text-ds-white">{outcome.odd.toFixed(2)}</span>
                  <span className="font-body text-[12px] text-ds-blue">R$ {stake.toFixed(2)}</span>
                  <span className="font-body text-[11px] text-ds-white-40">→ R$ {ret.toFixed(2)}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-ds-border">
          <p className="font-body text-[11px] text-ds-white-40">
            Atualizado {formatDistanceToNow(new Date(opp.detectedAt), { locale: ptBR, addSuffix: true })}
          </p>
          <CountdownBadge expiresAt={opp.expiresAt} />
        </div>
      </div>
    </Link>
  );
}
