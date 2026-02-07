"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sparkles, Users, ArrowRight, Loader2 } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "create" | "join">("idle");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "방 생성에 실패했습니다");
      }
      const data = await res.json();
      localStorage.setItem(`host-token-${data.room.id}`, data.hostToken);
      router.push(`/room/${data.room.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/rooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "방을 찾을 수 없습니다");
      }
      const data = await res.json();
      router.push(`/room/${data.room.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      {/* Hero */}
      <div className="mb-12 text-center">
        <h1 className="mb-3 text-5xl font-bold tracking-tight">
          <span className="bg-gradient-to-r from-violet-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
            Vibe Coding Arena
          </span>
        </h1>
        <p className="text-lg text-muted-foreground">
          아이디어를 제출하고, 투표하고, AI가 실시간으로 만드는 걸 지켜보세요
        </p>
      </div>

      {/* Cards */}
      {mode === "idle" ? (
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xl">
          <button
            onClick={() => setMode("create")}
            className="flex-1 group rounded-xl border border-border bg-card p-6 text-left transition-all hover:border-violet-500/50 hover:shadow-lg hover:shadow-violet-500/10"
          >
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="size-5 text-violet-400" />
              <span className="font-semibold">아레나 만들기</span>
            </div>
            <p className="text-sm text-muted-foreground">
              새 코딩 아레나를 만들고 관객을 초대하세요
            </p>
            <ArrowRight className="mt-4 size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </button>

          <button
            onClick={() => setMode("join")}
            className="flex-1 group rounded-xl border border-border bg-card p-6 text-left transition-all hover:border-pink-500/50 hover:shadow-lg hover:shadow-pink-500/10"
          >
            <div className="mb-3 flex items-center gap-2">
              <Users className="size-5 text-pink-400" />
              <span className="font-semibold">아레나 참여</span>
            </div>
            <p className="text-sm text-muted-foreground">
              코드를 입력해서 아레나에 참여하세요
            </p>
            <ArrowRight className="mt-4 size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      ) : mode === "create" ? (
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="size-5 text-violet-400" />
            <span className="font-semibold">아레나 만들기</span>
          </div>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="프로젝트 이름"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-violet-500/50"
              autoFocus
            />
            <input
              type="text"
              placeholder="설명 (선택사항)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-violet-500/50"
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => { setMode("idle"); setError(null); }}
                disabled={loading}
              >
                뒤로
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!name.trim() || loading}
                className="flex-1 bg-violet-600 hover:bg-violet-700"
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : "아레나 만들기"}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Users className="size-5 text-pink-400" />
            <span className="font-semibold">아레나 참여</span>
          </div>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="참여 코드 입력 (예: ABC123)"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              maxLength={6}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-center font-mono text-lg tracking-widest outline-none focus:border-pink-500/50"
              autoFocus
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => { setMode("idle"); setError(null); }}
                disabled={loading}
              >
                뒤로
              </Button>
              <Button
                onClick={handleJoin}
                disabled={code.length < 6 || loading}
                className="flex-1 bg-pink-600 hover:bg-pink-700"
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : "참여하기"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
