import axios from 'axios';
import type { ArbitrageOpportunity, SystemStatus, BookmakerConfig } from '@/types';

const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/api/v1`,
  timeout: 10_000,
});

export interface OpportunitiesResponse {
  count: number;
  opportunities: ArbitrageOpportunity[];
  meta: { timestamp: string; hasOpportunities: boolean };
}

export async function fetchOpportunities(params?: {
  bankroll?: number;
  min_margin?: number;
  market?: string;
  league?: string;
}): Promise<OpportunitiesResponse> {
  const { data } = await api.get<OpportunitiesResponse>('/opportunities', { params });
  return data;
}

export async function fetchOpportunityById(id: string): Promise<ArbitrageOpportunity> {
  const { data } = await api.get<ArbitrageOpportunity>(`/opportunities/${id}`);
  return data;
}

export async function fetchHistory(): Promise<{ count: number; history: unknown[] }> {
  const { data } = await api.get('/opportunities/history');
  return data;
}

export async function fetchSystemStatus(): Promise<SystemStatus> {
  const { data } = await api.get<SystemStatus>('/status');
  return data;
}

export async function fetchBookmakers(): Promise<{ bookmakers: BookmakerConfig[]; total: number }> {
  const { data } = await api.get('/bookmakers');
  return data;
}

export interface CalculatorPayload {
  bankroll: number;
  outcomes: { bookmaker: string; odd: number; selection: string }[];
}

export interface CalculatorResult {
  valid: boolean;
  arbitrageMargin: number;
  roi: string;
  bankroll: number;
  totalStake: number;
  guaranteedProfit: number;
  stakes: Array<{
    bookmaker: string;
    outcome: string;
    odd: number;
    stake: number;
    expectedReturn: number;
    selection: string;
  }>;
  disclaimer: string;
}

export async function calculateArbitrage(payload: CalculatorPayload): Promise<CalculatorResult> {
  const { data } = await api.post<CalculatorResult>('/calculator', payload);
  return data;
}
