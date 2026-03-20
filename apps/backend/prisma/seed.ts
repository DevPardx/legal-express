import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'demo@legalexpress.com' },
    update: {},
    create: {
      email: 'demo@legalexpress.com',
      firstName: 'Demo',
      lastName: 'User',
    },
  });

  await prisma.matter.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      title: 'Test Matter',
      description: 'A test matter for development',
      userId: user.id,
    },
  });

  console.log('Seed data created');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());