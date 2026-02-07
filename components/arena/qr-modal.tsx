"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QRModalProps {
  roomCode: string;
  roomId: string;
  onClose: () => void;
}

export function QRModal({ roomCode, roomId, onClose }: QRModalProps) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined"
    ? `${window.location.origin}/room/${roomId}`
    : "";

  const copyUrl = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </button>

        <div className="flex flex-col items-center gap-4">
          <h3 className="text-lg font-semibold">Join Arena</h3>

          <div className="rounded-xl bg-white p-4">
            <QRCodeSVG value={url} size={200} level="M" />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Code:</span>
            <span className="font-mono text-2xl font-bold tracking-widest">
              {roomCode}
            </span>
          </div>

          <Button
            variant="outline"
            onClick={copyUrl}
            className="w-full"
          >
            {copied ? (
              <>
                <Check className="size-4 text-emerald-400" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="size-4" />
                Copy Link
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Scan the QR code or share the link to join
          </p>
        </div>
      </div>
    </div>
  );
}
