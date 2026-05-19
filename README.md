# Cardtan

**Cardtan** — a 2-player digital card-and-tile resource game, MVP hot-seat edition.

Inspired by *Catan: The Duel / Rivals for Catan*. Two players share one screen, passing the device between turns (fog-of-war overlay hides each player's hand). Built with Svelte 5 + TypeScript + Tailwind CSS.

---

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

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

## How to Play

1. **Player 1 rolls** the dice. Resources are produced and an event fires.
2. **Action phase**: Build roads/settlements/cities, bank-trade, play cards from hand.
3. **Replenish phase**: Draw cards from the 4 draw stacks until your hand is full.
4. **Exchange phase**: Optionally push a card to the bottom of a deck and draw a new one (blind or search).
5. **Pass the device** to Player 2 — tap the overlay to reveal their hand.
6. First player to **7 Victory Points** wins.

### Victory Points
- Settlement: 1 VP
- City: 2 VP
- Trade Token (held by trade score leader): +1 VP
- Strength Token (held by strength score leader): +1 VP
- Certain permanent cards (Library, Wealthy Town, etc.): +1 VP each

---

## Architecture

```
src/
  lib/
    engine/         # Pure game logic — NO Svelte, NO DOM
      types.ts        Game state types, card types, phase types
      state.ts        initialState() and reducer()
      rules.ts        Build validation, resource checks, VP scan, phase transitions
      dice.ts         Production die + event die resolution
      cards.ts        Card definitions (data-driven), deck generation
    transport/      # Abstracted network layer
      types.ts        Transport interface (subscribe/emit/getState)
      local.ts        Hot-seat LocalTransport (current MVP)
      socketio.ts     SocketIOTransport stub (TODO — future backend)
    stores.ts       Svelte stores wrapping the transport
  components/       Svelte UI components
  styles/
    tailwind.css    Tailwind base + custom utilities
    tokens.css      CSS custom properties (warm earthy palette)
tests/
  engine.test.ts    Vitest unit tests (build validation, VP scan, dice, phases)
```

### Key design principles

- **Engine is framework-free**: `src/lib/engine/` contains zero Svelte imports. It's plain TypeScript and can run in Node, a browser worker, or a server.
- **Transport abstraction**: UI → store → transport → engine. The `Transport` interface decouples the game loop from the delivery mechanism.
- **State is serializable**: `GameState` is a plain JSON-serializable object. Saving/loading or syncing over a network requires no transformation.
- **Svelte 5 runes**: UI uses `$state`, `$derived`, `$effect` throughout.

---

## Adding New Cards

Cards are data-driven in `src/lib/engine/cards.ts`. To add a new card:

1. Add a `CardDefinition` entry to `CARD_DEFINITIONS`:

```typescript
my_card: {
  id: 'my_card',
  name: 'My Card',
  category: 'building', // building | action | hero | event
  flavor: 'Flavor text goes here.',
  cost: { wood: 1, ore: 1 },
  effects: [{ type: 'gain_vp', amount: 1 }],
  vpValue: 1,
  playTarget: 'self',
  oneTimeUse: false,
},
```

2. Add it to `DECK_CONFIG[category].ids` list so it appears in decks.

3. If it has a new `CardEffect` type, handle it in the `PLAY_CARD` case of `reducer()` in `state.ts`.

---

## Roadmap

- [ ] **Real backend** (Node + Express + Socket.io) — entry point is `SocketIOTransport` in `src/lib/transport/socketio.ts`
- [ ] OAuth login / player accounts
- [ ] Lobby system + matchmaking
- [ ] Spectator mode
- [ ] Leaderboards + ELO ranking
- [ ] More card sets (expansions)
- [ ] Animated card transitions (flip, deal, discard)
- [ ] Sound effects + ambient audio
- [ ] Mobile app (Capacitor wrapper)

### Future backend notes

The `SocketIOTransport` class in `src/lib/transport/socketio.ts` is the designated entry point for server integration. When ready:

1. Install `socket.io-client`
2. Implement the class following the TODO comments in the file
3. In `src/lib/stores.ts`, call `setTransport(new SocketIOTransport(url, roomId, playerId))`
4. The engine runs on the server; clients only send actions and receive state snapshots

---

## Tech Stack

- **Svelte 5** (runes API) + **Vite 8**
- **TypeScript** (strict mode)
- **Tailwind CSS 3** (utility classes + custom tokens)
- **Vitest** (unit tests)
- No 3D libraries, no heavy game-engine dependencies — vanilla web tech
