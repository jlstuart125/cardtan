<script lang="ts">
  import type { LogEntry, PlayerId } from '../lib/engine/types.js';

  interface Props {
    entries: LogEntry[];
  }

  let { entries }: Props = $props();

  function playerColor(pid: PlayerId): string {
    return pid === 'p1' ? '#5a8a3a' : '#c44a2a';
  }
</script>

<div class="event-log">
  <div class="log-header">Turn Log</div>
  <div class="log-entries">
    {#each entries as entry (entry.id)}
      <div class="log-entry animate-slide-in">
        <span class="player-dot" style="background: {playerColor(entry.playerId)}"></span>
        <span class="entry-text">{entry.message}</span>
      </div>
    {/each}
    {#if entries.length === 0}
      <p class="log-empty">Game starting...</p>
    {/if}
  </div>
</div>

<style>
  .event-log {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 180px;
    max-width: 220px;
  }

  .log-header {
    font-size: 10px;
    color: #a89880;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .log-entries {
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-height: 300px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(212,162,76,0.2) transparent;
  }

  .log-entry {
    display: flex;
    align-items: flex-start;
    gap: 5px;
    padding: 3px 0;
    border-bottom: 1px solid rgba(255,255,255,0.03);
  }

  .player-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
    margin-top: 3px;
  }

  .entry-text {
    font-size: 10px;
    color: #a89880;
    line-height: 1.4;
  }

  .log-empty {
    font-size: 10px;
    color: #a89880;
    font-style: italic;
    margin: 0;
  }

  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-8px); }
    to { opacity: 1; transform: translateX(0); }
  }

  .animate-slide-in {
    animation: slideIn 0.2s ease-out;
  }
</style>
