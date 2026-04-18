// i18next-parser config
// Usage: npx i18next-parser
// Extracts t("ns:key") calls from src/** and writes to src/i18n/locales/{{locale}}/{{ns}}.json
export default {
  locales: ["en", "ru"],
  output: "src/i18n/locales/$LOCALE/$NAMESPACE.json",
  input: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.test.{ts,tsx}",
    "!src/i18n/**",
  ],
  namespaceSeparator: ":",
  keySeparator: ".",
  defaultNamespace: "common",
  defaultValue: (locale, namespace, key, value) => (locale === "en" ? value || key : ""),
  keepRemoved: false,
  sort: true,
  createOldCatalogs: false,
  useKeysAsDefaultValue: false,
  indentation: 2,
  lexers: {
    tsx: ["JsxLexer"],
    ts: ["JavascriptLexer"],
    default: ["JavascriptLexer"],
  },
};
