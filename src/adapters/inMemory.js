import { NotFoundError } from "../domain/errors.js";
import { validateNewBook } from "../domain/book.js";
import { queryBooks } from "../domain/query.js";

/** Reference adapter: data in an array. Fast, and the baseline the contract tests trust. */
export function createInMemoryRepository(seed = []) {
  const books = seed.map((b) => ({ ...b, tags: [...b.tags] }));
  let next = books.length + 1;
  return {
    name: "In-memory",
    capabilities: { canCreate: true },
    async list(query) {
      return queryBooks(books, query);
    },
    async get(id) {
      const book = books.find((b) => b.id === id);
      if (!book) throw new NotFoundError("Book");
      return book;
    },
    async create(input) {
      const book = { id: `m${next++}`, ...validateNewBook(input) };
      books.push(book);
      return book;
    },
  };
}
