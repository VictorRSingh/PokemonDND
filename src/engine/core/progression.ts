export function validateLevel(level: number): void {
  if (!Number.isInteger(level) || level < 1 || level > 20) throw new RangeError('Level must be 1–20');
}
export function getProficiencyBonus(level: number): number { validateLevel(level); return 2 + Math.floor((level - 1) / 4); }
export function getStabBonus(level: number): number { validateLevel(level); return Math.floor((level + 1) / 4); }
