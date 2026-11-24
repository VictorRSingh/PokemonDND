import { characterTableAtom, gameActionAtom, gameBusyAtom, selectedCharacterAtom } from "@/atoms/atoms";
import { Character } from "@/classes/Character";
import { useAtom, useSetAtom, useAtomValue } from "jotai";
import React, { useEffect } from "react";
import { MdDeleteForever } from "react-icons/md";
import { useRouter } from "next/router";
import toast from "react-hot-toast";

const CharacterSelector = () => {
  const router = useRouter();
  const characterTable = useAtomValue(characterTableAtom);
  const run = useSetAtom(gameActionAtom);
  const busy = useAtomValue(gameBusyAtom);
  const [selectedCharacter, setSelectedCharacter] = useAtom(
    selectedCharacterAtom
  );

  // Initialize selectedCharacter to null on page load
  useEffect(() => {
    if (!selectedCharacter) {
      setSelectedCharacter(undefined); // Explicitly set to undefined if not initialized
    }
  }, [selectedCharacter, setSelectedCharacter]);

  const handleCharacterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = characterTable?.read(e.target.value) as
      | Character
      | undefined;
    if (selected) {
      setSelectedCharacter(selected);
    } else {
      toast.error("Character not found");
    }
  };
  
  const handleDelete = async (characterId: string) => {
    if (busy || !window.confirm("Delete character and all Pokémon?")) return;
    if (await run({path: `/api/characters/${characterId}`, method: "DELETE"})) toast.success("Character deleted successfully");
  };

  return (
    <>
      <div className="flex items-center gap-x-2">
        {characterTable?.getNumberOfRecords() === 0 ? (
          <p className="text-gray-500">
            No characters available. Create one!
          </p>
        ) : (
          <select
            className="text-black px-4 py-2"
            value={selectedCharacter?.id || ""}
            onChange={handleCharacterChange}
          >
            <option value="" disabled>
              Select a Character
            </option>
            {characterTable?.getExistingRecords().map((record) => (
              <option key={record.id} value={record.id}>
                {record.name}
              </option>
            ))}
          </select>
        )}
        {selectedCharacter && (
          <MdDeleteForever
            className="text-3xl text-red-500 hover:text-red-600 cursor-pointer"
            onClick={() => handleDelete(selectedCharacter.id as string)}
          />
        )}
      </div>
      <button
        disabled={selectedCharacter ? false : true}
        className={`mt-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded ${!selectedCharacter && 'bg-gray-500 cursor-not-allowed hidden'}`}
        onClick={() => router.push(`/dm/${selectedCharacter?.name}`)}
      >
        Continue
      </button>
    </>
  );
};

export default CharacterSelector;
