<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  interface Props {
    message: string;
    duration?: number;
    onDone?: () => void;
  }

  let { message, duration = 3000, onDone }: Props = $props();

  let visible = $state(true);
  let timer: ReturnType<typeof setTimeout>;

  onMount(() => {
    timer = setTimeout(() => {
      visible = false;
      onDone?.();
    }, duration);
  });

  onDestroy(() => clearTimeout(timer));
</script>

{#if visible}
  <div class="toast">{message}</div>
{/if}

<style>
  .toast {
    background: var(--bg-surface);
    border: 1px solid rgba(212,162,76,0.25);
    border-radius: 8px;
    padding: 10px 16px;
    font-size: 13px;
    color: #f4e9d5;
    box-shadow: 0 4px 16px rgba(0,0,0,0.4);
    animation: slideUp 0.2s ease-out;
    pointer-events: none;
    max-width: 300px;
    text-align: center;
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
</style>
