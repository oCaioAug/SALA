import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.findFirst({ where: { isSchool: true } });
  if (!org) return;

  const profs = await prisma.professor.findMany({
    where: { organizationId: org.id },
    include: {
      disponibilidades: true,
      cargasHorarias: true
    }
  });

  for (const p of profs) {
    const avail = p.disponibilidades.length;
    const required = p.cargasHorarias.reduce((acc, ch) => acc + ch.quantidadeAulas, 0);
    if (required > avail) {
      console.log(`Prof ${p.name} needs ${required} slots but only has ${avail} available!`);
    } else if (required === avail) {
      console.log(`Prof ${p.name} needs EXACTLY ${required} slots (has ${avail}). VERY TIGHT.`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
