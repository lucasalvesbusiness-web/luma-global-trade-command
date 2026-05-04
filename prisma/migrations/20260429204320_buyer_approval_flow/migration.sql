-- CreateEnum
CREATE TYPE "BuyerApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'BLOCKED');

-- AlterTable
ALTER TABLE "buyer_companies" ADD COLUMN     "approvalStatus" "BuyerApprovalStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedById" UUID,
ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "onboardingCompletedAt" TIMESTAMP(3),
ADD COLUMN     "productsOfInterest" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "targetMarkets" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "taxId" TEXT;

-- CreateIndex
CREATE INDEX "buyer_companies_approvalStatus_idx" ON "buyer_companies"("approvalStatus");

-- AddForeignKey
ALTER TABLE "buyer_companies" ADD CONSTRAINT "buyer_companies_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
