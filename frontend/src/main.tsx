import { ThemeProvider } from "@emotion/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import App from "./App.tsx";
import "./main.css";
import theme from "./theme.ts";
import { CssBaseline } from "@mui/material";
import "./assets/locale/i18n.ts";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<ThemeProvider theme={theme}>
			<CssBaseline />
			<Router>
				<App />
			</Router>
		</ThemeProvider>
	</StrictMode>
);
