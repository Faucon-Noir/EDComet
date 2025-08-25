import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import "./App.css";
import Pages from "./pages/Pages";
import {
	HelloApi,
	Configuration
} from './api/index';

function App() {
	const { t } = useTranslation("common");
	const configuration = new Configuration();
	const apiInstance = new HelloApi(configuration);

	useEffect(() => {
		apiInstance.getHello().then(res => console.log(res.data));
		document.title = t("title");
	}, [t]);

	return (
		// <Provider store={store}>
		<Pages />
		// </Provider>
	);
}

export default App;
