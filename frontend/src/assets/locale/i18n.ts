import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector/cjs";
import Backend from "i18next-http-backend";
import commonEN from "./en/common.json";
// import commonFR from "./fr/common.json";
import pageEN from "./en/page.json";
// import pageFR from "./fr/page.json";

const resources = {
	en: {
		common: commonEN,
		page: pageEN,
	},
	// fr: {
	// 	common: commonFR,
	// 	page: pageFR,
	// },
};

i18next
	.use(Backend)
	.use(LanguageDetector)
	.use(initReactI18next)
	.init({
		fallbackLng: "en",
		debug: true,
		interpolation: {
			escapeValue: false,
		},
		resources,
	});

export default i18next;
