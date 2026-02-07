import { prisma } from "@/lib/db";

/**
 * Generate a unique 6-character room code.
 * Uses uppercase letters and digits, avoiding ambiguous characters (0/O, 1/I/L).
 */
const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateRoomCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

/**
 * Generate a unique room code that doesn't conflict with existing rooms.
 */
export async function generateUniqueRoomCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = generateRoomCode();
    const existing = await prisma.room.findUnique({ where: { code } });
    if (!existing) return code;
  }
  throw new Error("Failed to generate unique room code");
}

/**
 * Verify that the provided host token matches the room's host token.
 */
export async function verifyHostToken(
  roomId: string,
  token: string | null
): Promise<boolean> {
  if (!token) return false;
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: { hostToken: true },
  });
  return room?.hostToken === token;
}

/**
 * Build the agent prompt for a round.
 */
export function buildAgentPrompt(
  roomName: string,
  description: string | null | undefined,
  suggestionText: string
): string {
  return `You are building a feature for the project "${roomName}".
${description ? `Project description: ${description}` : ""}

Feature to build: "${suggestionText}"

IMPORTANT:
- ALWAYS respond and write all output messages in Korean (한국어)
- Check existing files in /workspace/data/ first and build on top of them
- Always produce a working index.html at the root that showcases ALL features built so far
- Use inline CSS/JS or CDN links (Tailwind CDN, etc.) for self-contained HTML
- Make it visually impressive - this is shown live to an audience
- Add smooth transitions, gradients, modern design
- Comment sections clearly: <!-- Feature: ${suggestionText} -->`;
}
