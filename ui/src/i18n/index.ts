import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enCommon from "./locales/en/common.json";
import enAgents from "./locales/en/agents.json";
import enChat from "./locales/en/chat.json";
import enSettings from "./locales/en/settings.json";
import enErrors from "./locales/en/errors.json";
import enOnboarding from "./locales/en/onboarding.json";

import ruCommon from "./locales/ru/common.json";
import ruAgents from "./locales/ru/agents.json";
import ruChat from "./locales/ru/chat.json";
import ruSettings from "./locales/ru/settings.json";
import ruErrors from "./locales/ru/errors.json";
import ruOnboarding from "./locales/ru/onboarding.json";

export const SUPPORTED_LANGUAGES = ["en", "ru"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: SupportedLanguage = "en";
export const LANGUAGE_STORAGE_KEY = "paperclip-lang";

export const resources = {
  en: {
    common: enCommon,
    agents: enAgents,
    chat: enChat,
    settings: enSettings,
    errors: enErrors,
    onboarding: enOnboarding,
  },
  ru: {
    common: ruCommon,
    agents: ruAgents,
    chat: ruChat,
    settings: ruSettings,
    errors: ruErrors,
    onboarding: ruOnboarding,
  },
} as const;

export const namespaces = [
  "common",
  "agents",
  "chat",
  "settings",
  "errors",
  "onboarding",
] as const;

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: SUPPORTED_LANGUAGES,
    ns: namespaces,
    defaultNS: "common",
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ["localStorage"],
    },
    interpolation: {
      escapeValue: false,
    },
    returnNull: false,
  });

export default i18n;
