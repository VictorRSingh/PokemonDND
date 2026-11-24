import { selectedPokemonAtom } from "@/atoms/atoms";
import { useAtom } from "jotai";
import React, { useEffect, useState } from "react";
import PokemonHBBar from "./PokemonHBBar";
import Modal from "../Modal";
import { fetchAllMoves } from "@/functions/PokemonHelperFunctions";

const PokemonWidget = () => {
  const [selectedPokemon] = useAtom(selectedPokemonAtom);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedMove, setSelectedMove] = useState<string>();
  const [selectedMoveDetails, setSelectedMoveDetails] = useState<any>({});
  const [moveList, setMoveList] = useState<any>();

  useEffect(() => {
    const details = moveList?.find((move: any) => move.name === selectedMove);

    if (details) {
      setSelectedMoveDetails(details);
    }
  }, [selectedMove, moveList]);

  useEffect(() => {
    const fetchMoves = async () => {
      const moves = await fetchAllMoves();
      setMoveList(moves);
    };

    fetchMoves();
  }, [selectedPokemon]);

  return (
    <div>
      {selectedPokemon && (
        <>
          <div className="flex flex-col items-center gap-y-2">
            <div className="w-full rounded-xl border border-slate-700 bg-slate-950 p-4">
              <p className="text-center">
                Level: {selectedPokemon.current_level}
              </p>
              <div className="relative">
                <img src={selectedPokemon.image} width={112} alt={selectedPokemon.name} className="mx-auto" />
                {(selectedPokemon.current_hit_points as number) <= 0 && (
                  <div className="absolute top-[30%] left-[30%]">
                    <p className="text-5xl text-red-500">X</p>
                  </div>
                )}
              </div>
              <p className="text-center">
                {selectedPokemon.given_name || selectedPokemon.name}
              </p>
            </div>
            <PokemonHBBar />
          </div>

          <div className="space-y-4">
            {/* Abilities */}
            <div className="flex flex-col gap-2 my-4">
              {selectedPokemon.selected_ability && (
                <div className="flex justify-center">
                  <button
                    className="px-4 py-2 w-full rounded-lg border border-amber-500/40 bg-slate-800 text-amber-200 font-semibold hover:bg-slate-700"
                    onClick={() => setActiveModal("ability")}
                  >
                    Ability
                  </button>
                </div>
              )}
              {!!selectedPokemon.hidden_ability?.length && (
                <div className="flex justify-center">
                  <button
                    className="px-4 py-2 w-full rounded-lg border border-amber-500/40 bg-slate-800 text-amber-200 font-semibold hover:bg-slate-700"
                    onClick={() => setActiveModal("hiddenAbility")}
                  >
                    Hidden Ability
                  </button>
                </div>
              )}
            </div>

            {/* Moves */}

            <div className="grid grid-cols-1 gap-2 my-4">
              {selectedPokemon.selected_moves?.map((move) => (
                <div key={move} className="col-span-1">
                  <button
                    className="font-semibold px-4 py-3 bg-slate-800 border border-slate-700 text-violet-200 rounded-lg hover:border-violet-400 w-full"
                    onClick={() => {
                      setSelectedMoveDetails(moveList?.find((entry: any) => entry.name === move) || {});
                      setSelectedMove(move);
                      setActiveModal("moveDetails");
                    }}
                  >
                    <span>{move}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {activeModal === "ability" && (
            <Modal
              showModal={!!activeModal}
              setShowModal={() => setActiveModal(null)}
              modal_id="show_ability"
              modalTitle={selectedPokemon?.selected_ability!.split(": ")[0]}
            >
              {selectedPokemon?.selected_ability!.split(": ")[1]}
            </Modal>
          )}

          {activeModal === "hiddenAbility" && (
            <Modal
              showModal={!!activeModal}
              setShowModal={() => setActiveModal(null)}
              modal_id="show_h_ability"
              modalTitle={selectedPokemon.hidden_ability.split(": ")[0]}
            >
              {selectedPokemon.hidden_ability.split(": ")[1]}
            </Modal>
          )}

          {activeModal === "moveDetails" && (
            <Modal
              showModal={!!activeModal}
              setShowModal={() => setActiveModal(null)}
              modal_id="move_details"
              modalTitle={selectedMove as string}
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1 flex flex-col">
                  <h1 className="font-bold">Range</h1>
                  <p>{selectedMoveDetails.range}</p>
                </div>

                <div className="col-span-1 flex flex-col">
                  <h1 className="font-bold">PP</h1>
                  <p>
                    {selectedMoveDetails.current_pp}/{selectedMoveDetails.pp}
                  </p>
                </div>

                <div className="col-span-1 flex flex-col">
                  <h1 className="font-bold">Type</h1>
                  <p>{selectedMoveDetails.type}</p>
                </div>

                <div className="col-span-1 flex flex-col">
                  <h1 className="font-bold">Duration</h1>
                  <p>{selectedMoveDetails.duration}</p>
                </div>

                <div className="col-span-1 flex flex-col">
                  <h1 className="font-bold">Move Time</h1>
                  <p>{selectedMoveDetails.move_time}</p>
                </div>

                <div className="col-span-1 flex flex-col">
                  <h1 className="font-bold">Move Power</h1>
                  <p>{selectedMoveDetails.move_power}</p>
                </div>

                <div className="col-span-2 flex flex-col">
                  <h1 className="font-bold">Description</h1>
                  <p>{selectedMoveDetails.description}</p>
                </div>
                {selectedMoveDetails.higher_levels && (
                  <div className="col-span-2 flex flex-col">
                    <h1 className="font-bold">Higher Level</h1>
                    <p>{selectedMoveDetails.higher_levels}</p>
                  </div>
                )}
              </div>
            </Modal>
          )}
        </>
      )}
    </div>
  );
};

export default PokemonWidget;
