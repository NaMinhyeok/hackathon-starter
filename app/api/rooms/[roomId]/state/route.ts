import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readVolumeFile } from "@/lib/moru";
import { parseSessionJSONL, getSessionFilePath } from "@/lib/session-parser";
import type { SessionEntry } from "@/lib/types";

/**
 * GET /api/rooms/[roomId]/state
 * Unified polling endpoint - returns room state, suggestions, current round, and build messages
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        suggestions: {
          orderBy: { voteCount: "desc" },
          include: { votes: { select: { voterId: true } } },
        },
        rounds: {
          orderBy: { roundNumber: "desc" },
          include: { suggestion: true },
        },
      },
    });

    if (!room) {
      return NextResponse.json(
        { error: "Room not found" },
        { status: 404 }
      );
    }

    // Get current/latest round
    const currentRound = room.rounds[0] || null;

    // Read build messages if there's an active round with a session
    let messages: SessionEntry[] = [];
    if (currentRound && room.volumeId) {
      const sessionId = currentRound.sessionId;

      if (sessionId) {
        try {
          const sessionPath = getSessionFilePath(sessionId);
          const content = await readVolumeFile(room.volumeId, sessionPath);
          messages = parseSessionJSONL(content);
        } catch {
          // Session file may not exist yet
        }
      }
    }

    return NextResponse.json({
      room: {
        id: room.id,
        code: room.code,
        name: room.name,
        description: room.description,
        status: room.status,
      },
      suggestions: room.suggestions.map((s) => ({
        id: s.id,
        text: s.text,
        authorId: s.authorId,
        status: s.status,
        voteCount: s.voteCount,
        voters: s.votes.map((v) => v.voterId),
        createdAt: s.createdAt,
      })),
      currentRound: currentRound
        ? {
            id: currentRound.id,
            roundNumber: currentRound.roundNumber,
            status: currentRound.status,
            suggestion: currentRound.suggestion,
            errorMessage: currentRound.errorMessage,
            createdAt: currentRound.createdAt,
            completedAt: currentRound.completedAt,
          }
        : null,
      totalRounds: room.rounds.length,
      messages,
    });
  } catch (error) {
    console.error("Error in GET /api/rooms/[roomId]/state:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
