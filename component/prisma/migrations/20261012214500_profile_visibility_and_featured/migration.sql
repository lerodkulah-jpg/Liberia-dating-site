ALTER TABLE "User"
ADD COLUMN "profileVisibility" TEXT NOT NULL DEFAULT 'PUBLIC',
ADD COLUMN "featuredStatus" TEXT NOT NULL DEFAULT 'NONE',
ADD COLUMN "featuredRequestedAt" TIMESTAMP(3),
ADD COLUMN "featuredReviewedAt" TIMESTAMP(3),
ADD COLUMN "featuredReviewedById" TEXT;

CREATE INDEX "User_profileVisibility_featuredStatus_idx"
ON "User"("profileVisibility", "featuredStatus");
