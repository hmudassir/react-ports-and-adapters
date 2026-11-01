import { useState } from "react";
import { useRepository } from "./RepositoryContext";

export default function AddBook({ onAdded }) {
  const repo = useRepository();
  const empty = { title: "", author: "", year: "", tags: "" };
  const [form, setForm] = useState(empty);
  const [error, setError] = useState(null);
  const [added, setAdded] = useState("");
  const fe = (k) => error?.fieldErrors?.[k];

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setAdded("");
    try {
      const book = await repo.create(form);
      setAdded(`Added “${book.title}”.`);
      setForm(empty);
      onAdded();
    } catch (err) {
      setError(err);
    }
  }

  const field = (key, label, type = "text") => (
    <label className="field">
      <span>{label}</span>
      <input type={type} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
      {fe(key) && <span className="fieldError">{fe(key)}</span>}
    </label>
  );

  return (
    <form className="card" onSubmit={submit} noValidate>
      <h2>Add a book</h2>
      <div className="grid2">
        {field("title", "Title")}
        {field("author", "Author")}
        {field("year", "Year", "number")}
        {field("tags", "Tags (comma-separated)")}
      </div>
      {error && !error.fieldErrors && <div className="notice error">{error.message}</div>}
      {added && <div className="notice ok">{added}</div>}
      <button className="btn">Add book</button>
      <p className="muted small">Try adding “Dracula” with the REST API: the duplicate check only exists on the server, and its error still lands under Title.</p>
    </form>
  );
}
