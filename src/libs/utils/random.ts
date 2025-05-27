export function randInt(start: number, stop: number) {
  return Math.floor(Math.random() * (stop - start)) + start;
}

export function randomChoice(iterable: any) {
  return iterable[randInt(0, iterable.length)];
}
