# SureBet — Sistema de Arbitragem Esportiva

Sistema web em tempo real que monitora odds de casas de apostas esportivas confiáveis, detecta automaticamente oportunidades de arbitragem (surebets) e calcula os valores ótimos de aposta.

## Arquitetura

```
Frontend (Next.js 14)
    ↕ WebSocket (Socket.io)
Backend API (Fastify + TypeScript)
    ↕               ↕
Redis Cache    PostgreSQL
    ↕
The Odds API
```

## Pré-requisitos

- Node.js 20+
- Docker + Docker Compose
- Chave de API: [The Odds API](https://the-odds-api.com)

## Setup

### 1. Configure as variáveis de ambiente

```bash
cp .env.example .env
# Edite .env e adicione sua ODDS_API_KEY
```

### 2. Suba os serviços com Docker

```bash
docker-compose up -d
```

Isso inicia PostgreSQL, Redis, Backend e Frontend automaticamente.

Acesse: http://localhost:3000

### 3. Desenvolvimento local (sem Docker)

**Backend:**
```bash
cd backend
npm install
npm run dev   # porta 3001
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev   # porta 3000
```

## Rodando os testes

```bash
cd backend
npm test
```

## Módulos do sistema

| Módulo | Responsabilidade |
|--------|-----------------|
| `OddsFetcher` | Busca odds da API a cada 60s por liga configurada |
| `ArbitrageDetector` | Detecta oportunidades calculando `sum(1/odd) < 1` |
| `StakeCalculator` | Calcula `stake_i = bankroll × (1/odd_i) / Σ(1/odd_j)` |
| `OpportunityStore` | Gerencia TTL e estado das oportunidades em memória |
| `NotificationService` | Push de oportunidades via WebSocket |

## Fórmula de Arbitragem

```
inverseSum = 1/odd_1 + 1/odd_2 + ... + 1/odd_n
margem     = 1 - inverseSum                    (> 0 = oportunidade)
stake_i    = bankroll × (1/odd_i) / inverseSum
lucro      = bankroll × margem
```

**Exemplo validado:**
- Under 2.5 @ Bet365 = 3.1 | Over 2.5 @ Betano = 1.6
- Inversos: 0.3226 + 0.6250 = 0.9476
- Margem: 5.24% de lucro garantido em R$ 150 de bankroll

## Regras de negócio

- Nunca exibir odds inventadas ou calculadas sem API real
- Circuit breaker após 3 falhas consecutivas na API
- Oportunidades expiram em 90 segundos
- Odds instáveis (< 5 min para o jogo) são descartadas
- Apenas bookmakers licenciados e verificados

## Casas de apostas aprovadas

Bet365, Betano, Sportingbet, Betfair, KTO, Superbet, Bwin, Pinnacle, William Hill, Unibet

## Plano Gratuito (Free Tier)

O projeto está pré-configurado para funcionar dentro dos limites do **plano gratuito** da The Odds API (500 req/mês).

| Configuração | Valor free tier | Motivo |
|---|---|---|
| `POLLING_INTERVAL_SECONDS` | `7200` (2h) | Evitar esgotar cota rapidamente |
| Ligas monitoradas | 3 | Brasileirão, Premier League, Champions |
| Req estimadas/mês | ~360 | 3 ligas × 12 polls/dia × 30 dias |

### Como fazer upgrade

Ao assinar um plano pago ([the-odds-api.com](https://the-odds-api.com)), ajuste no `.env`:

```bash
POLLING_INTERVAL_SECONDS=300   # 5 min — plano Starter (10k req/mês)
POLLING_INTERVAL_SECONDS=60    # 1 min — plano Pro (30k req/mês)
```

E adicione mais ligas em `backend/src/config/leagues.ts`.

## Disclaimer

Este sistema é uma ferramenta de análise. Apostas envolvem risco. Verifique sempre as odds diretamente na casa de apostas antes de realizar qualquer operação.
