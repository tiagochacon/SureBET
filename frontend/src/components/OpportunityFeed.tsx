'use client';
import { useStore } from '@/store/useStore';
import { OpportunityCard } from './OpportunityCard';
import { EmptyState } from './EmptyState';

export function OpportunityFeed() {
  const { opportunities, bankroll, minMargin, marketFilter, leagueFilter } = useStore();

  const filtered = opportunities
    .filter((o) => o.status === 'active' || o.status === 'stale')
    .filter((o) => o.arbitrageMargin >= minMargin)
    .filter((o) => !marketFilter || o.marketType === marketFilter)
    .filter((o) => !leagueFilter || o.league.toLowerCase().includes(leagueFilter.toLowerCase()));

  if (filtered.length === 0) return <EmptyState />;

  return (
    <div className="grid gap-4 p-6 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
      {filtered.map((opp) => (
        <OpportunityCard key={opp.id} opportunity={opp} bankroll={bankroll} />
      ))}
    </div>
  );
}
