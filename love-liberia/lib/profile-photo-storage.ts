const bucketName = "profile-photos";
const maxPhotoSize = 5 * 1024 * 1024;

export class ProfilePhotoStorageConfigurationError extends Error {
  constructor() {
    super("Profile photo storage is not configured.");
    this.name = "ProfilePhotoStorageConfigurationError";
  }
}

function getStorageConfig() {
  const rawUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!rawUrl || !serviceRoleKey) {
    throw new ProfilePhotoStorageConfigurationError();
  }

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new ProfilePhotoStorageConfigurationError();
  }

  if (
    !["https:", "http:"].includes(url.protocol) ||
    (process.env.NODE_ENV === "production" && url.protocol !== "https:")
  ) {
    throw new ProfilePhotoStorageConfigurationError();
  }

  return { baseUrl: url.origin, serviceRoleKey };
}

function objectUrl(ownerId: string, photoKey: string) {
  const { baseUrl } = getStorageConfig();
  const objectPath = ["profiles", ownerId, photoKey].map(encodeURIComponent).join("/");
  return `${baseUrl}/storage/v1/object/${encodeURIComponent(bucketName)}/${objectPath}`;
}

function storageHeaders(serviceRoleKey: string, contentType?: string) {
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    ...(contentType ? { "Content-Type": contentType } : {}),
  };
}

export function profilePhotoKeyFromUrl(photoUrl: string) {
  const match = /^(?:\/api\/profile-photos\/|\/uploads\/profiles\/)([^/]+)$/.exec(photoUrl);
  if (!match || match[1].includes("..") || !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,199}$/.test(match[1])) {
    return null;
  }
  return match[1];
}

export async function uploadProfilePhotoObject(
  ownerId: string,
  photoKey: string,
  bytes: Uint8Array,
  contentType: string,
) {
  if (bytes.length === 0 || bytes.length > maxPhotoSize) {
    throw new Error("Profile photo exceeds the allowed size.");
  }

  const { serviceRoleKey } = getStorageConfig();
  const response = await fetch(objectUrl(ownerId, photoKey), {
    method: "POST",
    headers: {
      ...storageHeaders(serviceRoleKey, contentType),
      "x-upsert": "true",
    },
    body: Buffer.from(bytes),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Supabase profile photo upload failed with HTTP ${response.status}.`);
  }
}

export async function downloadProfilePhotoObject(ownerId: string, photoKey: string) {
  const { baseUrl, serviceRoleKey } = getStorageConfig();
  const objectPath = ["profiles", ownerId, photoKey].map(encodeURIComponent).join("/");
  const url = `${baseUrl}/storage/v1/object/authenticated/${encodeURIComponent(bucketName)}/${objectPath}`;
  const response = await fetch(url, {
    headers: storageHeaders(serviceRoleKey),
    cache: "no-store",
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Supabase profile photo download failed with HTTP ${response.status}.`);
  }

  const contentType = response.headers.get("content-type")?.split(";")[0].toLowerCase();
  if (!contentType || !["image/jpeg", "image/png", "image/webp"].includes(contentType)) {
    throw new Error("Stored profile photo has an unsupported content type.");
  }

  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxPhotoSize) {
    throw new Error("Stored profile photo exceeds the allowed size.");
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length === 0 || bytes.length > maxPhotoSize) {
    throw new Error("Stored profile photo exceeds the allowed size.");
  }

  return { bytes, contentType };
}

export async function deleteProfilePhotoObject(ownerId: string, photoUrl: string) {
  const photoKey = profilePhotoKeyFromUrl(photoUrl);
  if (!photoKey) return;

  const { serviceRoleKey } = getStorageConfig();
  const response = await fetch(objectUrl(ownerId, photoKey), {
    method: "DELETE",
    headers: storageHeaders(serviceRoleKey),
    cache: "no-store",
  });
  if (!response.ok && response.status !== 404) {
    throw new Error(`Supabase profile photo deletion failed with HTTP ${response.status}.`);
  }
}
