import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readVolumeFile } from "@/lib/moru";

/**
 * GET /api/rooms/[roomId]/files/[...path]
 * Read file contents from workspace
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string; path: string[] }> }
) {
  try {
    const { roomId, path } = await params;
    const filePath = "/" + path.join("/");

    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return NextResponse.json(
        { error: "Room not found" },
        { status: 404 }
      );
    }

    if (!room.volumeId) {
      return NextResponse.json(
        { error: "No volume attached to room" },
        { status: 400 }
      );
    }

    const content = await readVolumeFile(room.volumeId, filePath);
    return NextResponse.json({ content });
  } catch (error) {
    console.error("Error in GET /api/rooms/[roomId]/files/[...path]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
