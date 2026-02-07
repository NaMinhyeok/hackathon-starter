#!/usr/bin/env node
/**
 * Hackathon Starter Agent - Claude Agent SDK integration for Moru sandbox.
 *
 * Protocol:
 * 1. Read process_start from stdin (with optional session_id for resume)
 * 2. Read session_message from stdin (user's prompt)
 * 3. Emit session_started with sessionId to stdout
 * 4. Call Claude Agent SDK query() with prompt
 * 5. On completion/error, call CALLBACK_URL to update status
 */

import { query } from "@anthropic-ai/claude-agent-sdk";
import * as readline from "readline";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

// Debug logging helper
function debug(msg: string, data?: any): void {
  const timestamp = new Date().toISOString();
  if (data !== undefined) {
    console.error(`[DEBUG ${timestamp}] ${msg}:`, JSON.stringify(data, null, 2));
  } else {
    console.error(`[DEBUG ${timestamp}] ${msg}`);
  }
}

// Types for our protocol
interface ProcessStartCommand {
  type: "process_start";
  session_id?: string;
}

interface SessionMessageCommand {
  type: "session_message";
  text?: string;
  content?: Array<{ type: string; text?: string }>;
}

interface AgentMessage {
  type: string;
  session_id?: string;
  message?: string;
  result?: {
    duration_ms?: number;
    duration_api_ms?: number;
    total_cost_usd?: number | null;
    num_turns?: number;
  };
}

function emit(msg: AgentMessage): void {
  console.log(JSON.stringify(msg));
}

function parseContent(msg: SessionMessageCommand): string {
  if (msg.text) return msg.text;
  if (msg.content) {
    return msg.content
      .filter((b) => b.type === "text" && b.text)
      .map((b) => b.text!)
      .join("\n");
  }
  return "";
}

/**
 * Line reader that buffers incoming lines for reliable reading.
 * This handles the case where stdin is piped quickly and multiple
 * lines arrive before we're ready to read them.
 */
class LineReader {
  private lines: string[] = [];
  private resolvers: ((line: string | null) => void)[] = [];
  private closed = false;

  constructor(rl: readline.Interface) {
    rl.on("line", (line) => {
      debug("LineReader received line", { lineLength: line.length, waitingResolvers: this.resolvers.length, bufferedLines: this.lines.length });
      if (this.resolvers.length > 0) {
        // Someone is waiting for a line, resolve immediately
        debug("LineReader: resolving immediately");
        const resolve = this.resolvers.shift()!;
        resolve(line);
      } else {
        // Buffer the line for later
        debug("LineReader: buffering line");
        this.lines.push(line);
      }
    });

    rl.on("close", () => {
      debug("LineReader: stdin closed", { pendingResolvers: this.resolvers.length, bufferedLines: this.lines.length });
      this.closed = true;
      // Resolve all pending readers with null
      while (this.resolvers.length > 0) {
        const resolve = this.resolvers.shift()!;
        resolve(null);
      }
    });
  }

  async readLine(): Promise<string | null> {
    // Check if we have buffered lines
    if (this.lines.length > 0) {
      return this.lines.shift()!;
    }

    // Check if stream is closed
    if (this.closed) {
      return null;
    }

    // Wait for next line
    return new Promise((resolve) => {
      this.resolvers.push(resolve);
    });
  }
}

/**
 * Flush filesystem buffers so JuiceFS uploads pending writes to object storage.
 * Must be called before the callback so the session JSONL is readable via the volume API.
 */
function flushVolume(): void {
  try {
    debug("Flushing volume (sync)...");
    execSync("sync", { timeout: 10_000 });
    debug("Volume flush complete");
  } catch (e) {
    debug("Volume flush failed (non-fatal)", { error: String(e) });
  }
}

async function callCallback(status: "completed" | "error", sessionId?: string, errorMessage?: string) {
  const callbackUrl = process.env.CALLBACK_URL;
  if (!callbackUrl) {
    console.error("[AGENT] No CALLBACK_URL set, skipping callback");
    return;
  }

  try {
    const response = await fetch(callbackUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        sessionId,
        errorMessage,
      }),
    });

    if (!response.ok) {
      console.error(`[AGENT] Callback failed: ${response.status}`);
    }
  } catch (error) {
    console.error("[AGENT] Callback error:", error);
  }
}

async function main() {
  const workspace = process.env.WORKSPACE_DIR || process.cwd();
  const resumeSessionId = process.env.RESUME_SESSION_ID || undefined;

  // Debug: Log startup info
  debug("Agent starting");
  debug("Environment", {
    workspace,
    resumeSessionId,
    HOME: process.env.HOME,
    CALLBACK_URL: process.env.CALLBACK_URL,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? "set" : "not set",
    cwd: process.cwd(),
  });

  const rl = readline.createInterface({
    input: process.stdin,
    terminal: false,
  });

  const reader = new LineReader(rl);
  debug("LineReader initialized, waiting for stdin...");

  try {
    // Wait for process_start
    debug("Waiting for process_start...");
    const startLine = await reader.readLine();
    debug("Received line", { startLine });
    if (!startLine) {
      emit({ type: "process_error", message: "No input received" });
      return;
    }

    let startMsg: ProcessStartCommand;
    try {
      startMsg = JSON.parse(startLine);
    } catch {
      emit({ type: "process_error", message: "Invalid JSON for process_start" });
      return;
    }

    if (startMsg.type !== "process_start") {
      emit({ type: "process_error", message: "Expected process_start" });
      return;
    }

    // Use session_id from message or env
    const sessionIdToResume = startMsg.session_id || resumeSessionId || undefined;

    debug("Emitting process_ready", { sessionIdToResume });
    emit({
      type: "process_ready",
      session_id: sessionIdToResume || "pending",
    });

    // Wait for session_message
    debug("Waiting for session_message...");
    const msgLine = await reader.readLine();
    debug("Received line", { msgLine });
    if (!msgLine) {
      emit({ type: "process_error", message: "No session_message received" });
      return;
    }

    let sessionMsg: SessionMessageCommand;
    try {
      sessionMsg = JSON.parse(msgLine);
    } catch {
      emit({ type: "process_error", message: "Invalid JSON for session_message" });
      return;
    }

    if (sessionMsg.type !== "session_message") {
      emit({ type: "process_error", message: "Expected session_message" });
      return;
    }

    const prompt = parseContent(sessionMsg);
    if (!prompt) {
      emit({ type: "process_error", message: "Empty prompt" });
      return;
    }

    let currentSessionId: string | undefined = sessionIdToResume;
    let gotResult = false;

    debug("Starting query()", {
      prompt: prompt.substring(0, 100) + (prompt.length > 100 ? "..." : ""),
      workspace,
      resumeSessionId: sessionIdToResume,
    });

    // Record index.html mtime before query so we can detect if it was written/updated
    const indexPath = path.join(workspace, "index.html");
    function getIndexMtime(): number {
      try { return fs.statSync(indexPath).mtimeMs; } catch { return 0; }
    }
    const mtimeBefore = getIndexMtime();
    debug("index.html mtime before query", { mtimeBefore, exists: mtimeBefore > 0 });

    // Run the agent with retry: if index.html wasn't created/updated, retry once
    const MAX_ATTEMPTS = 2;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const currentPrompt = attempt === 1
        ? prompt
        : "이전 작업에서 /workspace/data/index.html 파일이 생성 또는 수정되지 않았습니다. 반드시 Write 도구를 사용해서 /workspace/data/index.html 파일을 작성하세요. 말만 하지 말고 실제로 파일을 생성해주세요.";
      const currentResume = attempt === 1 ? sessionIdToResume : currentSessionId;

      debug(`Query attempt ${attempt}/${MAX_ATTEMPTS}`, { prompt: currentPrompt.substring(0, 100) });

      for await (const message of query({
        prompt: currentPrompt,
        options: {
          allowedTools: [
            "Read", "Write", "Edit", "Bash", "Grep", "Glob",
            "WebSearch", "WebFetch", "TodoWrite", "Task",
          ],
          maxTurns: 50,
          permissionMode: "bypassPermissions",
          allowDangerouslySkipPermissions: true,
          cwd: workspace,
          resume: currentResume,
          settingSources: ["user", "project"],
        },
      })) {
        debug("Query message", { type: message.type, subtype: (message as any).subtype });

        // Capture session_id from init message
        if (message.type === "system" && (message as any).subtype === "init") {
          currentSessionId = (message as any).session_id;
          emit({
            type: "session_started",
            session_id: currentSessionId,
          });
        }

        // Handle result message
        if ("result" in message && message.type === "result") {
          gotResult = true;
          const resultMsg = message as any;
          emit({
            type: "session_complete",
            session_id: currentSessionId,
            result: {
              duration_ms: resultMsg.duration_ms,
              duration_api_ms: resultMsg.duration_api_ms,
              total_cost_usd: resultMsg.total_cost_usd,
              num_turns: resultMsg.num_turns,
            },
          });
        }
      }

      // Check if index.html was created or modified since before query
      const mtimeAfter = getIndexMtime();
      const wasModified = mtimeAfter > mtimeBefore;
      debug(`Attempt ${attempt} done. mtime: ${mtimeBefore} → ${mtimeAfter}, modified: ${wasModified}, gotResult: ${gotResult}`);

      if (wasModified) {
        break; // Success — file was created or updated
      }

      if (attempt === MAX_ATTEMPTS) {
        debug("index.html still not modified after all attempts");
      }
    }

    // Final check and callback
    const mtimeFinal = getIndexMtime();
    const fileWasModified = mtimeFinal > mtimeBefore;
    flushVolume();

    if (fileWasModified) {
      await callCallback("completed", currentSessionId);
    } else if (mtimeFinal > 0) {
      // File exists but wasn't modified — still report completed (previous round's file is valid)
      debug("index.html exists but was not modified this round");
      await callCallback("error", currentSessionId, "에이전트가 index.html을 수정하지 않았습니다");
    } else {
      console.error("[AGENT] Warning: index.html does not exist after agent run");
      await callCallback("error", currentSessionId, "에이전트가 index.html을 생성하지 못했습니다");
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[AGENT] Exception:", errorMessage);
    emit({ type: "process_error", message: errorMessage });
    flushVolume();
    await callCallback("error", undefined, errorMessage);
  } finally {
    rl.close();
    emit({ type: "process_stopped" });
  }
}

main().catch((error) => {
  console.error("[AGENT] Fatal error:", error);
  process.exit(1);
});
