import { and, eq, inArray, asc, sql } from "drizzle-orm";
import { db } from "@/db";
import { characters, pokemon } from "@/db/schema/game";
import { ApiError } from "@/lib/game-api";
import type { z } from "zod";
import type { pokemonInput, pokemonPatch } from "@/lib/game-validation";
const owned = (userId: string) => db.select({ id: characters.id }).from(characters).where(eq(characters.userId, userId));
const characterFilter = (userId: string, id: string) => and(eq(characters.userId, userId), eq(characters.id, id));
const pokemonFilter = (userId: string, id: string) => and(eq(pokemon.id, id), inArray(pokemon.characterId, owned(userId)));
function found<T>(rows: T[]): T { if (!rows.length) throw new ApiError(404, "Record not found"); return rows[0]; }
export const listCharacters = (userId: string) => db.select().from(characters).where(eq(characters.userId, userId)).orderBy(asc(characters.createdAt));
export async function createCharacter(userId: string, name: string) { return found(await db.insert(characters).values({userId,name}).returning()); }
export async function getCharacter(userId: string, id: string) { return found(await db.select().from(characters).where(characterFilter(userId,id))); }
export async function renameCharacter(userId: string, id: string, name: string) { return found(await db.update(characters).set({name,updatedAt:new Date()}).where(characterFilter(userId,id)).returning()); }
export async function deleteCharacter(userId: string, id: string) { found(await db.delete(characters).where(characterFilter(userId,id)).returning()); }
export async function listPokemon(userId: string, id: string) { await getCharacter(userId,id); return db.select().from(pokemon).where(and(eq(pokemon.characterId,id),inArray(pokemon.characterId,owned(userId)))).orderBy(asc(pokemon.createdAt)); }
export async function createPokemon(userId: string, id: string, input: z.infer<typeof pokemonInput>) {
  const {name,number,...data} = input;
  return db.transaction(async tx => {
    found(await tx.select({id:characters.id}).from(characters).where(characterFilter(userId,id)).for("update"));
    return found(await tx.insert(pokemon).values({characterId:id,name,number,data}).returning());
  });
}
export async function updatePokemon(userId: string, id: string, input: z.infer<typeof pokemonPatch>) {
  const {name,number,...data} = input;
  return found(await db.update(pokemon).set({name,number,data:sql`${pokemon.data} || ${JSON.stringify(data)}::jsonb`,updatedAt:new Date()}).where(pokemonFilter(userId,id)).returning());
}
export async function deletePokemon(userId: string, id: string) { found(await db.delete(pokemon).where(pokemonFilter(userId,id)).returning()); }
