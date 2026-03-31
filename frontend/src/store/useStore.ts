'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ArbitrageOpportunity, SystemStatus } from '@/types';

interface SureBetStore {
  // Bankroll
  bankroll: number;
  setBankroll: (value: number) => void;

  // Oportunidades ativas
  opportunities: ArbitrageOpportunity[];
  setOpportunities: (opps: ArbitrageOpportunity[]) => void;
  addOpportunity: (opp: ArbitrageOpportunity) => void;
  updateOpportunity: (opp: ArbitrageOpportunity) => void;
  removeOpportunity: (id: string) => void;

  // Status do sistema
  systemStatus: SystemStatus | null;
  setSystemStatus: (status: SystemStatus) => void;
  apiError: string | null;
  setApiError: (msg: string | null) => void;

  // Filtros
  minMargin: number;
  setMinMargin: (v: number) => void;
  marketFilter: string;
  setMarketFilter: (v: string) => void;
  sportFilter: string;
  setSportFilter: (v: string) => void;

  // UI
  wsConnected: boolean;
  setWsConnected: (v: boolean) => void;
}

export const useStore = create<SureBetStore>()(
  persist(
    (set) => ({
      bankroll: 100,
      setBankroll: (value) => set({ bankroll: value }),

      opportunities: [],
      setOpportunities: (opps) => set({ opportunities: opps }),
      addOpportunity: (opp) =>
        set((state) => ({
          opportunities: [opp, ...state.opportunities.filter((o) => o.id !== opp.id)],
        })),
      updateOpportunity: (opp) =>
        set((state) => ({
          opportunities: state.opportunities.map((o) => (o.id === opp.id ? opp : o)),
        })),
      removeOpportunity: (id) =>
        set((state) => ({
          opportunities: state.opportunities.filter((o) => o.id !== id),
        })),

      systemStatus: null,
      setSystemStatus: (status) => set({ systemStatus: status }),
      apiError: null,
      setApiError: (msg) => set({ apiError: msg }),

      minMargin: 0.01,
      setMinMargin: (v) => set({ minMargin: v }),
      marketFilter: '',
      setMarketFilter: (v) => set({ marketFilter: v }),
      sportFilter: '',
      setSportFilter: (v) => set({ sportFilter: v }),

      wsConnected: false,
      setWsConnected: (v) => set({ wsConnected: v }),
    }),
    {
      name: 'surebet-storage',
      partialize: (state) => ({
        bankroll: state.bankroll,
        minMargin: state.minMargin,
        marketFilter: state.marketFilter,
        sportFilter: state.sportFilter,
      }),
    },
  ),
);
