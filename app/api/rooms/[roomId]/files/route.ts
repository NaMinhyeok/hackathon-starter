import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { listVolumeFiles, buildFileTree } from "@/lib/moru";

/**
 * GET /api/rooms/[roomId]/files
 * List files in workspace directory
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path") || "/";
    const tree = searchParams.get("tree") === "true";

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
      return NextResponse.json({ files: [] });
    }

    const files = tree
      ? await buildFileTree(room.volumeId, path)
      : await listVolumeFiles(room.volumeId, path);

    return NextResponse.json({ files });
  } catch (error) {
    console.error("Error in GET /api/rooms/[roomId]/files:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
