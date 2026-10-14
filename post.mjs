// Sends a 150,671 byte body as four socket writes (the read sizes from the
// report) with different pauses between them, and prints what the route saw.
import http from "node:http";

const port = process.env.PORT ?? 3000;
const sizes = [65079, 457, 65536, 19599];
const expected = sizes.reduce((a, b) => a + b, 0);
const pauses = [0, 5, 50, 1];

for (let i = 0; i < 8; i++) {
  await new Promise((resolve) => {
    const req = http.request(
      `http://localhost:${port}/api/echo`,
      {
        method: "POST",
        headers: {
          "content-type": "application/octet-stream",
          "content-length": String(expected),
        },
      },
      (res) => {
        let body = "";
        res.on("data", (d) => (body += d));
        res.on("end", () => {
          const { total } = JSON.parse(body);
          console.log(total === expected ? "ok  " : "SHORT", `${res.statusCode} got ${total} of ${expected}`);
          resolve();
        });
      }
    );
    let sent = 0;
    const next = () => {
      if (sent === sizes.length) return req.end();
      req.write(Buffer.alloc(sizes[sent++], 1));
      setTimeout(next, pauses[i % pauses.length]);
    };
    next();
  });
}
