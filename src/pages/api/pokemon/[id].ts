import { gameApi } from "@/lib/game-api";
import { idInput,pokemonPatch } from "@/lib/game-validation";
import { updatePokemon,deletePokemon } from "@/services/game";
export default gameApi(["PATCH","DELETE"], async (req,res,userId) => {
  const id=idInput.parse(req.query.id);
  if(req.method === "PATCH") { res.status(200).json(await updatePokemon(userId,id,pokemonPatch.parse(req.body))); return; }
  await deletePokemon(userId,id); res.status(204).end();
});
