// ═══════════════════════════════════════════════════════
// CARDTAN — Core Game Types
// Framework-free pure TypeScript. No Svelte imports.
// ═══════════════════════════════════════════════════════

// ─── Resources ───────────────────────────────────────
export type ResourceType = 'wood' | 'brick' | 'grain' | 'wool' | 'ore' | 'gold';

export const ALL_RESOURCES: ResourceType[] = ['wood', 'brick', 'grain', 'wool', 'ore', 'gold'];

export type ResourceCounts = Record<ResourceType, number>;

// ─── Board Positions ──────────────────────────────────
export type SettlementId = string; // e.g. "p1-s0", "p1-s1" ...
export type RoadId = string;       // e.g. "p1-r0"
export type RegionId = string;     // e.g. "p1-s0-tl"

// Rotation = inventory level 0-3 (maps to 0°,90°,180°,270°)
export type RotationLevel = 0 | 1 | 2 | 3;

export interface ResourceRegion {
  id: RegionId;
  settlementId: SettlementId;
  position: 'tl' | 'bl' | 'tr' | 'br'; // top-left, bottom-left, top-right, bottom-right
  resource: ResourceType;
  diceNumber: number; // 1-6, which production die value yields +1
  level: RotationLevel; // current inventory 0-3
}

export type StructureType = 'empty' | 'settlement' | 'city';

export interface SettlementNode {
  id: SettlementId;
  type: StructureType;
  regions: RegionId[]; // up to 4 region IDs assigned to this settlement
}

export interface RoadSegment {
  id: RoadId;
  built: boolean;
  connects: [SettlementId, SettlementId]; // the two settlement nodes this road links
}

// A player's principality grid
export interface Principality {
  playerId: PlayerId;
  settlements: SettlementNode[]; // indexed 0..N, left to right
  roads: RoadSegment[];          // road between settlement[i] and settlement[i+1]
  regions: ResourceRegion[];     // all regions across all settlements
}

// ─── Cards ────────────────────────────────────────────
export type CardCategory = 'building' | 'action' | 'hero' | 'event';

export type CardEffect =
  | { type: 'gain_vp'; amount: number }
  | { type: 'gain_resource'; resource: ResourceType; amount: number }
  | { type: 'gain_all_resource'; resource: ResourceType; amount: number }
  | { type: 'reduce_trade_cost'; newCost: number }
  | { type: 'gain_strength'; amount: number }
  | { type: 'gain_trade'; amount: number }
  | { type: 'sea_harbor' }           // enables 2:1 trade
  | { type: 'hand_capacity'; delta: number }
  | { type: 'steal_resource'; resource: ResourceType }
  | { type: 'draw_cards'; count: number }
  | { type: 'remove_brigand' }       // immunity to brigand attack
  | { type: 'gain_region'; resource: ResourceType; diceNumber: number };

export interface CardDefinition {
  id: string;
  name: string;
  category: CardCategory;
  flavor: string;
  cost: Partial<ResourceCounts>;
  effects: CardEffect[];
  vpValue: number; // direct VP while in principality (0 for most hand cards)
  playTarget: 'self' | 'opponent' | 'none'; // where to drag
  oneTimeUse: boolean; // if true, discarded after use; else stays in principality
}

export interface CardInstance {
  instanceId: string;
  definitionId: string;
}

// ─── Player ───────────────────────────────────────────
export type PlayerId = 'p1' | 'p2';

export interface PlayerState {
  id: PlayerId;
  name: string;
  hand: CardInstance[];
  handCapacity: number;    // default 3, can be modified by cards
  principality: Principality;
  playedCards: CardInstance[]; // permanent cards in principality
  tradeToken: boolean;     // currently holds trade advantage
  strengthToken: boolean;  // currently holds strength advantage
  tradeScore: number;      // gold + commerce metric for trade comparison
  strengthScore: number;   // combat score for tournament comparison
  seaHarbor: boolean;      // enables 2:1 bank trade
  brigandImmune: boolean;
  vp: number;              // computed by scanVP
}

// ─── Dice ─────────────────────────────────────────────
export type EventDieResult =
  | 'tournament'
  | 'harvest'
  | 'brigand'
  | 'trade'
  | 'good_year'
  | 'plague';

export interface DiceRoll {
  production: number;      // 1-6
  event: EventDieResult;
}

// ─── Draw Stacks ─────────────────────────────────────
export interface DrawStack {
  id: CardCategory;
  cards: CardInstance[];   // top = index 0
}

// ─── Actions (for reducer / transport) ───────────────
export type GameAction =
  | { type: 'ROLL_DICE' }
  | { type: 'BUILD_ROAD'; playerId: PlayerId; roadId: RoadId }
  | { type: 'BUILD_SETTLEMENT'; playerId: PlayerId; settlementId: SettlementId }
  | { type: 'BUILD_CITY'; playerId: PlayerId; settlementId: SettlementId }
  | { type: 'BANK_TRADE'; playerId: PlayerId; give: ResourceType; receive: ResourceType }
  | { type: 'PLAY_CARD'; playerId: PlayerId; instanceId: string; target?: string }
  | { type: 'DRAW_CARD'; playerId: PlayerId; stackId: CardCategory }
  | { type: 'EXCHANGE_PUSH'; playerId: PlayerId; instanceId: string; stackId: CardCategory }
  | { type: 'EXCHANGE_BLIND'; playerId: PlayerId; stackId: CardCategory }
  | { type: 'EXCHANGE_SEARCH'; playerId: PlayerId; instanceId: string; stackId: CardCategory; pay: [ResourceType, ResourceType] }
  | { type: 'END_TURN' }
  | { type: 'DISMISS_PASS_OVERLAY' }
  | { type: 'NEW_GAME' };

// ─── Turn Phases ─────────────────────────────────────
export type TurnPhase = 'roll' | 'action' | 'replenish' | 'exchange';

// ─── Log Entries ─────────────────────────────────────
export interface LogEntry {
  id: string;
  turn: number;
  playerId: PlayerId;
  message: string;
  timestamp: number;
}

// ─── Game State ──────────────────────────────────────
export type GameStatus = 'playing' | 'game_over';

export interface GameState {
  status: GameStatus;
  winner: PlayerId | null;
  turn: number;
  activePlayer: PlayerId;
  phase: TurnPhase;
  players: Record<PlayerId, PlayerState>;
  drawStacks: Record<CardCategory, DrawStack>;
  lastRoll: DiceRoll | null;
  log: LogEntry[];
  showPassOverlay: boolean;
  exchangePending: { instanceId: string; stackId: CardCategory } | null;
  searchModalOpen: boolean;
  searchStack: CardCategory | null;
  searchPayment: [ResourceType, ResourceType] | null;
  targetVP: number;
}
