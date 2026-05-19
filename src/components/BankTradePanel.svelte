<script lang="ts">
  import type { PlayerState, GameState, ResourceType } from '../lib/engine/types.js';
  import { ALL_RESOURCES } from '../lib/engine/types.js';
  import { canBankTrade, getResourceTotal } from '../lib/engine/rules.js';
  import ResourceIcon from './ResourceIcon.svelte';
  import { dispatch } from '../lib/stores.js';

  interface Props {
    player: PlayerState;
    state: GameState;
  }

  let { player, state: gs }: Props = $props();

  let giveRes = $state<ResourceType>('wood');
  let receiveRes = $state<ResourceType>('ore');

  const tradeCost = $derived(player.seaHarbor ? 2 : 3);
  const canTrade = $derived(canBankTrade(gs, player.id, giveRes, receiveRes).ok);

  async function doTrade() {
    if (!canTrade) return;
    await dispatch({ type: 'BANK_TRADE', playerId: player.id, give: giveRes, receive: receiveRes });
  }
</script>

<div class="bank-panel">
  <span class="bank-label">Bank Trade ({tradeCost}:1)</span>
  <div class="trade-row">
    <div class="res-select">
      <span class="sel-label">Give {tradeCost}×</span>
      <div class="res-btns">
        {#each ALL_RESOURCES as res}
          {@const amt = getResourceTotal(player, res)}
          <button
            class="res-btn"
            class:selected={giveRes === res}
            class:insufficient={amt < tradeCost}
            onclick={() => { giveRes = res; }}
            title="{res}: {amt} available"
          >
            <ResourceIcon resource={res} size={14} />
            <span class="res-amt">{amt}</span>
          </button>
        {/each}
      </div>
    </div>
    <span class="arrow">→</span>
    <div class="res-select">
      <span class="sel-label">Get 1×</span>
      <div class="res-btns">
        {#each ALL_RESOURCES as res}
          <button
            class="res-btn"
            class:selected={receiveRes === res}
            onclick={() => { receiveRes = res; }}
          >
            <ResourceIcon resource={res} size={14} />
          </button>
        {/each}
      </div>
    </div>
    <button class="btn btn-primary trade-btn" onclick={doTrade} disabled={!canTrade}>
      Trade
    </button>
  </div>
</div>

<style>
  .bank-panel {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px 10px;
    background: rgba(212,162,76,0.04);
    border-radius: 6px;
    border: 1px solid rgba(212,162,76,0.1);
  }

  .bank-label {
    font-size: 10px;
    color: #a89880;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .trade-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .res-select {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .sel-label {
    font-size: 9px;
    color: #a89880;
  }

  .res-btns {
    display: flex;
    gap: 2px;
  }

  .res-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1px;
    padding: 3px;
    border-radius: 4px;
    border: 1px solid transparent;
    background: transparent;
    cursor: pointer;
    transition: all 0.1s ease;
    color: #f4e9d5;
  }

  .res-btn:hover {
    background: rgba(212,162,76,0.1);
    border-color: rgba(212,162,76,0.2);
  }

  .res-btn.selected {
    background: rgba(212,162,76,0.15);
    border-color: rgba(212,162,76,0.5);
  }

  .res-btn.insufficient {
    opacity: 0.35;
  }

  .res-amt {
    font-size: 7px;
    color: #a89880;
  }

  .arrow {
    font-size: 16px;
    color: #d4a24c;
  }

  .trade-btn {
    font-size: 11px;
    padding: 5px 12px;
  }
</style>
