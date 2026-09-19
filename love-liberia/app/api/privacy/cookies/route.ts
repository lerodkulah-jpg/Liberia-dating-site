import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const defaults = { necessary: true, analytics: false, personalization: false };

export async function GET() {
  const value = (await cookies()).get("love_liberia_cookie_preferences")?.value;
  return NextResponse.json({ preferences: value ? JSON.parse(value) : defaults });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const preferences = { necessary: true, analytics: body.analytics === true, personalization: body.personalization === true };
  const response = NextResponse.json({ preferences });
  response.cookies.set("love_liberia_cookie_preferences", JSON.stringify(preferences), { httpOnly: true, sameSite: "lax", maxAge: 31536000, path: "/" });
  return response;
}