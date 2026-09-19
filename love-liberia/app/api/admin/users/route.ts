import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";
import { can } from "@/lib/admin/permissions";

async function getAdmin() {
  const token = (await cookies()).get("love_liberia_token")?.value;
  const userId = token ? await verifyAuthToken(token) : null;

  if (!userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  return user && can(user.role, "dashboard") ? user : null;
}

export async function GET(request: Request) {
  const admin = await getAdmin();

  if (!admin || !can(admin.role, "view_users")) {
    return NextResponse.json(
      { error: "Admin access required." },
      { status: 403 }
    );
  }

  try {
    const params = new URL(request.url).searchParams;
    const search = params.get("search")?.trim();
    const status = params.get("status");
    const role = params.get("role");
    const plan = params.get("plan");
    const users = await prisma.user.findMany({
      where: {
        ...(search ? { OR: [{ firstName: { contains: search } }, { username: { contains: search } }, { email: { contains: search } }] } : {}),
        ...(status === "banned" ? { isBanned: true } : status === "inactive" ? { isActive: false, isBanned: false } : status === "active" ? { isActive: true, isBanned: false } : {}),
        ...(role ? { role } : {}),
        ...(plan ? { membershipPlan: plan } : {}),
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        firstName: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        isBanned: true,
        verified: true,
        emailVerified: true,
        phoneVerified: true,
        photoVerified: true,
        membershipPlan: true,
        createdAt: true,
        profileImage: true,
        profilePhotos: {
          orderBy: { createdAt: "asc" },
          select: { id: true, url: true, createdAt: true },
        },
        _count: {
          select: { reportsReceived: true },
        },
        reportsReceived: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            reason: true,
            status: true,
            createdAt: true,
          },
        },
        riskFlags: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            source: true,
            score: true,
            level: true,
            reasons: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    return NextResponse.json({
      currentAdminId: admin.id,
      currentAdminRole: admin.role,
      users: users.map(({ _count, reportsReceived, profilePhotos, riskFlags, ...user }) => ({
        ...user,
        photos: [
          ...(user.profileImage
            ? [{ id: "profileImage", url: user.profileImage, isPrimary: true }]
            : []),
          ...profilePhotos.map((photo) => ({ ...photo, isPrimary: false })),
        ],
        reportCount: _count.reportsReceived,
        reportHistory: reportsReceived,
        riskFlags,
      })),
    });
  } catch (error) {
    console.error("Admin users error:", error);
    return NextResponse.json(
      { error: "Unable to load users." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const admin = await getAdmin();

  if (!admin) {
    return NextResponse.json(
      { error: "Admin access required." },
      { status: 403 }
    );
  }

  try {
    const { userId, isActive, isBanned, verified, membershipPlan, action } = await request.json();

    if (
      typeof userId !== "string" ||
      (typeof isActive !== "boolean" && typeof isBanned !== "boolean" && typeof verified !== "boolean" && typeof membershipPlan !== "string" && typeof action !== "string")
    ) {
      return NextResponse.json(
        { error: "userId and a status value are required." },
        { status: 400 }
      );
    }

    if (userId === admin.id && (typeof isActive === "boolean" || typeof isBanned === "boolean" || action === "delete")) {
      return NextResponse.json(
        { error: "You cannot deactivate your own admin account." },
        { status: 400 }
      );
    }

    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!target) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (target.role === "SUPER_ADMIN" && admin.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Admin accounts cannot be suspended here." },
        { status: 400 }
      );
    }

    if (action === "delete") {
      if (!can(admin.role, "manage_users")) return NextResponse.json({ error: "You do not have permission to delete accounts." }, { status: 403 });
      await prisma.user.delete({ where: { id: userId } });
      return NextResponse.json({ deleted: true, userId });
    }

    if (typeof verified === "boolean" && !can(admin.role, "verify_profiles")) return NextResponse.json({ error: "You do not have permission to verify profiles." }, { status: 403 });
    if ((typeof isActive === "boolean" || typeof isBanned === "boolean" || action === "reset") && !can(admin.role, "manage_users")) return NextResponse.json({ error: "You do not have permission to manage accounts." }, { status: 403 });
    if (typeof membershipPlan === "string" && !can(admin.role, "manage_subscriptions")) return NextResponse.json({ error: "You do not have permission to manage subscriptions." }, { status: 403 });
    if (membershipPlan && !["FREE", "PREMIUM", "VIP"].includes(membershipPlan)) return NextResponse.json({ error: "Invalid membership plan." }, { status: 400 });

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(action === "reset" ? { isActive: true, isBanned: false, verified: false, membershipPlan: "FREE", membershipStatus: "ACTIVE" } : {}),
        ...(typeof isActive === "boolean" ? { isActive } : {}),
        ...(typeof isBanned === "boolean" ? { isBanned, isActive: isBanned ? false : isActive ?? true } : {}),
        ...(typeof verified === "boolean" ? { verified } : {}),
        ...(typeof membershipPlan === "string" ? { membershipPlan, membershipStatus: "ACTIVE" } : {}),
      },
      select: { id: true, isActive: true, isBanned: true, verified: true, membershipPlan: true, membershipStatus: true },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Admin user status error:", error);
    return NextResponse.json(
      { error: "Unable to update user status." },
      { status: 500 }
    );
  }
}