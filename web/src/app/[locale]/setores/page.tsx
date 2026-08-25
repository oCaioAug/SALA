"use client";

import { Archive, Network, Plus, Search, UserPlus, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import React, { useCallback, useEffect, useMemo, useState } from "react";

import { OrgAdminGuard } from "@/components/auth/OrgAdminGuard";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardTitle } from "@/components/ui/Card";
import { Drawer } from "@/components/ui/Drawer";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
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

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
  const [draftMembers, setDraftMembers] = useState<SectorMember[]>([]);
  const [memberUserId, setMemberUserId] = useState("");
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
    if (isDirty && !confirm(t("confirmDiscard"))) return;
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

  const handleArchive = async (sector: Sector) => {
    const roomCount = sector.rooms?.length ?? sector._count?.rooms ?? 0;
    if (
      !confirm(t("confirmArchive", { name: sector.name, count: roomCount }))
    ) {
      return;
    }
    try {
      const myId = session?.user?.id;
      const affectsCurrentUser =
        !!myId && sector.members.some(m => m.userId === myId);
      const res = await fetch(`/api/sectors/${sector.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || t("errors.archive"));
      }
      showSuccess(t("feedback.archived"));
      await loadData();
      if (affectsCurrentUser) {
        await updateSession();
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : t("errors.archive"));
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
                        <Archive className="h-4 w-4" />
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
          size="lg"
        >
          <div className="space-y-5">
            <p className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200">
              {editing ? t("drawerHintEdit") : t("drawerHintCreate")}
            </p>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg border border-slate-200 bg-white px-2 py-2 dark:border-slate-700 dark:bg-slate-900/50">
                <p className="font-semibold text-slate-900 dark:text-white">
                  1. {t("checklistBasics")}
                </p>
                <p className="mt-0.5 text-slate-500">
                  {name.trim() ? t("checklistReady") : t("checklistPending")}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white px-2 py-2 dark:border-slate-700 dark:bg-slate-900/50">
                <p className="font-semibold text-slate-900 dark:text-white">
                  2. {t("checklistRooms")}
                </p>
                <p className="mt-0.5 text-slate-500">
                  {selectedRoomIds.length > 0
                    ? t("roomsSelected", { count: selectedRoomIds.length })
                    : t("checklistPending")}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white px-2 py-2 dark:border-slate-700 dark:bg-slate-900/50">
                <p className="font-semibold text-slate-900 dark:text-white">
                  3. {t("checklistMembers")}
                </p>
                <p className="mt-0.5 text-slate-500">
                  {draftMembers.length > 0
                    ? t("membersCount", { count: draftMembers.length })
                    : t("checklistPending")}
                </p>
              </div>
            </div>

            <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white dark:bg-slate-100 dark:text-slate-900">
                  1
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {t("sectionBasicsTitle")}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t("sectionBasicsHelp")}
                  </p>
                </div>
              </div>
              <Input
                label={t("nameLabel")}
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={t("namePlaceholder")}
                required
              />
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t("descriptionLabel")}
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder={t("descriptionPlaceholder")}
                  rows={2}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </section>

            <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/40">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                    2
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {t("sectionRoomsTitle")}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t("sectionRoomsHelp")}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                  {t("roomsSelected", { count: selectedRoomIds.length })}
                </span>
              </div>

              <div className="max-h-52 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2 dark:border-slate-700">
                {roomsForSelect.length === 0 ? (
                  <p className="px-2 py-6 text-center text-sm text-slate-500">
                    {t("noRooms")}
                  </p>
                ) : (
                  roomsForSelect.map(room => (
                    <label
                      key={room.id}
                      className={`flex items-start gap-3 rounded-lg px-2 py-2 text-sm transition-colors ${
                        room.disabled
                          ? "cursor-not-allowed opacity-55"
                          : selectedRoomIds.includes(room.id)
                            ? "cursor-pointer bg-blue-50 dark:bg-blue-500/15"
                            : "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5"
                        checked={selectedRoomIds.includes(room.id)}
                        disabled={room.disabled}
                        onChange={() => toggleRoom(room.id)}
                      />
                      <span className="min-w-0">
                        <span className="block font-medium text-slate-900 dark:text-white">
                          {room.name}
                        </span>
                        {room.otherSectorName ? (
                          <span className="block text-xs text-amber-700 dark:text-amber-300">
                            {t("assignedToSector", {
                              name: room.otherSectorName,
                            })}
                          </span>
                        ) : null}
                      </span>
                    </label>
                  ))
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {editing ? t("roomsSaveHintEdit") : t("roomsSaveHintCreate")}
              </p>
              {selectedRoomIds.length > 0 ? (
                <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                  {t("roomsManageEffect")}
                </p>
              ) : null}
            </section>

            <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/40">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-semibold text-white">
                    3
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {t("sectionMembersTitle")}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t("sectionMembersHelp")}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                  {t("membersCount", {
                    count: draftMembers.length,
                  })}
                </span>
              </div>

              {draftMembers.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-300 px-3 py-4 text-center text-sm text-slate-500 dark:border-slate-600">
                  {t("noMembersYet")}
                </p>
              ) : (
                <ul className="space-y-2">
                  {draftMembers.map(member => (
                    <li
                      key={member.userId}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
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
                          className="ml-2 rounded-md p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                          aria-label={t("removeMember")}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-2 flex flex-col gap-1.5">
                        <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                          <input
                            type="checkbox"
                            checked={member.canApproveReservations}
                            onChange={() =>
                              toggleMemberCapability(
                                member.userId,
                                "canApproveReservations"
                              )
                            }
                            className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          {t("capabilityApprove")}
                        </label>
                        <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                          <input
                            type="checkbox"
                            checked={member.canManageRooms}
                            onChange={() =>
                              toggleMemberCapability(
                                member.userId,
                                "canManageRooms"
                              )
                            }
                            className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          {t("capabilityManageRooms")}
                        </label>
                      </div>
                      {!memberHasAnyCapability(member) ? (
                        <p className="mt-1.5 text-xs text-amber-700 dark:text-amber-300">
                          {t("capabilityRequiredHint")}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}

              <div className="space-y-2 rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  {t("addMemberLabel")}
                </p>
                <div className="flex gap-2">
                  <select
                    value={memberUserId}
                    onChange={e => setMemberUserId(e.target.value)}
                    className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="">{t("selectMember")}</option>
                    {memberCandidates.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name ? `${u.name} (${u.email})` : u.email}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    onClick={handleAddMember}
                    disabled={!memberUserId}
                    className="inline-flex items-center gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    {t("addMember")}
                  </Button>
                </div>
                {memberCandidates.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    {t("noMemberCandidates")}
                  </p>
                ) : null}
                <p className="text-xs text-slate-500">{t("addMemberHint")}</p>
              </div>
            </section>

            <div className="sticky bottom-0 flex gap-3 border-t border-slate-200 bg-white pt-4 dark:border-slate-700 dark:bg-slate-900">
              <Button className="flex-1" onClick={handleSave} disabled={saving}>
                {saving
                  ? t("saving")
                  : editing
                    ? t("saveChanges")
                    : t("createSubmit")}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={requestCloseDrawer}
              >
                {t("cancel")}
              </Button>
            </div>
          </div>
        </Drawer>
      </PageLayout>
    </OrgAdminGuard>
  );
};

export default SetoresPage;
