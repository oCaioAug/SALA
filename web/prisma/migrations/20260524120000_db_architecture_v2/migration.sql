-- Fase 2: Arquitetura DB resiliente (tenant denormalization, SaaS, índices, soft delete)

-- Enums
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELLED', 'TRIALING');

-- Plans
CREATE TABLE "plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "maxRooms" INTEGER NOT NULL DEFAULT 10,
    "maxUsers" INTEGER NOT NULL DEFAULT 50,
    "maxReservationsPerMonth" INTEGER,
    "features" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "plans_slug_key" ON "plans"("slug");

INSERT INTO "plans" ("id", "name", "slug", "maxRooms", "maxUsers", "maxReservationsPerMonth", "updatedAt")
VALUES ('plan-starter', 'Starter', 'starter', 20, 100, 5000, NOW())
ON CONFLICT DO NOTHING;

INSERT INTO "plans" ("id", "name", "slug", "maxRooms", "maxUsers", "maxReservationsPerMonth", "updatedAt")
VALUES ('plan-enterprise', 'Enterprise', 'enterprise', 999, 9999, NULL, NOW())
ON CONFLICT DO NOTHING;

-- Organization extensions
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "settings" JSONB;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "planId" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- Organization members extensions
ALTER TABLE "organization_members" ADD COLUMN IF NOT EXISTS "invitedById" TEXT;
ALTER TABLE "organization_members" ADD COLUMN IF NOT EXISTS "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Users soft delete
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- Rooms soft delete
ALTER TABLE "rooms" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- Reservations: organizationId
ALTER TABLE "reservations" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

UPDATE "reservations" r
SET "organizationId" = rm."organizationId"
FROM "rooms" rm
WHERE r."roomId" = rm.id AND r."organizationId" IS NULL;

-- Incidents: organizationId
ALTER TABLE "incidents" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

UPDATE "incidents" i
SET "organizationId" = rm."organizationId"
FROM "rooms" rm
WHERE i."roomId" = rm.id AND i."organizationId" IS NULL;

UPDATE "incidents" i
SET "organizationId" = om."organizationId"
FROM "organization_members" om
WHERE i."organizationId" IS NULL
  AND i."reportedById" = om."userId"
  AND om."createdAt" = (
    SELECT MIN(om2."createdAt") FROM "organization_members" om2 WHERE om2."userId" = i."reportedById"
  );

UPDATE "incidents" i
SET "organizationId" = (SELECT id FROM "organizations" WHERE slug = 'sala-default' LIMIT 1)
WHERE i."organizationId" IS NULL;

-- Notifications: organizationId
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

UPDATE "notifications" n
SET "organizationId" = om."organizationId"
FROM "organization_members" om
WHERE n."userId" = om."userId"
AND n."organizationId" IS NULL
AND om."organizationId" = (
  SELECT om2."organizationId" FROM "organization_members" om2
  WHERE om2."userId" = n."userId"
  ORDER BY om2."createdAt" ASC LIMIT 1
);

-- Items: organizationId
ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

UPDATE "items" it
SET "organizationId" = rm."organizationId"
FROM "rooms" rm
WHERE it."roomId" = rm.id AND it."organizationId" IS NULL;

-- Subscriptions table
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "externalId" TEXT,
    "currentPeriodStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "subscriptions_organizationId_key" ON "subscriptions"("organizationId");

INSERT INTO "subscriptions" ("id", "organizationId", "planId", "status", "currentPeriodEnd", "updatedAt")
SELECT 'sub-' || o.id, o.id, 'plan-starter', 'ACTIVE'::"SubscriptionStatus", NOW() + INTERVAL '1 year', NOW()
FROM "organizations" o
WHERE o."deletedAt" IS NULL
ON CONFLICT ("organizationId") DO NOTHING;

UPDATE "organizations" o SET "planId" = 'plan-starter' WHERE o."planId" IS NULL;

-- Organization invites
CREATE TABLE "organization_invites" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "OrganizationRole" NOT NULL DEFAULT 'MEMBER',
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "invitedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "organization_invites_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "organization_invites_token_key" ON "organization_invites"("token");
CREATE UNIQUE INDEX "organization_invites_organizationId_email_key" ON "organization_invites"("organizationId", "email");
CREATE INDEX "organization_invites_email_idx" ON "organization_invites"("email");
CREATE INDEX "organization_invites_expiresAt_idx" ON "organization_invites"("expiresAt");

-- Audit logs
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "actorUserId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "audit_logs_organizationId_createdAt_idx" ON "audit_logs"("organizationId", "createdAt");
CREATE INDEX "audit_logs_actorUserId_idx" ON "audit_logs"("actorUserId");
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- Daily stats
CREATE TABLE "organization_daily_stats" (
    "organizationId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "reservationsCount" INTEGER NOT NULL DEFAULT 0,
    "activeUsersCount" INTEGER NOT NULL DEFAULT 0,
    "openIncidentsCount" INTEGER NOT NULL DEFAULT 0,
    "roomsCount" INTEGER NOT NULL DEFAULT 0,
    "membersCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "organization_daily_stats_pkey" PRIMARY KEY ("organizationId","date")
);

-- NOT NULL constraints (after backfill)
ALTER TABLE "reservations" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "incidents" ALTER COLUMN "organizationId" SET NOT NULL;

-- Foreign keys
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "organization_invites" ADD CONSTRAINT "organization_invites_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "organization_invites" ADD CONSTRAINT "organization_invites_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "organization_daily_stats" ADD CONSTRAINT "organization_daily_stats_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Indexes
CREATE INDEX IF NOT EXISTS "organizations_ownerId_idx" ON "organizations"("ownerId");
CREATE INDEX IF NOT EXISTS "organizations_status_idx" ON "organizations"("status");
CREATE INDEX IF NOT EXISTS "organizations_deletedAt_idx" ON "organizations"("deletedAt");
CREATE INDEX IF NOT EXISTS "organization_members_organizationId_role_idx" ON "organization_members"("organizationId", "role");
CREATE INDEX IF NOT EXISTS "users_platformRole_idx" ON "users"("platformRole");
CREATE INDEX IF NOT EXISTS "users_deletedAt_idx" ON "users"("deletedAt");
CREATE INDEX IF NOT EXISTS "rooms_organizationId_status_idx" ON "rooms"("organizationId", "status");
CREATE INDEX IF NOT EXISTS "rooms_deletedAt_idx" ON "rooms"("deletedAt");
CREATE INDEX IF NOT EXISTS "items_roomId_idx" ON "items"("roomId");
CREATE INDEX IF NOT EXISTS "items_organizationId_idx" ON "items"("organizationId");
CREATE INDEX IF NOT EXISTS "images_itemId_idx" ON "images"("itemId");
CREATE INDEX IF NOT EXISTS "reservations_organizationId_startTime_idx" ON "reservations"("organizationId", "startTime");
CREATE INDEX IF NOT EXISTS "reservations_organizationId_status_idx" ON "reservations"("organizationId", "status");
CREATE INDEX IF NOT EXISTS "reservations_roomId_status_startTime_endTime_idx" ON "reservations"("roomId", "status", "startTime", "endTime");
CREATE INDEX IF NOT EXISTS "reservations_userId_startTime_idx" ON "reservations"("userId", "startTime");
CREATE INDEX IF NOT EXISTS "reservations_recurringTemplateId_idx" ON "reservations"("recurringTemplateId");
CREATE INDEX IF NOT EXISTS "reservations_status_startTime_idx" ON "reservations"("status", "startTime");
CREATE INDEX IF NOT EXISTS "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");
CREATE INDEX IF NOT EXISTS "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "notifications_organizationId_createdAt_idx" ON "notifications"("organizationId", "createdAt");
CREATE INDEX IF NOT EXISTS "incidents_organizationId_status_idx" ON "incidents"("organizationId", "status");
CREATE INDEX IF NOT EXISTS "incidents_organizationId_createdAt_idx" ON "incidents"("organizationId", "createdAt");
CREATE INDEX IF NOT EXISTS "incidents_organizationId_priority_idx" ON "incidents"("organizationId", "priority");
CREATE INDEX IF NOT EXISTS "incidents_reportedById_idx" ON "incidents"("reportedById");
CREATE INDEX IF NOT EXISTS "incidents_assignedToId_idx" ON "incidents"("assignedToId");
CREATE INDEX IF NOT EXISTS "incidents_roomId_idx" ON "incidents"("roomId");
CREATE INDEX IF NOT EXISTS "incident_status_history_incidentId_idx" ON "incident_status_history"("incidentId");
CREATE INDEX IF NOT EXISTS "push_tokens_userId_isActive_idx" ON "push_tokens"("userId", "isActive");
CREATE INDEX IF NOT EXISTS "accounts_user_id_idx" ON "accounts"("user_id");
CREATE INDEX IF NOT EXISTS "sessions_user_id_idx" ON "sessions"("user_id");
CREATE INDEX IF NOT EXISTS "sessions_expires_idx" ON "sessions"("expires");
CREATE INDEX IF NOT EXISTS "subscriptions_planId_idx" ON "subscriptions"("planId");
CREATE INDEX IF NOT EXISTS "subscriptions_status_idx" ON "subscriptions"("status");

-- Backfill daily stats (snapshot inicial)
INSERT INTO "organization_daily_stats" (
  "organizationId", "date", "reservationsCount", "activeUsersCount",
  "openIncidentsCount", "roomsCount", "membersCount", "updatedAt"
)
SELECT
  o.id,
  CURRENT_DATE,
  (SELECT COUNT(*)::int FROM reservations r WHERE r."organizationId" = o.id),
  (SELECT COUNT(DISTINCT r."userId")::int FROM reservations r WHERE r."organizationId" = o.id AND r."startTime" >= NOW() - INTERVAL '30 days'),
  (SELECT COUNT(*)::int FROM incidents i WHERE i."organizationId" = o.id AND i.status NOT IN ('RESOLVED', 'CANCELLED')),
  (SELECT COUNT(*)::int FROM rooms rm WHERE rm."organizationId" = o.id AND rm."deletedAt" IS NULL),
  (SELECT COUNT(*)::int FROM organization_members om WHERE om."organizationId" = o.id),
  NOW()
FROM organizations o
WHERE o."deletedAt" IS NULL
ON CONFLICT ("organizationId", "date") DO UPDATE SET
  "reservationsCount" = EXCLUDED."reservationsCount",
  "activeUsersCount" = EXCLUDED."activeUsersCount",
  "openIncidentsCount" = EXCLUDED."openIncidentsCount",
  "roomsCount" = EXCLUDED."roomsCount",
  "membersCount" = EXCLUDED."membersCount",
  "updatedAt" = NOW();
