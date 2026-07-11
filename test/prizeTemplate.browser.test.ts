import { createWorker, PSM } from "tesseract.js";
import { describe, expect, it } from "vitest";

import {
  buildTemplateLines,
  loadImageFromFile,
  preprocessRegion,
  PRIZE_REGIONS,
} from "@/utils/prizeTemplate";

// Vite 提供的服務用 URL（實際案例：public 的遊戲截圖）
import testImgUrl from "./fixtures/test.jpg?url";

describe("實際截圖模板辨識（真實瀏覽器）", () => {
  it("正確擷取核心自选宝箱的箱數、剩余奖励與 A~G、最终各獎項分數", async () => {
    const blob = await (await fetch(testImgUrl)).blob();
    const file = new File([blob], "test.jpg", { type: "image/jpeg" });
    const img = await loadImageFromFile(file); // 真實 Image
    const worker = await createWorker(["chi_sim", "eng"], 1); // 真實瀏覽器 OCR

    try {
      const results: string[] = [];
      let activeLangs = "chi_sim+eng";

      for (const region of PRIZE_REGIONS) {
        const isHeader = region.key === "header";
        // 分數格用 eng（避免中文模型在數字間插入雜字），header 用 chi_sim+eng
        const langs = isHeader ? "chi_sim+eng" : "eng";

        if (langs !== activeLangs) {
          await worker.reinitialize(langs);
          activeLangs = langs;
        }

        await worker.setParameters({
          tessedit_pageseg_mode: PSM.SINGLE_LINE,
          tessedit_char_whitelist: isHeader ? "" : "0123456789/",
          preserve_interword_spaces: "1",
        });

        const canvas = preprocessRegion(img, region); // 真實 canvas 前處理
        const { data } = await worker.recognize(canvas);

        results.push(data.text);
      }

      expect(buildTemplateLines(results)).toEqual([
        "第35/40箱 剩余奖励109/160",
        "最终奖 1/1",
        "A奖 1/2",
        "B奖 2/3",
        "C奖 3/6",
        "D奖 6/9",
        "E奖 32/40",
        "F奖 22/40",
        "G奖 43/60",
      ]);
    } finally {
      await worker.terminate();
    }
  }, 120_000);
});
