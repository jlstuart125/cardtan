<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  interface Props {
    onConcede: () => void;
    onLeave: () => void;
  }

  let { onConcede, onLeave }: Props = $props();

  let seconds = $state(60);
  let timer: ReturnType<typeof setInterval> | null = null;

  onMount(() => {
    timer = setInterval(() => {
      seconds = Math.max(0, seconds - 1);
      if (seconds === 0) {
        clearInterval(timer!);
        onLeave();
      }
    }, 1000);
  });

  onDestroy(() => {
    if (timer !== null) clearInterval(timer);
  });
</script>

<div class="overlay">
  <div class="panel">
    <div class="icon">&#9888;</div>
    <h2>Opponent Disconnected</h2>
    <p class="countdown">
      Waiting <strong>{seconds}s</strong> for reconnect...
    </p>
    <div class="actions">
      <button class="btn btn-secondary" onclick={onConcede}>
        Concede & End Game
      </button>
      <button class="btn btn-text" onclick={onLeave}>
        Leave to Menu
      </button>
    </div>
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    z-index: 150;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(10, 7, 4, 0.92);
    backdrop-filter: blur(4px);
    padding: 16px;
  }

  .panel {
    background: var(--bg-surface);
    border: 1px solid rgba(212,162,76,0.25);
    border-radius: 16px;
    padding: 40px 32px;
    max-width: 360px;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    text-align: center;
  }

  .icon {
    font-size: 48px;
    color: #d4a24c;
  }

  h2 {
    font-family: 'Crimson Pro', Georgia, serif;
    font-size: 24px;
    color: #f4e9d5;
    margin: 0;
  }

  .countdown {
    font-size: 14px;
    color: #a89880;
    margin: 0;
  }

  .countdown strong {
    color: #d4a24c;
    font-size: 18px;
  }

  .actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
  }

  .btn-secondary {
    background: transparent;
    border: 1px solid rgba(212,162,76,0.35);
    color: #d4a24c;
    border-radius: 8px;
    cursor: pointer;
    font-family: inherit;
    font-weight: 500;
    font-size: 14px;
    padding: 12px;
    min-height: 44px;
    transition: background 0.15s;
  }

  .btn-secondary:hover { background: rgba(212,162,76,0.08); }

  .btn-text {
    background: none;
    border: none;
    color: #6b5a48;
    font-size: 13px;
    font-family: inherit;
    cursor: pointer;
    padding: 8px;
    min-height: 44px;
    transition: color 0.15s;
  }

  .btn-text:hover { color: #a89880; }
</style>
