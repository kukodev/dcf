# Degen Coin Flip

<p align="center">
  <img width="250" src="https://github.com/user-attachments/assets/36a0ae39-7c1a-469a-8a90-f2958287b0cc" />
  <img width="250" src="https://github.com/user-attachments/assets/c48e5e1c-d3ee-42d4-9078-911c4b5a785b" />
  <img width="250" src="https://github.com/user-attachments/assets/df882cb5-4879-4a57-8e61-b4170044e0dc" />
</p>

A small take on the DCF coin flip: connect a wallet, pick heads/tails, flip for SOL.

**Live:** https://degencoinflip-58ac4c2374c3.herokuapp.com/ (Heroku dyno - first load may take a moment to wake).

The flip is simple on purpose - I used it as a surface to show **how I build**: clean separation, a state machine instead of scattered booleans, typed contracts front-to-back. The domain idea: server-authoritative outcomes => the server decides, the client animates toward it and reconciles to the truth.

## Run it

```bash
npm install
npm run dev
```

- Client: http://localhost:5173
- API: http://localhost:4000 (Vite proxies `/api` to it)
- Node 18+. In-memory backend, so state resets when you restart the server.

`npm run dev` runs both together; there's also `dev:server` / `dev:client` if you want them split.

### Worth trying

- **Flip normally** and watch the tx console step through Sign => Submit => Confirm => Done.
- **Refresh the page mid-flip** (during "Confirming…") - the round isn't lost; it resumes and lands. Same for refreshing after it settles.
- In the wallet popup, **check "Simulate on-chain failure"** (or hit Reject) to see the failure + retry states.

## What I built

- **Server-authoritative flip.** `POST /flip` returns a *pending* round right away; the server picks the outcome and settles it ~3s later. The client polls `GET /flip/:id` until it's settled. Provably-fair: a seed hash up front, the seed revealed on settle (Verify button on the result).
- **A round state machine** (a typed reducer): `idle => committing => animating => resolved`, plus an `error` branch. Bad states can't happen, and a refresh just drops back into the right state.
- **Mocked Solana wallet** with Phantom-style popups for connecting and for each transaction, and the tx steps (sign => submit => confirm) shown in the UI.
- **Reconciliation is the main thing.** Every flip has an id, so a refresh mid-flip restores it from the server and a dropped confirmation just re-checks. Retries reuse an idempotency key, so re-sending a flip never creates a duplicate or double-charges. You can't lose a paid-for flip.
- History feed + mock balances.

## What I skipped

- **Real Solana.** The wallet and transactions are mocked - no chain, no real signatures. I focused on getting the UI states right (pending / success / failure) and kept the wallet behind a small interface so a real one can slot in later.
- **Real settlement.** A fixed ~3s delay stands in for the chain/VRF confirmation. The `pending => settled` flow is already shaped like a real one, so only the server internals would change.
- **Persistence & auth.** In-memory store (no db), and the wallet address is trusted from the client.
- **Tests.** Left out for time - see below.

## What I'd do with more time

- **Go heavier on animation.** The real product is animation-driven, so I'd move the game rendering into its own module + loop (Pixi/WebGL), React talking to it through a small interface => canvas and UI cleanly separated.
- Real wallet + program integration, and a websocket to push the result instead of polling for it (keeping the poll as a fallback).
- A database behind the store, and a signed-message login for auth.
- Unit tests and a couple of API tests.
- Update the balance the moment you bet (right now it updates when the flip settles).

## AI / tools

Used Claude Code to:
- scaffold
- brainstorm
- iterate on the UI/UX
- refactor quickly
- review code
- polish README
