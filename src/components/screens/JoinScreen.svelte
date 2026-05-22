<script lang="ts">
  import { onMount, untrack } from 'svelte';

  interface Props {
    handle: string;
    initialCode?: string;
    onConnect: (code: string) => void;
    onCancel: () => void;
    error?: string;
  }

  let { handle, initialCode = '', onConnect, onCancel, error = '' }: Props = $props();

  let code = $state(initialCode.toUpperCase());
  let connecting = $state(false);

  const codeValid = $derived(code.length >= 4);

  function handleInput(e: Event) {
    code = (e.target as HTMLInputElement).value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 8);
  }

  function connect() {
    if (!codeValid || connecting) return;
    connecting = true;
    onConnect(code);
  }

  // Auto-connect if a join code arrived via URL hash
  onMount(() => {
    untrack(() => {
      if (code && code.length >= 4) {
        setTimeout(() => connect(), 500);
      }
    });
  });
</script>

<div class="screen">
  <div class="card">
    <h2 class="heading">Join a Game</h2>
    <p class="sub">Enter the code your friend shared</p>

    <div class="field">
      <input
        class="code-input"
        type="text"
        value={code}
        oninput={handleInput}
        placeholder="WOLF42"
        maxlength={8}
        autocomplete="off"
        spellcheck={false}
        autocapitalize="characters"
      />
    </div>

    {#if error}
      <p class="error">{error}</p>
    {/if}

    <button
      class="btn btn-primary connect-btn"
      onclick={connect}
      disabled={!codeValid || connecting}
    >
      {connecting ? 'Connecting...' : 'Connect'}
    </button>

    <button class="btn-text" onclick={onCancel}>
      Back
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
    max-width: 340px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    text-align: center;
  }

  .heading {
    font-family: 'Crimson Pro', Georgia, serif;
    font-size: 26px;
    color: #f4e9d5;
    margin: 0;
  }

  .sub {
    font-size: 13px;
    color: #a89880;
    margin: 0;
  }

  .field {
    width: 100%;
  }

  .code-input {
    background: var(--bg-deep);
    border: 1px solid rgba(212,162,76,0.3);
    border-radius: 10px;
    padding: 14px 16px;
    color: #d4a24c;
    font-family: 'Courier New', Courier, monospace;
    font-size: 28px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-align: center;
    width: 100%;
    box-sizing: border-box;
    text-transform: uppercase;
    outline: none;
    transition: border-color 0.15s;
  }

  .code-input:focus {
    border-color: rgba(212,162,76,0.6);
  }

  .code-input::placeholder {
    color: rgba(212,162,76,0.25);
  }

  .error {
    font-size: 12px;
    color: #e05c5c;
    margin: 0;
  }

  .connect-btn {
    width: 100%;
    padding: 12px;
    font-size: 15px;
    min-height: 44px;
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
