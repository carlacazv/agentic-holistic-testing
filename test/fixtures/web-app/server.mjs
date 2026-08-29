import http from "node:http";

const port = Number(process.env.FIXTURE_PORT ?? 4173);
let items = [];

const page = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Holistic QA Fixture</title></head>
<body>
  <main>
    <h1>Items</h1>
    <form id="item-form">
      <label for="name">Name</label>
      <input id="name" name="name" required>
      <button type="submit">Add item</button>
    </form>
    <p role="status" aria-live="polite"></p>
    <ul aria-label="Items"></ul>
  </main>
  <script>
    const form = document.querySelector('#item-form');
    const list = document.querySelector('[aria-label="Items"]');
    const status = document.querySelector('[role="status"]');
    async function render() {
      const response = await fetch('/api/items');
      const data = await response.json();
      list.replaceChildren(...data.items.map((item) => {
        const entry = document.createElement('li');
        entry.textContent = item.name;
        return entry;
      }));
    }
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const name = new FormData(form).get('name');
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name })
      });
      if (response.ok) {
        status.textContent = 'Item added';
        form.reset();
        await render();
      }
    });
    render();
  </script>
</body>
</html>`;

function json(response, status, body) {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  if (request.method === "GET" && url.pathname === "/") {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(page);
    return;
  }
  if (request.method === "GET" && url.pathname === "/api/items") {
    json(response, 200, { items });
    return;
  }
  if (request.method === "DELETE" && url.pathname === "/api/items") {
    items = [];
    json(response, 200, { items });
    return;
  }
  if (request.method === "POST" && url.pathname === "/api/items") {
    let body = "";
    request.on("data", (chunk) => { body += chunk; });
    request.on("end", () => {
      const parsed = JSON.parse(body || "{}");
      if (typeof parsed.name !== "string" || parsed.name.trim().length === 0) {
        json(response, 400, { error: "name_required" });
        return;
      }
      const item = { id: items.length + 1, name: parsed.name.trim() };
      items.push(item);
      json(response, 201, item);
    });
    return;
  }
  json(response, 404, { error: "not_found" });
});

server.listen(port, "127.0.0.1", () => {
  process.stdout.write(`Fixture listening on ${port}\n`);
});
