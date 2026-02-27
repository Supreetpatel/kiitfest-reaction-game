import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  try {
    const all = await prisma.round.findMany({ select: { id: true, userId: true, roundNumber: true } });
    const map = new Map();
    for (const r of all) {
      const key = `${r.userId}::${r.roundNumber}`;
      map.set(key, (map.get(key) || 0) + 1);
    }
    const dups = [...map.entries()].filter(([, c]) => c > 1);
    if (dups.length === 0) console.log('No duplicates'); else console.log('Duplicates:', dups);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
check();
