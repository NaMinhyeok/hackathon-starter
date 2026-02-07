"use client";

import { useState } from "react";
import { Copy, Check, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QRModal } from "./qr-modal";

interface ArenaHeaderProps {
  room: {
    id: string;
    code: string;
    name: string;
    status: string;
  };
  currentRound: {
    roundNumber: number;
    status: string;
  } | null;
  totalRounds: number;
  roomId: string;
}

export function ArenaHeader({ room, currentRound, totalRounds, roomId }: ArenaHeaderProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const copyCode = async () => {
    await navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusLabel = () => {
    if (!currentRound) return "Lobby";
    if (currentRound.status === "building") return `Building Round ${currentRound.roundNumber}...`;
    return `Round ${totalRounds} Complete`;
  };

  const statusColor = () => {
    if (!currentRound) return "bg-blue-500/20 text-blue-400";
    if (currentRound.status === "building") return "bg-amber-500/20 text-amber-400";
    return "bg-emerald-500/20 text-emerald-400";
  };

  return (
    <>
      <header className="flex items-center justify-between border-b border-border px-4 h-[52px]">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-sm">{room.name}</span>
          <button
            onClick={copyCode}
            className="flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            {room.code}
            {copied ? (
              <Check className="size-3 text-emerald-400" />
            ) : (
              <Copy className="size-3" />
            )}
          </button>
          <Button
            variant="ghost"
            size="iconSm"
            onClick={() => setShowQR(true)}
            title="Show QR Code"
          >
            <QrCode className="size-4" />
          </Button>
        </div>

        <div className="flex items-center gap-3">
          {totalRounds > 0 && (
            <span className="text-xs text-muted-foreground">
              Round {currentRound?.roundNumber || totalRounds}/{totalRounds}
            </span>
          )}
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor()}`}>
            {currentRound?.status === "building" && (
              <span className="mr-1 inline-block size-1.5 animate-pulse rounded-full bg-amber-400" />
            )}
            {statusLabel()}
          </span>
        </div>
      </header>

      {showQR && (
        <QRModal
          roomCode={room.code}
          roomId={roomId}
          onClose={() => setShowQR(false)}
        />
      )}
    </>
  );
}
