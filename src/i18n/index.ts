import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import strings from "./translation.json";
const locales = new Set(
  Object.values(strings).flatMap((entry) => Object.keys(entry)),
);
const resources = Object.fromEntries(
  [...locales].map((locale) => [
    locale,
    {
      "open-skins": Object.fromEntries(
        Object.entries(strings).flatMap(([key, entry]) => {
          const text = (entry as Record<string, string>)[locale];
          return text ? [[key, text]] : [];
        }),
      ),
    },
  ]),
);
void i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: navigator.language,
    fallbackLng: "en",
    defaultNS: "open-skins",
    interpolation: { escapeValue: false },
  });
export default i18n;
