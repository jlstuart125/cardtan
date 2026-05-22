<script lang="ts">
  interface Props {
    code: string;
    onCancel: () => void;
  }

  let { code, onCancel }: Props = $props();

  let copied = $state<'code' | 'link' | null>(null);

  const inviteLink = $derived(
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}#join=${code}`
      : `#join=${code}`
  );

  async function copyCode() {
    await navigator.clipboard.writeText(code);
    copied = 'code';
    setTimeout(() => { copied = null; }, 1500);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(inviteLink);
    copied = 'link';
    setTimeout(() => { copied = null; }, 1500);
  }
</script>

<div class="screen">
  <div class="card">
    <h2 class="heading">Host a Game</h2>
    <p class="sub">Share this code with your friend</p>

    <div class="code-block">
      <span class="code-text">{code}</span>
      <button class="copy-btn" onclick={copyCode} title="Copy code">
        {copied === 'code' ? 'Copied!' : 'Copy'}
      </button>
    </div>

    <button class="link-btn" onclick={copyLink}>
      {copied === 'link' ? 'Link copied!' : 'Copy invite link'}
    </button>

    <div class="status">
      <span class="status-dot waiting"></span>
      <span>Waiting for opponent to connect...</span>
    </div>

    <button class="btn btn-text cancel-btn" onclick={onCancel}>
      Cancel / Back
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

  .code-block {
    display: flex;
    align-items: center;
    gap: 12px;
    background: var(--bg-deep);
    border: 1px solid rgba(212,162,76,0.3);
    border-radius: 12px;
    padding: 16px 20px;
    width: 100%;
    box-sizing: border-box;
    justify-content: space-between;
  }

  .code-text {
    font-family: 'Courier New', Courier, monospace;
    font-size: 32px;
    font-weight: 700;
    color: #d4a24c;
    letter-spacing: 0.1em;
  }

  .copy-btn {
    background: rgba(212,162,76,0.15);
    border: 1px solid rgba(212,162,76,0.3);
    border-radius: 6px;
    color: #d4a24c;
    font-family: inherit;
    font-size: 12px;
    padding: 6px 12px;
    cursor: pointer;
    min-height: 44px;
    min-width: 64px;
    transition: background 0.15s;
  }

  .copy-btn:hover { background: rgba(212,162,76,0.25); }

  .link-btn {
    background: none;
    border: 1px solid rgba(212,162,76,0.2);
    border-radius: 8px;
    color: #a89880;
    font-family: inherit;
    font-size: 13px;
    padding: 10px 20px;
    cursor: pointer;
    min-height: 44px;
    width: 100%;
    transition: color 0.15s, border-color 0.15s;
  }

  .link-btn:hover {
    color: #d4a24c;
    border-color: rgba(212,162,76,0.4);
  }

  .status {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: #a89880;
    padding: 8px 0;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .status-dot.waiting {
    background: #d4a24c;
    animation: pulse 1.5s ease-in-out infinite;
  }

  .cancel-btn {
    color: #6b5a48;
    font-size: 13px;
    padding: 8px 16px;
    min-height: 44px;
  }

  .cancel-btn:hover { color: #a89880; }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
</style>
