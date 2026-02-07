"use client";

import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import type {
  SessionEntry,
  ContentBlock,
  ToolUseBlock,
  ToolResultBlock,
} from "@/lib/types";
import { isAssistantMessage, isToolUseBlock, isToolResultBlock, isThinkingBlock, isTextBlock } from "@/lib/types";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Activity item types
// ---------------------------------------------------------------------------

interface ActivityItem {
  key: string;
  emoji: string;
  label: string;
  detail: string;
  done: boolean; // has matching tool_result
}

const TOOL_META: Record<string, { emoji: string; label: string; field: string }> = {
  Read:  { emoji: "📄", label: "파일 읽기", field: "file_path" },
  Write: { emoji: "✏️", label: "파일 작성", field: "file_path" },
  Edit:  { emoji: "🔧", label: "파일 수정", field: "file_path" },
  Bash:  { emoji: "💻", label: "명령 실행", field: "command" },
  Grep:  { emoji: "🔍", label: "코드 검색", field: "pattern" },
  Glob:  { emoji: "📁", label: "파일 탐색", field: "pattern" },
  Task:  { emoji: "🤖", label: "서브태스크", field: "description" },
};

function truncate(s: string, max: number) {
  return s.length > max ? s.slice(0, max) + "…" : s;
}

// ---------------------------------------------------------------------------
// Extract activity items from session entries
// ---------------------------------------------------------------------------

function extractActivities(entries: SessionEntry[]): ActivityItem[] {
  const items: ActivityItem[] = [];
  // Collect all tool_result ids so we can mark completed tool_uses
  const resultIds = new Set<string>();

  // First pass — gather all tool_result ids
  for (const entry of entries) {
    if (!isAssistantMessage(entry)) continue;
    for (const block of entry.message.content) {
      if (isToolResultBlock(block)) {
        resultIds.add((block as ToolResultBlock).tool_use_id);
      }
    }
  }

  // Second pass — build activity list
  for (const entry of entries) {
    if (!isAssistantMessage(entry)) continue;
    for (const block of entry.message.content) {
      if (isThinkingBlock(block)) {
        items.push({
          key: `thinking-${entry.uuid}-${items.length}`,
          emoji: "🧠",
          label: "사고 중",
          detail: "",
          done: true, // thinking blocks are always "done"
        });
      } else if (isToolUseBlock(block)) {
        const tu = block as ToolUseBlock;
        const meta = TOOL_META[tu.name];
        if (meta) {
          const detail = typeof tu.input[meta.field] === "string"
            ? truncate(tu.input[meta.field] as string, 80)
            : "";
          items.push({
            key: tu.id,
            emoji: meta.emoji,
            label: meta.label,
            detail,
            done: resultIds.has(tu.id),
          });
        } else {
          // Unknown tool — still show it
          items.push({
            key: tu.id,
            emoji: "⚙️",
            label: tu.name,
            detail: "",
            done: resultIds.has(tu.id),
          });
        }
      } else if (isTextBlock(block) && block.text.length > 0) {
        items.push({
          key: `text-${entry.uuid}-${items.length}`,
          emoji: "💬",
          label: "에이전트 메시지",
          detail: truncate(block.text, 80),
          done: true,
        });
      }
    }
  }

  return items;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface BuildActivityProps {
  messages: SessionEntry[];
}

export function BuildActivity({ messages }: BuildActivityProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const activities = useMemo(() => extractActivities(messages), [messages]);

  const checkIfAtBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setIsAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 60);
  }, []);

  useEffect(() => {
    if (isAtBottom) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [activities, isAtBottom]);

  if (activities.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-pulse text-xs text-muted-foreground">
          에이전트 시작 중...
        </div>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="h-full overflow-y-auto px-3 py-2"
      onScroll={checkIfAtBottom}
    >
      <div className="space-y-1">
        {activities.map((item, idx) => {
          const isLast = idx === activities.length - 1;
          const inProgress = !item.done;
          return (
            <div
              key={item.key}
              className={cn(
                "flex items-start gap-2 rounded px-2 py-1 text-xs transition-opacity",
                item.done && !isLast && "opacity-50",
                inProgress && "bg-violet-500/5"
              )}
            >
              {/* Status indicator */}
              <span className="mt-0.5 shrink-0 w-3.5 text-center">
                {inProgress ? (
                  <span className="inline-block size-2 animate-pulse rounded-full bg-violet-400" />
                ) : (
                  <span className="text-emerald-400">✓</span>
                )}
              </span>

              {/* Emoji + label */}
              <span className="shrink-0">{item.emoji}</span>
              <span className="font-medium text-foreground whitespace-nowrap">
                {item.label}
              </span>

              {/* Detail */}
              {item.detail && (
                <span className="truncate text-muted-foreground">
                  {item.detail}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div ref={bottomRef} />
    </div>
  );
}
