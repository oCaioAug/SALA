import { GenerateScheduleService } from "../src/services/timetabling/GenerateScheduleService";

async function main() {
  const orgId = "org-sala-default"; // I should fetch the orgId somehow, or just get the first school org
  const { prisma } = require("../src/lib/prisma");
  
  const org = await prisma.organization.findFirst({
    where: { isSchool: true }
  });
  
  if (!org) {
    console.error("No school org found");
    return;
  }
  
  const service = new GenerateScheduleService();
  const res = await service.execute(org.id);
  
  console.log(`Fitness: ${res.fitness.toFixed(2)}%`);
  if (res.unallocatedRequirements) {
    console.log("Unallocated:", res.unallocatedRequirements.length);
    res.unallocatedRequirements.forEach((u: any) => {
      console.log(`- Turma: ${u.turmaId}, Prof: ${u.professorId}, Disc: ${u.disciplinaId}, Missing: ${u.requiredSlots}`);
    });
  }
  if (res.errors) {
    console.log("Errors:");
    console.log(res.errors);
  }
}

main().catch(console.error);
