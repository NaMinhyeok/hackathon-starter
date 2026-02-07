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
          setError(false);
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
        <p className="text-sm font-medium">첫 라운드를 기다리는 중</p>
        <p className="text-xs text-muted-foreground mt-1">
          아이디어를 제출하고 투표하세요. 호스트가 빌드를 시작합니다!
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
        <p className="text-sm text-muted-foreground">아직 미리보기가 없어요</p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          AI 에이전트가 작업 중입니다...
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          className="mt-3"
        >
          <RefreshCw className="size-3.5" />
          새로고침
        </Button>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <div className="absolute right-2 top-2 z-10 flex gap-1">
        <Button variant="outline" size="iconXs" onClick={onRefresh} title="새로고침">
          <RefreshCw className={`size-3 ${loading ? "animate-spin" : ""}`} />
        </Button>
        <Button
          variant="outline"
          size="iconXs"
          onClick={() => window.open(`/api/rooms/${roomId}/preview`, "_blank")}
          title="새 탭에서 열기"
        >
          <ExternalLink className="size-3" />
        </Button>
      </div>
      <iframe
        srcDoc={html}
        sandbox="allow-scripts"
        className="h-full w-full border-0 bg-white"
        title="미리보기"
      />
    </div>
  );
}
