import React from "react";
import { createRoot } from "react-dom/client"; // Import createRoot
import { Provider } from "react-redux";
import { store } from "./redux/store";
import App from "./App";

// Find the root container
const container = document.getElementById("root");

// Create a root
const root = createRoot(container);

// Initial render: Render the app in the root container
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
