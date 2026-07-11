import { describe, expect, it } from "vitest";

import {
  binarizeWhitePixels,
  buildTemplateLines,
  formatHeaderLine,
  normalizePixels,
  PRIZE_REGIONS,
} from "@/utils/prizeTemplate";

// 以 [r,g,b,a] 展開成 Uint8ClampedArray
function pixels(...rgba: number[]) {
  return new Uint8ClampedArray(rgba);
}

describe("PRIZE_REGIONS", () => {
  it("包含 header 與 A~G、最终共 9 個區域", () => {
    expect(PRIZE_REGIONS).toHaveLength(9);
    expect(PRIZE_REGIONS.map((r) => r.key)).toEqual([
      "header",
      "final",
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
    ]);
  });

  it("相對座標皆落在 0~1 範圍內", () => {
    for (const { rel } of PRIZE_REGIONS) {
      const [x, y, w, h] = rel;

      expect(x).toBeGreaterThanOrEqual(0);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(x + w).toBeLessThanOrEqual(1);
      expect(y + h).toBeLessThanOrEqual(1);
    }
  });

  it("除 header 外皆為 fraction 型別且有標籤", () => {
    for (const region of PRIZE_REGIONS) {
      if (region.key === "header") {
        expect(region.type).toBe("text");
      } else {
        expect(region.type).toBe("fraction");
        expect(region.label).not.toBe("");
      }
    }
  });
});

describe("binarizeWhitePixels", () => {
  it("將亮於門檻的白字轉為黑(0)、其餘轉為白(255)", () => {
    // 白色(255)、黃底(約227)、黑邊(0)
    const data = pixels(255, 255, 255, 255, 227, 227, 0, 255, 0, 0, 0, 255);

    binarizeWhitePixels(data, 235);

    expect([data[0], data[4], data[8]]).toEqual([0, 255, 255]);
  });

  it("門檻可調整", () => {
    const data = pixels(200, 200, 200, 255);

    binarizeWhitePixels(data, 150);

    expect(data[0]).toBe(0);
  });
});

describe("normalizePixels", () => {
  it("將灰階最小值拉到 0、最大值拉到 255", () => {
    const data = pixels(
      50,
      50,
      50,
      255,
      100,
      100,
      100,
      255,
      150,
      150,
      150,
      255,
    );

    normalizePixels(data);

    expect(data[0]).toBe(0);
    expect(data[8]).toBe(255);
    // 中間值介於兩端之間
    expect(data[4]).toBeGreaterThan(0);
    expect(data[4]).toBeLessThan(255);
  });

  it("單一顏色不會除以零", () => {
    const data = pixels(128, 128, 128, 255);

    expect(() => normalizePixels(data)).not.toThrow();
  });
});

describe("formatHeaderLine", () => {
  it("由兩組分數重組固定格式（含中文誤判時）", () => {
    expect(formatHeaderLine("$35/40f8 剩余奖励109/160")).toBe(
      "第35/40箱 剩余奖励109/160",
    );
  });

  it("純數字輸出也能正確重組", () => {
    expect(formatHeaderLine("第 35/40 箱 剩余 奖励 109/160")).toBe(
      "第35/40箱 剩余奖励109/160",
    );
  });

  it("僅取前兩組分數", () => {
    expect(formatHeaderLine("1/2 3/4 5/6")).toBe("第1/2箱 剩余奖励3/4");
  });

  it("不足兩組時退回清理後原文", () => {
    expect(formatHeaderLine("  只有  35/40  ")).toBe("只有 35/40");
  });
});

describe("buildTemplateLines", () => {
  it("組出 header 與各獎項標籤 + 分數", () => {
    const results = [
      "$35/40f8 剩余奖励109/160",
      "1/1",
      "1/2",
      "2/3",
      "3/6",
      "6/9",
      "32/40",
      "22/40",
      "43/60",
    ];
    const lines = buildTemplateLines(results);

    expect(lines).toEqual([
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
  });

  it("缺漏的結果以空字串處理，不會拋錯", () => {
    const lines = buildTemplateLines([]);

    expect(lines).toHaveLength(9);
    expect(lines[1]).toBe("最终奖");
  });

  it("清理分數中的多餘空白", () => {
    const results = ["1/2 3/4", " 1 / 2 "];
    const lines = buildTemplateLines(results);

    expect(lines[1]).toBe("最终奖 1 / 2");
  });
});
