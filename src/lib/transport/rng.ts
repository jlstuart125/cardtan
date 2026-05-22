// ═══════════════════════════════════════════════════════
// CARDTAN — Deterministic RNG
// Seeded by both peer IDs for reproducible randomness.
// Uses a simple mulberry32 PRNG.
// ═══════════════════════════════════════════════════════

/** Produce a 32-bit seed from two peer ID strings */
function seedFromPeerIds(a: string, b: string): number {
  // Sort so order doesn't matter
  const combined = [a, b].sort().join('|');
  let h = 0x811c9dc5;
  for (let i = 0; i < combined.length; i++) {
    h ^= combined.charCodeAt(i);
    h = (Math.imul(h, 0x01000193) >>> 0);
  }
  return h;
}

/** mulberry32 PRNG — returns [0, 1) */
export function makeRng(hostPeerId: string, joinerPeerId: string): () => number {
  let s = seedFromPeerIds(hostPeerId, joinerPeerId);
  return function rng(): number {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Returns a random integer in [min, max] inclusive using the given rng */
export function randomInt(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}
