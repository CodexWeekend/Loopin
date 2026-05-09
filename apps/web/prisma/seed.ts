import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.user.upsert({
    create: {
      email: 'demo@loopin.local',
      name: 'Demo Traveler',
      profile: {
        create: {
          avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
          firstName: 'Demo',
          interests: 'food,culture,nightlife',
          lastName: 'Traveler',
          travelStyle: 'balanced',
        },
      },
    },
    update: {},
    where: {
      email: 'demo@loopin.local',
    },
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
