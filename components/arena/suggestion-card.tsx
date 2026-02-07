"use client";

import { ThumbsUp, Check, Hammer } from "lucide-react";
import { cn } from "@/lib/utils";

interface SuggestionCardProps {
  suggestion: {
    id: string;
    text: string;
    status: string;
    voteCount: number;
    voters: string[];
  };
  voterId: string;
  onVote: () => void;
}

export function SuggestionCard({ suggestion, voterId, onVote }: SuggestionCardProps) {
  const hasVoted = suggestion.voters.includes(voterId);
  const isBuilt = suggestion.status === "built";
  const isBuilding = suggestion.status === "selected";
  const isPending = suggestion.status === "pending";

  return (
    <div
      className={cn(
        "group flex items-start gap-2 rounded-lg border border-border p-2.5 transition-all",
        isBuilt && "border-emerald-500/30 bg-emerald-500/5",
        isBuilding && "border-amber-500/30 bg-amber-500/5",
        isPending && "hover:border-border/80 hover:bg-muted/30"
      )}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-snug">{suggestion.text}</p>
        <div className="mt-1 flex items-center gap-2">
          {isBuilt && (
            <span className="flex items-center gap-1 text-xs text-emerald-400">
              <Check className="size-3" /> Built
            </span>
          )}
          {isBuilding && (
            <span className="flex items-center gap-1 text-xs text-amber-400">
              <Hammer className="size-3 animate-pulse" /> Building
            </span>
          )}
        </div>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          if (isPending) onVote();
        }}
        disabled={!isPending}
        className={cn(
          "flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-all",
          isPending && !hasVoted && "text-muted-foreground hover:text-violet-400 hover:bg-violet-500/10",
          isPending && hasVoted && "text-violet-400 bg-violet-500/15",
          !isPending && "text-muted-foreground/50 cursor-default"
        )}
      >
        <ThumbsUp className={cn("size-3", hasVoted && isPending && "fill-violet-400")} />
        {suggestion.voteCount}
      </button>
    </div>
  );
}
