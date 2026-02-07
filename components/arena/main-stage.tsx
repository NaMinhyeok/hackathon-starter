"use client";

import { useState } from "react";
import { Eye, Terminal, FolderTree } from "lucide-react";
import { cn } from "@/lib/utils";
import { PreviewPanel } from "./preview-panel";
import { BuildLogView } from "./build-log-view";
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
    { id: "preview", label: "Preview", icon: <Eye className="size-3.5" /> },
    { id: "build", label: "Build Log", icon: <Terminal className="size-3.5" /> },
    { id: "files", label: "Files", icon: <FolderTree className="size-3.5" /> },
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
            Building: {currentRound.suggestion.text}
          </div>
        )}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "preview" && (
          <PreviewPanel
            roomId={roomId}
            refreshKey={previewRefreshKey}
            onRefresh={onRefreshPreview}
            hasRounds={!!currentRound}
          />
        )}
        {activeTab === "build" && (
          <BuildLogView
            messages={messages}
            currentRound={currentRound}
          />
        )}
        {activeTab === "files" && (
          <ArenaFileExplorer roomId={roomId} />
        )}
      </div>
    </div>
  );
}
