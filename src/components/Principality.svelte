<script lang="ts">
  import type { PlayerState, PlayerId, SettlementId, RoadId } from '../lib/engine/types.js';
  import type { GameState } from '../lib/engine/types.js';
  import ResourceCard from './ResourceCard.svelte';
  import { canBuildRoad, canBuildSettlement, canBuildCity } from '../lib/engine/rules.js';
  import { dispatch } from '../lib/stores.js';

  interface Props {
    player: PlayerState;
    state: GameState;
    isActive: boolean;
    isOpponent?: boolean;
  }

  let { player, state: gs, isActive, isOpponent = false }: Props = $props();

  const pid = $derived(player.id);

  function structureIcon(type: 'empty' | 'settlement' | 'city'): string {
    if (type === 'settlement') return '🏠';
    if (type === 'city') return '🏰';
    return '';
  }

  function structureColor(type: 'empty' | 'settlement' | 'city', playerId: PlayerId): string {
    if (type === 'settlement') return playerId === 'p1' ? '#5a8a3a' : '#c44a2a';
    if (type === 'city') return playerId === 'p1' ? '#d4a24c' : '#9b59b6';
    return 'transparent';
  }

  async function onClickSettlement(sId: SettlementId) {
    if (!isActive || isOpponent) return;
    const node = player.principality.settlements.find(s => s.id === sId);
    if (!node) return;
    if (node.type === 'empty' && canBuildSettlement(gs, pid, sId).ok) {
      await dispatch({ type: 'BUILD_SETTLEMENT', playerId: pid, settlementId: sId });
    } else if (node.type === 'settlement' && canBuildCity(gs, pid, sId).ok) {
      await dispatch({ type: 'BUILD_CITY', playerId: pid, settlementId: sId });
    }
  }

  async function onClickRoad(rId: RoadId) {
    if (!isActive || isOpponent) return;
    if (canBuildRoad(gs, pid, rId).ok) {
      await dispatch({ type: 'BUILD_ROAD', playerId: pid, roadId: rId });
    }
  }

  function settlementValidTarget(sId: SettlementId): boolean {
    if (!isActive || isOpponent || gs.phase !== 'action') return false;
    const node = player.principality.settlements.find(s => s.id === sId);
    if (!node) return false;
    if (node.type === 'empty') return canBuildSettlement(gs, pid, sId).ok;
    if (node.type === 'settlement') return canBuildCity(gs, pid, sId).ok;
    return false;
  }

  function roadValidTarget(rId: RoadId): boolean {
    if (!isActive || isOpponent || gs.phase !== 'action') return false;
    return canBuildRoad(gs, pid, rId).ok;
  }
</script>

<div class="principality" class:opponent={isOpponent}>
  <div class="p-header">
    <span class="p-name">{player.name}</span>
    <span class="p-vp">⭐ {player.vp} VP</span>
    {#if player.tradeToken}
      <span class="token trade-tok" title="Trade Token (+1 VP)">🏦</span>
    {/if}
    {#if player.strengthToken}
      <span class="token str-tok" title="Strength Token (+1 VP)">⚔️</span>
    {/if}
    {#if player.seaHarbor}
      <span class="token harbor-tok" title="Sea Harbor (2:1 trade)">⚓</span>
    {/if}
  </div>

  <!-- The grid -->
  <div class="grid-area">
    {#each player.principality.settlements as settlement, idx}
      <!-- Settlement node with surrounding regions -->
      <div class="settlement-col">
        <!-- Top regions -->
        <div class="region-row top">
          {#each settlement.regions.slice(0, 2) as regionId}
            {@const region = player.principality.regions.find(r => r.id === regionId)}
            {#if region}
              <ResourceCard {region} compact={isOpponent} />
            {/if}
          {/each}
        </div>

        <!-- Settlement node -->
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="settlement-node"
          class:valid={settlementValidTarget(settlement.id)}
          class:has-structure={settlement.type !== 'empty'}
          style="border-color: {structureColor(settlement.type, pid)}"
          onclick={() => onClickSettlement(settlement.id)}
          title={settlement.type === 'empty' ? 'Empty — click to build settlement' : settlement.type === 'settlement' ? 'Settlement — click to upgrade' : 'City'}
        >
          {#if settlement.type !== 'empty'}
            <span class="structure-icon">{structureIcon(settlement.type)}</span>
          {:else}
            <span class="empty-dot">·</span>
          {/if}
        </div>

        <!-- Bottom regions -->
        <div class="region-row bottom">
          {#each settlement.regions.slice(2, 4) as regionId}
            {@const region = player.principality.regions.find(r => r.id === regionId)}
            {#if region}
              <ResourceCard {region} compact={isOpponent} />
            {/if}
          {/each}
        </div>
      </div>

      <!-- Road between settlements -->
      {#if idx < player.principality.roads.length}
        {@const road = player.principality.roads[idx]}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="road-seg"
          class:built={road.built}
          class:valid={roadValidTarget(road.id)}
          onclick={() => onClickRoad(road.id)}
          title={road.built ? 'Road' : 'Empty road slot — click to build'}
        >
          {#if road.built}
            <div class="road-fill"></div>
          {:else}
            <div class="road-empty"></div>
          {/if}
        </div>
      {/if}
    {/each}
  </div>

  <!-- Played cards -->
  {#if player.playedCards.length > 0}
    <div class="played-cards">
      <span class="played-label">In Play:</span>
      {#each player.playedCards as card}
        <span class="played-card-name">{card.definitionId.replace(/_/g, ' ')}</span>
      {/each}
    </div>
  {/if}
</div>

<style>
  .principality {
    padding: 12px;
    background: var(--bg-surface);
    border-radius: 10px;
    border: 1px solid rgba(212,162,76,0.15);
  }

  .principality.opponent {
    opacity: 0.85;
  }

  .p-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
  }

  .p-name {
    font-family: 'Crimson Pro', Georgia, serif;
    font-size: 16px;
    font-weight: 600;
    color: #f4e9d5;
  }

  .p-vp {
    font-size: 13px;
    color: #d4a24c;
    font-weight: 600;
  }

  .token {
    font-size: 14px;
  }

  .grid-area {
    display: flex;
    align-items: center;
    gap: 4px;
    overflow-x: auto;
    padding-bottom: 4px;
  }

  .settlement-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }

  .region-row {
    display: flex;
    gap: 2px;
  }

  .settlement-node {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 2px solid rgba(212,162,76,0.2);
    background: #1a130c;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.15s ease;
    flex-shrink: 0;
  }

  .settlement-node:hover {
    border-color: rgba(212,162,76,0.6);
    background: #261d12;
  }

  .settlement-node.valid {
    border-color: #5a8a3a;
    box-shadow: 0 0 8px rgba(90,138,58,0.5);
    animation: glowGreen 1.5s ease-in-out infinite;
  }

  .settlement-node.has-structure {
    background: #261d12;
  }

  .structure-icon {
    font-size: 18px;
  }

  .empty-dot {
    color: rgba(212,162,76,0.3);
    font-size: 18px;
  }

  .road-seg {
    width: 32px;
    height: 12px;
    display: flex;
    align-items: center;
    cursor: pointer;
    flex-shrink: 0;
    align-self: center;
    margin-top: 36px; /* align with middle of settlement node */
  }

  .road-fill {
    width: 100%;
    height: 8px;
    background: linear-gradient(90deg, #7a5a30, #9a7a4a);
    border-radius: 4px;
    border: 1px solid #5a3a18;
    box-shadow: 0 1px 4px rgba(0,0,0,0.4);
  }

  .road-empty {
    width: 100%;
    height: 4px;
    background: rgba(212,162,76,0.1);
    border-radius: 2px;
    border: 1px dashed rgba(212,162,76,0.2);
  }

  .road-seg.valid .road-empty {
    background: rgba(90,138,58,0.2);
    border-color: rgba(90,138,58,0.5);
    box-shadow: 0 0 6px rgba(90,138,58,0.4);
  }

  .road-seg:hover .road-empty {
    background: rgba(212,162,76,0.15);
  }

  .played-cards {
    margin-top: 8px;
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    align-items: center;
  }

  .played-label {
    font-size: 10px;
    color: #a89880;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .played-card-name {
    font-size: 9px;
    background: rgba(212,162,76,0.1);
    color: #d4a24c;
    padding: 2px 6px;
    border-radius: 10px;
    border: 1px solid rgba(212,162,76,0.2);
    text-transform: capitalize;
  }

  @keyframes glowGreen {
    0%, 100% { box-shadow: 0 0 4px rgba(90,138,58,0.3); }
    50% { box-shadow: 0 0 12px rgba(90,138,58,0.7); }
  }
</style>
