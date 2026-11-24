import { gameApi } from "@/lib/game-api";
import { idInput } from "@/lib/game-validation";
import { listCampaignMembers } from "@/services/campaign-members";
export default gameApi(["GET"], async (req, res, userId) => {
  res.status(200).json(await listCampaignMembers(userId, idInput.parse(req.query.id)));
});
