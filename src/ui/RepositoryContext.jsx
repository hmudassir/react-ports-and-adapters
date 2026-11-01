import { createContext, useContext } from "react";

/** Components get the repository from here and never import an adapter. */
const RepositoryContext = createContext(null);
export const RepositoryProvider = ({ repository, children }) => (
  <RepositoryContext.Provider value={repository}>{children}</RepositoryContext.Provider>
);
export function useRepository() {
  const repo = useContext(RepositoryContext);
  if (!repo) throw new Error("useRepository must be used inside <RepositoryProvider>");
  return repo;
}
