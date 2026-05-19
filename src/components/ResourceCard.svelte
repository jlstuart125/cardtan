<script lang="ts">
  // A terrain resource region card — shows resource type, dice number, and rotation level.
  import type { ResourceRegion } from '../lib/engine/types.js';
  import ResourceIcon from './ResourceIcon.svelte';

  interface Props {
    region: ResourceRegion;
    compact?: boolean;
  }

  let { region, compact = false }: Props = $props();

  const levelColors = ['#2a2010', '#3a4a20', '#4a6a28', '#5a8a30'];
  const levelLabels = ['Empty', '1', '2', 'Full'];

  const rotationDeg = $derived(region.level * 90);

  const resourceNames: Record<string, string> = {
    wood: 'Wood',
    brick: 'Brick',
    grain: 'Grain',
    wool: 'Wool',
    ore: 'Ore',
    gold: 'Gold',
  };
</script>

<div
  class="region-card"
  class:compact
  style="background: {levelColors[region.level]};"
  title="{resourceNames[region.resource]} — Roll {region.diceNumber} — Level {region.level}"
>
  <div class="region-inner" style="transform: rotate({rotationDeg}deg); transition: transform 0.4s cubic-bezier(0.4,0,0.2,1);">
    <ResourceIcon resource={region.resource} size={compact ? 14 : 18} />
  </div>
  <div class="region-meta">
    <span class="dice-num" class:compact>{region.diceNumber}</span>
    {#if !compact}
      <span class="level-badge" style="color: {region.level === 3 ? '#e8c468' : '#a89880'}">
        {'●'.repeat(region.level)}{'○'.repeat(3 - region.level)}
      </span>
    {/if}
  </div>
</div>

<style>
  .region-card {
    width: 56px;
    height: 56px;
    border-radius: 6px;
    border: 1px solid rgba(212,162,76,0.2);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    position: relative;
    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04);
    transition: background 0.3s ease;
  }

  .region-card.compact {
    width: 36px;
    height: 36px;
  }

  .region-inner {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .region-meta {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1px;
  }

  .dice-num {
    font-size: 10px;
    font-weight: 700;
    color: #d4a24c;
    line-height: 1;
  }

  .dice-num.compact {
    font-size: 8px;
  }

  .level-badge {
    font-size: 7px;
    letter-spacing: 1px;
  }
</style>
