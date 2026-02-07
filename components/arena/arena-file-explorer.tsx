"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { FileExplorer } from "@/components/workspace/file-explorer";
import { FileViewer } from "@/components/workspace/file-viewer";
import type { FileInfo } from "@/lib/types";

interface ArenaFileExplorerProps {
  roomId: string;
}

export function ArenaFileExplorer({ roomId }: ArenaFileExplorerProps) {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [loadingContent, setLoadingContent] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const prevFilesJson = useRef<string>("");

  const fetchFiles = useCallback(async () => {
    try {
      const res = await fetch(`/api/rooms/${roomId}/files?tree=true`);
      if (res.ok) {
        const data = await res.json();
        const newFiles = data.files || [];
        // Only update state if files actually changed to avoid resetting FileExplorer's folder state
        const json = JSON.stringify(newFiles);
        if (json !== prevFilesJson.current) {
          prevFilesJson.current = json;
          setFiles(newFiles);
        }
      }
    } catch {
      // Silently fail
    } finally {
      setLoadingFiles(false);
    }
  }, [roomId]);

  useEffect(() => {
    fetchFiles();
    const interval = setInterval(fetchFiles, 5000);
    return () => clearInterval(interval);
  }, [fetchFiles]);

  const handleFileSelect = useCallback(async (file: FileInfo) => {
    if (file.type === "directory") return;
    setSelectedFilePath(file.path);
    setLoadingContent(true);
    setContentError(null);
    try {
      const res = await fetch(`/api/rooms/${roomId}/files${file.path}`);
      if (res.ok) {
        const data = await res.json();
        setFileContent(data.content);
      } else {
        setContentError("파일을 불러올 수 없습니다");
      }
    } catch {
      setContentError("파일 로딩 중 오류 발생");
    } finally {
      setLoadingContent(false);
    }
  }, [roomId]);

  return (
    <div className="flex h-full">
      <FileExplorer
        files={files}
        onFileSelect={handleFileSelect}
        selectedFilePath={selectedFilePath}
        isCollapsed={false}
        onToggleCollapse={() => {}}
        isLoading={loadingFiles}
      />
      <div className="flex-1 overflow-hidden">
        <FileViewer
          selectedFilePath={selectedFilePath}
          selectedFileContent={fileContent}
          isLoadingContent={loadingContent}
          contentError={contentError}
        />
      </div>
    </div>
  );
}
