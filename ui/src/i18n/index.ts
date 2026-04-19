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
import enAdapters from "./locales/en/adapters.json";
import enPlugins from "./locales/en/plugins.json";
import enWorkspaces from "./locales/en/workspaces.json";

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
import ruAdapters from "./locales/ru/adapters.json";
import ruPlugins from "./locales/ru/plugins.json";
import ruWorkspaces from "./locales/ru/workspaces.json";

import deCommon from "./locales/de/common.json";
import deAgents from "./locales/de/agents.json";
import deChat from "./locales/de/chat.json";
import deSettings from "./locales/de/settings.json";
import deErrors from "./locales/de/errors.json";
import deOnboarding from "./locales/de/onboarding.json";
import deIssues from "./locales/de/issues.json";
import deGoals from "./locales/de/goals.json";
import deProjects from "./locales/de/projects.json";
import deOrg from "./locales/de/org.json";
import deApprovals from "./locales/de/approvals.json";
import deActivity from "./locales/de/activity.json";
import deRoutines from "./locales/de/routines.json";
import deCosts from "./locales/de/costs.json";
import deAdapters from "./locales/de/adapters.json";
import dePlugins from "./locales/de/plugins.json";
import deWorkspaces from "./locales/de/workspaces.json";

export const SUPPORTED_LANGUAGES = ["en", "ru", "de"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: SupportedLanguage = "en";
export const LANGUAGE_STORAGE_KEY = "paperclip-lang";

export const LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  ru: "Русский",
  de: "Deutsch",
};

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
    adapters: enAdapters,
    plugins: enPlugins,
    workspaces: enWorkspaces,
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
    adapters: ruAdapters,
    plugins: ruPlugins,
    workspaces: ruWorkspaces,
  },
  de: {
    common: deCommon,
    agents: deAgents,
    chat: deChat,
    settings: deSettings,
    errors: deErrors,
    onboarding: deOnboarding,
    issues: deIssues,
    goals: deGoals,
    projects: deProjects,
    org: deOrg,
    approvals: deApprovals,
    activity: deActivity,
    routines: deRoutines,
    costs: deCosts,
    adapters: deAdapters,
    plugins: dePlugins,
    workspaces: deWorkspaces,
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
  "adapters",
  "plugins",
  "workspaces",
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
