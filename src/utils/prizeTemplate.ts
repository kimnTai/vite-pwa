// 「核心自选宝箱」畫面的模板擷取設定。
// 座標為相對比例 [x, y, w, h]（以圖片寬高為 1），可容忍等比縮放的不同解析度。

export interface TemplateRegion {
  key: string;
  label: string;
  // fraction：色塊上的白色分數（高門檻二值化 + 負片）；text：一般中文文字列
  type: "fraction" | "text";
  rel: [number, number, number, number];
}

export const PRIZE_REGIONS: TemplateRegion[] = [
  {
    key: "header",
    label: "",
    type: "text",
    rel: [0.306, 0.302, 0.435, 0.0375],
  },
  {
    key: "final",
    label: "最终奖",
    type: "fraction",
    rel: [0.102, 0.704, 0.296, 0.0333],
  },
  {
    key: "A",
    label: "A奖",
    type: "fraction",
    rel: [0.102, 0.498, 0.296, 0.0333],
  },
  {
    key: "B",
    label: "B奖",
    type: "fraction",
    rel: [0.421, 0.444, 0.231, 0.0313],
  },
  {
    key: "C",
    label: "C奖",
    type: "fraction",
    rel: [0.676, 0.444, 0.241, 0.0313],
  },
  {
    key: "D",
    label: "D奖",
    type: "fraction",
    rel: [0.421, 0.578, 0.231, 0.0313],
  },
  {
    key: "E",
    label: "E奖",
    type: "fraction",
    rel: [0.676, 0.578, 0.241, 0.0313],
  },
  {
    key: "F",
    label: "F奖",
    type: "fraction",
    rel: [0.421, 0.7125, 0.231, 0.0313],
  },
  {
    key: "G",
    label: "G奖",
    type: "fraction",
    rel: [0.676, 0.7125, 0.241, 0.0313],
  },
];

export const SCALE = 5;
export const WHITE_THRESHOLD = 235;

export function loadImageFromFile(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("圖片載入失敗"));
    };
    img.src = url;
  });
}

// 依相對座標裁切並放大到畫布
function cropRegion(img: HTMLImageElement, region: TemplateRegion) {
  const [rx, ry, rw, rh] = region.rel;
  const sx = rx * img.width;
  const sy = ry * img.height;
  const sw = rw * img.width;
  const sh = rh * img.height;
  const canvas = document.createElement("canvas");

  canvas.width = Math.round(sw * SCALE);
  canvas.height = Math.round(sh * SCALE);

  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  if (!ctx) {
    throw new Error("無法建立畫布");
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

  return { canvas, ctx };
}

function toGray(data: Uint8ClampedArray, i: number) {
  return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
}

function setGray(data: Uint8ClampedArray, i: number, v: number) {
  data[i] = v;
  data[i + 1] = v;
  data[i + 2] = v;
}

// 分數色塊：白字 → 高門檻二值化 + 負片（白字轉黑、其餘轉白，得到白底黑字）
export function binarizeWhitePixels(
  data: Uint8ClampedArray,
  threshold = WHITE_THRESHOLD,
) {
  for (let i = 0; i < data.length; i += 4) {
    setGray(data, i, toGray(data, i) >= threshold ? 0 : 255);
  }

  return data;
}

// 一般文字列：灰階 + 對比拉伸（min-max normalize）
export function normalizePixels(data: Uint8ClampedArray) {
  let min = 255;
  let max = 0;

  for (let i = 0; i < data.length; i += 4) {
    const gray = toGray(data, i);

    setGray(data, i, gray);

    if (gray < min) {
      min = gray;
    }
    if (gray > max) {
      max = gray;
    }
  }

  const range = max - min || 1;

  for (let i = 0; i < data.length; i += 4) {
    setGray(data, i, ((data[i] - min) / range) * 255);
  }

  return data;
}

// 裁切並依區域型別做前處理，回傳可直接送入 OCR 的畫布
export function preprocessRegion(
  img: HTMLImageElement,
  region: TemplateRegion,
) {
  const { canvas, ctx } = cropRegion(img, region);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  if (region.type === "fraction") {
    binarizeWhitePixels(imageData.data);
  } else {
    normalizePixels(imageData.data);
  }

  ctx.putImageData(imageData, 0, 0);

  return canvas;
}

// header 由兩組「數字/數字」重組固定格式，避免中文誤判進入結果
export function formatHeaderLine(raw: string) {
  const nums = raw.match(/\d+\/\d+/g) ?? [];

  return nums.length >= 2
    ? `第${nums[0]}箱 剩余奖励${nums[1]}`
    : raw.replace(/\s+/g, " ").trim();
}

// 將各區域的 OCR 結果組成結構化文字行
export function buildTemplateLines(results: string[]) {
  return PRIZE_REGIONS.map((region, i) => {
    const raw = results[i] ?? "";

    if (region.key === "header") {
      return formatHeaderLine(raw);
    }

    return `${region.label} ${raw.replace(/\s+/g, " ").trim()}`.trim();
  });
}
