import { pgTable, uuid, varchar, timestamp, pgEnum, integer, jsonb } from "drizzle-orm/pg-core";

export const gameStateEnum = pgEnum("game_state", [
  "lobby",
  "prompt",
  "play",
  "read",
  "vote",
  "tiebreaker",
  "reveal",
  "results",
]);

export const gameModeEnum = pgEnum("game_mode", ["normal", "drinking"]);

export const cardTypeEnum = pgEnum("card_type", ["prompt", "answer"]);

export const cardModeEnum = pgEnum("card_mode", ["normal", "drinking", "both"]);

export const games = pgTable("games", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", { length: 4 }).notNull().unique(),
  state: gameStateEnum("state").notNull().default("lobby"),
  gameMode: gameModeEnum("game_mode").notNull().default("normal"),
  roundNumber: integer("round_number").notNull().default(0),
  maxRounds: integer("max_rounds").notNull().default(10),
  currentPromptCardId: uuid("current_prompt_card_id"),
  hotseatPlayerId: uuid("hotseat_player_id"),
  heatmeterValue: integer("heatmeter_value").notNull().default(0),
  heatmeterMax: integer("heatmeter_max").notNull().default(5),
  answers: jsonb("answers").notNull().default([]),
  votes: jsonb("votes").notNull().default([]),
  usedPrompts: jsonb("used_prompts").notNull().default([]),
  deck: jsonb("deck").notNull().default([]),
  roundWinnerId: uuid("round_winner_id"),
  gameWinnerId: uuid("game_winner_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const players = pgTable("players", {
  id: uuid("id").defaultRandom().primaryKey(),
  gameId: uuid("game_id")
    .notNull()
    .references(() => games.id),
  nickname: varchar("nickname", { length: 32 }).notNull(),
  socketId: varchar("socket_id", { length: 64 }),
  isHost: integer("is_host").notNull().default(0),
  connected: integer("connected").notNull().default(1),
  points: integer("points").notNull().default(0),
  winStreak: integer("win_streak").notNull().default(0),
  color: varchar("color", { length: 16 }),
  activeEffects: jsonb("active_effects").notNull().default([]),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const cards = pgTable("cards", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: cardTypeEnum("type").notNull(),
  text: varchar("text", { length: 512 }).notNull(),
  pointValue: integer("point_value").notNull().default(1),
  effectType: varchar("effect_type", { length: 32 }),
  effectDescription: varchar("effect_description", { length: 256 }),
  effectAction: varchar("effect_action", { length: 64 }),
  mode: cardModeEnum("mode").notNull().default("both"),
});

export const playerHands = pgTable("player_hands", {
  id: uuid("id").defaultRandom().primaryKey(),
  playerId: uuid("player_id")
    .notNull()
    .references(() => players.id),
  cardId: uuid("card_id")
    .notNull()
    .references(() => cards.id),
  gameId: uuid("game_id")
    .notNull()
    .references(() => games.id),
  played: integer("played").notNull().default(0),
});
