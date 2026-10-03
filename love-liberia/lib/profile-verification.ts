import type { Prisma } from "@prisma/client";

export async function invalidatePhotoVerification(transaction: Prisma.TransactionClient, userId: string) {
  const now = new Date();
  await transaction.verification.updateMany({
    where: { userId, type: "PHOTO", status: "PENDING" },
    data: { status: "SUPERSEDED", verifiedAt: now, photoData: null, photoMimeType: null },
  });
  await transaction.user.update({
    where: { id: userId },
    data: { photoVerified: false, photoVerificationStatus: "NOT_SUBMITTED", verified: false },
  });
}