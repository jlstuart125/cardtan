// ═══════════════════════════════════════════════════════
// CARDTAN — Filtering Tests (Fog of War)
// Ensures the state filter correctly hides the host's
// hand and draw-stack contents from the joiner.
// ═══════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from 'vitest';
import { filterStateForJoiner, buildSearchReveal, CARD_BACK_DEF_ID } from '../src/lib/transport/filtering.js';
import { initialState } from '../src/lib/engine/state.js';
import type { GameState, CardInstance } from '../src/lib/engine/types.js';

function makeCard(id: string, defId = 'library'): CardInstance {
  return { instanceId: id, definitionId: defId };
}

describe('filterStateForJoiner', () => {
  let state: GameState;

  beforeEach(() => {
    state = initialState();
    // Give host (p1) 3 cards in hand
    state.players.p1.hand = [
      makeCard('h1', 'library'),
      makeCard('h2', 'wealthy_town'),
      makeCard('h3', 'road_builder'),
    ];
    // Give joiner (p2) 2 cards in hand
    state.players.p2.hand = [
      makeCard('j1', 'library'),
      makeCard('j2', 'wealthy_town'),
    ];
  });

  it("replaces host's hand with card backs", () => {
    const filtered = filterStateForJoiner(state, 'p1');
    const hostHand = filtered.players.p1.hand;

    expect(hostHand).toHaveLength(3);
    for (const card of hostHand) {
      expect(card.definitionId).toBe(CARD_BACK_DEF_ID);
    }
  });

  it("preserves joiner's hand intact", () => {
    const filtered = filterStateForJoiner(state, 'p1');
    const joinerHand = filtered.players.p2.hand;

    expect(joinerHand).toHaveLength(2);
    expect(joinerHand[0].definitionId).toBe('library');
    expect(joinerHand[1].definitionId).toBe('wealthy_town');
  });

  it('preserves hand count (backs have same length)', () => {
    const filtered = filterStateForJoiner(state, 'p1');
    expect(filtered.players.p1.hand.length).toBe(state.players.p1.hand.length);
  });

  it('replaces all draw-stack cards with backs', () => {
    const filtered = filterStateForJoiner(state, 'p1');

    for (const stack of Object.values(filtered.drawStacks)) {
      for (const card of stack.cards) {
        expect(card.definitionId).toBe(CARD_BACK_DEF_ID);
      }
    }
  });

  it('preserves draw-stack card counts', () => {
    const filtered = filterStateForJoiner(state, 'p1');

    for (const [id, stack] of Object.entries(state.drawStacks)) {
      expect(filtered.drawStacks[id as keyof typeof filtered.drawStacks].cards.length)
        .toBe(stack.cards.length);
    }
  });

  it('does not mutate the original state', () => {
    const handBefore = state.players.p1.hand.map(c => c.definitionId);
    filterStateForJoiner(state, 'p1');
    const handAfter = state.players.p1.hand.map(c => c.definitionId);
    expect(handAfter).toEqual(handBefore);
  });

  it('works when host is p2 (role reversal)', () => {
    const filtered = filterStateForJoiner(state, 'p2');
    // p2 is host → p2 hand should be backs
    for (const card of filtered.players.p2.hand) {
      expect(card.definitionId).toBe(CARD_BACK_DEF_ID);
    }
    // p1 is joiner → p1 hand visible
    expect(filtered.players.p1.hand[0].definitionId).toBe('library');
  });
});

describe('buildSearchReveal', () => {
  it('returns full card list for a stack', () => {
    const state = initialState();
    const buildingStack = state.drawStacks.building;
    const reveal = buildSearchReveal(state, 'building');

    expect(reveal).toHaveLength(buildingStack.cards.length);
    expect(reveal[0].instanceId).toBe(buildingStack.cards[0].instanceId);
  });

  it('returns a copy, not the original array', () => {
    const state = initialState();
    const reveal = buildSearchReveal(state, 'building');
    reveal.push(makeCard('extra'));
    // Original unchanged
    expect(state.drawStacks.building.cards.find(c => c.instanceId === 'extra')).toBeUndefined();
  });
});
