import { selectedPokemonAtom } from "@/atoms/atoms";

import { useAtom } from "jotai";
import React from "react";
import PokemonDetailsCard from "./PokemonDetailsCard";

const PokemonDetails = () => {
  const [selectedPokemon] = useAtom(selectedPokemonAtom);

  return (
    <>
      {selectedPokemon ? (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-full rounded-xl border border-slate-700 bg-slate-950 p-4 space-y-3">
              <div className="col-span-2 ">
                <h1 className="text-lg font-bold text-yellow-400">Details</h1>
                <PokemonDetailsCard
                  title="Type(s)"
                  details={selectedPokemon.type.join(", ")}
                />
              </div>

              <div className="col-span-1 ">
                <PokemonDetailsCard
                  title="Level"
                  details={selectedPokemon.current_level}
                />
              </div>

              <div className="col-span-1 ">
                <PokemonDetailsCard title="SR" details={selectedPokemon.sr} />
              </div>

              <div className="col-span-2 ">
                <PokemonDetailsCard
                  title="Armor Class"
                  details={selectedPokemon.armor_class}
                />
              </div>

              <div className="col-span-2 ">
                <PokemonDetailsCard
                  title="Proficiency Bonus"
                  details={selectedPokemon.proficiency_bonus}
                />
              </div>

              <div className="col-span-2 ">
                <PokemonDetailsCard
                  title="STAB Bonus"
                  details={selectedPokemon.stab}
                />
              </div>

              <div className="col-span-2 ">
                <PokemonDetailsCard
                  title="Hit Dice"
                  details={selectedPokemon.hit_dice}
                />
              </div>
            </div>

            <div className="col-span-full rounded-xl border border-slate-700 bg-slate-950 p-4 space-y-3">
              <h1 className="text-lg font-bold text-yellow-400">Stats</h1>
              <div className="col-span-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(selectedPokemon.stats).map(([key, value]) => (
                    <div key={key} className="col-span-1">
                      <PokemonDetailsCard
                        title={key.toUpperCase()}
                        details={`${value.value}\n${Number(value.modifier) >= 0 ? "+" : ""}${value.modifier}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="col-span-full rounded-xl border border-slate-700 bg-slate-950 p-4 space-y-3">
              <h1 className="text-lg font-bold text-yellow-400">Skills</h1>
              <div className="col-span-2 ">
                <PokemonDetailsCard
                  title="Speed(s)"
                  details={selectedPokemon.speed.join(", ")}
                />
              </div>

              <div className="col-span-2 ">
                <PokemonDetailsCard
                  title="Saving Throw(s)"
                  details={selectedPokemon.saving_throws.join(", ")}
                />
              </div>

              <div className="col-span-2 ">
                <PokemonDetailsCard
                  title="Proficient Skill(s)"
                  details={selectedPokemon.proficient_skills.join(", ")}
                />
              </div>

              <div className="col-span-2 ">
                <PokemonDetailsCard
                  title="Vulnerabilities"
                  details={selectedPokemon.vulnerabilities.join(", ")}
                />
              </div>

              <div className="col-span-2 ">
                <PokemonDetailsCard
                  title="Resistances"
                  details={selectedPokemon.resistances.join(", ")}
                />
                <PokemonDetailsCard title="Immunities" details={selectedPokemon.immunities?.join(", ")} />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <p className="w-full flex justify-center items-center h-full">
          Select A Pokemon
        </p>
      )}
    </>
  );
};

export default PokemonDetails;
