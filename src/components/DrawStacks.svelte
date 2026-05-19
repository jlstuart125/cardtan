<script lang="ts">
  import type { GameState, PlayerId, CardCategory } from '../lib/engine/types.js';
  import { dispatch } from '../lib/stores.js';

  interface Props {
    state: GameState;
    activePlayerId: PlayerId;
  }

  let { state, activePlayerId }: Props = $props();

  const stacks: { id: CardCategory; label: string; icon: string; color: string }[] = [
    { id: 'building', label: 'Buildings', icon: '🏛️', color: '#5a7a9a' },
    { id: 'action', label: 'Actions', icon: '⚡', color: '#c44a2a' },
    { id: 'hero', label: 'Heroes', icon: '⚔️', color: '#9b59b6' },
    { id: 'event', label: 'Events', icon: '🌟', color: '#27ae60' },
  ];

  const player = $derived(state.players[activePlayerId]);
  const canDraw = $derived(
    state.phase === 'replenish' && player.hand.length < player.handCapacity
  );

  async function drawFromStack(stackId: CardCategory) {
    if (!canDraw) return;
    if (state.drawStacks[stackId].cards.length === 0) return;
    await dispatch({ type: 'DRAW_CARD', playerId: activePlayerId, stackId });
  }
</script>

<div class="draw-stacks">
  <div class="stacks-label">Draw Stacks</div>
  <div class="stacks-row">
    {#each stacks as stack}
      {@const deckSize = state.drawStacks[stack.id].cards.length}
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="stack-card"
        class:drawable={canDraw && deckSize > 0}
        class:empty={deckSize === 0}
        style="--accent: {stack.color}"
        onclick={() => drawFromStack(stack.id)}
        title={canDraw ? `Draw from ${stack.label}` : stack.label}
      >
        <!-- Stack visual (layered cards) -->
        <div class="stack-visual">
          {#if deckSize > 2}
            <div class="stack-layer layer3"></div>
          {/if}
          {#if deckSize > 1}
            <div class="stack-layer layer2"></div>
          {/if}
          {#if deckSize > 0}
            <div class="stack-layer layer1" style="border-color: {stack.color}44;">
              <span class="stack-icon">{stack.icon}</span>
            </div>
          {:else}
            <div class="stack-empty">
              <span style="opacity:0.3">{stack.icon}</span>
            </div>
          {/if}
        </div>
        <div class="stack-info">
          <span class="stack-name" style="color: {stack.color}">{stack.label}</span>
          <span class="stack-count">{deckSize} left</span>
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .draw-stacks {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .stacks-label {
    font-size: 11px;
    color: #a89880;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    text-align: center;
  }

  .stacks-row {
    display: flex;
    gap: 8px;
    justify-content: center;
    flex-wrap: wrap;
  }

  .stack-card {
    width: 72px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    cursor: default;
    transition: transform 0.15s ease;
  }

  .stack-card.drawable {
    cursor: pointer;
  }

  .stack-card.drawable:hover {
    transform: translateY(-3px);
  }

  .stack-card.drawable:hover .layer1 {
    box-shadow: 0 0 12px var(--accent, #d4a24c);
  }

  .stack-card.empty {
    opacity: 0.4;
  }

  .stack-visual {
    position: relative;
    width: 60px;
    height: 80px;
  }

  .stack-layer {
    position: absolute;
    width: 56px;
    height: 76px;
    border-radius: 6px;
    background: var(--bg-card);
    border: 1px solid rgba(212,162,76,0.2);
  }

  .layer3 {
    top: 4px;
    left: 4px;
    background: #2a2010;
  }

  .layer2 {
    top: 2px;
    left: 2px;
    background: #321e10;
  }

  .layer1 {
    top: 0;
    left: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.4);
    transition: box-shadow 0.2s ease;
  }

  .stack-icon {
    font-size: 24px;
  }

  .stack-empty {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    border: 1px dashed rgba(212,162,76,0.2);
    border-radius: 6px;
  }

  .stack-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }

  .stack-name {
    font-size: 9px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .stack-count {
    font-size: 8px;
    color: #a89880;
  }
</style>
