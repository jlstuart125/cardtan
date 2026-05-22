<script lang="ts">
  import { onDestroy } from 'svelte';
  import { gameState, dispatch, setTransport } from './lib/stores.js';
  import { LocalTransport } from './lib/transport/local.js';
  import { P2PTransport, type ConnectionStatus } from './lib/transport/p2p.js';

  import Board from './components/Board.svelte';
  import StartScreen from './components/screens/StartScreen.svelte';
  import HostWaitingScreen from './components/screens/HostWaitingScreen.svelte';
  import JoinScreen from './components/screens/JoinScreen.svelte';
  import LobbyScreen from './components/screens/LobbyScreen.svelte';
  import DisconnectOverlay from './components/screens/DisconnectOverlay.svelte';
  import ConnStatusIndicator from './components/ConnectionStatus.svelte';
  import Toast from './components/Toast.svelte';

  // ─── Screen state machine ────────────────────────────
  type Screen =
    | 'start'
    | 'host-waiting'
    | 'join'
    | 'lobby'
    | 'game-local'
    | 'game-online';

  let screen = $state<Screen>('start');

  // ─── URL hash auto-join ───────────────────────────────
  let initialJoinCode = $state('');
  {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      const m = hash.match(/[#&]join=([A-Z0-9]+)/i);
      if (m) {
        initialJoinCode = m[1].toUpperCase();
      }
    }
  }

  // ─── P2P state ────────────────────────────────────────
  let p2p = $state<P2PTransport | null>(null);
  let connStatus = $state<ConnectionStatus | null>(null);
  let hostCode = $state('');
  let localHandle = $state('');
  let joinError = $state('');
  let disconnected = $state(false);

  // Toast messages
  let toasts = $state<Array<{ id: number; message: string }>>([]);
  let toastSeq = 0;

  function pushToast(message: string) {
    const id = ++toastSeq;
    toasts = [...toasts, { id, message }];
  }
  function removeToast(id: number) {
    toasts = toasts.filter(t => t.id !== id);
  }

  // P2P ready toggles (for lobby)
  let localReady = $state(false);
  let remoteReady = $state(false);

  // ─── Derived ──────────────────────────────────────────
  const myPlayerId = $derived(p2p?.myPlayerId ?? 'p1');
  const isOnline = $derived(screen === 'game-online');

  // ─── Handlers: START screen ───────────────────────────
  async function handleHost(handle: string) {
    localHandle = handle;
    // Initialise P2P as host
    const transport = new P2PTransport({
      role: 'host',
      handle,
      callbacks: {
        onStatusChange: (s) => { connStatus = s; },
        onChat: (from, text) => pushToast(`${from}: ${text}`),
        onDisconnect: handleDisconnect,
        onReconnect: handleReconnect,
        onEvent: handleP2PEvent,
      },
    });
    p2p = transport;

    try {
      const peerId = await transport.peerReady;
      hostCode = peerId;
      screen = 'host-waiting';
      setTransport(transport);

      // Wait for joiner to connect — the p2p callbacks drive this
      // When welcome exchange completes, move to lobby
      waitForOpponent(transport);
    } catch (err) {
      console.error('PeerJS init failed', err);
      destroyP2P();
    }
  }

  function waitForOpponent(transport: P2PTransport) {
    // Poll connStatus until remote connects, then go to lobby
    const check = setInterval(() => {
      if (connStatus?.remoteHandle) {
        clearInterval(check);
        screen = 'lobby';
      }
    }, 200);
  }

  async function handleJoin(handle: string) {
    localHandle = handle;
    screen = 'join';
  }

  async function handleConnect(code: string) {
    joinError = '';
    const transport = new P2PTransport({
      role: 'joiner',
      handle: localHandle,
      callbacks: {
        onStatusChange: (s) => { connStatus = s; },
        onChat: (from, text) => pushToast(`${from}: ${text}`),
        onDisconnect: handleDisconnect,
        onReconnect: handleReconnect,
        onEvent: handleP2PEvent,
      },
    });
    p2p = transport;

    try {
      await transport.peerReady;
      transport.connectTo(code);
      setTransport(transport);

      // Wait for welcome
      const check = setInterval(() => {
        if (connStatus?.remoteHandle) {
          clearInterval(check);
          screen = 'lobby';
        }
        // timeout after 10s
      }, 200);

      setTimeout(() => {
        if (screen === 'join') {
          joinError = 'Could not connect. Check the code and try again.';
          destroyP2P();
        }
      }, 10_000);
    } catch (err) {
      joinError = 'Failed to connect. Try again.';
      destroyP2P();
    }
  }

  // ─── Handlers: LOBBY screen ───────────────────────────
  function handleReady() {
    localReady = true;
    p2p?.setReady();
  }

  // Watch P2P events to know when both are ready / game starts
  function handleP2PEvent(kind: string, payload?: unknown) {
    if (kind === 'game_start') {
      screen = 'game-online';
      disconnected = false;
    }
    if (kind === 'opponent_ready') {
      remoteReady = true;
    }
  }

  // If joiner, the host fires game_start. But we need the host to also
  // transition. Let's handle host transition via localReady + remoteReady.
  $effect(() => {
    if (screen === 'lobby' && localReady && remoteReady && p2p?.myPlayerId === 'p1') {
      // Host: both ready — transition to game
      p2p?.setReady();
      screen = 'game-online';
    }
  });

  // Track remote ready from p2p
  $effect(() => {
    if (p2p && screen === 'lobby') {
      const interval = setInterval(() => {
        if (p2p?.opponentReady) {
          remoteReady = true;
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  });

  // ─── Handlers: disconnect ─────────────────────────────
  function handleDisconnect() {
    if (screen === 'game-online') {
      disconnected = true;
      pushToast('Opponent disconnected');
    }
  }

  function handleReconnect() {
    disconnected = false;
    pushToast('Reconnected!');
  }

  function handleConcede() {
    disconnected = false;
    // Just leave to start
    destroyP2P();
    screen = 'start';
  }

  function handleLeaveToMenu() {
    disconnected = false;
    destroyP2P();
    screen = 'start';
  }

  // ─── Local hot-seat mode ──────────────────────────────
  function handleLocal() {
    setTransport(new LocalTransport());
    screen = 'game-local';
  }

  // ─── Cancel / back ────────────────────────────────────
  function handleCancel() {
    destroyP2P();
    localReady = false;
    remoteReady = false;
    screen = 'start';
  }

  // ─── P2P cleanup ──────────────────────────────────────
  function destroyP2P() {
    p2p?.destroy('user_left');
    p2p = null;
    connStatus = null;
  }

  onDestroy(() => { destroyP2P(); });
</script>

<!-- ─── Screen Router ─────────────────────────────────── -->
{#if screen === 'start'}
  <StartScreen
    initialCode={initialJoinCode}
    onHost={handleHost}
    onJoin={handleJoin}
    onLocal={handleLocal}
  />

{:else if screen === 'host-waiting'}
  <HostWaitingScreen
    code={hostCode}
    onCancel={handleCancel}
  />

{:else if screen === 'join'}
  <JoinScreen
    handle={localHandle}
    initialCode={initialJoinCode}
    onConnect={handleConnect}
    onCancel={handleCancel}
    error={joinError}
  />

{:else if screen === 'lobby'}
  <LobbyScreen
    {localHandle}
    remoteHandle={connStatus?.remoteHandle ?? null}
    role={p2p?.myPlayerId === 'p1' ? 'host' : 'joiner'}
    {localReady}
    {remoteReady}
    onReady={handleReady}
    onCancel={handleCancel}
  />

{:else if screen === 'game-local'}
  <Board state={$gameState} mode="local" myPlayerId="p1" />

{:else if screen === 'game-online'}
  <!-- Connection status indicator -->
  {#if connStatus}
    <div class="conn-corner">
      <ConnStatusIndicator status={connStatus} />
    </div>
  {/if}

  <Board state={$gameState} mode="online" myPlayerId={myPlayerId} />

  <!-- Disconnect overlay -->
  {#if disconnected}
    <DisconnectOverlay
      onConcede={handleConcede}
      onLeave={handleLeaveToMenu}
    />
  {/if}
{/if}

<!-- ─── Toast notifications ───────────────────────────── -->
<div class="toast-stack">
  {#each toasts as toast (toast.id)}
    <Toast message={toast.message} onDone={() => removeToast(toast.id)} />
  {/each}
</div>

<style>
  .conn-corner {
    position: fixed;
    top: 12px;
    right: 12px;
    z-index: 100;
  }

  .toast-stack {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 300;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    pointer-events: none;
  }
</style>
