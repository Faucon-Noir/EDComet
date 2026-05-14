import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { EventEnum } from "ed-shared";
import "./App.css";
import Pages from "./pages/Pages";
import i18next from "./assets/locale/i18n";
import { helloApi } from "./utils/api";
import {
  JournalStreamProvider,
  useJournalStream,
} from "./utils/stream";

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
  }, []);

  useEffect(() => {
    const hasFileHeaderEvent = lastEvent?.events.some(e => e === EventEnum.FileHeader);
    const hasJournalSwitch = lastEvent?.files?.some(file => file.type === 'journal-switched');

    if (!hasFileHeaderEvent && !hasJournalSwitch) {
      return;
    }

    helloApi
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
