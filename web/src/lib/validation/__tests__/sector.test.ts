import {
  resolveSectorMembersInput,
  sectorMemberCapabilitiesSchema,
} from "@/lib/validation/sector";

describe("sector member validation", () => {
  it("rejects a member with no capabilities", () => {
    const parsed = sectorMemberCapabilitiesSchema.safeParse({
      userId: "user-1",
      canApproveReservations: false,
      canManageRooms: false,
    });
    expect(parsed.success).toBe(false);
  });

  it("prefers members over memberUserIds", () => {
    const members = resolveSectorMembersInput({
      members: [
        {
          userId: "user-1",
          canApproveReservations: true,
          canManageRooms: false,
        },
      ],
      memberUserIds: ["user-2"],
    });
    expect(members).toEqual([
      {
        userId: "user-1",
        canApproveReservations: true,
        canManageRooms: false,
      },
    ]);
  });

  it("maps memberUserIds to all capabilities on", () => {
    const members = resolveSectorMembersInput({
      memberUserIds: ["user-1"],
    });
    expect(members).toEqual([
      {
        userId: "user-1",
        canApproveReservations: true,
        canManageRooms: true,
      },
    ]);
  });
});
