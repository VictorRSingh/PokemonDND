import CharacterGenerator from "@/components/character/CharacterGenerator";
import CharacterSelector from "@/components/character/CharacterSelector";
import React from "react";
const App: React.FC = () => {
  return (
    <>
      <div className="flex flex-col mx-auto w-full max-w-5xl items-center justify-center flex-1 gap-6 px-6 py-12">
        <CharacterGenerator />
        <CharacterSelector />
      </div>
    </>
  );
};

export default App;
