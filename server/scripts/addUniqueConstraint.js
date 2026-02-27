import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addConstraint() {
  try {
    console.log('Adding UNIQUE constraint on ("userId","roundNumber")...');
    // Use raw SQL to add unique constraint
    await prisma.$executeRawUnsafe('ALTER TABLE "Round" ADD CONSTRAINT "userId_roundNumber" UNIQUE ("userId","roundNumber");');
    console.log('Constraint added');
  } catch (e) {
    console.error('Failed to add constraint:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addConstraint();
