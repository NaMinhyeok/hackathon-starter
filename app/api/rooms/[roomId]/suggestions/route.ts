import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * POST /api/rooms/[roomId]/suggestions
 * Submit a feature idea
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const body = await request.json();
    const { text, authorId } = body;

    if (!text?.trim()) {
      return NextResponse.json(
        { error: "Suggestion text is required" },
        { status: 400 }
      );
    }

    if (!authorId) {
      return NextResponse.json(
        { error: "Author ID is required" },
        { status: 400 }
      );
    }

    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      return NextResponse.json(
        { error: "Room not found" },
        { status: 404 }
      );
    }

    const suggestion = await prisma.suggestion.create({
      data: {
        roomId,
        text: text.trim(),
        authorId,
      },
    });

    return NextResponse.json({ suggestion });
  } catch (error) {
    console.error("Error in POST /api/rooms/[roomId]/suggestions:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
