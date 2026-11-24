import { gameApi } from "@/lib/game-api";
import { characterInput,idInput } from "@/lib/game-validation";
import { getCharacter,renameCharacter,deleteCharacter } from "@/services/game";
export default gameApi(["GET","PATCH","DELETE"], async (req,res,userId) => {
  const id=idInput.parse(req.query.id);
  if(req.method === "GET") { res.status(200).json(await getCharacter(userId,id)); return; }
  if(req.method === "PATCH") { res.status(200).json(await renameCharacter(userId,id,characterInput.parse(req.body).name)); return; }
  await deleteCharacter(userId,id); res.status(204).end();
});
