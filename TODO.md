# TODO

## MVP: Hot Takes

### Core Infrastructure

- [x] Set up Fastify server with Socket.IO
- [x] Set up Drizzle ORM with database schema and migrations
- [x] Set up Vite + React for the web app

### Lobby

- [ ] Create room (generates 4-letter code)
- [ ] Join room with code + nickname
- [ ] Host screen shows connected players
- [ ] Player screen shows waiting state
- [ ] Handle player disconnect/reconnect

### Game Loop

- [ ] State machine with phases: lobby, play, vote, reveal, score
- [ ] Mode defines its own phase flow (e.g., Hot Takes: lobby → vote → reveal → score)
- [ ] State machine supports arbitrary transitions between phases
- [ ] Host can start the game
- [ ] Display phase-appropriate UI on host + player screens
- [ ] Players submit input during play/vote phase
- [ ] Timer for active phases
- [ ] Reveal results with animation on host screen
- [ ] Next round / end game flow

### Scoring & End Screen

- [ ] Track votes per player across rounds
- [ ] Calculate awards ("most controversial," "hive mind," etc.)
- [ ] Final scoreboard on host screen

### Polish

- [ ] Mobile-first player UI (big tap targets)
- [ ] Framer Motion animations for reveals
- [ ] Sound effects on host screen
- [ ] Prompt pack (initial set of hot takes)

---

## Stretch Goals

- [ ] Additional game modes
- [ ] Custom prompt packs (user-generated)
- [ ] Player avatars / emoji identities
- [ ] Spectator mode
- [ ] Game history and cross-session leaderboards
- [ ] Deploy to Fly.io / Railway
