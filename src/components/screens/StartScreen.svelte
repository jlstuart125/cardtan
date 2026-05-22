<script lang="ts">
  import { generateHandle } from '../../lib/handles.js';

  interface Props {
    onHost: (handle: string) => void;
    onJoin: (handle: string) => void;
    onLocal: () => void;
    initialCode?: string; // pre-filled from URL hash
  }

  let { onHost, onJoin, onLocal, initialCode = '' }: Props = $props();

  let handle = $state(generateHandle());
  let showHowModal = $state(false);
  let peerError = $state('');

  function trimHandle(v: string) {
    return v.replace(/[^A-Za-z0-9]/g, '').slice(0, 20);
  }

  // If there's a join code in the URL, go straight to join screen
  $effect(() => {
    if (initialCode) {
      onJoin(handle);
    }
  });
</script>

<div class="screen">
  <div class="hero">
    <h1 class="title">Ca(rd)tan</h1>
    <p class="subtitle">A 2-player card-driven settlement game</p>
  </div>

  <div class="card">
    <label class="field-label" for="handle-input">Your name</label>
    <input
      id="handle-input"
      class="input"
      type="text"
      value={handle}
      oninput={(e) => { handle = trimHandle((e.target as HTMLInputElement).value); }}
      placeholder="BraveBison"
      maxlength={20}
      autocomplete="off"
      spellcheck={false}
    />

    {#if peerError}
      <p class="error">{peerError}</p>
    {/if}

    <div class="actions">
      <button class="btn btn-primary" onclick={() => onHost(handle)} disabled={!handle}>
        Host Game
      </button>
      <button class="btn btn-secondary" onclick={() => onJoin(handle)} disabled={!handle}>
        Join Game
      </button>
    </div>

    <div class="divider">
      <span>or</span>
    </div>

    <button class="btn-text" onclick={onLocal}>
      Play locally on this device (hot-seat)
    </button>

    <button class="btn-link" onclick={() => { showHowModal = true; }}>
      How does this work?
    </button>
  </div>
</div>

{#if showHowModal}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="modal-bg" onclick={() => { showHowModal = false; }}>
    <div class="modal" onclick={(e) => e.stopPropagation()}>
      <h2>How online play works</h2>
      <p>
        Cardtan uses <strong>WebRTC peer-to-peer</strong> connections — your browser
        connects directly to your friend's browser. There is no server storing your
        game data.
      </p>
      <p>
        A tiny public <em>signaling broker</em> (PeerJS) helps the two browsers find
        each other, then steps aside. After that, all game traffic is direct.
      </p>
      <p>
        <strong>Important:</strong> this is friend-play only. The host's browser runs
        the authoritative game engine, so the host could theoretically tamper with
        the state. Only play with people you trust!
      </p>
      <p>
        Some strict corporate or campus networks block WebRTC. If you can't connect,
        try a mobile hotspot.
      </p>
      <button class="btn btn-primary" onclick={() => { showHowModal = false; }}>
        Got it
      </button>
    </div>
  </div>
{/if}

<style>
  .screen {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px 16px;
    gap: 32px;
    background: var(--bg-deep);
  }

  .hero {
    text-align: center;
  }

  .title {
    font-family: 'Crimson Pro', Georgia, serif;
    font-size: clamp(48px, 10vw, 80px);
    color: #d4a24c;
    margin: 0;
    letter-spacing: -1px;
  }

  .subtitle {
    font-size: 14px;
    color: #a89880;
    margin: 8px 0 0;
    font-style: italic;
  }

  .card {
    background: var(--bg-surface);
    border: 1px solid rgba(212,162,76,0.2);
    border-radius: 16px;
    padding: 32px 28px;
    width: 100%;
    max-width: 380px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .field-label {
    font-size: 11px;
    color: #a89880;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .input {
    background: var(--bg-deep);
    border: 1px solid rgba(212,162,76,0.25);
    border-radius: 8px;
    padding: 10px 12px;
    color: #f4e9d5;
    font-size: 16px;
    font-family: inherit;
    width: 100%;
    box-sizing: border-box;
    outline: none;
    transition: border-color 0.15s;
  }

  .input:focus {
    border-color: rgba(212,162,76,0.6);
  }

  .error {
    font-size: 12px;
    color: #e05c5c;
    margin: 0;
  }

  .actions {
    display: flex;
    gap: 10px;
    margin-top: 4px;
  }

  .actions .btn {
    flex: 1;
    padding: 12px;
    font-size: 14px;
    min-height: 44px;
  }

  .btn-secondary {
    background: transparent;
    border: 1px solid rgba(212,162,76,0.35);
    color: #d4a24c;
    border-radius: 8px;
    cursor: pointer;
    font-family: inherit;
    font-weight: 500;
    transition: background 0.15s, border-color 0.15s;
  }

  .btn-secondary:hover {
    background: rgba(212,162,76,0.08);
    border-color: rgba(212,162,76,0.6);
  }

  .divider {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 4px 0;
    color: #6b5a48;
    font-size: 12px;
  }

  .divider::before,
  .divider::after {
    content: '';
    flex: 1;
    border-top: 1px solid rgba(212,162,76,0.1);
  }

  .btn-text {
    background: none;
    border: none;
    color: #a89880;
    font-size: 13px;
    font-family: inherit;
    cursor: pointer;
    text-align: center;
    padding: 4px;
    min-height: 44px;
    transition: color 0.15s;
  }

  .btn-text:hover { color: #d4a24c; }

  .btn-link {
    background: none;
    border: none;
    color: #6b5a48;
    font-size: 11px;
    font-family: inherit;
    cursor: pointer;
    text-align: center;
    padding: 2px;
    text-decoration: underline;
    text-underline-offset: 2px;
    transition: color 0.15s;
  }

  .btn-link:hover { color: #a89880; }

  .modal-bg {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
    padding: 16px;
  }

  .modal {
    background: var(--bg-surface);
    border: 1px solid rgba(212,162,76,0.25);
    border-radius: 16px;
    padding: 32px 28px;
    max-width: 420px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .modal h2 {
    font-family: 'Crimson Pro', Georgia, serif;
    font-size: 22px;
    color: #d4a24c;
    margin: 0;
  }

  .modal p {
    font-size: 13px;
    color: #c4b09a;
    line-height: 1.6;
    margin: 0;
  }

  .modal p strong { color: #f4e9d5; }
  .modal p em { color: #d4a24c; }
</style>
