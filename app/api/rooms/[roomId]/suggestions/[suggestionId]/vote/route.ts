import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * POST /api/rooms/[roomId]/suggestions/[suggestionId]/vote
 * Toggle vote on a suggestion
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string; suggestionId: string }> }
) {
  try {
    const { suggestionId } = await params;
    const body = await request.json();
    const { voterId } = body;

    if (!voterId) {
      return NextResponse.json(
        { error: "Voter ID is required" },
        { status: 400 }
      );
    }

    // Check if vote already exists
    const existingVote = await prisma.vote.findUnique({
      where: {
        suggestionId_voterId: { suggestionId, voterId },
      },
    });

    if (existingVote) {
      // Remove vote
      await prisma.$transaction([
        prisma.vote.delete({ where: { id: existingVote.id } }),
        prisma.suggestion.update({
          where: { id: suggestionId },
          data: { voteCount: { decrement: 1 } },
        }),
      ]);
    } else {
      // Add vote
      await prisma.$transaction([
        prisma.vote.create({
          data: { suggestionId, voterId },
        }),
        prisma.suggestion.update({
          where: { id: suggestionId },
          data: { voteCount: { increment: 1 } },
        }),
      ]);
    }

    const suggestion = await prisma.suggestion.findUnique({
      where: { id: suggestionId },
      include: { votes: true },
    });

    return NextResponse.json({ suggestion, voted: !existingVote });
  } catch (error) {
    console.error("Error in POST /api/rooms/[roomId]/suggestions/[id]/vote:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
