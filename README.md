# Repro for vercel/next.js#100150

Middleware body clone hands route handlers only part of a multi-chunk body (Node runtime middleware, Next 15.5.27).

`server/next-server.ts` calls `requestData.body.finalize()` in a `finally` without `await`. `finalize()` is what waits for `end` and swaps the buffered copy of the body back onto the request. A route handler that starts reading right away reads the original request, which the clone has already consumed, so it sees only the chunks that arrive after it started.

The middleware runs on the Node runtime and matches `/api/echo`. The route reads `request.body` to the end and returns the byte count.

## Steps

```sh
npm install
npm run build
npm start &          # wait for "Ready"
node post.mjs
```

## Expected vs actual

- Expected: every line is `ok   200 got 150671 of 150671`.
- Actual on 15.5.27: some lines are `SHORT`, for example `got 85592 of 150671` or `got 19599 of 150671`. Roughly half of the posts fail. Remove `/api/echo` from the matcher and all pass.

## Versions

| next | result |
| --- | --- |
| 15.5.27 | SHORT on about half the posts |
| 16.0.0 | SHORT on about half the posts |
| 16.1.7, 16.2.0, 16.3.0, 16.4.0, 16.5.0-canary.10 | all ok |

For 16.x set `react` and `react-dom` to 19.2.0.

Patching `await` into `requestData.body.finalize()` in `node_modules/next/dist/server/next-server.js` on 15.5.27 makes all posts pass.
