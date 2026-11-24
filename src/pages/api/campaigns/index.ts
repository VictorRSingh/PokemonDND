import { gameApi } from "@/lib/game-api";
import { createCampaignInput } from "@/lib/campaign-validation";
import { createCampaign, listCampaigns } from "@/services/campaigns";

export default gameApi(["GET", "POST"], async (req, res, userId) => {
  if (req.method === "GET") {
    res.status(200).json(await listCampaigns(userId));
    return;
  }
  res.status(201).json(await createCampaign(userId, createCampaignInput.parse(req.body)));
});
