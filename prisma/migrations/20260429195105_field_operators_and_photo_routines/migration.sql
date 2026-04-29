-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'FIELD_OPERATOR';

-- AlterTable
ALTER TABLE "field_photos" ADD COLUMN     "submissionId" UUID,
ALTER COLUMN "fieldUpdateId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "origins" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "archivedById" UUID;

-- CreateTable
CREATE TABLE "field_operators" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "originId" UUID NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "field_operators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "photo_routines" (
    "id" UUID NOT NULL,
    "fieldPlotId" UUID NOT NULL,
    "cadenceDays" INTEGER NOT NULL DEFAULT 7,
    "minPhotosPerCycle" INTEGER NOT NULL DEFAULT 3,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "instructions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "photo_routines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "photo_submissions" (
    "id" UUID NOT NULL,
    "fieldPlotId" UUID NOT NULL,
    "submittedById" UUID NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cycleStart" TIMESTAMP(3) NOT NULL,
    "cycleEnd" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "photo_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "field_operators_userId_key" ON "field_operators"("userId");

-- CreateIndex
CREATE INDEX "field_operators_originId_idx" ON "field_operators"("originId");

-- CreateIndex
CREATE UNIQUE INDEX "photo_routines_fieldPlotId_key" ON "photo_routines"("fieldPlotId");

-- CreateIndex
CREATE INDEX "photo_submissions_fieldPlotId_submittedAt_idx" ON "photo_submissions"("fieldPlotId", "submittedAt");

-- CreateIndex
CREATE INDEX "photo_submissions_cycleStart_cycleEnd_idx" ON "photo_submissions"("cycleStart", "cycleEnd");

-- CreateIndex
CREATE INDEX "field_photos_submissionId_idx" ON "field_photos"("submissionId");

-- CreateIndex
CREATE INDEX "origins_archivedAt_idx" ON "origins"("archivedAt");

-- AddForeignKey
ALTER TABLE "origins" ADD CONSTRAINT "origins_archivedById_fkey" FOREIGN KEY ("archivedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_operators" ADD CONSTRAINT "field_operators_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_operators" ADD CONSTRAINT "field_operators_originId_fkey" FOREIGN KEY ("originId") REFERENCES "origins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photo_routines" ADD CONSTRAINT "photo_routines_fieldPlotId_fkey" FOREIGN KEY ("fieldPlotId") REFERENCES "field_plots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photo_submissions" ADD CONSTRAINT "photo_submissions_fieldPlotId_fkey" FOREIGN KEY ("fieldPlotId") REFERENCES "field_plots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photo_submissions" ADD CONSTRAINT "photo_submissions_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_photos" ADD CONSTRAINT "field_photos_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "photo_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
