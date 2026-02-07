"use client";

import { useRef, useEffect, useState, useCallback } from "react";
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const checkIfAtBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const threshold = 100;
    setIsAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < threshold);
  }, []);

  // Auto-scroll only if user is already at bottom
  useEffect(() => {
    if (isAtBottom) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isAtBottom]);

  if (messages.length === 0 && !currentRound) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">아직 빌드 로그가 없어요</p>
      </div>
    );
  }

  if (messages.length === 0 && currentRound?.status === "building") {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-sm text-muted-foreground">
            에이전트 시작 중...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="h-full overflow-y-auto"
      onScroll={checkIfAtBottom}
    >
      <div className="max-w-3xl mx-auto px-4 py-4">
        <CCMessages entries={messages} />

        {currentRound?.status === "building" && (
          <div className="mt-4 text-sm text-muted-foreground animate-pulse">
            빌드 중...
          </div>
        )}

        {currentRound?.status === "error" && currentRound.errorMessage && (
          <div className="mt-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {currentRound.errorMessage}
          </div>
        )}

        {currentRound?.status === "completed" && (
          <div className="mt-4 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
            라운드 완료! 미리보기 탭을 확인하세요.
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
