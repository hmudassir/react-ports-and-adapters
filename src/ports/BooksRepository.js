/**
 * The port: what the application needs from storage, nothing more.
 *
 * @typedef {{ id: string, title: string, author: string, year: number, tags: string[] }} Book
 * @typedef {{ items: Book[], page: number, size: number, totalItems: number, totalPages: number }} Page
 *
 * @typedef {object} BooksRepository
 * @property {string} name                          shown in the UI
 * @property {{ canCreate: boolean }} capabilities  what this adapter supports
 * @property {(q?: {search?: string, tag?: string, page?: number, size?: number}) => Promise<Page>} list
 * @property {(id: string) => Promise<Book>} get     rejects with NotFoundError
 * @property {(input: object) => Promise<Book>} create
 *           rejects with ValidationError, or UnsupportedError if !capabilities.canCreate
 */

const REQUIRED = ["list", "get", "create"];

/** Fail fast at startup if an adapter doesn't implement the port. */
export function assertBooksRepository(repo) {
  const missing = REQUIRED.filter((m) => typeof repo?.[m] !== "function");
  if (missing.length || typeof repo?.capabilities?.canCreate !== "boolean" || !repo?.name) {
    throw new TypeError(`Not a BooksRepository: missing ${[...missing, !repo?.name && "name", typeof repo?.capabilities?.canCreate !== "boolean" && "capabilities.canCreate"].filter(Boolean).join(", ")}`);
  }
  return repo;
}
