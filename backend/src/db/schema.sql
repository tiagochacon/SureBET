-- ============================================================
-- SureBet — Schema do Banco de Dados PostgreSQL
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Usuários
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       VARCHAR(255) UNIQUE NOT NULL,
  bankroll_default NUMERIC(12, 2) NOT NULL DEFAULT 100.00,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Preferências do usuário
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id          UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  min_margin       NUMERIC(5, 4) NOT NULL DEFAULT 0.01,
  max_events       INTEGER NOT NULL DEFAULT 50,
  leagues_filter   TEXT[] NOT NULL DEFAULT ARRAY[
    'soccer_brazil_campeonato',
    'soccer_epl',
    'soccer_spain_la_liga',
    'soccer_germany_bundesliga',
    'soccer_italy_serie_a',
    'soccer_france_ligue_one',
    'soccer_uefa_champs_league'
  ],
  bookmakers_filter TEXT[] NOT NULL DEFAULT ARRAY[
    'bet365', 'betano', 'sportingbet', 'betfair', 'kto', 'superbet', 'bwin'
  ],
  include_inplay   BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Snapshots de odds (auditoria)
CREATE TABLE IF NOT EXISTS odds_snapshots (
  id          BIGSERIAL PRIMARY KEY,
  event_id    VARCHAR(255) NOT NULL,
  bookmaker   VARCHAR(100) NOT NULL,
  market      VARCHAR(50) NOT NULL,
  outcome     VARCHAR(100) NOT NULL,
  odd_value   NUMERIC(8, 4) NOT NULL,
  fetched_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_odds_snapshots_event_id ON odds_snapshots(event_id);
CREATE INDEX IF NOT EXISTS idx_odds_snapshots_fetched_at ON odds_snapshots(fetched_at);

-- Oportunidades de arbitragem detectadas
CREATE TABLE IF NOT EXISTS opportunities (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id          VARCHAR(255) NOT NULL,
  event_name        VARCHAR(500) NOT NULL,
  league            VARCHAR(100) NOT NULL,
  commence_time     TIMESTAMPTZ NOT NULL,
  market_type       VARCHAR(50) NOT NULL,
  arbitrage_margin  NUMERIC(8, 6) NOT NULL,
  bankroll_used     NUMERIC(12, 2),
  outcomes          JSONB NOT NULL,
  status            VARCHAR(20) NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'stale', 'expired', 'invalidated')),
  detected_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expired_at        TIMESTAMPTZ,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON opportunities(status);
CREATE INDEX IF NOT EXISTS idx_opportunities_detected_at ON opportunities(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_opportunities_event_id ON opportunities(event_id);

-- Log de erros de API (para monitoramento)
CREATE TABLE IF NOT EXISTS api_error_logs (
  id          BIGSERIAL PRIMARY KEY,
  api_name    VARCHAR(100) NOT NULL,
  error_code  VARCHAR(50),
  error_msg   TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- View: oportunidades ativas recentes (útil para queries frequentes)
CREATE OR REPLACE VIEW active_opportunities AS
  SELECT * FROM opportunities
  WHERE status = 'active'
    AND detected_at > NOW() - INTERVAL '90 seconds'
  ORDER BY arbitrage_margin DESC;
