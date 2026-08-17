CREATE TYPE "public"."card_mode" AS ENUM('normal', 'drinking', 'both');--> statement-breakpoint
CREATE TYPE "public"."card_type" AS ENUM('prompt', 'answer');--> statement-breakpoint
CREATE TYPE "public"."game_mode" AS ENUM('normal', 'drinking');--> statement-breakpoint
CREATE TYPE "public"."game_state" AS ENUM('lobby', 'prompt', 'play', 'read', 'vote', 'tiebreaker', 'reveal', 'results');--> statement-breakpoint
CREATE TABLE "cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "card_type" NOT NULL,
	"text" varchar(512) NOT NULL,
	"point_value" integer DEFAULT 1 NOT NULL,
	"effect_type" varchar(32),
	"effect_description" varchar(256),
	"effect_action" varchar(64),
	"mode" "card_mode" DEFAULT 'both' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "games" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(4) NOT NULL,
	"state" "game_state" DEFAULT 'lobby' NOT NULL,
	"game_mode" "game_mode" DEFAULT 'normal' NOT NULL,
	"round_number" integer DEFAULT 0 NOT NULL,
	"max_rounds" integer DEFAULT 10 NOT NULL,
	"current_prompt_card_id" uuid,
	"hotseat_player_id" uuid,
	"heatmeter_value" integer DEFAULT 0 NOT NULL,
	"heatmeter_max" integer DEFAULT 5 NOT NULL,
	"answers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"votes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"used_prompts" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"deck" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"round_winner_id" uuid,
	"game_winner_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "games_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "player_hands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" uuid NOT NULL,
	"card_id" uuid NOT NULL,
	"game_id" uuid NOT NULL,
	"played" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" uuid NOT NULL,
	"nickname" varchar(32) NOT NULL,
	"socket_id" varchar(64),
	"is_host" integer DEFAULT 0 NOT NULL,
	"connected" integer DEFAULT 1 NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"win_streak" integer DEFAULT 0 NOT NULL,
	"color" varchar(16),
	"active_effects" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "player_hands" ADD CONSTRAINT "player_hands_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_hands" ADD CONSTRAINT "player_hands_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_hands" ADD CONSTRAINT "player_hands_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;