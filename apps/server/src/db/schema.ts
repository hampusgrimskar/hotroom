import { pgTable, uuid, varchar, timestamp, pgEnum, integer } from "drizzle-orm/pg-core";

export const roomStatusEnum = pgEnum("room_status", ["lobby", "playing", "finished"]);

export const roundPhaseEnum = pgEnum("round_phase", ["play", "vote", "reveal"]);

export const rooms = pgTable("rooms", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", { length: 4 }).notNull().unique(),
  status: roomStatusEnum("status").notNull().default("lobby"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const players = pgTable("players", {
  id: uuid("id").defaultRandom().primaryKey(),
  roomId: uuid("room_id")
    .notNull()
    .references(() => rooms.id),
  nickname: varchar("nickname", { length: 32 }).notNull(),
  socketId: varchar("socket_id", { length: 64 }),
  isHost: integer("is_host").notNull().default(0),
  connected: integer("connected").notNull().default(1),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const rounds = pgTable("rounds", {
  id: uuid("id").defaultRandom().primaryKey(),
  roomId: uuid("room_id")
    .notNull()
    .references(() => rooms.id),
  prompt: varchar("prompt", { length: 512 }).notNull(),
  phase: roundPhaseEnum("phase").notNull().default("vote"),
  roundNumber: integer("round_number").notNull(),
});

export const votes = pgTable("votes", {
  id: uuid("id").defaultRandom().primaryKey(),
  roundId: uuid("round_id")
    .notNull()
    .references(() => rounds.id),
  playerId: uuid("player_id")
    .notNull()
    .references(() => players.id),
  choice: varchar("choice", { length: 16 }).notNull(),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});
