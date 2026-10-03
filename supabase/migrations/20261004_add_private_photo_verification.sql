ALTER TABLE public."Verification"
  ADD COLUMN IF NOT EXISTS "photoData" BYTEA,
  ADD COLUMN IF NOT EXISTS "photoMimeType" TEXT;