// ═══════════════════════════════════════════════════════
// CARDTAN — Protocol Tests
// Serialization roundtrips and type guards for the
// P2P discriminated union message types.
// ═══════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import {
  parseMessage,
  isHelloMsg,
  isActionMsg,
  isReadyMsg,
  isPingMsg,
  isPongMsg,
  isWelcomeMsg,
  isStateMsg,
  isEventMsg,
  isChatMsg,
  isByeMsg,
  type P2PMessage,
  type HelloMsg,
  type WelcomeMsg,
  type StateMsg,
  type PingMsg,
  type PongMsg,
} from '../src/lib/transport/protocol.js';

describe('parseMessage', () => {
  it('returns null for non-object input', () => {
    expect(parseMessage(null)).toBe(null);
    expect(parseMessage(undefined)).toBe(null);
    expect(parseMessage('string')).toBe(null);
    expect(parseMessage(42)).toBe(null);
  });

  it('returns null for unknown type', () => {
    expect(parseMessage({ type: 'unknown_type' })).toBe(null);
  });

  it('returns null for object without type field', () => {
    expect(parseMessage({ foo: 'bar' })).toBe(null);
  });

  it('returns message for all valid types', () => {
    const validTypes = [
      'hello', 'action', 'ready', 'chat', 'ping',
      'welcome', 'state', 'event', 'pong', 'bye',
    ];
    for (const type of validTypes) {
      const result = parseMessage({ type });
      expect(result).not.toBe(null);
      expect((result as P2PMessage).type).toBe(type);
    }
  });
});

describe('type guards — joiner→host', () => {
  it('isHelloMsg identifies hello messages', () => {
    const msg: HelloMsg = { type: 'hello', handle: 'BraveBison' };
    expect(isHelloMsg(msg)).toBe(true);
    expect(isHelloMsg({ type: 'ready' })).toBe(false);
  });

  it('isActionMsg identifies action messages', () => {
    const msg = { type: 'action', action: { type: 'ROLL_DICE' } } as P2PMessage;
    expect(isActionMsg(msg)).toBe(true);
    expect(isActionMsg({ type: 'hello', handle: 'X' })).toBe(false);
  });

  it('isReadyMsg identifies ready messages', () => {
    expect(isReadyMsg({ type: 'ready' })).toBe(true);
    expect(isReadyMsg({ type: 'ping', t: 0 })).toBe(false);
  });

  it('isPingMsg identifies ping messages', () => {
    const msg: PingMsg = { type: 'ping', t: Date.now() };
    expect(isPingMsg(msg)).toBe(true);
    expect(isPingMsg({ type: 'pong', t: 0, serverTime: 0 })).toBe(false);
  });
});

describe('type guards — host→joiner', () => {
  it('isWelcomeMsg identifies welcome messages', () => {
    const msg: WelcomeMsg = {
      type: 'welcome',
      hostHandle: 'BoldKestrel',
      joinerHandle: 'SwiftWolf',
      youAre: 'joiner',
    };
    expect(isWelcomeMsg(msg)).toBe(true);
    expect(isWelcomeMsg({ type: 'hello', handle: 'X' })).toBe(false);
  });

  it('isPongMsg identifies pong messages', () => {
    const msg: PongMsg = { type: 'pong', t: 1000, serverTime: 1001 };
    expect(isPongMsg(msg)).toBe(true);
    expect(isPongMsg({ type: 'ping', t: 1000 })).toBe(false);
  });

  it('isEventMsg identifies event messages', () => {
    expect(isEventMsg({ type: 'event', kind: 'game_start' })).toBe(true);
    expect(isEventMsg({ type: 'state', state: {} as any })).toBe(false);
  });
});

describe('type guards — either direction', () => {
  it('isChatMsg identifies chat messages', () => {
    expect(isChatMsg({ type: 'chat', text: 'hi' })).toBe(true);
    expect(isChatMsg({ type: 'chat', from: 'X', text: 'hi' })).toBe(true);
    expect(isChatMsg({ type: 'bye' })).toBe(false);
  });

  it('isByeMsg identifies bye messages', () => {
    expect(isByeMsg({ type: 'bye' })).toBe(true);
    expect(isByeMsg({ type: 'bye', reason: 'user_left' })).toBe(true);
    expect(isByeMsg({ type: 'ready' })).toBe(false);
  });
});

describe('serialization roundtrip', () => {
  it('hello message survives JSON roundtrip', () => {
    const original: HelloMsg = { type: 'hello', handle: 'BraveBison' };
    const serialized = JSON.stringify(original);
    const parsed = parseMessage(JSON.parse(serialized));
    expect(parsed).not.toBe(null);
    expect(isHelloMsg(parsed!)).toBe(true);
    expect((parsed as HelloMsg).handle).toBe('BraveBison');
  });

  it('welcome message survives JSON roundtrip', () => {
    const original: WelcomeMsg = {
      type: 'welcome',
      hostHandle: 'BoldKestrel',
      joinerHandle: 'SwiftWolf',
      youAre: 'joiner',
    };
    const serialized = JSON.stringify(original);
    const parsed = parseMessage(JSON.parse(serialized));
    expect(parsed).not.toBe(null);
    expect(isWelcomeMsg(parsed!)).toBe(true);
    const w = parsed as WelcomeMsg;
    expect(w.hostHandle).toBe('BoldKestrel');
    expect(w.joinerHandle).toBe('SwiftWolf');
    expect(w.youAre).toBe('joiner');
  });
});
