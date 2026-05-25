import { OrganizationRole, OrganizationStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { slugifyOrganizationName } from "@/lib/validations/admin";

import { refreshOrganizationDailyStats } from "./stats";

const DEFAULT_PLAN_ID = "plan-starter";
const DEFAULT_TRIAL_DAYS = 30;

export type CreateOrganizationInput = {
  name: string;
  slug?: string;
  ownerId: string;
  status?: OrganizationStatus;
  trialDays?: number;
};

export async function createOrganizationWithOwner(
  input: CreateOrganizationInput
) {
  let slug = input.slug ?? slugifyOrganizationName(input.name);
  if (!slug) slug = `org-${Date.now()}`;

  const slugExists = await prisma.organization.findUnique({ where: { slug } });
  if (slugExists) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const status = input.status ?? OrganizationStatus.TRIAL;
  const trialDays = input.trialDays ?? DEFAULT_TRIAL_DAYS;
  const periodEnd = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);

  const organization = await prisma.$transaction(async tx => {
    const org = await tx.organization.create({
      data: {
        name: input.name,
        slug,
        status,
        ownerId: input.ownerId,
        planId: DEFAULT_PLAN_ID,
      },
    });

    await tx.subscription.create({
      data: {
        organizationId: org.id,
        planId: DEFAULT_PLAN_ID,
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
  });

  void refreshOrganizationDailyStats(organization.id);
  return organization;
}
