-- Manual migration: add unique constraint to Round(userId, roundNumber)
ALTER TABLE "Round" ADD CONSTRAINT "userId_roundNumber" UNIQUE ("userId", "roundNumber");
