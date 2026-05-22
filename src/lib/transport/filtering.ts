// ═══════════════════════════════════════════════════════
// CARDTAN — State Filtering (Fog of War)
// The host runs the authoritative engine. Before sending
// state to the joiner, we redact information the joiner
// should not see.
// ═══════════════════════════════════════════════════════

import type { GameState, CardInstance, PlayerId } from '../engine/types.js';

/** Sentinel definition ID used for hidden (card-back) cards */
export const CARD_BACK_DEF_ID = '__back__';

/** Replace a card instance with an opaque card-back */
function toBack(idx: number): CardInstance {
  return { instanceId: `back-${idx}`, definitionId: CARD_BACK_DEF_ID };
}

/**
 * Filter the full GameState before sending to the joiner.
 *
 * Rules:
 * - Joiner's own hand: visible (unchanged)
 * - Host's (opponent's) hand: replaced with card-backs, count preserved
 * - All draw stack cards: replaced with backs, count preserved
 *   (the joiner can see how many remain in each stack, not which cards)
 *
 * @param fullState   The canonical state held by the host
 * @param hostId      The PlayerId of the host (their hand is hidden from joiner)
 */
export function filterStateForJoiner(fullState: GameState, hostId: PlayerId): GameState {
  const joinerId: PlayerId = hostId === 'p1' ? 'p2' : 'p1';

  // Deep-clone only the parts we mutate (avoid full structuredClone on every tick)
  const players = {
    ...fullState.players,
    [hostId]: {
      ...fullState.players[hostId],
      // Replace host's hand with backs
      hand: fullState.players[hostId].hand.map((_, i) => toBack(i)),
    },
    [joinerId]: {
      ...fullState.players[joinerId],
      // Joiner's own hand is visible — no change
    },
  };

  // Replace all draw-stack card identities with backs (count preserved)
  const drawStacks = Object.fromEntries(
    Object.entries(fullState.drawStacks).map(([id, stack]) => [
      id,
      {
        ...stack,
        cards: stack.cards.map((_, i) => toBack(i)),
      },
    ])
  ) as GameState['drawStacks'];

  return {
    ...fullState,
    players,
    drawStacks,
  };
}

/**
 * Build a "search reveal" payload: the full ordered contents of a draw stack.
 * This is sent as a one-shot `event` message to the searching player only.
 * After the search the deck is shuffled, so this data is immediately stale.
 */
export function buildSearchReveal(
  fullState: GameState,
  stackId: keyof GameState['drawStacks'],
): CardInstance[] {
  return [...fullState.drawStacks[stackId].cards];
}
