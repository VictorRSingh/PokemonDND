import { gameApi } from "@/lib/game-api";
import { characterInput } from "@/lib/game-validation";
import { listCharacters, createCharacter } from "@/services/game";
export default gameApi(["GET","POST"], async (req,res,userId) => {
  if (req.method === "GET") { res.status(200).json(await listCharacters(userId)); return; }
  res.status(201).json(await createCharacter(userId,characterInput.parse(req.body).name));
});
