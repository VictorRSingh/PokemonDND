import { z } from "zod";
import { defaultCampaignSettings } from "@/db/schema/campaigns";

export const campaignSettingsInput = z.object({
  maxPlayers: z.number().int().min(1).max(10),
  allowLateJoin: z.boolean(),
  allowPlayerInvites: z.boolean(),
  allowPlayerEncounterCreation: z.boolean(),
  characterImportPolicy: z.enum(["unrestricted", "fresh_start", "restricted", "dm_approval"]),
  disconnectedPlayerPolicy: z.enum(["pause", "skip", "automated"]),
  disconnectTimeoutSeconds: z.number().int().min(15).max(180),
  defaultActivePokemonLimit: z.number().int().min(1).max(6),
  difficulty: z.enum(["easy", "normal", "hard", "custom"]),
}).strict();

export const createCampaignInput = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(2000).default(""),
  playMode: z.enum(["solo", "multiplayer"]).default("solo"),
  experienceType: z.enum(["encounter", "adventure"]).default("encounter"),
  dmMode: z.enum(["automated", "human", "assisted"]).default("automated"),
  ownerIsPlayer: z.boolean().default(true),
  settings: campaignSettingsInput.partial().optional(),
}).strict().transform(input => ({
  ...input,
  settings: { ...defaultCampaignSettings, maxPlayers: input.playMode === "solo" ? 1 : 4, ...input.settings },
})).superRefine((input, ctx) => {
  if (input.playMode === "solo" && (input.dmMode !== "automated" || input.settings.maxPlayers !== 1)) {
    ctx.addIssue({ code: "custom", path: ["playMode"], message: "Solo campaigns require automated DM and one player" });
  }
  if (input.playMode === "multiplayer" && input.settings.maxPlayers < 2) {
    ctx.addIssue({ code: "custom", path: ["settings", "maxPlayers"], message: "Multiplayer campaigns require capacity for at least two trainers" });
  }
  if (input.dmMode === "automated" && (!input.ownerIsPlayer || input.settings.characterImportPolicy === "dm_approval")) {
    ctx.addIssue({ code: "custom", path: ["dmMode"], message: "Automated campaigns require a playing owner and cannot require DM approval" });
  }
});

// Owner administration.
export const updateCampaignInput = z.object({
  status: z.enum(["active", "archived"]).optional(),
  dmMode: z.enum(["automated", "human", "assisted"]).optional(),
  ownerIsPlayer: z.boolean().optional(),
  settings: campaignSettingsInput.partial().optional(),
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(2000).optional(),
}).strict().refine(input => Object.keys(input).length > 0, "Provide at least one field");
