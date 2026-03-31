import { OddsApiClient, OddsApiError } from './odds-api.client.js';
import { getBookmakerConfig, APPROVED_SLUGS } from '../../config/bookmakers.js';
import { MONITORED_LEAGUES, getLeagueLabel } from '../../config/leagues.js';
import { setWithTTL, getFromCache, ODDS_CACHE_TTL } from '../../cache/redis.js';
import { query } from '../../db/postgres.js';
import type {
  OddsApiEvent,
  SportEvent,
  BookmakerOdd,
  MarketType,
} from '../../types/index.js';
import { logger } from '../../server.js';

const CIRCUIT_BREAKER_THRESHOLD = 3;

export class OddsFetcherService {
  private readonly client: OddsApiClient;
  private consecutiveErrors = 0;
  private circuitOpen = false;
  private lastSuccessfulFetch: Date | null = null;
  private nextScheduledFetch: Date | null = null;
  private eventsCount = 0;
  private cronJob: ReturnType<typeof setTimeout> | null = null;

  // Callbacks para notificar quando novos dados chegam
  private onNewDataCallbacks: Array<(events: SportEvent[]) => void> = [];
  private onErrorCallbacks: Array<(error: OddsApiError) => void> = [];

  constructor() {
    this.client = new OddsApiClient();
  }

  onNewData(callback: (events: SportEvent[]) => void): void {
    this.onNewDataCallbacks.push(callback);
  }

  onError(callback: (error: OddsApiError) => void): void {
    this.onErrorCallbacks.push(callback);
  }

  /** Inicia o polling agendado */
  start(): void {
    const intervalSeconds = Number(process.env.POLLING_INTERVAL_SECONDS ?? 86400);

    logger.info({ intervalSeconds }, 'OddsFetcherService iniciado');

    // Fetch imediato ao iniciar
    void this.fetchAll();

    // Agendar próximos fetches via setTimeout recursivo
    // (mais flexível que cron para intervalos longos como 24h)
    const scheduleNext = (): void => {
      this.cronJob = setTimeout(async () => {
        await this.fetchAll();
        scheduleNext();
      }, intervalSeconds * 1000) as unknown as cron.ScheduledTask;
    };

    scheduleNext();
  }

  stop(): void {
    if (this.cronJob !== null) clearTimeout(this.cronJob);
    logger.info('OddsFetcherService parado');
  }

  /** Busca todas as ligas configuradas */
  async fetchAll(): Promise<SportEvent[]> {
    if (this.circuitOpen) {
      logger.warn('Circuit breaker aberto — pulando fetch de odds');
      return [];
    }

    this.nextScheduledFetch = new Date(Date.now() + Number(process.env.POLLING_INTERVAL_SECONDS ?? 86400) * 1000);

    const allEvents: SportEvent[] = [];
    let hasError = false;

    for (const leagueSlug of MONITORED_LEAGUES) {
      try {
        const events = await this.fetchLeague(leagueSlug);
        allEvents.push(...events);
      } catch (err) {
        hasError = true;
        if (err instanceof OddsApiError) {
          this.handleApiError(err);
          this.onErrorCallbacks.forEach((cb) => cb(err));
        }
        // Continua tentando outras ligas mesmo que uma falhe
      }
    }

    if (!hasError) {
      this.consecutiveErrors = 0;
      this.circuitOpen = false;
      this.lastSuccessfulFetch = new Date();
      this.eventsCount = allEvents.length;
      logger.info({ eventsCount: allEvents.length }, 'Fetch de odds completo');
      this.onNewDataCallbacks.forEach((cb) => cb(allEvents));
    }

    return allEvents;
  }

  /** Busca e normaliza odds de uma liga */
  private async fetchLeague(leagueSlug: string): Promise<SportEvent[]> {
    const cacheKey = `odds:league:${leagueSlug}`;

    // Cache hit — dados ainda válidos
    const cached = await getFromCache<SportEvent[]>(cacheKey);
    if (cached) {
      logger.debug({ leagueSlug }, 'Odds servidas do cache Redis');
      return cached;
    }

    const rawEvents = await this.client.getOddsForLeague(leagueSlug, {
      regions: process.env.ODDS_API_REGIONS ?? 'eu,uk',
    });
    const normalized = rawEvents.map((e) => this.normalizeEvent(e, leagueSlug));

    // Persistir snapshots para auditoria
    await this.persistSnapshots(normalized);

    // Cache com TTL
    await setWithTTL(cacheKey, normalized, ODDS_CACHE_TTL);

    return normalized;
  }

  /** Converte formato da The Odds API para formato interno */
  private normalizeEvent(raw: OddsApiEvent, leagueSlug: string): SportEvent {
    const bookmakerOdds: BookmakerOdd[] = [];
    const fetchedAt = new Date();

    for (const bm of raw.bookmakers) {
      // Ignorar bookmakers não aprovados
      if (!APPROVED_SLUGS.has(bm.key)) continue;

      const config = getBookmakerConfig(bm.key);
      if (!config) continue;

      for (const market of bm.markets) {
        const marketType = this.mapMarketType(market.key);
        if (!marketType) continue;

        for (const outcome of market.outcomes) {
          if (outcome.price <= 1) continue; // odd inválida

          const outcomeKey = this.buildOutcomeKey(market.key, outcome.name, outcome.point);

          bookmakerOdds.push({
            bookmaker: bm.key,
            bookmakerName: config.name,
            reliability: config.reliability,
            market: marketType,
            outcome: outcomeKey,
            odd: outcome.price,
            fetchedAt,
          });
        }
      }
    }

    return {
      id: raw.id,
      sport: raw.sport_key,
      league: getLeagueLabel(leagueSlug),
      homeTeam: raw.home_team,
      awayTeam: raw.away_team,
      commenceTime: new Date(raw.commence_time),
      bookmakerOdds,
      fetchedAt,
    };
  }

  private mapMarketType(key: string): MarketType | null {
    const map: Record<string, MarketType> = {
      h2h: 'h2h',
      totals: 'totals',
      btts: 'btts',
      double_chance: 'double_chance',
    };
    return map[key] ?? null;
  }

  private buildOutcomeKey(market: string, name: string, point?: number): string {
    if (market === 'totals' && point !== undefined) {
      return `${name.toLowerCase()}_${point}`; // ex: 'over_2.5'
    }
    return name.toLowerCase().replace(/\s+/g, '_'); // ex: 'home', 'draw'
  }

  private handleApiError(err: OddsApiError): void {
    this.consecutiveErrors++;
    logger.error({ consecutiveErrors: this.consecutiveErrors, err: err.message }, 'Erro ao buscar odds');

    if (this.consecutiveErrors >= CIRCUIT_BREAKER_THRESHOLD) {
      this.circuitOpen = true;
      logger.error('Circuit breaker ABERTO — muitos erros consecutivos na API de odds. Parando polling.');
    }

    // Log no banco para monitoramento
    void query(
      `INSERT INTO api_error_logs (api_name, error_code, error_msg) VALUES ($1, $2, $3)`,
      ['the_odds_api', String(err.statusCode ?? 'unknown'), err.message],
    ).catch(() => {/* não deixar erro de log quebrar o fluxo */});
  }

  /** Persiste snapshots de odds no PostgreSQL para auditoria */
  private async persistSnapshots(events: SportEvent[]): Promise<void> {
    const values: unknown[] = [];
    const placeholders: string[] = [];
    let idx = 1;

    for (const event of events) {
      for (const odd of event.bookmakerOdds) {
        placeholders.push(`($${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++})`);
        values.push(event.id, odd.bookmaker, odd.market, odd.outcome, odd.odd, odd.fetchedAt);
      }
    }

    if (values.length === 0) return;

    await query(
      `INSERT INTO odds_snapshots (event_id, bookmaker, market, outcome, odd_value, fetched_at)
       VALUES ${placeholders.join(', ')}`,
      values,
    ).catch((err) => logger.error({ err }, 'Falha ao persistir snapshots'));
  }

  get status() {
    return {
      healthy: !this.circuitOpen && this.consecutiveErrors < CIRCUIT_BREAKER_THRESHOLD,
      lastSuccessfulFetch: this.lastSuccessfulFetch,
      nextScheduledFetch: this.nextScheduledFetch,
      eventsMonitored: this.eventsCount,
      leaguesMonitored: MONITORED_LEAGUES.length,
      consecutiveErrors: this.consecutiveErrors,
      apiCallsRemaining: this.client.remainingApiRequests,
    };
  }
}
