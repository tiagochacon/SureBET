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
odds-api.io (/arbitrage-bets)
```

## Pré-requisitos

- Node.js 20+
- Docker + Docker Compose
- Chave de API: [odds-api.io](https://odds-api.io)

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
| `OddsFetcher` | Busca oportunidades via `/arbitrage-bets` (1 req/min) |
| `OpportunityStore` | Gerencia TTL e estado das oportunidades em memória |
| `NotificationService` | Push de oportunidades via WebSocket |

> **Nota:** Com a odds-api.io, o `ArbitrageDetector` não é necessário no pipeline principal — o endpoint `/arbitrage-bets` retorna oportunidades já detectadas pela API nativa.

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

| Casa | Licença | Confiabilidade |
|------|---------|----------------|
| Bet365 | UKGC / Malta MGA | ⭐⭐⭐⭐⭐ |
| Betano | Malta MGA | ⭐⭐⭐⭐⭐ |

## Plano Gratuito (Free Tier)

O projeto está pré-configurado para funcionar dentro dos limites do **plano gratuito** da [odds-api.io](https://odds-api.io) (100 req/hora).

| Configuração | Valor | Motivo |
|---|---|---|
| API utilizada | `odds-api.io` | Endpoint nativo de arbitragem |
| `POLLING_INTERVAL_SECONDS` | `60` (1 min) | 60 req/hora — abaixo do limite de 100 |
| `ODDS_CACHE_TTL_SECONDS` | `55` | Cache ligeiramente menor que o intervalo |
| Bookmakers | **Bet365 + Betano** | 2 das maiores casas globais |
| Esportes cobertos | **32** (todos disponíveis) | `/arbitrage-bets` cobre tudo em 1 request |
| Mercados cobertos | **Todos** (ML, Over/Under, BTTS, Double Chance, Handicap...) | Nenhuma configuração extra necessária |
| Req estimadas/hora | **~60** | Margem de segurança: 40 req/hora |

### Vantagem do endpoint `/arbitrage-bets`

Diferente de buscar odds por liga (que exigiria dezenas de requests), o endpoint `/arbitrage-bets` retorna **todas** as oportunidades de arbitragem entre Bet365 e Betano em **um único request**, cobrindo automaticamente todos os 32 esportes e todos os mercados disponíveis.

### Esportes cobertos

Futebol, Basquete, Tênis, Beisebol, Futebol Americano, Hóquei no Gelo, E-sports, Dardos, MMA, Boxe, Handebol, Vôlei, Snooker, Tênis de Mesa, Rúgbi, Críquete, Polo Aquático, Futsal, Vôlei de Praia, Futebol Australiano, Floorball, Squash, Futebol de Praia, Lacrosse, Curling, Padel, Bandy, Futebol Gaélico, Handebol de Praia, Atletismo, Badminton, Golfe.

### Como fazer upgrade

Ao assinar um plano pago ([odds-api.io](https://odds-api.io)), o sistema já está otimizado — o único ajuste possível é reduzir o intervalo abaixo de 60s se o plano permitir mais de 100 req/hora.

## Disclaimer

Este sistema é uma ferramenta de análise. Apostas envolvem risco. Verifique sempre as odds diretamente na casa de apostas antes de realizar qualquer operação.
