import { z } from 'zod';
import { gameApi } from '@/lib/game-api';
import { idInput } from '@/lib/game-validation';
import { getCampaignCharacter, createCampaignCharacter } from '@/services/campaign-characters';
const input = z.discriminatedUnion('mode',[
  z.object({mode:z.literal('new'),name:z.string().trim().min(1).max(100)}).strict(),
  z.object({mode:z.literal('import'),sourceCharacterId:idInput}).strict(),
]);
export default gameApi(['GET','POST'],async(req,res,userId)=>{
  const id=idInput.parse(req.query.id);
  if(req.method==='GET') res.status(200).json(await getCampaignCharacter(userId,id));
  else res.status(201).json(await createCampaignCharacter(userId,id,input.parse(req.body)));
});
