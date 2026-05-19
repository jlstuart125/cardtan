// ═══════════════════════════════════════════════════════
// CARDTAN — Local (Hot-Seat) Transport
// Runs the reducer in-process. Calls subscribers
// synchronously. No network required.
// ═══════════════════════════════════════════════════════

import type { GameState, GameAction } from '../engine/types.js';
import type { Transport } from './types.js';
import { initialState, reducer } from '../engine/state.js';

export class LocalTransport implements Transport {
  private state: GameState;
  private listeners: Set<(state: GameState) => void> = new Set();

  constructor(startState?: GameState) {
    this.state = startState ?? initialState();
  }

  subscribe(listener: (state: GameState) => void): () => void {
    this.listeners.add(listener);
    // Immediately emit current state to new subscriber
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  async dispatch(action: GameAction): Promise<void> {
    this.state = reducer(this.state, action);
    this.notify();
  }

  getState(): GameState {
    return this.state;
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}
