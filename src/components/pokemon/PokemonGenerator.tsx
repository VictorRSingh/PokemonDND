import {
  gameActionAtom, gameBusyAtom,
  pokemonListAtom,
  selectedCharacterAtom,
} from "@/atoms/atoms";
import { useAtom, useSetAtom, useAtomValue } from "jotai";
import React, { useEffect, useState } from "react";
import Modal from "../Modal";
import {
  convertToPokemonObjects,
  generatePokemon,
} from "@/functions/PokemonHelperFunctions";
import { Pokemon } from "@/classes/Pokemon";
import { FaChevronCircleDown, FaChevronCircleUp } from "react-icons/fa";


const PokemonGenerator = () => {
  const run = useSetAtom(gameActionAtom);
  const busy = useAtomValue(gameBusyAtom);
  const selectedCharacter = useAtomValue(selectedCharacterAtom);
  const [pokemonList, setPokemonList] = useAtom(pokemonListAtom);
  const [showAddPokemonModal, setShowAddPokemonModal] =
    useState<boolean>(false);
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon>();

  const [pokemonInput, setPokemonInput] = useState({
    givenName: "",
    desiredLevel: 1,
    selectedMoves: [] as string[],
    selectedAbility: undefined as string | undefined,
  });

  const updatePokemonInput = <K extends keyof typeof pokemonInput>(
    key: K,
    value: (typeof pokemonInput)[K]
  ) => {
    setPokemonInput((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    const Initialize = async () => {
      if (pokemonList.length <= 0) {
        setPokemonList(await convertToPokemonObjects());
      }
    };
    Initialize();
  }, [pokemonList]);

  useEffect(() => {
    if (selectedPokemon !== undefined) {
      console.log(selectedPokemon);
      updatePokemonInput("desiredLevel", selectedPokemon.level);
    }
  }, [selectedPokemon]);

  const handleCreate = async () => {
    if (!selectedPokemon || !selectedCharacter || busy) return;
    const created = generatePokemon(selectedPokemon, pokemonInput);
    if (!created) return;
    if (!await run({path: `/api/characters/${selectedCharacter.id}/pokemon`, method: "POST", body: created})) return;
    setShowAddPokemonModal(false);
    setSelectedPokemon(undefined);
    setPokemonInput({
      givenName: "",
      desiredLevel: 1,
      selectedMoves: [] as string[],
      selectedAbility: undefined as string | undefined,
    });
  };

  return (
    <div className="flex flex-col items-center gap-y-2">
      <button
        className="rounded-lg bg-yellow-400 px-4 py-2 font-bold text-slate-950 hover:bg-yellow-300"
        onClick={() => setShowAddPokemonModal(!showAddPokemonModal)}
      >
        Create Pokémon
      </button>
      {showAddPokemonModal && (
        <div className="">
          <Modal
            showModal={showAddPokemonModal}
            setShowModal={setShowAddPokemonModal}
            modalTitle="Create Pokémon"
            modal_id="create_pokemon"
            actionButton={
              <button
                className="bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold py-2 px-4 rounded-lg select-none"
                disabled={busy} onClick={handleCreate}
              >
                Create
              </button>
            }
          >
            <>
              {!selectedPokemon ? (
                <div className="flex flex-col gap-y-2">
                  <div className="grid grid-cols-3 sm:grid-cols-4 max-h-[360px] overflow-y-auto p-1 gap-2">
                    {pokemonList.map((pokemon: Pokemon) => (
                      <button
                        type="button"
                        className="flex flex-col items-center rounded-lg border border-slate-300 bg-slate-50 p-2 hover:border-amber-500 hover:bg-amber-50"
                        onClick={() => setSelectedPokemon(pokemon)}
                        key={pokemon.name}
                      >
                        <img src={pokemon.image} alt="" className="h-16 w-16 object-contain" />
                        <p className="text-xs font-medium text-center break-words">
                          {pokemon.name}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <p
                    className="text-blue-500 underline text-xs cursor-pointer"
                    onClick={() => {
                      setPokemonInput({
                        givenName: "",
                        desiredLevel: 1, // Reset to the default level
                        selectedMoves: [],
                        selectedAbility: undefined,
                      });
                      setSelectedPokemon(undefined);
                    }}
                  >
                    Return to Pokemon Browser
                  </p>
                  {selectedPokemon && (
                    <div className="flex flex-col gap-y-4 items-center max-h-96 overflow-y-auto p-4">
                      <img src={selectedPokemon.image} width={128} />
                      <p>{selectedPokemon.name}</p>

                      <label
                        htmlFor=""
                        className="flex flex-col items-center w-full"
                      >
                        <h2 className="text-start w-full font-semibold">
                          Given Name:
                        </h2>
                        <input
                          type="text"
                          className="border border-slate-300 w-full rounded-lg px-3 py-2 text-black"
                          value={pokemonInput.givenName}
                          onChange={(e) =>
                            updatePokemonInput("givenName", e.target.value)
                          }
                          minLength={1}
                          maxLength={15}
                        />
                        <p className="text-end w-full text-xs text-slate-500">
                          {pokemonInput.givenName.length}/15
                        </p>
                      </label>

                      <label
                        htmlFor=""
                        className="flex flex-col items-center w-full"
                      >
                        <h2 className="text-start w-full font-semibold">
                          Desired Level:
                        </h2>
                        <div className="flex gap-x-2">
                          <input
                            type="number"
                            className="border border-slate-300 rounded-lg w-16 text-center text-xl"
                            value={pokemonInput.desiredLevel}
                            disabled
                          />
                          <div className="flex flex-col gap-y-2">
                            <div className="text-2xl cursor-pointer">
                              <FaChevronCircleUp
                                onClick={() => {
                                  if (pokemonInput.desiredLevel < 20) {
                                    updatePokemonInput(
                                      "desiredLevel",
                                      pokemonInput.desiredLevel + 1
                                    );
                                  }
                                }}
                              />
                            </div>
                            <div className="text-2xl cursor-pointer">
                              <FaChevronCircleDown
                                onClick={() => {
                                  if (
                                    pokemonInput.desiredLevel >
                                    selectedPokemon.level
                                  ) {
                                    updatePokemonInput(
                                      "desiredLevel",
                                      pokemonInput.desiredLevel - 1
                                    );
                                  }
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </label>

                      <label
                        htmlFor=""
                        className="flex flex-col items-center w-full"
                      >
                        <h2 className="text-start w-full font-semibold">
                          Selected Moves:
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {pokemonInput.selectedMoves.map((move) => (
                            <p
                              className="col-span-1 px-1 cursor-pointer select-none bg-red-100 text-red-800 hover:bg-red-200 rounded flex items-center justify-center text-center min-h-14 min-w-20 text-xs"
                              onClick={() => {
                                updatePokemonInput(
                                  "selectedMoves",
                                  pokemonInput.selectedMoves.filter(
                                    (m) => m !== move
                                  )
                                );
                              }}
                            >
                              {move}
                            </p>
                          ))}
                        </div>
                      </label>

                      <label
                        htmlFor=""
                        className="flex flex-col items-center w-full"
                      >
                        <h2 className="text-start w-full font-semibold">
                          Available Moves {"(Choose 4)"}:
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-32 overflow-y-auto">
                          {Object.entries(selectedPokemon.moves)
                            .filter(([key]) => {
                              // Always include starting_moves and egg_moves
                              if (
                                key === "starting_moves" ||
                                key === "egg_moves"
                              ) {
                                return true;
                              }
                              // Include moves within the Pokémon's level range
                              const level = parseInt(key, 10); // Convert the key to a number
                              return (
                                !isNaN(level) &&
                                level <= pokemonInput.desiredLevel
                              );
                            })
                            .map(([key, value]: [string | number, string[]]) =>
                              value
                                .filter(
                                  (move) =>
                                    !pokemonInput.selectedMoves.includes(move)
                                )
                                .map((move) => (
                                  <p
                                    className="col-span-1 px-1 cursor-pointer select-none bg-emerald-100 text-emerald-900 hover:bg-emerald-200 rounded flex items-center justify-center text-center min-h-14 min-w-20 text-xs"
                                    onClick={() => {
                                      setPokemonInput((prev) => {
                                        if (prev.selectedMoves.length < 4) {
                                          return {
                                            ...prev,
                                            selectedMoves: [
                                              ...prev.selectedMoves,
                                              move,
                                            ],
                                          };
                                        }
                                        return prev;
                                      });
                                    }}
                                  >
                                    {move}
                                  </p>
                                ))
                            )}
                        </div>
                      </label>

                      <label
                        htmlFor=""
                        className="flex flex-col items-center w-full"
                      >
                        <h2 className="text-start w-full font-semibold">
                          Selected Ability:
                        </h2>
                      </label>
                      <div className="flex flex-col w-full">
                        {(() => {
                          if (pokemonInput.selectedAbility !== undefined) {
                            const [name, description] =
                              pokemonInput.selectedAbility &&
                              pokemonInput.selectedAbility.split(": ");
                            return (
                              <p className="mb-2">
                                <strong className="font-bold">{name}</strong>:{" "}
                                {description}
                              </p>
                            );
                          }
                        })()}
                      </div>
                      <label
                        htmlFor=""
                        className="flex flex-col items-center w-full"
                      >
                        <h2 className="text-start w-full font-semibold">
                          Available Abilities {"(Choose 1)"}:
                        </h2>
                        <div className="flex flex-col w-full gap-y-2">
                          {selectedPokemon.abilities.map((ability) => {
                            const [name, description]: [string, string] =
                              ability.split(": ") as [string, string];

                            return (
                              <div
                                className={`border border-slate-300 rounded-lg p-3 cursor-pointer hover:bg-emerald-100 ${
                                  pokemonInput.selectedAbility === ability &&
                                  `bg-emerald-100 border-emerald-500`
                                }`}
                                onClick={() =>
                                  updatePokemonInput("selectedAbility", ability)
                                }
                              >
                                <p className="font-semibold">{name}</p>
                                <p>{description}</p>
                              </div>
                            );
                          })}
                        </div>
                      </label>
                    </div>
                  )}
                </>
              )}
            </>
          </Modal>
        </div>
      )}
    </div>
  );
};

export default PokemonGenerator;
