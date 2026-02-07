"use client";

import { useEffect, useRef } from "react";
import { CCMessages } from "@/components/chat/cc-messages";
import type { SessionEntry } from "@/lib/types";

interface BuildLogViewProps {
  messages: SessionEntry[];
  currentRound: {
    status: string;
    errorMessage: string | null;
  } | null;
}

export function BuildLogView({ messages, currentRound }: BuildLogViewProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0 && !currentRound) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">No build logs yet</p>
      </div>
    );
  }

  if (messages.length === 0 && currentRound?.status === "building") {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-sm text-muted-foreground">
            Agent is starting up...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-4">
        <CCMessages entries={messages} />

        {currentRound?.status === "building" && (
          <div className="mt-4 text-sm text-muted-foreground animate-pulse">
            Building...
          </div>
        )}

        {currentRound?.status === "error" && currentRound.errorMessage && (
          <div className="mt-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {currentRound.errorMessage}
          </div>
        )}

        {currentRound?.status === "completed" && (
          <div className="mt-4 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
            Round completed! Check the Preview tab.
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
