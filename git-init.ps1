Set-Location "c:\Projeto Cursor\SureBet"
git init
git add .
$msg = "feat: initial commit - SureBet arbitrage system`n`nFull-stack sports betting arbitrage finder:`n- Backend: Fastify + TypeScript, The Odds API, circuit breaker`n- ArbitrageDetector + StakeCalculator with validated math`n- Redis cache (90s TTL), PostgreSQL, Socket.io WebSocket push`n- Frontend: Next.js 14, Tailwind, Zustand state management`n- Real-time dashboard, history, settings pages`n- Unit tests for arbitrage logic`n- Docker Compose for local development"
git commit -m $msg
Write-Output "Git init done"
