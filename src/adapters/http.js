import { NotFoundError, UnavailableError, ValidationError } from "../domain/errors.js";
import { validateNewBook } from "../domain/book.js";

/**
 * Adapter for a REST API whose format differs from the domain:
 *   { book_id, book_title, author_name, published_year, tag_list }
 *   lists: { data: [...], meta: { page, per_page, total } }
 *   errors: 400 { errors: { book_title: "…" } }
 * Translating here (an anti-corruption layer) keeps the API's naming out of
 * the rest of the app.
 */
const toDomain = (dto) => ({
  id: String(dto.book_id),
  title: dto.book_title,
  author: dto.author_name,
  year: dto.published_year,
  tags: dto.tag_list ?? [],
});
const toDto = (book) => ({ book_title: book.title, author_name: book.author, published_year: book.year, tag_list: book.tags });
const FIELD_TO_DOMAIN = { book_title: "title", author_name: "author", published_year: "year", tag_list: "tags" };

export function createHttpRepository({ origin, fetchImpl = (...a) => fetch(...a) }) {
  const base = String(origin).replace(/\/+$/, "");

  async function call(path, init) {
    let res;
    try {
      res = await fetchImpl(`${base}${path}`, { headers: { Accept: "application/json", "Content-Type": "application/json" }, ...init });
    } catch (e) {
      throw new UnavailableError(e.message);
    }
    const body = res.status === 204 ? null : await res.json().catch(() => null);
    if (res.status === 404) throw new NotFoundError("Book");
    if (res.status === 400 && body?.errors) {
      throw new ValidationError(Object.fromEntries(Object.entries(body.errors).map(([k, v]) => [FIELD_TO_DOMAIN[k] || k, v])));
    }
    if (!res.ok) throw new UnavailableError(`HTTP ${res.status}`);
    return body;
  }

  return {
    name: "REST API",
    capabilities: { canCreate: true },
    async list({ search = "", tag = "", page = 0, size = 5 } = {}) {
      const qs = new URLSearchParams({ page: String(page + 1), per_page: String(size) }); // the API is one-based
      if (search) qs.set("q", search);
      if (tag) qs.set("tag", tag);
      const body = await call(`/api/books?${qs}`);
      const total = body.meta.total;
      return { items: body.data.map(toDomain), page, size, totalItems: total, totalPages: Math.ceil(total / size) };
    },
    async get(id) {
      return toDomain(await call(`/api/books/${encodeURIComponent(id)}`));
    },
    async create(input) {
      const book = validateNewBook(input); // fail fast with the same rules, before the network
      return toDomain(await call("/api/books", { method: "POST", body: JSON.stringify(toDto(book)) }));
    },
  };
}
