import { PrismaClient } from "@prisma/client";
import { GenerateScheduleService } from "../src/services/timetabling/GenerateScheduleService";

const prisma = new PrismaClient();

async function main() {
    const org = await prisma.organization.findFirst();
    if (!org) return;

    const svc = new GenerateScheduleService();
    const result = await svc.execute(org.id);

    console.log("Fitness:", result.fitness);
    console.log("Errors:", result.errors);
    console.log("Unallocated Length:", result.unallocatedRequirements?.length);
    console.log("Unallocated Sample:", JSON.stringify(result.unallocatedRequirements?.slice(0, 2), null, 2));
}

main().catch(console.error);
