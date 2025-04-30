-- AlterTable
ALTER TABLE "Evaluation" ADD COLUMN     "evaluationMode" TEXT NOT NULL DEFAULT 'optimize_good';

-- CreateIndex
CREATE INDEX "Evaluation_evaluationMode_idx" ON "Evaluation"("evaluationMode");
