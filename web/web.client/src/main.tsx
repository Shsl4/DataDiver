import React from "react";
import ReactDOM from "react-dom/client";
import App from "App.tsx";
import { ThemeManager } from "utilities/ThemeManager.ts";
import { BrowserRouter } from "react-router-dom";
import "extensions.d.ts";
import "styles/main.scss";

ThemeManager.init();

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </React.StrictMode>
);
