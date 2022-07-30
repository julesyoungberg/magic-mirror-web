import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

import { testSupport } from "./support";

testSupport([{ client: "Chrome" }]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
