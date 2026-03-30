import type { Server as SocketIOServer } from 'socket.io';
import type { ArbitrageOpportunity, WsEventType, WsMessage } from '../../types/index.js';
import { logger } from '../../server.js';

export class NotificationService {
  constructor(private readonly io: SocketIOServer) {}

  private emit<T>(event: WsEventType, data: T): void {
    const message: WsMessage<T> = {
      event,
      data,
      timestamp: new Date().toISOString(),
    };
    this.io.emit(event, message);
    logger.debug({ event, dataType: typeof data }, 'WebSocket: evento emitido');
  }

  notifyNewOpportunity(opportunity: ArbitrageOpportunity): void {
    this.emit<ArbitrageOpportunity>('opportunity:new', opportunity);
  }

  notifyUpdatedOpportunity(opportunity: ArbitrageOpportunity): void {
    this.emit<ArbitrageOpportunity>('opportunity:updated', opportunity);
  }

  notifyExpiredOpportunity(id: string): void {
    this.emit<{ id: string }>('opportunity:expired', { id });
  }

  notifyNoOpportunities(monitored: number, leagues: number): void {
    this.emit('system:no_opportunities', {
      message: 'Nenhuma oportunidade de arbitragem no momento',
      eventsMonitored: monitored,
      leaguesMonitored: leagues,
    });
  }

  notifyApiError(message: string): void {
    this.emit('system:api_error', { message });
  }

  notifyStatus(status: object): void {
    this.emit('system:status', status);
  }
}
