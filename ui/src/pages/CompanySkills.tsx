import { useEffect, useMemo, useState, type SVGProps } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "@/lib/router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CompanySkillCreateRequest,
  CompanySkillDetail,
  CompanySkillFileDetail,
  CompanySkillFileInventoryEntry,
  CompanySkillListItem,
  CompanySkillProjectScanResult,
  CompanySkillSourceBadge,
  CompanySkillUpdateStatus,
} from "@paperclipai/shared";
import { companySkillsApi } from "../api/companySkills";
import { useCompany } from "../context/CompanyContext";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { useToastActions } from "../context/ToastContext";
import { queryKeys } from "../lib/queryKeys";
import { EmptyState } from "../components/EmptyState";
import { MarkdownBody } from "../components/MarkdownBody";
import { MarkdownEditor } from "../components/MarkdownEditor";
import { PageSkeleton } from "../components/PageSkeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "../lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Boxes,
  ChevronDown,
  ChevronRight,
  Code2,
  Eye,
  FileCode2,
  FileText,
  Folder,
  FolderOpen,
  Github,
  Link2,
  ExternalLink,
  Paperclip,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
} from "lucide-react";

type SkillTreeNode = {
  name: string;
  path: string | null;
  kind: "dir" | "file";
  fileKind?: CompanySkillFileInventoryEntry["kind"];
  children: SkillTreeNode[];
};

const SKILL_TREE_BASE_INDENT = 16;
const SKILL_TREE_STEP_INDENT = 24;
const SKILL_TREE_ROW_HEIGHT_CLASS = "min-h-9";

function VercelMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 4 21 19H3z" />
    </svg>
  );
}

function stripFrontmatter(markdown: string) {
  const normalized = markdown.replace(/\r\n/g, "\n");
  if (!normalized.startsWith("---\n")) return normalized.trim();
  const closing = normalized.indexOf("\n---\n", 4);
  if (closing < 0) return normalized.trim();
  return normalized.slice(closing + 5).trim();
}

function splitFrontmatter(markdown: string): { frontmatter: string | null; body: string } {
  const normalized = markdown.replace(/\r\n/g, "\n");
  if (!normalized.startsWith("---\n")) {
    return { frontmatter: null, body: normalized };
  }
  const closing = normalized.indexOf("\n---\n", 4);
  if (closing < 0) {
    return { frontmatter: null, body: normalized };
  }
  return {
    frontmatter: normalized.slice(4, closing).trim(),
    body: normalized.slice(closing + 5).trimStart(),
  };
}

function mergeFrontmatter(markdown: string, body: string) {
  const parsed = splitFrontmatter(markdown);
  if (!parsed.frontmatter) return body;
  return ["---", parsed.frontmatter, "---", "", body].join("\n");
}

function buildTree(entries: CompanySkillFileInventoryEntry[]) {
  const root: SkillTreeNode = { name: "", path: null, kind: "dir", children: [] };

  for (const entry of entries) {
    const segments = entry.path.split("/").filter(Boolean);
    let current = root;
    let currentPath = "";
    for (const [index, segment] of segments.entries()) {
      currentPath = currentPath ? `${currentPath}/${segment}` : segment;
      const isLeaf = index === segments.length - 1;
      let next = current.children.find((child) => child.name === segment);
      if (!next) {
        next = {
          name: segment,
          path: isLeaf ? entry.path : currentPath,
          kind: isLeaf ? "file" : "dir",
          fileKind: isLeaf ? entry.kind : undefined,
          children: [],
        };
        current.children.push(next);
      }
      current = next;
    }
  }

  function sortNode(node: SkillTreeNode) {
    node.children.sort((left, right) => {
      if (left.kind !== right.kind) return left.kind === "dir" ? -1 : 1;
      if (left.name === "SKILL.md") return -1;
      if (right.name === "SKILL.md") return 1;
      return left.name.localeCompare(right.name);
    });
    node.children.forEach(sortNode);
  }

  sortNode(root);
  return root.children;
}

type TFunction = ReturnType<typeof useTranslation<["settings"]>>["t"];

function sourceMeta(sourceBadge: CompanySkillSourceBadge, sourceLabel: string | null, t: TFunction) {
  const normalizedLabel = sourceLabel?.toLowerCase() ?? "";
  const isSkillsShManaged =
    normalizedLabel.includes("skills.sh") || normalizedLabel.includes("vercel-labs/skills");

  switch (sourceBadge) {
    case "skills_sh":
      return { icon: VercelMark, label: sourceLabel ?? "skills.sh", managedLabel: t("settings:company.skills.detail.managedBy.skillsSh") };
    case "github":
      return isSkillsShManaged
        ? { icon: VercelMark, label: sourceLabel ?? "skills.sh", managedLabel: t("settings:company.skills.detail.managedBy.skillsSh") }
        : { icon: Github, label: sourceLabel ?? "GitHub", managedLabel: t("settings:company.skills.detail.managedBy.github") };
    case "url":
      return { icon: Link2, label: sourceLabel ?? "URL", managedLabel: t("settings:company.skills.detail.managedBy.url") };
    case "local":
      return { icon: Folder, label: sourceLabel ?? "Folder", managedLabel: t("settings:company.skills.detail.managedBy.folder") };
    case "paperclip":
      return { icon: Paperclip, label: sourceLabel ?? "Paperclip", managedLabel: t("settings:company.skills.detail.managedBy.paperclip") };
    default:
      return { icon: Boxes, label: sourceLabel ?? "Catalog", managedLabel: t("settings:company.skills.detail.managedBy.catalog") };
  }
}

function shortRef(ref: string | null | undefined) {
  if (!ref) return null;
  return ref.slice(0, 7);
}

function formatProjectScanSummary(result: CompanySkillProjectScanResult, t: TFunction) {
  const parts = [
    t("settings:company.skills.scan.found", { count: result.discovered }),
    t("settings:company.skills.scan.imported", { count: result.imported.length }),
    t("settings:company.skills.scan.updated", { count: result.updated.length }),
  ];
  if (result.conflicts.length > 0) parts.push(t("settings:company.skills.scan.conflicts", { count: result.conflicts.length }));
  if (result.skipped.length > 0) parts.push(t("settings:company.skills.scan.skipped", { count: result.skipped.length }));
  return `${parts.join(", ")} ${t("settings:company.skills.scan.acrossWorkspaces", { count: result.scannedWorkspaces })}.`;
}

function fileIcon(kind: CompanySkillFileInventoryEntry["kind"]) {
  if (kind === "script" || kind === "reference") return FileCode2;
  return FileText;
}

function encodeSkillFilePath(filePath: string) {
  return filePath.split("/").map((segment) => encodeURIComponent(segment)).join("/");
}

function decodeSkillFilePath(filePath: string | undefined) {
  if (!filePath) return "SKILL.md";
  return filePath
    .split("/")
    .filter(Boolean)
    .map((segment) => {
      try {
        return decodeURIComponent(segment);
      } catch {
        return segment;
      }
    })
    .join("/");
}

function parseSkillRoute(routePath: string | undefined) {
  const segments = (routePath ?? "").split("/").filter(Boolean);
  if (segments.length === 0) {
    return { skillId: null, filePath: "SKILL.md" };
  }

  const [rawSkillId, rawMode, ...rest] = segments;
  const skillId = rawSkillId ? decodeURIComponent(rawSkillId) : null;
  if (!skillId) {
    return { skillId: null, filePath: "SKILL.md" };
  }

  if (rawMode === "files") {
    return {
      skillId,
      filePath: decodeSkillFilePath(rest.join("/")),
    };
  }

  return { skillId, filePath: "SKILL.md" };
}

function skillRoute(skillId: string, filePath?: string | null) {
  return filePath ? `/skills/${skillId}/files/${encodeSkillFilePath(filePath)}` : `/skills/${skillId}`;
}

function parentDirectoryPaths(filePath: string) {
  const segments = filePath.split("/").filter(Boolean);
  const parents: string[] = [];
  for (let index = 0; index < segments.length - 1; index += 1) {
    parents.push(segments.slice(0, index + 1).join("/"));
  }
  return parents;
}

function NewSkillForm({
  onCreate,
  isPending,
  onCancel,
}: {
  onCreate: (payload: CompanySkillCreateRequest) => void;
  isPending: boolean;
  onCancel: () => void;
}) {
  const { t } = useTranslation(["settings"]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");

  return (
    <div className="border-b border-border px-4 py-4">
      <div className="space-y-3">
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={t("settings:company.skills.create.namePlaceholder")}
          className="h-9 rounded-none border-0 border-b border-border px-0 shadow-none focus-visible:ring-0"
        />
        <Input
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          placeholder={t("settings:company.skills.create.slugPlaceholder")}
          className="h-9 rounded-none border-0 border-b border-border px-0 shadow-none focus-visible:ring-0"
        />
        <Textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder={t("settings:company.skills.create.descriptionPlaceholder")}
          className="min-h-20 rounded-none border-0 border-b border-border px-0 shadow-none focus-visible:ring-0"
        />
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={isPending}>
            {t("settings:company.skills.create.cancel")}
          </Button>
          <Button
            size="sm"
            onClick={() => onCreate({ name, slug: slug || null, description: description || null })}
            disabled={isPending || name.trim().length === 0}
          >
            {isPending ? t("settings:company.skills.create.creating") : t("settings:company.skills.create.button")}
          </Button>
        </div>
      </div>
    </div>
  );
}

function SkillTree({
  nodes,
  skillId,
  selectedPath,
  expandedDirs,
  onToggleDir,
  onSelectPath,
  depth = 0,
}: {
  nodes: SkillTreeNode[];
  skillId: string;
  selectedPath: string;
  expandedDirs: Set<string>;
  onToggleDir: (path: string) => void;
  onSelectPath: (path: string) => void;
  depth?: number;
}) {
  return (
    <div>
      {nodes.map((node) => {
        const expanded = node.kind === "dir" && node.path ? expandedDirs.has(node.path) : false;
        if (node.kind === "dir") {
          return (
            <div key={node.path ?? node.name}>
              <div
                className={cn(
                  "group grid w-full grid-cols-[minmax(0,1fr)_2.25rem] items-center gap-x-1 pr-3 text-left text-sm text-muted-foreground hover:bg-accent/30 hover:text-foreground",
                  SKILL_TREE_ROW_HEIGHT_CLASS,
                )}
              >
                <button
                  type="button"
                  className="flex min-w-0 items-center gap-2 py-1 text-left"
                  style={{ paddingLeft: `${SKILL_TREE_BASE_INDENT + depth * SKILL_TREE_STEP_INDENT}px` }}
                  onClick={() => node.path && onToggleDir(node.path)}
                >
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                    {expanded ? <FolderOpen className="h-3.5 w-3.5" /> : <Folder className="h-3.5 w-3.5" />}
                  </span>
                  <span className="truncate">{node.name}</span>
                </button>
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center self-center rounded-sm text-muted-foreground opacity-70 transition-[background-color,color,opacity] hover:bg-accent hover:text-foreground group-hover:opacity-100"
                  onClick={() => node.path && onToggleDir(node.path)}
                >
                  {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                </button>
              </div>
              {expanded && (
                <SkillTree
                  nodes={node.children}
                  skillId={skillId}
                  selectedPath={selectedPath}
                  expandedDirs={expandedDirs}
                  onToggleDir={onToggleDir}
                  onSelectPath={onSelectPath}
                  depth={depth + 1}
                />
              )}
            </div>
          );
        }

        const FileIcon = fileIcon(node.fileKind ?? "other");
        return (
          <Link
            key={node.path ?? node.name}
            className={cn(
              "flex w-full items-center gap-2 pr-3 text-left text-sm text-muted-foreground hover:bg-accent/30 hover:text-foreground",
              SKILL_TREE_ROW_HEIGHT_CLASS,
              node.path === selectedPath && "text-foreground",
            )}
            style={{ paddingInlineStart: `${SKILL_TREE_BASE_INDENT + depth * SKILL_TREE_STEP_INDENT}px` }}
            to={skillRoute(skillId, node.path)}
            onClick={() => node.path && onSelectPath(node.path)}
          >
            <span className="flex h-4 w-4 shrink-0 items-center justify-center">
              <FileIcon className="h-3.5 w-3.5" />
            </span>
            <span className="truncate">{node.name}</span>
          </Link>
        );
      })}
    </div>
  );
}

function SkillList({
  skills,
  selectedSkillId,
  skillFilter,
  expandedSkillId,
  expandedDirs,
  selectedPaths,
  onToggleSkill,
  onToggleDir,
  onSelectSkill,
  onSelectPath,
}: {
  skills: CompanySkillListItem[];
  selectedSkillId: string | null;
  skillFilter: string;
  expandedSkillId: string | null;
  expandedDirs: Record<string, Set<string>>;
  selectedPaths: Record<string, string>;
  onToggleSkill: (skillId: string) => void;
  onToggleDir: (skillId: string, path: string) => void;
  onSelectSkill: (skillId: string) => void;
  onSelectPath: (skillId: string, path: string) => void;
}) {
  const { t } = useTranslation(["settings"]);

  const filteredSkills = skills.filter((skill) => {
    const haystack = `${skill.name} ${skill.key} ${skill.slug} ${skill.sourceLabel ?? ""}`.toLowerCase();
    return haystack.includes(skillFilter.toLowerCase());
  });

  if (filteredSkills.length === 0) {
    return (
      <div className="px-4 py-6 text-sm text-muted-foreground">
        {t("settings:company.skills.empty")}
      </div>
    );
  }

  return (
    <div>
      {filteredSkills.map((skill) => {
        const expanded = expandedSkillId === skill.id;
        const tree = buildTree(skill.fileInventory);
        const source = sourceMeta(skill.sourceBadge, skill.sourceLabel, t);
        const SourceIcon = source.icon;

        return (
          <div key={skill.id} className="border-b border-border">
            <div
              className={cn(
                "group grid grid-cols-[minmax(0,1fr)_2.25rem] items-center gap-x-1 px-3 py-1.5 hover:bg-accent/30",
                skill.id === selectedSkillId && "text-foreground",
              )}
            >
              <Link
                to={skillRoute(skill.id)}
                className="flex min-w-0 items-center self-stretch pr-2 text-left no-underline"
                onClick={() => onSelectSkill(skill.id)}
              >
                <span className="flex min-w-0 items-center gap-2 self-center">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center text-muted-foreground opacity-75 transition-opacity group-hover:opacity-100">
                        <SourceIcon className="h-3.5 w-3.5" />
                        <span className="sr-only">{source.managedLabel}</span>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top">{source.managedLabel}</TooltipContent>
                  </Tooltip>
                  <span className="min-w-0 overflow-hidden text-[13px] font-medium leading-5 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3]">
                    {skill.name}
                  </span>
                </span>
              </Link>
              <button
                type="button"
                className="flex h-9 w-9 shrink-0 items-center justify-center self-center rounded-sm text-muted-foreground opacity-80 transition-[background-color,color,opacity] hover:bg-accent hover:text-foreground group-hover:opacity-100"
                onClick={() => onToggleSkill(skill.id)}
                aria-label={expanded ? t("settings:company.skills.collapseSkill", { name: skill.name }) : t("settings:company.skills.expandSkill", { name: skill.name })}
              >
                {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              </button>
            </div>
            <div
              aria-hidden={!expanded}
              className={cn(
                "grid overflow-hidden transition-[grid-template-rows,opacity] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
                expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="min-h-0 overflow-hidden">
                <SkillTree
                  nodes={tree}
                  skillId={skill.id}
                  selectedPath={selectedPaths[skill.id] ?? "SKILL.md"}
                  expandedDirs={expandedDirs[skill.id] ?? new Set<string>()}
                  onToggleDir={(path) => onToggleDir(skill.id, path)}
                  onSelectPath={(path) => onSelectPath(skill.id, path)}
                  depth={1}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SkillPane({
  loading,
  detail,
  file,
  fileLoading,
  updateStatus,
  updateStatusLoading,
  viewMode,
  editMode,
  draft,
  setViewMode,
  setEditMode,
  setDraft,
  onCheckUpdates,
  checkUpdatesPending,
  onInstallUpdate,
  installUpdatePending,
  onDelete,
  deletePending,
  onSave,
  savePending,
}: {
  loading: boolean;
  detail: CompanySkillDetail | null | undefined;
  file: CompanySkillFileDetail | null | undefined;
  fileLoading: boolean;
  updateStatus: CompanySkillUpdateStatus | null | undefined;
  updateStatusLoading: boolean;
  viewMode: "preview" | "code";
  editMode: boolean;
  draft: string;
  setViewMode: (mode: "preview" | "code") => void;
  setEditMode: (value: boolean) => void;
  setDraft: (value: string) => void;
  onCheckUpdates: () => void;
  checkUpdatesPending: boolean;
  onInstallUpdate: () => void;
  installUpdatePending: boolean;
  onDelete: () => void;
  deletePending: boolean;
  onSave: () => void;
  savePending: boolean;
}) {
  const { t } = useTranslation(["settings"]);
  const { pushToast } = useToastActions();

  if (!detail) {
    if (loading) {
      return <PageSkeleton variant="detail" />;
    }
    return (
      <EmptyState
        icon={Boxes}
        message={t("settings:company.skills.selectSkill")}
      />
    );
  }

  const source = sourceMeta(detail.sourceBadge, detail.sourceLabel, t);
  const SourceIcon = source.icon;
  const usedBy = detail.usedByAgents;
  const body = file?.markdown ? stripFrontmatter(file.content) : file?.content ?? "";
  const currentPin = shortRef(detail.sourceRef);
  const latestPin = shortRef(updateStatus?.latestRef);
  const removeBlocked = usedBy.length > 0;
  const removeDisabledReason = removeBlocked
    ? t("settings:company.skills.detail.detachFirst")
    : null;

  return (
    <div className="min-w-0">
      <div className="border-b border-border px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 truncate text-2xl font-semibold">
              <SourceIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
              {detail.name}
            </h1>
            {detail.description && (
              <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{detail.description}</p>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              disabled={deletePending}
              title={removeDisabledReason ?? undefined}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              {deletePending ? t("settings:company.skills.detail.removing") : t("settings:company.skills.detail.remove")}
            </Button>
            {detail.editable ? (
              <button
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                onClick={() => setEditMode(!editMode)}
              >
                <Pencil className="h-3.5 w-3.5" />
                {editMode ? t("settings:company.skills.detail.stopEditing") : t("settings:company.skills.detail.edit")}
              </button>
            ) : (
              <div className="text-sm text-muted-foreground">{detail.editableReason}</div>
            )}
          </div>
        </div>

        <div className="mt-4 space-y-3 border-t border-border pt-4 text-sm">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{t("settings:company.skills.detail.source")}</span>
              <span className="flex items-center gap-2">
                <SourceIcon className="h-3.5 w-3.5 text-muted-foreground" />
                {detail.sourcePath ? (
                  <button
                    className="truncate hover:text-foreground text-muted-foreground transition-colors cursor-pointer"
                    onClick={() => {
                      navigator.clipboard.writeText(detail.sourcePath!);
                      pushToast({ title: t("settings:company.skills.toasts.copiedPath") });
                    }}
                  >
                    {source.label}
                  </button>
                ) : (
                  <span className="truncate">{source.label}</span>
                )}
              </span>
            </div>
            {detail.sourceType === "github" && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{t("settings:company.skills.detail.pin")}</span>
                <span className="font-mono text-xs">{currentPin ?? t("settings:company.skills.detail.untracked")}</span>
                {updateStatus?.trackingRef && (
                  <span className="text-xs text-muted-foreground">{t("settings:company.skills.detail.tracking", { ref: updateStatus.trackingRef })}</span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onCheckUpdates}
                  disabled={checkUpdatesPending || updateStatusLoading}
                >
                  <RefreshCw className={cn("mr-1.5 h-3.5 w-3.5", (checkUpdatesPending || updateStatusLoading) && "animate-spin")} />
                  {t("settings:company.skills.detail.checkUpdates")}
                </Button>
                {updateStatus?.supported && updateStatus.hasUpdate && (
                  <Button
                    size="sm"
                    onClick={onInstallUpdate}
                    disabled={installUpdatePending}
                  >
                    <RefreshCw className={cn("mr-1.5 h-3.5 w-3.5", installUpdatePending && "animate-spin")} />
                    {t("settings:company.skills.detail.installUpdate", { ref: latestPin ?? "" })}
                  </Button>
                )}
                {updateStatus?.supported && !updateStatus.hasUpdate && !updateStatusLoading && (
                  <span className="text-xs text-muted-foreground">{t("settings:company.skills.detail.upToDate")}</span>
                )}
                {!updateStatus?.supported && updateStatus?.reason && (
                  <span className="text-xs text-muted-foreground">{updateStatus.reason}</span>
                )}
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{t("settings:company.skills.detail.key")}</span>
              <span className="font-mono text-xs">{detail.key}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{t("settings:company.skills.detail.mode")}</span>
              <span>{detail.editable ? t("settings:company.skills.detail.editable") : t("settings:company.skills.detail.readOnly")}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-start gap-x-3 gap-y-1">
            <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{t("settings:company.skills.detail.usedBy")}</span>
            {usedBy.length === 0 ? (
              <span className="text-muted-foreground">{t("settings:company.skills.detail.noAgents")}</span>
            ) : (
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {usedBy.map((agent) => (
                  <Link
                    key={agent.id}
                    to={`/agents/${agent.urlKey}/skills`}
                    className="text-foreground no-underline hover:underline"
                  >
                    {agent.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border-b border-border px-5 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate font-mono text-sm">{file?.path ?? "SKILL.md"}</div>
          </div>
          <div className="flex items-center gap-2">
            {file?.markdown && !editMode && (
              <div className="flex items-center border border-border">
                <button
                  className={cn("px-3 py-1.5 text-sm", viewMode === "preview" && "text-foreground", viewMode !== "preview" && "text-muted-foreground")}
                  onClick={() => setViewMode("preview")}
                >
                  <span className="flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5" />
                    {t("settings:company.skills.detail.view")}
                  </span>
                </button>
                <button
                  className={cn("border-l border-border px-3 py-1.5 text-sm", viewMode === "code" && "text-foreground", viewMode !== "code" && "text-muted-foreground")}
                  onClick={() => setViewMode("code")}
                >
                  <span className="flex items-center gap-1.5">
                    <Code2 className="h-3.5 w-3.5" />
                    {t("settings:company.skills.detail.code")}
                  </span>
                </button>
              </div>
            )}
            {editMode && file?.editable && (
              <>
                <Button variant="ghost" size="sm" onClick={() => setEditMode(false)} disabled={savePending}>
                  {t("settings:company.skills.detail.cancel")}
                </Button>
                <Button size="sm" onClick={onSave} disabled={savePending}>
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                  {savePending ? t("settings:company.skills.detail.saving") : t("settings:company.skills.detail.save")}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="min-h-[560px] px-5 py-5">
        {fileLoading ? (
          <PageSkeleton variant="detail" />
        ) : !file ? (
          <div className="text-sm text-muted-foreground">{t("settings:company.skills.detail.selectFile")}</div>
        ) : editMode && file.editable ? (
          file.markdown ? (
            <MarkdownEditor
              value={draft}
              onChange={setDraft}
              bordered={false}
              className="min-h-[520px]"
            />
          ) : (
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className="min-h-[520px] rounded-none border-0 bg-transparent px-0 py-0 font-mono text-sm shadow-none focus-visible:ring-0"
            />
          )
        ) : file.markdown && viewMode === "preview" ? (
          <MarkdownBody softBreaks={false} linkIssueReferences={false}>{body}</MarkdownBody>
        ) : (
          <pre className="overflow-x-auto whitespace-pre-wrap wrap-break-word border-0 bg-transparent p-0 font-mono text-sm text-foreground">
            <code>{file.content}</code>
          </pre>
        )}
      </div>
    </div>
  );
}

export function CompanySkills() {
  const { "*": routePath } = useParams<{ "*": string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { selectedCompanyId } = useCompany();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { pushToast } = useToastActions();
  const { t } = useTranslation(["settings"]);
  const [skillFilter, setSkillFilter] = useState("");
  const [source, setSource] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [emptySourceHelpOpen, setEmptySourceHelpOpen] = useState(false);
  const [expandedSkillId, setExpandedSkillId] = useState<string | null>(null);
  const [expandedDirs, setExpandedDirs] = useState<Record<string, Set<string>>>({});
  const [viewMode, setViewMode] = useState<"preview" | "code">("preview");
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState("");
  const [displayedDetail, setDisplayedDetail] = useState<CompanySkillDetail | null>(null);
  const [displayedFile, setDisplayedFile] = useState<CompanySkillFileDetail | null>(null);
  const [scanStatusMessage, setScanStatusMessage] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTargetSkillId, setDeleteTargetSkillId] = useState<string | null>(null);
  const [deleteTargetDetail, setDeleteTargetDetail] = useState<CompanySkillDetail | null>(null);
  const parsedRoute = useMemo(() => parseSkillRoute(routePath), [routePath]);
  const routeSkillId = parsedRoute.skillId;
  const selectedPath = parsedRoute.filePath;

  useEffect(() => {
    setBreadcrumbs([
      { label: t("settings:company.settings.breadcrumb"), href: "/settings" },
      { label: t("settings:company.skills.breadcrumb"), href: "/skills" },
      ...(routeSkillId ? [{ label: t("settings:company.skills.detailBreadcrumb") }] : []),
    ]);
  }, [routeSkillId, setBreadcrumbs, t]);

  const skillsQuery = useQuery({
    queryKey: queryKeys.companySkills.list(selectedCompanyId ?? ""),
    queryFn: () => companySkillsApi.list(selectedCompanyId!),
    enabled: Boolean(selectedCompanyId),
  });

  const selectedSkillId = useMemo(() => {
    if (!routeSkillId) return skillsQuery.data?.[0]?.id ?? null;
    return routeSkillId;
  }, [routeSkillId, skillsQuery.data]);

  useEffect(() => {
    if (routeSkillId || !selectedSkillId) return;
    navigate(skillRoute(selectedSkillId), { replace: true });
  }, [navigate, routeSkillId, selectedSkillId]);

  const detailQuery = useQuery({
    queryKey: queryKeys.companySkills.detail(selectedCompanyId ?? "", selectedSkillId ?? ""),
    queryFn: () => companySkillsApi.detail(selectedCompanyId!, selectedSkillId!),
    enabled: Boolean(selectedCompanyId && selectedSkillId),
  });

  const fileQuery = useQuery({
    queryKey: queryKeys.companySkills.file(selectedCompanyId ?? "", selectedSkillId ?? "", selectedPath),
    queryFn: () => companySkillsApi.file(selectedCompanyId!, selectedSkillId!, selectedPath),
    enabled: Boolean(selectedCompanyId && selectedSkillId && selectedPath),
  });

  const updateStatusQuery = useQuery({
    queryKey: queryKeys.companySkills.updateStatus(selectedCompanyId ?? "", selectedSkillId ?? ""),
    queryFn: () => companySkillsApi.updateStatus(selectedCompanyId!, selectedSkillId!),
    enabled: Boolean(
      selectedCompanyId
      && selectedSkillId
      && (detailQuery.data?.sourceType === "github" || displayedDetail?.sourceType === "github"),
    ),
    staleTime: 60_000,
  });

  useEffect(() => {
    setExpandedSkillId(selectedSkillId);
  }, [selectedSkillId]);

  useEffect(() => {
    if (!selectedSkillId || selectedPath === "SKILL.md") return;
    const parents = parentDirectoryPaths(selectedPath);
    if (parents.length === 0) return;
    setExpandedDirs((current) => {
      const next = new Set(current[selectedSkillId] ?? []);
      let changed = false;
      for (const parent of parents) {
        if (!next.has(parent)) {
          next.add(parent);
          changed = true;
        }
      }
      return changed ? { ...current, [selectedSkillId]: next } : current;
    });
  }, [selectedPath, selectedSkillId]);

  useEffect(() => {
    setEditMode(false);
  }, [selectedSkillId, selectedPath]);

  useEffect(() => {
    if (detailQuery.data) {
      setDisplayedDetail(detailQuery.data);
    }
  }, [detailQuery.data]);

  useEffect(() => {
    if (fileQuery.data) {
      setDisplayedFile(fileQuery.data);
      setDraft(fileQuery.data.markdown ? splitFrontmatter(fileQuery.data.content).body : fileQuery.data.content);
    }
  }, [fileQuery.data]);

  useEffect(() => {
    if (selectedSkillId) return;
    setDisplayedDetail(null);
    setDisplayedFile(null);
  }, [selectedSkillId]);

  const activeDetail = detailQuery.data ?? displayedDetail;
  const activeFile = fileQuery.data ?? displayedFile;

  function openDeleteDialog() {
    setDeleteTargetSkillId(selectedSkillId);
    setDeleteTargetDetail(activeDetail ?? null);
    setDeleteOpen(true);
  }

  function closeDeleteDialog(open: boolean) {
    setDeleteOpen(open);
    if (!open) {
      setDeleteTargetSkillId(null);
      setDeleteTargetDetail(null);
    }
  }

  const importSkill = useMutation({
    mutationFn: (importSource: string) => companySkillsApi.importFromSource(selectedCompanyId!, importSource),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.companySkills.list(selectedCompanyId!) });
      if (result.imported[0]) navigate(skillRoute(result.imported[0].id));
      pushToast({
        tone: "success",
        title: t("settings:company.skills.toasts.importedSuccess"),
        body: t("settings:company.skills.toasts.importedBody", { count: result.imported.length }),
      });
      if (result.warnings[0]) {
        pushToast({ tone: "warn", title: t("settings:company.skills.toasts.importWarnings"), body: result.warnings[0] });
      }
      setSource("");
    },
    onError: (error) => {
      pushToast({
        tone: "error",
        title: t("settings:company.skills.toasts.importFailed"),
        body: error instanceof Error ? error.message : t("settings:company.skills.toasts.importErrorBody"),
      });
    },
  });

  const createSkill = useMutation({
    mutationFn: (payload: CompanySkillCreateRequest) => companySkillsApi.create(selectedCompanyId!, payload),
    onSuccess: async (skill) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.companySkills.list(selectedCompanyId!) });
      navigate(skillRoute(skill.id));
      setCreateOpen(false);
      pushToast({
        tone: "success",
        title: t("settings:company.skills.toasts.createdSuccess"),
        body: t("settings:company.skills.toasts.createdBody", { name: skill.name }),
      });
    },
    onError: (error) => {
      pushToast({
        tone: "error",
        title: t("settings:company.skills.toasts.createFailed"),
        body: error instanceof Error ? error.message : t("settings:company.skills.toasts.createErrorBody"),
      });
    },
  });

  const scanProjects = useMutation({
    mutationFn: () => companySkillsApi.scanProjects(selectedCompanyId!),
    onMutate: () => {
      setScanStatusMessage(t("settings:company.skills.toasts.scanMutating"));
    },
    onSuccess: async (result) => {
      setScanStatusMessage(t("settings:company.skills.toasts.scanRefreshing"));
      await queryClient.invalidateQueries({ queryKey: queryKeys.companySkills.list(selectedCompanyId!) });
      const summary = formatProjectScanSummary(result, t);
      setScanStatusMessage(summary);
      pushToast({
        tone: "success",
        title: t("settings:company.skills.toasts.scanComplete"),
        body: summary,
      });
      if (result.conflicts[0]) {
        pushToast({
          tone: "warn",
          title: t("settings:company.skills.toasts.conflictsFound"),
          body: result.conflicts[0].reason,
        });
      } else if (result.warnings[0]) {
        pushToast({
          tone: "warn",
          title: t("settings:company.skills.toasts.scanWarnings"),
          body: result.warnings[0],
        });
      }
    },
    onError: (error) => {
      setScanStatusMessage(null);
      pushToast({
        tone: "error",
        title: t("settings:company.skills.toasts.scanFailed"),
        body: error instanceof Error ? error.message : t("settings:company.skills.toasts.scanErrorBody"),
      });
    },
  });

  const saveFile = useMutation({
    mutationFn: () => companySkillsApi.updateFile(
      selectedCompanyId!,
      selectedSkillId!,
      selectedPath,
      activeFile?.markdown ? mergeFrontmatter(activeFile.content, draft) : draft,
    ),
    onSuccess: async (result) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.companySkills.list(selectedCompanyId!) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.companySkills.detail(selectedCompanyId!, selectedSkillId!) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.companySkills.file(selectedCompanyId!, selectedSkillId!, selectedPath) }),
      ]);
      setDraft(result.markdown ? splitFrontmatter(result.content).body : result.content);
      setEditMode(false);
      pushToast({
        tone: "success",
        title: t("settings:company.skills.toasts.saveSuccess"),
        body: result.path,
      });
    },
    onError: (error) => {
      pushToast({
        tone: "error",
        title: t("settings:company.skills.toasts.saveFailed"),
        body: error instanceof Error ? error.message : t("settings:company.skills.toasts.saveErrorBody"),
      });
    },
  });

  const installUpdate = useMutation({
    mutationFn: () => companySkillsApi.installUpdate(selectedCompanyId!, selectedSkillId!),
    onSuccess: async (skill) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.companySkills.list(selectedCompanyId!) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.companySkills.detail(selectedCompanyId!, selectedSkillId!) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.companySkills.updateStatus(selectedCompanyId!, selectedSkillId!) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.companySkills.file(selectedCompanyId!, selectedSkillId!, selectedPath) }),
      ]);
      navigate(skillRoute(skill.id, selectedPath));
      pushToast({
        tone: "success",
        title: t("settings:company.skills.toasts.updateSuccess"),
        body: skill.sourceRef
          ? t("settings:company.skills.toasts.updateSuccessBody", { ref: shortRef(skill.sourceRef) })
          : skill.name,
      });
    },
    onError: (error) => {
      pushToast({
        tone: "error",
        title: t("settings:company.skills.toasts.updateFailed"),
        body: error instanceof Error ? error.message : t("settings:company.skills.toasts.updateErrorBody"),
      });
    },
  });

  const deleteSkill = useMutation({
    mutationFn: () => companySkillsApi.delete(selectedCompanyId!, deleteTargetSkillId!),
    onSuccess: async (skill) => {
      closeDeleteDialog(false);
      setDisplayedDetail(null);
      setDisplayedFile(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.companySkills.list(selectedCompanyId!) }),
        ...(deleteTargetSkillId ? [
          queryClient.invalidateQueries({ queryKey: queryKeys.companySkills.detail(selectedCompanyId!, deleteTargetSkillId) }),
          queryClient.invalidateQueries({ queryKey: queryKeys.companySkills.updateStatus(selectedCompanyId!, deleteTargetSkillId) }),
        ] : []),
        ...(deleteTargetSkillId ? [
          queryClient.invalidateQueries({
            queryKey: queryKeys.companySkills.file(selectedCompanyId!, deleteTargetSkillId, selectedPath),
          }),
        ] : []),
      ]);
      await queryClient.refetchQueries({
        queryKey: queryKeys.companySkills.list(selectedCompanyId!),
        type: "active",
      });
      navigate("/skills", { replace: true });
      pushToast({
        tone: "success",
        title: t("settings:company.skills.toasts.removeSuccess"),
        body: t("settings:company.skills.toasts.removeSuccessBody", { name: skill.name }),
      });
    },
    onError: (error) => {
      pushToast({
        tone: "error",
        title: t("settings:company.skills.toasts.removeFailed"),
        body: error instanceof Error ? error.message : t("settings:company.skills.toasts.removeErrorBody"),
      });
    },
  });

  if (!selectedCompanyId) {
    return <EmptyState icon={Boxes} message={t("settings:company.skills.noCompany")} />;
  }

  function handleAddSkillSource() {
    const trimmedSource = source.trim();
    if (trimmedSource.length === 0) {
      setEmptySourceHelpOpen(true);
      return;
    }
    importSkill.mutate(trimmedSource);
  }

  return (
    <>
      <Dialog open={deleteOpen} onOpenChange={closeDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("settings:company.skills.delete.title")}</DialogTitle>
            <DialogDescription>
              {t("settings:company.skills.delete.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p>
              {deleteTargetDetail
                ? t("settings:company.skills.delete.aboutToRemove", { name: deleteTargetDetail.name })
                : t("settings:company.skills.delete.aboutToRemoveGeneric")}
            </p>
            {deleteTargetDetail?.usedByAgents?.length ? (
              <div className="rounded-md border border-border px-3 py-3 text-muted-foreground">
                {t("settings:company.skills.delete.usedBy", {
                  agents: deleteTargetDetail.usedByAgents.map((agent) => agent.name).join(", "),
                })}
              </div>
            ) : null}
            {(deleteTargetDetail?.usedByAgents.length ?? 0) > 0 ? (
              <p className="text-muted-foreground">
                {t("settings:company.skills.delete.detachFirst")}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            {(deleteTargetDetail?.usedByAgents.length ?? 0) > 0 ? (
              <Button variant="ghost" onClick={() => closeDeleteDialog(false)}>
                {t("settings:company.skills.delete.close")}
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => closeDeleteDialog(false)} disabled={deleteSkill.isPending}>
                  {t("settings:company.skills.delete.cancel")}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => deleteSkill.mutate()}
                  disabled={deleteSkill.isPending || !deleteTargetSkillId}
                >
                  {deleteSkill.isPending ? t("settings:company.skills.delete.removing") : t("settings:company.skills.delete.remove")}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={emptySourceHelpOpen} onOpenChange={setEmptySourceHelpOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("settings:company.skills.sourceHelp.title")}</DialogTitle>
            <DialogDescription>
              {t("settings:company.skills.sourceHelp.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <a
              href="https://skills.sh"
              target="_blank"
              rel="noreferrer"
              className="flex items-start justify-between rounded-md border border-border px-3 py-3 text-foreground no-underline transition-colors hover:bg-accent/40"
            >
              <span>
                <span className="block font-medium">{t("settings:company.skills.sourceHelp.browseSkillsSh")}</span>
                <span className="mt-1 block text-muted-foreground">
                  {t("settings:company.skills.sourceHelp.browseSkillsShDesc")}
                </span>
              </span>
              <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            </a>
            <a
              href="https://github.com/search?q=SKILL.md&type=code"
              target="_blank"
              rel="noreferrer"
              className="flex items-start justify-between rounded-md border border-border px-3 py-3 text-foreground no-underline transition-colors hover:bg-accent/40"
            >
              <span>
                <span className="block font-medium">{t("settings:company.skills.sourceHelp.searchGithub")}</span>
                <span className="mt-1 block text-muted-foreground">
                  {t("settings:company.skills.sourceHelp.searchGithubDesc")}
                </span>
              </span>
              <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            </a>
          </div>
          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>

      <div className="grid min-h-[calc(100vh-12rem)] gap-0 xl:grid-cols-[19rem_minmax(0,1fr)]">
        <aside className="border-r border-border">
          <div className="border-b border-border px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h1 className="text-base font-semibold">{t("settings:company.skills.title")}</h1>
                <p className="text-xs text-muted-foreground">
                  {t("settings:company.skills.available", { count: skillsQuery.data?.length ?? 0 })}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => scanProjects.mutate()}
                  disabled={scanProjects.isPending}
                  title={t("settings:company.skills.scanTooltip")}
                >
                  <RefreshCw className={cn("h-4 w-4", scanProjects.isPending && "animate-spin")} />
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={() => setCreateOpen((value) => !value)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2 border-b border-border pb-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={skillFilter}
                onChange={(event) => setSkillFilter(event.target.value)}
                placeholder={t("settings:company.skills.filterPlaceholder")}
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>

            <div className="mt-3 flex items-center gap-2 border-b border-border pb-2">
              <input
                value={source}
                onChange={(event) => setSource(event.target.value)}
                placeholder={t("settings:company.skills.addSourcePlaceholder")}
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={handleAddSkillSource}
                disabled={importSkill.isPending}
              >
                {importSkill.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : t("settings:company.skills.addButton")}
              </Button>
            </div>
            {scanStatusMessage && (
              <p className="mt-3 text-xs text-muted-foreground">
                {scanStatusMessage}
              </p>
            )}
          </div>

          {createOpen && (
            <NewSkillForm
              onCreate={(payload) => createSkill.mutate(payload)}
              isPending={createSkill.isPending}
              onCancel={() => setCreateOpen(false)}
            />
          )}

          {skillsQuery.isLoading ? (
            <PageSkeleton variant="list" />
          ) : skillsQuery.error ? (
            <div className="px-4 py-6 text-sm text-destructive">{skillsQuery.error.message}</div>
          ) : (
            <SkillList
              skills={skillsQuery.data ?? []}
              selectedSkillId={selectedSkillId}
              skillFilter={skillFilter}
              expandedSkillId={expandedSkillId}
              expandedDirs={expandedDirs}
              selectedPaths={selectedSkillId ? { [selectedSkillId]: selectedPath } : {}}
              onToggleSkill={(currentSkillId) =>
                setExpandedSkillId((current) => current === currentSkillId ? null : currentSkillId)
              }
              onToggleDir={(currentSkillId, path) => {
                setExpandedDirs((current) => {
                  const next = new Set(current[currentSkillId] ?? []);
                  if (next.has(path)) next.delete(path);
                  else next.add(path);
                  return { ...current, [currentSkillId]: next };
                });
              }}
              onSelectSkill={(currentSkillId) => setExpandedSkillId(currentSkillId)}
              onSelectPath={() => {}}
            />
          )}
        </aside>

        <div className="min-w-0 pl-6">
          <SkillPane
            loading={skillsQuery.isLoading || detailQuery.isLoading}
            detail={activeDetail}
            file={activeFile}
            fileLoading={fileQuery.isLoading && !activeFile}
            updateStatus={updateStatusQuery.data}
            updateStatusLoading={updateStatusQuery.isLoading}
            viewMode={viewMode}
            editMode={editMode}
            draft={draft}
            setViewMode={setViewMode}
            setEditMode={setEditMode}
            setDraft={setDraft}
            onCheckUpdates={() => {
              void updateStatusQuery.refetch();
            }}
            checkUpdatesPending={updateStatusQuery.isFetching}
            onInstallUpdate={() => installUpdate.mutate()}
            installUpdatePending={installUpdate.isPending}
            onDelete={openDeleteDialog}
            deletePending={deleteSkill.isPending}
            onSave={() => saveFile.mutate()}
            savePending={saveFile.isPending}
          />
        </div>
      </div>
    </>
  );
}
