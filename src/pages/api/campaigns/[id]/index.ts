import { gameApi } from "@/lib/game-api";
import { idInput } from "@/lib/game-validation";
import { updateCampaignInput } from "@/lib/campaign-validation";
import { getCampaign, updateCampaign, deleteCampaign } from "@/services/campaigns";

export default gameApi(["GET", "PATCH", "DELETE"], async (req, res, userId) => {
  const id = idInput.parse(req.query.id);
  if (req.method === "GET") {
    res.status(200).json(await getCampaign(userId, id));
    return;
  }
  if (req.method === "PATCH") {
    res.status(200).json(await updateCampaign(userId, id, updateCampaignInput.parse(req.body)));
    return;
  }
  await deleteCampaign(userId, id);
  res.status(204).end();
});
