// ═══════════════════════════════════════════════════════
// CARDTAN — Game State & Reducer
// Framework-free pure TypeScript. No Svelte imports.
// ═══════════════════════════════════════════════════════

import type {
  GameState,
  PlayerState,
  PlayerId,
  Principality,
  ResourceRegion,
  SettlementNode,
  RoadSegment,
  ResourceType,
  RotationLevel,
  GameAction,
  LogEntry,
  DrawStack,
  CardInstance,
  CardCategory,
  EventDieResult,
} from './types.js';
import { buildDeck, getDefinition, newInstance } from './cards.js';
import { rollDice } from './dice.js';
import {
  canBuildRoad,
  canBuildSettlement,
  canBuildCity,
  canBankTrade,
  canPlayCard,
  canEndTurn,
  scanVP,
  checkWinner,
  getResourceTotal,
  totalResources,
  BUILD_COSTS,
} from './rules.js';

// ─── Principality Builder ────────────────────────────
// 5 settlement nodes, 4 roads connecting them, regions assigned to each
const RESOURCE_POOL: ResourceType[] = ['wood', 'brick', 'grain', 'wool', 'ore', 'gold'];

function randomResource(exclude?: ResourceType[]): ResourceType {
  const pool = exclude ? RESOURCE_POOL.filter(r => !exclude.includes(r)) : RESOURCE_POOL;
  return pool[Math.floor(Math.random() * pool.length)];
}

function buildPrincipality(playerId: PlayerId): Principality {
  const settlements: SettlementNode[] = [];
  const roads: RoadSegment[] = [];
  const regions: ResourceRegion[] = [];

  // 5 settlement nodes
  for (let i = 0; i < 5; i++) {
    settlements.push({
      id: `${playerId}-s${i}`,
      type: 'empty',
      regions: [],
    });
  }

  // 4 roads
  for (let i = 0; i < 4; i++) {
    roads.push({
      id: `${playerId}-r${i}`,
      built: false,
      connects: [`${playerId}-s${i}`, `${playerId}-s${i + 1}`],
    });
  }

  // Assign 4 regions per settlement
  const diceNumbers = [1, 2, 3, 4, 5, 6];
  const positions = ['tl', 'bl', 'tr', 'br'] as const;

  for (const s of settlements) {
    for (const pos of positions) {
      const dice = diceNumbers[Math.floor(Math.random() * diceNumbers.length)];
      const resource = randomResource();
      const regionId = `${s.id}-${pos}`;
      regions.push({
        id: regionId,
        settlementId: s.id,
        position: pos,
        resource,
        diceNumber: dice,
        level: 0,
      });
      s.regions.push(regionId);
    }
  }

  return { playerId, settlements, roads, regions };
}

function buildInitialPlayer(id: PlayerId, name: string): PlayerState {
  const principality = buildPrincipality(id);

  // Give starting settlements (s1 and s2) and road (r1)
  principality.settlements[1].type = 'settlement';
  principality.settlements[2].type = 'settlement';
  principality.roads[1].built = true;

  // Give starting resources (small seed)
  principality.regions[4].level = 1; // s1-tl
  principality.regions[5].level = 1; // s1-bl
  principality.regions[8].level = 1; // s2-tl
  principality.regions[9].level = 1; // s2-bl

  return {
    id,
    name,
    hand: [],
    handCapacity: 3,
    principality,
    playedCards: [],
    tradeToken: false,
    strengthToken: false,
    tradeScore: 0,
    strengthScore: 0,
    seaHarbor: false,
    brigandImmune: false,
    vp: 0, // will be computed
  };
}

// ─── Initial State ───────────────────────────────────
export function initialState(): GameState {
  const p1 = buildInitialPlayer('p1', 'Player 1');
  const p2 = buildInitialPlayer('p2', 'Player 2');

  const state: GameState = {
    status: 'playing',
    winner: null,
    turn: 1,
    activePlayer: 'p1',
    phase: 'roll',
    players: { p1, p2 },
    drawStacks: {
      building: { id: 'building', cards: buildDeck('building') },
      action: { id: 'action', cards: buildDeck('action') },
      hero: { id: 'hero', cards: buildDeck('hero') },
      event: { id: 'event', cards: buildDeck('event') },
    },
    lastRoll: null,
    log: [],
    showPassOverlay: false,
    exchangePending: null,
    searchModalOpen: false,
    searchStack: null,
    searchPayment: null,
    targetVP: 7,
  };

  // Compute initial VP
  state.players.p1.vp = scanVP(state.players.p1);
  state.players.p2.vp = scanVP(state.players.p2);

  return state;
}

// ─── Helpers ─────────────────────────────────────────
let _logId = 0;
function log(state: GameState, playerId: PlayerId, message: string): LogEntry {
  return {
    id: `log-${++_logId}`,
    turn: state.turn,
    playerId,
    message,
    timestamp: Date.now(),
  };
}

function cloneState(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state));
}

/** Deduct resources from region levels, spreading across regions of same type */
function deductResource(state: GameState, playerId: PlayerId, resource: ResourceType, amount: number): void {
  const player = state.players[playerId];
  let remaining = amount;
  for (const region of player.principality.regions) {
    if (remaining <= 0) break;
    if (region.resource === resource && region.level > 0) {
      const take = Math.min(region.level, remaining);
      region.level = (region.level - take) as RotationLevel;
      remaining -= take;
    }
  }
}

function deductCost(state: GameState, playerId: PlayerId, cost: Partial<Record<ResourceType, number>>): void {
  for (const [res, amount] of Object.entries(cost) as [ResourceType, number][]) {
    if (amount) deductResource(state, playerId, res, amount);
  }
}

function addResource(state: GameState, playerId: PlayerId, resource: ResourceType, amount: number): void {
  const player = state.players[playerId];
  let remaining = amount;
  for (const region of player.principality.regions) {
    if (remaining <= 0) break;
    if (region.resource === resource && region.level < 3) {
      const add = Math.min(3 - region.level, remaining);
      region.level = (region.level + add) as RotationLevel;
      remaining -= add;
    }
  }
}

function recomputeVP(state: GameState): void {
  for (const id of ['p1', 'p2'] as PlayerId[]) {
    state.players[id].vp = scanVP(state.players[id]);
  }
}

function opponent(id: PlayerId): PlayerId {
  return id === 'p1' ? 'p2' : 'p1';
}

// ─── Event Die Resolution ────────────────────────────
function resolveEvent(state: GameState, event: EventDieResult, production: number): GameState {
  const active = state.activePlayer;
  const opp = opponent(active);

  // First apply production die to active player's regions
  for (const region of state.players[active].principality.regions) {
    if (region.diceNumber === production && region.level < 3) {
      region.level = (region.level + 1) as RotationLevel;
    }
  }

  switch (event) {
    case 'tournament': {
      const p1s = state.players.p1.strengthScore;
      const p2s = state.players.p2.strengthScore;
      if (p1s > p2s) {
        state.players.p1.strengthToken = true;
        state.players.p2.strengthToken = false;
        state.log.push(log(state, active, `Tournament: Player 1 wins! (${p1s} vs ${p2s}) — Strength Token awarded.`));
      } else if (p2s > p1s) {
        state.players.p2.strengthToken = true;
        state.players.p1.strengthToken = false;
        state.log.push(log(state, active, `Tournament: Player 2 wins! (${p2s} vs ${p1s}) — Strength Token awarded.`));
      } else {
        state.log.push(log(state, active, `Tournament: Tied at ${p1s}! No token changes.`));
      }
      break;
    }
    case 'harvest': {
      for (const pid of ['p1', 'p2'] as PlayerId[]) {
        for (const region of state.players[pid].principality.regions) {
          if (region.resource === 'grain' && region.level < 3) {
            region.level = (region.level + 1) as RotationLevel;
          }
        }
      }
      state.log.push(log(state, active, 'Harvest! All Grain regions +1 for both players.'));
      break;
    }
    case 'brigand': {
      for (const pid of ['p1', 'p2'] as PlayerId[]) {
        const player = state.players[pid];
        if (player.brigandImmune) {
          state.log.push(log(state, active, `${player.name} is immune to Brigand Attack!`));
          continue;
        }
        const total = totalResources(player);
        if (total > 7) {
          for (const region of player.principality.regions) {
            if (region.resource === 'gold' || region.resource === 'wool') {
              region.level = 0;
            }
          }
          state.log.push(log(state, active, `Brigand Attack! ${player.name} lost all Gold and Wool (had ${total} resources).`));
        } else {
          state.log.push(log(state, active, `Brigand Attack! ${player.name} safe (≤7 resources).`));
        }
      }
      break;
    }
    case 'trade': {
      const p1t = state.players.p1.tradeScore;
      const p2t = state.players.p2.tradeScore;
      if (p1t > p2t) {
        state.players.p1.tradeToken = true;
        state.players.p2.tradeToken = false;
        state.log.push(log(state, active, `Trade: Player 1 wins! (${p1t} vs ${p2t}) — Trade Token awarded.`));
      } else if (p2t > p1t) {
        state.players.p2.tradeToken = true;
        state.players.p1.tradeToken = false;
        state.log.push(log(state, active, `Trade: Player 2 wins! (${p2t} vs ${p1t}) — Trade Token awarded.`));
      } else {
        state.log.push(log(state, active, `Trade: Tied at ${p1t}! No token changes.`));
      }
      break;
    }
    case 'good_year': {
      // Both players get to draw 1 free card — flag it in the log; UI handles the draw
      state.log.push(log(state, active, 'Good Year! Both players may draw 1 free card.'));
      // Auto-draw top card from building stack for both players if hand has room
      for (const pid of ['p1', 'p2'] as PlayerId[]) {
        const player = state.players[pid];
        if (player.hand.length < player.handCapacity) {
          const stacks = (['building', 'action', 'hero', 'event'] as CardCategory[]);
          for (const stackId of stacks) {
            if (state.drawStacks[stackId].cards.length > 0) {
              const card = state.drawStacks[stackId].cards.shift()!;
              player.hand.push(card);
              state.log.push(log(state, pid, `${player.name} drew a card (Good Year bonus).`));
              break;
            }
          }
        }
      }
      break;
    }
    case 'plague': {
      for (const pid of ['p1', 'p2'] as PlayerId[]) {
        const player = state.players[pid];
        // Find a resource they have and take 1
        for (const region of player.principality.regions) {
          if (region.level > 0) {
            region.level = (region.level - 1) as RotationLevel;
            state.log.push(log(state, active, `Plague! ${player.name} lost 1 ${region.resource}.`));
            break;
          }
        }
      }
      break;
    }
  }

  return state;
}

// ─── Main Reducer ────────────────────────────────────
export function reducer(state: GameState, action: GameAction): GameState {
  const s = cloneState(state);

  if (s.status === 'game_over' && action.type !== 'NEW_GAME') return s;

  switch (action.type) {

    case 'NEW_GAME':
      return initialState();

    case 'DISMISS_PASS_OVERLAY': {
      s.showPassOverlay = false;
      return s;
    }

    case 'ROLL_DICE': {
      if (s.phase !== 'roll') return s;
      if (s.activePlayer !== action.type && true) { /* any player in hot-seat can roll */ }

      const roll = rollDice();
      s.lastRoll = roll;
      s.log.push(log(s, s.activePlayer, `Rolled: Production ${roll.production}, Event: ${roll.event}`));

      resolveEvent(s, roll.event, roll.production);
      recomputeVP(s);

      const winner = checkWinner(s);
      if (winner) {
        s.status = 'game_over';
        s.winner = winner;
        s.log.push(log(s, winner, `${s.players[winner].name} wins with ${s.players[winner].vp} VP!`));
        return s;
      }

      s.phase = 'action';
      return s;
    }

    case 'BUILD_ROAD': {
      const { playerId, roadId } = action;
      const check = canBuildRoad(s, playerId, roadId);
      if (!check.ok) return s; // silently ignore invalid

      deductCost(s, playerId, BUILD_COSTS.road);
      const road = s.players[playerId].principality.roads.find(r => r.id === roadId)!;
      road.built = true;
      s.log.push(log(s, playerId, `Built a Road.`));
      recomputeVP(s);
      return s;
    }

    case 'BUILD_SETTLEMENT': {
      const { playerId, settlementId } = action;
      const check = canBuildSettlement(s, playerId, settlementId);
      if (!check.ok) return s;

      deductCost(s, playerId, BUILD_COSTS.settlement);
      const node = s.players[playerId].principality.settlements.find(n => n.id === settlementId)!;
      node.type = 'settlement';
      s.log.push(log(s, playerId, `Built a Settlement at ${settlementId}.`));
      recomputeVP(s);

      const winner = checkWinner(s);
      if (winner) { s.status = 'game_over'; s.winner = winner; }
      return s;
    }

    case 'BUILD_CITY': {
      const { playerId, settlementId } = action;
      const check = canBuildCity(s, playerId, settlementId);
      if (!check.ok) return s;

      deductCost(s, playerId, BUILD_COSTS.city);
      const node = s.players[playerId].principality.settlements.find(n => n.id === settlementId)!;
      node.type = 'city';
      s.log.push(log(s, playerId, `Upgraded Settlement to City at ${settlementId}.`));
      recomputeVP(s);

      const winner = checkWinner(s);
      if (winner) { s.status = 'game_over'; s.winner = winner; }
      return s;
    }

    case 'BANK_TRADE': {
      const { playerId, give, receive } = action;
      const check = canBankTrade(s, playerId, give, receive);
      if (!check.ok) return s;

      const cost = s.players[playerId].seaHarbor ? 2 : 3;
      deductResource(s, playerId, give, cost);
      addResource(s, playerId, receive, 1);
      s.log.push(log(s, playerId, `Bank trade: ${cost}x ${give} → 1x ${receive}.`));
      return s;
    }

    case 'PLAY_CARD': {
      const { playerId, instanceId } = action;
      const check = canPlayCard(s, playerId, instanceId);
      if (!check.ok) return s;

      const player = s.players[playerId];
      const instIdx = player.hand.findIndex((c: CardInstance) => c.instanceId === instanceId);
      if (instIdx === -1) return s;

      const inst = player.hand[instIdx];
      const def = getDefinition(inst);

      // Deduct cost
      deductCost(s, playerId, def.cost);

      // Remove from hand
      player.hand.splice(instIdx, 1);

      // Apply effects
      for (const effect of def.effects) {
        switch (effect.type) {
          case 'gain_vp':
            // VP is computed from playedCards, no direct change needed
            break;
          case 'gain_resource':
            addResource(s, playerId, effect.resource, effect.amount);
            break;
          case 'gain_all_resource':
            addResource(s, playerId, effect.resource, effect.amount);
            break;
          case 'sea_harbor':
            player.seaHarbor = true;
            break;
          case 'hand_capacity':
            player.handCapacity = Math.max(1, player.handCapacity + effect.delta);
            break;
          case 'gain_strength':
            player.strengthScore = Math.max(0, player.strengthScore + effect.amount);
            break;
          case 'gain_trade':
            player.tradeScore = Math.max(0, player.tradeScore + effect.amount);
            break;
          case 'steal_resource': {
            const opp = opponent(playerId);
            const total = getResourceTotal(s.players[opp], effect.resource);
            if (total > 0) {
              deductResource(s, opp, effect.resource, 1);
              addResource(s, playerId, effect.resource, 1);
              s.log.push(log(s, playerId, `Stole 1 ${effect.resource} from opponent.`));
            }
            break;
          }
          case 'remove_brigand':
            player.brigandImmune = true;
            break;
          case 'draw_cards': {
            const stacks = (['building', 'action', 'hero', 'event'] as CardCategory[]);
            let drawn = 0;
            for (const stackId of stacks) {
              if (drawn >= effect.count) break;
              while (drawn < effect.count && s.drawStacks[stackId].cards.length > 0 && player.hand.length < player.handCapacity + 3) {
                player.hand.push(s.drawStacks[stackId].cards.shift()!);
                drawn++;
              }
            }
            break;
          }
          case 'gain_region':
            // Add an extra region to the first settlement with space (bonus region)
            // For simplicity, boost a matching region's dice number
            break;
          case 'reduce_trade_cost':
            player.seaHarbor = true;
            break;
        }
      }

      // Permanent vs one-time
      if (!def.oneTimeUse) {
        player.playedCards.push(inst);
      }
      // else discard (just removed from hand, not added anywhere = gone)

      s.log.push(log(s, playerId, `Played: ${def.name}.`));
      recomputeVP(s);

      const winner = checkWinner(s);
      if (winner) { s.status = 'game_over'; s.winner = winner; }
      return s;
    }

    case 'DRAW_CARD': {
      const { playerId, stackId } = action;
      const player = s.players[playerId];

      if (s.phase !== 'replenish') return s;
      if (s.activePlayer !== playerId) return s;
      if (player.hand.length >= player.handCapacity) return s;

      const stack = s.drawStacks[stackId];
      if (stack.cards.length === 0) return s;

      const card = stack.cards.shift()!;
      player.hand.push(card);
      s.log.push(log(s, playerId, `Drew a card from the ${stackId} stack.`));
      return s;
    }

    case 'EXCHANGE_PUSH': {
      const { playerId, instanceId, stackId } = action;
      const player = s.players[playerId];
      if (s.phase !== 'exchange') return s;
      if (s.activePlayer !== playerId) return s;
      if (s.exchangePending) return s; // already pushed

      const instIdx = player.hand.findIndex((c: CardInstance) => c.instanceId === instanceId);
      if (instIdx === -1) return s;

      const [inst] = player.hand.splice(instIdx, 1);
      s.drawStacks[stackId].cards.push(inst); // push to bottom
      s.exchangePending = { instanceId, stackId };
      s.log.push(log(s, playerId, `Pushed a card to the bottom of the ${stackId} stack.`));
      return s;
    }

    case 'EXCHANGE_BLIND': {
      const { playerId, stackId } = action;
      const player = s.players[playerId];
      if (s.phase !== 'exchange') return s;
      if (!s.exchangePending) return s;

      const stack = s.drawStacks[stackId];
      if (stack.cards.length === 0) return s;

      const card = stack.cards.shift()!;
      player.hand.push(card);
      s.exchangePending = null;
      s.log.push(log(s, playerId, `Blind exchange: drew from ${stackId} stack.`));
      return s;
    }

    case 'EXCHANGE_SEARCH': {
      const { playerId, instanceId, stackId, pay } = action;
      const player = s.players[playerId];
      if (s.phase !== 'exchange') return s;
      if (!s.exchangePending) return s;

      // Deduct 2 resources
      deductResource(s, playerId, pay[0], 1);
      deductResource(s, playerId, pay[1], 1);

      const stack = s.drawStacks[stackId];
      const cardIdx = stack.cards.findIndex((c: CardInstance) => c.instanceId === instanceId);
      if (cardIdx === -1) return s;

      const [card] = stack.cards.splice(cardIdx, 1);
      player.hand.push(card);

      // Shuffle remaining deck
      for (let i = stack.cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [stack.cards[i], stack.cards[j]] = [stack.cards[j], stack.cards[i]];
      }

      s.exchangePending = null;
      s.searchModalOpen = false;
      s.searchStack = null;
      s.log.push(log(s, playerId, `Search exchange: took specific card from ${stackId} stack.`));
      return s;
    }

    case 'END_TURN': {
      if (!canEndTurn(s, s.activePlayer)) return s;

      const nextPlayer = opponent(s.activePlayer);
      s.activePlayer = nextPlayer;
      s.phase = 'roll';
      s.turn = s.turn + (nextPlayer === 'p1' ? 1 : 0);
      s.exchangePending = null;
      s.showPassOverlay = true;
      s.log.push(log(s, nextPlayer, `${s.players[nextPlayer].name}'s turn begins.`));
      return s;
    }

    default:
      return s;
  }
}
