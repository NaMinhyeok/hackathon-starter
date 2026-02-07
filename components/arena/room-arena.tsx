"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { ArenaHeader } from "./arena-header";
import { SuggestionsPanel } from "./suggestions-panel";
import { MainStage } from "./main-stage";
import type { SessionEntry } from "@/lib/types";

interface RoomState {
  room: {
    id: string;
    code: string;
    name: string;
    description: string | null;
    status: string;
  };
  suggestions: Array<{
    id: string;
    text: string;
    authorId: string;
    status: string;
    voteCount: number;
    voters: string[];
    createdAt: string;
  }>;
  currentRound: {
    id: string;
    roundNumber: number;
    status: string;
    suggestion: { id: string; text: string };
    errorMessage: string | null;
    createdAt: string;
    completedAt: string | null;
  } | null;
  totalRounds: number;
  messages: SessionEntry[];
}

interface RoomArenaProps {
  roomId: string;
}

export function RoomArena({ roomId }: RoomArenaProps) {
  const [state, setState] = useState<RoomState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [voterId] = useState(() => {
    if (typeof window === "undefined") return "";
    const stored = localStorage.getItem("arena-voter-id");
    if (stored) return stored;
    const id = `voter-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem("arena-voter-id", id);
    return id;
  });
  const [hostToken, setHostToken] = useState<string | null>(null);
  const prevRoundStatusRef = useRef<string | null>(null);
  const [previewRefreshKey, setPreviewRefreshKey] = useState(0);

  // Load host token from localStorage
  useEffect(() => {
    const token = localStorage.getItem(`host-token-${roomId}`);
    setHostToken(token);
  }, [roomId]);

  // Poll for room state
  const fetchState = useCallback(async () => {
    try {
      const res = await fetch(`/api/rooms/${roomId}/state`);
      if (!res.ok) throw new Error("Failed to fetch room state");
      const data: RoomState = await res.json();

      // Detect round completion for auto-refresh preview
      if (
        data.currentRound?.status === "completed" &&
        prevRoundStatusRef.current === "building"
      ) {
        setPreviewRefreshKey((k) => k + 1);
      }
      prevRoundStatusRef.current = data.currentRound?.status || null;

      setState(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connection error");
    }
  }, [roomId]);

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 2000);
    return () => clearInterval(interval);
  }, [fetchState]);

  const handleSubmitSuggestion = async (text: string) => {
    try {
      const res = await fetch(`/api/rooms/${roomId}/suggestions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, authorId: voterId }),
      });
      if (!res.ok) throw new Error("Failed to submit suggestion");
      await fetchState();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit");
    }
  };

  const handleVote = async (suggestionId: string) => {
    try {
      await fetch(`/api/rooms/${roomId}/suggestions/${suggestionId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voterId }),
      });
      await fetchState();
    } catch {
      // Silently fail
    }
  };

  const handleStartRound = async () => {
    if (!hostToken) return;
    try {
      const res = await fetch(`/api/rooms/${roomId}/rounds`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-host-token": hostToken,
        },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to start round");
      }
      await fetchState();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start round");
    }
  };

  if (!state) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground animate-pulse">아레나 로딩중...</div>
      </div>
    );
  }

  const isHost = !!hostToken;
  const canStartRound =
    isHost &&
    state.suggestions.some((s) => s.status === "pending") &&
    (!state.currentRound || state.currentRound.status !== "building");

  return (
    <div className="flex h-screen flex-col bg-background">
      <ArenaHeader
        room={state.room}
        currentRound={state.currentRound}
        totalRounds={state.totalRounds}
        roomId={roomId}
      />

      {error && (
        <div className="border-b border-destructive/30 bg-destructive/10 px-4 py-1.5 text-center text-sm text-destructive">
          {error}
        </div>
      )}

      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={30} minSize={20} maxSize={45}>
          <SuggestionsPanel
            suggestions={state.suggestions}
            voterId={voterId}
            onSubmit={handleSubmitSuggestion}
            onVote={handleVote}
            onStartRound={handleStartRound}
            canStartRound={canStartRound}
            isHost={isHost}
            isBuilding={state.currentRound?.status === "building"}
          />
        </ResizablePanel>

        <ResizableHandle />

        <ResizablePanel defaultSize={70} minSize={40}>
          <MainStage
            roomId={roomId}
            currentRound={state.currentRound}
            messages={state.messages}
            previewRefreshKey={previewRefreshKey}
            onRefreshPreview={() => setPreviewRefreshKey((k) => k + 1)}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
