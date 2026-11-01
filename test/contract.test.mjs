/**
 * The repository contract: one suite, run against every adapter.
 * If an adapter passes, the UI can use it without knowing which it is.
 */
import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { assertBooksRepository } from "../src/ports/BooksRepository.js";
import { NotFoundError, UnsupportedError, ValidationError } from "../src/domain/errors.js";
import { createInMemoryRepository } from "../src/adapters/inMemory.js";
import { createStaticJsonRepository } from "../src/adapters/staticJson.js";
import { createHttpRepository } from "../src/adapters/http.js";
import { startServer } from "../mock-api/server.mjs";

const SEED_URL = new URL("../public/data/books.json", import.meta.url);
const seed = JSON.parse(await readFile(SEED_URL, "utf8"));

// A fetch that serves the JSON file from disk, standing in for a CDN.
const fileFetch = async (url) => {
  if (url !== "/data/books.json") return new Response("not found", { status: 404 });
  return new Response(await readFile(SEED_URL), { headers: { "Content-Type": "application/json" } });
};

function contract(name, makeRepo) {
  describe(`${name} adapter`, () => {
    let repo;
    before(async () => (repo = assertBooksRepository(await makeRepo())));

    test("lists the first page, ordered by title", async () => {
      const page = await repo.list({ size: 5 });
      assert.deepEqual(Object.keys(page).sort(), ["items", "page", "size", "totalItems", "totalPages"]);
      assert.equal(page.totalItems >= seed.length, true);
      assert.equal(page.items.length, 5);
      const titles = page.items.map((b) => b.title);
      assert.deepEqual(titles, [...titles].sort((a, b) => a.localeCompare(b)));
      assert.deepEqual(Object.keys(page.items[0]).sort(), ["author", "id", "tags", "title", "year"], "domain shape, not the API's");
    });

    test("pages are zero-based and don't overlap", async () => {
      const p0 = await repo.list({ size: 4, page: 0 });
      const p1 = await repo.list({ size: 4, page: 1 });
      assert.equal(p1.page, 1);
      assert.equal(p0.items.some((b) => p1.items.some((c) => c.id === b.id)), false);
    });

    test("search matches title or author, ignoring case", async () => {
      assert.deepEqual((await repo.list({ search: "BRONTË" })).items.map((b) => b.title), ["Jane Eyre", "Wuthering Heights"]);
      assert.deepEqual((await repo.list({ search: "machine" })).items.map((b) => b.author), ["H. G. Wells"]);
    });

    test("filters by tag", async () => {
      const page = await repo.list({ tag: "science-fiction", size: 20 });
      assert.deepEqual(page.items.map((b) => b.title), ["Frankenstein", "The Time Machine"]);
      assert.equal(page.totalItems, 2);
    });

    test("gets one book, and reports a missing one as NotFoundError", async () => {
      const book = await repo.get("b12");
      assert.equal(book.title, "Dracula");
      assert.equal(book.year, 1897);
      await assert.rejects(repo.get("does-not-exist"), NotFoundError);
    });

    test("create follows its declared capability", async () => {
      if (!repo.capabilities.canCreate) {
        await assert.rejects(repo.create({ title: "X", author: "Y", year: 2000 }), UnsupportedError);
        return;
      }
      const created = await repo.create({ title: "  The War of the Worlds ", author: "H. G. Wells", year: 1898, tags: "Science-Fiction, invasion" });
      assert.equal(created.title, "The War of the Worlds");
      assert.deepEqual(created.tags, ["science-fiction", "invasion"]);
      assert.equal((await repo.get(created.id)).title, "The War of the Worlds");
      assert.ok((await repo.list({ search: "war of the" })).items.some((b) => b.id === created.id));
    });

    test("invalid input is a ValidationError in domain field names", async () => {
      if (!repo.capabilities.canCreate) return;
      await assert.rejects(repo.create({ title: "", author: "", year: 99999 }), (e) => {
        assert.ok(e instanceof ValidationError);
        assert.deepEqual(Object.keys(e.fieldErrors).sort(), ["author", "title", "year"]);
        return true;
      });
    });
  });
}

let server;
contract("In-memory", () => createInMemoryRepository(seed));
contract("Static JSON", () => createStaticJsonRepository({ url: "/data/books.json", fetchImpl: fileFetch }));
contract("REST API", async () => {
  server = await startServer({ port: 0 });
  return createHttpRepository({ origin: `http://localhost:${server.address().port}` });
});
after(() => server?.close());

describe("port conformance", () => {
  test("an incomplete adapter is rejected at startup", () => {
    assert.throws(() => assertBooksRepository({ name: "Broken", capabilities: { canCreate: true }, list() {} }), /missing get, create/);
  });
  test("server-only validation is translated to domain field names", async () => {
    const s = await startServer({ port: 0 });
    const repo = createHttpRepository({ origin: `http://localhost:${s.address().port}` });
    // Passes client-side validation; the API rejects it with { errors: { book_title: … } }.
    await assert.rejects(repo.create({ title: "Dracula", author: "Someone Else", year: 2001 }), (e) => {
      assert.ok(e instanceof ValidationError);
      assert.deepEqual(e.fieldErrors, { title: "has already been taken" });
      return true;
    });
    s.close();
  });
});
