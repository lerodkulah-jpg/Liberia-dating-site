import { PrismaClient } from "@prisma/client";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const legacyPrefix = "/uploads/profiles/";
const maxPhotoSize = 5 * 1024 * 1024;
const prisma = new PrismaClient();

function getStorageConfig() {
  const rawUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!rawUrl || !serviceRoleKey) {
    throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before migrating profile photos.");
  }
  const url = new URL(rawUrl);
  if (!["https:", "http:"].includes(url.protocol) || (process.env.NODE_ENV === "production" && url.protocol !== "https:")) {
    throw new Error("SUPABASE_URL must use HTTPS in production.");
  }
  return { baseUrl: url.origin, serviceRoleKey };
}

function imageType(filename) {
  if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) return "image/jpeg";
  if (filename.endsWith(".png")) return "image/png";
  if (filename.endsWith(".webp")) return "image/webp";
  return null;
}

function hasImageSignature(bytes, contentType) {
  if (contentType === "image/jpeg") return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (contentType === "image/png") return bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (contentType === "image/webp") return bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
  return false;
}

function objectUrl(baseUrl, ownerId, photoKey) {
  const objectPath = ["profiles", ownerId, photoKey].map(encodeURIComponent).join("/");
  return `${baseUrl}/storage/v1/object/profile-photos/${objectPath}`;
}

async function main() {
  const { baseUrl, serviceRoleKey } = getStorageConfig();
  const [users, photos] = await Promise.all([
    prisma.user.findMany({
      where: { profileImage: { startsWith: legacyPrefix } },
      select: { id: true, profileImage: true },
    }),
    prisma.profilePhoto.findMany({
      where: { url: { startsWith: legacyPrefix } },
      select: { id: true, userId: true, url: true },
    }),
  ]);

  const objects = new Map();
  for (const record of [...users, ...photos]) {
    const url = "profileImage" in record ? record.profileImage : record.url;
    const filename = url.slice(legacyPrefix.length);
    if (!filename || path.basename(filename) !== filename || !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,199}$/.test(filename)) {
      throw new Error("A legacy profile photo has an invalid path; no files were migrated.");
    }
    const contentType = imageType(filename);
    if (!contentType) throw new Error("A legacy profile photo has an unsupported file type; no files were migrated.");
    const ownerId = "profileImage" in record ? record.id : record.userId;
    objects.set(`${ownerId}/${filename}`, {
      ownerId,
      filename,
      contentType,
      filePath: path.join(process.cwd(), "public", "uploads", "profiles", filename),
    });
  }

  for (const object of objects.values()) {
    const fileStat = await stat(object.filePath).catch(() => null);
    if (!fileStat?.isFile() || fileStat.size === 0 || fileStat.size > maxPhotoSize) {
      throw new Error("A legacy profile photo is missing or exceeds the size limit; no database references were changed.");
    }
    const bytes = await readFile(object.filePath);
    if (!hasImageSignature(bytes, object.contentType)) {
      throw new Error("A legacy profile photo failed image validation; no database references were changed.");
    }
  }

  for (const object of objects.values()) {
    const bytes = await readFile(object.filePath);
    const response = await fetch(objectUrl(baseUrl, object.ownerId, object.filename), {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": object.contentType,
        "x-upsert": "true",
      },
      body: bytes,
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Supabase photo upload failed with HTTP ${response.status}.`);
  }

  await prisma.$transaction(async (transaction) => {
    for (const user of users) {
      const photoKey = user.profileImage.slice(legacyPrefix.length);
      const result = await transaction.user.updateMany({
        where: { id: user.id, profileImage: user.profileImage },
        data: { profileImage: `/api/profile-photos/${photoKey}` },
      });
      if (result.count !== 1) throw new Error("A profile photo changed during migration; rerun the script.");
    }
    for (const photo of photos) {
      const photoKey = photo.url.slice(legacyPrefix.length);
      const result = await transaction.profilePhoto.updateMany({
        where: { id: photo.id, url: photo.url },
        data: { url: `/api/profile-photos/${photoKey}` },
      });
      if (result.count !== 1) throw new Error("A profile photo changed during migration; rerun the script.");
    }
  });

  console.log(`Migrated ${objects.size} private profile photo objects and updated ${users.length + photos.length} database references.`);
}

main()
  .catch((error) => {
    console.error("Profile photo migration failed:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
