# Changelog

## [Unreleased] — Online Multiplayer (branch: online-multiplayer)

### Added
- **WebRTC peer-to-peer online play** via PeerJS (no backend required)
- `P2PTransport` — wraps PeerJS, handles host/joiner roles, heartbeat, reconnect detection
- `protocol.ts` — discriminated union of all P2P message types (hello, action, state, event, chat, ping/pong, bye)
- `filtering.ts` — fog-of-war state filtering: host hand and draw-stack contents hidden from joiner
- `rng.ts` — deterministic mulberry32 RNG seeded by both peer IDs
- `handles.ts` — random friendly handle generator (e.g. "BraveBison", "BoldKestrel")
- **Start screen** with Host / Join / Local options and a "How does this work?" explainer modal
- **Host Waiting screen** — shows room code with copy button and copy-link button
- **Join screen** — code input with auto-uppercase, pre-fill from `#join=CODE` URL hash
- **Lobby screen** — ready-toggle for both players, game starts when both are ready
- **Disconnect overlay** — 60-second countdown with Concede / Leave options
- **Connection status indicator** — dot in corner with hover tooltip (latency, role, remote handle)
- **Toast notifications** — opponent chat messages and connection events
- URL hash auto-join: arriving at `?#join=CODE` pre-fills and auto-attempts connection
- GitHub Actions workflow: `pages.yml` — deploy to GitHub Pages on push to main
- GitHub Actions workflow: `ci.yml` — check + test + build on PRs and non-main branches
- Tests: `protocol.test.ts` (serialization roundtrips + type guards)
- Tests: `filtering.test.ts` (fog-of-war — hand hiding, draw-stack hiding, count preservation)

### Changed
- `Board.svelte` — accepts `mode` (`'local' | 'online'`) and `myPlayerId` props
  - Online mode: turn indicator instead of active player name, pass overlay hidden
  - Opponent hand shown as card-back count row in online mode
  - Action controls only interactive when it is your turn
- `CardFace.svelte` — handles `__back__` sentinel definition ID (fog-of-war backs) gracefully
- `App.svelte` — full screen state machine replacing direct board render
- `vite.config.ts` — `base` switches to `/cardtan/` when `DEPLOY_TARGET=pages`

### Removed
- `socketio.ts` stub — deleted (replaced by PeerJS approach)

### Dependencies
- Added: `peerjs` (latest stable)
