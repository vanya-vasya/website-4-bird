// One-off: backfill Activity rows from existing esim_purchase transactions.
// Usage: DATABASE_URL=... npx tsx scripts/backfill-esim-activity.ts
import { PrismaClient } from "@prisma/client";
import { destinations, buildPlans } from "../constants/destinations";

const prisma = new PrismaClient();

const main = async () => {
  const purchases = await prisma.transaction.findMany({
    where: { type: "esim_purchase" },
    orderBy: { createdAt: "asc" },
  });
  console.log(`Found ${purchases.length} esim_purchase transactions`);

  for (const tx of purchases) {
    const existing = await prisma.activity.findUnique({
      where: { transactionId: tx.id },
    });
    if (existing) {
      console.log(`skip ${tx.id} — Activity already exists`);
      continue;
    }

    // description: "FastBird eSIM — Japan 5 GB / 30 days (2 Points)"
    const m = tx.description?.match(
      /^FastBird eSIM — (.+) (\d+ GB) \/ (\d+) days \((\d+) Points\)$/
    );
    if (!m) {
      console.log(`skip ${tx.id} — unparseable description: ${tx.description}`);
      continue;
    }

    const [, destName, planData, validityDays, points] = m;
    const dest = destinations.find((d) => d.name === destName);

    await prisma.activity.create({
      data: {
        userId: tx.userId,
        destination: destName,
        destinationSlug: dest?.slug ?? destName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        planData,
        validityDays: parseInt(validityDays, 10),
        points: parseInt(points, 10),
        transactionId: tx.id,
        createdAt: tx.paid_at ?? tx.createdAt,
      },
    });
    console.log(`backfilled ${tx.id}: ${destName} ${planData}`);
  }

  const total = await prisma.activity.count();
  console.log(`Done. Activity rows total: ${total}`);
};

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
