import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enCommon from "./locales/en/common.json";
import enAgents from "./locales/en/agents.json";
import enChat from "./locales/en/chat.json";
import enSettings from "./locales/en/settings.json";
import enErrors from "./locales/en/errors.json";
import enOnboarding from "./locales/en/onboarding.json";
import enIssues from "./locales/en/issues.json";
import enGoals from "./locales/en/goals.json";
import enProjects from "./locales/en/projects.json";
import enOrg from "./locales/en/org.json";
import enApprovals from "./locales/en/approvals.json";
import enActivity from "./locales/en/activity.json";
import enRoutines from "./locales/en/routines.json";
import enCosts from "./locales/en/costs.json";

import ruCommon from "./locales/ru/common.json";
import ruAgents from "./locales/ru/agents.json";
import ruChat from "./locales/ru/chat.json";
import ruSettings from "./locales/ru/settings.json";
import ruErrors from "./locales/ru/errors.json";
import ruOnboarding from "./locales/ru/onboarding.json";
import ruIssues from "./locales/ru/issues.json";
import ruGoals from "./locales/ru/goals.json";
import ruProjects from "./locales/ru/projects.json";
import ruOrg from "./locales/ru/org.json";
import ruApprovals from "./locales/ru/approvals.json";
import ruActivity from "./locales/ru/activity.json";
import ruRoutines from "./locales/ru/routines.json";
import ruCosts from "./locales/ru/costs.json";

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
    issues: enIssues,
    goals: enGoals,
    projects: enProjects,
    org: enOrg,
    approvals: enApprovals,
    activity: enActivity,
    routines: enRoutines,
    costs: enCosts,
  },
  ru: {
    common: ruCommon,
    agents: ruAgents,
    chat: ruChat,
    settings: ruSettings,
    errors: ruErrors,
    onboarding: ruOnboarding,
    issues: ruIssues,
    goals: ruGoals,
    projects: ruProjects,
    org: ruOrg,
    approvals: ruApprovals,
    activity: ruActivity,
    routines: ruRoutines,
    costs: ruCosts,
  },
} as const;

export const namespaces = [
  "common",
  "agents",
  "chat",
  "settings",
  "errors",
  "onboarding",
  "issues",
  "goals",
  "projects",
  "org",
  "approvals",
  "activity",
  "routines",
  "costs",
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
