import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import "./App.css";
import Pages from "./pages/Pages";

function App() {
	const { t } = useTranslation("common");

	useEffect(() => {
		document.title = t("title");
	}, [t]);

	return (
		// <Provider store={store}>
		<Pages />
		// </Provider>
	);
}

export default App;
