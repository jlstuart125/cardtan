<script lang="ts">
  import type { PlayerId } from '../lib/engine/types.js';
  import { dispatch } from '../lib/stores.js';

  interface Props {
    nextPlayer: PlayerId;
    playerName: string;
  }

  let { nextPlayer, playerName }: Props = $props();

  async function dismiss() {
    await dispatch({ type: 'DISMISS_PASS_OVERLAY' });
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="overlay" onclick={dismiss}>
  <div class="pass-card" onclick={(e) => e.stopPropagation()}>
    <div class="pass-icon">🎴</div>
    <h2 class="pass-title">Pass the Device</h2>
    <p class="pass-sub">
      Hand the device to<br />
      <strong>{playerName}</strong>
    </p>
    <p class="pass-hint">Their hand will be revealed when they tap below.</p>
    <button class="btn btn-primary pass-btn" onclick={dismiss}>
      I'm {playerName} — Show My Hand
    </button>
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(10, 7, 4, 0.96);
    backdrop-filter: blur(6px);
  }

  .pass-card {
    background: var(--bg-card);
    border: 1px solid rgba(212,162,76,0.3);
    border-radius: 16px;
    padding: 48px 40px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    max-width: 360px;
    width: 90%;
    box-shadow: 0 24px 64px rgba(0,0,0,0.8);
    animation: slideIn 0.3s ease-out;
  }

  .pass-icon {
    font-size: 56px;
  }

  .pass-title {
    font-family: 'Crimson Pro', Georgia, serif;
    font-size: 28px;
    color: #f4e9d5;
    margin: 0;
    text-align: center;
  }

  .pass-sub {
    font-size: 16px;
    color: #a89880;
    text-align: center;
    margin: 0;
    line-height: 1.6;
  }

  .pass-sub strong {
    color: #d4a24c;
    font-size: 20px;
  }

  .pass-hint {
    font-size: 12px;
    color: #6b5a48;
    text-align: center;
    font-style: italic;
    margin: 0;
  }

  .pass-btn {
    padding: 12px 28px;
    font-size: 14px;
    border-radius: 8px;
  }

  @keyframes slideIn {
    from { opacity: 0; transform: translateY(30px) scale(0.95); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
</style>
