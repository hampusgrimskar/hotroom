# TODO

## MVP: HotSeat

### Core Infrastructure

- [x] Set up Fastify server with Socket.IO
- [x] Set up Drizzle ORM with database schema and migrations
- [x] Set up Vite + React for the web app
- [x] Update database schema for HotSeat (cards, player_hands, game_mode, hotseat fields)
- [ ] Set up Piper TTS on the server

### Lobby

- [ ] Create room (generates 4-letter code)
- [ ] Join room with code + nickname
- [ ] Host screen shows connected players
- [ ] Player screen shows waiting state
- [ ] Host selects game mode (Normal / Drinking)
- [ ] Handle player disconnect/reconnect

### Card System

- [ ] Card data model (prompt cards, answer cards, point values, effects)
- [ ] Seed initial card pack
- [ ] Deal cards to players (hand management)
- [ ] Play a card from hand
- [ ] Card effect system (conditional triggers)

### Game Loop

- [ ] State machine with phases: lobby, prompt, play, read, vote, reveal, score
- [ ] Prompt card revealed on host screen
- [ ] Players choose answer cards from their hand
- [ ] AI reads answers aloud on host screen (Piper TTS)
- [ ] Voting (all players except hotseat player)
- [ ] Tiebreaker roulette wheel (animated, server-determined)
- [ ] Winner revealed, points awarded
- [ ] Hotseat rotation logic (winner escapes, loser enters)
- [ ] First round: randomize hotseat among least-voted players

### Heatmeter

- [ ] Heatmeter increases each round
- [ ] Visual heatmeter component on host screen
- [ ] Max heat penalty (points loss in Normal, drink in Drinking mode)
- [ ] Heatmeter reset after penalty

### Scoring & End Screen

- [ ] Points from card values for round winners
- [ ] +1 point per round for non-hotseat players
- [ ] Card effect point modifications
- [ ] Final scoreboard on host screen
- [ ] Game end condition (configurable number of rounds or heatmeter cycles)

### Polish

- [ ] Mobile-first card hand UI (swipeable, big tap targets)
- [ ] Color-coded answers during read/vote phases
- [ ] Framer Motion animations (card plays, roulette wheel, heatmeter pulse)
- [ ] Sound effects on host screen
- [ ] Drinking mode visual theme

---

## Stretch Goals

- [ ] Spectator mode
- [ ] Custom card packs (user-generated)
- [ ] Card pack editor
- [ ] Player avatars / emoji identities
- [ ] Game history and cross-session leaderboards
- [ ] Multiple AI voice options
- [ ] Deploy to Oracle Cloud Free Tier
