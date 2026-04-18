import { PageTabBar } from "@/components/PageTabBar";
import { Tabs } from "@/components/ui/tabs";
import { useLocation, useNavigate } from "@/lib/router";
import { useTranslation } from "react-i18next";

const itemRoutes = [
  { value: "general", href: "/company/settings" },
  { value: "access", href: "/company/settings/access" },
  { value: "invites", href: "/company/settings/invites" },
] as const;

type CompanySettingsTab = (typeof itemRoutes)[number]["value"];

export function getCompanySettingsTab(pathname: string): CompanySettingsTab {
  if (pathname.includes("/company/settings/access")) {
    return "access";
  }

  if (pathname.includes("/company/settings/invites")) {
    return "invites";
  }

  return "general";
}

export function CompanySettingsNav() {
  const { t } = useTranslation(["settings"]);
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = getCompanySettingsTab(location.pathname);

  const items = [
    { value: "general", label: t("settings:nav.general"), href: "/company/settings" },
    { value: "access", label: t("settings:nav.access"), href: "/company/settings/access" },
    { value: "invites", label: t("settings:nav.invites"), href: "/company/settings/invites" },
  ] as const;

  function handleTabChange(value: string) {
    const nextTab = itemRoutes.find((item) => item.value === value);
    if (!nextTab || nextTab.value === activeTab) return;
    navigate(nextTab.href);
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <PageTabBar
        items={items.map(({ value, label }) => ({ value, label }))}
        value={activeTab}
        onValueChange={handleTabChange}
        align="start"
      />
    </Tabs>
  );
}
