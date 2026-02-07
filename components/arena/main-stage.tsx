"use client";

import { useState } from "react";
import { Eye, Terminal, FolderTree } from "lucide-react";
import { cn } from "@/lib/utils";
import { PreviewPanel } from "./preview-panel";
import { BuildLogView } from "./build-log-view";
import { BuildActivity } from "./build-activity";
import { ArenaFileExplorer } from "./arena-file-explorer";
import type { SessionEntry } from "@/lib/types";

type Tab = "preview" | "build" | "files";

interface MainStageProps {
  roomId: string;
  currentRound: {
    id: string;
    roundNumber: number;
    status: string;
    suggestion: { text: string };
    errorMessage: string | null;
  } | null;
  messages: SessionEntry[];
  previewRefreshKey: number;
  onRefreshPreview: () => void;
}

export function MainStage({
  roomId,
  currentRound,
  messages,
  previewRefreshKey,
  onRefreshPreview,
}: MainStageProps) {
  const [activeTab, setActiveTab] = useState<Tab>("preview");

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "preview", label: "미리보기", icon: <Eye className="size-3.5" /> },
    { id: "build", label: "빌드 로그", icon: <Terminal className="size-3.5" /> },
    { id: "files", label: "파일", icon: <FolderTree className="size-3.5" /> },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Tab bar */}
      <div className="flex items-center border-b border-border px-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors border-b-2",
              activeTab === tab.id
                ? "border-violet-500 text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}

        {/* Current feature badge */}
        {currentRound && currentRound.status === "building" && (
          <div className="ml-auto mr-2 flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs text-amber-400">
            <span className="inline-block size-1.5 animate-pulse rounded-full bg-amber-400" />
            빌드중: {currentRound.suggestion.text}
          </div>
        )}
      </div>

      {/* Tab content — all tabs stay mounted, hidden with CSS */}
      <div className="flex-1 overflow-hidden relative">
        <div className={cn("absolute inset-0 flex flex-col", activeTab !== "preview" && "hidden")}>
          {currentRound?.status === "building" && (
            <div className="h-[200px] shrink-0 border-b border-border">
              <div className="flex items-center gap-1.5 border-b border-border/50 px-3 py-1.5">
                <span className="inline-block size-1.5 animate-pulse rounded-full bg-violet-400" />
                <span className="text-xs font-medium text-muted-foreground">실시간 작업 현황</span>
              </div>
              <div className="h-[calc(100%-28px)]">
                <BuildActivity messages={messages} />
              </div>
            </div>
          )}
          <div className="flex-1 min-h-0">
            <PreviewPanel
              roomId={roomId}
              refreshKey={previewRefreshKey}
              onRefresh={onRefreshPreview}
              hasRounds={!!currentRound}
            />
          </div>
        </div>
        <div className={cn("absolute inset-0", activeTab !== "build" && "hidden")}>
          <BuildLogView
            messages={messages}
            currentRound={currentRound}
          />
        </div>
        <div className={cn("absolute inset-0", activeTab !== "files" && "hidden")}>
          <ArenaFileExplorer roomId={roomId} />
        </div>
      </div>
    </div>
  );
}
