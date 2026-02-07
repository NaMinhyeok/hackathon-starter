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

CRITICAL INSTRUCTIONS — YOU MUST FOLLOW ALL OF THESE:
1. ALWAYS respond in Korean (한국어)
2. Check existing files: ls /workspace/data/
3. YOU MUST USE the Write tool to create/update /workspace/data/index.html — DO NOT just say you will do it, ACTUALLY write the file
4. The index.html must be a SINGLE self-contained HTML file with ALL features built so far
5. Use Tailwind CDN (<script src="https://cdn.tailwindcss.com"></script>) and inline JS
6. Make it visually impressive — gradients, transitions, modern dark theme
7. Comment sections: <!-- Feature: ${suggestionText} -->
8. After writing, verify the file exists: cat /workspace/data/index.html | head -5

DO NOT end your turn without writing index.html. Your #1 priority is producing a working file.`;
}
