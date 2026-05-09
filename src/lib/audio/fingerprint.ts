export function hashBytes(bytes: Uint8Array): string {
  let hash = 0x811c9dc5;

  for (let index = 0; index < bytes.length; index += 1) {
    hash ^= bytes[index] ?? 0;
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function hashString(value: string): string {
  return hashBytes(new TextEncoder().encode(value));
}
