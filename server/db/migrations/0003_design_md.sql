-- Track DESIGN.md generation status per extraction.
-- "ok" | "warnings" | "errors" | "skipped"
ALTER TABLE "extraction" ADD COLUMN "designMdLintStatus" TEXT;
ALTER TABLE "extraction" ADD COLUMN "designMdLintErrorCount" INTEGER DEFAULT 0;
ALTER TABLE "extraction" ADD COLUMN "designMdLintWarningCount" INTEGER DEFAULT 0;
