import { gameApi } from '@/lib/game-api';
import { idInput } from '@/lib/game-validation';
import { revokeInvitation } from '@/services/campaign-invitations';
export default gameApi(['DELETE'],async(req,res,userId)=>{
 await revokeInvitation(userId,idInput.parse(req.query.id),idInput.parse(req.query.inviteId)); res.status(204).end();
});
