# Trivia Showdown

A real-time, no-account party trivia game for 2–8 players. React and TypeScript power the responsive client; Node, Socket.IO, and SQLite keep the multiplayer game authoritative.

## Start locally (Windows PowerShell)

```powershell
cd C:\Projects\trivia-showdown
npm install
npm run dev
```

Open `http://localhost:5173`. The API and Socket.IO server run on `http://localhost:3001`. For a production-style run:

```powershell
npm run build
$env:NODE_ENV = 'production'
npm start
```

Then open `http://localhost:3001`.

To test two players on the same computer, create a room in a normal browser window, copy the five-character code, then open an Incognito/InPrivate window at the same address and join with a different nickname. `localhost` only addresses the current computer. For devices on the same trusted LAN, allow Node through Windows Firewall if prompted, run the dev server, find the host PC's IPv4 address with `ipconfig`, and use `http://HOST_IP:5173` from the other device. Production hosting requires a persistent Node process, WebSocket support, and persistent disk for SQLite; the existing static Site is intentionally unchanged.

## Rules

- The host creates a room, also plays, and starts once 2–8 players have joined.
- A match has 10 non-repeating questions drawn from video games, movies, music, and TV.
- Each question has four choices and a 30-second timer. The first answer is final.
- Correct answers earn 100 points; incorrect or unanswered answers earn zero. There is no speed bonus.
- The answer reveals after everyone responds or time expires. Only the host advances.
- The highest score wins; ties share the win. The host can return everyone to the lobby for a fresh deck that avoids the previous match where possible.

## Architecture and security

`src/server/game.ts` is the authoritative domain layer. SQLite transactions serialize room creation, joins, submissions, scoring, round transitions, and replays. Unique constraints reject duplicate answers and nicknames. The browser receives only question text/options before reveal; correct answers and other players' choices remain server-side. Socket events re-authenticate through 192-bit anonymous session tokens; only a one-way encoded token representation is persisted, and tokens are sent only to their owner.

The URL fragment carries the player's anonymous session token so a refresh can resume without browser storage; fragments are not sent in HTTP requests. Do not share a URL containing `#session=`. A disconnected player remains in the room and is marked offline, can refresh/reconnect with the same fragment, and still counts toward the answer deadline. If the host disconnects, the room waits for that same host session to reconnect; host privileges are never silently transferred. Restarting the server restores rooms, scores, deadlines, and sessions from SQLite, and overdue questions reveal automatically.

## Tests

```powershell
npm test
npm run build
```

With the production server running, `npm run test:e2e` drives two independent Socket.IO clients through an entire match and replay.

The automated suite covers capacity, late joins, host authorization, answer secrecy/locking, stale and duplicate requests, timeout behavior, scoring, a complete 10-round tied match, and replay deck rotation. Manual browser QA should additionally cover two independent sessions, refresh recovery, connection indicators, keyboard use, and a narrow mobile viewport.

## Current limitations

- The built-in bank contains 40 reviewed static questions; it has no external question feed or moderation UI.
- Host recovery requires the original session URL. There is no host transfer if it is lost.
- SQLite is appropriate for one persistent server process. Horizontal scaling needs a shared database and Socket.IO adapter.
- Rooms are retained locally; there is no scheduled cleanup or administration screen yet.
