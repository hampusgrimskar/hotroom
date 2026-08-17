# Review Findings

2026-08-17 14:56

## [design-choices]

File: apps/server/src/services/game-service.ts
Line: 66
Severity: Medium

isHost parameter typed as number (with default 0) instead of boolean. This leaks the SQLite/integer storage detail into the service API. The service boundary should accept boolean and map to 0|1 internally, giving callers a semantic API (addPlayer(gameId, nickname, socketId, { isHost: true })).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: packages/shared/src/types.ts
Line: 5-6
Severity: Medium

connected and isHost are typed as number in the shared Player interface. These are semantic booleans — the numeric representation is a database concern. The shared type (which the frontend consumes) should use boolean, with the server mapping between representations at the boundary. This forces UI code to do player.connected truthy checks instead of clean boolean expressions.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: apps/web/src/pages/host-lobby.tsx
Line: 16-46
Severity: Medium

The useEffect in HostLobby performs socket connection, game creation, and event subscription in a single block, using a useRef flag to prevent double-creation. This is a workaround for React StrictMode double-mounting. A cleaner pattern is to extract socket lifecycle and game creation into a custom hook (e.g., useHostGame) that encapsulates the connection/creation/cleanup logic and returns { game, players, error, startGame }. This separates orchestration from presentation.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: apps/web/src/pages/waiting-room.tsx
Line: 12-13
Severity: Low

Player state is passed via location.state (React Router navigation state). This is fragile — a page refresh loses the state, and the component falls back to an empty array with no recovery mechanism. Consider storing game/player session info in a lightweight context or localStorage so the waiting room can recover on refresh.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: apps/server/src/socket/lobby-handlers.ts
Line: 13-19
Severity: Low

sanitizePlayersForClient uses a generic constraint <T extends { socketId: unknown }> and casts the result via as Omit<T, "socketId">. A simpler approach: define a ClientPlayer type in the shared package that explicitly excludes socketId, and use a typed mapping function. This makes the contract explicit rather than relying on runtime stripping.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: packages/shared/src/types.ts
Line: 13-14
Severity: Low

GameState includes "tiebreaker" and "results" which differ from the AGENTS.md specification ("score" phase, no explicit "tiebreaker" phase). This is fine if intentional evolution, but worth noting the drift from the documented state machine to avoid confusion later.

## [clean-code]

File: apps/server/src/socket/lobby-handlers.ts
Line: 59
Severity: Low

Redundant typeof callback === "function" check — line 56 already returns early if callback is not a function, making this inner guard dead code. Remove it.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: packages/shared/src/types.ts
Line: 13
Severity: Low

GameState includes "tiebreaker" and "results" which diverge from the documented state machine in AGENTS.md ("score" not "results", no "tiebreaker" phase). Either update docs or align the type — naming drift between docs and code causes confusion.

## [bugs]

File: apps/server/src/socket/lobby-handlers.ts
Line: 81-96
Severity: Medium

Race condition (TOCTOU): getPlayersInGame count/nickname checks and the subsequent addPlayer call are not atomic — concurrent PLAYER_JOIN events can interleave between the check and insert, potentially exceeding MAX_PLAYERS or allowing duplicate nicknames. Fix with a database-level unique constraint on (game_id, lower(nickname)) and handle the constraint violation, or use a per-game mutex/lock.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: apps/server/src/socket/lobby-handlers.ts
Line: 44
Severity: Low

After socket.join(game.id), the socket.to(game.id).emit(...) on line 107 correctly excludes the sender, but if HOST_CREATE ever fails between addPlayer and the end of the handler (e.g., getPlayersInGame throws), the socket remains joined to the room with socket.data set, leaving the socket in a partially-initialized state with no cleanup.

## [maintainability]

File: apps/server/src/socket/lobby-handlers.ts
Line: 22
Severity: Medium

All lobby event handlers live in one 171-line closure function. As events are added (kick, reconnect, mode-change), this will grow into an untestable god-function. Extract each handler into its own named function that receives dependencies explicitly.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: apps/web/src/pages/waiting-room.tsx
Line: 13
Severity: Low

Route relies on ephemeral location.state for initial player data — a page refresh loses all state with no recovery. Store game/player context in a shared React context or re-fetch from server on mount when state is missing.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: apps/server/src/socket/lobby-handlers.ts
Line: 47
Severity: Low

Socket callback response shapes ({ success, game, player, players, error }) are untyped ad-hoc objects. Define shared response interfaces in @hotseat/shared so client and server share an explicit contract, preventing drift as events are added.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: apps/web/src/pages/host-lobby.tsx
Line: 16
Severity: Low

The useEffect mixes connection management, game creation, and listener setup in one block. Extracting a useHostGame hook would isolate these concerns and make the component easier to modify when connection lifecycle changes (e.g., adding auth).

## [robustness]

File: apps/web/src/pages/waiting-room.tsx
Line: 12
Severity: Low

Relies on location.state from React Router for initial player data — page refresh or direct navigation to /waiting yields an empty list with no recovery path. Consider fetching state from the server on mount as a fallback.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: apps/web/src/pages/host-lobby.tsx
Line: 18
Severity: Low

socket.connect() is called unconditionally outside the hasCreatedRef guard, meaning every effect re-run calls connect. Idempotent in Socket.IO but worth a comment or if (!socket.connected) guard to clarify intent.

## [testability]

File: apps/server/src/services/game-service.ts
Line: 13
Severity: Medium

generateCode() is module-private and uses crypto.randomInt directly — the collision-retry loop (lines 37-56) can only be tested via real database unique constraint violations. Accept an optional codeGenerator function in createGameService to enable deterministic testing of retry logic without a database.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: apps/server/src/socket/lobby-handlers.ts
Line: 12
Severity: Low

sanitizePlayersForClient is module-private, so its field-stripping logic is only testable through full socket integration tests. Export it (or move to a shared utility) to enable direct unit testing.

## [comprehensibility]

File: packages/shared/src/types.ts
Line: 4
Severity: Low

connected and isHost are typed as number but clearly represent booleans. A brief inline comment explaining this is a Drizzle/SQLite integer constraint would prevent newcomer confusion.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: packages/shared/src/types.ts
Line: 13
Severity: Low

GameState lists phases ("tiebreaker", "results") that differ from the documented game flow in AGENTS.md. A doc comment showing the intended phase order (e.g., /** lobby → prompt → play → read → vote → [tiebreaker] → reveal → results */) would clarify the lifecycle for newcomers.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: apps/server/src/socket/lobby-handlers.ts
Line: 13
Severity: Low

sanitizePlayersForClient strips socketId but doesn't explain the motivation. Add "security" to the JSDoc so newcomers understand this prevents clients from seeing other players' connection identifiers.

## [security]

File: apps/server/src/socket/lobby-handlers.ts
Line: 52
Severity: Medium

Nickname input is not sanitized beyond length — a player can submit HTML/script content as a nickname (e.g. <img src=x onerror=alert(1)>). Since nicknames are rendered in React which escapes by default this is safe today, but if nicknames ever reach dangerouslySetInnerHTML, a log viewer, or an admin panel, it becomes stored XSS. Add a character allowlist or strip HTML tags server-side as defense-in-depth: nickname.replace(/[<>"'&]/g, '') or validate against /^[\w\s\-]+$/.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: apps/server/src/socket/lobby-handlers.ts
Line: 42
Severity: Low

The code field from PLAYER_JOIN is not validated beyond truthiness before being passed to findGameByCode. While Drizzle parameterizes the query (no injection risk), a malicious client could send extremely long strings or non-string types. Add explicit type+length validation: typeof code !== 'string' || code.length !== 4 to reject obviously invalid codes early and avoid unnecessary DB queries.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: apps/web/src/lib/socket.ts
Line: 3
Severity: Low

The VITE_SERVER_URL environment variable has a hardcoded fallback to http://localhost:4000. This is fine for development, but ensure production builds always set VITE_SERVER_URL to an HTTPS endpoint. WebSocket connections over plain HTTP on a real network are susceptible to MITM interception of game state and player actions.

## [developer-experience]

File: apps/web/src/lib/socket.ts
Line: 3
Severity: Low

VITE_SERVER_URL is introduced as an optional env var with a sensible localhost default, but .env.example was not updated to document it. A developer deploying to a non-localhost environment won't discover this variable until the frontend fails to connect. Add VITE_SERVER_URL=http://localhost:4000 to .env.example with a comment.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: apps/web/src/pages/host-lobby.tsx
Line: 37
Severity: Medium

The GAME_STARTED event handler navigates to /game, but no /game route exists in app.tsx. A developer testing the full host flow will hit a blank page after starting and have to dig through the code to understand why. Either add a placeholder route or navigate to a route that exists with a "coming soon" state.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: apps/web/src/pages/waiting-room.tsx
Line: 23
Severity: Medium

Same issue — GAME_STARTED navigates to /game which doesn't exist. Both host and player views will land on a 404-equivalent after the game starts, making the lobby flow appear broken during development/testing.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: apps/web/src/pages/waiting-room.tsx
Line: 13
Severity: Low

If a player navigates directly to /waiting (e.g., browser refresh), location.state is null, so players starts as [] and the socket has no game context to receive PLAYERS_UPDATED events. The page is permanently stuck on "Loading players..." with no error or redirect guidance. A guard that redirects to /join when state is missing would prevent confusion.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: apps/server/src/socket/lobby-handlers.ts
Line: 33
Severity: Low

When HOST_CREATE or PLAYER_JOIN fail internally, the error logged is the raw exception (log.error(err, "Failed to create game")), but the callback returns a generic string. This is fine for clients, but during local development a developer seeing "Failed to create game" in the browser won't know to check server logs. Consider including a request/correlation ID in the callback error message for easier cross-referencing during debugging.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: apps/server/src/services/game-service.ts
Line: 41
Severity: Low

When MAX_CODE_GENERATION_ATTEMPTS is exhausted, the thrown error says "Failed to generate unique game code" but doesn't mention how many attempts were made or suggest a fix (e.g., checking if stale games should be cleaned up). This makes debugging this edge case harder in production, though it's unlikely to occur with only 4-letter codes in active use.

## [tests]

File: apps/server/test/services/game-service.test.ts
Line: 38
Severity: Medium

createGame unique constraint retry logic (the core retry loop with PG_UNIQUE_VIOLATION handling) is untested. The test "creates games with unique codes" only verifies two sequential creates differ — it doesn't test the retry behavior when a code collision occurs. Consider mocking randomInt or pre-inserting a game with a known code to force a collision and verify the retry succeeds, and test that it throws after MAX_CODE_GENERATION_ATTEMPTS.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: apps/server/test/services/game-service.test.ts
Line: 88
Severity: Low

addPlayer is not tested for what happens when called with an invalid gameId (foreign key violation). This is a minor gap since the handler guards against it, but the service layer has no explicit handling for it.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: apps/server/test/socket/lobby-handlers.test.ts
Line: 1
Severity: Medium

No test for player:join when the game state is not "lobby" (e.g., game already started). The handler at lobby-handlers.ts:77 checks game.state !== "lobby" and returns "Game already in progress", but this path is never exercised in tests. Start a game, then attempt to join — this is a realistic scenario where a player enters a code too late.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: apps/server/test/socket/lobby-handlers.test.ts
Line: 1
Severity: Medium

No test for player:join with a nickname exceeding 32 characters. The handler at lobby-handlers.ts:68 validates nickname.length > 32 but no test covers this boundary. Add a test with a 33-character nickname to verify the "Nickname too long" error path.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: apps/server/test/socket/lobby-handlers.test.ts
Line: 140
Severity: Low

The duplicate nickname test only checks exact-case match ("Alice" vs "Alice"). The handler at lobby-handlers.ts:89 does case-insensitive comparison. Add a test with "alice" vs "ALICE" to verify the case-insensitive logic works as intended.

## Clean

No issues found from: intended-functionality project-adherence searchability performance
