import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { createAuthToken } from "@/lib/auth";
import { evaluateProfileRisk, assessAccountRisk } from "@/lib/security/risk-scoring";
import { rateLimit, sameOrigin, validateText, writeSecurityAudit } from "@/lib/security/request";
import { getRequestContext } from "@/lib/security/request";

export async function POST(request: Request) {
  try {
    if (!sameOrigin(request)) return NextResponse.json({ success: false, message: "Invalid request origin." }, { status: 403 });
    const limit = await rateLimit(request, "register", 5, 60 * 60_000);
    if (!limit.allowed) return NextResponse.json({ success: false, message: "Too many registration attempts. Try again later." }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });
    const body = await request.json();

    const {
      firstName,
      username,
      email,
      phone,
      password,
      dateOfBirth,
      gender,
      country,
      county,
      city,
      bio,
      occupation,
      education,
      height,
      languages,
      interests,
      hobbies,
      religion,
      smokingPreference,
      drinkingPreference,
      childrenPreference,
      relationshipGoal,
      interestedIn,
    } = body;

    if (
      !firstName ||
      !username ||
      !email ||
      !password ||
      !dateOfBirth ||
      !gender
    ) {
      return NextResponse.json(
        { success: false, message: "Please fill in all required fields." },
        { status: 400 }
      );
    }

    if (!validateText(firstName, 80) || !validateText(username, 30) || !validateText(email, 254) || !validateText(gender, 40) || !validateText(dateOfBirth, 30)) {
      return NextResponse.json({ success: false, message: "Please enter valid account details." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must contain at least 8 characters.",
        },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase();
    const normalizedUsername = username.toLowerCase();
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: normalizedEmail }, { username: normalizedUsername }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "Email or username is already registered." },
        { status: 409 }
      );
    }

    const user = await prisma.user.create({
      data: {
        firstName,
        username: normalizedUsername,
        email: normalizedEmail,
        phone,
        password: await hashPassword(password),
        dateOfBirth: new Date(dateOfBirth),
        gender,
        country: country || "Liberia",
        county,
        city,
        bio,
        occupation,
        education,
        height,
        languages,
        interests,
        hobbies,
        religion,
        smokingPreference,
        drinkingPreference,
        childrenPreference,
        relationshipGoal,
        preferences: {
          create: {
            interestedIn: interestedIn || "Everyone",
            minAge: 18,
            maxAge: 60,
          },
        },
      },
      select: {
        id: true,
        firstName: true,
        username: true,
        email: true,
        country: true,
        county: true,
        city: true,
      },
    });

    const riskAssessment = evaluateProfileRisk({
      bio,
      interests,
      profileImage: null,
      username: normalizedUsername,
      firstName,
      createdAt: new Date(),
    });

    if (riskAssessment.requiresHumanReview) {
      const riskFlagClient = (prisma as any).userRiskFlag;
      if (riskFlagClient?.create) {
        await riskFlagClient.create({
          data: {
            userId: user.id,
            source: "REGISTRATION_PROFILE",
            score: riskAssessment.score,
            level: riskAssessment.level,
            reasons: riskAssessment.reasons.join(", ") || "No major signals",
            notes: assessAccountRisk(riskAssessment, "REGISTRATION_PROFILE").notes,
            status: "PENDING_REVIEW",
          },
        });
      }
    }

    const response = NextResponse.json(
      {
        success: true,
        message: "Account created successfully.",
        user,
        risk: riskAssessment.requiresHumanReview ? assessAccountRisk(riskAssessment, "REGISTRATION_PROFILE") : null,
      },
      { status: 201 }
    );

    response.cookies.set("love_liberia_token", await createAuthToken(user.id, getRequestContext(request)), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    await writeSecurityAudit(request, { action: "ACCOUNT_REGISTERED", actorUserId: user.id });

    return response;
  } catch (error) {
    console.error("Registration error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while creating your account.",
      },
      { status: 500 }
    );
  }
}
