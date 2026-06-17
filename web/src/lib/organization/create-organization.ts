import {
  OrganizationRole,
  OrganizationStatus,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { slugifyOrganizationName } from "@/lib/validations/admin";

import { refreshOrganizationDailyStats } from "./stats";

const DEFAULT_PLAN_ID = "plan-starter";
const DEFAULT_TRIAL_DAYS = 30;

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
};

async function createOrganizationWithOwnerInTx(
  tx: TxClient,
  input: CreateOrganizationInput,
  slug: string,
  status: OrganizationStatus,
  periodEnd: Date,
  planId: string
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
    },
  });

  await tx.subscription.create({
    data: {
      organizationId: org.id,
      planId,
      currentPeriodEnd: periodEnd,
    },
  });

  await tx.organizationMember.create({
    data: {
      organizationId: org.id,
      userId: input.ownerId,
      role: OrganizationRole.OWNER,
    },
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
  const periodEnd = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);

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
      planId
    );
  }

  const organization = await prisma.$transaction(async tx =>
    createOrganizationWithOwnerInTx(tx, input, slug, status, periodEnd, planId)
  );

  void refreshOrganizationDailyStats(organization.id);
  return organization;
}
