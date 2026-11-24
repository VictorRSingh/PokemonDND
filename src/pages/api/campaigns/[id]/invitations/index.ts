import { z } from 'zod';
import { gameApi } from '@/lib/game-api';
import { idInput } from '@/lib/game-validation';
import { listInvitations,createInvitation } from '@/services/campaign-invitations';
const input=z.object({hours:z.number().int().min(1).max(168),maxUses:z.number().int().min(1).max(100)}).strict();
export default gameApi(['GET','POST'],async(req,res,userId)=>{
 const id=idInput.parse(req.query.id);
 if(req.method==='GET') res.status(200).json(await listInvitations(userId,id));
 else res.status(201).json(await createInvitation(userId,id,input.parse(req.body)));
});
