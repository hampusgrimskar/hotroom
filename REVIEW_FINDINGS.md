# Review Findings

2026-08-17 15:01

## [design-choices]

File: packages/shared/src/types.ts
Line: 5-7
Severity: Medium

connected and isHost are typed as number in the shared Player interface consumed by the frontend. These are semantic booleans — the numeric representation is a database concern. The shared type should use boolean, with the server mapping between representations at the serialization boundary.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: apps/server/src/services/game-service.ts
Line: 66
Severity: Medium

addPlayer parameter isHost is typed as number (default 0), leaking storage representation into the service's public API. Accept boolean and map to 0|1 internally so callers express intent (isHost: true) not database format.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: apps/web/src/pages/waiting-room.tsx
Line: 12-13
Severity: Medium

Player data sourced entirely from location.state with no recovery on page refresh — the page shows "Loading players..." forever with no redirect or re-fetch. Add a guard that redirects to /join when state is missing, or persist join context in sessionStorage.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: apps/server/src/socket/lobby-handlers.ts
Line: 47
Severity: Medium

Socket callback response shapes ({ success, game, player, players, error }) are untyped ad-hoc objects defined inline on both server and client. Define shared response interfaces in @hotseat/shared to make the contract explicit and catch drift at compile time.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: apps/web/src/pages/host-lobby.tsx
Line: 16-46
Severity: Low

The useEffect mixes socket connection, game creation (with a useRef StrictMode guard), and event subscription in one block. Extracting a useHostGame() hook would separate orchestration from presentation and align with the existing useSocket() pattern.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: apps/server/src/socket/lobby-handlers.ts
Line: 13-19
Severity: Low

sanitizePlayersForClient uses a generic constraint with as Omit<T, "socketId"> cast. Define an explicit ClientPlayer type in @hotseat/shared (Player minus socketId) for a self-documenting contract instead of relying on runtime stripping and type assertions.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: packages/shared/src/types.ts
Line: 15-16
Severity: Low

GameState includes "tiebreaker" and "results" which diverge from AGENTS.md's documented phases ("score", no explicit tiebreaker). The doc comment helps, but aligning naming between documentation and code prevents confusion as more developers or AI agents reference the spec.

## [clean-code]

File: apps/server/src/socket/lobby-handlers.ts
Line: 68-72
Severity: Low

Dead code: the check if (!code || !nickname) on line 72 is unreachable for code because line 65 already returns early if typeof code !== "string" || code.length !== 4 — a 4-length string is always truthy. The !code branch can never execute. Either remove the redundant !code check or consolidate the two guards.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: apps/server/src/socket/lobby-handlers.ts
Line: 16
Severity: Low

void socketId; is an unusual pattern to suppress the unused-variable warning from destructuring. A leading-underscore convention (const { socketId: _socketId, ...rest } = player) is more idiomatic in TypeScript projects and immediately signals intent to discard.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: apps/web/src/pages/join-game.tsx
Line: 6
Severity: Low

Game is imported but never used in the component's own logic — it only appears inside the inline callback type annotation. Since the component doesn't reference response.game, the import is dead. Remove it or use it.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: apps/web/src/lib/socket.ts
Line: 3
Severity: Low

SERVER_URL is conceptually a configuration constant — per the project's naming convention (AGENTS.md: UPPER_SNAKE_CASE for constants), this is correct. However, the Socket type import on line 1 is imported but not used as a value — it's only needed for the type export. Use import type { Socket } to make intent explicit and enable dead-code elimination.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: apps/web/src/pages/host-lobby.tsx
Line: 97
Severity: Low

The !player.connected check relies on truthiness of a number (0 is falsy). This works, but since connected is typed as number rather than boolean in the shared package, the check player.connected === 0 would be more explicit and less fragile if the type ever changes.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: apps/server/src/services/game-service.ts
Line: 15
Severity: Low

The comment // I, O, 0, 1 excluded to avoid ambiguity when reading codes aloud or on screen is good — but the chars string also excludes digits 2-9 without mention. The comment could note "letters only, excluding I and O" for precision, since a reader might wonder whether digits were intentionally omitted.

### Consistency Assessment

The new code aligns well with the established project style. File naming is kebab-case, components are PascalCase, variables are camelCase, and constants are UPPER_SNAKE_CASE. Import ordering follows the project pattern of external libraries first, then internal modules, then shared package. The code formatting (indentation, brace style, trailing commas) is consistent throughout. JSDoc comments are used sparingly and meaningfully.

### Summary

This is clean, readable code. The naming is consistent, the structure is logical, and the formatting is uniform. The findings are all minor polish items — no stylistic drift or convention violations.

### Verdict

APPROVE WITH SUGGESTIONS — All findings are low-severity nits; none block merge.

## [bugs]

File: apps/server/src/socket/lobby-handlers.ts
Line: 81-96
Severity: Medium

Race condition (TOCTOU): getPlayersInGame count/nickname checks and subsequent addPlayer are not atomic — two concurrent PLAYER_JOIN events can interleave between check and insert, exceeding MAX_PLAYERS or allowing duplicate nicknames. Fix with a DB unique constraint on (game_id, lower(nickname)) and handle the violation.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: apps/server/src/socket/lobby-handlers.ts
Line: 64-72
Severity: Low

nickname is destructured from unvalidated data without type checking. If nickname is a non-string type (e.g., number, array), nickname.toLowerCase() in the duplicate check (line 91) or .length (line 72) could throw. The !nickname check on line 69 partially guards against undefined/null, but the validation ordering is fragile — add typeof nickname !== "string" as an explicit early guard.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: apps/server/src/services/game-service.ts
Line: 67-70
Severity: Low

Color assignment in addPlayer reads existingPlayers.length to compute index, but a concurrent insert between the read and the insert can cause two players to receive the same color. Cosmetic issue — not a crash — but could confuse players visually. Consider using an atomic counter or assigning colors from the caller after a locked read.

## [maintainability]

File: apps/server/src/socket/lobby-handlers.ts
Line: 22
Severity: Medium

All lobby event handlers live in a single 176-line closure. As events are added (kick, reconnect, mode-change), this will grow into a hard-to-navigate god-function. Extract each handler into a named function that receives a context object with { socket, log, gameService }.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: apps/server/src/socket/lobby-handlers.ts
Line: 47
Severity: Medium

Socket callback response shapes ({ success, game?, player?, players?, error? }) are untyped ad-hoc objects duplicated across server handlers and client call sites. Define shared response interfaces in @hotseat/shared so TypeScript catches drift when fields are added or removed.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: apps/web/src/pages/waiting-room.tsx
Line: 12
Severity: Low

Player state relies on ephemeral location.state with no recovery on page refresh — the component renders "Loading players..." permanently. Store session context in sessionStorage or redirect to /join when state is missing.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: apps/server/src/services/game-service.ts
Line: 66
Severity: Low

isHost parameter typed as number (default 0) leaks database integer-boolean representation into the service API. Accept a boolean at the service boundary and map to 0/1 internally.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: packages/shared/src/types.ts
Line: 5
Severity: Low

connected and isHost typed as number in the shared Player interface that the frontend consumes. The Drizzle integer storage detail should stay at the DB boundary — the shared type should use boolean with server-side mapping.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: apps/web/src/pages/host-lobby.tsx
Line: 16
Severity: Low

The useEffect mixes socket connection, game creation (with a StrictMode ref guard), and event listener setup in one block. Extract a useHostGame hook to separate orchestration from presentation and make each concern independently modifiable.

## [robustness]

File: apps/server/src/socket/lobby-handlers.ts
Line: 81-100
Severity: High

TOCTOU race condition: getPlayersInGame count and nickname checks are not atomic with the subsequent addPlayer insert. Concurrent PLAYER_JOIN events can interleave between the await boundaries, exceeding MAX_PLAYERS or admitting duplicate nicknames. Fix with a per-game mutex (serialize join operations) or database-level unique constraint on (game_id, lower(nickname)) plus a check constraint on player count.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: apps/server/src/services/game-service.ts
Line: 66-72
Severity: Medium

Color assignment uses existingPlayers.length % PLAYER_COLORS.length which is subject to the same TOCTOU race — two concurrent inserts can read the same count and assign the same color. Use the set of actually-used colors instead: PLAYER_COLORS.find(c => !usedColors.includes(c)).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: apps/web/src/pages/waiting-room.tsx
Line: 12-13
Severity: Low

Relies on ephemeral location.state for initial player data with no fallback. A page refresh or direct navigation to /waiting produces a permanently stuck "Loading players..." UI. Add a guard that redirects to /join when state is missing and the socket has no active game context.

## [testability]

File: apps/server/src/services/game-service.ts
Line: 13
Severity: Medium

generateCode() is module-private and uses crypto.randomInt directly — the collision-retry loop (lines 37-56) cannot be unit tested without a real database unique constraint violation. Accept an optional codeGenerator?: () => string parameter in createGameService to enable deterministic testing of the retry path (e.g., supply a generator that returns a known-duplicate code on first call, then a fresh code).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: apps/server/src/services/game-service.ts
Line: 66
Severity: Low

addPlayer reads existing players and then inserts — the color assignment logic (line 72: existingPlayers.length % PLAYER_COLORS.length) is coupled to the database query. Extracting assignColor(existingCount: number): string as a pure helper function would allow unit testing color assignment edge cases (wrapping at 8, first player, etc.) without any DB interaction.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: apps/server/src/socket/lobby-handlers.ts
Line: 12
Severity: Low

sanitizePlayersForClient is not exported, so its field-stripping behavior is only verifiable through full socket integration tests. Export it (or move to a shared utility) for direct unit testing — it's a pure function with no dependencies that deserves its own fast test.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: apps/web/src/pages/host-lobby.tsx
Line: 16-48
Severity: Low

The useEffect mixes socket connection, game creation, and event subscription in one block. While the SocketProvider makes the socket mockable for component tests, the useRef flag to prevent double-creation is a test smell — it makes testing the "creation failed" path awkward because you can't re-trigger the effect cleanly. Extracting this into a useHostGame(socket) custom hook would let you unit test the hook's state transitions independently of the component render.

## [security]

File: apps/server/src/socket/lobby-handlers.ts
Line: 63-70
Severity: Medium

Nickname input is not sanitized beyond length. A player can submit <script>alert(1)</script> or similar as a nickname. React's JSX escaping prevents XSS in the current frontend, but if nicknames ever reach dangerouslySetInnerHTML, a log viewer, admin panel, or server-rendered context, this becomes stored XSS (CWE-79). Add a character allowlist or strip HTML-significant characters server-side: nickname.replace(/[<>"'&]/g, '') or validate against /^[\w\s\-]+$/.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: apps/server/src/socket/lobby-handlers.ts
Line: 81-96
Severity: Medium

TOCTOU race condition on player count and nickname uniqueness checks (CWE-367). getPlayersInGame count/nickname checks and the subsequent addPlayer are not atomic — concurrent PLAYER_JOIN events can interleave, potentially exceeding MAX_PLAYERS or allowing duplicate nicknames. Fix with a database-level unique constraint on (game_id, lower(nickname)) and handle the constraint violation error, or serialize per-game joins with a lock.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: apps/server/src/socket/lobby-handlers.ts
Line: 46
Severity: Low

The HOST_CREATE callback returns the full game object from the database, which includes internal fields like answers, votes, deck, usedPrompts, hotseatPlayerId, etc. While mostly empty at creation time, as the game progresses any code reusing this pattern would leak server-side game state (including other players' answers/votes) to the client. Establish a pattern of returning only { id, code, state } to clients now to prevent future data leaks.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: apps/server/src/socket/lobby-handlers.ts
Line: 63
Severity: Low

The nickname field from PLAYER_JOIN data is destructured and used without explicit type validation (typeof nickname !== 'string'). A malicious client could send nickname: 123 or nickname: { toString: ... }. The .length check would pass for arrays. Add typeof nickname !== 'string' guard before the length check.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: apps/web/src/lib/socket.ts
Line: 3
Severity: Low

The VITE_SERVER_URL fallback is http://localhost:4000 (plain HTTP). This is fine for development, but ensure production builds always set this to an HTTPS endpoint. WebSocket connections over plain HTTP on a real network are susceptible to MITM interception of game state and player session data. Consider failing loudly if the URL is HTTP in a production build (import.meta.env.PROD && !url.startsWith('https') → throw).

## [performance]

File: apps/server/src/socket/lobby-handlers.ts
Line: 92-117
Severity: Low

Redundant database queries: getPlayersInGame() is called at line 92 (validation), then again inside addPlayer() at game-service.ts:65 (color assignment), then again at line 117 (response). Three identical queries in one request path. Pass the already-fetched player list (or its length) into addPlayer() to eliminate two round-trips. Acceptable at max 8 players, but wasteful pattern to carry forward.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: apps/server/src/db/schema.ts
Line: 42
Severity: Medium

No index on players.game_id. PostgreSQL foreign keys do not auto-create indexes. getPlayersInGame() is called on every socket event handler (join, start, disconnect) and performs a sequential scan. At 1000+ concurrent games (8000+ player rows), this becomes noticeable. Add .references(() => games.id) alongside an explicit index: index("idx_players_game_id").on(players.gameId).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: apps/server/src/db/schema.ts
Line: 47
Severity: Low

No index on players.socket_id. disconnectPlayer() filters by socket_id on every disconnect event. Without an index this is a full table scan. Low priority at current scale (few hundred rows) but will degrade linearly with concurrent games. Add an index on socketId or use the player ID (already available in socket.data) to target the update by primary key instead.

## [developer-experience]

💡 DX WIN — .env.example updated with VITE_SERVER_URL and a comment explaining its purpose. Combined with the autoConnect: false pattern in socket.ts, the zero-config local development path still works seamlessly.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 DX WIN — app.tsx includes a /game placeholder route so developers testing the lobby-to-game flow don't hit a blank page. This prevents confusion during incremental development.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: apps/web/src/pages/waiting-room.tsx
Line: 13
Severity: Medium

If a player refreshes the browser on /waiting, location.state is null and the page shows "Loading players..." forever with no recovery path or redirect. Add a guard that redirects to /join when state is missing: if (!initialPlayers.length && !location.state) navigate('/join').

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: apps/web/src/pages/host-lobby.tsx
Line: 17
Severity: Low

socket.connect() is called on every effect re-run (outside the hasCreatedRef guard). Socket.IO makes this idempotent, but a if (!socket.connected) guard or moving the connect inside the ref check would make the intent clearer and prevent confusion for future developers reading this code.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: apps/server/src/services/game-service.ts
Line: 66
Severity: Low

isHost parameter is typed number with default 0 — the service API leaks the database storage format. Callers must know to pass 1 instead of true. Accept boolean at the service boundary and map to 0|1 internally to create a more intuitive API: addPlayer(gameId, nickname, socketId, { isHost: true }).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: apps/server/src/socket/lobby-handlers.ts
Line: 33
Severity: Low

When HOST_CREATE or PLAYER_JOIN catch blocks fire, the callback returns a generic error string while the actual cause is only in server logs. During local development a developer seeing "Failed to create game" in the browser console won't immediately know to check server logs. Consider logging a correlation hint (e.g., socketId) in the client-facing error during non-production builds.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: apps/server/src/services/game-service.ts
Line: 56
Severity: Low

When MAX_CODE_GENERATION_ATTEMPTS is exhausted, the error message "Failed to generate unique game code" doesn't indicate how many attempts were tried or suggest remediation (e.g., "clean up stale games"). Add after ${MAX_CODE_GENERATION_ATTEMPTS} attempts to aid debugging this unlikely but confusing edge case.

## [tests]

File: apps/server/test/services/game-service.test.ts
Line: 38
Severity: Medium

The unique constraint retry loop (PG_UNIQUE_VIOLATION handling in createGame) is untested. The "creates games with unique codes" test only asserts two sequential codes differ — it doesn't verify the retry/collision path or the MAX_CODE_GENERATION_ATTEMPTS exhaustion error. Mock randomInt or pre-insert a game with a known code to force a collision and verify both successful retry and the "Failed to generate unique game code" throw.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: apps/server/test/services/game-service.test.ts
Line: 88
Severity: Low

updatePlayerSocket is exported from the service but has no test coverage. While simple, it's the reconnection path — verifying it sets both socketId and connected=1 would document the expected behavior for when reconnection logic is built on top.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: apps/server/test/socket/lobby-handlers.test.ts
Line: 1
Severity: Medium

No test verifies that socketId is stripped from player data returned to clients. The sanitizePlayersForClient function is a security boundary (preventing clients from seeing other players' connection identifiers). Add an assertion that the players array in host:create and player:join callbacks does NOT contain a socketId field.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: apps/server/test/socket/lobby-handlers.test.ts
Line: 1
Severity: Low

No test for host:start when the socket is not in a game (i.e., socket.data has no gameId). The handler returns "Not in a game" — covering this validates the guard against clients calling host:start without first creating/joining.

## Clean

No issues found from: intended-functionality project-adherence searchability comprehensibility
