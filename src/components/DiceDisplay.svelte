<script lang="ts">
  import type { DiceRoll } from '../lib/engine/types.js';
  import { eventLabel } from '../lib/engine/dice.js';

  interface Props {
    roll: DiceRoll | null;
    rolling?: boolean;
  }

  let { roll, rolling = false }: Props = $props();

  const dicePips: Record<number, string> = {
    1: '⚀', 2: '⚁', 3: '⚂', 4: '⚃', 5: '⚄', 6: '⚅',
  };

  const eventColors: Record<string, string> = {
    tournament: '#9b59b6',
    harvest: '#27ae60',
    brigand: '#c44a2a',
    trade: '#d4a24c',
    good_year: '#5a8a3a',
    plague: '#7f8c8d',
  };
</script>

<div class="dice-display">
  {#if roll}
    <div class="die prod-die" class:rolling>
      <span class="die-face" title="Production: {roll.production}">
        {dicePips[roll.production]}
      </span>
      <span class="die-label">Prod</span>
    </div>
    <div class="die event-die" class:rolling style="--event-color: {eventColors[roll.event]}">
      <span class="die-face event-face" title={eventLabel(roll.event)}>
        {roll.event === 'tournament' ? '🏆' :
         roll.event === 'harvest' ? '🌾' :
         roll.event === 'brigand' ? '🗡️' :
         roll.event === 'trade' ? '🏦' :
         roll.event === 'good_year' ? '☀️' : '💀'}
      </span>
      <span class="die-label" style="color: {eventColors[roll.event]}">{eventLabel(roll.event)}</span>
    </div>
  {:else}
    <div class="no-roll">
      <span>🎲</span>
      <span class="die-label">Roll dice</span>
    </div>
  {/if}
</div>

<style>
  .dice-display {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .die {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }

  .die-face {
    font-size: 28px;
    line-height: 1;
  }

  .die-label {
    font-size: 8px;
    color: #a89880;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    text-align: center;
    max-width: 48px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .die.rolling .die-face {
    animation: diceRoll 0.8s ease-out;
  }

  .event-die .event-face {
    filter: drop-shadow(0 0 4px var(--event-color, #d4a24c));
  }

  .no-roll {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    opacity: 0.5;
  }

  .no-roll span:first-child {
    font-size: 24px;
  }

  @keyframes diceRoll {
    0% { transform: rotate(0deg) scale(1); }
    25% { transform: rotate(180deg) scale(1.3); }
    75% { transform: rotate(540deg) scale(0.85); }
    100% { transform: rotate(720deg) scale(1); }
  }
</style>
