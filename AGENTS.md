# AGENTS.md

## Project Overview

**HotSeat** is a multiplayer party card game platform. Think Cards Against Humanity, but with a "hotseat" mechanic and AI reading answers out loud.

A host starts a game on a shared screen (laptop/TV), players join from their phones by entering a short room code. The host screen displays the shared game state (prompts, answers being read aloud, voting, the heatmeter) while each player's phone shows their hand of cards and controls.

## Core Gameplay

### The Hotseat Mechanic

- One player is always in the **hotseat**
- Every round, the hotseat player is also playing — they need to win the round to escape
- The hotseat player must "roast themselves" to make others pick their card
- After the first round, the player with the least votes is randomly selected for the initial hotseat
- Every player NOT in the hotseat gets +1 point per round just for being safe

### Round Flow

1. A prompt card is revealed on the host screen
2. All players (including hotseat player) choose an answer card from their hand
3. AI reads all answers out loud (Piper TTS) — answers are color-coded
4. All players EXCEPT the hotseat player vote for the best answer
5. If tied: a roulette wheel with the answer colors decides the winner
6. Winner gets points based on their card's value
7. If the hotseat player wins, they escape the hotseat
8. If they lose, they stay — and someone else might get put in based on game rules

### Cards

- Different cards give different point values
- Cards can have special effects:
  - "If you play this card and lose, X happens"
  - "If you play this card while in the hotseat, Y happens"
  - "If you play this card and win, you get put in the hotseat"
- Effects vary between Normal mode and Drinking mode

### Heatmeter

- A shared meter that increases after each round (or is timer-based)
- When it reaches max heat, whoever is in the hotseat loses X points
- In Drinking mode: the hotseat player drinks when the heatmeter maxes out

### Game Modes

- **Normal mode** — Card effects involve points, penalties, and hotseat swaps
- **Drinking mode** — Card effects involve handing out drinks; heatmeter punishment is drinking

### AI Voice (Piper TTS)

- Answers are read aloud by the AI on the host screen
- Adds dramatic effect and keeps the game social (everyone listens instead of reading)

## Architecture

This is a **TypeScript monorepo** using Turborepo. The codebase is split into:

```
hotseat/
├── apps/
│   ├── server/          # Backend API + WebSocket server
│   └── web/             # Frontend (host + player views, same app)
├── packages/
│   └── shared/          # Shared types, game logic, constants
├── e2e/                 # Playwright E2E tests
├── docker-compose.yml
├── turbo.json
└── README.md
```

### Key Architectural Decisions

- **Monorepo with Turborepo** — Shared types between client and server prevent drift. Single repo keeps deployment and CI simple for a solo project.
- **Same frontend app for host and player** — Role is determined by route/state, not a separate app. Reduces duplication and simplifies deployment.
- **Server is the source of truth** — All game state transitions happen on the server. Clients send intents, server validates and broadcasts. This prevents cheating and handles race conditions.
- **Game state machine** — The game loop is modeled as an explicit state machine with flexible phase transitions. This makes transitions predictable, testable, and easy to extend.

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
- **Why Framer Motion:** Party games need _feel_ — dramatic reveals, roulette wheel animation, heatmeter pulsing, card plays. Framer Motion makes this easy and performant.

### Database: PostgreSQL + Drizzle ORM

- **Why PostgreSQL:** Relational data model fits naturally (rooms, players, rounds, cards, votes). Enables game history, stats, and proper reconnection recovery.
- **Why Drizzle over Prisma:** TypeScript-native, schema-as-code, generates SQL you can read. Lighter weight, closer to actual SQL, no heavy client generation step. Migrations are version-controlled.

### AI Voice: Piper TTS

- **Why Piper:** Open-source, runs locally, fast inference, multiple voice options. No API costs, no network latency during gameplay.

### Deployment: Oracle Cloud Free Tier

- **Why Oracle Cloud:** Always-free tier with enough resources to host this project. No monthly costs for a portfolio project.

## Game State Machine

Phases: `lobby` | `prompt` | `play` | `read` | `vote` | `reveal` | `score`

Round flow: `prompt → play → read → vote → reveal`

- **lobby** — Players join, host configures game mode
- **prompt** — Prompt card revealed on host screen
- **play** — Players choose answer cards from their hand
- **read** — AI reads answers aloud (color-coded), building suspense
- **vote** — All players except hotseat player vote for best answer
- **reveal** — Winner announced, hotseat status updated, card effects applied
- **score** — End-of-game scoreboard (when game ends)

## Data Model

```
rooms: id, code, host_player_id, status, game_mode, created_at
players: id, room_id, nickname, socket_id, is_host, connected, in_hotseat, points, joined_at
rounds: id, room_id, prompt_card_id, phase, round_number, heatmeter_value
cards: id, type (prompt|answer), text, point_value, effect_type, effect_description, mode (normal|drinking|both)
player_hands: id, player_id, card_id, round_played
votes: id, round_id, voter_id, voted_for_player_id, submitted_at
```

## Key Technical Challenges

- **Card system** — Balancing point values, managing hands, applying special effects at the right time.
- **Roulette wheel** — Animated tiebreaker that's visually exciting. Must be deterministic (server decides, client animates).
- **Piper TTS integration** — Generate audio on the server, stream to host client for playback. Must not block the game loop.
- **Heatmeter** — Visual component that builds tension. Timer-based or round-based, configurable per game.
- **Reconnection handling** — Phone locks, browser refreshes, flaky WiFi. Player must be able to rejoin seamlessly without losing state or their hand of cards.
- **Race conditions** — Multiple simultaneous card plays, votes during transitions. Server arbitrates everything.
- **Mobile UX** — Card hand UI that works on small screens, big tap targets, swiping through cards.

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

- **Unit tests (packages/shared):** Game state machine transitions, card effects, scoring logic, validation. These should be pure and fast.
- **Unit tests (apps/server):** Service logic, room management, vote tallying, hotseat rotation. Mock the database layer.
- **Integration tests (apps/server):** Socket.IO event flows (player joins, card played, vote submitted, round transitions). Use a real socket connection against a test server instance.
- **Component tests (apps/web):** Key UI states (lobby view, card hand, voting view, roulette wheel, heatmeter). Use Vitest + React Testing Library.

**What NOT to test:**

- Trivial getters/setters
- Third-party library internals
- Pixel-perfect UI layout

**Conventions:**

- Use `describe` blocks to group related tests
- Test names should read as behavior: `it("puts the losing player in the hotseat after first round")`
- Prefer `toEqual` for objects, `toBe` for primitives
- Use factories/fixtures for test data, not inline object literals repeated everywhere

**Coverage:** Aim for high coverage on `packages/shared` (game logic is critical). Don't chase 100% everywhere — focus on behavior that matters.

**E2E tests (Playwright):**

- Live in `e2e/tests/` at the root of the monorepo
- Test full user flows with multiple browser contexts (host + players)
- Use the `snap()` helper from `e2e/helpers/screenshot.ts` to capture screenshots for debugging
- Playwright auto-starts the dev server before tests
- Screenshots and traces on failure

**Agent verification requirements:**

- All code changes MUST be verified with unit tests. If you add or modify logic, add or update the corresponding test.
- When changes affect user-facing behavior (UI, game flow, socket interactions), add or update E2E tests to verify the full flow works.
- Run `pnpm test` (unit) and `pnpm test:e2e` (end-to-end) before considering work complete.
- Use `snap(page, "label")` in E2E tests to capture screenshots when debugging failures.

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

- `feat/` — new features (e.g., `feat/card-system`, `feat/roulette-wheel`)
- `fix/` — bug fixes (e.g., `fix/reconnection-race-condition`)
- `test/` — adding or updating tests (e.g., `test/hotseat-rotation`)
- `chore/` — tooling, config, deps (e.g., `chore/setup-ci`, `chore/add-docker-compose`)
- `refactor/` — code restructuring without behavior change (e.g., `refactor/state-machine`)
- `docs/` — documentation only (e.g., `docs/api-endpoints`)

Rules:

- Use lowercase kebab-case for the description
- Keep it short but descriptive
- `main` is the default branch — never push directly, always use PRs

## Stretch Goals

- Spectator mode
- Custom card packs (user-generated)
- Player avatars / emoji identities
- Game history and cross-session leaderboards
- Multiple AI voice options
- Card pack editor
