-- Add quality score to extractions for transparency about partial/failed results
ALTER TABLE "extraction" ADD COLUMN "qualityScore" INTEGER;
