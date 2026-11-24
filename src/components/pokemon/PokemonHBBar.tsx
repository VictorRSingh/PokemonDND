import {
  gameActionAtom, gameBusyAtom,
  selectedPokemonAtom,
} from "@/atoms/atoms";
import { Character } from "@/classes/Character";
import { Pokemon } from "@/classes/Pokemon";
import { useSetAtom, useAtomValue } from "jotai";
import React from "react";

const PokemonHBBar = () => {
  const selectedPokemon = useAtomValue(selectedPokemonAtom);
  const run = useSetAtom(gameActionAtom);
  const busy = useAtomValue(gameBusyAtom);
  const [draft, setDraft] = React.useState<string | null>(null);
  React.useEffect(() => setDraft(null), [selectedPokemon?.id]);

  const hpPercentage =
    ((selectedPokemon?.current_hit_points as number) /
      selectedPokemon?.hit_points!) *
    100;

  const handleHPChange = async (hp: string) => {
    setDraft(null);
    if (!selectedPokemon?.id || busy || !hp.trim()) return;
    const value = Number(hp);
    if (!Number.isFinite(value) || value < 0 || value > selectedPokemon.hit_points) return;
    if (value === selectedPokemon.current_hit_points) return;
    await run({path: `/api/pokemon/${selectedPokemon.id}`, method: "PATCH", body: {current_hit_points: value}});
  };

  return (
    <>
      {selectedPokemon && (
        <div className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 flex flex-col gap-3">
          <div className="h-3 overflow-hidden bg-slate-700 rounded-full">
            <div
              className={`h-full rounded-full transition-all ${
                hpPercentage > 50
                  ? "bg-green-500"
                  : hpPercentage > 20
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
              style={{ width: `${Number.isFinite(hpPercentage) ? Math.max(0, Math.min(100, hpPercentage)) : 0}%` }}
            ></div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <label htmlFor="pokemon-hp">HP:</label>
            <input
              id="pokemon-hp"
              type="number"
              min={0}
              max={selectedPokemon.hit_points}
              disabled={busy}
              onChange={e => setDraft(e.target.value)}
              onBlur={() => { if (draft !== null) void handleHPChange(draft); }}
              onKeyDown={e => { if (e.key === "Enter") e.currentTarget.blur(); }}
              value={draft ?? selectedPokemon.current_hit_points ?? selectedPokemon.hit_points}
              className="w-16 rounded border border-slate-600 bg-slate-800 px-2 py-1 text-white"
            ></input>
            / <span>{selectedPokemon.hit_points}</span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {[{label: "−1", hp: Math.max(0, (selectedPokemon.current_hit_points ?? selectedPokemon.hit_points) - 1)}, {label: "+1", hp: Math.min(selectedPokemon.hit_points, (selectedPokemon.current_hit_points ?? selectedPokemon.hit_points) + 1)}, {label: "Full", hp: selectedPokemon.hit_points}].map(action => <button key={action.label} type="button" disabled={busy} onClick={() => handleHPChange(String(action.hp))} className="rounded bg-slate-800 px-2 py-1 text-sm text-slate-100 hover:bg-slate-700">{action.label}</button>)}
          </div>
        </div>
      )}
    </>
  );
};

export default PokemonHBBar;
