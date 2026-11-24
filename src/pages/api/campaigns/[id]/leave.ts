import { gameApi } from "@/lib/game-api";
import { idInput } from "@/lib/game-validation";
import { leaveCampaign } from "@/services/campaign-members";
export default gameApi(["DELETE"], async (req,res,userId)=>{
  await leaveCampaign(userId,idInput.parse(req.query.id));
  res.status(204).end();
});
