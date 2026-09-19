import crypto from "node:crypto";
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
    const file = formData.get("document");
    const allowedTypes = new Set(["image/jpeg", "image/png", "application/pdf"]);
    if (!(file instanceof File) || !allowedTypes.has(file.type)) {
      return NextResponse.json({ error: "Upload a JPG, PNG, or PDF document." }, { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "Document must be smaller than 10MB." }, { status: 400 });

    const extension = file.type === "application/pdf" ? "pdf" : file.type === "image/png" ? "png" : "jpg";
    const filename = `${crypto.randomUUID()}.${extension}`;
    const directory = path.join(process.cwd(), "private", "identity-verification", userId);
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(path.join(directory, filename), Buffer.from(await file.arrayBuffer()), { flag: "wx" });
    await prisma.user.update({ where: { id: userId }, data: { identityVerificationStatus: "PENDING" } });

    return NextResponse.json({ message: "Identity document submitted for secure review.", status: "PENDING" });
  } catch (error) {
    console.error("Identity verification error:", error);
    return NextResponse.json({ error: "Unable to submit identity verification." }, { status: 500 });
  }
}
