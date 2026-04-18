import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ShortcutEntry {
  keys: string[];
  label: string;
}

interface ShortcutSection {
  title: string;
  shortcuts: ShortcutEntry[];
}

function KeyCap({ children }: { children: string }) {
  return (
    <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded border border-border bg-muted px-1.5 font-mono text-xs font-medium text-foreground shadow-[0_1px_0_1px_hsl(var(--border))]">
      {children}
    </kbd>
  );
}

export function KeyboardShortcutsCheatsheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation(["common"]);

  const sections: ShortcutSection[] = [
    {
      title: t("common:shortcuts.inbox.title"),
      shortcuts: [
        { keys: ["j"], label: t("common:shortcuts.inbox.moveDown") },
        { keys: ["k"], label: t("common:shortcuts.inbox.moveUp") },
        { keys: ["Enter"], label: t("common:shortcuts.inbox.open") },
        { keys: ["a"], label: t("common:shortcuts.inbox.archive") },
        { keys: ["y"], label: t("common:shortcuts.inbox.archive") },
        { keys: ["r"], label: t("common:shortcuts.inbox.markRead") },
        { keys: ["U"], label: t("common:shortcuts.inbox.markUnread") },
      ],
    },
    {
      title: t("common:shortcuts.issueDetail.title"),
      shortcuts: [
        { keys: ["y"], label: t("common:shortcuts.issueDetail.quickArchive") },
        { keys: ["g", "i"], label: t("common:shortcuts.issueDetail.goToInbox") },
        { keys: ["g", "c"], label: t("common:shortcuts.issueDetail.focusComment") },
      ],
    },
    {
      title: t("common:shortcuts.global.title"),
      shortcuts: [
        { keys: ["/"], label: t("common:shortcuts.global.search") },
        { keys: ["c"], label: t("common:shortcuts.global.newIssue") },
        { keys: ["["], label: t("common:shortcuts.global.toggleSidebar") },
        { keys: ["]"], label: t("common:shortcuts.global.togglePanel") },
        { keys: ["?"], label: t("common:shortcuts.global.showShortcuts") },
      ],
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md gap-0 p-0 overflow-hidden" showCloseButton={false}>
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="text-base">{t("common:shortcuts.title")}</DialogTitle>
        </DialogHeader>
        <div className="divide-y divide-border border-t border-border">
          {sections.map((section) => (
            <div key={section.title} className="px-5 py-3">
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {section.title}
              </h3>
              <div className="space-y-1.5">
                {section.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.label + shortcut.keys.join()}
                    className="flex items-center justify-between gap-4"
                  >
                    <span className="text-sm text-foreground/90">{shortcut.label}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, i) => (
                        <span key={key} className="flex items-center gap-1">
                          {i > 0 && <span className="text-xs text-muted-foreground">{t("common:shortcuts.then")}</span>}
                          <KeyCap>{key}</KeyCap>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-border px-5 py-3">
          <p className="text-xs text-muted-foreground">
            {t("common:shortcuts.closePre")} <KeyCap>Esc</KeyCap> {t("common:shortcuts.closePost")}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
