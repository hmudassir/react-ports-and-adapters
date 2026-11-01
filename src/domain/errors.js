/** Domain errors. Every adapter translates its own failures into these. */
export class NotFoundError extends Error {
  constructor(what = "Item") { super(`${what} not found`); this.name = "NotFoundError"; }
}
export class ValidationError extends Error {
  constructor(fieldErrors) {
    super("Please fix the highlighted fields");
    this.name = "ValidationError";
    this.fieldErrors = fieldErrors; // { title: "…", author: "…" } in domain field names
  }
}
export class UnsupportedError extends Error {
  constructor(operation) { super(`This data source can’t ${operation}`); this.name = "UnsupportedError"; }
}
export class UnavailableError extends Error {
  constructor(detail) { super(`The data source is unavailable${detail ? `: ${detail}` : ""}`); this.name = "UnavailableError"; }
}
