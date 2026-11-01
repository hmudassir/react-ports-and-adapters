import { ValidationError } from "./errors.js";

/**
 * The domain model, independent of any storage format:
 *   Book { id: string, title: string, author: string, year: number, tags: string[] }
 */
const THIS_YEAR = new Date().getFullYear();

/** Validate and normalise input for a new book. Shared by every adapter that can create. */
export function validateNewBook(input = {}) {
  const errors = {};
  const title = String(input.title ?? "").trim();
  const author = String(input.author ?? "").trim();
  const year = Number(input.year);
  const tags = (Array.isArray(input.tags) ? input.tags : String(input.tags ?? "").split(","))
    .map((t) => String(t).trim().toLowerCase())
    .filter(Boolean);

  if (!title) errors.title = "Enter a title.";
  else if (title.length > 200) errors.title = "Use 200 characters or fewer.";
  if (!author) errors.author = "Enter an author.";
  if (!Number.isInteger(year) || year < 1000 || year > THIS_YEAR) errors.year = `Enter a year between 1000 and ${THIS_YEAR}.`;
  if (tags.length > 5) errors.tags = "Use at most 5 tags.";

  if (Object.keys(errors).length) throw new ValidationError(errors);
  return { title, author, year, tags: [...new Set(tags)] };
}
