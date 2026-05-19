// ═══════════════════════════════════════════════════════
// CARDTAN — Svelte Stores
// Wraps the Transport so UI components never call the
// engine or reducer directly. All game mutations go
// through dispatch(action) → transport → reducer.
// ═══════════════════════════════════════════════════════

import { writable, derived, get } from 'svelte/store';
import type { Writable, Readable } from 'svelte/store';
import type { GameState, GameAction, PlayerId, CardCategory, ResourceType } from './engine/types.js';
import type { Transport } from './transport/types.js';
import { LocalTransport } from './transport/local.js';

// ─── Transport singleton ──────────────────────────────
let transport: Transport = new LocalTransport();

// ─── Core state store ────────────────────────────────
export const gameState: Writable<GameState> = writable(transport.getState());

// Sync store with transport
transport.subscribe((state) => {
  gameState.set(state);
});

// ─── Dispatch helper ─────────────────────────────────
export async function dispatch(action: GameAction): Promise<void> {
  await transport.dispatch(action);
}

// ─── Convenience derived stores ──────────────────────
export const activePlayer: Readable<PlayerId> = derived(
  gameState,
  $s => $s.activePlayer
);

export const currentPhase = derived(
  gameState,
  $s => $s.phase
);

export const players = derived(
  gameState,
  $s => $s.players
);

export const drawStacks = derived(
  gameState,
  $s => $s.drawStacks
);

export const lastRoll = derived(
  gameState,
  $s => $s.lastRoll
);

export const gameLog = derived(
  gameState,
  $s => [...$s.log].reverse().slice(0, 30)
);

export const showPassOverlay = derived(
  gameState,
  $s => $s.showPassOverlay
);

export const isGameOver = derived(
  gameState,
  $s => $s.status === 'game_over'
);

export const winner = derived(
  gameState,
  $s => $s.winner
);

// ─── Reset / new game ────────────────────────────────
export function newGame(): void {
  transport = new LocalTransport();
  transport.subscribe((state) => {
    gameState.set(state);
  });
  gameState.set(transport.getState());
}

// ─── Replace transport (for future Socket.io swap) ───
export function setTransport(newTransport: Transport): void {
  transport = newTransport;
  transport.subscribe((state) => {
    gameState.set(state);
  });
  gameState.set(transport.getState());
}
