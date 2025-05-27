export function compareDifficulties(a: string, b: string): number {
  const levels: { [key: string]: number } = {
    LOW: 1,
    MIDDLE: 2,
    HIGH: 3,
    HIGHEST: 4,
  };

  if (levels[a] === undefined || levels[b] === undefined) {
    throw new Error("Invalid input. Both strings must be one of: 'LOW', 'MIDDLE', 'HIGH', 'HIGHEST'");
  }

  return levels[a] - levels[b];
}
