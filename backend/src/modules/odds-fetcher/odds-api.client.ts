import axios, { type AxiosInstance, type AxiosError } from 'axios';
import axiosRetry from 'axios-retry';
import type {
  OddsApiV3ArbitrageOpportunity,
  OddsApiV3Event,
} from '../../types/index.js';
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

export class OddsApiClient {
  private readonly http: AxiosInstance;
  private readonly apiKey: string;
  private remainingRequests: number | null = null;

  constructor() {
    const apiKey = process.env.ODDS_API_KEY;
    if (!apiKey || apiKey === 'your_odds_api_key_here') {
      throw new Error(
        'ODDS_API_KEY não configurada. Configure a variável de ambiente antes de iniciar.',
      );
    }
    this.apiKey = apiKey;

    this.http = axios.create({
      baseURL: process.env.ODDS_API_BASE_URL ?? 'https://api.odds-api.io/v3',
      timeout: 15_000,
      headers: { Accept: 'application/json' },
    });

    // Retry com backoff exponencial — nunca em 401/403/429
    axiosRetry(this.http, {
      retries: 3,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error: AxiosError) => {
        const status = error.response?.status;
        if (status === 401 || status === 403 || status === 429) return false;
        return axiosRetry.isNetworkOrIdempotentRequestError(error);
      },
      onRetry: (retryCount, error) => {
        logger.warn(
          { retryCount, url: error.config?.url },
          'Tentando novamente chamada à odds-api.io',
        );
      },
    });

    // Capturar headers de rate limit se disponíveis
    this.http.interceptors.response.use((response) => {
      const remaining =
        response.headers['x-ratelimit-remaining'] ??
        response.headers['x-requests-remaining'];
      if (remaining !== undefined) {
        this.remainingRequests = Number(remaining);
      }
      return response;
    });
  }

  /**
   * MÉTODO PRINCIPAL — retorna todas as oportunidades de arbitragem entre
   * os bookmakers selecionados em TODOS os esportes e TODOS os mercados.
   * 1 único request cobre toda a cobertura disponível.
   */
  async getArbitrageBets(
    bookmakers: string[],
    limit = 500,
  ): Promise<OddsApiV3ArbitrageOpportunity[]> {
    const params = {
      apiKey: this.apiKey,
      bookmakers: bookmakers.join(','),
      limit,
      includeEventDetails: true,
    };

    try {
      logger.debug(
        { bookmakers, limit },
        'Buscando oportunidades de arbitragem via /arbitrage-bets',
      );

      const response = await this.http.get<OddsApiV3ArbitrageOpportunity[]>(
        '/arbitrage-bets',
        { params },
      );

      logger.info(
        { count: response.data.length },
        'Oportunidades de arbitragem recebidas da API',
      );

      return response.data;
    } catch (err) {
      throw this.handleError(err, '/arbitrage-bets');
    }
  }

  /**
   * Busca eventos de um esporte específico.
   * Uso secundário — o /arbitrage-bets já cobre todos os esportes.
   */
  async getEvents(sport: string): Promise<OddsApiV3Event[]> {
    try {
      const response = await this.http.get<OddsApiV3Event[]>('/events', {
        params: { sport, apiKey: this.apiKey },
      });
      return response.data;
    } catch (err) {
      throw this.handleError(err, `/events?sport=${sport}`);
    }
  }

  /**
   * Busca odds de até 10 eventos em 1 único request.
   * Eficiente para monitoramento de eventos específicos.
   */
  async getOddsMulti(
    eventIds: number[],
    bookmakers: string[],
  ): Promise<OddsApiV3Event[]> {
    try {
      const response = await this.http.get<OddsApiV3Event[]>('/odds/multi', {
        params: {
          eventIds: eventIds.join(','),
          bookmakers: bookmakers.join(','),
          apiKey: this.apiKey,
        },
      });
      return response.data;
    } catch (err) {
      throw this.handleError(err, '/odds/multi');
    }
  }

  /**
   * Lista todos os esportes disponíveis na API.
   * Este endpoint não requer autenticação.
   */
  async getSports(): Promise<{ name: string; slug: string }[]> {
    try {
      const response = await this.http.get<{ name: string; slug: string }[]>(
        '/sports',
      );
      return response.data;
    } catch (err) {
      throw this.handleError(err, '/sports');
    }
  }

  private handleError(err: unknown, endpoint: string): OddsApiError {
    const axiosErr = err as AxiosError<{ error?: string }>;
    const status = axiosErr.response?.status;
    const msg = axiosErr.response?.data?.error ?? axiosErr.message;

    if (status === 401 || status === 403) {
      return new OddsApiError(
        `API Key inválida ou sem permissão (${endpoint})`,
        status,
      );
    }
    if (status === 429) {
      return new OddsApiError(
        `Rate limit da odds-api.io atingido (100 req/hora). Aguardando próximo ciclo.`,
        429,
        true,
      );
    }
    if (status !== undefined && status >= 500) {
      return new OddsApiError(
        `Erro interno da odds-api.io (${status}) em ${endpoint}`,
        status,
      );
    }

    return new OddsApiError(
      `Erro ao chamar ${endpoint}: ${msg}`,
      status,
    );
  }

  get remainingApiRequests(): number | null {
    return this.remainingRequests;
  }
}
