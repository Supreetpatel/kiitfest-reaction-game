import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function dedupe() {
  try {
    console.log('Finding duplicate round rows (JS dedupe)...');
    const all = await prisma.round.findMany({ orderBy: { createdAt: 'asc' } });
    const seen = new Map();
    const toDelete = [];
    for (const r of all) {
      const key = `${r.userId}::${r.roundNumber}`;
      if (!seen.has(key)) {
        seen.set(key, r.id);
      } else {
        toDelete.push(r.id);
      }
    }
    if (toDelete.length > 0) {
      const res = await prisma.round.deleteMany({ where: { id: { in: toDelete } } });
      console.log('Deleted duplicates count:', res.count);
    } else {
      console.log('No duplicates found');
    }
  } catch (e) {
    console.error('Error deduping rounds:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

dedupe();
