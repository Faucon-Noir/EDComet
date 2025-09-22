import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import "./App.css";
import Pages from "./pages/Pages";
import { HelloApi, Configuration } from "./api/index";
import i18next from "./assets/locale/i18n";

function App() {
  const { t } = useTranslation("common");
  const configuration = new Configuration();
  const apiInstance = new HelloApi(configuration);

  useEffect(() => {
    apiInstance
      .getHello()
      .then((res) => {
        i18next.changeLanguage(res.data.lang);
      })
      .catch((err) => {
        console.error("API error:", err);
      });
    document.title = t("title");
  }, []);

  return (
    // <Provider store={store}>
    <Pages />
    // </Provider>
  );
}

export default App;
