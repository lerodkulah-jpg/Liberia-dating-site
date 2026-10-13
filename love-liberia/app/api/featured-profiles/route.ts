import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function ageFrom(dateOfBirth: Date) {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  if (
    today.getMonth() < dateOfBirth.getMonth() ||
    (today.getMonth() === dateOfBirth.getMonth() &&
      today.getDate() < dateOfBirth.getDate())
  ) {
    age--;
  }
  return age;
}

export async function GET() {
  try {
    const featuredProfiles = await prisma.user.findMany({
      where: {
        isActive: true,
        isBanned: false,
        profileVisibility: "PUBLIC",
        featuredStatus: "APPROVED",
      },
      orderBy: { featuredReviewedAt: "desc" },
      take: 8,
      select: {
        id: true,
        firstName: true,
        dateOfBirth: true,
        county: true,
        city: true,
        occupation: true,
        bio: true,
        profileImage: true,
        profilePhotos: {
          orderBy: { createdAt: "asc" },
          take: 1,
          select: { url: true },
        },
        photoVerified: true,
      },
    });

    return NextResponse.json(
      {
        profiles: featuredProfiles.map(({ dateOfBirth, profilePhotos, ...user }) => ({
          ...user,
          age: ageFrom(dateOfBirth),
          profileImage: user.profileImage || profilePhotos[0]?.url || null,
        })),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Featured profiles error:", error);
    return NextResponse.json(
      { error: "Unable to load featured profiles." },
      { status: 500 }
    );
  }
}
