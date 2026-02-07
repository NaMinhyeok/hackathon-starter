import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyHostToken, buildAgentPrompt } from "@/lib/room-helpers";
import { createAndLaunchAgent } from "@/lib/moru";

/**
 * POST /api/rooms/[roomId]/rounds
 * Start a new round (host only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const hostToken = request.headers.get("x-host-token");

    // Verify host
    const isHost = await verifyHostToken(roomId, hostToken);
    if (!isHost) {
      return NextResponse.json(
        { error: "Unauthorized: invalid host token" },
        { status: 403 }
      );
    }

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        rounds: { orderBy: { roundNumber: "desc" }, take: 1 },
      },
    });

    if (!room) {
      return NextResponse.json(
        { error: "Room not found" },
        { status: 404 }
      );
    }

    if (!room.volumeId) {
      return NextResponse.json(
        { error: "Room has no volume" },
        { status: 400 }
      );
    }

    // Check if there's already a building round
    const activeRound = room.rounds.find((r) => r.status === "building");
    if (activeRound) {
      return NextResponse.json(
        { error: "A round is already in progress" },
        { status: 409 }
      );
    }

    // Find top-voted pending suggestion
    const topSuggestion = await prisma.suggestion.findFirst({
      where: { roomId, status: "pending" },
      orderBy: { voteCount: "desc" },
    });

    if (!topSuggestion) {
      return NextResponse.json(
        { error: "No pending suggestions to build" },
        { status: 400 }
      );
    }

    // Mark suggestion as selected
    await prisma.suggestion.update({
      where: { id: topSuggestion.id },
      data: { status: "selected" },
    });

    // Get next round number
    const lastRound = room.rounds[0];
    const roundNumber = lastRound ? lastRound.roundNumber + 1 : 1;

    // Get sessionId from last completed round for conversation continuity
    const lastCompletedRound = await prisma.round.findFirst({
      where: { roomId, status: "completed" },
      orderBy: { roundNumber: "desc" },
    });

    // Determine sessionId: reuse from last completed round (agent resumes it)
    const resumeSessionId = lastCompletedRound?.sessionId || undefined;

    // Create round — store sessionId upfront so the state API can read messages during build
    const round = await prisma.round.create({
      data: {
        roomId,
        roundNumber,
        suggestionId: topSuggestion.id,
        sessionId: resumeSessionId || null,
      },
    });

    // Update room status
    await prisma.room.update({
      where: { id: roomId },
      data: { status: "active" },
    });

    // Build prompt and launch agent
    const prompt = buildAgentPrompt(room.name, room.description, topSuggestion.text);
    const baseUrl = process.env.BASE_URL || "http://localhost:3000";
    const callbackUrl = `${baseUrl}/api/rooms/${roomId}/rounds/${round.id}/status`;

    const { sandboxId } = await createAndLaunchAgent(
      room.volumeId,
      callbackUrl,
      prompt,
      resumeSessionId
    );

    // Update round with sandboxId
    await prisma.round.update({
      where: { id: round.id },
      data: { sandboxId },
    });

    return NextResponse.json({
      round: {
        id: round.id,
        roundNumber: round.roundNumber,
        status: round.status,
        suggestion: topSuggestion,
      },
    });
  } catch (error) {
    console.error("Error in POST /api/rooms/[roomId]/rounds:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
