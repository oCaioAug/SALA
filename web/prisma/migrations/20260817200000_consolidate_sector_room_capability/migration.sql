-- Consolidate canEditRooms + canManageItems into canManageRooms (if split flags were applied)
ALTER TABLE "sector_members" ADD COLUMN IF NOT EXISTS "canManageRooms" BOOLEAN NOT NULL DEFAULT true;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'sector_members'
      AND column_name = 'canEditRooms'
  ) THEN
    UPDATE "sector_members"
    SET "canManageRooms" = ("canEditRooms" OR "canManageItems");
    ALTER TABLE "sector_members" DROP COLUMN "canEditRooms";
    ALTER TABLE "sector_members" DROP COLUMN "canManageItems";
  END IF;
END $$;
