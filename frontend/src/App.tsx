import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import "./App.css";
import Pages from "./pages/Pages";
import i18next from "./assets/locale/i18n";
import { helloApi } from "./utils";

function App() {
  const { t } = useTranslation("common");

  useEffect(() => {
    helloApi
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
