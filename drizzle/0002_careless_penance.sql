CREATE TYPE "public"."campaign_dm_mode" AS ENUM('automated', 'human', 'assisted');--> statement-breakpoint
CREATE TYPE "public"."campaign_experience" AS ENUM('encounter', 'adventure');--> statement-breakpoint
CREATE TYPE "public"."campaign_mode" AS ENUM('solo', 'multiplayer');--> statement-breakpoint
CREATE TYPE "public"."campaign_status" AS ENUM('active', 'paused', 'completed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."campaign_membership_status" AS ENUM('active', 'left', 'removed');--> statement-breakpoint
CREATE TABLE "campaign_characters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"source_character_id" uuid,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "campaign_characters_name_check" CHECK (length(trim("campaign_characters"."name")) > 0)
);
--> statement-breakpoint
CREATE TABLE "campaign_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"created_by" text,
	"code_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"max_uses" integer DEFAULT 1 NOT NULL,
	"use_count" integer DEFAULT 0 NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "campaign_invitations_uses_check" CHECK ("campaign_invitations"."max_uses" > 0 AND "campaign_invitations"."use_count" >= 0 AND "campaign_invitations"."use_count" <= "campaign_invitations"."max_uses")
);
--> statement-breakpoint
CREATE TABLE "campaign_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"is_dm" boolean DEFAULT false NOT NULL,
	"is_player" boolean DEFAULT true NOT NULL,
	"status" "campaign_membership_status" DEFAULT 'active' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"left_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_pokemon" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"character_id" uuid NOT NULL,
	"name" text NOT NULL,
	"number" integer NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"play_mode" "campaign_mode" DEFAULT 'solo' NOT NULL,
	"experience_type" "campaign_experience" DEFAULT 'encounter' NOT NULL,
	"dm_mode" "campaign_dm_mode" DEFAULT 'automated' NOT NULL,
	"status" "campaign_status" DEFAULT 'active' NOT NULL,
	"settings" jsonb NOT NULL,
	"started_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "campaigns_solo_dm_check" CHECK ("campaigns"."play_mode" <> 'solo' OR "campaigns"."dm_mode" = 'automated'),
	CONSTRAINT "campaigns_name_check" CHECK (length(trim("campaigns"."name")) > 0)
);
--> statement-breakpoint
ALTER TABLE "campaign_characters" ADD CONSTRAINT "campaign_characters_member_id_campaign_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."campaign_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_characters" ADD CONSTRAINT "campaign_characters_source_character_id_characters_id_fk" FOREIGN KEY ("source_character_id") REFERENCES "public"."characters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_invitations" ADD CONSTRAINT "campaign_invitations_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_invitations" ADD CONSTRAINT "campaign_invitations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_members" ADD CONSTRAINT "campaign_members_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_members" ADD CONSTRAINT "campaign_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_pokemon" ADD CONSTRAINT "campaign_pokemon_character_id_campaign_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."campaign_characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "campaign_characters_member_idx" ON "campaign_characters" USING btree ("member_id");--> statement-breakpoint
CREATE UNIQUE INDEX "campaign_invitations_code_idx" ON "campaign_invitations" USING btree ("code_hash");--> statement-breakpoint
CREATE INDEX "campaign_invitations_campaign_idx" ON "campaign_invitations" USING btree ("campaign_id");--> statement-breakpoint
CREATE UNIQUE INDEX "campaign_members_campaign_user_idx" ON "campaign_members" USING btree ("campaign_id","user_id");--> statement-breakpoint
CREATE INDEX "campaign_members_user_idx" ON "campaign_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "campaign_pokemon_character_idx" ON "campaign_pokemon" USING btree ("character_id");--> statement-breakpoint
CREATE INDEX "campaigns_owner_idx" ON "campaigns" USING btree ("owner_id");