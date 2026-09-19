import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";

export async function GET() {
  try {
    const token = (await cookies()).get("love_liberia_token")?.value;
    const userId = token ? await verifyAuthToken(token) : null;
    if (!userId) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });

    const sentLikes = await prisma.like.findMany({
      where: { senderId: userId },
      include: { receiver: { select: { id: true, firstName: true, username: true, dateOfBirth: true, county: true, city: true, profileImage: true, verified: true, isOnline: true } } },
    });
    const receivedLikes = await prisma.like.findMany({ where: { receiverId: userId }, select: { senderId: true } });
    const receivedIds = new Set(receivedLikes.map((like) => like.senderId));
    const today = new Date();
    const matches = sentLikes.filter((like) => receivedIds.has(like.receiverId)).map((like) => {
      const person = like.receiver;
      const birthDate = new Date(person.dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      if (today.getMonth() < birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) age--;
      return { ...person, age };
    });

    return NextResponse.json({ matches });
  } catch (error) {
    console.error("Matches error:", error);
    return NextResponse.json({ error: "Unable to load matches." }, { status: 500 });
  }
}
