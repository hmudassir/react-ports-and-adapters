import { useState } from "react";
import { useRepository } from "./RepositoryContext";
import useBookList from "./useBookList";
import AddBook from "./AddBook";

const TAGS = ["", "classic", "gothic", "romance", "adventure", "science-fiction", "mystery"];

export default function App() {
  const repo = useRepository();
  const [search, setSearch] = useState("");
  const [tag, setTag] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(null);
  const list = useBookList({ search, tag, page, size: 5 });

  async function open(id) {
    try {
      setSelected(await repo.get(id));
    } catch (e) {
      setSelected({ error: e.message });
    }
  }

  return (
    <main className="wrap">
      <header>
        <h1>Books</h1>
        <p className="muted">
          Data source: <span className="pill">{repo.name}</span>
          {!repo.capabilities.canCreate && <span className="muted small"> (read-only)</span>}
        </p>
      </header>

      <div className="filters">
        <input aria-label="Search title or author" placeholder="Search title or author" value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }} />
        <select aria-label="Tag" value={tag} onChange={(e) => { setTag(e.target.value); setPage(0); }}>
          {TAGS.map((t) => <option key={t} value={t}>{t || "All tags"}</option>)}
        </select>
      </div>

      {list.error && <div className="notice error">{list.error.message} <button className="link" onClick={list.reload}>Retry</button></div>}
      {list.page && (
        <>
          <ul className="books">
            {list.page.items.map((b) => (
              <li key={b.id}>
                <button className="bookBtn" onClick={() => open(b.id)}>
                  <strong>{b.title}</strong>
                  <span className="muted"> {b.author}, {b.year}</span>
                </button>
              </li>
            ))}
            {!list.page.items.length && <li className="muted">No books match.</li>}
          </ul>
          <div className="pager">
            <button disabled={page === 0} onClick={() => setPage(page - 1)}>← Previous</button>
            <span className="muted small">Page {list.page.totalPages ? page + 1 : 0} of {list.page.totalPages} · {list.page.totalItems} books</span>
            <button disabled={page + 1 >= list.page.totalPages} onClick={() => setPage(page + 1)}>Next →</button>
          </div>
        </>
      )}

      {selected && (
        <aside className="card">
          {selected.error ? <p>{selected.error}</p> : (
            <>
              <h2>{selected.title}</h2>
              <p>{selected.author} · {selected.year}</p>
              <p>{selected.tags.map((t) => <span key={t} className="pill">{t}</span>)}</p>
            </>
          )}
          <button className="link" onClick={() => setSelected(null)}>Close</button>
        </aside>
      )}

      {repo.capabilities.canCreate ? <AddBook onAdded={list.reload} /> : (
        <p className="muted small">Adding books isn’t available with this data source, so the form is hidden rather than failing on submit.</p>
      )}
    </main>
  );
}
