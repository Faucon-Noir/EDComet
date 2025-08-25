import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import "./App.css";
import Pages from "./pages/Pages";
import {
	HelloApi,
	Configuration
} from './api/index';
import { useNavigate } from "react-router-dom";

function App() {
	const { t } = useTranslation("common");
	const navigate = useNavigate();
	const configuration = new Configuration();
	const apiInstance = new HelloApi(configuration);

	useEffect(() => {
		apiInstance.getHello()
			.then(res => {
				console.log(res.data.message);
				if (!res.data.message) {
					navigate("/404");
				}
			})
			.catch(err => {
				console.error("API error:", err);
				navigate("/404");
			});

		document.title = t("title");
	}, [t, navigate]);

	return (
		// <Provider store={store}>
		<Pages />
		// </Provider>
	);
}

export default App;
