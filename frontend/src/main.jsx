import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import DeferredToastContainer from "./components/common/DeferredToastContainer";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <DeferredToastContainer />
    </BrowserRouter>
  </StrictMode>,
);
