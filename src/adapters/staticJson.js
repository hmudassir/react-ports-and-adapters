import { NotFoundError, UnavailableError, UnsupportedError } from "../domain/errors.js";
import { queryBooks } from "../domain/query.js";

/**
 * Read-only adapter over a JSON file (e.g. served from a CDN). The file is
 * fetched once and queried in memory. It can't create, and says so through
 * capabilities, so the UI hides the form instead of failing on submit.
 */
export function createStaticJsonRepository({ url, fetchImpl = (...a) => fetch(...a) }) {
  let loading = null;
  const load = () =>
    (loading ??= fetchImpl(url)
      .then((res) => {
        if (!res.ok) throw new UnavailableError(`${url} returned ${res.status}`);
        return res.json();
      })
      .catch((e) => {
        loading = null; // allow a retry
        throw e instanceof UnavailableError ? e : new UnavailableError(e.message);
      }));

  return {
    name: "Static JSON",
    capabilities: { canCreate: false },
    async list(query) {
      return queryBooks(await load(), query);
    },
    async get(id) {
      const book = (await load()).find((b) => b.id === id);
      if (!book) throw new NotFoundError("Book");
      return book;
    },
    async create() {
      throw new UnsupportedError("add books");
    },
  };
}
