-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rollNo" INTEGER NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Record" (
    "id" TEXT NOT NULL,
    "time" INTEGER NOT NULL,
    "rounds" JSONB,
    "rollNo" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Round" (
    "id" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "time" INTEGER,
    "value" TEXT,
    "metadata" JSONB,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Round_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_rollNo_key" ON "User"("rollNo");

-- CreateIndex
CREATE INDEX "User_id_name_rollNo_idx" ON "User"("id", "name", "rollNo");

-- CreateIndex
CREATE UNIQUE INDEX "Record_rollNo_key" ON "Record"("rollNo");

-- CreateIndex
CREATE INDEX "Record_id_time_rollNo_idx" ON "Record"("id", "time", "rollNo");

-- CreateIndex
CREATE INDEX "Round_userId_roundNumber_idx" ON "Round"("userId", "roundNumber");

-- AddForeignKey
ALTER TABLE "Record" ADD CONSTRAINT "Record_rollNo_fkey" FOREIGN KEY ("rollNo") REFERENCES "User"("rollNo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Round" ADD CONSTRAINT "Round_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
