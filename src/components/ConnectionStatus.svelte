<script lang="ts">
  import type { ConnectionStatus } from '../lib/transport/p2p.js';

  interface Props {
    status: ConnectionStatus;
  }

  let { status }: Props = $props();

  let showTooltip = $state(false);

  const dotClass = $derived(
    status.connected
      ? status.latency !== null && status.latency > 200 ? 'yellow' : 'green'
      : 'red'
  );

  const tooltipText = $derived([
    `Role: ${status.role}`,
    status.remoteHandle ? `Opponent: ${status.remoteHandle}` : null,
    status.latency !== null ? `Latency: ${status.latency}ms` : null,
    status.connected ? 'Connected' : 'Disconnected',
  ].filter(Boolean).join('\n'));
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="connection-status"
  onmouseenter={() => { showTooltip = true; }}
  onmouseleave={() => { showTooltip = false; }}
>
  <span class="dot {dotClass}"></span>
  {#if showTooltip}
    <div class="tooltip">
      {#each tooltipText.split('\n') as line}
        <div>{line}</div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .connection-status {
    position: relative;
    display: inline-flex;
    align-items: center;
    cursor: default;
  }

  .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    display: block;
  }

  .dot.green { background: #5a8a3a; }
  .dot.yellow { background: #d4a24c; }
  .dot.red { background: #c44a2a; }

  .tooltip {
    position: absolute;
    bottom: calc(100% + 6px);
    right: 0;
    background: var(--bg-deep);
    border: 1px solid rgba(212,162,76,0.2);
    border-radius: 6px;
    padding: 8px 10px;
    white-space: nowrap;
    font-size: 11px;
    color: #a89880;
    line-height: 1.6;
    z-index: 50;
    pointer-events: none;
  }
</style>
