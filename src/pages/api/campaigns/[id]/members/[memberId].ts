import { z } from "zod";
import { gameApi } from "@/lib/game-api";
import { idInput } from "@/lib/game-validation";
import { changeCampaignMember } from "@/services/campaign-members";
const rolePatch = z.object({ isDm: z.boolean().optional(), isPlayer: z.boolean().optional() }).strict()
  .refine(v => v.isDm !== undefined || v.isPlayer !== undefined, "Provide at least one role");
export default gameApi(["PATCH", "DELETE"], async (req, res, userId) => {
  const id = idInput.parse(req.query.id);
  const memberId = idInput.parse(req.query.memberId);
  if (req.method === "PATCH") {
    res.status(200).json(await changeCampaignMember(userId, id, memberId, rolePatch.parse(req.body)));
    return;
  }
  await changeCampaignMember(userId, id, memberId, null);
  res.status(204).end();
});
