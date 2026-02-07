import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * POST /api/rooms/join
 * Join a room by code
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code?.trim()) {
      return NextResponse.json(
        { error: "Room code is required" },
        { status: 400 }
      );
    }

    const room = await prisma.room.findUnique({
      where: { code: code.trim().toUpperCase() },
    });

    if (!room) {
      return NextResponse.json(
        { error: "Room not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      room: {
        id: room.id,
        code: room.code,
        name: room.name,
        description: room.description,
        status: room.status,
      },
    });
  } catch (error) {
    console.error("Error in POST /api/rooms/join:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
