import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    const org = await prisma.organization.findFirst();
    if (!org) return;

    const cargas = await prisma.cargaHoraria.findMany({
      where: { turma: { organizationId: org.id }, disciplina: { isOffGrid: false } },
      include: { turma: true, professor: true }
    });

    const turmaMap = new Map<string, number>();
    for (const c of cargas) {
        turmaMap.set(c.turma.name, (turmaMap.get(c.turma.name) || 0) + c.quantidadeAulas);
    }
    
    console.log("All Turmas:", Array.from(turmaMap.entries()));
}

main().catch(console.error);
