'use client';
import { useStore } from '@/store/useStore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function SystemErrorBanner() {
  const { apiError, systemStatus, setApiError } = useStore();

  if (!apiError) return null;

  const lastFetch = systemStatus?.lastSuccessfulFetch
    ? format(new Date(systemStatus.lastSuccessfulFetch), "'às' HH:mm:ss", { locale: ptBR })
    : 'desconhecido';

  return (
    <div className="mx-6 mt-4 flex items-start gap-3 rounded-card border border-ds-red/30 bg-ds-red/10 px-4 py-3 animate-fade-in">
      <svg className="shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          stroke="#ff0022" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        />
      </svg>
      <div className="flex-1 min-w-0">
        <p className="font-body text-[13px] text-ds-red font-medium">Falha na API de odds</p>
        <p className="font-body text-[12px] text-ds-white-40 mt-0.5">
          {apiError}. Última sync bem-sucedida {lastFetch}. Não exibindo oportunidades desatualizadas.
        </p>
      </div>
      <button
        onClick={() => setApiError(null)}
        className="shrink-0 text-ds-white-40 hover:text-ds-white transition-colors text-[18px] leading-none"
        aria-label="Fechar"
      >
        ×
      </button>
    </div>
  );
}
