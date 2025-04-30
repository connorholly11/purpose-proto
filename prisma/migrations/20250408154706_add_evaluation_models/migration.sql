-- CreateTable
CREATE TABLE "PersonaScenario" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "messages" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonaScenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evaluation" (
    "id" TEXT NOT NULL,
    "promptId" TEXT NOT NULL,
    "personaId" TEXT NOT NULL,
    "conversation" JSONB NOT NULL,
    "scores" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PersonaScenario_name_key" ON "PersonaScenario"("name");

-- CreateIndex
CREATE INDEX "Evaluation_promptId_idx" ON "Evaluation"("promptId");

-- CreateIndex
CREATE INDEX "Evaluation_personaId_idx" ON "Evaluation"("personaId");

-- CreateIndex
CREATE INDEX "Evaluation_createdAt_idx" ON "Evaluation"("createdAt");

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "PersonaScenario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
