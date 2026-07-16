import {
  IncidentPriority,
  IncidentStatus,
  OrganizationRole,
  OrganizationStatus,
  PlatformRole,
  SubscriptionStatus,
} from "@prisma/client";
import { z } from "zod";

import {
  organizationEmailSchema,
  organizationPhoneSchema,
} from "@/lib/validations/organization";

export const createOrganizationSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug inválido")
    .optional(),
  status: z.nativeEnum(OrganizationStatus).default(OrganizationStatus.ACTIVE),
  ownerEmail: z.string().email(),
  ownerName: z.string().min(2).max(120).optional(),
  isSchool: z.boolean().default(false).optional(),
});

export const updateOrganizationSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  status: z.nativeEnum(OrganizationStatus).optional(),
  logo: z.string().url().nullable().optional(),
  planId: z.string().min(1).optional(),
  email: organizationEmailSchema.nullable().optional(),
  phone: organizationPhoneSchema.nullable().optional(),
  isSchool: z.boolean().optional(),
});

export const updateMemberRoleSchema = z.object({
  role: z.nativeEnum(OrganizationRole),
});

export const addMemberSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(120).optional(),
  role: z.nativeEnum(OrganizationRole).default(OrganizationRole.MEMBER),
});

export const updateSubscriptionSchema = z.object({
  planId: z.string().min(1).optional(),
  status: z.nativeEnum(SubscriptionStatus).optional(),
  currentPeriodEnd: z.coerce.date().optional(),
});

export const updatePlatformRoleSchema = z.object({
  platformRole: z.nativeEnum(PlatformRole),
});

export const planSchema = z.object({
  name: z.string().min(2).max(80),
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug inválido"),
  maxRooms: z.coerce.number().int().min(1).max(10000),
  maxUsers: z.coerce.number().int().min(1).max(100000),
  maxReservationsPerMonth: z.coerce.number().int().min(1).nullable().optional(),
  isActive: z.boolean().default(true),
});

export const planUpdateSchema = planSchema.partial();

export const auditLogQuerySchema = z.object({
  organizationId: z.string().optional(),
  action: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(30),
});

export const adminUsersQuerySchema = z.object({
  search: z.string().optional(),
  platformRole: z.nativeEnum(PlatformRole).optional(),
  includeDeleted: z.coerce.boolean().optional(),
});

export const organizationListQuerySchema = z.object({
  search: z.string().optional(),
  status: z.nativeEnum(OrganizationStatus).optional(),
  planId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const adminIncidentsQuerySchema = z.object({
  search: z.string().optional(),
  status: z.nativeEnum(IncidentStatus).optional(),
  priority: z.nativeEnum(IncidentPriority).optional(),
  organizationId: z.string().optional(),
  scope: z.enum(["open", "resolved", "all"]).default("open"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const adminIncidentUpdateSchema = z.object({
  status: z.nativeEnum(IncidentStatus).optional(),
  priority: z.nativeEnum(IncidentPriority).optional(),
  assignedToId: z.string().nullable().optional(),
  resolutionNotes: z.string().max(5000).nullable().optional(),
});

export const adminBillingQuerySchema = z.object({
  search: z.string().optional(),
  status: z.nativeEnum(SubscriptionStatus).optional(),
  planId: z.string().optional(),
  scope: z.enum(["all", "active", "attention", "cancelled"]).default("all"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export function slugifyOrganizationName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
