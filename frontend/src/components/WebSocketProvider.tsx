'use client';
import { useWebSocket } from '@/hooks/useWebSocket';

/** Provider que inicializa a conexão WebSocket para toda a app */
export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  useWebSocket();
  return <>{children}</>;
}
