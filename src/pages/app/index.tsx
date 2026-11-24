import { requireSession } from "@/lib/require-session";
import { characterTableAtom, selectedCharacterAtom, gameActionAtom, gameBusyAtom } from "@/atoms/atoms";
import { Character } from "@/classes/Character";

import Modal from "@/components/Modal";
import { useAtom, useSetAtom, useAtomValue } from "jotai";
import { useRouter } from "next/router";
import { useState } from "react";
import toast from "react-hot-toast";

export default function App() {
  const router = useRouter();
  const table = useAtomValue(characterTableAtom);
  const run = useSetAtom(gameActionAtom);
  const busy = useAtomValue(gameBusyAtom);
  const [selected, setSelected] = useAtom(selectedCharacterAtom);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [deleting, setDeleting] = useState<Character | null>(null);
  const [search, setSearch] = useState("");
  const characters = table?.records ?? [];
  const total = characters.reduce((sum, c) => sum + c.ownedPokemon.length, 0);
  const visible = characters.filter(c => c.name.toLowerCase().includes(search.trim().toLowerCase()));

  async function create() {
    if (!table || busy) return;
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 15 || /[/?#]/.test(trimmed)) {
      toast.error("Enter a valid character name (1–15 characters, no /, ? or #).");
      return;
    }
    if (table.exists(trimmed)) {
      toast.error("Character with this name already exists");
      return;
    }
    if (!await run({path: "/api/characters", method: "POST", body: {name: trimmed}})) return;
    setCreating(false);
    setName("");
    toast.success("Character created successfully");
  }

  async function remove() {
    if (!table || !deleting || busy) return;
    if (!await run({path: `/api/characters/${deleting.id}`, method: "DELETE"})) return;
    if (selected?.id === deleting.id) setSelected(undefined);
    setDeleting(null);
    toast.success("Character deleted successfully");
  }

  function open(character: Character) {
    setSelected(character);
    void router.push({ pathname: "/dm/[name]", query: { name: character.name } });
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-yellow-400">Trainer headquarters</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Your adventure</h1>
          <p className="mt-2 text-slate-400">Manage your characters and their Pokémon teams.</p>
        </div>
        <button disabled={!table} onClick={() => { setName(""); setCreating(true); }} className="rounded-lg bg-yellow-400 px-5 py-3 font-semibold text-slate-950 hover:bg-yellow-300 disabled:opacity-50">+ Create character</button>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[{ label: "Characters", value: characters.length }, { label: "Owned Pokémon", value: total }, { label: "Characters with Pokémon", value: characters.filter(c => c.ownedPokemon.length > 0).length }].map(stat => (
          <div key={stat.label} className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold text-yellow-400">{table ? stat.value : "—"}</p>
          </div>
        ))}
      </div>
      <section className="mt-10">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Your characters</h2>
          {characters.length > 0 && <input aria-label="Search characters" placeholder="Search characters..." value={search} onChange={e => setSearch(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-slate-100" />}
        </div>
        {!table ? <p role="status" className="text-slate-400">Loading characters...</p> : characters.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-700 p-10 text-center">
            <h3 className="text-xl font-semibold">Your journey starts here</h3>
            <p className="mt-2 text-slate-400">Create your first character to start building a Pokémon team.</p>
            <button onClick={() => { setName(""); setCreating(true); }} className="mt-5 rounded-lg bg-yellow-400 px-5 py-2 font-semibold text-slate-950">Create your first character</button>
          </div>
        ) : visible.length === 0 ? <p className="text-slate-400">No matching characters.</p> : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map(c => (
              <article key={c.id} className="flex flex-col rounded-xl border border-slate-800 bg-slate-900 p-5">
                <div className="flex items-center gap-4">
                  <div aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-xl font-bold text-yellow-400">{c.name.slice(0, 1).toUpperCase()}</div>
                  <div className="min-w-0"><h3 className="break-words text-lg font-semibold">{c.name}</h3><p className="text-sm text-slate-400">{c.ownedPokemon.length} Pokémon</p></div>
                </div>
                <div className="mt-5 min-h-[48px] text-sm text-slate-400">{c.ownedPokemon.length ? c.ownedPokemon.slice(0, 3).map(p => p.name).join(", ") + (c.ownedPokemon.length > 3 ? ` +${c.ownedPokemon.length - 3} more` : "") : "No Pokémon yet"}</div>
                <div className="mt-auto flex gap-2 border-t border-slate-800 pt-4">
                  <button onClick={() => open(c)} className="flex-1 rounded-lg bg-yellow-400 px-3 py-2 font-semibold text-slate-950 hover:bg-yellow-300">Open character</button>
                  <button onClick={() => setDeleting(c)} aria-label={`Delete ${c.name}`} className="rounded-lg border border-slate-700 px-3 py-2 text-red-400 hover:bg-slate-800">Delete</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      <p className="mt-8 text-xs text-slate-500">Characters and Pokémon are saved to your account in PostgreSQL.</p>
      <Modal modal_id="create_character" modalTitle="Create character" showModal={creating} setShowModal={setCreating} actionButton={<button type="submit" form="character-form" disabled={busy || !name.trim()} className="rounded bg-green-600 px-4 py-2 text-white disabled:opacity-50">Create</button>}>
        <form id="character-form" onSubmit={e => { e.preventDefault(); create(); }}>
          <label htmlFor="character-name" className="font-semibold">Character name</label>
          <input id="character-name" autoFocus required maxLength={15} value={name} onChange={e => setName(e.target.value)} className="mt-2 w-full rounded border border-slate-400 px-3 py-2" />
        </form>
      </Modal>
      <Modal modal_id="delete_character" modalTitle="Delete character?" showModal={!!deleting} setShowModal={v => { if (!v) setDeleting(null); }} actionButton={<button onClick={remove} disabled={busy} className="rounded bg-red-600 px-4 py-2 text-white">Delete permanently</button>}>
        <p>Delete {deleting?.name} and all of their owned Pokémon? This cannot be undone.</p>
      </Modal>
    </div>
  );
}

export const getServerSideProps = requireSession;
