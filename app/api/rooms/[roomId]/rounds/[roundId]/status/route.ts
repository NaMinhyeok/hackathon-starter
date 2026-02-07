import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { killSandbox } from "@/lib/moru";
import type { StatusCallbackRequest } from "@/lib/types";

/**
 * POST /api/rooms/[roomId]/rounds/[roundId]/status
 * Callback endpoint for sandbox to report completion
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string; roundId: string }> }
) {
  try {
    const { roundId } = await params;
    const body: StatusCallbackRequest = await request.json();
    const { status, errorMessage, sessionId } = body;

    const round = await prisma.round.findUnique({
      where: { id: roundId },
    });

    if (!round) {
      return NextResponse.json(
        { error: "Round not found" },
        { status: 404 }
      );
    }

    // Update round status
    await prisma.round.update({
      where: { id: roundId },
      data: {
        status,
        errorMessage: errorMessage || null,
        sessionId: sessionId || round.sessionId,
        sandboxId: null,
        completedAt: status === "completed" ? new Date() : null,
      },
    });

    // Mark suggestion as built if completed
    if (status === "completed") {
      await prisma.suggestion.update({
        where: { id: round.suggestionId },
        data: { status: "built" },
      });
    }

    // Wait for volume sync then kill sandbox
    if (round.sandboxId) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      await killSandbox(round.sandboxId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in POST /api/rooms/[roomId]/rounds/[roundId]/status:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
