import { z } from 'zod';
import { gameApi } from '@/lib/game-api';
import { joinCampaign } from '@/services/campaign-invitations';
export default gameApi(['POST'],async(req,res,userId)=>{
 const {code}=z.object({code:z.string().regex(/^[a-f0-9]{64}$/)}).strict().parse(req.body);
 res.status(200).json(await joinCampaign(userId,code));
});
