import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    const org = await prisma.organization.findFirst();
    if (!org) return;

    const prof = await prisma.professor.findFirst({
        where: { name: "Carla" },
        include: { disponibilidades: true }
    });

    console.log(`Carla has ${prof?.disponibilidades.length} disponibilidades`);
}

main().catch(console.error);
