import type { ArbitrageOpportunity, OpportunityStatus } from '../../types/index.js';
import { query } from '../../db/postgres.js';
import { logger } from '../../server.js';

const STALE_ODD_CHANGE_THRESHOLD = 0.03; // 3%

export class OpportunityStore {
  private readonly store = new Map<string, ArbitrageOpportunity>();

  /** Adiciona ou atualiza uma oportunidade */
  async upsert(opportunity: ArbitrageOpportunity): Promise<'new' | 'updated' | 'invalidated'> {
    const existing = this.store.get(opportunity.id);

    if (!existing) {
      this.store.set(opportunity.id, opportunity);
      await this.persistToDB(opportunity);
      return 'new';
    }

    // Verificar se alguma odd mudou significativamente
    const hasSignificantChange = this.detectSignificantOddChange(existing, opportunity);
    if (hasSignificantChange) {
      opportunity.status = 'stale';
      opportunity.outcomes = opportunity.outcomes.map((o) => ({
        ...o,
        oddChangedAlert: true,
      }));
    }

    // Se a margem caiu para <= 0, invalidar imediatamente
    if (opportunity.arbitrageMargin <= 0) {
      opportunity.status = 'invalidated';
      this.store.set(opportunity.id, opportunity);
      await this.updateStatusInDB(opportunity.id, 'invalidated');
      return 'invalidated';
    }

    this.store.set(opportunity.id, opportunity);
    return 'updated';
  }

  /** Remove oportunidades expiradas do store em memória */
  cleanExpired(): string[] {
    const now = Date.now();
    const expiredIds: string[] = [];

    for (const [id, opp] of this.store.entries()) {
      if (opp.expiresAt.getTime() < now || opp.status === 'expired') {
        expiredIds.push(id);
        this.store.delete(id);
        void this.updateStatusInDB(id, 'expired');
      }
    }

    if (expiredIds.length > 0) {
      logger.info({ count: expiredIds.length }, 'Oportunidades expiradas removidas');
    }

    return expiredIds;
  }

  getAll(): ArbitrageOpportunity[] {
    return Array.from(this.store.values())
      .filter((o) => o.status === 'active' || o.status === 'stale')
      .sort((a, b) => b.arbitrageMargin - a.arbitrageMargin);
  }

  getById(id: string): ArbitrageOpportunity | undefined {
    return this.store.get(id);
  }

  get size(): number {
    return this.store.size;
  }

  private detectSignificantOddChange(
    existing: ArbitrageOpportunity,
    updated: ArbitrageOpportunity,
  ): boolean {
    for (const newOutcome of updated.outcomes) {
      const oldOutcome = existing.outcomes.find(
        (o) => o.bookmaker === newOutcome.bookmaker && o.selection === newOutcome.selection,
      );
      if (!oldOutcome) continue;

      const change = Math.abs(newOutcome.odd - oldOutcome.odd) / oldOutcome.odd;
      if (change > STALE_ODD_CHANGE_THRESHOLD) return true;
    }
    return false;
  }

  private async persistToDB(opp: ArbitrageOpportunity): Promise<void> {
    await query(
      `INSERT INTO opportunities
        (id, event_id, event_name, league, commence_time, market_type,
         arbitrage_margin, bankroll_used, outcomes, status, detected_at, expired_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11,$12)
       ON CONFLICT (id) DO NOTHING`,
      [
        opp.id, opp.eventId, opp.eventName, opp.league, opp.commenceTime,
        opp.marketType, opp.arbitrageMargin, opp.bankrollUsed,
        JSON.stringify(opp.outcomes), opp.status, opp.detectedAt, opp.expiresAt,
      ],
    ).catch((err) => logger.error({ err }, 'Falha ao persistir oportunidade'));
  }

  private async updateStatusInDB(id: string, status: OpportunityStatus): Promise<void> {
    await query(
      `UPDATE opportunities SET status = $1, updated_at = NOW(), expired_at = NOW()
       WHERE id = $2`,
      [status, id],
    ).catch((err) => logger.error({ err }, 'Falha ao atualizar status da oportunidade'));
  }
}
