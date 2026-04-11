import { z } from "zod";

function optionalIntCreate() {
  return z
    .union([z.number(), z.string(), z.null()])
    .optional()
    .transform(val => {
      if (val === undefined || val === null || val === "") return null;
      const n = typeof val === "string" ? parseInt(val, 10) : val;
      return Number.isFinite(n) ? n : null;
    });
}

function optionalIntUpdate() {
  return z
    .union([z.number(), z.string(), z.null()])
    .optional()
    .transform(val => {
      if (val === undefined) return undefined;
      if (val === null || val === "") return null;
      const n = typeof val === "string" ? parseInt(val, 10) : val;
      return Number.isFinite(n) ? n : null;
    });
}

export const roomCreateBodySchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  description: z.string().nullable().optional(),
  capacity: optionalIntCreate(),
  locationDescription: z.string().nullable().optional(),
  outletCount: optionalIntCreate(),
  climateControlled: z.boolean().optional(),
  status: z.enum(["LIVRE", "EM_USO", "RESERVADO"]).optional(),
});

export const roomUpdateBodySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  capacity: optionalIntUpdate(),
  locationDescription: z.string().nullable().optional(),
  outletCount: optionalIntUpdate(),
  climateControlled: z.boolean().optional(),
  status: z.enum(["LIVRE", "EM_USO", "RESERVADO"]).optional(),
});

export type RoomCreateBody = z.infer<typeof roomCreateBodySchema>;
export type RoomUpdateBody = z.infer<typeof roomUpdateBodySchema>;
