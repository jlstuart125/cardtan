<script lang="ts">
  import type { PlayerState, GameState, CardInstance, ResourceType } from '../lib/engine/types.js';
  import CardFace from './CardFace.svelte';
  import { dispatch } from '../lib/stores.js';
  import { canPlayCard } from '../lib/engine/rules.js';
  import { getDefinition } from '../lib/engine/cards.js';

  interface Props {
    player: PlayerState;
    state: GameState;
    isActive: boolean;
  }

  let { player, state: gs, isActive }: Props = $props();

  let selectedCard = $state<CardInstance | null>(null);

  function selectCard(card: CardInstance) {
    if (!isActive) return;
    if (gs.phase === 'action') {
      selectedCard = selectedCard?.instanceId === card.instanceId ? null : card;
    } else if (gs.phase === 'exchange') {
      selectedCard = selectedCard?.instanceId === card.instanceId ? null : card;
    }
  }

  async function playSelected() {
    if (!selectedCard || !isActive) return;
    if (gs.phase !== 'action') return;
    const check = canPlayCard(gs, player.id, selectedCard.instanceId);
    if (!check.ok) {
      alert(check.reason ?? 'Cannot play card');
      return;
    }
    await dispatch({ type: 'PLAY_CARD', playerId: player.id, instanceId: selectedCard.instanceId });
    selectedCard = null;
  }

  async function pushForExchange(stackId: import('../lib/engine/types.js').CardCategory) {
    if (!selectedCard || !isActive || gs.phase !== 'exchange') return;
    if (gs.exchangePending) return;
    await dispatch({ type: 'EXCHANGE_PUSH', playerId: player.id, instanceId: selectedCard.instanceId, stackId });
    selectedCard = null;
  }

  function canPlay(card: CardInstance): boolean {
    if (gs.phase !== 'action') return false;
    return canPlayCard(gs, player.id, card.instanceId).ok;
  }

  const stacks = ['building', 'action', 'hero', 'event'] as const;
</script>

<div class="hand-area">
  <div class="hand-header">
    <span class="hand-label">Hand ({player.hand.length}/{player.handCapacity})</span>
    {#if selectedCard && gs.phase === 'action'}
      <button class="btn btn-primary play-btn" onclick={playSelected} disabled={!canPlay(selectedCard)}>
        Play Card
      </button>
    {/if}
    {#if selectedCard && gs.phase === 'exchange' && !gs.exchangePending}
      <div class="exchange-push-btns">
        <span class="push-label">Push to:</span>
        {#each stacks as stackId}
          <button class="btn exchange-btn" onclick={() => pushForExchange(stackId)}>
            {stackId}
          </button>
        {/each}
      </div>
    {/if}
  </div>

  <div class="cards-row">
    {#each player.hand as card (card.instanceId)}
      <CardFace
        {card}
        selected={selectedCard?.instanceId === card.instanceId}
        draggable={isActive && gs.phase === 'action'}
        onclick={() => selectCard(card)}
      />
    {/each}

    {#if player.hand.length === 0}
      <span class="empty-hand">No cards in hand</span>
    {/if}
  </div>

  {#if gs.phase === 'exchange' && gs.exchangePending && isActive}
    <div class="exchange-panel">
      <p class="exchange-msg">Card pushed! Choose exchange method:</p>
      {#each stacks as stackId}
        <button
          class="btn"
          onclick={() => dispatch({ type: 'EXCHANGE_BLIND', playerId: player.id, stackId })}
        >
          Blind draw from {stackId}
        </button>
      {/each}
      <p class="exchange-note">Or Search (costs 2 resources) — not yet available in this UI</p>
    </div>
  {/if}
</div>

<style>
  .hand-area {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .hand-header {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .hand-label {
    font-size: 12px;
    color: #a89880;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .play-btn {
    font-size: 11px;
    padding: 4px 10px;
  }

  .exchange-push-btns {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-wrap: wrap;
  }

  .push-label {
    font-size: 11px;
    color: #a89880;
  }

  .exchange-btn {
    font-size: 10px;
    padding: 3px 8px;
  }

  .cards-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: flex-start;
    min-height: 120px;
  }

  .empty-hand {
    font-size: 12px;
    color: #a89880;
    font-style: italic;
    align-self: center;
  }

  .exchange-panel {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
    padding: 8px;
    background: rgba(212,162,76,0.05);
    border-radius: 6px;
    border: 1px solid rgba(212,162,76,0.15);
  }

  .exchange-msg {
    font-size: 12px;
    color: #d4a24c;
    margin: 0;
    width: 100%;
  }

  .exchange-note {
    font-size: 10px;
    color: #a89880;
    font-style: italic;
    margin: 0;
  }
</style>
