import React from "react";

interface PokemonDetailsCardProps {
  title: string;
  details: string | number | null | undefined;
}

const PokemonDetailsCard: React.FC<PokemonDetailsCardProps> = ({
  title,
  details,
}) => {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-3 text-slate-100">
      <h1 className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</h1>
      <p className={`mt-1 whitespace-pre-line break-words font-semibold ${title === "Vulnerabilities" ? "text-red-300" : title === "Resistances" ? "text-emerald-300" : title === "Immunities" ? "text-sky-300" : "text-slate-100"}`}>{details === null || details === undefined || details === "" ? "—" : details}</p>
    </div>
  );
};

export default PokemonDetailsCard;