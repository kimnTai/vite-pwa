import { useCallback, useEffect, useRef, useState } from "react";
import { createWorker, PSM, type Worker } from "tesseract.js";

export type OcrStatus = "idle" | "loading" | "recognizing" | "done" | "error";

export type OcrImage = File | Blob | HTMLCanvasElement;

export interface RecognizeOptions {
  psm?: PSM;
  whitelist?: string;
  // 該次辨識使用的語言（如 "eng"、"chi_sim+eng"）；預設維持目前語言
  langs?: string;
}

export interface BatchTask extends RecognizeOptions {
  image: OcrImage;
}

const LANGS = ["chi_sim", "eng"];
const DEFAULT_LANGS = "chi_sim+eng";

// 將 Tesseract.js 回報的 status 轉成中文提示文字
function toStatusLabel(status: string) {
  if (status.includes("recognizing")) {
    return "辨識中…";
  }
  if (status.includes("loading language") || status.includes("initializing")) {
    return "載入語言資料…";
  }
  if (status.includes("loading") || status.includes("initializing tesseract")) {
    return "載入辨識引擎…";
  }

  return "準備中…";
}

export function useOcr() {
  const workerRef = useRef<Worker | null>(null);
  const workerPromiseRef = useRef<Promise<Worker> | null>(null);
  const activeLangsRef = useRef(DEFAULT_LANGS);
  const [status, setStatus] = useState<OcrStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [statusLabel, setStatusLabel] = useState("");
  const [error, setError] = useState<string | null>(null);

  // silent=true 供背景預載使用，不更動可見的 status（避免頁面一載入就顯示進度）
  const ensureWorker = useCallback((silent = false) => {
    // 尚未就緒且非背景預載時，顯示「載入引擎」狀態
    if (!silent && !workerRef.current) {
      setStatus("loading");
      setStatusLabel("載入辨識引擎…");
    }

    // 記憶化建立中的 Promise，避免預載與辨識同時觸發而建立兩個 worker
    workerPromiseRef.current ??= createWorker(LANGS, 1, {
      logger: (m) => {
        setStatusLabel(toStatusLabel(m.status));

        if (typeof m.progress === "number") {
          setProgress(Math.round(m.progress * 100));
        }
      },
    }).then((worker) => {
      workerRef.current = worker;

      return worker;
    });

    return workerPromiseRef.current;
  }, []);

  // 掛載時背景預載引擎與語言檔（讓首次辨識免等下載），卸載時清理 worker
  useEffect(() => {
    void ensureWorker(true);

    return () => {
      void workerRef.current?.terminate();
      workerRef.current = null;
      workerPromiseRef.current = null;
    };
  }, [ensureWorker]);

  const runTask = async (worker: Worker, task: BatchTask) => {
    // 切換語言（例如分數格用 eng，中文列用 chi_sim+eng），避免中文模型干擾數字
    if (task.langs && task.langs !== activeLangsRef.current) {
      await worker.reinitialize(task.langs);
      activeLangsRef.current = task.langs;
    }

    await worker.setParameters({
      tessedit_pageseg_mode: task.psm ?? PSM.AUTO,
      tessedit_char_whitelist: task.whitelist ?? "",
      preserve_interword_spaces: "1",
    });

    const result = await worker.recognize(task.image);

    return result.data.text;
  };

  // 依序辨識多個區域，回報「已完成 / 總數」進度
  const runBatch = async (tasks: BatchTask[]) => {
    setError(null);
    setProgress(0);

    try {
      const worker = await ensureWorker();

      setStatus("recognizing");

      const results: string[] = [];

      for (let i = 0; i < tasks.length; i++) {
        setStatusLabel(`擷取欄位 ${i + 1}/${tasks.length}…`);
        setProgress(Math.round((i / tasks.length) * 100));
        results.push(await runTask(worker, tasks[i]));
      }

      setProgress(100);
      setStatus("done");

      return results;
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "辨識失敗，請再試一次");

      return null;
    }
  };

  return { runBatch, status, progress, statusLabel, error };
}
