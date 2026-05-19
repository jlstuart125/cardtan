// ═══════════════════════════════════════════════════════
// CARDTAN — Card Definitions & Deck Generation
// Framework-free pure TypeScript. No Svelte imports.
// ═══════════════════════════════════════════════════════

import type { CardDefinition, CardInstance, CardCategory } from './types.js';

// ─── Card Library ────────────────────────────────────
// To add a new card: add a CardDefinition here and it's available in decks.
export const CARD_DEFINITIONS: Record<string, CardDefinition> = {

  // ── BUILDINGS (stack: building) ──────────────────
  library: {
    id: 'library',
    name: 'Library',
    category: 'building',
    flavor: 'Knowledge endures when stone does not.',
    cost: { ore: 1, grain: 1 },
    effects: [{ type: 'gain_vp', amount: 1 }],
    vpValue: 1,
    playTarget: 'self',
    oneTimeUse: false,
  },
  wealthy_town: {
    id: 'wealthy_town',
    name: 'Wealthy Town',
    category: 'building',
    flavor: 'Merchants come from leagues around.',
    cost: { gold: 2 },
    effects: [{ type: 'gain_vp', amount: 1 }],
    vpValue: 1,
    playTarget: 'self',
    oneTimeUse: false,
  },
  sea_harbor: {
    id: 'sea_harbor',
    name: 'Sea Harbor',
    category: 'building',
    flavor: 'Trade at the tide\'s advantage.',
    cost: { wood: 2, ore: 1 },
    effects: [{ type: 'sea_harbor' }],
    vpValue: 0,
    playTarget: 'self',
    oneTimeUse: false,
  },
  market: {
    id: 'market',
    name: 'Market',
    category: 'building',
    flavor: 'Where coin flows, influence follows.',
    cost: { wood: 1, brick: 1, grain: 1 },
    effects: [{ type: 'gain_trade', amount: 1 }],
    vpValue: 0,
    playTarget: 'self',
    oneTimeUse: false,
  },
  smithy: {
    id: 'smithy',
    name: 'Smithy',
    category: 'building',
    flavor: 'Iron shaped by fire, men shaped by iron.',
    cost: { ore: 2, wood: 1 },
    effects: [{ type: 'gain_strength', amount: 1 }],
    vpValue: 0,
    playTarget: 'self',
    oneTimeUse: false,
  },
  granary: {
    id: 'granary',
    name: 'Granary',
    category: 'building',
    flavor: 'A full storehouse means a fed army.',
    cost: { wood: 1, grain: 2 },
    effects: [{ type: 'hand_capacity', delta: 1 }],
    vpValue: 0,
    playTarget: 'self',
    oneTimeUse: false,
  },
  watchtower: {
    id: 'watchtower',
    name: 'Watchtower',
    category: 'building',
    flavor: 'See them before they see you.',
    cost: { ore: 1, wood: 2 },
    effects: [{ type: 'gain_strength', amount: 1 }, { type: 'remove_brigand' }],
    vpValue: 0,
    playTarget: 'self',
    oneTimeUse: false,
  },
  trading_post: {
    id: 'trading_post',
    name: 'Trading Post',
    category: 'building',
    flavor: 'Distant goods for local gold.',
    cost: { wood: 2, wool: 1 },
    effects: [{ type: 'gain_trade', amount: 2 }],
    vpValue: 0,
    playTarget: 'self',
    oneTimeUse: false,
  },

  // ── ACTIONS (stack: action) ───────────────────────
  merchants_feast: {
    id: 'merchants_feast',
    name: "Merchant's Feast",
    category: 'action',
    flavor: 'Abundance shared is fortune doubled.',
    cost: { grain: 2 },
    effects: [{ type: 'gain_resource', resource: 'gold', amount: 2 }],
    vpValue: 0,
    playTarget: 'none',
    oneTimeUse: true,
  },
  timber_delivery: {
    id: 'timber_delivery',
    name: 'Timber Delivery',
    category: 'action',
    flavor: 'The forest offers its bounty.',
    cost: {},
    effects: [{ type: 'gain_resource', resource: 'wood', amount: 2 }],
    vpValue: 0,
    playTarget: 'none',
    oneTimeUse: true,
  },
  brick_kiln: {
    id: 'brick_kiln',
    name: 'Brick Kiln',
    category: 'action',
    flavor: 'Clay transformed by fire.',
    cost: {},
    effects: [{ type: 'gain_resource', resource: 'brick', amount: 2 }],
    vpValue: 0,
    playTarget: 'none',
    oneTimeUse: true,
  },
  ore_strike: {
    id: 'ore_strike',
    name: 'Ore Strike',
    category: 'action',
    flavor: 'A vein of fortune beneath your feet.',
    cost: { grain: 1 },
    effects: [{ type: 'gain_resource', resource: 'ore', amount: 3 }],
    vpValue: 0,
    playTarget: 'none',
    oneTimeUse: true,
  },
  wool_harvest: {
    id: 'wool_harvest',
    name: 'Wool Harvest',
    category: 'action',
    flavor: 'The flocks have been generous.',
    cost: {},
    effects: [{ type: 'gain_resource', resource: 'wool', amount: 2 }],
    vpValue: 0,
    playTarget: 'none',
    oneTimeUse: true,
  },
  brigand_raid: {
    id: 'brigand_raid',
    name: 'Brigand Raid',
    category: 'action',
    flavor: 'Chaos is a tool for the cunning.',
    cost: { ore: 1 },
    effects: [{ type: 'steal_resource', resource: 'gold' }],
    vpValue: 0,
    playTarget: 'opponent',
    oneTimeUse: true,
  },
  conscription: {
    id: 'conscription',
    name: 'Conscription',
    category: 'action',
    flavor: 'Every able body serves the realm.',
    cost: { grain: 1, gold: 1 },
    effects: [{ type: 'gain_strength', amount: 2 }],
    vpValue: 0,
    playTarget: 'none',
    oneTimeUse: true,
  },
  caravan: {
    id: 'caravan',
    name: 'Caravan',
    category: 'action',
    flavor: 'Safe passage means steady profit.',
    cost: { wool: 1 },
    effects: [{ type: 'gain_trade', amount: 2 }, { type: 'gain_resource', resource: 'gold', amount: 1 }],
    vpValue: 0,
    playTarget: 'none',
    oneTimeUse: true,
  },

  // ── HEROES (stack: hero) ─────────────────────────
  merchant_prince: {
    id: 'merchant_prince',
    name: 'Merchant Prince',
    category: 'hero',
    flavor: 'His word moves markets. His gold moves armies.',
    cost: { gold: 2, grain: 1 },
    effects: [{ type: 'gain_trade', amount: 3 }, { type: 'gain_vp', amount: 1 }],
    vpValue: 1,
    playTarget: 'self',
    oneTimeUse: false,
  },
  knight_errant: {
    id: 'knight_errant',
    name: 'Knight Errant',
    category: 'hero',
    flavor: 'No wall stops the blade sworn to justice.',
    cost: { ore: 2, wool: 1 },
    effects: [{ type: 'gain_strength', amount: 3 }],
    vpValue: 0,
    playTarget: 'self',
    oneTimeUse: false,
  },
  master_builder: {
    id: 'master_builder',
    name: 'Master Builder',
    category: 'hero',
    flavor: 'In stone and timber, he writes his name.',
    cost: { ore: 1, wood: 2, grain: 1 },
    effects: [{ type: 'gain_vp', amount: 1 }, { type: 'hand_capacity', delta: 1 }],
    vpValue: 1,
    playTarget: 'self',
    oneTimeUse: false,
  },
  harbor_master: {
    id: 'harbor_master',
    name: 'Harbor Master',
    category: 'hero',
    flavor: 'He knows every tide by name.',
    cost: { wood: 1, gold: 2 },
    effects: [{ type: 'sea_harbor' }, { type: 'gain_trade', amount: 2 }],
    vpValue: 0,
    playTarget: 'self',
    oneTimeUse: false,
  },
  war_chief: {
    id: 'war_chief',
    name: 'War Chief',
    category: 'hero',
    flavor: 'Victory tastes like iron.',
    cost: { ore: 3, grain: 1 },
    effects: [{ type: 'gain_strength', amount: 4 }, { type: 'gain_vp', amount: 1 }],
    vpValue: 1,
    playTarget: 'self',
    oneTimeUse: false,
  },
  wool_baroness: {
    id: 'wool_baroness',
    name: 'Wool Baroness',
    category: 'hero',
    flavor: 'She clothed the north, and the north remembered.',
    cost: { wool: 2, gold: 1 },
    effects: [{ type: 'gain_trade', amount: 2 }, { type: 'gain_resource', resource: 'wool', amount: 2 }],
    vpValue: 0,
    playTarget: 'self',
    oneTimeUse: false,
  },

  // ── EVENTS (stack: event) ────────────────────────
  golden_age: {
    id: 'golden_age',
    name: 'Golden Age',
    category: 'event',
    flavor: 'The realm prospers as never before.',
    cost: {},
    effects: [{ type: 'gain_resource', resource: 'gold', amount: 1 }],
    vpValue: 0,
    playTarget: 'none',
    oneTimeUse: true,
  },
  plague_card: {
    id: 'plague_card',
    name: 'Plague Season',
    category: 'event',
    flavor: 'Even the mighty fall ill.',
    cost: {},
    effects: [{ type: 'gain_strength', amount: -1 }],
    vpValue: 0,
    playTarget: 'opponent',
    oneTimeUse: true,
  },
  bountiful_harvest: {
    id: 'bountiful_harvest',
    name: 'Bountiful Harvest',
    category: 'event',
    flavor: 'The earth gives freely this season.',
    cost: {},
    effects: [{ type: 'gain_resource', resource: 'grain', amount: 2 }],
    vpValue: 0,
    playTarget: 'none',
    oneTimeUse: true,
  },
  festival: {
    id: 'festival',
    name: 'Festival',
    category: 'event',
    flavor: 'Joy and coin flow together.',
    cost: { grain: 1 },
    effects: [{ type: 'gain_trade', amount: 1 }, { type: 'gain_resource', resource: 'gold', amount: 1 }],
    vpValue: 0,
    playTarget: 'none',
    oneTimeUse: true,
  },
  war_spoils: {
    id: 'war_spoils',
    name: 'War Spoils',
    category: 'event',
    flavor: 'The victor claims everything.',
    cost: {},
    effects: [{ type: 'gain_strength', amount: 2 }, { type: 'gain_resource', resource: 'ore', amount: 1 }],
    vpValue: 0,
    playTarget: 'none',
    oneTimeUse: true,
  },
  diplomatic_marriage: {
    id: 'diplomatic_marriage',
    name: 'Diplomatic Marriage',
    category: 'event',
    flavor: 'Alliances sealed with vows endure.',
    cost: { wool: 1, gold: 1 },
    effects: [{ type: 'gain_vp', amount: 1 }, { type: 'gain_trade', amount: 1 }],
    vpValue: 0,
    playTarget: 'none',
    oneTimeUse: true,
  },
  census: {
    id: 'census',
    name: 'Census',
    category: 'event',
    flavor: 'Count heads, count resources, count power.',
    cost: {},
    effects: [{ type: 'draw_cards', count: 2 }],
    vpValue: 0,
    playTarget: 'none',
    oneTimeUse: true,
  },
};

// ─── Deck Compositions ───────────────────────────────
const DECK_CONFIG: Record<CardCategory, { ids: string[]; copies: number }[]> = {
  building: [
    { ids: ['library', 'wealthy_town', 'sea_harbor', 'market', 'smithy', 'granary', 'watchtower', 'trading_post'], copies: 2 },
  ],
  action: [
    { ids: ['merchants_feast', 'timber_delivery', 'brick_kiln', 'ore_strike', 'wool_harvest', 'brigand_raid', 'conscription', 'caravan'], copies: 2 },
  ],
  hero: [
    { ids: ['merchant_prince', 'knight_errant', 'master_builder', 'harbor_master', 'war_chief', 'wool_baroness'], copies: 2 },
  ],
  event: [
    { ids: ['golden_age', 'plague_card', 'bountiful_harvest', 'festival', 'war_spoils', 'diplomatic_marriage', 'census'], copies: 2 },
  ],
};

let _instanceCounter = 0;
export function newInstance(defId: string): CardInstance {
  return { instanceId: `card-${++_instanceCounter}-${defId}`, definitionId: defId };
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function buildDeck(category: CardCategory): CardInstance[] {
  const config = DECK_CONFIG[category];
  const cards: CardInstance[] = [];
  for (const group of config) {
    for (const id of group.ids) {
      for (let c = 0; c < group.copies; c++) {
        cards.push(newInstance(id));
      }
    }
  }
  return shuffle(cards);
}

export function getDefinition(instanceOrId: CardInstance | string): CardDefinition {
  const id = typeof instanceOrId === 'string' ? instanceOrId : instanceOrId.definitionId;
  const def = CARD_DEFINITIONS[id];
  if (!def) throw new Error(`Unknown card definition: ${id}`);
  return def;
}
