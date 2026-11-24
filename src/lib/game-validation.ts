import { z } from "zod";
const strings = z.array(z.string());
export const characterInput = z.object({ name: z.string().trim().min(1).max(100) }).strict();
export const idInput = z.string().uuid();
export const pokemonInput = z.object({
  name: z.string().trim().min(1).max(100), number: z.number().int().positive().max(2147483647),
  type: strings, abilities: strings, hidden_ability: z.string(), armor_class: z.number(),
  hit_points: z.number().nonnegative(), current_hit_points: z.number().nonnegative().nullable(),
  level: z.number(), current_level: z.number().nullable(),
  evolution: z.string().nullable(), 
  hit_dice: z.string(),
  speed: strings, stats: z.record(z.string(), z.unknown()), moves: z.record(z.string(), z.unknown()),
  proficient_skills: strings, resistances: strings, vulnerabilities: strings, immunities: strings,
  saving_throws: strings, tm: strings, sr: z.string(), starting_moves: strings, image: z.string(),
  given_name: z.string().optional(), selected_moves: strings.optional(), stab: z.number().optional(),
  proficiency_bonus: z.number().optional(), selected_ability: z.string().optional(),
});
export const pokemonPatch = pokemonInput.partial().refine(v => Object.keys(v).length > 0, "Empty update");
