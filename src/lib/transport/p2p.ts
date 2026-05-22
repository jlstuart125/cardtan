// ═══════════════════════════════════════════════════════
// CARDTAN — P2PTransport
// WebRTC peer-to-peer transport via PeerJS.
//
// Host role:
//   - Holds authoritative GameState
//   - Runs engine reducer on actions (own + forwarded)
//   - Filters + broadcasts state to joiner after each change
//   - Answers pings with pongs
//
// Joiner role:
//   - Sends actions to host
//   - Receives filtered state snapshots
//   - Tracks latency via ping/pong
// ═══════════════════════════════════════════════════════

import Peer, { type DataConnection } from 'peerjs';
import type { GameState, GameAction, PlayerId } from '../engine/types.js';
import type { Transport } from './types.js';
import { reducer, initialState } from '../engine/state.js';
import { filterStateForJoiner } from './filtering.js';
import {
  parseMessage,
  type P2PMessage,
  type HostToJoinerMsg,
  type JoinerToHostMsg,
} from './protocol.js';

export type P2PRole = 'host' | 'joiner';

export interface ConnectionStatus {
  connected: boolean;
  latency: number | null;   // ms, null until first pong
  remoteHandle: string | null;
  role: P2PRole;
}

/** Callbacks the UI can listen to beyond state updates */
export interface P2PCallbacks {
  onStatusChange?: (status: ConnectionStatus) => void;
  onChat?: (from: string, text: string) => void;
  onDisconnect?: () => void;
  onReconnect?: () => void;
  onEvent?: (kind: string, payload?: unknown) => void;
}

const PING_INTERVAL_MS = 5_000;
const DISCONNECT_TIMEOUT_MS = 15_000;
const HOST_PLAYER_ID: PlayerId = 'p1';
const JOINER_PLAYER_ID: PlayerId = 'p2';

export class P2PTransport implements Transport {
  private peer: Peer;
  private conn: DataConnection | null = null;
  private role: P2PRole;
  private localHandle: string;

  // Host-only: authoritative state
  private hostState: GameState | null = null;

  // Joiner-only: latest filtered state from host
  private joinerState: GameState | null = null;

  private listeners: Set<(state: GameState) => void> = new Set();
  private callbacks: P2PCallbacks;

  private status: ConnectionStatus;

  // Heartbeat
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private lastPongAt: number = Date.now();
  private disconnectTimer: ReturnType<typeof setTimeout> | null = null;

  // Joiner readiness
  private localReady = false;
  private remoteReady = false;
  private gameStarted = false;

  /** Resolve when peer is registered and ready to accept/initiate connections */
  readonly peerReady: Promise<string>; // resolves to peer ID

  constructor(opts: {
    peerId?: string;       // Provide for host (friendly code). Omit for joiner (auto-assigned).
    role: P2PRole;
    handle: string;
    callbacks?: P2PCallbacks;
  }) {
    this.role = opts.role;
    this.localHandle = opts.handle;
    this.callbacks = opts.callbacks ?? {};

    this.status = {
      connected: false,
      latency: null,
      remoteHandle: null,
      role: opts.role,
    };

    if (opts.role === 'host') {
      this.hostState = initialState();
      this.peer = new Peer(opts.peerId ?? this.generateCode());
    } else {
      this.peer = new Peer(); // auto-assigned ID
    }

    this.peerReady = new Promise((resolve, reject) => {
      this.peer.on('open', (id) => resolve(id));
      this.peer.on('error', reject);
    });

    if (opts.role === 'host') {
      this.peer.on('connection', (conn) => this.setupConnection(conn));
    }
  }

  // ─── Host: connect to joiner who called us ────────────

  // ─── Joiner: connect to host by peer ID ────────────────
  connectTo(hostPeerId: string): void {
    if (this.role !== 'joiner') throw new Error('Only joiner calls connectTo');
    const conn = this.peer.connect(hostPeerId, { reliable: true });
    this.setupConnection(conn);
  }

  // ─── Transport interface ──────────────────────────────

  subscribe(listener: (state: GameState) => void): () => void {
    this.listeners.add(listener);
    const current = this.getState();
    listener(current);
    return () => this.listeners.delete(listener);
  }

  async dispatch(action: GameAction): Promise<void> {
    if (this.role === 'host') {
      this.applyActionAsHost(action);
    } else {
      // Send to host
      this.send({ type: 'action', action });
    }
  }

  getState(): GameState {
    if (this.role === 'host') {
      return this.hostState!;
    }
    // Joiner returns last received state, or a placeholder
    return this.joinerState ?? initialState();
  }

  // ─── Readiness ───────────────────────────────────────

  setReady(): void {
    this.localReady = true;
    this.send({ type: 'ready' });
    this.checkBothReady();
  }

  get isReady() { return this.localReady; }
  get opponentReady() { return this.remoteReady; }

  // ─── Chat ─────────────────────────────────────────────

  sendChat(text: string): void {
    const trimmed = text.slice(0, 200);
    if (this.role === 'host') {
      this.send({ type: 'chat', from: this.localHandle, text: trimmed });
    } else {
      this.send({ type: 'chat', text: trimmed });
    }
  }

  // ─── Status ───────────────────────────────────────────

  getStatus(): ConnectionStatus {
    return { ...this.status };
  }

  // ─── Cleanup ──────────────────────────────────────────

  destroy(reason?: string): void {
    if (reason && this.conn) {
      try { this.send({ type: 'bye', reason }); } catch (_) { /* ignore */ }
    }
    this.clearHeartbeat();
    this.conn?.close();
    this.peer.destroy();
  }

  // ─── Private: connection setup ────────────────────────

  private setupConnection(conn: DataConnection): void {
    this.conn = conn;

    conn.on('open', () => {
      this.updateStatus({ connected: true });
      this.startHeartbeat();

      if (this.role === 'joiner') {
        this.send({ type: 'hello', handle: this.localHandle });
      }
    });

    conn.on('data', (raw) => {
      const msg = parseMessage(raw);
      if (!msg) return;
      this.handleMessage(msg);
    });

    conn.on('close', () => this.handleDisconnect());
    conn.on('error', () => this.handleDisconnect());
  }

  // ─── Private: message handling ────────────────────────

  private handleMessage(msg: P2PMessage): void {
    this.lastPongAt = Date.now();

    if (this.role === 'host') {
      this.handleAsHost(msg as JoinerToHostMsg);
    } else {
      this.handleAsJoiner(msg as HostToJoinerMsg);
    }
  }

  private handleAsHost(msg: JoinerToHostMsg): void {
    switch (msg.type) {
      case 'hello': {
        const joinerHandle = msg.handle;
        this.updateStatus({ remoteHandle: joinerHandle });
        this.send({
          type: 'welcome',
          hostHandle: this.localHandle,
          joinerHandle,
          youAre: 'joiner',
        });
        break;
      }
      case 'action': {
        if (!this.gameStarted) return;
        this.applyActionAsHost(msg.action);
        break;
      }
      case 'ready': {
        this.remoteReady = true;
        this.checkBothReady();
        break;
      }
      case 'chat': {
        // Re-broadcast to joiner with from field
        this.send({ type: 'chat', from: this.status.remoteHandle ?? 'Opponent', text: msg.text });
        this.callbacks.onChat?.(this.status.remoteHandle ?? 'Opponent', msg.text);
        break;
      }
      case 'ping': {
        this.send({ type: 'pong', t: msg.t, serverTime: Date.now() });
        break;
      }
      case 'bye': {
        this.callbacks.onDisconnect?.();
        break;
      }
    }
  }

  private handleAsJoiner(msg: HostToJoinerMsg): void {
    switch (msg.type) {
      case 'welcome': {
        this.updateStatus({ remoteHandle: msg.hostHandle });
        break;
      }
      case 'state': {
        this.joinerState = msg.state;
        this.notifyListeners();
        break;
      }
      case 'event': {
        this.callbacks.onEvent?.(msg.kind, msg.payload);
        break;
      }
      case 'chat': {
        this.callbacks.onChat?.(msg.from, msg.text);
        break;
      }
      case 'pong': {
        const latency = Date.now() - msg.t;
        this.updateStatus({ latency });
        break;
      }
      case 'bye': {
        this.callbacks.onDisconnect?.();
        break;
      }
    }
  }

  // ─── Private: host engine ─────────────────────────────

  private applyActionAsHost(action: GameAction): void {
    this.hostState = reducer(this.hostState!, action);
    // Notify local UI (host sees full state)
    this.notifyListeners();
    // Broadcast filtered state to joiner
    this.broadcastState();
  }

  private broadcastState(): void {
    if (!this.conn || !this.hostState) return;
    const filtered = filterStateForJoiner(this.hostState, HOST_PLAYER_ID);
    this.send({ type: 'state', state: filtered });
  }

  // ─── Private: readiness ───────────────────────────────

  private checkBothReady(): void {
    if (this.localReady && this.remoteReady && !this.gameStarted) {
      this.gameStarted = true;
      if (this.role === 'host') {
        this.broadcastState();
        this.send({ type: 'event', kind: 'game_start' });
      }
    }
  }

  // ─── Private: heartbeat ───────────────────────────────

  private startHeartbeat(): void {
    this.lastPongAt = Date.now();
    this.pingTimer = setInterval(() => {
      if (this.role === 'joiner') {
        this.send({ type: 'ping', t: Date.now() });
      }
      // Check for silence
      if (Date.now() - this.lastPongAt > DISCONNECT_TIMEOUT_MS) {
        this.handleDisconnect();
      }
    }, PING_INTERVAL_MS);
  }

  private clearHeartbeat(): void {
    if (this.pingTimer !== null) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
    if (this.disconnectTimer !== null) {
      clearTimeout(this.disconnectTimer);
      this.disconnectTimer = null;
    }
  }

  private handleDisconnect(): void {
    this.clearHeartbeat();
    this.updateStatus({ connected: false, latency: null });
    this.callbacks.onDisconnect?.();
  }

  // ─── Private: utilities ───────────────────────────────

  private send(msg: P2PMessage): void {
    if (!this.conn || !this.conn.open) return;
    this.conn.send(msg);
  }

  private notifyListeners(): void {
    const state = this.getState();
    for (const l of this.listeners) l(state);
  }

  private updateStatus(patch: Partial<ConnectionStatus>): void {
    this.status = { ...this.status, ...patch };
    this.callbacks.onStatusChange?.(this.getStatus());
  }

  private generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  get peerId(): string | null {
    return this.peer.id ?? null;
  }

  get myPlayerId(): PlayerId {
    return this.role === 'host' ? HOST_PLAYER_ID : JOINER_PLAYER_ID;
  }
}
