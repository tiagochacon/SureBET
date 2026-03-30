'use client';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { fetchHistory } from '@/lib/api';
import { clsx } from 'clsx';

interface HistoryRow {
  id: string;
  event_name: string;
  league: string;
  market_type: string;
  arbitrage_margin: number;
  status: string;
  detected_at: string;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory()
      .then((data) => setHistory(data.history as HistoryRow[]))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalMargin = history.reduce((s, r) => s + r.arbitrage_margin, 0);
  const avgMargin = history.length > 0 ? totalMargin / history.length : 0;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 animate-fade-in">
      <h1 className="font-heading text-[32px] text-ds-white mb-2">Histórico</h1>
      <p className="font-body text-[15px] text-ds-white-40 mb-8">
        Oportunidades detectadas nas últimas 24 horas.
      </p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: 'Total detectadas', value: history.length },
          { label: 'Margem média', value: `${(avgMargin * 100).toFixed(2)}%` },
          { label: 'Status ativo', value: history.filter((r) => r.status === 'active').length },
        ].map((s) => (
          <div key={s.label} className="rounded-card border border-ds-border bg-ds-surface p-4 text-center shadow-card">
            <p className="font-body text-[11px] text-ds-white-40 mb-1">{s.label}</p>
            <p className="font-heading text-[26px] text-ds-white">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-ds-white-40 border-t-ds-blue rounded-full animate-spin-slow" />
        </div>
      ) : (
        <div className="rounded-card border border-ds-border bg-ds-surface shadow-card overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-ds-border">
                {['Evento', 'Liga', 'Mercado', 'Margem', 'Status', 'Detectado em'].map((h) => (
                  <th key={h} className="px-4 py-3 font-body text-[11px] uppercase tracking-wider text-ds-white-40">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ds-border">
              {history.map((row) => (
                <tr key={row.id} className="hover:bg-ds-surface-3 transition-colors">
                  <td className="px-4 py-3 font-body text-[13px] text-ds-white truncate max-w-[200px]">
                    {row.event_name}
                  </td>
                  <td className="px-4 py-3 font-body text-[13px] text-ds-white-40">{row.league}</td>
                  <td className="px-4 py-3 font-body text-[13px] text-ds-white-40">
                    {row.market_type.toUpperCase()}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-heading text-[14px] text-ds-green">
                      +{(row.arbitrage_margin * 100).toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={clsx(
                        'inline-block px-2 py-0.5 rounded-full text-[11px] font-body',
                        row.status === 'active' ? 'bg-ds-green/15 text-ds-green' :
                        row.status === 'expired' ? 'bg-ds-white-10 text-ds-white-40' :
                        'bg-ds-yellow/15 text-ds-yellow',
                      )}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-body text-[13px] text-ds-white-40">
                    {format(new Date(row.detected_at), 'dd/MM HH:mm', { locale: ptBR })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {history.length === 0 && (
            <div className="py-12 text-center font-body text-[14px] text-ds-white-40">
              Nenhuma oportunidade registrada nas últimas 24 horas.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
