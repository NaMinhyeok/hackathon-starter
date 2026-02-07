import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateUniqueRoomCode } from "@/lib/room-helpers";
import { createVolume } from "@/lib/moru";

/**
 * POST /api/rooms
 * Create a new room
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Room name is required" },
        { status: 400 }
      );
    }

    const code = await generateUniqueRoomCode();

    // Create volume for the room
    const volumeId = await createVolume(`room-${code.toLowerCase()}`);

    const room = await prisma.room.create({
      data: {
        code,
        name: name.trim(),
        description: description?.trim() || null,
        volumeId,
      },
    });

    return NextResponse.json({
      room: {
        id: room.id,
        code: room.code,
        name: room.name,
        description: room.description,
        status: room.status,
      },
      hostToken: room.hostToken,
    });
  } catch (error) {
    console.error("Error in POST /api/rooms:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
