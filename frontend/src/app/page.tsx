import { StatusBar } from '@/components/StatusBar';
import { BankrollInput } from '@/components/BankrollInput';
import { OpportunityFeed } from '@/components/OpportunityFeed';
import { SystemErrorBanner } from '@/components/SystemErrorBanner';
import { FilterBar } from '@/components/FilterBar';

export default function DashboardPage() {
  return (
    <>
      <StatusBar />
      <SystemErrorBanner />

      {/* Header */}
      <div className="px-6 pt-8 pb-4 border-b border-ds-border">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
          <div>
            <h1 className="font-heading text-[32px] text-ds-white leading-tight">
              Oportunidades
            </h1>
            <p className="font-body text-[15px] text-ds-white-40 mt-1">
              Arbitragem detectada em tempo real. Odds verificadas e calculadas automaticamente.
            </p>
          </div>
          <div className="shrink-0 w-full sm:w-72">
            <BankrollInput />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="px-6 pt-4 max-w-7xl mx-auto">
        <FilterBar />
      </div>

      {/* Feed */}
      <div className="max-w-7xl mx-auto">
        <OpportunityFeed />
      </div>
    </>
  );
}
