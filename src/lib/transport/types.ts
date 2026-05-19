// ═══════════════════════════════════════════════════════
// CARDTAN — Transport Interface
// Abstracts the game state delivery mechanism so the UI
// is agnostic to whether we run local (hot-seat MVP) or
// over the network (future Socket.io backend).
// ═══════════════════════════════════════════════════════

import type { GameState, GameAction } from '../engine/types.js';

export interface Transport {
  /** Subscribe to state updates. Returns an unsubscribe function. */
  subscribe(listener: (state: GameState) => void): () => void;

  /** Dispatch an action. Resolves when the state has been updated. */
  dispatch(action: GameAction): Promise<void>;

  /** Synchronously return the current state. */
  getState(): GameState;
}
