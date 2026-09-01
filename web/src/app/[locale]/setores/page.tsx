"use client";

import {
  Check,
  ClipboardCheck,
  DoorOpen,
  Network,
  Plus,
  Search,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import React, { useCallback, useEffect, useMemo, useState } from "react";

import { OrgAdminGuard } from "@/components/auth/OrgAdminGuard";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardTitle } from "@/components/ui/Card";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Drawer } from "@/components/ui/Drawer";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { useApp } from "@/lib/hooks/useApp";
import { useNavigation } from "@/lib/hooks/useNavigation";

type SectorRoom = { id: string; name: string; status: string };
type SectorMember = {
  id: string;
  userId: string;
  role: string;
  canApproveReservations: boolean;
  canManageRooms: boolean;
  user: {
    id: string;
    name: string | null;
    email: string;
    image?: string | null;
  };
};

const defaultMemberCaps = {
  canApproveReservations: true,
  canManageRooms: true,
};

function withMemberCaps(
  member: Omit<SectorMember, "canApproveReservations" | "canManageRooms"> &
    Partial<Pick<SectorMember, "canApproveReservations" | "canManageRooms">> & {
      canEditRooms?: boolean;
      canManageItems?: boolean;
    }
): SectorMember {
  let canManageRooms = member.canManageRooms;
  if (canManageRooms === undefined) {
    if (
      member.canEditRooms !== undefined ||
      member.canManageItems !== undefined
    ) {
      canManageRooms = Boolean(member.canEditRooms || member.canManageItems);
    } else {
      canManageRooms = defaultMemberCaps.canManageRooms;
    }
  }

  return {
    ...member,
    canApproveReservations:
      member.canApproveReservations ?? defaultMemberCaps.canApproveReservations,
    canManageRooms,
  };
}

function membersSignature(members: SectorMember[]) {
  return [...members]
    .map(
      m =>
        `${m.userId}:${Number(m.canApproveReservations)}:${Number(m.canManageRooms)}`
    )
    .sort()
    .join("|");
}

function memberHasAnyCapability(member: SectorMember) {
  return member.canApproveReservations || member.canManageRooms;
}
type Sector = {
  id: string;
  name: string;
  description: string | null;
  rooms: SectorRoom[];
  members: SectorMember[];
  _count?: { members: number; rooms: number };
};
type OrgUser = { id: string; name: string | null; email: string };
type OrgRoom = {
  id: string;
  name: string;
  sectorId?: string | null;
  sector?: { id: string; name: string } | null;
};

const SetoresPage: React.FC = () => {
  const t = useTranslations("SetoresPage");
  const { data: session, update: updateSession } = useSession();
  const { showSuccess, showError } = useApp();
  const [currentPage, setCurrentPage] = useState("setores");
  const { navigate, isNavigating } = useNavigation({
    currentPage,
    onPageChange: setCurrentPage,
  });

  const [sectors, setSectors] = useState<Sector[]>([]);
  const [rooms, setRooms] = useState<OrgRoom[]>([]);
  const [users, setUsers] = useState<OrgUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Sector | null>(null);
  const [saving, setSaving] = useState(false);
  const [sectorToArchive, setSectorToArchive] = useState<Sector | null>(null);
  const [archiving, setArchiving] = useState(false);
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
  const [draftMembers, setDraftMembers] = useState<SectorMember[]>([]);
  const [memberUserId, setMemberUserId] = useState("");
  const [roomSearch, setRoomSearch] = useState("");
  const [baseline, setBaseline] = useState({
    name: "",
    description: "",
    roomIds: [] as string[],
    membersKey: "",
  });

  const sortedIds = (ids: string[]) => [...ids].sort().join(",");

  const isDirty = useMemo(() => {
    return (
      name.trim() !== baseline.name ||
      (description.trim() || "") !== baseline.description ||
      sortedIds(selectedRoomIds) !== sortedIds(baseline.roomIds) ||
      membersSignature(draftMembers) !== baseline.membersKey
    );
  }, [name, description, selectedRoomIds, draftMembers, baseline]);

  const captureBaseline = (next: {
    name: string;
    description: string;
    roomIds: string[];
    members: SectorMember[];
  }) => {
    setBaseline({
      name: next.name.trim(),
      description: next.description.trim(),
      roomIds: [...next.roomIds],
      membersKey: membersSignature(next.members),
    });
  };

  const requestCloseDrawer = () => {
    if (isDirty) {
      setDiscardConfirmOpen(true);
      return;
    }
    setDrawerOpen(false);
  };

  const confirmDiscardDrawer = () => {
    setDiscardConfirmOpen(false);
    setDrawerOpen(false);
  };

  const loadData = useCallback(
    async (opts?: { silent?: boolean }) => {
      try {
        if (!opts?.silent) setLoading(true);
        const [sectorsRes, roomsRes, usersRes] = await Promise.all([
          fetch("/api/sectors"),
          fetch("/api/rooms"),
          fetch("/api/users"),
        ]);
        if (!sectorsRes.ok) throw new Error(t("errors.load"));
        const sectorsData = await sectorsRes.json();
        setSectors(
          Array.isArray(sectorsData)
            ? sectorsData.map((sector: Sector) => ({
                ...sector,
                members: (sector.members ?? []).map(withMemberCaps),
              }))
            : []
        );
        if (roomsRes.ok) {
          const roomsData = await roomsRes.json();
          setRooms(Array.isArray(roomsData) ? roomsData : []);
        }
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setUsers(Array.isArray(usersData) ? usersData : []);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : t("errors.load");
        showError(msg);
      } finally {
        if (!opts?.silent) setLoading(false);
      }
    },
    [showError, t]
  );

  useEffect(() => {
    if (session?.user?.email) {
      void loadData();
    }
  }, [session?.user?.email, loadData]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return sectors;
    return sectors.filter(
      s =>
        s.name.toLowerCase().includes(q) ||
        (s.description ?? "").toLowerCase().includes(q)
    );
  }, [sectors, searchTerm]);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setDescription("");
    setSelectedRoomIds([]);
    setDraftMembers([]);
    setMemberUserId("");
    setRoomSearch("");
    captureBaseline({
      name: "",
      description: "",
      roomIds: [],
      members: [],
    });
    setDrawerOpen(true);
  };

  const openEdit = (sector: Sector) => {
    const roomIds = sector.rooms.map(r => r.id);
    const members = (sector.members ?? []).map(withMemberCaps);
    setEditing(sector);
    setName(sector.name);
    setDescription(sector.description ?? "");
    setSelectedRoomIds(roomIds);
    setDraftMembers(members);
    setMemberUserId("");
    setRoomSearch("");
    captureBaseline({
      name: sector.name,
      description: sector.description ?? "",
      roomIds,
      members,
    });
    setDrawerOpen(true);
  };

  const roomsForSelect = useMemo(() => {
    return rooms.map(room => {
      const otherSector =
        room.sectorId &&
        room.sectorId !== editing?.id &&
        !selectedRoomIds.includes(room.id);
      return {
        ...room,
        disabled: Boolean(otherSector),
        otherSectorName: otherSector
          ? room.sector?.name || t("otherSector")
          : null,
      };
    });
  }, [rooms, editing?.id, selectedRoomIds, t]);

  const filteredRoomsForSelect = useMemo(() => {
    const q = roomSearch.trim().toLowerCase();
    if (!q) return roomsForSelect;
    return roomsForSelect.filter(
      room =>
        room.name.toLowerCase().includes(q) ||
        (room.otherSectorName ?? "").toLowerCase().includes(q)
    );
  }, [roomsForSelect, roomSearch]);

  const stepBasicsDone = name.trim().length > 0;
  const stepRoomsDone = selectedRoomIds.length > 0;
  const stepMembersDone = draftMembers.length > 0;

  const toggleRoom = (roomId: string) => {
    setSelectedRoomIds(prev =>
      prev.includes(roomId)
        ? prev.filter(id => id !== roomId)
        : [...prev, roomId]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showError(t("errors.nameRequired"));
      return;
    }
    if (draftMembers.some(m => !memberHasAnyCapability(m))) {
      showError(t("errors.memberNeedsCapability"));
      return;
    }
    setSaving(true);
    try {
      const membersPayload = draftMembers.map(m => ({
        userId: m.userId,
        canApproveReservations: m.canApproveReservations,
        canManageRooms: m.canManageRooms,
      }));
      const myId = session?.user?.id;
      const wasMember =
        !!myId && (editing?.members.some(m => m.userId === myId) ?? false);
      const willBeMember = !!myId && draftMembers.some(m => m.userId === myId);
      const previousMe = editing?.members.find(m => m.userId === myId);
      const nextMe = draftMembers.find(m => m.userId === myId);
      const myCapsChanged =
        Boolean(previousMe) &&
        Boolean(nextMe) &&
        membersSignature([withMemberCaps(previousMe!)]) !==
          membersSignature([nextMe!]);
      const membershipChanged = wasMember !== willBeMember || myCapsChanged;

      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        roomIds: selectedRoomIds,
        members: membersPayload,
      };
      const res = editing
        ? await fetch(`/api/sectors/${editing.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/sectors", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || t("errors.save"));
      }

      showSuccess(
        editing
          ? `${t("feedback.updated")}. ${t("feedback.memberRefreshHint")}`
          : `${t("feedback.created")}. ${t("feedback.memberRefreshHint")}`
      );
      setDrawerOpen(false);
      setSaving(false);

      // Refresh list/session after UI closes so "Salvando..." does not linger.
      void (async () => {
        try {
          await loadData({ silent: true });
          if (membershipChanged) {
            await updateSession();
          }
        } catch {
          // List/session refresh failures should not block the save UX.
        }
      })();
    } catch (err) {
      showError(err instanceof Error ? err.message : t("errors.save"));
      setSaving(false);
    }
  };

  const handleArchive = (sector: Sector) => {
    setSectorToArchive(sector);
  };

  const confirmArchiveSector = async () => {
    if (!sectorToArchive) return;
    setArchiving(true);
    try {
      const myId = session?.user?.id;
      const affectsCurrentUser =
        !!myId && sectorToArchive.members.some(m => m.userId === myId);
      const res = await fetch(`/api/sectors/${sectorToArchive.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || t("errors.archive"));
      }
      showSuccess(t("feedback.archived"));
      setSectorToArchive(null);
      await loadData();
      if (affectsCurrentUser) {
        await updateSession();
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : t("errors.archive"));
    } finally {
      setArchiving(false);
    }
  };

  const handleAddMember = () => {
    if (!memberUserId) return;
    if (draftMembers.some(m => m.userId === memberUserId)) return;
    const user = users.find(u => u.id === memberUserId);
    if (!user) {
      showError(t("errors.addMember"));
      return;
    }
    setDraftMembers(prev => [
      ...prev,
      {
        id: `draft-${user.id}`,
        userId: user.id,
        role: "MANAGER",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        ...defaultMemberCaps,
      },
    ]);
    setMemberUserId("");
  };

  const handleRemoveMember = (userId: string) => {
    setDraftMembers(prev => prev.filter(m => m.userId !== userId));
  };

  const toggleMemberCapability = (
    userId: string,
    field: "canApproveReservations" | "canManageRooms"
  ) => {
    setDraftMembers(prev =>
      prev.map(member =>
        member.userId === userId
          ? { ...member, [field]: !member[field] }
          : member
      )
    );
  };

  const memberCandidates = users.filter(
    u => !draftMembers.some(m => m.userId === u.id)
  );

  return (
    <OrgAdminGuard>
      <PageLayout
        currentPage="setores"
        onNavigate={navigate}
        isNavigating={isNavigating}
      >
        <div className="mb-6 sm:mb-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="mb-2 text-xl font-semibold text-foreground sm:text-2xl">
                  {t("title")}
                </h1>
                <p className="text-slate-600 dark:text-gray-400">
                  {t("subtitle")}
                </p>
              </div>
            </div>
            <Button
              onClick={openCreate}
              className="inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {t("create")}
            </Button>
          </div>

          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[30vh] items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Network className="h-8 w-8 text-slate-400" />}
            title={
              searchTerm.trim() ? t("emptySearchTitle") : t("emptyTitle")
            }
            description={
              searchTerm.trim()
                ? t("emptySearchDescription")
                : t("emptyDescription")
            }
            action={
              searchTerm.trim()
                ? undefined
                : {
                    label: t("create"),
                    onClick: openCreate,
                  }
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map(sector => (
              <Card
                key={sector.id}
                className="border-slate-200 dark:border-slate-700"
              >
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">{sector.name}</CardTitle>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(sector)}
                      >
                        {t("manage")}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleArchive(sector)}
                        aria-label={t("archive")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {sector.description ? (
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {sector.description}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span>
                      {t("roomsCount", {
                        count:
                          sector.rooms?.length ?? sector._count?.rooms ?? 0,
                      })}
                    </span>
                    <span>
                      {t("membersCount", {
                        count:
                          sector.members?.length ?? sector._count?.members ?? 0,
                      })}
                    </span>
                  </div>
                  {(sector.rooms?.length ?? 0) === 0 &&
                  (sector.members?.length ?? 0) === 0 ? (
                    <p className="rounded-lg border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
                      {t("cardEmptyHint")}
                    </p>
                  ) : null}
                  {sector.members?.length > 0 ? (
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {t("managersLabel")}:{" "}
                      {sector.members
                        .slice(0, 3)
                        .map(m => m.user.name || m.user.email)
                        .join(", ")}
                      {sector.members.length > 3
                        ? ` +${sector.members.length - 3}`
                        : ""}
                    </p>
                  ) : null}
                  {sector.rooms?.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {sector.rooms.slice(0, 4).map(room => (
                        <span
                          key={room.id}
                          className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                        >
                          {room.name}
                        </span>
                      ))}
                      {sector.rooms.length > 4 ? (
                        <span className="text-xs text-slate-500">
                          +{sector.rooms.length - 4}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Drawer
          isOpen={drawerOpen}
          onClose={requestCloseDrawer}
          title={editing ? t("drawerEditTitle") : t("drawerCreateTitle")}
          description={
            editing
              ? t("drawerSubtitleEdit", { name: editing.name })
              : t("drawerHintCreate")
          }
          size="lg"
          footer={
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500 dark:text-slate-400 sm:max-w-[45%]">
                {isDirty ? t("unsavedChangesHint") : t("allSavedHint")}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 sm:flex-none"
                  onClick={requestCloseDrawer}
                >
                  {t("cancel")}
                </Button>
                <Button
                  className="flex-1 sm:min-w-[10rem] sm:flex-none"
                  onClick={handleSave}
                  disabled={saving || !name.trim()}
                >
                  {saving
                    ? t("saving")
                    : editing
                      ? t("saveChanges")
                      : t("createSubmit")}
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-8">
            <nav aria-label={t("progressLabel")} className="flex gap-2">
              {(
                [
                  {
                    label: t("checklistBasics"),
                    done: stepBasicsDone,
                  },
                  {
                    label: t("checklistRooms"),
                    done: stepRoomsDone,
                    meta: stepRoomsDone
                      ? t("roomsSelected", { count: selectedRoomIds.length })
                      : undefined,
                  },
                  {
                    label: t("checklistMembers"),
                    done: stepMembersDone,
                    meta: stepMembersDone
                      ? t("membersCount", { count: draftMembers.length })
                      : undefined,
                  },
                ] as const
              ).map((step, index) => (
                <div
                  key={step.label}
                  className="flex min-w-0 flex-1 items-center gap-2"
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                      step.done
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {step.done ? <Check className="h-3.5 w-3.5" /> : index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-slate-900 dark:text-white">
                      {step.label}
                    </p>
                    <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                      {"meta" in step && step.meta
                        ? step.meta
                        : step.done
                          ? t("checklistReady")
                          : t("checklistPending")}
                    </p>
                  </div>
                </div>
              ))}
            </nav>

            <section className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  {t("sectionBasicsTitle")}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t("sectionBasicsHelp")}
                </p>
              </div>
              <Input
                label={t("nameLabel")}
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={t("namePlaceholder")}
                required
              />
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t("descriptionLabel")}
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder={t("descriptionPlaceholder")}
                  rows={2}
                  className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-2.5">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                    <DoorOpen className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {t("sectionRoomsTitle")}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t("sectionRoomsHelp")}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium tabular-nums text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                  {t("roomsSelected", { count: selectedRoomIds.length })}
                </span>
              </div>

              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  value={roomSearch}
                  onChange={e => setRoomSearch(e.target.value)}
                  placeholder={t("roomSearchPlaceholder")}
                  className="h-9 w-full rounded-md border border-input bg-card py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div className="max-h-56 space-y-0.5 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700">
                {filteredRoomsForSelect.length === 0 ? (
                  <p className="px-3 py-8 text-center text-sm text-slate-500">
                    {roomsForSelect.length === 0
                      ? t("noRooms")
                      : t("roomSearchEmpty")}
                  </p>
                ) : (
                  filteredRoomsForSelect.map(room => {
                    const selected = selectedRoomIds.includes(room.id);
                    return (
                      <label
                        key={room.id}
                        className={`flex items-start gap-3 border-b border-slate-100 px-3 py-2.5 text-sm last:border-b-0 dark:border-slate-800 ${
                          room.disabled
                            ? "cursor-not-allowed opacity-50"
                            : selected
                              ? "cursor-pointer bg-slate-50 dark:bg-slate-800/80"
                              : "cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                          checked={selected}
                          disabled={room.disabled}
                          onChange={() => toggleRoom(room.id)}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium text-slate-900 dark:text-white">
                            {room.name}
                          </span>
                          {room.otherSectorName ? (
                            <span className="mt-0.5 block text-xs text-amber-700 dark:text-amber-300">
                              {t("assignedToSector", {
                                name: room.otherSectorName,
                              })}
                            </span>
                          ) : null}
                        </span>
                        {selected && !room.disabled ? (
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        ) : null}
                      </label>
                    );
                  })
                )}
              </div>
              {selectedRoomIds.length > 0 ? (
                <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  {t("roomsManageEffect")}
                </p>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {editing ? t("roomsSaveHintEdit") : t("roomsSaveHintCreate")}
                </p>
              )}
            </section>

            <section className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-2.5">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                    <Users className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {t("sectionMembersTitle")}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t("sectionMembersHelp")}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium tabular-nums text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                  {t("membersCount", { count: draftMembers.length })}
                </span>
              </div>

              {draftMembers.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-300 px-3 py-6 text-center text-sm text-slate-500 dark:border-slate-600">
                  {t("noMembersYet")}
                </p>
              ) : (
                <ul className="space-y-2">
                  {draftMembers.map(member => (
                    <li
                      key={member.userId}
                      className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900/50"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-900 dark:text-white">
                            {member.user.name || member.user.email}
                          </p>
                          {member.user.name ? (
                            <p className="truncate text-xs text-slate-500">
                              {member.user.email}
                            </p>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(member.userId)}
                          className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                          aria-label={t("removeMember")}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <label
                          className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                            member.canApproveReservations
                              ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-200"
                              : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={member.canApproveReservations}
                            onChange={() =>
                              toggleMemberCapability(
                                member.userId,
                                "canApproveReservations"
                              )
                            }
                            className="h-3.5 w-3.5 shrink-0 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 dark:border-slate-500"
                          />
                          <ClipboardCheck className="h-3.5 w-3.5 shrink-0" />
                          {t("capabilityApprove")}
                        </label>
                        <label
                          className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                            member.canManageRooms
                              ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-200"
                              : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={member.canManageRooms}
                            onChange={() =>
                              toggleMemberCapability(
                                member.userId,
                                "canManageRooms"
                              )
                            }
                            className="h-3.5 w-3.5 shrink-0 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 dark:border-slate-500"
                          />
                          <DoorOpen className="h-3.5 w-3.5 shrink-0" />
                          {t("capabilityManageRooms")}
                        </label>
                      </div>
                      {!memberHasAnyCapability(member) ? (
                        <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                          {t("capabilityRequiredHint")}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}

              <div className="space-y-2 rounded-xl border border-slate-200 border-dashed p-3 dark:border-slate-600">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  {t("addMemberLabel")}
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <SearchableSelect
                    value={memberUserId}
                    onChange={setMemberUserId}
                    options={memberCandidates.map(u => ({
                      value: u.id,
                      label: u.name ? `${u.name} (${u.email})` : u.email,
                    }))}
                    placeholder={t("selectMember")}
                    allowEmpty
                    className="min-w-0 flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handleAddMember}
                    disabled={!memberUserId}
                    className="inline-flex shrink-0 items-center justify-center gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    {t("addMember")}
                  </Button>
                </div>
                {memberCandidates.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    {t("noMemberCandidates")}
                  </p>
                ) : (
                  <p className="text-xs text-slate-500">{t("addMemberHint")}</p>
                )}
              </div>
            </section>
          </div>
        </Drawer>

        <ConfirmModal
          isOpen={!!sectorToArchive}
          variant="destructive"
          title={t("archiveConfirmTitle")}
          description={
            sectorToArchive
              ? t("confirmArchive", {
                  name: sectorToArchive.name,
                  count:
                    sectorToArchive.rooms?.length ??
                    sectorToArchive._count?.rooms ??
                    0,
                })
              : ""
          }
          confirmLabel={t("archiveConfirmAction")}
          cancelLabel={t("cancel")}
          loading={archiving}
          onConfirm={() => {
            void confirmArchiveSector();
          }}
          onCancel={() => {
            if (!archiving) setSectorToArchive(null);
          }}
        />

        <ConfirmModal
          isOpen={discardConfirmOpen}
          title={t("discardConfirmTitle")}
          description={t("confirmDiscard")}
          confirmLabel={t("discardConfirmAction")}
          cancelLabel={t("cancel")}
          onConfirm={confirmDiscardDrawer}
          onCancel={() => setDiscardConfirmOpen(false)}
        />
      </PageLayout>
    </OrgAdminGuard>
  );
};

export default SetoresPage;
