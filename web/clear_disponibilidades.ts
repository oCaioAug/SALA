import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.disponibilidade.deleteMany({});
  console.log('Deleted all disponibilidades');
}
main().catch(console.error).finally(() => prisma.$disconnect());
