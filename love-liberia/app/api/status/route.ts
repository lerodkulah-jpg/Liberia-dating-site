import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";

export async function GET() {
  try {
    const token = (await cookies()).get("love_liberia_token")?.value;
    const userId = token ? await verifyAuthToken(token) : null;

    if (!userId) {
      return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isOnline: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json(
      { isOnline: user.isOnline },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    console.error("Status load error:", error);
    return NextResponse.json({ error: "Unable to load status." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const token = (await cookies()).get("love_liberia_token")?.value;
    const userId = token ? await verifyAuthToken(token) : null;

    if (!userId) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const isOnline = body.isOnline === true;

    await prisma.user.update({
      where: { id: userId },
      data: { isOnline },
    });

    return NextResponse.json({ message: "Status updated.", isOnline });
  } catch (error) {
    console.error("Status update error:", error);
    return NextResponse.json(
      { error: "Unable to update status." },
      { status: 500 }
    );
  }
}