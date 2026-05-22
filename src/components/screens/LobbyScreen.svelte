<script lang="ts">
  interface Props {
    localHandle: string;
    remoteHandle: string | null;
    role: 'host' | 'joiner';
    localReady: boolean;
    remoteReady: boolean;
    onReady: () => void;
    onCancel: () => void;
  }

  let {
    localHandle,
    remoteHandle,
    role,
    localReady,
    remoteReady,
    onReady,
    onCancel,
  }: Props = $props();

  const canStart = $derived(localReady && remoteReady);
  const waitingFor = $derived(
    !localReady ? 'you' : !remoteReady ? 'opponent' : null
  );
</script>

<div class="screen">
  <div class="card">
    <h2 class="heading">Game Lobby</h2>

    <div class="players">
      <div class="player-row" class:ready={localReady}>
        <span class="player-dot" class:ready={localReady}></span>
        <span class="player-name">{localHandle} <em>(you)</em></span>
        <span class="player-status">{localReady ? 'Ready' : 'Not ready'}</span>
      </div>

      <div class="player-row" class:ready={remoteReady}>
        <span class="player-dot" class:ready={remoteReady}></span>
        <span class="player-name">
          {#if remoteHandle}
            {remoteHandle}
          {:else}
            <em class="waiting">Connecting...</em>
          {/if}
        </span>
        <span class="player-status">{remoteReady ? 'Ready' : 'Waiting...'}</span>
      </div>
    </div>

    {#if !localReady}
      <button class="btn btn-primary ready-btn" onclick={onReady} disabled={!remoteHandle}>
        I'm Ready
      </button>
    {:else if !canStart}
      <div class="waiting-msg">
        Waiting for {remoteHandle ?? 'opponent'} to be ready...
      </div>
    {:else}
      <div class="starting-msg">
        Game starting...
      </div>
    {/if}

    <button class="btn-text" onclick={onCancel}>
      Leave
    </button>
  </div>
</div>

<style>
  .screen {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px 16px;
    background: var(--bg-deep);
  }

  .card {
    background: var(--bg-surface);
    border: 1px solid rgba(212,162,76,0.2);
    border-radius: 16px;
    padding: 36px 32px;
    width: 100%;
    max-width: 380px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    text-align: center;
  }

  .heading {
    font-family: 'Crimson Pro', Georgia, serif;
    font-size: 26px;
    color: #f4e9d5;
    margin: 0;
  }

  .players {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .player-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    background: var(--bg-deep);
    border: 1px solid rgba(212,162,76,0.1);
    border-radius: 10px;
    transition: border-color 0.2s;
  }

  .player-row.ready {
    border-color: rgba(90,138,58,0.5);
  }

  .player-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #6b5a48;
    flex-shrink: 0;
    transition: background 0.2s;
  }

  .player-dot.ready {
    background: #5a8a3a;
  }

  .player-name {
    flex: 1;
    font-size: 14px;
    color: #f4e9d5;
    text-align: left;
  }

  .player-name em {
    color: #a89880;
    font-style: normal;
  }

  .player-name .waiting {
    color: #6b5a48;
  }

  .player-status {
    font-size: 11px;
    color: #6b5a48;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .player-row.ready .player-status {
    color: #5a8a3a;
  }

  .ready-btn {
    width: 100%;
    padding: 12px;
    font-size: 15px;
    min-height: 44px;
  }

  .waiting-msg, .starting-msg {
    font-size: 13px;
    color: #a89880;
    font-style: italic;
  }

  .starting-msg {
    color: #d4a24c;
  }

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
