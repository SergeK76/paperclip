import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HUMAN_COMPANY_MEMBERSHIP_ROLE_LABELS, PERMISSION_KEYS, type PermissionKey } from "@paperclipai/shared";
import { ShieldCheck, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { accessApi, type CompanyMember } from "@/api/access";
import { ApiError } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useBreadcrumbs } from "@/context/BreadcrumbContext";
import { useCompany } from "@/context/CompanyContext";
import { useToast } from "@/context/ToastContext";
import { queryKeys } from "@/lib/queryKeys";

function formatGrantSummary(member: CompanyMember, labels: Record<PermissionKey, string>, noGrantsLabel: string) {
  if (member.grants.length === 0) return noGrantsLabel;
  return member.grants.map((grant) => labels[grant.permissionKey]).join(", ");
}

const implicitRoleGrantMap: Record<NonNullable<CompanyMember["membershipRole"]>, PermissionKey[]> = {
  owner: ["agents:create", "users:invite", "users:manage_permissions", "tasks:assign", "joins:approve"],
  admin: ["agents:create", "users:invite", "tasks:assign", "joins:approve"],
  operator: ["tasks:assign"],
  viewer: [],
};

function getImplicitGrantKeys(role: CompanyMember["membershipRole"]) {
  return role ? implicitRoleGrantMap[role] : [];
}

export function CompanyAccess() {
  const { t } = useTranslation(["settings"]);
  const { selectedCompany, selectedCompanyId } = useCompany();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { pushToast } = useToast();

  const permissionLabels: Record<PermissionKey, string> = {
    "agents:create": t("settings:company.access.permissions.agentsCreate"),
    "users:invite": t("settings:company.access.permissions.usersInvite"),
    "users:manage_permissions": t("settings:company.access.permissions.usersManagePermissions"),
    "tasks:assign": t("settings:company.access.permissions.tasksAssign"),
    "tasks:assign_scope": t("settings:company.access.permissions.tasksAssignScope"),
    "joins:approve": t("settings:company.access.permissions.joinsApprove"),
  };
  const queryClient = useQueryClient();
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [draftRole, setDraftRole] = useState<CompanyMember["membershipRole"]>(null);
  const [draftStatus, setDraftStatus] = useState<CompanyMember["status"]>("active");
  const [draftGrants, setDraftGrants] = useState<Set<PermissionKey>>(new Set());

  useEffect(() => {
    setBreadcrumbs([
      { label: selectedCompany?.name ?? "Company", href: "/dashboard" },
      { label: t("settings:company.settings.breadcrumb"), href: "/company/settings" },
      { label: t("settings:company.access.breadcrumb") },
    ]);
  }, [selectedCompany?.name, setBreadcrumbs, t]);

  const membersQuery = useQuery({
    queryKey: queryKeys.access.companyMembers(selectedCompanyId ?? ""),
    queryFn: () => accessApi.listMembers(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });

  const joinRequestsQuery = useQuery({
    queryKey: queryKeys.access.joinRequests(selectedCompanyId ?? "", "pending_approval"),
    queryFn: () => accessApi.listJoinRequests(selectedCompanyId!, "pending_approval"),
    enabled: !!selectedCompanyId && !!membersQuery.data?.access.canApproveJoinRequests,
  });

  const refreshAccessData = async () => {
    if (!selectedCompanyId) return;
    await queryClient.invalidateQueries({ queryKey: queryKeys.access.companyMembers(selectedCompanyId) });
    await queryClient.invalidateQueries({ queryKey: queryKeys.access.companyUserDirectory(selectedCompanyId) });
    await queryClient.invalidateQueries({ queryKey: queryKeys.access.joinRequests(selectedCompanyId, "pending_approval") });
  };

  const updateMemberMutation = useMutation({
    mutationFn: async (input: { memberId: string; membershipRole: CompanyMember["membershipRole"]; status: CompanyMember["status"]; grants: PermissionKey[] }) => {
      return accessApi.updateMemberAccess(selectedCompanyId!, input.memberId, {
        membershipRole: input.membershipRole,
        status: input.status,
        grants: input.grants.map((permissionKey) => ({ permissionKey })),
      });
    },
    onSuccess: async () => {
      setEditingMemberId(null);
      await refreshAccessData();
      pushToast({
        title: t("settings:company.access.toasts.memberUpdated"),
        tone: "success",
      });
    },
    onError: (error) => {
      pushToast({
        title: t("settings:company.access.toasts.updateFailed"),
        body: error instanceof Error ? error.message : "Unknown error",
        tone: "error",
      });
    },
  });

  const approveJoinRequestMutation = useMutation({
    mutationFn: (requestId: string) => accessApi.approveJoinRequest(selectedCompanyId!, requestId),
    onSuccess: async () => {
      await refreshAccessData();
      pushToast({
        title: t("settings:company.access.toasts.joinApproved"),
        tone: "success",
      });
    },
    onError: (error) => {
      pushToast({
        title: t("settings:company.access.toasts.joinApproveFailed"),
        body: error instanceof Error ? error.message : "Unknown error",
        tone: "error",
      });
    },
  });

  const rejectJoinRequestMutation = useMutation({
    mutationFn: (requestId: string) => accessApi.rejectJoinRequest(selectedCompanyId!, requestId),
    onSuccess: async () => {
      await refreshAccessData();
      pushToast({
        title: t("settings:company.access.toasts.joinRejected"),
        tone: "success",
      });
    },
    onError: (error) => {
      pushToast({
        title: t("settings:company.access.toasts.joinRejectFailed"),
        body: error instanceof Error ? error.message : "Unknown error",
        tone: "error",
      });
    },
  });

  const editingMember = useMemo(
    () => membersQuery.data?.members.find((member) => member.id === editingMemberId) ?? null,
    [editingMemberId, membersQuery.data?.members],
  );

  useEffect(() => {
    if (!editingMember) return;
    setDraftRole(editingMember.membershipRole);
    setDraftStatus(editingMember.status);
    setDraftGrants(new Set(editingMember.grants.map((grant) => grant.permissionKey)));
  }, [editingMember]);

  if (!selectedCompanyId) {
    return <div className="text-sm text-muted-foreground">{t("settings:company.access.noCompany")}</div>;
  }

  if (membersQuery.isLoading) {
    return <div className="text-sm text-muted-foreground">{t("settings:company.access.loading")}</div>;
  }

  if (membersQuery.error) {
    const message =
      membersQuery.error instanceof ApiError && membersQuery.error.status === 403
        ? t("settings:company.access.permissionDenied")
        : membersQuery.error instanceof Error
          ? membersQuery.error.message
          : t("settings:company.access.loadFailed");
    return <div className="text-sm text-destructive">{message}</div>;
  }

  const members = membersQuery.data?.members ?? [];
  const access = membersQuery.data?.access;
  const pendingHumanJoinRequests =
    joinRequestsQuery.data?.filter((request) => request.requestType === "human") ?? [];
  const joinRequestActionPending =
    approveJoinRequestMutation.isPending || rejectJoinRequestMutation.isPending;
  const implicitGrantKeys = getImplicitGrantKeys(draftRole);
  const implicitGrantSet = new Set(implicitGrantKeys);

  return (
    <div className="max-w-6xl space-y-8">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-lg font-semibold">{t("settings:company.access.title")}</h1>
        </div>
        <p className="max-w-3xl text-sm text-muted-foreground">
          {t("settings:company.access.description", { company: selectedCompany?.name })}
        </p>
      </div>

      {access && !access.currentUserRole && (
        <div className="rounded-xl border border-amber-500/40 px-4 py-3 text-sm text-amber-200">
          {t("settings:company.access.instanceAdminNote")}
        </div>
      )}

      <section className="space-y-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-base font-semibold">{t("settings:company.access.humans.title")}</h2>
          </div>
          <p className="max-w-3xl text-sm text-muted-foreground">
            {t("settings:company.access.humans.description")}
          </p>
        </div>

        {access?.canApproveJoinRequests && pendingHumanJoinRequests.length > 0 ? (
          <div className="space-y-3 rounded-xl border border-border px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold">{t("settings:company.access.pendingJoins.title")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("settings:company.access.pendingJoins.description")}
                </p>
              </div>
              <Badge variant="outline">{t("settings:company.access.pendingJoins.badge", { count: pendingHumanJoinRequests.length })}</Badge>
            </div>
            <div className="space-y-3">
              {pendingHumanJoinRequests.map((request) => (
                <PendingJoinRequestCard
                  key={request.id}
                  title={
                    request.requesterUser?.name ||
                    request.requestEmailSnapshot ||
                    request.requestingUserId ||
                    t("settings:company.access.pendingJoins.unknownRequester")
                  }
                  subtitle={
                    request.requesterUser?.email ||
                    request.requestEmailSnapshot ||
                    request.requestingUserId ||
                    t("settings:company.access.pendingJoins.noEmail")
                  }
                  context={
                    request.invite
                      ? `${request.invite.allowedJoinTypes} join invite${request.invite.humanRole ? ` • default role ${request.invite.humanRole}` : ""}`
                      : t("settings:company.access.pendingJoins.inviteUnavailable")
                  }
                  detail={`Submitted ${new Date(request.createdAt).toLocaleString()}`}
                  approveLabel={t("settings:company.access.pendingJoins.approveLabel")}
                  rejectLabel={t("settings:company.access.pendingJoins.rejectLabel")}
                  disabled={joinRequestActionPending}
                  onApprove={() => approveJoinRequestMutation.mutate(request.id)}
                  onReject={() => rejectJoinRequestMutation.mutate(request.id)}
                />
              ))}
            </div>
          </div>
        ) : null}

        <div className="overflow-hidden rounded-xl border border-border">
          <div className="grid grid-cols-[minmax(0,1.5fr)_120px_120px_minmax(0,1.2fr)_120px] gap-3 border-b border-border px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <div>{t("settings:company.access.table.userAccount")}</div>
            <div>{t("settings:company.access.table.role")}</div>
            <div>{t("settings:company.access.table.status")}</div>
            <div>{t("settings:company.access.table.grants")}</div>
            <div className="text-right">{t("settings:company.access.table.action")}</div>
          </div>
          {members.length === 0 ? (
            <div className="px-4 py-8 text-sm text-muted-foreground">{t("settings:company.access.table.noMembers")}</div>
          ) : (
            members.map((member) => (
              <div
                key={member.id}
                className="grid grid-cols-[minmax(0,1.5fr)_120px_120px_minmax(0,1.2fr)_120px] gap-3 border-b border-border px-4 py-3 last:border-b-0"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{member.user?.name?.trim() || member.user?.email || member.principalId}</div>
                  <div className="truncate text-xs text-muted-foreground">{member.user?.email || member.principalId}</div>
                </div>
                <div className="text-sm">
                  {member.membershipRole
                    ? HUMAN_COMPANY_MEMBERSHIP_ROLE_LABELS[member.membershipRole]
                    : t("settings:company.access.table.unset")}
                </div>
                <div>
                  <Badge variant={member.status === "active" ? "secondary" : member.status === "suspended" ? "destructive" : "outline"}>
                    {member.status.replace("_", " ")}
                  </Badge>
                </div>
                <div className="min-w-0 text-sm text-muted-foreground">{formatGrantSummary(member, permissionLabels, t("settings:company.access.permissions.noExplicitGrants"))}</div>
                <div className="text-right">
                  <Button size="sm" variant="outline" onClick={() => setEditingMemberId(member.id)}>
                    {t("settings:company.access.table.edit")}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <Dialog open={!!editingMember} onOpenChange={(open) => !open && setEditingMemberId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("settings:company.access.dialog.title")}</DialogTitle>
            <DialogDescription>
              {t("settings:company.access.dialog.description", { name: editingMember?.user?.name || editingMember?.user?.email || editingMember?.principalId })}
            </DialogDescription>
          </DialogHeader>
          {editingMember && (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm">
                  <span className="font-medium">{t("settings:company.access.dialog.companyRole")}</span>
                  <select
                    className="w-full rounded-md border border-border bg-background px-3 py-2"
                    value={draftRole ?? ""}
                    onChange={(event) =>
                      setDraftRole((event.target.value || null) as CompanyMember["membershipRole"])
                    }
                  >
                    <option value="">{t("settings:company.access.dialog.unsetOption")}</option>
                    {Object.entries(HUMAN_COMPANY_MEMBERSHIP_ROLE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2 text-sm">
                  <span className="font-medium">{t("settings:company.access.dialog.membershipStatus")}</span>
                  <select
                    className="w-full rounded-md border border-border bg-background px-3 py-2"
                    value={draftStatus}
                    onChange={(event) =>
                      setDraftStatus(event.target.value as CompanyMember["status"])
                    }
                  >
                    <option value="active">{t("settings:company.access.dialog.statusActive")}</option>
                    <option value="pending">{t("settings:company.access.dialog.statusPending")}</option>
                    <option value="suspended">{t("settings:company.access.dialog.statusSuspended")}</option>
                  </select>
                </label>
              </div>

              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-medium">{t("settings:company.access.dialog.grantsTitle")}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t("settings:company.access.dialog.grantsDescription")}
                  </p>
                </div>
                <div className="rounded-lg border border-border px-3 py-3">
                  <div className="text-sm font-medium">{t("settings:company.access.dialog.implicitGrantsTitle")}</div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {draftRole
                      ? t("settings:company.access.dialog.implicitGrantsHasRole", { role: HUMAN_COMPANY_MEMBERSHIP_ROLE_LABELS[draftRole] })
                      : t("settings:company.access.dialog.implicitGrantsNoRole")}
                  </p>
                  {implicitGrantKeys.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {implicitGrantKeys.map((permissionKey) => (
                        <Badge key={permissionKey} variant="outline">
                          {permissionLabels[permissionKey]}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {PERMISSION_KEYS.map((permissionKey) => (
                    <label
                      key={permissionKey}
                      className="flex items-start gap-3 rounded-lg border border-border px-3 py-2"
                    >
                      <Checkbox
                        checked={draftGrants.has(permissionKey)}
                        onCheckedChange={(checked) => {
                          setDraftGrants((current) => {
                            const next = new Set(current);
                            if (checked) next.add(permissionKey);
                            else next.delete(permissionKey);
                            return next;
                          });
                        }}
                      />
                      <span className="space-y-1">
                        <span className="block text-sm font-medium">{permissionLabels[permissionKey]}</span>
                        <span className="block text-xs text-muted-foreground">{permissionKey}</span>
                        {implicitGrantSet.has(permissionKey) ? (
                          <span className="block text-xs text-muted-foreground">
                            {t("settings:company.access.dialog.implicitFromRole", { role: draftRole ? HUMAN_COMPANY_MEMBERSHIP_ROLE_LABELS[draftRole] : "" })}
                          </span>
                        ) : null}
                        {draftGrants.has(permissionKey) ? (
                          <span className="block text-xs text-muted-foreground">
                            {t("settings:company.access.dialog.storedExplicitly")}
                          </span>
                        ) : null}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMemberId(null)}>
              {t("settings:company.access.dialog.cancel")}
            </Button>
            <Button
              onClick={() => {
                if (!editingMember) return;
                updateMemberMutation.mutate({
                  memberId: editingMember.id,
                  membershipRole: draftRole,
                  status: draftStatus,
                  grants: [...draftGrants],
                });
              }}
              disabled={updateMemberMutation.isPending}
            >
              {updateMemberMutation.isPending ? t("settings:company.access.dialog.saving") : t("settings:company.access.dialog.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PendingJoinRequestCard({
  title,
  subtitle,
  context,
  detail,
  detailSecondary,
  approveLabel,
  rejectLabel,
  disabled,
  onApprove,
  onReject,
}: {
  title: string;
  subtitle: string;
  context: string;
  detail: string;
  detailSecondary?: string;
  approveLabel: string;
  rejectLabel: string;
  disabled: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="rounded-xl border border-border px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div>
            <div className="font-medium">{title}</div>
            <div className="text-sm text-muted-foreground">{subtitle}</div>
          </div>
          <div className="text-sm text-muted-foreground">{context}</div>
          <div className="text-sm text-muted-foreground">{detail}</div>
          {detailSecondary ? <div className="text-sm text-muted-foreground">{detailSecondary}</div> : null}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onReject} disabled={disabled}>
            {rejectLabel}
          </Button>
          <Button type="button" onClick={onApprove} disabled={disabled}>
            {approveLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
