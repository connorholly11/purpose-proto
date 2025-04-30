-- CreateTable
CREATE TABLE "SummarizationLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SummarizationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SummarizationLog_userId_idx" ON "SummarizationLog"("userId");

-- CreateIndex
CREATE INDEX "SummarizationLog_status_idx" ON "SummarizationLog"("status");

-- CreateIndex
CREATE INDEX "SummarizationLog_createdAt_idx" ON "SummarizationLog"("createdAt");

-- AddForeignKey
ALTER TABLE "SummarizationLog" ADD CONSTRAINT "SummarizationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("clerkId") ON DELETE RESTRICT ON UPDATE CASCADE;
