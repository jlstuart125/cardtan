<script lang="ts">
  import type { GameState, PlayerId } from '../lib/engine/types.js';
  import { dispatch } from '../lib/stores.js';
  import { canEndTurn } from '../lib/engine/rules.js';
  import { eventDescription } from '../lib/engine/dice.js';
  import PhaseIndicator from './PhaseIndicator.svelte';
  import DiceDisplay from './DiceDisplay.svelte';
  import Principality from './Principality.svelte';
  import Hand from './Hand.svelte';
  import DrawStacks from './DrawStacks.svelte';
  import BankTradePanel from './BankTradePanel.svelte';
  import EventLog from './EventLog.svelte';
  import PassOverlay from './PassOverlay.svelte';
  import WinModal from './WinModal.svelte';

  interface Props {
    state: GameState;
    mode?: 'local' | 'online';
    myPlayerId?: PlayerId;
  }

  let { state: gs, mode = 'local', myPlayerId = 'p1' }: Props = $props();

  let rollingDice = $state(false);

  // In online mode, "my" player is always visible at the bottom.
  // In local mode, the active player is at the bottom (hot-seat).
  const bottomPlayerId = $derived(mode === 'online' ? myPlayerId : gs.activePlayer);
  const topPlayerId = $derived(bottomPlayerId === 'p1' ? 'p2' : 'p1');

  const bottomPlayer = $derived(gs.players[bottomPlayerId]);
  const topPlayer = $derived(gs.players[topPlayerId]);

  const isMyTurn = $derived(mode === 'online' ? gs.activePlayer === myPlayerId : true);
  const canRoll = $derived(gs.phase === 'roll' && isMyTurn);
  const canEnd = $derived(canEndTurn(gs, gs.activePlayer) && isMyTurn);
  const showBankTrade = $derived(gs.phase === 'action' && isMyTurn);

  async function rollDice() {
    if (!canRoll) return;
    rollingDice = true;
    await new Promise(r => setTimeout(r, 800));
    await dispatch({ type: 'ROLL_DICE' });
    rollingDice = false;
  }

  async function endTurn() {
    if (!canEnd) return;
    await dispatch({ type: 'END_TURN' });
  }

  const phaseHelp: Record<string, string> = {
    roll: 'Roll the dice to produce resources and trigger an event.',
    action: 'Build roads, settlements, cities, or play cards. Use bank trades here.',
    replenish: 'Draw cards until your hand is full (click a draw stack).',
    exchange: 'Optionally exchange a hand card with a deck. Then end your turn.',
  };

  // Turn indicator for online mode
  const turnLabel = $derived(
    mode === 'online'
      ? isMyTurn
        ? 'Your turn'
        : `Waiting for ${gs.players[gs.activePlayer].name}...`
      : `${gs.players[gs.activePlayer].name}'s Turn`
  );
</script>

<div class="board parchment-bg">

  <!-- Top Bar -->
  <header class="top-bar">
    <PhaseIndicator phase={gs.phase} />

    <div class="center-header">
      <span
        class="active-player-badge"
        class:waiting={mode === 'online' && !isMyTurn}
        style="color: {isMyTurn ? '#5a8a3a' : '#a89880'}"
      >
        {turnLabel}
      </span>
      <span class="turn-num">Turn {gs.turn}</span>
    </div>

    <div class="vp-display">
      <span class="vp-item p1" title="Player 1 VP">
        P1 ⭐ {gs.players.p1.vp}
      </span>
      <span class="vp-sep">/</span>
      <span class="vp-item p2" title="Player 2 VP">
        P2 ⭐ {gs.players.p2.vp}
      </span>
      <span class="vp-target">({gs.targetVP} to win)</span>
    </div>
  </header>

  <!-- Phase Help Banner -->
  <div class="phase-banner">
    <span class="phase-help">{phaseHelp[gs.phase]}</span>
  </div>

  <!-- Main Content -->
  <main class="main-area">

    <!-- Opponent Principality (top, always visible) -->
    <section class="opponent-section">
      <Principality
        player={topPlayer}
        state={gs}
        isActive={false}
        isOpponent={true}
      />
      <!-- Show opponent's hand (card backs in online mode, already filtered) -->
      {#if mode === 'online'}
        <div class="opponent-hand-row">
          <span class="opponent-hand-label">
            {topPlayer.name}'s hand ({topPlayer.hand.length})
          </span>
          <div class="opponent-cards">
            {#each topPlayer.hand as card (card.instanceId)}
              <div class="card-back-mini"></div>
            {/each}
          </div>
        </div>
      {/if}
    </section>

    <!-- Center: Dice + Draw Stacks + Controls -->
    <section class="center-section">
      <div class="center-top">
        <!-- Dice area -->
        <div class="dice-area">
          <DiceDisplay roll={gs.lastRoll} rolling={rollingDice} />
          {#if canRoll}
            <button class="btn btn-primary roll-btn" onclick={rollDice} disabled={rollingDice}>
              {rollingDice ? 'Rolling...' : '🎲 Roll Dice'}
            </button>
          {:else if gs.phase === 'roll' && !isMyTurn}
            <p class="waiting-roll">Waiting for opponent to roll...</p>
          {/if}
          {#if gs.lastRoll}
            <p class="event-desc">{eventDescription(gs.lastRoll.event)}</p>
          {/if}
        </div>

        <!-- Draw stacks -->
        <DrawStacks state={gs} activePlayerId={gs.activePlayer} />
      </div>

      <!-- Action controls -->
      <div class="action-controls">
        {#if showBankTrade}
          <BankTradePanel player={bottomPlayer} state={gs} />
        {/if}

        {#if isMyTurn}
          <div class="turn-controls">
            {#if gs.phase === 'action'}
              <button
                class="btn"
                onclick={() => dispatch({ type: 'END_TURN' })}
                disabled={!canEnd}
                title="End your action phase and move to draw"
              >
                Done with Actions →
              </button>
            {/if}
            {#if gs.phase === 'replenish'}
              <button
                class="btn"
                onclick={() => dispatch({ type: 'END_TURN' })}
                disabled={!canEnd}
              >
                Done Drawing →
              </button>
            {/if}
            {#if gs.phase === 'exchange'}
              <button
                class="btn btn-primary"
                onclick={endTurn}
                disabled={!canEnd}
              >
                End Turn
              </button>
            {/if}
          </div>
        {/if}
      </div>
    </section>

    <!-- Log -->
    <aside class="log-section">
      <EventLog entries={gs.log.slice().reverse().slice(0, 20)} />
    </aside>

  </main>

  <!-- Active Player's Principality + Hand -->
  <section class="player-section">
    <div class="player-principality">
      <Principality
        player={bottomPlayer}
        state={gs}
        isActive={isMyTurn}
        isOpponent={false}
      />
    </div>
    <div class="player-hand">
      <Hand player={bottomPlayer} state={gs} isActive={isMyTurn} />
    </div>
  </section>

  <!-- Overlays: pass overlay only in local mode -->
  {#if gs.showPassOverlay && mode === 'local'}
    <PassOverlay
      nextPlayer={gs.activePlayer}
      playerName={gs.players[gs.activePlayer].name}
    />
  {/if}

  {#if gs.status === 'game_over' && gs.winner}
    <WinModal state={gs} winner={gs.winner} />
  {/if}
</div>

<style>
  .board {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: var(--bg-deep);
    color: var(--text);
    font-family: 'Inter', system-ui, sans-serif;
  }

  .top-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 16px;
    background: var(--bg-surface);
    border-bottom: 1px solid rgba(212,162,76,0.15);
    gap: 12px;
    flex-wrap: wrap;
  }

  .center-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }

  .active-player-badge {
    font-size: 15px;
    font-weight: 600;
    font-family: 'Crimson Pro', Georgia, serif;
  }

  .turn-num {
    font-size: 10px;
    color: #a89880;
  }

  .vp-display {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
  }

  .vp-item {
    font-weight: 600;
  }

  .vp-item.p1 { color: #5a8a3a; }
  .vp-item.p2 { color: #c44a2a; }

  .vp-sep {
    color: #a89880;
  }

  .vp-target {
    font-size: 10px;
    color: #a89880;
  }

  .phase-banner {
    background: rgba(212,162,76,0.05);
    border-bottom: 1px solid rgba(212,162,76,0.08);
    padding: 6px 16px;
  }

  .phase-help {
    font-size: 11px;
    color: #a89880;
    font-style: italic;
  }

  .main-area {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: 12px;
    padding: 12px;
    flex: 1;
    min-height: 0;
  }

  @media (max-width: 800px) {
    .main-area {
      grid-template-columns: 1fr;
    }
  }

  .opponent-section {
    grid-column: 1 / -1;
  }

  .opponent-hand-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 6px;
    flex-wrap: wrap;
  }

  .opponent-hand-label {
    font-size: 11px;
    color: #a89880;
  }

  .opponent-cards {
    display: flex;
    gap: 4px;
  }

  .card-back-mini {
    width: 24px;
    height: 36px;
    border-radius: 3px;
    background: repeating-linear-gradient(
      45deg,
      #261d12,
      #261d12 3px,
      #3a2c1c 3px,
      #3a2c1c 6px
    );
    border: 1px solid rgba(212,162,76,0.2);
  }

  .center-section {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 280px;
  }

  .center-top {
    display: flex;
    gap: 16px;
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .dice-area {
    display: flex;
    flex-direction: column;
    gap: 6px;
    align-items: center;
  }

  .roll-btn {
    padding: 8px 16px;
    font-size: 13px;
  }

  .waiting-roll {
    font-size: 11px;
    color: #a89880;
    font-style: italic;
    margin: 0;
    text-align: center;
  }

  .event-desc {
    font-size: 10px;
    color: #a89880;
    font-style: italic;
    text-align: center;
    max-width: 150px;
    margin: 0;
  }

  .action-controls {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .turn-controls {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .log-section {
    min-width: 180px;
    max-width: 220px;
  }

  @media (max-width: 800px) {
    .log-section {
      max-width: 100%;
    }
  }

  .player-section {
    padding: 12px;
    background: var(--bg-surface);
    border-top: 1px solid rgba(212,162,76,0.15);
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    align-items: flex-start;
  }

  .player-principality {
    flex: 1;
    min-width: 300px;
  }

  .player-hand {
    flex: 0 0 auto;
    min-width: 200px;
  }
</style>
