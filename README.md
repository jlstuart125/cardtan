# Cardtan

**Cardtan** — a real-time 2-player online card-and-settlement game, played in the browser over WebRTC peer-to-peer (no server required).

Inspired by *Rivals for Catan*. Two players connect directly from their browsers — no accounts, no backend, no installation.

---

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Click **Host Game**, share the 6-character code with a friend, and play.

---

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run test` | Run Vitest unit tests (headless) |
| `npm run test:ui` | Open Vitest UI |
| `npm run check` | Run svelte-check + tsc type checking |

---

## How Online Play Works

Cardtan uses **WebRTC peer-to-peer** connections via [PeerJS](https://peerjs.com/).

1. The **host** clicks "Host Game" and receives a 6-character room code.
2. The **joiner** enters that code (or clicks an invite link).
3. PeerJS brokers a WebRTC handshake — after that, all game traffic is **direct browser-to-browser**. No data ever touches a server.

### Trust Model

- The **host** runs the authoritative game engine in their browser. The host validates all actions and sends filtered state snapshots to the joiner.
- Fog-of-war: the joiner never receives the host's hand or draw-stack card identities.
- Because the host runs the engine locally, the host could theoretically tamper with game state. This is intentional: **Cardtan is friend-play only**, not a competitive ladder.

### Local Hot-Seat Mode

Click "Play locally on this device" on the start screen for the original hot-seat flow. Both players share one browser tab with a device-passing overlay.

---

## Architecture

```
src/
  lib/
    engine/       — Pure-TypeScript rules engine (framework-free)
      types.ts    — All game types (GameState, GameAction, …)
      state.ts    — initialState() + reducer()
      rules.ts    — Validation helpers + VP scanner
      cards.ts    — Card definitions + deck builder
      dice.ts     — Dice roll logic
    transport/
      types.ts    — Transport interface
      local.ts    — LocalTransport (hot-seat, in-process)
      p2p.ts      — P2PTransport (WebRTC via PeerJS)
      protocol.ts — Discriminated union of P2P message types
      filtering.ts — Fog-of-war state filtering
      rng.ts      — Deterministic RNG seeded by both peer IDs
    handles.ts    — Random friendly handle generator
  components/
    Board.svelte  — Main game board (local + online modes)
    screens/      — Start, HostWaiting, Join, Lobby, Disconnect
    …
  App.svelte      — Screen-level state machine
tests/
  engine.test.ts   — 38 engine unit tests
  protocol.test.ts — Protocol serialization + type guard tests
  filtering.test.ts — Fog-of-war filtering tests
```

---

## Known Limitations

- **Host runs the authoritative engine** — friend-play only, no anti-cheat. Trust your opponent.
- **Both players must be online simultaneously** — no async / pause-and-resume.
- **Some strict corporate or campus NATs may block WebRTC** — try a mobile hotspot if you can't connect.
- **Host refresh loses the game** — state lives in the host's browser tab. If the host reloads, the game is gone.

---

## Deploying Your Own Copy

1. **Fork** this repository on GitHub.
2. In your fork's **Settings → Pages**, set Source to **GitHub Actions**.
3. Push to `main` — the deploy workflow runs automatically.
4. Your game is live at `https://<your-username>.github.io/cardtan/`

The Vite build sets `base: '/cardtan/'` when `DEPLOY_TARGET=pages` is set (done by the workflow). Local dev always uses `base: '/'`.
