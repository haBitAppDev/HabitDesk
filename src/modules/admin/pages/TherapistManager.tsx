import { ClipboardCopy, ExternalLink, Mail, RefreshCw, ShieldMinus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Select } from "../../../components/ui/select";
import { Label } from "../../../components/ui/label";
import { Spinner } from "../../../components/ui/spinner";
import { Textarea } from "../../../components/ui/textarea";
import { useI18n } from "../../../i18n/I18nProvider";
import {
  createTherapistInvite,
  deleteTherapistInvite,
  listTherapistInvites,
  listTherapistProfiles,
  revokeTherapistInvite,
  updateTherapistInvite,
  type CreateTherapistInviteInput,
} from "../services/therapistAdminApi";
import { listTherapistTypes } from "../../therapist/services/therapistApi";
import type {
  TherapistInvite,
  TherapistProfile,
  TherapistType,
} from "../../shared/types/domain";
import {
  buildHabitSchemeLink,
  buildHabitWebLink,
  resolveAppStorePlaceholderUrl,
} from "../../shared/utils/inviteLinks";

interface InviteFormState {
  email: string;
  therapistTypes: string[];
  licenseValidUntil: string;
  contractReference: string;
  notes: string;
}

const INITIAL_FORM: InviteFormState = {
  email: "",
  therapistTypes: [],
  licenseValidUntil: "",
  contractReference: "",
  notes: "",
};

const statusVariant: Record<
  TherapistInvite["status"],
  { variant: "primary" | "secondary" | "muted"; className?: string }
> = {
  pending: { variant: "secondary" },
  used: { variant: "primary" },
  revoked: { variant: "muted", className: "bg-red-50 text-red-600" },
};

const formatDate = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString();
};

const formatDateTime = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
};

const toDateInputValue = (value: string) => {
  if (!value) return "";
  return value.slice(0, 10);
};

const copyTextToClipboard = async (value: string) => {
  if (!value) {
    return;
  }

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  if (typeof document !== "undefined") {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "absolute";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand?.("copy");
    document.body.removeChild(textarea);
    return;
  }

  throw new Error("Clipboard API not available");
};

export function TherapistManager() {
  const { t } = useI18n();
  const [invites, setInvites] = useState<TherapistInvite[]>([]);
  const [profiles, setProfiles] = useState<TherapistProfile[]>([]);
  const [types, setTypes] = useState<TherapistType[]>([]);
  const [form, setForm] = useState<InviteFormState>(INITIAL_FORM);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [selectedInviteId, setSelectedInviteId] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    const [inviteList, therapistProfiles, therapistTypes] = await Promise.all([
      listTherapistInvites(),
      listTherapistProfiles(),
      listTherapistTypes(),
    ]);
    setInvites(inviteList);
    setProfiles(therapistProfiles);
    setTypes(therapistTypes);
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchAll()
      .then(() => {
        if (!active) return;
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        console.log(err)
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [fetchAll]);

  useEffect(() => {
    if (!feedback) return;
    const timeout = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timeout);
  }, [feedback]);

  useEffect(() => {
    if (!invites.length) {
      if (selectedInviteId !== null) {
        setSelectedInviteId(null);
      }
      return;
    }

    if (selectedInviteId && invites.some((invite) => invite.id === selectedInviteId)) {
      return;
    }

    setSelectedInviteId(invites[0].id);
  }, [invites, selectedInviteId]);

  const typeOptions = useMemo(
    () => types.map((type) => ({ value: type.id, label: type.name })),
    [types]
  );

  const appStoreUrl = useMemo(() => resolveAppStorePlaceholderUrl(), []);
  const selectedInvite = useMemo(() => {
    return (
      invites.find((invite) => invite.id === selectedInviteId) ??
      invites[0] ??
      null
    );
  }, [invites, selectedInviteId]);
  const schemeLink = selectedInvite ? buildHabitSchemeLink(selectedInvite.code) : "";
  const webLink = selectedInvite ? buildHabitWebLink(selectedInvite.code) : "";
  const emailSubject = t(
    "therapists.invites.email.subject",
    "You’re invited to Habit"
  );
  const emailBody = selectedInvite
    ? t(
        "therapists.invites.email.body",
        "Open Habit with this link: {link}\nYour invite code: {code}\nIf the app does not open, visit {appStore}",
        {
          link: webLink,
          code: selectedInvite.code,
          appStore: appStoreUrl,
        }
      )
    : "";
  const templatePreview = selectedInvite ? `${emailSubject}\n\n${emailBody}` : "";
  const linkCopiedMessage = t(
    "therapists.invites.deepLink.linkCopied",
    "Link copied to clipboard."
  );
  const templateCopiedMessage = t(
    "therapists.invites.email.copied",
    "Template copied to clipboard."
  );
  const hasEmailAddress = Boolean(selectedInvite?.email?.trim());

  const handleCopyText = async (value: string, message: string) => {
    if (!value) return;
    try {
      await copyTextToClipboard(value);
      setFeedback(message);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleOpenLink = (link: string) => {
    if (!link || typeof window === "undefined") return;
    window.open(link, "_blank");
  };

  const handleSendEmail = (invite: TherapistInvite) => {
    const body = t(
      "therapists.invites.email.body",
      "Open Habit with this link: {link}\nYour invite code: {code}\nIf the app does not open, visit {appStore}",
      {
        link: buildHabitWebLink(invite.code),
        code: invite.code,
        appStore: appStoreUrl,
      }
    );
    const params = new URLSearchParams();
    params.set("subject", emailSubject);
    params.set("body", body);

    const mailtoLink = `mailto:${invite.email ?? ""}?${params.toString()}`;
    if (typeof window !== "undefined") {
      window.location.href = mailtoLink;
    }
  };

  const handleFormChange = <Key extends keyof InviteFormState>(key: Key, value: InviteFormState[Key]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = () => {
    setForm(INITIAL_FORM);
  };

  const handleCreateInvite = async () => {
    setCreating(true);
    try {
      const payload: CreateTherapistInviteInput = {
        email: form.email.trim() || undefined,
        therapistTypes: form.therapistTypes,
        licenseValidUntil: form.licenseValidUntil || undefined,
        contractReference: form.contractReference.trim() || undefined,
        notes: form.notes.trim() || undefined,
      };
      const created = await createTherapistInvite(payload);
      setInvites((prev) => [created, ...prev]);
      setSelectedInviteId(created.id);
      resetForm();
      setFeedback(
        t("therapists.invites.created", "Invite created. Share the code securely with the therapist.")
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (invite: TherapistInvite) => {
    try {
      await revokeTherapistInvite(invite.id);
      setInvites((prev) =>
        prev.map((entry) =>
          entry.id === invite.id
            ? { ...entry, status: "revoked", updatedAt: new Date().toISOString() }
            : entry
        )
      );
      setFeedback(t("therapists.invites.revoked", "Invite revoked."));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleDelete = async (invite: TherapistInvite) => {
    try {
      await deleteTherapistInvite(invite.id);
      setInvites((prev) => prev.filter((entry) => entry.id !== invite.id));
      setFeedback(t("therapists.invites.deleted", "Invite deleted."));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleRestore = async (invite: TherapistInvite) => {
    try {
      await updateTherapistInvite(invite.id, { status: "pending" });
      setInvites((prev) =>
        prev.map((entry) =>
          entry.id === invite.id
            ? { ...entry, status: "pending", updatedAt: new Date().toISOString() }
            : entry
        )
      );
      setFeedback(t("therapists.invites.restored", "Invite reactivated."));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setFeedback(t("therapists.invites.codeCopied", "Invite code copied to clipboard."));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const therapistLookup = useMemo(() => {
    const map = new Map<string, TherapistProfile>();
    profiles.forEach((profile) => {
      if (profile.inviteId) {
        map.set(profile.inviteId, profile);
      }
    });
    return map;
  }, [profiles]);

  const formValid = form.therapistTypes.length > 0;

  const inviteTitle = t("therapists.title", "Therapist Management");
  const inviteSubtitle = t(
    "therapists.subtitle",
    "Create invites, track onboarding progress, and manage therapist access scopes."
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-text md:text-3xl">{inviteTitle}</h1>
        <p className="mt-2 text-sm text-brand-text-muted">{inviteSubtitle}</p>
      </div>
      {error && (
        <div className="rounded-card border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-soft">
          {error}
        </div>
      )}

      {feedback && (
        <div className="rounded-card border border-brand-primary/30 bg-brand-primary/10 px-4 py-3 text-sm text-brand-primary shadow-soft">
          {feedback}
        </div>
      )}

      <Card className="p-6">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-brand-text">
            {t("therapists.invites.createTitle", "Create therapist invite")}
          </h2>
          <p className="text-sm text-brand-text-muted">
            {t(
              "therapists.invites.createHint",
              "Invite codes grant therapists access to HabitDesk and the Habit App. Codes are single-use."
            )}
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="invite-email">
                {t("therapists.invites.form.email", "Email (optional)")}
              </Label>
              <Input
                id="invite-email"
                type="email"
                value={form.email}
                onChange={(event) => handleFormChange("email", event.target.value)}
                placeholder="therapist@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-license">
                {t("therapists.invites.form.license", "License valid until")}
              </Label>
              <Input
                id="invite-license"
                type="date"
                value={toDateInputValue(form.licenseValidUntil)}
                onChange={(event) =>
                  handleFormChange(
                    "licenseValidUntil",
                    event.target.value ? `${event.target.value}T00:00:00.000Z` : ""
                  )
                }
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="invite-types">
                {t("therapists.invites.form.types", "Therapist types")}
              </Label>
              <div className="flex flex-wrap gap-2">
                {typeOptions.length === 0 && (
                  <p className="text-sm text-brand-text-muted">
                    {t("therapists.invites.noTypes", "No therapist types configured yet.")}
                  </p>
                )}
                {typeOptions.map((option) => {
                  const selected = form.therapistTypes.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        handleFormChange(
                          "therapistTypes",
                          selected
                            ? form.therapistTypes.filter((value) => value !== option.value)
                            : [...form.therapistTypes, option.value]
                        )
                      }
                      className={`rounded-full border px-3 py-1 text-sm transition ${
                        selected
                          ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                          : "border-brand-divider/70 text-brand-text hover:bg-brand-light/60"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-contract">
                {t("therapists.invites.form.contract", "Contract reference")}
              </Label>
              <Input
                id="invite-contract"
                value={form.contractReference}
                onChange={(event) => handleFormChange("contractReference", event.target.value)}
                placeholder="e.g. 2024-THERA-01"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-notes">
                {t("therapists.invites.form.notes", "Internal notes")}
              </Label>
              <Textarea
                id="invite-notes"
                value={form.notes}
                onChange={(event) => handleFormChange("notes", event.target.value)}
                rows={3}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              onClick={handleCreateInvite}
              disabled={!formValid || creating}
            >
              {creating
                ? t("therapists.invites.actions.creating", "Creating…")
                : t("therapists.invites.actions.create", "Generate invite")}
            </Button>
            <Button type="button" variant="outline" onClick={resetForm} disabled={creating}>
              {t("therapists.invites.actions.reset", "Reset form")}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6 space-y-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-brand-text">
            {t(
              "therapists.invites.deepLink.title",
              "Deep link & invitation template"
            )}
          </h2>
          <p className="text-sm text-brand-text-muted">
            {t(
              "therapists.invites.deepLink.subtitle",
              "Copy the Habit deep link and a prefilled email template for the therapist invite."
            )}
          </p>
        </div>
        <div className="space-y-4">
          <Label htmlFor="invite-deep-link-select" className="text-sm font-semibold text-brand-text">
            {t("therapists.invites.deepLink.selectLabel", "Select invite for sharing")}
          </Label>
          <Select
            id="invite-deep-link-select"
            value={selectedInviteId ?? ""}
            onChange={(event) => setSelectedInviteId(event.target.value || null)}
            disabled={invites.length === 0}
          >
            {invites.length === 0 ? (
              <option value="">
                {t(
                  "therapists.invites.deepLink.noInvites",
                  "Generate an invite to unlock the share links."
                )}
              </option>
            ) : (
              invites.map((invite) => (
                <option key={invite.id} value={invite.id}>
                  {invite.code} — {invite.status}
                </option>
              ))
            )}
          </Select>
        </div>
        {selectedInvite ? (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="invite-custom-link">
                  {t("therapists.invites.deepLink.customLabel", "App scheme link")}
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="invite-custom-link"
                    value={schemeLink}
                    readOnly
                    className="flex-1 min-w-0"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyText(schemeLink, linkCopiedMessage)}
                  >
                    <ClipboardCopy className="mr-2 h-4 w-4" />
                    {t("therapists.invites.deepLink.copyButton", "Copy")}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenLink(schemeLink)}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    {t("therapists.invites.deepLink.openButton", "Open")}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-web-link">
                  {t("therapists.invites.deepLink.webLabel", "Web link")}
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="invite-web-link"
                    value={webLink}
                    readOnly
                    className="flex-1 min-w-0"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyText(webLink, linkCopiedMessage)}
                  >
                    <ClipboardCopy className="mr-2 h-4 w-4" />
                    {t("therapists.invites.deepLink.copyButton", "Copy")}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenLink(webLink)}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    {t("therapists.invites.deepLink.openButton", "Open")}
                  </Button>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <h3 className="text-base font-semibold text-brand-text">
                    {t("therapists.invites.email.title", "Invitation email")}
                  </h3>
                  <p className="text-xs text-brand-text-muted">
                    {t(
                      "therapists.invites.email.subtitle",
                      "Send a template that opens Habit via the deep link or falls back to the App Store placeholder."
                    )}
                  </p>
                </div>
                <p className="text-sm text-brand-text-muted">
                  {selectedInvite.email ||
                    t("therapists.invites.email.noEmail", "Email not specified")}
                </p>
              </div>
              <Textarea value={templatePreview} readOnly className="min-h-[150px]" />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  disabled={!hasEmailAddress}
                  onClick={() => selectedInvite && handleSendEmail(selectedInvite)}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  {t("therapists.invites.email.sendCta", "Open mail client")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyText(templatePreview, templateCopiedMessage)}
                  disabled={!templatePreview}
                >
                  {t("therapists.invites.email.copyCta", "Copy template")}
                </Button>
              </div>
              {!hasEmailAddress && (
                <p className="text-xs text-brand-text-muted">
                  {t(
                    "therapists.invites.email.missingEmailHint",
                    "Add an email address to the invite to send the mail."
                  )}
                </p>
              )}
            </div>
          </>
        ) : (
          <p className="text-sm text-brand-text-muted">
            {t(
              "therapists.invites.deepLink.empty",
              "Create an invite to access the deep link and template."
            )}
          </p>
        )}
      </Card>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-brand-divider/60 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-brand-text">
              {t("therapists.invites.listTitle", "Invite overview")}
            </h2>
            <p className="text-sm text-brand-text-muted">
              {t("therapists.invites.listSubtitle", "Track invite status and manage codes.")}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={async () => {
              try {
                setLoading(true);
                await fetchAll();
                setError(null);
              } catch (err) {
                setError(err instanceof Error ? err.message : String(err));
              } finally {
                setLoading(false);
              }
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {t("therapists.invites.actions.reload", "Reload")}
          </Button>
        </div>
        {loading ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <Spinner className="h-8 w-8" />
          </div>
        ) : invites.length === 0 ? (
          <p className="px-6 py-8 text-sm text-brand-text-muted">
            {t("therapists.invites.empty", "No invites yet. Create one above to add a therapist.")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-brand-divider/60 text-sm">
              <thead className="bg-brand-light/40 text-left text-xs font-semibold uppercase tracking-wide text-brand-text-muted">
                <tr>
                  <th className="px-6 py-3">{t("therapists.invites.table.code", "Code")}</th>
                  <th className="px-6 py-3">{t("therapists.invites.table.types", "Therapist types")}</th>
                  <th className="px-6 py-3">{t("therapists.invites.table.email", "Email")}</th>
                  <th className="px-6 py-3">{t("therapists.invites.table.status", "Status")}</th>
                  <th className="px-6 py-3">{t("therapists.invites.table.updated", "Updated")}</th>
                  <th className="px-6 py-3">{t("therapists.invites.table.actions", "Actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-divider/70">
                {invites.map((invite) => {
                  const relatedProfile = therapistLookup.get(invite.id);
                  return (
                    <tr key={invite.id} className="hover:bg-brand-light/40">
                      <td className="px-6 py-4 font-semibold text-brand-text">
                        <div className="flex items-center gap-3">
                          <span>{invite.code}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(invite.code)}
                            className="rounded-full border border-brand-divider/60 p-2 text-brand-text-muted transition hover:bg-brand-light/60"
                          >
                            <ClipboardCopy className="h-4 w-4" />
                          </button>
                        </div>
                        {relatedProfile && (
                          <p className="mt-1 text-xs text-brand-text-muted">
                            {t("therapists.invites.linked", "Linked to {name}", {
                              name: relatedProfile.displayName || relatedProfile.email,
                            })}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-brand-text">
                        {invite.therapistTypes.length === 0
                          ? t("therapists.invites.typesAll", "All types")
                          : invite.therapistTypes.join(", ")}
                      </td>
                      <td className="px-6 py-4 text-brand-text-muted">
                        {invite.email || "—"}
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={statusVariant[invite.status].variant}
                          className={statusVariant[invite.status].className}
                        >
                          {invite.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-brand-text-muted">
                        {formatDateTime(invite.updatedAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {invite.status === "pending" && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleRevoke(invite)}
                            >
                              <ShieldMinus className="mr-2 h-4 w-4" />
                              {t("therapists.invites.actions.revoke", "Revoke")}
                            </Button>
                          )}
                          {invite.status === "revoked" && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleRestore(invite)}
                            >
                              <RefreshCw className="mr-2 h-4 w-4" />
                              {t("therapists.invites.actions.restore", "Reactivate")}
                            </Button>
                          )}
                          {invite.status !== "used" && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-600"
                              onClick={() => handleDelete(invite)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t("therapists.invites.actions.delete", "Delete")}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-brand-text">
          {t("therapists.profiles.title", "Active therapists")}
        </h2>
        {loading ? (
          <div className="flex min-h-[160px] items-center justify-center">
            <Spinner className="h-8 w-8" />
          </div>
        ) : profiles.length === 0 ? (
          <p className="mt-4 text-sm text-brand-text-muted">
            {t("therapists.profiles.empty", "No therapists onboarded yet.")}
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-brand-divider/60 text-sm">
              <thead className="bg-brand-light/40 text-left text-xs font-semibold uppercase tracking-wide text-brand-text-muted">
                <tr>
                  <th className="px-6 py-3">{t("therapists.profiles.table.name", "Name")}</th>
                  <th className="px-6 py-3">{t("therapists.profiles.table.email", "Email")}</th>
                  <th className="px-6 py-3">{t("therapists.profiles.table.types", "Types")}</th>
                  <th className="px-6 py-3">{t("therapists.profiles.table.license", "License valid until")}</th>
                  <th className="px-6 py-3">{t("therapists.profiles.table.contract", "Contract reference")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-divider/70">
                {profiles.map((profile) => (
                  <tr key={profile.uid} className="hover:bg-brand-light/40">
                    <td className="px-6 py-4 text-brand-text">
                      {profile.displayName || "—"}
                    </td>
                    <td className="px-6 py-4 text-brand-text-muted">{profile.email}</td>
                    <td className="px-6 py-4 text-brand-text">
                      {profile.therapistTypes.length
                        ? profile.therapistTypes.join(", ")
                        : t("therapists.profiles.typesUnknown", "Not specified")}
                    </td>
                    <td className="px-6 py-4 text-brand-text-muted">
                      {formatDate(profile.licenseValidUntil)}
                    </td>
                    <td className="px-6 py-4 text-brand-text-muted">
                      {profile.contractReference || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
