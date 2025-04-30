-- CreateTable
CREATE TABLE "UserActivePrompt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "promptId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserActivePrompt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserActivePrompt_userId_key" ON "UserActivePrompt"("userId");

-- CreateIndex
CREATE INDEX "UserActivePrompt_userId_idx" ON "UserActivePrompt"("userId");

-- CreateIndex
CREATE INDEX "UserActivePrompt_promptId_idx" ON "UserActivePrompt"("promptId");

-- AddForeignKey
ALTER TABLE "UserActivePrompt" ADD CONSTRAINT "UserActivePrompt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("clerkId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserActivePrompt" ADD CONSTRAINT "UserActivePrompt_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "SystemPrompt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
