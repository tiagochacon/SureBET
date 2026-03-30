'use client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';

export function EmptyState() {
  const { systemStatus } = useStore();
  const [now, setNow] = useState<string | null>(null);

  useEffect(() => {
    setNow(format(new Date(), 'HH:mm:ss', { locale: ptBR }));
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center animate-fade-in">
      {/* Ícone */}
      <div className="w-16 h-16 rounded-full bg-ds-surface-3 border border-ds-border flex items-center justify-center mb-6">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
          <path d="M12 8v4M12 16h.01" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      <h3 className="font-heading text-[22px] text-ds-white mb-2">
        Nenhuma oportunidade no momento
      </h3>
      <p className="font-body text-[15px] text-ds-white-40 max-w-md leading-relaxed">
        Monitorando{' '}
        <span className="text-ds-white">{systemStatus?.eventsMonitored ?? '—'} jogos</span>{' '}
        em{' '}
        <span className="text-ds-white">{systemStatus?.leaguesMonitored ?? '—'} ligas</span>.
        Quando uma oportunidade for detectada, ela aparecerá aqui instantaneamente.
      </p>
      <p className="font-body text-[13px] text-ds-white-40 mt-4">
        Última verificação: <span className="text-ds-white">{now ?? '--:--:--'}</span>
      </p>
    </div>
  );
}
