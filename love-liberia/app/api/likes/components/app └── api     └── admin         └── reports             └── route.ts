import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const reports = await prisma.report.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        reporter: {
          select: {
            id: true,
            firstName: true,
            username: true,
            email: true,
          },
        },
        reported: {
          select: {
            id: true,
            firstName: true,
            username: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      reports,
    });
  } catch (error) {
    console.error("Admin reports error:", error);

    return NextResponse.json(
      {
        error: "Unable to load reports.",
      },
      {
        status: 500,
      }
    );
  }
}