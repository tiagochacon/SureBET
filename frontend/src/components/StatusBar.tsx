'use client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useStore } from '@/store/useStore';
import { clsx } from 'clsx';

export function StatusBar() {
  const { systemStatus, wsConnected, opportunities } = useStore();

  const lastFetch = systemStatus?.lastSuccessfulFetch
    ? format(new Date(systemStatus.lastSuccessfulFetch), "HH:mm:ss", { locale: ptBR })
    : '—';

  return (
    <div className="flex flex-wrap items-center gap-4 px-6 py-3 border-b border-ds-border bg-ds-surface-2/50 backdrop-blur-nav text-[12px] font-body">
      {/* Status de conexão */}
      <div className="flex items-center gap-1.5">
        <span
          className={clsx(
            'w-1.5 h-1.5 rounded-full',
            wsConnected ? 'bg-ds-green animate-pulse' : 'bg-ds-red',
          )}
        />
        <span className={wsConnected ? 'text-ds-green' : 'text-ds-red'}>
          {wsConnected ? 'Conectado' : 'Desconectado'}
        </span>
      </div>

      <span className="text-ds-border-2">·</span>

      {/* Jogos monitorados */}
      <span className="text-ds-white-40">
        <span className="text-ds-white">{systemStatus?.eventsMonitored ?? '—'}</span> jogos monitorados
      </span>

      <span className="text-ds-border-2">·</span>

      {/* Esportes */}
      <span className="text-ds-white-40">
        <span className="text-ds-white">{systemStatus?.sportsMonitored ?? 32}</span> esportes
      </span>

      <span className="text-ds-border-2">·</span>

      {/* Oportunidades ativas */}
      <span className="text-ds-white-40">
        <span className="text-ds-white">{opportunities.length}</span> oportunidades
      </span>

      <span className="text-ds-border-2">·</span>

      {/* Última atualização */}
      <span className="text-ds-white-40">
        Última sync: <span className="text-ds-white">{lastFetch}</span>
      </span>

      {/* Requests restantes */}
      {systemStatus?.apiCallsRemaining !== null && systemStatus?.apiCallsRemaining !== undefined && (
        <>
          <span className="text-ds-border-2">·</span>
          <span className="text-ds-white-40">
            API: <span className="text-ds-white">{systemStatus.apiCallsRemaining}</span> req restantes
          </span>
        </>
      )}
    </div>
  );
}
