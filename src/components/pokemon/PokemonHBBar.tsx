import {
  characterTableAtom,
  selectedCharacterAtom,
  selectedPokemonAtom,
} from "@/atoms/atoms";
import { Character } from "@/classes/Character";
import { CharacterTable } from "@/classes/database/CharacterTable";
import { Pokemon } from "@/classes/Pokemon";
import { useAtom } from "jotai";
import React from "react";

const PokemonHBBar = () => {
  const [selectedPokemon, setSelectedPokemon] = useAtom(selectedPokemonAtom);
  const [characterTable, setCharacterTable] = useAtom(characterTableAtom);
  const [selectedCharacter, setSelectedCharacter] = useAtom(
    selectedCharacterAtom
  );

  const hpPercentage =
    ((selectedPokemon?.current_hit_points as number) /
      selectedPokemon?.hit_points!) *
    100;

    const handleHPChange = (hp: string) => {

      if (!selectedPokemon || !Number.isFinite(Number(hp))) return;
      if(Number(hp) < 0 || Number(hp) > selectedPokemon?.hit_points!) {
        return;
      }

      const updatedPokemon = { ...selectedPokemon, current_hit_points: Number(hp) }; // Update local Pokémon state
      setSelectedPokemon(updatedPokemon as Pokemon); // Update the atom for live reactivity
    
      const characterUpdated = characterTable?.updatePokemon(
        selectedCharacter?.id as string,
        selectedPokemon?.id as string,
        { current_hit_points: Number(hp) }
      );
    
      if (characterUpdated) {
        // Reinitialize the CharacterTable class with updated records
        const newCharacterTable = new CharacterTable(characterTable?.tableName);
        newCharacterTable.records = characterTable?.records as Character[]; // Retain the updated records
        setCharacterTable(newCharacterTable); // Set as the new instance
    
        // Update selectedCharacter in the atom
        setSelectedCharacter((prev) => {
          if (!prev) return undefined;
        
          // Map ownedPokemon to ensure all elements are instances of Pokemon
          const updatedOwnedPokemon = prev.ownedPokemon.map((pokemon) => {
            if (pokemon.id === updatedPokemon.id) {
              // Replace the updated Pokémon with a new instance
              return new Pokemon({
                ...pokemon, // Retain existing properties
                ...updatedPokemon, // Merge updates
              });
            }
        
            // Rehydrate plain objects into Pokemon instances
            return pokemon instanceof Pokemon ? pokemon : new Pokemon(pokemon);
          });
        
          // Create a new instance of Character to retain methods
          const updatedCharacter = new Character(prev.name, updatedOwnedPokemon);
          updatedCharacter.id = prev.id;
        
          return updatedCharacter;
        });
      }
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
              onChange={(e) => {
                handleHPChange(e.target.value);
              }}
              value={selectedPokemon?.current_hit_points!}
              className="w-16 rounded border border-slate-600 bg-slate-800 px-2 py-1 text-white"
            ></input>
            / <span>{selectedPokemon.hit_points}</span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {[{label: "−1", hp: Math.max(0, (selectedPokemon.current_hit_points ?? selectedPokemon.hit_points) - 1)}, {label: "+1", hp: Math.min(selectedPokemon.hit_points, (selectedPokemon.current_hit_points ?? selectedPokemon.hit_points) + 1)}, {label: "Full", hp: selectedPokemon.hit_points}].map(action => <button key={action.label} type="button" onClick={() => handleHPChange(String(action.hp))} className="rounded bg-slate-800 px-2 py-1 text-sm text-slate-100 hover:bg-slate-700">{action.label}</button>)}
          </div>
        </div>
      )}
    </>
  );
};

export default PokemonHBBar;
