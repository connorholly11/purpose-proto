-- CreateTable
CREATE TABLE "UserGameState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clarityScore" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "driveScore" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "relationshipScore" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "emotionalBalanceScore" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "resilienceScore" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "selfAwarenessScore" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "connectionScore" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "scoreReasoning" JSONB,
    "lastCalculated" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserGameState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserGameState_userId_key" ON "UserGameState"("userId");

-- CreateIndex
CREATE INDEX "UserGameState_userId_idx" ON "UserGameState"("userId");

-- AddForeignKey
ALTER TABLE "UserGameState" ADD CONSTRAINT "UserGameState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("clerkId") ON DELETE RESTRICT ON UPDATE CASCADE;
