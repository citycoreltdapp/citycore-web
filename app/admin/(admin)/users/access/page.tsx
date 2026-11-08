"use client";

import * as React from "react";

import { AppModal } from "@/components/primitives/app-modal";
import { PasswordField } from "@/components/primitives/password-field";
import { SelectField } from "@/components/primitives/select-field";
import { TextAreaField, TextField } from "@/components/primitives/text-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  type PermissionChangeForm,
  type RoleChangeForm,
  type StaffMember,
  permissionChangeFormSchema,
  revokeStaffAccessRequestSchema,
  roleChangeFormSchema,
  roleChangeRequestSchema,
  staffSignInSchema,
} from "@/constant/schemas/admin-people";
import { zodResolver } from "@hookform/resolvers/zod";
import { Add01Icon, ArrowRight01Icon, Download04Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";
import { Controller, useForm, useWatch } from "react-hook-form";

import { PERMISSIONS, ROLE_ITEMS, STAFF } from "../../_operations/data";
import { useReviewRequests } from "../../_operations/requests";
import { Notice } from "../../_operations/ui";
import { StatusPill, formatDate } from "../../account/_ui";
import { ACCESS_TONES, BackLink, DetailList, Initials, roleLabel } from "../_ui";

const ACTOR = "staff-nneka";
const ACCESS_KINDS = ["role", "revoke", "permissions"];
const APPROVERS = STAFF.filter((s) => s.role === "super-admin" && s.id !== ACTOR);

function exportReview() {
  const data = JSON.stringify({ staff: STAFF, permissions: PERMISSIONS, illustrative: true }, null, 2);
  const url = URL.createObjectURL(new Blob([data], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "citycore-access-review.json";
  link.click();
  URL.revokeObjectURL(url);
}

function Level({ value }: { value: string }) {
  if (value === "—") return <span className="text-muted-foreground/50">—</span>;
  const style =
    value === "Allowed"
      ? "bg-success/12 text-success"
      : value.startsWith("Approve")
        ? "bg-accent/20 text-foreground"
        : value === "Read only"
          ? "bg-muted text-muted-foreground"
          : "border border-border text-foreground";
  return (
    <span
      className={cn("inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold whitespace-nowrap", style)}
    >
      {value}
    </span>
  );
}

function PermissionRequest({ onSubmit }: { onSubmit: (values: PermissionChangeForm) => void }) {
  const form = useForm<PermissionChangeForm>({
    resolver: zodResolver(permissionChangeFormSchema),
    defaultValues: {
      permission: "Investor profiles",
      role: "compliance",
      level: "Read only",
      reason: "",
      approverId: "staff-zainab",
    },
  });
  return (
    <form className="space-y-4" noValidate onSubmit={form.handleSubmit(onSubmit)}>
      <Controller
        name="permission"
        control={form.control}
        render={({ field }) => (
          <SelectField
            {...field}
            id="permission-name"
            label="Permission"
            items={PERMISSIONS.filter((p) => p.permission !== "Audit log").map((p) => ({
              value: p.permission,
              label: p.permission,
            }))}
          />
        )}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          name="role"
          control={form.control}
          render={({ field }) => <SelectField {...field} id="permission-role" label="Role" items={ROLE_ITEMS} />}
        />
        <Controller
          name="level"
          control={form.control}
          render={({ field }) => (
            <SelectField
              {...field}
              id="permission-level"
              label="Requested access"
              items={["Read only", "Request", "Prepare", "Allowed"].map((v) => ({ value: v, label: v }))}
            />
          )}
        />
      </div>
      <Controller
        name="reason"
        control={form.control}
        render={({ field, fieldState }) => (
          <TextAreaField {...field} id="permission-reason" label="Reason" error={fieldState.error?.message} />
        )}
      />
      <Controller
        name="approverId"
        control={form.control}
        render={({ field, fieldState }) => (
          <SelectField
            {...field}
            id="permission-approver"
            label="Independent approver"
            error={fieldState.error?.message}
            items={APPROVERS.map((s) => ({ value: s.id, label: s.name }))}
          />
        )}
      />
      <Notice>
        Needs an authorized Super Admin, an independent approver and session re-verification. Audit records can&apos;t
        be edited or deleted.
      </Notice>
      <Button type="submit" className="w-full rounded-full">
        Request permission review
      </Button>
    </form>
  );
}

function StaffSignIn() {
  const form = useForm<{ email: string; password: string }>({
    resolver: zodResolver(staffSignInSchema),
    defaultValues: { email: "", password: "" },
  });
  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={form.handleSubmit(() => {
        form.resetField("password");
        AppModal.close();
        setTimeout(
          () =>
            AppModal.open({
              title: "Staff authentication",
              content: (
                <Notice>
                  The staff authentication service isn&apos;t connected. No session or 2FA challenge was created. The
                  backend must verify credentials before returning a challenge ID.
                </Notice>
              ),
            }),
          0
        );
      })}
    >
      <Controller
        control={form.control}
        name="email"
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            id="staff-email"
            label="Work email"
            type="email"
            autoComplete="username"
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={form.control}
        name="password"
        render={({ field, fieldState }) => (
          <PasswordField
            {...field}
            id="staff-password"
            label="Password"
            autoComplete="current-password"
            error={fieldState.error?.message}
          />
        )}
      />
      <Notice>
        Roles are assigned by an authorized admin, so there&apos;s no role picker at sign-in. 2FA is always required.
        Never use real credentials in this preview.
      </Notice>
      <Button type="submit" className="w-full rounded-full">
        Continue to 2FA
      </Button>
    </form>
  );
}

function TeamList({ selectedId, onSelect }: { selectedId: string; onSelect: (staff: StaffMember) => void }) {
  return (
    <ul className="flex flex-col">
      {STAFF.map((staff) => {
        const isYou = staff.id === ACTOR;
        const isActive = staff.id === selectedId;
        return (
          <li key={staff.id}>
            <button
              type="button"
              disabled={isYou}
              aria-pressed={isActive}
              onClick={() => onSelect(staff)}
              className={cn(
                "-mx-2 flex w-[calc(100%+1rem)] flex-wrap items-center gap-x-3 gap-y-2 rounded-xl px-2 py-2.5 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default sm:flex-nowrap",
                isActive ? "bg-muted" : "enabled:hover:bg-muted/50"
              )}
            >
              <Initials name={staff.name} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-sm font-semibold">
                  <span className="truncate">{staff.name}</span>
                  {isYou && <span className="rounded-full bg-foreground px-1.5 text-[10px] text-background">You</span>}
                </span>
                <span className="block truncate text-xs text-muted-foreground">{staff.email}</span>
              </span>
              <span className="flex items-center gap-2 pl-11 sm:pl-0">
                <span className="w-32 text-sm">{roleLabel(staff.role)}</span>
                <span className={cn("w-16 text-xs", staff.twoFactor ? "text-muted-foreground" : "text-warning")}>
                  {staff.twoFactor ? "2FA on" : "No 2FA"}
                </span>
                <StatusPill tone={ACCESS_TONES[staff.access]}>{staff.access}</StatusPill>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export default function StaffAccess() {
  const { requests, submit, ready } = useReviewRequests();
  const form = useForm<RoleChangeForm>({
    resolver: zodResolver(roleChangeFormSchema),
    defaultValues: { staffId: "staff-tunde", role: "finance", reason: "", approverId: "staff-zainab" },
  });
  const selectedId = useWatch({ control: form.control, name: "staffId" });
  const selected = STAFF.find((s) => s.id === selectedId) ?? STAFF[2];
  const [reviewed, setReviewed] = React.useState(false);
  const accessRequests = requests.filter((r) => ACCESS_KINDS.includes(r.kind));
  const approvers = APPROVERS.filter((s) => s.id !== selectedId);

  const pickStaff = (staff: StaffMember) => {
    form.setValue("staffId", staff.id);
    form.setValue("role", staff.role);
    if (form.getValues("approverId") === staff.id)
      form.setValue("approverId", APPROVERS.find((s) => s.id !== staff.id)?.id ?? "");
    form.clearErrors();
    setReviewed(false);
  };

  const requestRole = (values: RoleChangeForm) => {
    const result = roleChangeRequestSchema.safeParse({
      ...values,
      requestedBy: ACTOR,
      idempotencyKey: crypto.randomUUID(),
    });
    if (!result.success) {
      form.setError("approverId", { message: result.error.issues[0].message });
      return;
    }
    if (values.role === selected.role) {
      form.setError("role", { message: "Choose a different role" });
      return;
    }
    AppModal.open({
      title: "Review role change",
      description: "Existing permissions stay until it's approved",
      content: (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-3">
            <Initials name={selected.name} />
            <p className="min-w-0 flex-1 truncate text-sm font-semibold">{selected.name}</p>
            <span className="flex items-center gap-1.5 text-sm">
              {roleLabel(selected.role)}
              <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden className="size-4 text-muted-foreground" />
              <span className="font-semibold">{roleLabel(values.role)}</span>
            </span>
          </div>
          <p className="text-sm/6 text-muted-foreground">{values.reason}</p>
          <Notice>
            Second approver: {STAFF.find((s) => s.id === values.approverId)?.name}. The connected product will ask you
            to re-verify your session.
          </Notice>
        </div>
      ),
      primaryButton: {
        children: "Save review request",
        onClick: () => {
          if (
            submit({
              kind: "role",
              subjectId: values.staffId,
              summary: `Role: ${roleLabel(selected.role)} → ${roleLabel(values.role)}`,
              reason: values.reason,
              details: { ...values },
            })
          )
            setReviewed(false);
        },
      },
      secondaryButton: { children: "Cancel" },
    });
  };

  const requestRevoke = form.handleSubmit((values) => {
    const parsed = revokeStaffAccessRequestSchema.safeParse({
      staffId: selected.id,
      requestedBy: ACTOR,
      approverId: values.approverId,
      reason: values.reason,
      idempotencyKey: crypto.randomUUID(),
    });
    if (!parsed.success) {
      form.setError("approverId", { message: parsed.error.issues[0].message });
      return;
    }
    AppModal.open({
      title: `Revoke ${selected.name}'s access?`,
      content: (
        <Notice>
          This queues a revocation request with your reason: {values.reason}. It doesn&apos;t end a live session in this
          preview.
        </Notice>
      ),
      primaryButton: {
        children: "Request revocation",
        variant: "destructive",
        onClick: () =>
          submit({
            kind: "revoke",
            subjectId: selected.id,
            summary: `Revoke access for ${selected.name}`,
            reason: values.reason,
            details: { ...values },
          }),
      },
      secondaryButton: { children: "Cancel" },
    });
  });

  const openPermissionRequest = () =>
    AppModal.open({
      title: "Request permission change",
      description: "Goes to an independent Super Admin",
      content: (
        <PermissionRequest
          onSubmit={(values) => {
            if (
              submit({
                kind: "permissions",
                subjectId: `${values.role}:${values.permission}`,
                summary: `${roleLabel(values.role)} · ${values.permission} → ${values.level}`,
                reason: values.reason,
                details: { ...values },
              })
            )
              AppModal.close();
          }}
        />
      ),
    });

  const enrolled = STAFF.filter((s) => s.twoFactor).length;

  return (
    <>
      <BackLink href="/users">Users & Admins</BackLink>
      <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">Staff & access</h1>
          <p className="text-sm text-muted-foreground">
            Roles, permissions and sign-in policy · every change needs a second approver
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="h-10 rounded-full px-4" onClick={exportReview}>
            <HugeiconsIcon icon={Download04Icon} aria-hidden />
            Export review
          </Button>
          <Button className="h-10 rounded-full px-4" disabled={!ready} onClick={openPermissionRequest}>
            <HugeiconsIcon icon={Add01Icon} aria-hidden />
            Permission change
          </Button>
        </div>
      </header>

      <Card className="rounded-2xl px-5 py-5 ring-foreground/8">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-5 xl:grid-cols-4 xl:divide-x xl:divide-border">
          {[
            {
              label: "Staff",
              value: STAFF.length,
              note: `${STAFF.filter((s) => s.access === "active").length} active`,
            },
            {
              label: "2FA enrolled",
              value: `${enrolled}/${STAFF.length}`,
              note: enrolled < STAFF.length ? `${STAFF.length - enrolled} need enrolment` : "Everyone covered",
            },
            {
              label: "Super Admins",
              value: STAFF.filter((s) => s.role === "super-admin").length,
              note: "can approve changes",
            },
            { label: "Open requests", value: accessRequests.length, note: "saved in this browser" },
          ].map(({ label, value, note }) => (
            <div key={label} className="min-w-0 xl:pl-5 xl:first:pl-0">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="mt-1 truncate text-2xl font-light tabular-nums">{value}</dd>
              <dd className="mt-0.5 text-xs text-muted-foreground">{note}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="flex min-w-0 flex-col gap-5">
          <Card className="gap-3 rounded-2xl px-5 py-5 ring-foreground/8">
            <div>
              <h2 className="text-base font-semibold">Team</h2>
              <p className="text-xs text-muted-foreground">Select someone to change their role or access</p>
            </div>
            <TeamList selectedId={selectedId} onSelect={pickStaff} />
          </Card>

          <Card className="gap-4 rounded-2xl px-5 py-5 ring-foreground/8">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">Permission matrix</h2>
                <p className="text-xs text-muted-foreground">
                  * Maker-checker: nobody approves their own change, and no role can edit the audit log
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {["Allowed", "Approve*", "Prepare", "Read only"].map((level) => (
                  <Level key={level} value={level} />
                ))}
              </div>
            </div>
            <div className="-mx-5 overflow-x-auto px-5">
              <table className="w-full min-w-[40rem] text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-4 font-normal">Permission</th>
                    {ROLE_ITEMS.map((role) => (
                      <th key={role.value} className="px-2 py-2 font-normal">
                        {role.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PERMISSIONS.map((row) => (
                    <tr key={row.permission} className="border-t border-border">
                      <th scope="row" className="py-2.5 pr-4 text-left font-semibold">
                        {row.permission}
                      </th>
                      {row.values.map((value, index) => (
                        <td key={ROLE_ITEMS[index].value} className="px-2 py-2.5">
                          <Level value={value} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {accessRequests.length > 0 && (
            <Card className="gap-3 rounded-2xl px-5 py-5 ring-foreground/8">
              <h2 className="text-base font-semibold">Open access requests</h2>
              <ul className="flex flex-col">
                {accessRequests.map((r) => (
                  <li
                    key={r.id}
                    className="flex flex-wrap items-center gap-3 border-b border-border py-3 last:border-none"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{r.summary}</span>
                      <span className="block truncate text-xs text-muted-foreground">{r.reason}</span>
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums">{formatDate(r.createdAt)}</span>
                    <StatusPill tone="warning">Pending review</StatusPill>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-5 xl:sticky xl:top-24">
          <Card className="gap-0 rounded-2xl py-0 ring-foreground/8">
            <div className="flex items-center gap-3 border-b border-border p-5">
              <Initials name={selected.name} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{selected.name}</p>
                <p className="text-xs text-muted-foreground">
                  {roleLabel(selected.role)} · {selected.review}
                </p>
              </div>
              <StatusPill tone={ACCESS_TONES[selected.access]}>{selected.access}</StatusPill>
            </div>
            <form className="flex flex-col gap-4 p-5" noValidate onSubmit={form.handleSubmit(requestRole)}>
              <Controller
                control={form.control}
                name="role"
                render={({ field, fieldState }) => (
                  <SelectField
                    {...field}
                    id="assigned-role"
                    label="New role"
                    items={ROLE_ITEMS}
                    error={fieldState.error?.message}
                  />
                )}
              />
              <Controller
                control={form.control}
                name="reason"
                render={({ field, fieldState }) => (
                  <TextAreaField
                    {...field}
                    id="role-reason"
                    label="Reason"
                    placeholder="Why this person needs the change"
                    error={fieldState.error?.message}
                  />
                )}
              />
              <Controller
                control={form.control}
                name="approverId"
                render={({ field, fieldState }) => (
                  <SelectField
                    {...field}
                    id="role-approver"
                    label="Independent approver"
                    items={approvers.map((s) => ({ value: s.id, label: s.name }))}
                    error={fieldState.error?.message}
                  />
                )}
              />
              <label className="flex items-start gap-2 text-sm">
                <Checkbox checked={reviewed} onCheckedChange={setReviewed} />I checked the requested access and this
                person&apos;s identity.
              </label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 rounded-full text-destructive hover:text-destructive"
                  disabled={!ready || !reviewed}
                  onClick={requestRevoke}
                >
                  Revoke access
                </Button>
                <Button type="submit" className="flex-1 rounded-full" disabled={!ready || !reviewed}>
                  Request change
                </Button>
              </div>
            </form>
          </Card>

          <Card className="gap-2 rounded-2xl px-5 py-5 ring-foreground/8">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold">Session policy</h2>
              <span className="text-xs text-muted-foreground">Locked</span>
            </div>
            <DetailList
              rows={[
                ["Two-factor", "Required"],
                ["Idle timeout", "15 minutes"],
                ["Session length", "8 hours"],
                ["Recovery", "Admin reviewed"],
              ]}
            />
            <Button
              variant="outline"
              className="mt-2 rounded-full"
              onClick={() =>
                AppModal.open({
                  title: "Staff sign-in",
                  description: "What staff see before entering the workspace",
                  content: <StaffSignIn />,
                })
              }
            >
              Preview staff sign-in
            </Button>
          </Card>
        </div>
      </div>
    </>
  );
}
