<script lang="ts">
  import type { TurnPhase } from '../lib/engine/types.js';

  interface Props {
    phase: TurnPhase;
  }

  let { phase }: Props = $props();

  const phases: { id: TurnPhase; label: string; color: string; icon: string }[] = [
    { id: 'roll', label: 'Roll', color: '#9b59b6', icon: '🎲' },
    { id: 'action', label: 'Action', color: '#e67e22', icon: '⚡' },
    { id: 'replenish', label: 'Draw', color: '#27ae60', icon: '🃏' },
    { id: 'exchange', label: 'Exchange', color: '#2980b9', icon: '🔄' },
  ];
</script>

<div class="phase-indicator">
  {#each phases as p}
    <div
      class="phase-pill"
      class:active={phase === p.id}
      style="--phase-color: {p.color}; color: {p.color}; border-color: {p.color};"
    >
      <span class="phase-icon">{p.icon}</span>
      <span class="phase-label">{p.label}</span>
    </div>
  {/each}
</div>

<style>
  .phase-indicator {
    display: flex;
    gap: 4px;
    align-items: center;
  }

  .phase-pill {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border-radius: 20px;
    border: 1px solid currentColor;
    opacity: 0.3;
    transition: opacity 0.25s ease, box-shadow 0.25s ease;
    font-size: 11px;
    font-weight: 500;
    white-space: nowrap;
  }

  .phase-pill.active {
    opacity: 1;
    box-shadow: 0 0 8px var(--phase-color);
  }

  .phase-icon {
    font-size: 12px;
  }

  .phase-label {
    font-size: 10px;
    letter-spacing: 0.3px;
    text-transform: uppercase;
  }

  @media (max-width: 480px) {
    .phase-label {
      display: none;
    }

    .phase-pill {
      padding: 4px 6px;
    }
  }
</style>
