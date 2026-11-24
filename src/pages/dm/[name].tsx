import { requireSession } from "@/lib/require-session";

import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAtom, useSetAtom, useAtomValue } from "jotai";
import { characterTableAtom, selectedCharacterAtom, selectedPokemonAtom, gameActionAtom, gameBusyAtom } from "@/atoms/atoms";
import PokemonGenerator from "@/components/pokemon/PokemonGenerator";
import PokemonWidget from "@/components/pokemon/PokemonWidget";
import PokemonDetails from "@/components/pokemon/PokemonDetails";
import toast from "react-hot-toast";

export default function CharacterPage() {
  const router = useRouter();
  const run = useSetAtom(gameActionAtom);
  const busy = useAtomValue(gameBusyAtom);
  const name = router.query.name;
  const [table] = useAtom(characterTableAtom);
  const [character, setCharacter] = useAtom(selectedCharacterAtom);
  const [selected, setSelected] = useAtom(selectedPokemonAtom);

  useEffect(() => {
    if (!table || typeof name !== "string") return;
    setCharacter(table.readByName(name) || undefined);
  }, [table, name, setCharacter]);

  useEffect(() => {
    setSelected(undefined);
  }, [name, setSelected]);

  const ready = router.isReady && !!table;
  const active = character?.name === name ? character : undefined;
  const team = active?.ownedPokemon ?? [];
  const current = team.find(p => p.id === selected?.id);

  async function removePokemon(id: string) {
    if (!active || !table || busy) return;
    const pokemon = team.find(p => p.id === id);
    if (!pokemon || !window.confirm(`Remove ${pokemon.given_name || pokemon.name} from this team?`)) return;
    if (await run({path: `/api/pokemon/${id}`, method: "DELETE"})) toast.success("Pokemon removed from team");
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <button onClick={() => router.push('/app')} className="mb-6 text-sm font-semibold text-slate-400 hover:text-yellow-400">← All characters</button>
      {!active ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center text-slate-400">{ready ? 'Character not found.' : 'Loading character…'}</div>
      ) : (
        <>
          <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div><p className="text-xs font-bold uppercase tracking-widest text-yellow-400">Trainer headquarters</p><h1 className="mt-2 text-4xl font-bold text-white">{active.name}</h1><p className="mt-2 text-slate-400">Manage your team and prepare for your next adventure.</p></div>
            <PokemonGenerator />
          </header>
          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[{label:'Team size',value:team.length},{label:'Battle ready',value:team.filter(p => (p.current_hit_points ?? p.hit_points)>0).length},{label:'Fainted',value:team.filter(p => p.current_hit_points === 0).length}].map(stat => <div key={stat.label} className="rounded-xl border border-slate-800 bg-slate-900 p-4"><p className="text-sm text-slate-400">{stat.label}</p><p className="mt-1 text-3xl font-bold text-yellow-400">{stat.value}</p></div>)}
          </div>
          <div className="grid items-start gap-6 lg:grid-cols-3">
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <h2 className="mb-4 text-xl font-bold">Your Pokémon</h2>
              {!team.length && <p className="rounded-xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-400">Your team is empty. Use the generator to add your first Pokémon.</p>}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {team.map(p => {
                  const hp = p.current_hit_points ?? p.hit_points;
                  const percent = p.hit_points > 0 ? Math.max(0, Math.min(100, hp / p.hit_points * 100)) : 0;
                  return <div key={p.id} className={`rounded-xl border p-3 ${current?.id === p.id ? 'border-yellow-400 bg-slate-800' : 'border-slate-700 bg-slate-950'}`}>
                    <button type="button" aria-pressed={current?.id === p.id} onClick={() => setSelected(p)} className="flex w-full items-center gap-3 text-left">
                      <img src={p.image} alt="" className="h-16 w-16 object-contain" />
                      <span className="min-w-0 flex-1"><span className="block truncate font-bold">{p.given_name || p.name}</span><span className="block text-xs text-slate-400">{p.name} · Level {p.current_level ?? p.level}</span><span className="mt-2 block text-xs text-slate-300">HP {hp} / {p.hit_points}</span><span className="mt-1 block h-2 overflow-hidden rounded-full bg-slate-700"><span className={`block h-full rounded-full ${percent > 50 ? 'bg-green-500' : percent > 20 ? 'bg-yellow-400' : 'bg-red-500'}`} style={{width: `${percent}%`}} /></span></span>
                    </button>
                    <div className="mt-2 flex justify-end"><button type="button" disabled={busy} onClick={() => p.id && removePokemon(p.id)} className="rounded px-2 py-1 text-xs text-red-400 hover:bg-slate-800">Remove</button></div>
                  </div>;
                })}
              </div>
            </section>
            <section className="min-w-0 rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-6 lg:col-span-2">
              {current ? <><h2 className="mb-5 text-xl font-bold">{current.given_name || current.name} — Character sheet</h2><div className="flex flex-col gap-6 xl:flex-row"><div className="shrink-0"><PokemonWidget key={current.id} /></div><div className="min-w-0 flex-1 overflow-x-auto"><PokemonDetails /></div></div></> : <div className="py-16 text-center"><h2 className="text-xl font-bold">Select a Pokémon</h2><p className="mt-2 text-sm text-slate-400">Choose a team member to view its stats, moves, abilities and HP controls.</p></div>}
            </section>
          </div>
        </>
      )}
    </div>
  );
}

export const getServerSideProps = requireSession;
