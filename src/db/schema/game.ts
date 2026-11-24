import { pgTable, uuid, text, integer, jsonb, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "./auth";
import type { Pokemon } from "../../classes/Pokemon";

export type PokemonData = Omit<Pokemon, "id" | "name" | "number" | "calculateHP" | "updateHP">;

export const characters = pgTable("characters", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [uniqueIndex("characters_user_name_idx").on(table.userId, table.name)]);

export const pokemon = pgTable("pokemon", {
  id: uuid("id").defaultRandom().primaryKey(),
  characterId: uuid("character_id").notNull().references(() => characters.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  number: integer("number").notNull(),
  data: jsonb("data").$type<PokemonData>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("pokemon_character_id_idx").on(table.characterId)]);
