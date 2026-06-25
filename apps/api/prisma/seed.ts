import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 12);

  const user = await prisma.user.upsert({
    where: { email: "demo@brandnamer.com" },
    update: {},
    create: {
      email: "demo@brandnamer.com",
      passwordHash,
      name: "Demo User",
      role: "VIEWER",
      tier: "PRO",
      credits: 1000,
      subscriptions: {
        create: {
          tier: "PRO",
          creditsPerDay: 100,
          dailyCreditsUsed: 0,
        },
      },
      portfolio: { create: { displayName: "Demo User" } },
    },
  });

  console.log(`Seeded user: ${user.email} (password: password123)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
