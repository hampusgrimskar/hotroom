# TODO

## MVP: HotSeat

### Phase 1: Playable Skeleton

#### Lobby

- [x] Create game (generates 4-letter code)
- [x] Join game with code + nickname
- [x] Host screen shows connected players
- [x] Player screen shows waiting state
- [ ] Host selects game mode (Normal / Drinking)
- [x] Host starts the game

#### Deployment

- [ ] Set up Oracle Cloud Free Tier instance
- [ ] Dockerize server and web app
- [ ] Set up CI/CD pipeline (push to deploy)
- [ ] Configure domain / HTTPS
- [ ] Test lobby on real phones over network

#### State Machine

- [ ] Core state transitions: lobby → prompt → play → vote → reveal → next round
- [ ] Server-authoritative state management
- [ ] Broadcast state changes to all clients via Socket.IO

#### Card System (basic)

- [ ] Seed initial card pack (prompts + answers, no effects yet)
- [ ] Deal cards to players on game start
- [ ] Players choose and play a card from their hand
- [ ] Draw new card after playing

#### Voting + Winner

- [ ] All players except hotseat player vote
- [ ] Determine winner (most votes)
- [ ] Tiebreaker logic (server picks winner, no animation yet)
- [ ] Award points based on card value

#### Hotseat Rotation

- [ ] First round: randomize initial hotseat player
- [ ] Winner escapes the hotseat
- [ ] Loser (or random non-winner) enters the hotseat
- [ ] +1 point per round for non-hotseat players

#### Scoring + Game End

- [ ] Track points on players
- [ ] End game after max_rounds
- [ ] Show results screen with final scoreboard
- [ ] Host can return to lobby for new game

---

### Phase 2: Make It Feel Good

- [ ] Mobile-first card hand UI (swipeable, big tap targets)
- [ ] Color-coded answers during vote phase
- [ ] Roulette wheel animation for tiebreakers (Framer Motion)
- [ ] Heatmeter visual component on host screen
- [ ] Heatmeter increases each round, penalty at max
- [ ] Heatmeter reset after penalty
- [ ] Framer Motion animations (card plays, reveals, hotseat fire)
- [ ] Win streak animations

---

### Phase 3: The Wow Factor

- [ ] Piper TTS: AI reads answers aloud on host screen
- [ ] Card effects system (on_win, on_lose, on_hotseat triggers)
- [ ] Drinking mode effects (hand out drinks, drink on heatmeter penalty)
- [ ] Drinking mode visual theme
- [ ] Sound effects on host screen
- [ ] Player disconnect/reconnect handling

---

## Stretch Goals

- [ ] Spectator mode
- [ ] Custom card packs (user-generated)
- [ ] Card pack editor
- [ ] Player avatars / emoji identities
- [ ] Game history and cross-session leaderboards
- [ ] Multiple AI voice options
