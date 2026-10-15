import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { applySiteMode } from "./site-mode.js";
import "./styles.css";
import "./experience.css";
import "./theme.css";
import "./contact.css";
import "./projects.css";
import "./work-experience.css";
import "./responsive.css";
import "./site-modes.css";
applySiteMode();
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
