import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import pino from 'pino';

// Logger estruturado — nunca usar console.log em produção
export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  transport:
    process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
});

async function bootstrap(): Promise<void> {
  // Importações lazy para garantir que logger está disponível
  const { OddsFetcherService } = await import('./modules/odds-fetcher/odds-fetcher.service.js');
  const { OpportunityStore } = await import('./modules/opportunity-store/opportunity-store.js');
  const { NotificationService } = await import('./modules/notification/notification.service.js');
  const { opportunitiesRoutes } = await import('./api/routes/opportunities.js');
  const { calculatorRoutes } = await import('./api/routes/calculator.js');
  const { statusRoutes } = await import('./api/routes/status.js');

  const PORT = Number(process.env.PORT ?? 3001);

  // HTTP server nativo para Socket.io + Fastify coexistirem
  const httpServer = createServer();

  const fastify = Fastify({
    logger: false,
    serverFactory: (handler) => {
      httpServer.on('request', handler);
      return httpServer;
    },
  });

  // CORS
  await fastify.register(cors, {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  });

  // Rate limiting
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // Socket.io
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
    path: '/ws',
  });

  io.on('connection', (socket) => {
    logger.info({ socketId: socket.id }, 'Cliente WebSocket conectado');
    socket.on('disconnect', () => {
      logger.info({ socketId: socket.id }, 'Cliente WebSocket desconectado');
    });
  });

  // Instanciar módulos
  // Nota: ArbitrageDetector não é mais necessário no pipeline principal —
  // a odds-api.io já detecta arbitragem nativamente via /arbitrage-bets.
  const fetcher = new OddsFetcherService();
  const store = new OpportunityStore();
  const notifier = new NotificationService(io);

  // Pipeline: OddsFetcher (/arbitrage-bets) → OpportunityStore → NotificationService
  // As oportunidades chegam já detectadas e prontas pela API.
  fetcher.onArbitrageReady(async (opportunities) => {
    // Limpar expiradas
    const expiredIds = store.cleanExpired();
    expiredIds.forEach((id) => notifier.notifyExpiredOpportunity(id));

    if (opportunities.length === 0) {
      notifier.notifyNoOpportunities(0, 0);
      return;
    }

    for (const opp of opportunities) {
      const result = await store.upsert(opp);
      if (result === 'new') notifier.notifyNewOpportunity(opp);
      else if (result === 'updated') notifier.notifyUpdatedOpportunity(opp);
      else if (result === 'invalidated') notifier.notifyExpiredOpportunity(opp.id);
    }

    // Emitir status a cada ciclo
    notifier.notifyStatus(fetcher.status);
  });

  fetcher.onError((err) => {
    notifier.notifyApiError(err.message);
  });

  // Registrar rotas com prefixo /api/v1
  await fastify.register(
    async (app) => {
      await app.register(opportunitiesRoutes, { store });
      await app.register(calculatorRoutes);
      await app.register(statusRoutes, { fetcher, store });
    },
    { prefix: '/api/v1' },
  );

  // Health check
  fastify.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  // Iniciar polling de odds
  fetcher.start();

  // Limpeza periódica de oportunidades expiradas (a cada 30s)
  setInterval(() => {
    const expiredIds = store.cleanExpired();
    expiredIds.forEach((id) => notifier.notifyExpiredOpportunity(id));
  }, 30_000);

  // Iniciar servidor
  await fastify.listen({ port: PORT, host: '0.0.0.0' });
  logger.info({ port: PORT }, `SureBet backend iniciado`);

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'Encerrando servidor...');
    fetcher.stop();
    await fastify.close();
    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error({ err }, 'Falha ao iniciar servidor');
  process.exit(1);
});
