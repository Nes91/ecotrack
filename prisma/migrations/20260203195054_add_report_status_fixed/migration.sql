-- Crée le nouvel enum ReportStatus (version corrigée)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ReportStatus') THEN
    CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED');
  END IF;
END $$;

-- Ajoute les colonnes dans Report
ALTER TABLE "Report" 
  ADD COLUMN IF NOT EXISTS "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Ajoute les colonnes dans Container
ALTER TABLE "Container" 
  ADD COLUMN IF NOT EXISTS "status" "ContainerStatus",
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;