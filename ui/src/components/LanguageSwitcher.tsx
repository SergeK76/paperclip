import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { SUPPORTED_LANGUAGES, LANGUAGE_STORAGE_KEY } from "@/i18n";

const LABELS: Record<string, string> = {
  en: "English",
  ru: "Русский",
};

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation("common");

  const current = (i18n.resolvedLanguage ?? i18n.language ?? "en").slice(0, 2);

  const handleChange = (lng: string) => {
    void i18n.changeLanguage(lng);
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
    } catch {
      /* ignore */
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" aria-label={t("language.label")}>
          {LABELS[current] ?? current.toUpperCase()}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {SUPPORTED_LANGUAGES.map((lng) => (
          <DropdownMenuItem
            key={lng}
            onClick={() => handleChange(lng)}
            data-active={current === lng}
          >
            {LABELS[lng] ?? lng.toUpperCase()}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default LanguageSwitcher;
