/** Versioned, serializable Mulberry32 state. Not for cryptographic use. */
export interface RandomSource {
  nextUint32(): number;
  nextFloat(): number;
  nextInt(min: number, max: number): number;
  snapshot(): string;
}
const RANGE = 0x100000000;
export function createRandom(seed: number): RandomSource {
  if (!Number.isInteger(seed) || seed < 0 || seed >= RANGE) throw new RangeError('Seed must be an unsigned 32-bit integer');
  let state = seed >>> 0;
  function nextUint32(): number {
    state = (state + 0x6D2B79F5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), state | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (t ^ (t >>> 14)) >>> 0;
  }
  return {
    nextUint32,
    nextFloat: () => nextUint32() / RANGE,
    nextInt(min, max) {
      if (!Number.isSafeInteger(min) || !Number.isSafeInteger(max) || max < min || max - min >= RANGE) throw new RangeError('Invalid integer range');
      const span = max - min + 1;
      const limit = RANGE - RANGE % span;
      let value: number;
      do { value = nextUint32(); } while (value >= limit);
      return min + value % span;
    },
    snapshot: () => `mulberry32:v1:${state.toString(16).padStart(8, '0')}`,
  };
}
export function restoreRandom(snapshot: string): RandomSource {
  if (typeof snapshot !== 'string' || !/^mulberry32:v1:[0-9a-f]{8}$/.test(snapshot)) throw new Error('Invalid random state');
  return createRandom(Number.parseInt(snapshot.slice(-8), 16));
}
