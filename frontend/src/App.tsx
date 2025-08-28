import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import "./App.css";
import Pages from "./pages/Pages";
import {
	HelloApi,
	Configuration
} from './api/index';
import { useNavigate } from "react-router-dom";
import i18next from "./assets/locale/i18n";

function App() {
	const { t } = useTranslation("common");
	const navigate = useNavigate();
	const configuration = new Configuration();
	const apiInstance = new HelloApi(configuration);
	apiInstance.getHello()
		.then(res => {
			// console.log(res.data.message);
			// if (!res.data.message) {
			// 	navigate("/404");
			// }
			if (res.data.lang) {
				i18next.changeLanguage(res.data.lang);
			}
		})
		.catch(err => {
			console.error("API error:", err);
			navigate("/404");
		});
	useEffect(() => {


		document.title = t("title");
	}, [t, navigate]);

	return (
		// <Provider store={store}>
		<Pages />
		// </Provider>
	);
}

export default App;
