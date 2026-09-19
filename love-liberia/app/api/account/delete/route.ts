import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";

export async function DELETE(request: Request) {
  const token = (await cookies()).get("love_liberia_token")?.value;
  const userId = token ? await verifyAuthToken(token) : null;
  if (!userId) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  const body = await request.json();
  if (body.confirmation !== "DELETE MY ACCOUNT") return NextResponse.json({ error: "Type DELETE MY ACCOUNT to confirm." }, { status: 400 });
  await prisma.user.delete({ where: { id: userId } });
  const response = NextResponse.json({ message: "Your account has been permanently deleted." });
  response.cookies.delete("love_liberia_token");
  return response;
}