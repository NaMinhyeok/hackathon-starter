"use client";

import { useState } from "react";
import { Send, Play, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SuggestionCard } from "./suggestion-card";

interface Suggestion {
  id: string;
  text: string;
  authorId: string;
  status: string;
  voteCount: number;
  voters: string[];
  createdAt: string;
}

interface SuggestionsPanelProps {
  suggestions: Suggestion[];
  voterId: string;
  onSubmit: (text: string) => Promise<void>;
  onVote: (suggestionId: string) => Promise<void>;
  onStartRound: () => Promise<void>;
  canStartRound: boolean;
  isHost: boolean;
  isBuilding?: boolean;
}

export function SuggestionsPanel({
  suggestions,
  voterId,
  onSubmit,
  onVote,
  onStartRound,
  canStartRound,
  isHost,
  isBuilding,
}: SuggestionsPanelProps) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [starting, setStarting] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(text.trim());
      setText("");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartRound = async () => {
    if (starting) return;
    setStarting(true);
    try {
      await onStartRound();
    } finally {
      setStarting(false);
    }
  };

  const pendingSuggestions = suggestions.filter((s) => s.status === "pending");
  const builtSuggestions = suggestions.filter((s) => s.status === "built" || s.status === "selected");

  return (
    <div className="flex h-full flex-col border-r border-border">
      {/* Header */}
      <div className="border-b border-border px-3 py-2">
        <h2 className="text-sm font-semibold">아이디어</h2>
        <p className="text-xs text-muted-foreground">
          {pendingSuggestions.length}개 대기중
          {builtSuggestions.length > 0 && ` / ${builtSuggestions.length}개 완료`}
        </p>
      </div>

      {/* Input */}
      <div className="border-b border-border p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="기능 아이디어를 입력하세요..."
            disabled={submitting}
            className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-violet-500/50"
          />
          <Button
            size="iconSm"
            onClick={handleSubmit}
            disabled={!text.trim() || submitting}
            className="bg-violet-600 hover:bg-violet-700"
          >
            {submitting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Send className="size-3.5" />
            )}
          </Button>
        </div>
      </div>

      {/* Suggestions list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {suggestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground">아직 아이디어가 없어요</p>
            <p className="text-xs text-muted-foreground/60 mt-1">첫 번째로 제안해보세요!</p>
          </div>
        ) : (
          suggestions.map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              voterId={voterId}
              onVote={() => onVote(suggestion.id)}
            />
          ))
        )}
      </div>

      {/* Start Round button (host only) */}
      {isHost && (
        <div className="border-t border-border p-3">
          <Button
            onClick={handleStartRound}
            disabled={!canStartRound || starting}
            className="w-full bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700"
          >
            {starting || isBuilding ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {isBuilding ? "빌드중..." : "시작하는 중..."}
              </>
            ) : (
              <>
                <Play className="size-4" />
                라운드 시작
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
