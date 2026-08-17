# Review Skipped Findings

Findings intentionally skipped during the review-fix loop. These are deferred to future phases or accepted as tradeoffs.

## Deferred to Phase 3 (Reconnection & Robustness)

- **boolean types for connected/isHost** — Using number (0/1) to match Drizzle schema output directly. Adding a mapping layer is premature; will revisit when more fields need it.
- **location.state fragility in WaitingRoom** — Page refresh loses state. Will add server-side state recovery when implementing reconnection handling.
- **session persistence (host-lobby refresh)** — Game orphaned on refresh. Will persist game ID to sessionStorage in Phase 3.
- **host disconnect cleanup** — No host:disconnected event yet. Deferred to reconnection phase.

## Accepted Tradeoffs

- **TOCTOU race condition (join)** — Check-then-insert for MAX_PLAYERS and duplicate nicknames is not atomic. Bounded by MAX_PLAYERS=8 and extremely unlikely in a party game lobby. DB unique constraint deferred.
- **Color assignment race** — Concurrent joins could get same color. Cosmetic only, bounded by MAX_PLAYERS.
- **generateCode() not injectable** — crypto.randomInt used directly. Retry logic tested indirectly via integration tests. Injection adds complexity without clear benefit now.
- **Socket.IO generics vs type casts** — Using `(socket.data as SocketData)` instead of full Socket.IO generics. Works, typed interface exists, will upgrade if it causes issues.
- **Nickname XSS defense-in-depth** — React escapes output by default. Server-side allowlist deferred until we have contexts where nicknames aren't escaped (logs, admin panel).

## Future Improvements (Not Blocking)

- **Response type interfaces in @hotseat/shared** — Socket callback response shapes are untyped. Will define interfaces when adding more events.
- **useHostGame hook extraction** — useEffect in HostLobby is complex but works. Will extract when adding more socket lifecycle patterns.
- **Handler function extraction** — lobby-handlers.ts is 170 lines. Will split when adding game phase handlers.
- **sanitizePlayersForClient → ClientPlayer type** — Generic stripping works; explicit type is nicer but premature.
- **Redundant DB queries in PLAYER_JOIN** — 3 queries per join. Acceptable for MAX_PLAYERS=8, optimize later if needed.
- **HOST_CREATE returns full game row** — Will trim response fields when game state gets sensitive data.
- **GameState naming drift from AGENTS.md** — "results" vs "score", added "tiebreaker". Intentional evolution; docs will be updated.
