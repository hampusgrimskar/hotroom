# Hotroom 🔥

A multiplayer party game platform. A host starts a game on a shared screen, players join from their phones with a room code, and the fun begins.

## Game Mode: Hot Takes

Players vote on spicy prompts (agree or disagree), results are revealed dramatically on the host screen, and awards are given at the end.

## Tech Stack

- **Backend:** Node.js + Fastify + Socket.IO
- **Frontend:** React + Vite + Tailwind CSS + shadcn/ui + Framer Motion
- **Database:** PostgreSQL + Drizzle ORM
- **Monorepo:** Turborepo + pnpm
- **Language:** TypeScript (strict)

## Project Structure

```
hotroom/
├── apps/
│   ├── server/          # Fastify API + WebSocket server
│   └── web/             # React app (host + player views)
├── packages/
│   └── shared/          # Shared types, game logic, constants
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
docker compose up -d

# Run all apps in dev mode
pnpm dev
```

### Scripts

| Command                 | Description                        |
| ----------------------- | ---------------------------------- |
| `pnpm dev`              | Start all apps in development mode |
| `pnpm build`            | Build all packages                 |
| `pnpm lint`             | Lint all packages                  |
| `pnpm typecheck`        | Type-check all packages            |
| `pnpm test`             | Run all tests                      |
| `pnpm run format`       | Format all files with Prettier     |
| `pnpm run format:check` | Check formatting without writing   |

## License

MIT
