// ═══════════════════════════════════════════════════════
// CARDTAN — Random Handle Generator
// Produces friendly two-word handles like "BraveBison"
// ═══════════════════════════════════════════════════════

const ADJECTIVES = [
  'Brave', 'Bold', 'Swift', 'Calm', 'Keen', 'Wise', 'Stern', 'Glad',
  'Dark', 'Fair', 'Grim', 'Iron', 'Gold', 'Wild', 'True', 'Free',
  'Bright', 'Sharp', 'Stout', 'Proud', 'Lone', 'Red', 'Blue', 'Gray',
  'Dread', 'Fell', 'Merry', 'Sly', 'Quick', 'Just',
];

const ANIMALS = [
  'Bison', 'Kestrel', 'Wolf', 'Bear', 'Fox', 'Hawk', 'Lynx', 'Raven',
  'Stag', 'Boar', 'Crane', 'Drake', 'Eagle', 'Falcon', 'Grouse', 'Heron',
  'Ibex', 'Jackal', 'Kite', 'Marten', 'Newt', 'Osprey', 'Puma', 'Quail',
  'Roach', 'Stoat', 'Teal', 'Viper', 'Wren', 'Yak',
];

const usedHandles = new Set<string>();

export function generateHandle(): string {
  const available = ADJECTIVES.flatMap(a =>
    ANIMALS.map(n => `${a}${n}`)
  ).filter(h => !usedHandles.has(h));

  if (available.length === 0) {
    // Fallback if all combinations used (unlikely)
    usedHandles.clear();
    return generateHandle();
  }

  const handle = available[Math.floor(Math.random() * available.length)];
  usedHandles.add(handle);
  return handle;
}
