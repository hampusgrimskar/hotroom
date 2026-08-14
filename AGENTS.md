# AGENTS.md

## Project Overview

**Hotroom** is a multiplayer party game platform. A host starts a game on a shared screen (laptop/TV), and players join from their phones by entering a short room code. The host screen displays shared game state while each player's phone shows individual prompts and controls.

The MVP game mode is **"Hot Takes"**: players vote on spicy prompts (agree/disagree), then results are revealed dramatically on the host screen with stats and awards.

## Architecture

This is a **TypeScript monorepo** using Turborepo. The codebase is split into:

```
hotroom/
├── apps/
│   ├── server/          # Backend API + WebSocket server
│   └── web/             # Frontend (host + player views, same app)
├── packages/
│   └── shared/          # Shared types, game logic, constants
├── docker-compose.yml
├── turbo.json
└── README.md
```

### Key Architectural Decisions

- **Monorepo with Turborepo** — Shared types between client and server prevent drift. Single repo keeps deployment and CI simple for a solo project.
- **Same frontend app for host and player** — Role is determined by route/state, not a separate app. Reduces duplication and simplifies deployment.
- **Server is the source of truth** — All game state transitions happen on the server. Clients send intents, server validates and broadcasts. This prevents cheating and handles race conditions.
- **Game state machine** — The game loop (lobby → prompt → voting → reveal → scores) is modeled as an explicit state machine. This makes transitions predictable, testable, and easy to extend with new game modes.

## Tech Stack

### Backend: Node.js + Fastify

- **Why Fastify over Express:** Faster, better TypeScript support, schema validation built in, and a modern plugin system. Express is legacy at this point.
- **Why not Nest.js:** Overkill for this project's scope. Fastify gives structure without the ceremony.

### Real-time: Socket.IO

- **Why Socket.IO:** Built-in room management, automatic reconnection, fallback transports, and broad browser support. Critical for a game where players are on flaky mobile connections.
- **Why not raw WebSockets:** We'd reimplement rooms, reconnection, and heartbeats manually. Not worth it for this project.

### Frontend: React + Vite

- **Why React:** Ubiquitous, well-understood by recruiters, huge ecosystem. Component model fits the host/player view split cleanly.
- **Why Vite:** Fast dev server, simple config, good monorepo support with Turborepo.

### UI: Tailwind CSS + shadcn/ui + Framer Motion

- **Why Tailwind:** Utility-first approach is fast for responsive mobile layouts. No fighting a component library's opinions when building custom game UI.
- **Why shadcn/ui:** Copy-paste components we own (not a dependency). Gives polished structural UI (forms, dialogs, toasts) without bloat. Code is in the repo, fully customizable.
- **Why Framer Motion:** Party games need *feel* — dramatic reveals, countdown animations, vote transitions. Framer Motion makes this easy and performant.

### Database: PostgreSQL + Drizzle ORM

- **Why PostgreSQL:** Relational data model fits naturally (rooms, players, rounds, votes). Enables game history, stats, and proper reconnection recovery.
- **Why Drizzle over Prisma:** TypeScript-native, schema-as-code, generates SQL you can read. Lighter weight, closer to actual SQL, no heavy client generation step. Migrations are version-controlled.
- **Why not Redis:** SQL demonstrates more relevant skills.

### Deployment: Docker + Fly.io (or Railway)

- **Why Docker:** Reproducible builds, easy local dev with docker-compose (app + Postgres), and demonstrates containerization knowledge.
- **Why Fly.io/Railway:** Free tier, native WebSocket support, simple deployment from Docker. No AWS overhead for a portfolio project.

## Game Flow (MVP: Hot Takes)

1. Host creates a room → gets a 4-letter code
2. Players join on their phones with code + nickname
3. Host starts the game
4. Each round: prompt appears → players vote (🔥 agree / 🗑️ disagree) → host screen reveals results with animation
5. After N rounds, show final stats ("most controversial," "hive mind award," etc.)

## Data Model

```
rooms: id, code, host_player_id, status (lobby|playing|finished), created_at
players: id, room_id, nickname, socket_id, connected, joined_at
rounds: id, room_id, prompt, phase (voting|reveal), round_number
votes: id, round_id, player_id, choice (agree|disagree), submitted_at
```

## Key Technical Challenges

- **State machine correctness** — Game phases must transition cleanly. No player should be able to vote during reveal phase, etc.
- **Reconnection handling** — Phone locks, browser refreshes, flaky WiFi. Player must be able to rejoin seamlessly without losing state.
- **Race conditions** — Multiple simultaneous votes, host actions during transitions. Server arbitrates everything.
- **Mobile UX** — Big tap targets, no typing during gameplay, works on any phone browser without install.

## Development Practices

- TypeScript `strict: true` throughout, no `any`
- Tests with Vitest
- ESLint + Prettier for formatting
- GitHub Actions CI (lint, typecheck, test, build)
- Conventional commits
- Docker Compose for local development (app + Postgres)

### Testing

**Runner:** Vitest (fast, native TypeScript support, ESM-first, compatible with Jest API).

**File structure:** Tests live in a separate `test/` directory that mirrors the source structure:

```
apps/server/
├── src/
│   └── rooms/
│       └── room-service.ts
├── test/
│   └── rooms/
│       └── room-service.test.ts
packages/shared/
├── src/
│   └── state-machine/
│       └── game-state.ts
├── test/
│   └── state-machine/
│       └── game-state.test.ts
```

**Naming:** `<filename>.test.ts` for unit tests, `<filename>.integration.test.ts` for integration tests.

**What to test:**

- **Unit tests (packages/shared):** Game state machine transitions, validation logic, score calculations, utility functions. These should be pure and fast.
- **Unit tests (apps/server):** Service logic, room management, vote tallying. Mock the database layer.
- **Integration tests (apps/server):** Socket.IO event flows (player joins, vote submitted, round transitions). Use a real socket connection against a test server instance.
- **Component tests (apps/web):** Key UI states (lobby view, voting view, reveal view). Use Vitest + React Testing Library.

**What NOT to test:**

- Trivial getters/setters
- Third-party library internals
- Pixel-perfect UI layout

**Conventions:**

- Use `describe` blocks to group related tests
- Test names should read as behavior: `it("rejects a vote after the round has ended")`
- Prefer `toEqual` for objects, `toBe` for primitives
- Use factories/fixtures for test data, not inline object literals repeated everywhere

**Coverage:** Aim for high coverage on `packages/shared` (game logic is critical). Don't chase 100% everywhere — focus on behavior that matters.

### Code Style

**Naming conventions:**
- `camelCase` for variables, functions, and method names (e.g., `playerCount`, `getActiveRooms`)
- `PascalCase` for classes, interfaces, types, and React components (e.g., `GameRoom`, `PlayerState`, `VotePanel`)
- `UPPER_SNAKE_CASE` for constants (e.g., `MAX_PLAYERS`, `ROUND_DURATION_MS`)
- `kebab-case` for file and directory names (e.g., `game-room.ts`, `vote-panel.tsx`)

**Braces:**
- Opening brace on the same line (1TBS / "one true brace style"):

```typescript
function createRoom(hostId: string) {
  if (!hostId) {
    throw new Error("Host ID required");
  }
  return new GameRoom(hostId);
}
```

These conventions are enforced by ESLint and Prettier — configuration is the source of truth if this document ever drifts.

### Branch Naming

Branches follow the pattern: `<type>/<short-description>`

Types:
- `feat/` — new features (e.g., `feat/lobby-ui`, `feat/vote-reveal-animation`)
- `fix/` — bug fixes (e.g., `fix/reconnection-race-condition`)
- `test/` — adding or updating tests (e.g., `test/state-machine-transitions`)
- `chore/` — tooling, config, deps (e.g., `chore/setup-ci`, `chore/add-docker-compose`)
- `refactor/` — code restructuring without behavior change (e.g., `refactor/state-machine`)
- `docs/` — documentation only (e.g., `docs/api-endpoints`)

Rules:
- Use lowercase kebab-case for the description
- Keep it short but descriptive
- `main` is the default branch — never push directly, always use PRs

## Stretch Goals (post-MVP)

- Additional game modes (drawing, word prompts, trivia)
- Custom prompt packs (user-generated content)
- Sound effects on host screen
- Player avatars / emoji identities
- Spectator mode
- Game history and cross-session leaderboards
