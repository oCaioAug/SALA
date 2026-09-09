import { PrismaClient } from "@prisma/client";
import { injectMockData } from "../src/app/[locale]/grade-horaria/seed";

const prisma = new PrismaClient();

async function run() {
   const org = await prisma.organization.findFirst();
   if (!org) return;

   console.log("Injetando novos mocks para org:", org.id);
   await injectMockData(org.id);
   console.log("Concluido!");
}
run().catch(console.error);
