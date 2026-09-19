import fs from "node:fs/promises";
import path from "node:path";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";

export async function POST(request: Request) {
  const token = (await cookies()).get("love_liberia_token")?.value;
  const userId = token ? await verifyAuthToken(token) : null;
  if (!userId) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get("photo");
    const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
    if (!(file instanceof File) || !allowedTypes.has(file.type)) {
      return NextResponse.json({ error: "Upload a JPG, PNG, or WEBP verification photo." }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Photo must be smaller than 5MB." }, { status: 400 });

    const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const filename = `verification-${userId}-${Date.now()}.${extension}`;
    const directory = path.join(process.cwd(), "public", "uploads", "verification");
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(path.join(directory, filename), Buffer.from(await file.arrayBuffer()));

    await prisma.user.update({ where: { id: userId }, data: { photoVerificationStatus: "PENDING" } });
    return NextResponse.json({ message: "Photo submitted for review.", status: "PENDING" });
  } catch (error) {
    console.error("Photo verification error:", error);
    return NextResponse.json({ error: "Unable to submit photo verification." }, { status: 500 });
  }
}
