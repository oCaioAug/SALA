import {
  OrganizationRole,
  OrganizationStatus,
  Prisma,
  SubscriptionStatus,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { slugifyOrganizationName } from "@/lib/validations/admin";

import { refreshOrganizationDailyStats } from "./stats";

const DEFAULT_PLAN_ID = "plan-starter";
const DEFAULT_TRIAL_DAYS = 30;
const ACTIVE_PERIOD_DAYS = 365;

type TxClient = Prisma.TransactionClient;

export type CreateOrganizationInput = {
  name: string;
  legalName?: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  slug?: string;
  ownerId: string;
  status?: OrganizationStatus;
  trialDays?: number;
  planId?: string;
  isSchool?: boolean;
};

function resolveSubscriptionForStatus(
  status: OrganizationStatus,
  trialDays: number
): { periodEnd: Date; subscriptionStatus: SubscriptionStatus } {
  const now = Date.now();
  if (status === OrganizationStatus.TRIAL) {
    return {
      periodEnd: new Date(now + trialDays * 24 * 60 * 60 * 1000),
      subscriptionStatus: SubscriptionStatus.TRIALING,
    };
  }
  if (status === OrganizationStatus.SUSPENDED) {
    return {
      periodEnd: new Date(now + ACTIVE_PERIOD_DAYS * 24 * 60 * 60 * 1000),
      subscriptionStatus: SubscriptionStatus.CANCELLED,
    };
  }
  return {
    periodEnd: new Date(now + ACTIVE_PERIOD_DAYS * 24 * 60 * 60 * 1000),
    subscriptionStatus: SubscriptionStatus.ACTIVE,
  };
}

async function createOrganizationWithOwnerInTx(
  tx: TxClient,
  input: CreateOrganizationInput,
  slug: string,
  status: OrganizationStatus,
  periodEnd: Date,
  planId: string,
  subscriptionStatus: SubscriptionStatus
) {
  const org = await tx.organization.create({
    data: {
      name: input.name,
      legalName: input.legalName,
      cnpj: input.cnpj,
      email: input.email,
      phone: input.phone,
      slug,
      status,
      ownerId: input.ownerId,
      planId,
      ...(input.isSchool !== undefined ? { isSchool: input.isSchool } : {}),
    },
  });

  await tx.subscription.create({
    data: {
      organizationId: org.id,
      planId,
      status: subscriptionStatus,
      currentPeriodEnd: periodEnd,
    },
  });

  await tx.organizationMember.upsert({
    where: {
      organizationId_userId: {
        organizationId: org.id,
        userId: input.ownerId,
      },
    },
    create: {
      organizationId: org.id,
      userId: input.ownerId,
      role: OrganizationRole.OWNER,
    },
    update: { role: OrganizationRole.OWNER },
  });

  return org;
}

export async function createOrganizationWithOwner(
  input: CreateOrganizationInput,
  existingTx?: TxClient
) {
  let slug = input.slug ?? slugifyOrganizationName(input.name);
  if (!slug) slug = `org-${Date.now()}`;

  const db = existingTx ?? prisma;
  const slugExists = await db.organization.findUnique({ where: { slug } });
  if (slugExists) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const status = input.status ?? OrganizationStatus.TRIAL;
  const trialDays = input.trialDays ?? DEFAULT_TRIAL_DAYS;
  const { periodEnd, subscriptionStatus } = resolveSubscriptionForStatus(
    status,
    trialDays
  );

  const planId = input.planId ?? DEFAULT_PLAN_ID;
  const plan = await db.plan.findFirst({
    where: { id: planId, isActive: true },
    select: { id: true },
  });
  if (!plan) {
    throw new Error("INVALID_PLAN");
  }

  if (existingTx) {
    return createOrganizationWithOwnerInTx(
      existingTx,
      input,
      slug,
      status,
      periodEnd,
      planId,
      subscriptionStatus
    );
  }

  const organization = await prisma.$transaction(async tx =>
    createOrganizationWithOwnerInTx(
      tx,
      input,
      slug,
      status,
      periodEnd,
      planId,
      subscriptionStatus
    )
  );

  void refreshOrganizationDailyStats(organization.id);
  return organization;
}
