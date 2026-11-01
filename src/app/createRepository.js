/**
 * Composition root: the only place that knows which adapter is in use.
 * Everything else depends on the BooksRepository port.
 */
import { assertBooksRepository } from "../ports/BooksRepository.js";
import { createInMemoryRepository } from "../adapters/inMemory.js";
import { createStaticJsonRepository } from "../adapters/staticJson.js";
import { createHttpRepository } from "../adapters/http.js";
import seed from "../../public/data/books.json";

export function createRepository(env = import.meta.env) {
  const source = env.VITE_DATA_SOURCE || "static";
  const repo =
    source === "http" ? createHttpRepository({ origin: env.VITE_API_ORIGIN || "http://localhost:8081" })
    : source === "memory" ? createInMemoryRepository(seed)
    : createStaticJsonRepository({ url: "/data/books.json" });
  return assertBooksRepository(repo);
}
