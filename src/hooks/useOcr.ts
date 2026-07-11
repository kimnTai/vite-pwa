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
  const activeLangsRef = useRef(DEFAULT_LANGS);
  const [status, setStatus] = useState<OcrStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [statusLabel, setStatusLabel] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      void workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  const ensureWorker = useCallback(async () => {
    if (workerRef.current) {
      return workerRef.current;
    }

    setStatus("loading");
    setStatusLabel("載入辨識引擎…");

    workerRef.current = await createWorker(LANGS, 1, {
      logger: (m) => {
        setStatusLabel(toStatusLabel(m.status));

        if (typeof m.progress === "number") {
          setProgress(Math.round(m.progress * 100));
        }
      },
    });

    return workerRef.current;
  }, []);

  const runTask = useCallback(async (worker: Worker, task: BatchTask) => {
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
  }, []);

  // 依序辨識多個區域，回報「已完成 / 總數」進度
  const runBatch = useCallback(
    async (tasks: BatchTask[]) => {
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
    },
    [ensureWorker, runTask],
  );

  return { runBatch, status, progress, statusLabel, error };
}
