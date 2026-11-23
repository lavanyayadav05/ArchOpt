"use client";

import { useState } from "react";
import Link from "next/link";
import { Users, Share2, UserPlus, Plus, Minus, Hand, Maximize2, Send, MessageSquare, Copy, Lock, ArrowRight, Check } from "lucide-react";
import { PageHeader } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { Checkbox, Toggle, RadioGroup } from "@/components/ui/Checkbox";
import { Modal } from "@/components/ui/Modal";
import { DropdownMenu, SelectMenu } from "@/components/ui/Dropdown";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Avatar, AvatarStack, EmptyState } from "@/components/ui/Misc";
import { FloorPlan } from "@/components/floorplan/FloorPlan";
import { useToast } from "@/components/providers/ToastProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { teamMembers, layoutARooms, communityCentrePlot, layoutComments, recentActivity, layoutVersions, currentUser } from "@/lib/mock";
import { validateEmail } from "@/lib/validation";
import { timeAgo } from "@/lib/download";
import { cn, uid } from "@/lib/utils";
import type { AccessRole, Comment } from "@/lib/types";

const accessTone: Record<AccessRole, BadgeTone> = { Owner: "info", Editor: "neutral", Viewer: "neutral" };
const accessOptions: { value: AccessRole; label: string }[] = [
  { value: "Owner", label: "Owner" },
  { value: "Editor", label: "Editor" },
  { value: "Viewer", label: "Viewer" },
];

interface Member {
  id: string;
  name: string;
  access: AccessRole;
  pending?: boolean;
}

interface LocalComment extends Comment {
  resolved?: boolean;
}

export function CollaboratePage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const me = user?.name ?? currentUser.name;

  const [members, setMembers] = useState<Member[]>(teamMembers.map((m) => ({ id: m.id, name: m.name, access: m.access })));
  const [comments, setComments] = useState<LocalComment[]>(layoutComments);
  const [draft, setDraft] = useState("");
  const [zoom, setZoom] = useState(100);
  const [panMode, setPanMode] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [access, setAccess] = useState("team");
  const [allowComments, setAllowComments] = useState(true);
  const [allowEditing, setAllowEditing] = useState(true);

  const submitComment = (e: React.FormEvent) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setComments((list) => [...list, { id: uid("cm"), author: me, body, at: new Date().toISOString() }]);
    setDraft("");
  };

  return (
    <>
      <PageHeader title="Collaborate" description="Work together in real time, share layouts and manage feedback." />

      <div className="mb-4 flex flex-wrap items-center gap-3 border border-line bg-surface px-4 py-3 shadow-card rounded-md">
        <span className="inline-flex h-9 w-9 items-center justify-center border border-line bg-highlight text-primary rounded-sm">
          <Users className="h-4 w-4" />
        </span>
        <h2 className="text-base font-semibold text-ink">Community Centre – Layout A</h2>
        <Badge tone="info">In Progress</Badge>
        <div className="ml-auto flex items-center gap-3">
          <AvatarStack names={members.map((m) => m.name)} max={3} />
          <Button variant="outline" leftIcon={<Share2 className="h-4 w-4" />} onClick={() => setShareOpen(true)}>
            Share
          </Button>
          <Button leftIcon={<UserPlus className="h-4 w-4" />} onClick={() => setInviteOpen(true)}>
            Invite
          </Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[280px_1fr_320px]">
        {/* Members */}
        <Card className="h-fit">
          <CardHeader
            title={`Team Members (${members.length})`}
            action={
              <Button variant="outline" size="icon" className="h-8 w-8" aria-label="Invite member" onClick={() => setInviteOpen(true)}>
                <Plus className="h-4 w-4" />
              </Button>
            }
          />
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {members.map((m) => (
              <li key={m.id} className="flex items-center gap-2.5">
                <Avatar name={m.name} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{m.name}</p>
                  {m.pending ? <p className="text-[11px] text-muted">Invitation pending</p> : null}
                </div>
                {m.access === "Owner" ? (
                  <Badge tone={accessTone.Owner} size="sm">
                    Owner
                  </Badge>
                ) : (
                  <SelectMenu
                    size="sm"
                    value={m.access}
                    onChange={(v) => setMembers((list) => list.map((x) => (x.id === m.id ? { ...x, access: v } : x)))}
                    options={accessOptions.filter((o) => o.value !== "Owner")}
                    ariaLabel={`Access for ${m.name}`}
                  />
                )}
              </li>
            ))}
          </ul>
        </Card>

        {/* Shared layout */}
        <Card className="min-w-0">
          <CardHeader
            title="Shared Layout"
            action={<span className="text-xs text-muted">v2.3 · Last edited {timeAgo(layoutVersions[0].at)}</span>}
          />
          <div className={cn("scrollbar-thin blueprint-grid overflow-auto border border-line p-3 rounded-sm", panMode && "cursor-grab")}>
            <div style={{ width: `${zoom}%` }} className="mx-auto min-w-[240px] transition-[width] duration-200">
              <FloorPlan plot={communityCentrePlot} rooms={layoutARooms} ariaLabel="Shared layout A" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-center gap-2">
            <div className="flex items-center border border-line rounded-sm" role="group" aria-label="Zoom">
              <button type="button" aria-label="Zoom out" onClick={() => setZoom((z) => Math.max(60, z - 20))} className="inline-flex h-8 w-8 items-center justify-center text-muted hover:bg-highlight hover:text-ink">
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-14 border-x border-line text-center text-xs font-medium text-ink leading-8" aria-live="polite">
                {zoom}%
              </span>
              <button type="button" aria-label="Zoom in" onClick={() => setZoom((z) => Math.min(160, z + 20))} className="inline-flex h-8 w-8 items-center justify-center text-muted hover:bg-highlight hover:text-ink">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <Button variant="outline" size="icon" className="h-8 w-8" aria-label="Pan mode" aria-pressed={panMode} onClick={() => setPanMode((p) => !p)}>
              <Hand className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" aria-label="Fullscreen" onClick={() => setFullscreen(true)}>
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </Card>

        {/* Comments */}
        <Card className="flex h-fit flex-col">
          <CardHeader title={`Comments (${comments.filter((c) => !c.resolved).length})`} />
          {comments.length === 0 ? (
            <EmptyState icon={<MessageSquare />} title="No comments yet" description="Start the discussion below." />
          ) : (
            <ul className="scrollbar-thin m-0 flex max-h-[360px] list-none flex-col gap-3 overflow-y-auto p-0">
              {comments.map((c) => (
                <li key={c.id} className={cn("flex gap-2.5", c.resolved && "opacity-70")}>
                  <Avatar name={c.author} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-ink">{c.author.split(" ")[0]}</span>
                      <span className="text-[11px] text-muted">{timeAgo(c.at)}</span>
                      {c.resolved ? (
                        <Badge tone="success" size="sm">
                          Resolved
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-sm text-ink">{c.body}</p>
                  </div>
                  <DropdownMenu
                    trigger={({ ref, toggle, ...aria }) => (
                      <button ref={ref} type="button" onClick={toggle} aria-label={`Actions for comment by ${c.author}`} className="inline-flex h-7 w-7 items-center justify-center text-muted rounded-xs hover:bg-highlight hover:text-ink" {...aria}>
                        <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor" aria-hidden>
                          <circle cx="8" cy="3" r="1.4" />
                          <circle cx="8" cy="8" r="1.4" />
                          <circle cx="8" cy="13" r="1.4" />
                        </svg>
                      </button>
                    )}
                    items={[
                      { id: "resolve", label: c.resolved ? "Reopen" : "Resolve", icon: <Check />, onSelect: () => setComments((l) => l.map((x) => (x.id === c.id ? { ...x, resolved: !x.resolved } : x))) },
                      { id: "delete", label: "Delete", danger: true, separator: true, onSelect: () => setComments((l) => l.filter((x) => x.id !== c.id)) },
                    ]}
                  />
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={submitComment} className="mt-3 flex items-end gap-2">
            <Input
              aria-label="Add a comment"
              placeholder="Add a comment…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              leftIcon={<MessageSquare className="h-4 w-4" />}
              className="flex-1"
              disabled={!allowComments}
            />
            <Button type="submit" size="icon" aria-label="Send comment" disabled={!draft.trim() || !allowComments}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
          {!allowComments ? <p className="mt-1 text-[11px] text-muted">Commenting is disabled in Project Access.</p> : null}
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader title="Project Access" subtitle="Who can view and change this layout" />
          <div className="flex flex-col gap-4">
            <Select
              label="Visibility"
              value={access}
              onChange={(e) => setAccess(e.target.value)}
              options={[
                { value: "team", label: "Team only" },
                { value: "org", label: "Organization" },
                { value: "link", label: "Anyone with link" },
              ]}
            />
            <Toggle checked={allowComments} onChange={setAllowComments} label="Allow commenting" />
            <Toggle checked={allowEditing} onChange={setAllowEditing} label="Allow editing" description={allowEditing ? "Editors can modify rooms and constraints." : "Layout is read-only for editors."} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Recent Activity" />
          <ol className="relative m-0 ml-1.5 flex list-none flex-col gap-3 border-l border-line p-0 pl-4">
            {recentActivity.slice(0, 4).map((a) => (
              <li key={a.id} className="relative">
                <span className="absolute -left-[21px] top-1.5 h-2 w-2 border border-primary bg-surface" aria-hidden />
                <p className="text-sm text-ink">
                  <span className="font-medium">{a.actor.split(" ")[0]}</span> {a.action}
                  {a.target && !a.action.includes(a.target) ? <span className="text-muted"> ({a.target})</span> : null}
                </p>
                <p className="text-[11px] text-muted">{timeAgo(a.at)}</p>
              </li>
            ))}
          </ol>
        </Card>
        <Card>
          <CardHeader
            title="Versions"
            action={
              <Link href="/workspace/versions" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                View All <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
            {layoutVersions.slice(0, 3).map((v) => (
              <li key={v.id} className={cn("flex items-center gap-3 border px-3 py-2 text-sm rounded-sm", v.current ? "border-primary bg-highlight/50" : "border-line")}>
                <span className="w-9 font-semibold text-primary">{v.label}</span>
                <span className="flex-1 truncate text-ink">{v.title}</span>
                <span className="text-[11px] text-muted">{timeAgo(v.at)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Fullscreen */}
      <Modal open={fullscreen} onClose={() => setFullscreen(false)} title="Community Centre – Layout A" size="xl">
        <div className="blueprint-grid border border-line p-4 rounded-sm">
          <FloorPlan plot={communityCentrePlot} rooms={layoutARooms} ariaLabel="Shared layout A, full view" />
        </div>
      </Modal>

      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} />
      <InviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvite={(email, role) => {
          const name = email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
          setMembers((list) => [...list, { id: uid("inv"), name, access: role, pending: true }]);
          setInviteOpen(false);
          toast({ kind: "success", title: "Invitation sent (demo)", description: `${email} invited as ${role}. No email service is connected.` });
        }}
      />
    </>
  );
}

function ShareModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const [scope, setScope] = useState<"team" | "link">("team");
  const link = "https://archopt.app/share/community-centre/layout-a?v=2.3";
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast({ kind: "success", title: "Link copied" });
    } catch {
      toast({ kind: "warning", title: "Copy not available", description: "Select the link text and copy it manually." });
    }
  };
  return (
    <Modal open={open} onClose={onClose} title="Share layout" description="Share a read-only link to Community Centre – Layout A." size="sm">
      <div className="flex flex-col gap-4">
        <div className="flex items-end gap-2">
          <Input label="Share link" value={link} readOnly leftIcon={<Lock className="h-4 w-4" />} className="flex-1" onFocus={(e) => e.currentTarget.select()} />
          <Button variant="outline" leftIcon={<Copy className="h-4 w-4" />} onClick={() => void copy()}>
            Copy
          </Button>
        </div>
        <RadioGroup
          name="share-scope"
          value={scope}
          onChange={setScope}
          options={[
            { value: "team", label: "Team only", description: "Only members of this project can open the link." },
            { value: "link", label: "Anyone with the link", description: "No sign-in required to view." },
          ]}
        />
        <Checkbox checked onChange={() => {}} label="Allow viewers to download SVG" disabled />
        <p className="text-[11px] text-muted">Share links are examples for this prototype; anyone you invite would need access to the same workspace.</p>
      </div>
    </Modal>
  );
}

function InviteModal({ open, onClose, onInvite }: { open: boolean; onClose: () => void; onInvite: (email: string, role: AccessRole) => void }) {
  if (!open) return null;
  return <InviteForm onClose={onClose} onInvite={onInvite} />;
}

function InviteForm({ onClose, onInvite }: { onClose: () => void; onInvite: (email: string, role: AccessRole) => void }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AccessRole>("Editor");
  const [touched, setTouched] = useState(false);
  const error = touched ? validateEmail(email) : null;
  return (
    <Modal
      open
      onClose={onClose}
      title="Invite a collaborator"
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="invite-form" leftIcon={<Send className="h-4 w-4" />}>
            Send invite
          </Button>
        </>
      }
    >
      <form
        id="invite-form"
        noValidate
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          setTouched(true);
          if (validateEmail(email)) return;
          onInvite(email.trim(), role);
        }}
      >
        <Input label="Email address" type="email" placeholder="colleague@studio.com" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => setTouched(true)} error={error} data-autofocus required />
        <Select label="Role" value={role} onChange={(e) => setRole(e.target.value as AccessRole)} options={accessOptions} hint="Owners can manage access; editors can change rooms; viewers can comment." />
      </form>
    </Modal>
  );
}
