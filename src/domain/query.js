/**
 * Query rules shared by adapters that hold all the data themselves
 * (in-memory, static JSON). The HTTP adapter leaves this to the server,
 * and the contract tests check all of them agree.
 *   search: case-insensitive match on title or author
 *   tag:    exact tag
 *   order:  title A→Z
 *   page:   zero-based
 */
export function queryBooks(books, { search = "", tag = "", page = 0, size = 5 } = {}) {
  const q = search.trim().toLowerCase();
  const filtered = books
    .filter((b) => !q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q))
    .filter((b) => !tag || b.tags.includes(tag))
    .sort((a, b) => a.title.localeCompare(b.title));
  return {
    items: filtered.slice(page * size, page * size + size),
    page,
    size,
    totalItems: filtered.length,
    totalPages: Math.ceil(filtered.length / size),
  };
}
