import { gameApi } from "@/lib/game-api";
import { idInput,pokemonInput } from "@/lib/game-validation";
import { listPokemon,createPokemon } from "@/services/game";
export default gameApi(["GET","POST"], async (req,res,userId) => {
  const id=idInput.parse(req.query.id);
  if(req.method === "GET") { res.status(200).json(await listPokemon(userId,id)); return; }
  res.status(201).json(await createPokemon(userId,id,pokemonInput.parse(req.body)));
});
