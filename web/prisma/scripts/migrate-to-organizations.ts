/**
 * Script de migração de dados para multi-tenancy.
 * Executado automaticamente pela migration SQL; use este script
 * manualmente apenas se precisar re-aplicar a lógica de bootstrap.
 *
 * Uso: npx tsx prisma/scripts/migrate-to-organizations.ts
 */
import {
  OrganizationRole,
  PlatformRole,
  PrismaClient,
  Role,
} from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_ORG_ID = "org-sala-default";
const DEFAULT_ORG_SLUG = "sala-default";

async function main() {
  console.log("[migrate] Iniciando migração para organizações...");

  const existingOrg = await prisma.organization.findUnique({
    where: { slug: DEFAULT_ORG_SLUG },
  });

  if (existingOrg) {
    console.log("[migrate] Organização default já existe, pulando bootstrap.");
    return;
  }

  const adminUser =
    (await prisma.user.findUnique({ where: { email: "admin@sala.com" } })) ??
    (await prisma.user.findFirst({ orderBy: { createdAt: "asc" } }));

  if (!adminUser) {
    console.log("[migrate] Nenhum usuário encontrado, nada a migrar.");
    return;
  }

  const org = await prisma.organization.create({
    data: {
      id: DEFAULT_ORG_ID,
      name: "SALA Default",
      slug: DEFAULT_ORG_SLUG,
      ownerId: adminUser.id,
    },
  });

  console.log("[migrate] Organização criada:", org.slug);

  const users = await prisma.user.findMany();
  for (const user of users) {
    const orgRole =
      user.id === adminUser.id
        ? OrganizationRole.OWNER
        : user.role === Role.ADMIN
          ? OrganizationRole.ADMIN
          : OrganizationRole.MEMBER;

    await prisma.organizationMember.upsert({
      where: {
        organizationId_userId: {
          organizationId: org.id,
          userId: user.id,
        },
      },
      create: {
        organizationId: org.id,
        userId: user.id,
        role: orgRole,
      },
      update: { role: orgRole },
    });
  }

  const roomsUpdated = await prisma.room.updateMany({
    where: { organizationId: { not: org.id } },
    data: { organizationId: org.id },
  });
  console.log("[migrate] Salas vinculadas:", roomsUpdated.count);

  await prisma.user.update({
    where: { email: "admin@sala.com" },
    data: { platformRole: PlatformRole.SUPER_ADMIN },
  });

  console.log("[migrate] admin@sala.com definido como SUPER_ADMIN");
  console.log("[migrate] Migração concluída.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
