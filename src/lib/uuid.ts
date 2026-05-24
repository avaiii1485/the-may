// RFC 4122 v4 UUID, generated client-side so a locally-created meal carries the
// same id the server row will have — no id reconciliation needed when the outbox
// syncs. Prefers crypto.getRandomValues; falls back to Math.random where the
// crypto API is unavailable (older RN runtimes).

function randomBytes16(): Uint8Array {
  const bytes = new Uint8Array(16);
  const c = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;
  if (c && typeof c.getRandomValues === 'function') {
    c.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return bytes;
}

export function uuidv4(): string {
  const b = randomBytes16();
  b[6] = ((b[6] as number) & 0x0f) | 0x40; // version 4
  b[8] = ((b[8] as number) & 0x3f) | 0x80; // variant 10
  const hex: string[] = [];
  for (let i = 0; i < 256; i++) hex.push((i + 0x100).toString(16).slice(1));
  return (
    (hex[b[0] as number] as string) +
    hex[b[1] as number] +
    hex[b[2] as number] +
    hex[b[3] as number] +
    '-' +
    hex[b[4] as number] +
    hex[b[5] as number] +
    '-' +
    hex[b[6] as number] +
    hex[b[7] as number] +
    '-' +
    hex[b[8] as number] +
    hex[b[9] as number] +
    '-' +
    hex[b[10] as number] +
    hex[b[11] as number] +
    hex[b[12] as number] +
    hex[b[13] as number] +
    hex[b[14] as number] +
    hex[b[15] as number]
  );
}
