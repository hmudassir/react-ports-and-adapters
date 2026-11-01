/**
 * A REST API with its own conventions (snake_case, one-based pages,
 * { data, meta } envelopes, errors keyed by API field names), so the HTTP
 * adapter has real translation work to do.
 *   node mock-api/server.mjs   → http://localhost:8081
 */
import http from "node:http";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const seedPath = new URL("../public/data/books.json", import.meta.url);

export function createApp({ allowedOrigins = ["http://localhost:5173"] } = {}) {
  const books = JSON.parse(readFileSync(seedPath, "utf8")).map((b, i) => ({
    book_id: i + 1, book_title: b.title, author_name: b.author, published_year: b.year, tag_list: b.tags, _legacyId: b.id,
  }));
  let next = books.length + 1;
  const out = ({ _legacyId, ...dto }) => ({ ...dto, book_id: _legacyId || String(dto.book_id) });

  return async (req, res) => {
    const headers = { "Content-Type": "application/json" };
    if (allowedOrigins.includes(req.headers.origin)) Object.assign(headers, { "Access-Control-Allow-Origin": req.headers.origin, Vary: "Origin" });
    if (req.method === "OPTIONS") {
      res.writeHead(204, { ...headers, "Access-Control-Allow-Methods": "GET, POST", "Access-Control-Allow-Headers": "Content-Type" });
      return res.end();
    }
    const send = (status, body) => { res.writeHead(status, headers); res.end(body === undefined ? "" : JSON.stringify(body)); };
    const url = new URL(req.url, "http://localhost");

    if (req.method === "GET" && url.pathname === "/api/books") {
      const q = (url.searchParams.get("q") || "").toLowerCase();
      const tag = url.searchParams.get("tag") || "";
      const perPage = Number(url.searchParams.get("per_page")) || 5;
      const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
      const rows = books
        .filter((b) => !q || b.book_title.toLowerCase().includes(q) || b.author_name.toLowerCase().includes(q))
        .filter((b) => !tag || b.tag_list.includes(tag))
        .sort((a, b) => a.book_title.localeCompare(b.book_title));
      return send(200, { data: rows.slice((page - 1) * perPage, page * perPage).map(out), meta: { page, per_page: perPage, total: rows.length } });
    }
    const one = url.pathname.match(/^\/api\/books\/([^/]+)$/);
    if (req.method === "GET" && one) {
      const id = decodeURIComponent(one[1]);
      const b = books.find((x) => (x._legacyId || String(x.book_id)) === id);
      return b ? send(200, out(b)) : send(404, { error: "not_found" });
    }
    if (req.method === "POST" && url.pathname === "/api/books") {
      let raw = "";
      for await (const c of req) raw += c;
      const body = JSON.parse(raw || "{}");
      const errors = {};
      if (!String(body.book_title || "").trim()) errors.book_title = "can't be blank";
      if (!String(body.author_name || "").trim()) errors.author_name = "can't be blank";
      if (!Number.isInteger(body.published_year)) errors.published_year = "must be a year";
      // A rule only the server knows: titles are unique.
      if (books.some((b) => b.book_title.toLowerCase() === String(body.book_title || "").trim().toLowerCase())) errors.book_title = "has already been taken";
      if (Object.keys(errors).length) return send(400, { errors });
      const b = { book_id: next++, book_title: body.book_title, author_name: body.author_name, published_year: body.published_year, tag_list: body.tag_list || [] };
      books.push(b);
      return send(201, out(b));
    }
    send(404, { error: "no_route" });
  };
}

export function startServer({ port = 8081, ...opts } = {}) {
  const server = http.createServer(createApp(opts));
  return new Promise((resolve) => server.listen(port, () => resolve(server)));
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  const s = await startServer({
    port: Number(process.env.PORT || 8081),
    allowedOrigins: (process.env.ALLOWED_ORIGINS || "http://localhost:5173").split(",").map((o) => o.trim()),
  });
  console.log(`Books REST API on http://localhost:${s.address().port}`);
}
