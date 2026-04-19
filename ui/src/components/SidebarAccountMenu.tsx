import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Languages,
  LogOut,
  type LucideIcon,
  Moon,
  Settings,
  Sun,
  UserRoundPen,
} from "lucide-react";
import type { DeploymentMode } from "@paperclipai/shared";
import { SUPPORTED_LANGUAGES, LANGUAGE_LABELS, LANGUAGE_STORAGE_KEY } from "@/i18n";
import { Link } from "@/lib/router";
import { authApi } from "@/api/auth";
import { queryKeys } from "@/lib/queryKeys";
import { useSidebar } from "../context/SidebarContext";
import { useTheme } from "../context/ThemeContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "../lib/utils";

const PROFILE_SETTINGS_PATH = "/instance/settings/profile";
const DOCS_URL = "https://docs.paperclip.ing/";

interface SidebarAccountMenuProps {
  deploymentMode?: DeploymentMode;
  instanceSettingsTarget: string;
  version?: string | null;
}

interface MenuActionProps {
  label: string;
  description?: string;
  icon: LucideIcon;
  onClick?: () => void;
  href?: string;
  external?: boolean;
}

function deriveInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts[parts.length - 1]?.[0] ?? ""}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function MenuAction({ label, description, icon: Icon, onClick, href, external = false }: MenuActionProps) {
  const className =
    "flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-accent/60";

  const content = (
    <>
      <span className="mt-0.5 rounded-lg border border-border bg-background/70 p-2 text-muted-foreground">
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-foreground">{label}</span>
        {description ? <span className="block text-xs text-muted-foreground">{description}</span> : null}
      </span>
    </>
  );

  if (href) {
    if (external) {
      return (
        <a href={href} target="_blank" rel="noreferrer" className={className} onClick={onClick}>
          {content}
        </a>
      );
    }

    return (
      <Link to={href} className={className} onClick={onClick}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className={className} onClick={onClick}>
      {content}
    </button>
  );
}

export function SidebarAccountMenu({
  deploymentMode,
  instanceSettingsTarget,
  version,
}: SidebarAccountMenuProps) {
  const { t, i18n } = useTranslation(["common"]);
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { isMobile, setSidebarOpen } = useSidebar();
  const { theme, toggleTheme } = useTheme();
  const { data: session } = useQuery({
    queryKey: queryKeys.auth.session,
    queryFn: () => authApi.getSession(),
    retry: false,
  });

  const signOutMutation = useMutation({
    mutationFn: () => authApi.signOut(),
    onSuccess: async () => {
      setOpen(false);
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.session });
    },
  });

  const displayName = session?.user.name?.trim() || t("common:account.displayNameFallback");
  const secondaryLabel =
    session?.user.email?.trim() || (deploymentMode === "authenticated" ? t("common:account.signedIn") : t("common:account.localWorkspace"));
  const accountBadge = deploymentMode === "authenticated" ? t("common:account.accountBadge") : t("common:account.localBadge");
  const initials = deriveInitials(displayName);

  function closeNavigationChrome() {
    setOpen(false);
    if (isMobile) setSidebarOpen(false);
  }

  return (
    <div className="border-t border-r border-border bg-background px-3 py-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] font-medium text-foreground/80 transition-colors hover:bg-accent/50 hover:text-foreground"
            aria-label={t("common:account.openMenu")}
          >
            <Avatar size="sm">
              {session?.user.image ? <AvatarImage src={session.user.image} alt={displayName} /> : null}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <span className="min-w-0 flex-1 truncate">{displayName}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="start"
          sideOffset={10}
          className="w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-t-2xl rounded-b-none border-border p-0 shadow-2xl"
        >
          <div className="px-4 pt-4 pb-4">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl border-4 border-popover bg-popover p-0.5 shadow-sm">
                <Avatar size="lg">
                  {session?.user.image ? <AvatarImage src={session.user.image} alt={displayName} /> : null}
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </div>
              <div className="min-w-0 flex-1 pt-1">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-base font-semibold text-foreground">{displayName}</h2>
                  <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {accountBadge}
                  </span>
                </div>
                <p className="truncate text-sm text-muted-foreground">{secondaryLabel}</p>
                {version ? (
                  <p className="mt-1 text-xs text-muted-foreground">{t("common:account.version", { version })}</p>
                ) : null}
              </div>
            </div>

            <div className="mt-4 space-y-1">
              <MenuAction
                label={t("common:account.editProfile")}
                description={t("common:account.editProfileDesc")}
                icon={UserRoundPen}
                href={PROFILE_SETTINGS_PATH}
                onClick={closeNavigationChrome}
              />
              <MenuAction
                label={t("common:account.instanceSettings")}
                description={t("common:account.instanceSettingsDesc")}
                icon={Settings}
                href={instanceSettingsTarget}
                onClick={closeNavigationChrome}
              />
              <MenuAction
                label={t("common:account.documentation")}
                description={t("common:account.documentationDesc")}
                icon={BookOpen}
                href={DOCS_URL}
                external
                onClick={() => setOpen(false)}
              />
              {SUPPORTED_LANGUAGES.filter(lng => lng !== (i18n.resolvedLanguage ?? "en").slice(0, 2)).map(lng => (
                <MenuAction
                  key={lng}
                  label={LANGUAGE_LABELS[lng] ?? lng.toUpperCase()}
                  icon={Languages}
                  onClick={() => {
                    void i18n.changeLanguage(lng);
                    try { window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lng); } catch { /* ignore */ }
                    setOpen(false);
                  }}
                />
              ))}
              <MenuAction
                label={t(theme === "dark" ? "common:account.switchToLight" : "common:account.switchToDark")}
                description={t("common:account.toggleThemeDesc")}
                icon={theme === "dark" ? Sun : Moon}
                onClick={() => {
                  toggleTheme();
                  setOpen(false);
                }}
              />
              {deploymentMode === "authenticated" ? (
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-destructive/10",
                    signOutMutation.isPending && "cursor-not-allowed opacity-60",
                  )}
                  onClick={() => signOutMutation.mutate()}
                  disabled={signOutMutation.isPending}
                >
                  <span className="mt-0.5 rounded-lg border border-border bg-background/70 p-2 text-muted-foreground">
                    <LogOut className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-foreground">
                      {signOutMutation.isPending ? t("common:account.signingOut") : t("common:account.signOut")}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {t("common:account.signOutDesc")}
                    </span>
                  </span>
                </button>
              ) : null}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
