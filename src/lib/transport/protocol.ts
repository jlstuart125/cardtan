// ═══════════════════════════════════════════════════════
// CARDTAN — P2P Protocol
// Discriminated union of all messages sent over WebRTC
// data channels between host and joiner.
// ═══════════════════════════════════════════════════════

import type { GameState, GameAction } from '../engine/types.js';

// ─── Joiner → Host ────────────────────────────────────

export interface HelloMsg {
  type: 'hello';
  handle: string;
}

export interface ActionMsg {
  type: 'action';
  action: GameAction;
}

export interface ReadyMsg {
  type: 'ready';
}

export interface ChatMsgOut {
  type: 'chat';
  text: string; // max 200 chars
}

export interface PingMsg {
  type: 'ping';
  t: number; // timestamp ms
}

// ─── Host → Joiner ────────────────────────────────────

export interface WelcomeMsg {
  type: 'welcome';
  hostHandle: string;
  joinerHandle: string;
  youAre: 'joiner';
}

export interface StateMsg {
  type: 'state';
  state: GameState; // fog-of-war filtered for the recipient
}

export interface EventMsg {
  type: 'event';
  kind: string;
  payload?: unknown;
}

export interface ChatMsgIn {
  type: 'chat';
  from: string;
  text: string;
}

export interface PongMsg {
  type: 'pong';
  t: number;      // echo of ping timestamp
  serverTime: number; // host's Date.now()
}

// ─── Either direction ─────────────────────────────────

export interface ByeMsg {
  type: 'bye';
  reason?: string;
}

// ─── Union types ──────────────────────────────────────

/** Messages sent from joiner to host */
export type JoinerToHostMsg =
  | HelloMsg
  | ActionMsg
  | ReadyMsg
  | ChatMsgOut
  | PingMsg
  | ByeMsg;

/** Messages sent from host to joiner */
export type HostToJoinerMsg =
  | WelcomeMsg
  | StateMsg
  | EventMsg
  | ChatMsgIn
  | PongMsg
  | ByeMsg;

/** Any message either side can receive */
export type P2PMessage = JoinerToHostMsg | HostToJoinerMsg;

// ─── Type guards ──────────────────────────────────────

export function isHelloMsg(m: P2PMessage): m is HelloMsg {
  return m.type === 'hello';
}

export function isActionMsg(m: P2PMessage): m is ActionMsg {
  return m.type === 'action';
}

export function isReadyMsg(m: P2PMessage): m is ReadyMsg {
  return m.type === 'ready';
}

export function isPingMsg(m: P2PMessage): m is PingMsg {
  return m.type === 'ping';
}

export function isPongMsg(m: P2PMessage): m is PongMsg {
  return m.type === 'pong';
}

export function isWelcomeMsg(m: P2PMessage): m is WelcomeMsg {
  return m.type === 'welcome';
}

export function isStateMsg(m: P2PMessage): m is StateMsg {
  return m.type === 'state';
}

export function isEventMsg(m: P2PMessage): m is EventMsg {
  return m.type === 'event';
}

export function isChatMsg(m: P2PMessage): m is ChatMsgIn | ChatMsgOut {
  return m.type === 'chat';
}

export function isByeMsg(m: P2PMessage): m is ByeMsg {
  return m.type === 'bye';
}

/** Runtime parse: return the message if it looks valid, else null */
export function parseMessage(raw: unknown): P2PMessage | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.type !== 'string') return null;
  const validTypes = [
    'hello', 'action', 'ready', 'chat', 'ping',
    'welcome', 'state', 'event', 'pong', 'bye',
  ];
  if (!validTypes.includes(obj.type)) return null;
  return raw as P2PMessage;
}
