// ═══════════════════════════════════════════════════════
// CARDTAN — Socket.io Transport (FUTURE — NOT IMPLEMENTED)
// ═══════════════════════════════════════════════════════
//
// TODO: Implement this class when adding a real backend.
//
// Entry point for server integration:
//   1. Install socket.io-client: `npm install socket.io-client`
//   2. Implement SocketIOTransport.subscribe() to listen to
//      `game:state` events from the server and call listeners.
//   3. Implement SocketIOTransport.dispatch() to emit
//      `game:action` events to the server and await `game:ack`.
//   4. Implement SocketIOTransport.getState() to return the
//      last known state received from the server.
//   5. Handle reconnection / optimistic updates as needed.
//   6. In stores.ts, swap `new LocalTransport()` for
//      `new SocketIOTransport(serverUrl, roomId)`.
//
// See: https://socket.io/docs/v4/client-api/
// ═══════════════════════════════════════════════════════

import type { GameState, GameAction } from '../engine/types.js';
import type { Transport } from './types.js';

export class SocketIOTransport implements Transport {
  // TODO: add socket: Socket field from socket.io-client
  // TODO: add listeners Set and latestState field

  constructor(
    _serverUrl: string,   // e.g. 'http://localhost:3001'
    _roomId: string,      // unique game room identifier
    _playerId: string,    // 'p1' | 'p2'
  ) {
    // TODO: Connect to server
    // this.socket = io(_serverUrl);
    // this.socket.emit('game:join', { roomId: _roomId, playerId: _playerId });
    // this.socket.on('game:state', (state: GameState) => {
    //   this.latestState = state;
    //   this.listeners.forEach(l => l(state));
    // });
    throw new Error('SocketIOTransport is not yet implemented. Use LocalTransport for hot-seat MVP.');
  }

  subscribe(_listener: (state: GameState) => void): () => void {
    // TODO: add listener, return unsubscribe
    throw new Error('Not implemented');
  }

  async dispatch(_action: GameAction): Promise<void> {
    // TODO: emit action, await ack
    // return new Promise((resolve, reject) => {
    //   this.socket.emit('game:action', _action, (ack: { ok: boolean }) => {
    //     ack.ok ? resolve() : reject(new Error('Action rejected by server'));
    //   });
    // });
    throw new Error('Not implemented');
  }

  getState(): GameState {
    // TODO: return this.latestState
    throw new Error('Not implemented');
  }
}
