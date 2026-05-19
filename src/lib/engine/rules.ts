// ═══════════════════════════════════════════════════════
// CARDTAN — Build Validation & Game Rules
// Framework-free pure TypeScript. No Svelte imports.
// ═══════════════════════════════════════════════════════

import type {
  GameState,
  PlayerState,
  PlayerId,
  RoadId,
  SettlementId,
  ResourceType,
  ResourceCounts,
  CardInstance,
} from './types.js';
import { getDefinition } from './cards.js';

// ─── Resource Helpers ────────────────────────────────
export function totalResources(player: PlayerState): number {
  return sumResourcesFromRegions(player);
}

export function sumResourcesFromRegions(player: PlayerState): number {
  let total = 0;
  for (const region of player.principality.regions) {
    total += region.level;
  }
  return total;
}

export function getResourceTotal(player: PlayerState, resource: ResourceType): number {
  return player.principality.regions
    .filter(r => r.resource === resource)
    .reduce((sum, r) => sum + r.level, 0);
}

export function canAfford(player: PlayerState, cost: Partial<ResourceCounts>): boolean {
  for (const [res, amount] of Object.entries(cost) as [ResourceType, number][]) {
    if (amount && getResourceTotal(player, res) < amount) return false;
  }
  return true;
}

// ─── Build Validation ────────────────────────────────
export const BUILD_COSTS = {
  road: { wood: 1, brick: 1 } as Partial<ResourceCounts>,
  settlement: { wood: 1, brick: 1, grain: 1, wool: 1 } as Partial<ResourceCounts>,
  city: { ore: 3, grain: 2 } as Partial<ResourceCounts>,
} as const;

export function canBuildRoad(state: GameState, playerId: PlayerId, roadId: RoadId): { ok: boolean; reason?: string } {
  const player = state.players[playerId];
  if (state.phase !== 'action') return { ok: false, reason: 'Not in action phase' };
  if (state.activePlayer !== playerId) return { ok: false, reason: 'Not your turn' };

  const road = player.principality.roads.find(r => r.id === roadId);
  if (!road) return { ok: false, reason: 'Road not found' };
  if (road.built) return { ok: false, reason: 'Road already built' };

  // Must be adjacent to an existing settlement or built road
  const connectedSettlements = road.connects;
  const hasAdjacentStructure = connectedSettlements.some(sId => {
    const node = player.principality.settlements.find(s => s.id === sId);
    if (node && node.type !== 'empty') return true;
    // Check if a built road connects to this settlement
    return player.principality.roads.some(r => r.built && r.connects.includes(sId));
  });

  if (!hasAdjacentStructure) return { ok: false, reason: 'Road must connect to your network' };
  if (!canAfford(player, BUILD_COSTS.road)) return { ok: false, reason: 'Insufficient resources' };

  return { ok: true };
}

export function canBuildSettlement(state: GameState, playerId: PlayerId, settlementId: SettlementId): { ok: boolean; reason?: string } {
  const player = state.players[playerId];
  if (state.phase !== 'action') return { ok: false, reason: 'Not in action phase' };
  if (state.activePlayer !== playerId) return { ok: false, reason: 'Not your turn' };

  const node = player.principality.settlements.find(s => s.id === settlementId);
  if (!node) return { ok: false, reason: 'Settlement not found' };
  if (node.type !== 'empty') return { ok: false, reason: 'Location already occupied' };

  // Must be adjacent to a built road
  const adjacentRoad = player.principality.roads.find(
    r => r.built && r.connects.includes(settlementId)
  );
  if (!adjacentRoad) return { ok: false, reason: 'Must be adjacent to a road' };

  // Must have 4 open region slots (all regions are pre-assigned in MVP; just check node is empty)
  if (!canAfford(player, BUILD_COSTS.settlement)) return { ok: false, reason: 'Insufficient resources' };

  return { ok: true };
}

export function canBuildCity(state: GameState, playerId: PlayerId, settlementId: SettlementId): { ok: boolean; reason?: string } {
  const player = state.players[playerId];
  if (state.phase !== 'action') return { ok: false, reason: 'Not in action phase' };
  if (state.activePlayer !== playerId) return { ok: false, reason: 'Not your turn' };

  const node = player.principality.settlements.find(s => s.id === settlementId);
  if (!node) return { ok: false, reason: 'Settlement not found' };
  if (node.type !== 'settlement') return { ok: false, reason: 'Can only upgrade a Settlement' };

  if (!canAfford(player, BUILD_COSTS.city)) return { ok: false, reason: 'Insufficient resources' };

  return { ok: true };
}

export function canBankTrade(state: GameState, playerId: PlayerId, give: ResourceType, receive: ResourceType): { ok: boolean; reason?: string } {
  const player = state.players[playerId];
  if (state.phase !== 'action') return { ok: false, reason: 'Not in action phase' };
  if (state.activePlayer !== playerId) return { ok: false, reason: 'Not your turn' };
  if (give === receive) return { ok: false, reason: 'Cannot trade same resource' };

  const cost = player.seaHarbor ? 2 : 3;
  if (getResourceTotal(player, give) < cost) {
    return { ok: false, reason: `Need ${cost}x ${give} for bank trade` };
  }

  return { ok: true };
}

export function canDrawCard(state: GameState, playerId: PlayerId): boolean {
  const player = state.players[playerId];
  return state.phase === 'replenish' &&
    state.activePlayer === playerId &&
    player.hand.length < player.handCapacity;
}

export function canEndTurn(state: GameState, playerId: PlayerId): boolean {
  const player = state.players[playerId];
  return state.activePlayer === playerId &&
    state.phase !== 'roll' &&
    player.hand.length <= player.handCapacity;
}

// ─── VP Scan ─────────────────────────────────────────
export function scanVP(player: PlayerState): number {
  let vp = 0;

  // Settlements and cities
  for (const node of player.principality.settlements) {
    if (node.type === 'settlement') vp += 1;
    else if (node.type === 'city') vp += 2;
  }

  // Tokens
  if (player.tradeToken) vp += 1;
  if (player.strengthToken) vp += 1;

  // Played cards that grant VP
  for (const inst of player.playedCards) {
    try {
      const def = getDefinition(inst);
      vp += def.vpValue;
    } catch {
      // ignore unknown cards
    }
  }

  return vp;
}

// ─── Phase Transition ────────────────────────────────
export function nextPhase(current: import('./types.js').TurnPhase): import('./types.js').TurnPhase {
  const order: import('./types.js').TurnPhase[] = ['roll', 'action', 'replenish', 'exchange'];
  const idx = order.indexOf(current);
  return order[(idx + 1) % order.length];
}

// ─── Win Check ───────────────────────────────────────
export function checkWinner(state: GameState): PlayerId | null {
  for (const id of ['p1', 'p2'] as PlayerId[]) {
    if (state.players[id].vp >= state.targetVP) return id;
  }
  return null;
}

// ─── Play Card Validation ────────────────────────────
export function canPlayCard(state: GameState, playerId: PlayerId, instanceId: string): { ok: boolean; reason?: string } {
  const player = state.players[playerId];
  if (state.phase !== 'action') return { ok: false, reason: 'Can only play cards in action phase' };
  if (state.activePlayer !== playerId) return { ok: false, reason: 'Not your turn' };

  const inst = player.hand.find((c: CardInstance) => c.instanceId === instanceId);
  if (!inst) return { ok: false, reason: 'Card not in hand' };

  const def = getDefinition(inst);
  if (!canAfford(player, def.cost)) return { ok: false, reason: 'Insufficient resources for card cost' };

  return { ok: true };
}
