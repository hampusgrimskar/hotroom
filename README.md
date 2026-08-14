# HotSeat 🔥

A multiplayer party card game. Like Cards Against Humanity, but with a hotseat mechanic and AI reading answers out loud.

One player is always in the **hotseat** — they need to win a round to escape. Everyone else earns points just for staying safe. The heatmeter is ticking. Cards have special effects. Things get chaotic.

## Game Modes

- **Normal** — Card effects involve points, penalties, and hotseat swaps
- **Drinking** — Card effects involve handing out drinks; heatmeter = drink

## Tech Stack

- **Backend:** Node.js + Fastify + Socket.IO
- **Frontend:** React + Vite + Tailwind CSS + shadcn/ui + Framer Motion
- **Database:** PostgreSQL + Drizzle ORM
- **AI Voice:** Piper TTS
- **Monorepo:** Turborepo + pnpm
- **Language:** TypeScript (strict)
- **Deployment:** Oracle Cloud Free Tier

## Project Structure

```
hotseat/
├── apps/
│   ├── server/          # Fastify API + WebSocket server + TTS
│   └── web/             # React app (host + player views)
├── packages/
│   └── shared/          # Shared types, game logic, constants
├── e2e/                 # Playwright E2E tests
├── docker-compose.yml   # Local Postgres
└── turbo.json           # Monorepo task config
```

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm 11+
- Docker (for local Postgres)

### Setup

```bash
# Install dependencies
pnpm install

# Start Postgres
docker-compose up -d

# Run migrations
pnpm --filter @hotseat/server db:migrate

# Run all apps in dev mode
pnpm dev
```

### Scripts

| Command           | Description                        |
| ----------------- | ---------------------------------- |
| `pnpm dev`        | Start all apps in development mode |
| `pnpm build`      | Build all packages                 |
| `pnpm lint`       | Lint all packages                  |
| `pnpm typecheck`  | Type-check all packages            |
| `pnpm test`       | Run all tests (unit + E2E)         |
| `pnpm test:e2e`   | Run E2E tests only                 |
| `pnpm run format` | Format all files with Prettier     |

## License

MIT
