const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.expense.deleteMany();
  console.log('Deleted all expenses');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
