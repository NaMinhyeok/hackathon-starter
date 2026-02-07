import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readVolumeFile } from "@/lib/moru";

/**
 * GET /api/rooms/[roomId]/preview
 * Read index.html from volume for iframe preview
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;

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
        { error: "No volume" },
        { status: 404 }
      );
    }

    try {
      const html = await readVolumeFile(room.volumeId, "/index.html");
      return new NextResponse(html, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    } catch {
      return NextResponse.json(
        { error: "No index.html yet" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error in GET /api/rooms/[roomId]/preview:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
