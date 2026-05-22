<script lang="ts">
  import type { GameState, PlayerId } from '../lib/engine/types.js';
  import { newGame } from '../lib/stores.js';

  interface Props {
    state: GameState;
    winner: PlayerId;
  }

  let { state, winner }: Props = $props();

  const winPlayer = $derived(state.players[winner]);
  const losePlayer = $derived(state.players[winner === 'p1' ? 'p2' : 'p1']);

  function statBreakdown(pid: PlayerId) {
    const p = state.players[pid];
    const settlements = p.principality.settlements.filter(s => s.type === 'settlement').length;
    const cities = p.principality.settlements.filter(s => s.type === 'city').length;
    return { settlements, cities, tradeToken: p.tradeToken, strengthToken: p.strengthToken, cardVP: p.playedCards.reduce((sum, c) => {
      try { const def = (window as any).__cardDefs?.[c.definitionId]; return sum + (def?.vpValue ?? 0); } catch { return sum; }
    }, 0), vp: p.vp };
  }

  function restart() {
    newGame();
  }
</script>

<div class="overlay">
  <div class="win-modal">
    <div class="confetti-row">🎉 🏆 🎉</div>
    <h2 class="win-title">{winPlayer.name} Wins!</h2>
    <p class="win-vp">{winPlayer.vp} Victory Points</p>

    <div class="stats-grid">
      {#each [winner, winner === 'p1' ? 'p2' : 'p1'] as pid}
        {@const p = state.players[pid as import('../lib/engine/types.js').PlayerId]}
        {@const settlements = p.principality.settlements.filter(s => s.type === 'settlement').length}
        {@const cities = p.principality.settlements.filter(s => s.type === 'city').length}
        <div class="stat-col" class:winner={pid === winner}>
          <div class="stat-name">{p.name}</div>
          <div class="stat-vp">⭐ {p.vp} VP</div>
          <div class="stat-row"><span class="sl">🏠 Settlements</span><span>{settlements}</span></div>
          <div class="stat-row"><span class="sl">🏰 Cities</span><span>{cities}</span></div>
          <div class="stat-row"><span class="sl">🏦 Trade Token</span><span>{p.tradeToken ? '✓' : '—'}</span></div>
          <div class="stat-row"><span class="sl">⚔️ Strength Token</span><span>{p.strengthToken ? '✓' : '—'}</span></div>
          <div class="stat-row"><span class="sl">🃏 Cards Played</span><span>{p.playedCards.length}</span></div>
          <div class="stat-row"><span class="sl">Turn</span><span>{state.turn}</span></div>
        </div>
      {/each}
    </div>

    <button class="btn btn-primary play-again-btn" onclick={restart}>
      Play Again
    </button>
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(10, 7, 4, 0.94);
    backdrop-filter: blur(8px);
  }

  .win-modal {
    background: var(--bg-card);
    border: 1px solid rgba(212,162,76,0.4);
    border-radius: 16px;
    padding: 40px 32px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    max-width: 480px;
    width: 95%;
    box-shadow: 0 0 60px rgba(212,162,76,0.15), 0 24px 64px rgba(0,0,0,0.8);
    animation: popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .confetti-row {
    font-size: 32px;
  }

  .win-title {
    font-family: 'Crimson Pro', Georgia, serif;
    font-size: 36px;
    color: #d4a24c;
    margin: 0;
    text-align: center;
  }

  .win-vp {
    font-size: 18px;
    color: #f4e9d5;
    margin: 0;
    font-weight: 500;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    width: 100%;
  }

  .stat-col {
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 8px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .stat-col.winner {
    border-color: rgba(212,162,76,0.3);
    background: rgba(212,162,76,0.04);
  }

  .stat-name {
    font-size: 14px;
    font-weight: 600;
    color: #f4e9d5;
    font-family: 'Crimson Pro', Georgia, serif;
  }

  .stat-vp {
    font-size: 18px;
    color: #d4a24c;
    font-weight: 700;
  }

  .stat-row {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: #a89880;
  }

  .sl {
    opacity: 0.8;
  }

  .play-again-btn {
    padding: 14px 36px;
    font-size: 16px;
    border-radius: 8px;
  }

  @keyframes popIn {
    from { opacity: 0; transform: scale(0.8); }
    to { opacity: 1; transform: scale(1); }
  }
</style>
