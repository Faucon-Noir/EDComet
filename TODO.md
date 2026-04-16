# TODO

## Priorisation ICE

Scale used: Impact, Confidence, Ease from 1 to 10. ICE = Impact x Confidence x Ease.

| Status | Task | Impact | Confidence | Ease | ICE |
| --- | --- | --- | --- | --- | --- |
| Now | Error page localized message + switch to real error | 8 | 9 | 7 | 504 |
| Now | Integrate `fs.watch` on ED Journal folder | 9 | 8 | 6 | 432 |
| Next | Replace nodemon with `tsx watch` + chokidar | 7 | 8 | 7 | 392 |
| Now | Integrate SSE (event-only vs full payload) | 9 | 7 | 5 | 315 |
| Next | Add static log-level and override `console.level` (winston) | 6 | 8 | 6 | 288 |
| Next | Integrate persistence (lowdb or duckdb) | 8 | 6 | 5 | 240 |
| Later | Add social with FriendStatus (first validate ED logs support) | 6 | 4 | 5 | 120 |
| Later | Add a music tracker (Spotify or Elite Dangerous native music) | 3 | 5 | 4 | 60 |

## Notes

- SSE design decision to settle first: send only event IDs and re-fetch via API, or push full payload directly.
- FriendStatus is gated by a technical feasibility check in ED logs before implementation.

### Chokidar

"client:watch": "chokidar '../backend/src/generated/swagger.json' -c 'pnpm run gen:client'",
