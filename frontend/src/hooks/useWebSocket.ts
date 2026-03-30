'use client';
import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useStore } from '@/store/useStore';
import type { ArbitrageOpportunity, WsMessage, SystemStatus } from '@/types';

export function useWebSocket(): void {
  const socketRef = useRef<Socket | null>(null);
  const {
    addOpportunity, updateOpportunity, removeOpportunity,
    setSystemStatus, setApiError, setWsConnected,
  } = useStore();

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3001';

    const socket = io(wsUrl, {
      path: '/ws',
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 10,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setWsConnected(true);
      setApiError(null);
    });

    socket.on('disconnect', () => {
      setWsConnected(false);
    });

    socket.on('connect_error', () => {
      setWsConnected(false);
    });

    socket.on('opportunity:new', (msg: WsMessage<ArbitrageOpportunity>) => {
      addOpportunity(msg.data);
    });

    socket.on('opportunity:updated', (msg: WsMessage<ArbitrageOpportunity>) => {
      updateOpportunity(msg.data);
    });

    socket.on('opportunity:expired', (msg: WsMessage<{ id: string }>) => {
      removeOpportunity(msg.data.id);
    });

    socket.on('system:no_opportunities', () => {
      // Estado já gerenciado via store — oportunidades serão []
    });

    socket.on('system:api_error', (msg: WsMessage<{ message: string }>) => {
      setApiError(msg.data.message);
    });

    socket.on('system:status', (msg: WsMessage<SystemStatus>) => {
      setSystemStatus(msg.data);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [addOpportunity, updateOpportunity, removeOpportunity, setSystemStatus, setApiError, setWsConnected]);
}
