"use client";

import { useState, useEffect } from "react";
import { RefreshCw, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PreviewPanelProps {
  roomId: string;
  refreshKey: number;
  onRefresh: () => void;
  hasRounds: boolean;
}

export function PreviewPanel({ roomId, refreshKey, onRefresh, hasRounds }: PreviewPanelProps) {
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchPreview = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/rooms/${roomId}/preview`);
        if (res.ok) {
          const text = await res.text();
          setHtml(text);
          setError(false);
        } else {
          setHtml(null);
          setError(false); // 404 is expected when no index.html yet
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchPreview();
  }, [roomId, refreshKey]);

  if (!hasRounds) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center px-4">
        <div className="text-4xl mb-3">
          <span role="img" aria-label="rocket">&#x1F680;</span>
        </div>
        <p className="text-sm font-medium">Waiting for first round</p>
        <p className="text-xs text-muted-foreground mt-1">
          Submit ideas and vote, then the host will start building!
        </p>
      </div>
    );
  }

  if (loading && !html) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!html) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center px-4">
        <p className="text-sm text-muted-foreground">No preview yet</p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          The AI agent is working on it...
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          className="mt-3"
        >
          <RefreshCw className="size-3.5" />
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <div className="absolute right-2 top-2 z-10 flex gap-1">
        <Button variant="outline" size="iconXs" onClick={onRefresh} title="Refresh preview">
          <RefreshCw className={`size-3 ${loading ? "animate-spin" : ""}`} />
        </Button>
        <Button
          variant="outline"
          size="iconXs"
          onClick={() => window.open(`/api/rooms/${roomId}/preview`, "_blank")}
          title="Open in new tab"
        >
          <ExternalLink className="size-3" />
        </Button>
      </div>
      <iframe
        srcDoc={html}
        sandbox="allow-scripts"
        className="h-full w-full border-0 bg-white"
        title="Preview"
      />
    </div>
  );
}
