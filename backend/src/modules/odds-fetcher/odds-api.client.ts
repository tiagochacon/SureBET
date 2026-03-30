import axios, { type AxiosInstance, type AxiosError } from 'axios';
import axiosRetry from 'axios-retry';
import type { OddsApiEvent } from '../../types/index.js';
import { logger } from '../../server.js';

export class OddsApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly isRateLimit = false,
  ) {
    super(message);
    this.name = 'OddsApiError';
  }
}

export interface OddsApiFetchOptions {
  regions?: string;
  markets?: string;
  oddsFormat?: 'decimal' | 'american';
  dateFormat?: 'iso' | 'unix';
}

export class OddsApiClient {
  private readonly http: AxiosInstance;
  private readonly apiKey: string;
  private remainingRequests: number | null = null;
  private usedRequests: number | null = null;

  constructor() {
    const apiKey = process.env.ODDS_API_KEY;
    if (!apiKey || apiKey === 'your_odds_api_key_here') {
      throw new Error(
        'ODDS_API_KEY não configurada. Configure a variável de ambiente antes de iniciar.',
      );
    }
    this.apiKey = apiKey;

    this.http = axios.create({
      baseURL: process.env.ODDS_API_BASE_URL ?? 'https://api.the-odds-api.com',
      timeout: 15_000,
      headers: { 'Accept': 'application/json' },
    });

    // Retry com backoff exponencial — apenas em erros de rede, nunca em 401/422
    axiosRetry(this.http, {
      retries: 3,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error: AxiosError) => {
        const status = error.response?.status;
        // Não tentar novamente em erros de autenticação ou rate limit
        if (status === 401 || status === 429 || status === 422) return false;
        return axiosRetry.isNetworkOrIdempotentRequestError(error);
      },
      onRetry: (retryCount, error) => {
        logger.warn({ retryCount, url: error.config?.url }, 'Tentando novamente chamada à API de odds');
      },
    });

    // Interceptor para capturar headers de quota
    this.http.interceptors.response.use((response) => {
      const remaining = response.headers['x-requests-remaining'];
      const used = response.headers['x-requests-used'];
      if (remaining) this.remainingRequests = Number(remaining);
      if (used) this.usedRequests = Number(used);
      return response;
    });
  }

  /** Busca odds de uma liga específica */
  async getOddsForLeague(
    leagueSlug: string,
    options: OddsApiFetchOptions = {},
  ): Promise<OddsApiEvent[]> {
    const params = {
      apiKey: this.apiKey,
      regions: options.regions ?? 'eu,us,uk',
      markets: options.markets ?? 'h2h,totals,btts',
      oddsFormat: options.oddsFormat ?? 'decimal',
      dateFormat: options.dateFormat ?? 'iso',
    };

    try {
      logger.debug({ leagueSlug, params: { ...params, apiKey: '[REDACTED]' } }, 'Buscando odds');
      const response = await this.http.get<OddsApiEvent[]>(
        `/v4/sports/${leagueSlug}/odds`,
        { params },
      );
      return response.data;
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      const status = axiosErr.response?.status;
      const msg = axiosErr.response?.data?.message ?? axiosErr.message;

      if (status === 401) {
        throw new OddsApiError('API Key inválida ou expirada', 401);
      }
      if (status === 429) {
        throw new OddsApiError('Rate limit da The Odds API atingido', 429, true);
      }
      if (status === 422) {
        throw new OddsApiError(`Liga não encontrada ou inválida: ${leagueSlug}`, 422);
      }

      throw new OddsApiError(
        `Erro ao buscar odds para ${leagueSlug}: ${msg}`,
        status,
      );
    }
  }

  get remainingApiRequests(): number | null {
    return this.remainingRequests;
  }

  get usedApiRequests(): number | null {
    return this.usedRequests;
  }
}
