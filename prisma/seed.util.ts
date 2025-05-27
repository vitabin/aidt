const COLOR = "\x1b[33m%s\x1b[0m";

export function seedLog(message: string, colored?: boolean) {
  const _message = ["🌱 " + message];
  if (colored) _message.unshift(COLOR);
}

export function fancyWelcomeMessage() {}
