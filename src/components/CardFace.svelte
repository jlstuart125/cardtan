<script lang="ts">
  import type { CardInstance } from '../lib/engine/types.js';
  import { getDefinition } from '../lib/engine/cards.js';
  import ResourceIcon from './ResourceIcon.svelte';

  interface Props {
    card: CardInstance;
    selected?: boolean;
    draggable?: boolean;
    compact?: boolean;
    faceDown?: boolean;
    onclick?: () => void;
    ondragstart?: (e: DragEvent) => void;
  }

  let {
    card,
    selected = false,
    draggable = false,
    compact = false,
    faceDown = false,
    onclick,
    ondragstart,
  }: Props = $props();

  const def = $derived(getDefinition(card));

  const categoryColors: Record<string, string> = {
    building: '#5a7a9a',
    action: '#c44a2a',
    hero: '#9b59b6',
    event: '#27ae60',
  };

  const categoryIcons: Record<string, string> = {
    building: '🏛️',
    action: '⚡',
    hero: '⚔️',
    event: '🌟',
  };
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="card-shell"
  class:selected
  class:compact
  class:face-down={faceDown}
  draggable={draggable ? true : undefined}
  onclick={onclick}
  ondragstart={ondragstart}
>
  {#if faceDown}
    <div class="card-back">
      <span class="back-icon">🂠</span>
    </div>
  {:else}
    <div class="card-top" style="background: {categoryColors[def.category]}22; border-bottom: 1px solid {categoryColors[def.category]}44;">
      <span class="card-name">{def.name}</span>
      <span class="card-cat-icon">{categoryIcons[def.category]}</span>
    </div>

    {#if !compact}
      <div class="card-body">
        <p class="card-flavor">{def.flavor}</p>

        {#if def.vpValue > 0}
          <div class="card-vp">⭐ +{def.vpValue} VP</div>
        {/if}
      </div>
    {/if}

    <div class="card-footer">
      {#if Object.keys(def.cost).length > 0}
        <div class="card-cost">
          {#each Object.entries(def.cost) as [res, amt]}
            {#if amt && amt > 0}
              <span class="cost-item">
                {amt}×<ResourceIcon resource={res as any} size={10} />
              </span>
            {/if}
          {/each}
        </div>
      {:else}
        <span class="cost-free">Free</span>
      {/if}

      {#if def.vpValue > 0}
        <span class="vp-badge">⭐{def.vpValue}</span>
      {/if}
    </div>
  {/if}
</div>

<style>
  .card-shell {
    width: 90px;
    min-height: 120px;
    border-radius: 8px;
    background: var(--bg-card);
    border: 1px solid rgba(212,162,76,0.2);
    box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    display: flex;
    flex-direction: column;
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
    user-select: none;
    position: relative;
    overflow: hidden;
  }

  .card-shell:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.6);
    border-color: rgba(212,162,76,0.5);
  }

  .card-shell.selected {
    border-color: #d4a24c;
    box-shadow: 0 0 0 2px #d4a24c44, 0 8px 24px rgba(0,0,0,0.6);
  }

  .card-shell.compact {
    width: 70px;
    min-height: 90px;
  }

  .card-shell.face-down {
    background: repeating-linear-gradient(
      45deg,
      #261d12,
      #261d12 4px,
      #3a2c1c 4px,
      #3a2c1c 8px
    );
  }

  .card-back {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .back-icon {
    font-size: 40px;
    opacity: 0.4;
  }

  .card-top {
    padding: 4px 6px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 4px;
  }

  .card-name {
    font-size: 9px;
    font-weight: 600;
    color: #f4e9d5;
    line-height: 1.2;
    flex: 1;
  }

  .card-cat-icon {
    font-size: 10px;
  }

  .card-body {
    flex: 1;
    padding: 4px 6px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .card-flavor {
    font-size: 8px;
    color: #a89880;
    font-style: italic;
    line-height: 1.3;
    margin: 0;
  }

  .card-vp {
    font-size: 9px;
    color: #d4a24c;
    font-weight: 600;
  }

  .card-footer {
    padding: 4px 6px;
    border-top: 1px solid rgba(212,162,76,0.1);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 2px;
  }

  .card-cost {
    display: flex;
    flex-wrap: wrap;
    gap: 2px;
  }

  .cost-item {
    font-size: 8px;
    color: #a89880;
    display: flex;
    align-items: center;
    gap: 1px;
  }

  .cost-free {
    font-size: 8px;
    color: #5a8a3a;
  }

  .vp-badge {
    font-size: 8px;
    color: #d4a24c;
    background: rgba(212,162,76,0.15);
    padding: 1px 3px;
    border-radius: 3px;
  }
</style>
