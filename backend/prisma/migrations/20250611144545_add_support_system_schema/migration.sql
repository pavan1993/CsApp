/*
  Warnings:

  - You are about to drop the `customers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `interactions` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "TicketSeverity" AS ENUM ('CRITICAL', 'SEVERE', 'MODERATE', 'LOW');

-- DropForeignKey
ALTER TABLE "interactions" DROP CONSTRAINT "interactions_customerId_fkey";

-- DropTable
DROP TABLE "customers";

-- DropTable
DROP TABLE "interactions";

-- DropEnum
DROP TYPE "CustomerStatus";

-- DropEnum
DROP TYPE "InteractionType";

-- CreateTable
CREATE TABLE "support_tickets" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "requested" TIMESTAMP(3) NOT NULL,
    "organization" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "updated" TIMESTAMP(3) NOT NULL,
    "assignee" TEXT,
    "requester" TEXT NOT NULL,
    "product_area" TEXT NOT NULL,
    "reason_for_contact" TEXT NOT NULL,
    "severity" "TicketSeverity" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dynatrace_usage" (
    "id" TEXT NOT NULL,
    "capability" TEXT NOT NULL,
    "annual_budget_cost" DECIMAL(12,2) NOT NULL,
    "last_30_days_cost" DECIMAL(12,2) NOT NULL,
    "organization" TEXT NOT NULL,
    "upload_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dynatrace_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_area_mapping" (
    "id" TEXT NOT NULL,
    "product_area" TEXT NOT NULL,
    "dynatrace_capability" TEXT NOT NULL,
    "organization" TEXT NOT NULL,
    "is_key_module" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_area_mapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "threshold_configuration" (
    "id" TEXT NOT NULL,
    "organization" TEXT NOT NULL,
    "product_area" TEXT NOT NULL,
    "severity_level" "TicketSeverity" NOT NULL,
    "ticket_threshold" INTEGER NOT NULL,
    "usage_drop_threshold" DECIMAL(5,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "threshold_configuration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "technical_debt_analysis" (
    "id" TEXT NOT NULL,
    "organization" TEXT NOT NULL,
    "product_area" TEXT NOT NULL,
    "analysis_date" TIMESTAMP(3) NOT NULL,
    "ticket_count_by_severity" JSONB NOT NULL,
    "usage_metrics" JSONB NOT NULL,
    "debt_score" DECIMAL(5,2) NOT NULL,
    "recommendations" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "technical_debt_analysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_TicketThreshold" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_UsageCapability" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_TicketProductArea" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_MappingThreshold" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_DebtProductArea" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "support_tickets_organization_product_area_idx" ON "support_tickets"("organization", "product_area");

-- CreateIndex
CREATE INDEX "support_tickets_severity_status_idx" ON "support_tickets"("severity", "status");

-- CreateIndex
CREATE INDEX "support_tickets_requested_idx" ON "support_tickets"("requested");

-- CreateIndex
CREATE INDEX "support_tickets_organization_status_severity_idx" ON "support_tickets"("organization", "status", "severity");

-- CreateIndex
CREATE INDEX "dynatrace_usage_organization_capability_idx" ON "dynatrace_usage"("organization", "capability");

-- CreateIndex
CREATE INDEX "dynatrace_usage_upload_date_idx" ON "dynatrace_usage"("upload_date");

-- CreateIndex
CREATE INDEX "dynatrace_usage_organization_upload_date_idx" ON "dynatrace_usage"("organization", "upload_date");

-- CreateIndex
CREATE INDEX "product_area_mapping_organization_product_area_idx" ON "product_area_mapping"("organization", "product_area");

-- CreateIndex
CREATE INDEX "product_area_mapping_dynatrace_capability_idx" ON "product_area_mapping"("dynatrace_capability");

-- CreateIndex
CREATE UNIQUE INDEX "product_area_mapping_product_area_dynatrace_capability_orga_key" ON "product_area_mapping"("product_area", "dynatrace_capability", "organization");

-- CreateIndex
CREATE INDEX "threshold_configuration_organization_product_area_idx" ON "threshold_configuration"("organization", "product_area");

-- CreateIndex
CREATE UNIQUE INDEX "threshold_configuration_organization_product_area_severity__key" ON "threshold_configuration"("organization", "product_area", "severity_level");

-- CreateIndex
CREATE INDEX "technical_debt_analysis_organization_product_area_idx" ON "technical_debt_analysis"("organization", "product_area");

-- CreateIndex
CREATE INDEX "technical_debt_analysis_analysis_date_idx" ON "technical_debt_analysis"("analysis_date");

-- CreateIndex
CREATE INDEX "technical_debt_analysis_organization_analysis_date_idx" ON "technical_debt_analysis"("organization", "analysis_date");

-- CreateIndex
CREATE INDEX "technical_debt_analysis_debt_score_idx" ON "technical_debt_analysis"("debt_score");

-- CreateIndex
CREATE UNIQUE INDEX "_TicketThreshold_AB_unique" ON "_TicketThreshold"("A", "B");

-- CreateIndex
CREATE INDEX "_TicketThreshold_B_index" ON "_TicketThreshold"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_UsageCapability_AB_unique" ON "_UsageCapability"("A", "B");

-- CreateIndex
CREATE INDEX "_UsageCapability_B_index" ON "_UsageCapability"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_TicketProductArea_AB_unique" ON "_TicketProductArea"("A", "B");

-- CreateIndex
CREATE INDEX "_TicketProductArea_B_index" ON "_TicketProductArea"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_MappingThreshold_AB_unique" ON "_MappingThreshold"("A", "B");

-- CreateIndex
CREATE INDEX "_MappingThreshold_B_index" ON "_MappingThreshold"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_DebtProductArea_AB_unique" ON "_DebtProductArea"("A", "B");

-- CreateIndex
CREATE INDEX "_DebtProductArea_B_index" ON "_DebtProductArea"("B");

-- AddForeignKey
ALTER TABLE "_TicketThreshold" ADD CONSTRAINT "_TicketThreshold_A_fkey" FOREIGN KEY ("A") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TicketThreshold" ADD CONSTRAINT "_TicketThreshold_B_fkey" FOREIGN KEY ("B") REFERENCES "threshold_configuration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UsageCapability" ADD CONSTRAINT "_UsageCapability_A_fkey" FOREIGN KEY ("A") REFERENCES "dynatrace_usage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UsageCapability" ADD CONSTRAINT "_UsageCapability_B_fkey" FOREIGN KEY ("B") REFERENCES "product_area_mapping"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TicketProductArea" ADD CONSTRAINT "_TicketProductArea_A_fkey" FOREIGN KEY ("A") REFERENCES "product_area_mapping"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TicketProductArea" ADD CONSTRAINT "_TicketProductArea_B_fkey" FOREIGN KEY ("B") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MappingThreshold" ADD CONSTRAINT "_MappingThreshold_A_fkey" FOREIGN KEY ("A") REFERENCES "product_area_mapping"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MappingThreshold" ADD CONSTRAINT "_MappingThreshold_B_fkey" FOREIGN KEY ("B") REFERENCES "threshold_configuration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DebtProductArea" ADD CONSTRAINT "_DebtProductArea_A_fkey" FOREIGN KEY ("A") REFERENCES "product_area_mapping"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DebtProductArea" ADD CONSTRAINT "_DebtProductArea_B_fkey" FOREIGN KEY ("B") REFERENCES "technical_debt_analysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;
