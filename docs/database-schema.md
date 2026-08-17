# Database Schema

## ER Diagram

```mermaid
erDiagram
    games ||--o{ players : "has"
    games }o--|| cards : "current_prompt"
    players ||--o{ player_hands : "holds"
    cards ||--o{ player_hands : "dealt_as"

    games {
        uuid id PK
        varchar code UK "4-letter room code"
        enum state "lobby|prompt|play|read|vote|tiebreaker|reveal|results"
        enum game_mode "normal|drinking"
        int round_number
        int max_rounds "game end condition"
        uuid current_prompt_card_id FK
        uuid hotseat_player_id FK
        int heatmeter_value "current heat level"
        int heatmeter_max "threshold for penalty"
        jsonb answers "[{playerId, cardId, color}]"
        jsonb votes "[{voterId, answerId}]"
        jsonb used_prompts "array of used prompt card IDs"
        jsonb deck "undealt answer card IDs"
        uuid round_winner_id FK "nullable, current round winner"
        uuid game_winner_id FK "nullable, set at game end"
        timestamp created_at
    }

    players {
        uuid id PK
        uuid game_id FK
        varchar nickname
        varchar socket_id
        int is_host
        int connected
        int points "accumulated score"
        int win_streak "consecutive rounds won"
        varchar color "assigned answer color"
        jsonb active_effects "stacked buffs/debuffs from cards"
        timestamp joined_at
    }

    cards {
        uuid id PK
        enum type "prompt|answer"
        varchar text "card content"
        int point_value "points awarded on win"
        varchar effect_type "on_win|on_lose|on_hotseat (nullable)"
        varchar effect_description "human-readable effect"
        varchar effect_action "machine-readable effect key"
        enum mode "normal|drinking|both"
    }

    player_hands {
        uuid id PK
        uuid player_id FK
        uuid card_id FK
        uuid game_id FK
        int played "0=in hand 1=played"
    }
```

## Design Decisions

### Single `games` table for room + game state

The room and the game are the same thing. A game in `lobby` state is just a room waiting for players. No need for a separate rooms table.

### Host is tracked on players, not games

The `is_host` flag lives on the `players` table. This avoids a circular foreign key (games → players → games) and simplifies inserts.

### States

- **lobby** — Players joining, host configuring game mode
- **prompt** — Prompt card revealed on host screen
- **play** — Players choosing answer cards from their hand
- **read** — AI reading answers aloud (color-coded)
- **vote** — Players (except hotseat) voting for best answer
- **tiebreaker** — Roulette wheel spinning to break a tied vote
- **reveal** — Winner announced, hotseat updated, effects applied
- **results** — Game over, final scoreboard shown. Host can start a new game.

### JSON columns for round-scoped data

`answers` and `votes` are JSONB columns because:

- They only matter for the current round
- They don't need relational queries
- They get reset each round
- Avoids creating/deleting rows every round

### Deck management

`deck` is a JSONB array of undealt answer card IDs. When a player needs new cards, you pop from the deck and create `player_hands` rows. When the deck runs out, you can reshuffle the discard pile (`player_hands` where `played = 1`).

`used_prompts` tracks prompt cards already shown so they don't repeat.

### `active_effects` on players

JSONB column for stacked buffs/debuffs from card effects. Structure defined in TypeScript, not enforced by the database. Can evolve freely without migrations.

### `player_hands` stays relational

Unlike answers/votes, hands persist across rounds and need proper foreign keys to track which cards belong to which player and whether they've been played. Also serves as the discard pile (cards where `played = 1`).

### Playing again

When the host starts a new game from `results`, create a fresh `games` row. The old one can be deleted or kept for history (stretch goal). Players get new `player_hands`, points/streaks/effects reset.

### No game history

This schema only tracks the current game. If we want history later (stretch goal), we can snapshot results at game end before cleanup.
