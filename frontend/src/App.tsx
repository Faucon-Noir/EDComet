import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import "./App.css";
import Pages from "./pages/Pages";
import i18next from "./assets/locale/i18n";
import { helloApi } from "./utils";
import {
  JournalStreamProvider,
  useJournalStream,
} from "./features/journalStream";

function AppContent() {
  const { t } = useTranslation("common");
  const { lastEvent } = useJournalStream();

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
  }, [t]);

  useEffect(() => {
    if (lastEvent?.event !== "Fileheader") {
      return;
    }

    const configuration = new Configuration();
    const apiInstance = new HelloApi(configuration);

    apiInstance
      .getLanguage()
      .then((res) => {
        i18next.changeLanguage(res.data);
      })
      .catch((err) => {
        console.error("SSE language refresh error:", err);
      });
  }, [lastEvent]);

  return (
    <Pages />
  );
}

function App() {
  return (
    <JournalStreamProvider>
      <AppContent />
    </JournalStreamProvider>
  );
}

export default App;
