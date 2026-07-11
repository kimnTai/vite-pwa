import { useEffect, useRef, useState } from "react";
import { PSM } from "tesseract.js";

import { useOcr } from "@/hooks/useOcr";
import { cn } from "@/lib/utils";
import {
  buildTemplateLines,
  loadImageFromFile,
  preprocessRegion,
  PRIZE_REGIONS,
} from "@/utils/prizeTemplate";

export default function ImageOcr() {
  const { runBatch, status, progress, statusLabel, error } = useOcr();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);
  const [lastFile, setLastFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const busy = status === "loading" || status === "recognizing";

  // 逐格裁切辨識並組成結構化文字
  async function runOcr(file: File) {
    setText("");
    setCopied(false);

    const img = await loadImageFromFile(file);
    // 分數格用 eng 專注數字（避免中文模型插入雜字）並限定數字白名單；
    // header 用 chi_sim+eng，不設白名單，讓誤判的中文自然分隔兩組數字
    const tasks = PRIZE_REGIONS.map((region) => {
      const isHeader = region.key === "header";

      return {
        image: preprocessRegion(img, region),
        psm: PSM.SINGLE_LINE,
        langs: isHeader ? "chi_sim+eng" : "eng",
        whitelist: isHeader ? "" : "0123456789/",
      };
    });

    const results = await runBatch(tasks);

    if (!results) {
      return;
    }

    setText(buildTemplateLines(results).join("\n"));
  }

  async function handleImage(file: File) {
    if (!file.type.startsWith("image/")) {
      setInputError("請選擇圖片檔案");

      return;
    }

    setInputError(null);
    setLastFile(file);
    setPreviewUrl((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }

      return URL.createObjectURL(file);
    });

    await runOcr(file);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    if (file) {
      void handleImage(file);
    }
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);

    const file = e.dataTransfer.files?.[0];

    if (file) {
      void handleImage(file);
    }
  }

  function onPaste(e: React.ClipboardEvent<HTMLDivElement>) {
    const file = Array.from(e.clipboardData.items)
      .find((item) => item.type.startsWith("image/"))
      ?.getAsFile();

    if (file) {
      void handleImage(file);
    }
  }

  async function copyText() {
    if (!text) {
      return;
    }

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div
      onPaste={onPaste}
      className="space-y-4 rounded-lg border border-gray-700 bg-gray-900/40 p-3 sm:p-4"
    >
      {/* 拖放 / 選擇 / 貼上 */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed p-6 text-center transition",
          dragOver
            ? "border-indigo-400 bg-indigo-500/10"
            : "border-gray-600 hover:border-gray-500",
        )}
      >
        <p className="text-sm font-medium text-gray-200">
          點擊選擇圖片，或拖放至此
        </p>
        <p className="text-xs text-gray-400">也可直接貼上（Ctrl/⌘ + V）</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onFileChange}
          className="hidden"
        />
      </div>

      {inputError && <p className="text-sm text-red-400">{inputError}</p>}

      {/* 重新辨識 */}
      {lastFile && (
        <button
          onClick={() => lastFile && void runOcr(lastFile)}
          disabled={busy}
          className="w-full rounded-lg border border-gray-600 px-3 py-1.5 text-sm text-gray-200 transition hover:bg-gray-700 disabled:opacity-50"
        >
          重新辨識
        </button>
      )}

      {/* 預覽 */}
      {previewUrl && (
        <div className="overflow-hidden rounded-lg border border-gray-700">
          <img
            src={previewUrl}
            alt="待辨識圖片預覽"
            className="mx-auto max-h-72 w-auto object-contain"
          />
        </div>
      )}

      {/* 進度 */}
      {busy && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-400">
            <span>{statusLabel}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-700">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      {/* 結果 */}
      {status === "done" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-200">辨識結果</span>
            <button
              onClick={() => void copyText()}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-500"
            >
              {copied ? "已複製" : "複製"}
            </button>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={9}
            className="max-h-72 w-full resize-y overflow-auto rounded-lg border border-gray-700 bg-gray-900 p-3 text-sm text-gray-100 focus:border-indigo-500 focus:outline-none"
          />
          <p className="text-xs text-gray-500">
            結構化擷取針對「核心自选宝箱」固定版面；如有誤判可直接在上方編輯修正。
          </p>
        </div>
      )}
    </div>
  );
}
