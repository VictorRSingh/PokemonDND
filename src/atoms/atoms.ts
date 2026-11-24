import { Character } from '@/classes/Character';
import { GameTable, loadGame, request } from "@/lib/game-client";
import toast from "react-hot-toast";
import { Pokemon } from '@/classes/Pokemon';
import { atom } from 'jotai';

export const pokemonListAtom = atom<Pokemon[]>([]);
export const characterTableAtom = atom<GameTable>();
export const selectedCharacterAtom = atom<Character>();
export const selectedPokemonAtom = atom<Pokemon>();
export const gameBusyAtom = atom(false);
export const gameErrorAtom = atom<string | null>(null);
export const gameActionAtom = atom(null, async (get, set, action?: {path: string; method: string; body?: unknown}) => {
  if (get(gameBusyAtom)) return false;
  set(gameBusyAtom, true);
  set(gameErrorAtom, null);
  let saved = false;
  try {
    if (action) { await request(action.path, action.method, action.body); saved = true; }
    const table = await loadGame();
    set(characterTableAtom, table);
    const previous = get(selectedCharacterAtom);
    const character = previous ? table.read(previous.id) : undefined;
    set(selectedCharacterAtom, character);
    const pokemon = get(selectedPokemonAtom);
    set(selectedPokemonAtom, character?.ownedPokemon.find(p => p.id === pokemon?.id));
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Database request failed";
    if (!action || saved) { set(characterTableAtom, undefined); set(gameErrorAtom, saved ? `Change saved, but reload failed: ${message}` : message); }
    toast.error(message);
    return false;
  } finally { set(gameBusyAtom, false); }
});
