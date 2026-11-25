import type { RulesetSnapshot } from "@/engine/core/types";
import { sql } from "drizzle-orm";
import { pgTable, pgEnum, uuid, text, integer, boolean, jsonb, timestamp, index, uniqueIndex, check } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { characters, type PokemonData } from "./game";

export const campaignMode = pgEnum("campaign_mode", ["solo", "multiplayer"]);
export const campaignExperience = pgEnum("campaign_experience", ["encounter", "adventure"]);
export const campaignDmMode = pgEnum("campaign_dm_mode", ["automated", "human", "assisted"]);
export const campaignStatus = pgEnum("campaign_status", ["active", "paused", "completed", "archived"]);
export const membershipStatus = pgEnum("campaign_membership_status", ["active", "left", "removed"]);

export interface CampaignSettings {
  battleRules?: RulesetSnapshot;
  maxPlayers: number;
  allowLateJoin: boolean;
  allowPlayerInvites: boolean;
  allowPlayerEncounterCreation: boolean;
  characterImportPolicy: "unrestricted" | "fresh_start" | "restricted" | "dm_approval";
  disconnectedPlayerPolicy: "pause" | "skip" | "automated";
  disconnectTimeoutSeconds: number;
  defaultActivePokemonLimit: number;
  difficulty: "easy" | "normal" | "hard" | "custom";
}

export const defaultCampaignSettings: CampaignSettings = {
  maxPlayers: 1,
  allowLateJoin: true,
  allowPlayerInvites: false,
  allowPlayerEncounterCreation: true,
  characterImportPolicy: "unrestricted",
  disconnectedPlayerPolicy: "automated",
  disconnectTimeoutSeconds: 60,
  defaultActivePokemonLimit: 1,
  difficulty: "normal",
};

const createdAt = () => timestamp("created_at", { withTimezone: true }).defaultNow().notNull();
const updatedAt = () => timestamp("updated_at", { withTimezone: true }).defaultNow().notNull();

export const campaigns = pgTable("campaigns", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerId: text("owner_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  playMode: campaignMode("play_mode").notNull().default("solo"),
  experienceType: campaignExperience("experience_type").notNull().default("encounter"),
  dmMode: campaignDmMode("dm_mode").notNull().default("automated"),
  status: campaignStatus("status").notNull().default("active"),
  settings: jsonb("settings").$type<CampaignSettings>().notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index("campaigns_owner_idx").on(t.ownerId),
  check("campaigns_solo_dm_check", sql`${t.playMode} <> 'solo' OR ${t.dmMode} = 'automated'`),
  check("campaigns_name_check", sql`length(trim(${t.name})) > 0`),
]);

export const campaignMembers = pgTable("campaign_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  campaignId: uuid("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  isDm: boolean("is_dm").notNull().default(false),
  isPlayer: boolean("is_player").notNull().default(true),
  status: membershipStatus("status").notNull().default("active"),
  joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
  leftAt: timestamp("left_at", { withTimezone: true }),
  updatedAt: updatedAt(),
}, (t) => [uniqueIndex("campaign_members_campaign_user_idx").on(t.campaignId, t.userId), index("campaign_members_user_idx").on(t.userId)]);

export const campaignInvitations = pgTable("campaign_invitations", {
  id: uuid("id").defaultRandom().primaryKey(),
  campaignId: uuid("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
  codeHash: text("code_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  maxUses: integer("max_uses").notNull().default(1),
  useCount: integer("use_count").notNull().default(0),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: createdAt(),
}, (t) => [uniqueIndex("campaign_invitations_code_idx").on(t.codeHash), index("campaign_invitations_campaign_idx").on(t.campaignId), check("campaign_invitations_uses_check", sql`${t.maxUses} > 0 AND ${t.useCount} >= 0 AND ${t.useCount} <= ${t.maxUses}`)]);

export const campaignCharacters = pgTable("campaign_characters", {
  id: uuid("id").defaultRandom().primaryKey(),
  memberId: uuid("member_id").notNull().references(() => campaignMembers.id, { onDelete: "cascade" }),
  sourceCharacterId: uuid("source_character_id").references(() => characters.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [uniqueIndex("campaign_characters_member_idx").on(t.memberId), check("campaign_characters_name_check", sql`length(trim(${t.name})) > 0`)]);

export const campaignPokemon = pgTable("campaign_pokemon", {
  id: uuid("id").defaultRandom().primaryKey(),
  characterId: uuid("character_id").notNull().references(() => campaignCharacters.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  number: integer("number").notNull(),
  data: jsonb("data").$type<PokemonData>().notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index("campaign_pokemon_character_idx").on(t.characterId)]);
