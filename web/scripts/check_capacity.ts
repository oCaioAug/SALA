import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const org = await prisma.organization.findFirst();
    if (!org) return;

    const cargas = await prisma.cargaHoraria.findMany({
      where: {
        turma: { organizationId: org.id },
        disciplina: { isOffGrid: false },
      },
      include: {
        turma: true,
        professor: true,
      },
    });

    const profMap = new Map<string, number>();
    const turmaMap = new Map<string, number>();

    for (const c of cargas) {
        profMap.set(c.professor.name, (profMap.get(c.professor.name) || 0) + c.quantidadeAulas);
        turmaMap.set(c.turma.name, (turmaMap.get(c.turma.name) || 0) + c.quantidadeAulas);
    }

    console.log("Professores com mais de 30 aulas:", Array.from(profMap.entries()).filter(e => e[1] > 30));
    console.log("Turmas com mais de 30 aulas:", Array.from(turmaMap.entries()).filter(e => e[1] > 30));
    
    // Also, list all professor totals
    console.log("All Professores:", Array.from(profMap.entries()));
}

main().catch(console.error);
