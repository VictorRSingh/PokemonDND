import { Character } from "@/classes/Character";
import { Pokemon } from "@/classes/Pokemon";
export class GameTable {
  constructor(public records: Character[]) {}
  read(id: string) { return this.records.find(c => c.id === id); }
  readByName(name: string) { return this.records.find(c => c.name === name); }
  exists(name: string) { return !!this.readByName(name); }
  getNumberOfRecords() { return this.records.length; }
  getExistingRecords() { return this.records; }
}
export async function request<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  const response = await fetch(path, { method, credentials: "same-origin", cache: "no-store", ...(body === undefined ? {} : {headers: {"Content-Type": "application/json"}, body: JSON.stringify(body)}) });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.issues?.map((i: {path: string[]; message: string}) => `${i.path.join(".")}: ${i.message}`).join("; ") || error?.error || `Request failed (${response.status})`);
  }
  return response.status === 204 ? undefined as T : response.json();
}
type CharacterRow = {id: string; name: string};
type PokemonRow = {id: string; name: string; number: number; data: Partial<Pokemon>};
export function hydratePokemon(row: PokemonRow) { return new Pokemon({...row.data, id: row.id, name: row.name, number: row.number}); }
export async function loadGame() {
  const rows = await request<CharacterRow[]>("/api/characters");
  return new GameTable(await Promise.all(rows.map(async row => Object.assign(new Character(row.name, (await request<PokemonRow[]>(`/api/characters/${row.id}/pokemon`)).map(hydratePokemon)), {id: row.id}))));
}
