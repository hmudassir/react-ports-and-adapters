import { useCallback, useEffect, useState } from "react";
import { useRepository } from "./RepositoryContext";

export default function useBookList(query) {
  const repo = useRepository();
  const [state, setState] = useState({ page: null, error: null, loading: true });
  const key = JSON.stringify(query);

  const load = useCallback(() => {
    let active = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    repo.list(query).then(
      (page) => active && setState({ page, error: null, loading: false }),
      (error) => active && setState({ page: null, error, loading: false })
    );
    return () => (active = false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repo, key]);

  useEffect(load, [load]);
  return { ...state, reload: load };
}
