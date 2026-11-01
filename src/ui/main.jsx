import React from "react";
import ReactDOM from "react-dom/client";
import { createRepository } from "../app/createRepository";
import { RepositoryProvider } from "./RepositoryContext";
import App from "./App";
import "./styles.css";

const repository = createRepository(); // composition root: chosen once, at startup

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RepositoryProvider repository={repository}>
      <App />
    </RepositoryProvider>
  </React.StrictMode>
);
