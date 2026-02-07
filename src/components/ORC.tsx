import { useRef, useState } from "react";
import { recognize } from "tesseract.js";

export default function OCR() {
  const [imagePath, setImagePath] = useState("");
  const [text, setText] = useState("");
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 處理檔案邏輯
  const handleFile = (file: any) => {
    if (file && file.type.startsWith("image/")) {
      setImagePath(URL.createObjectURL(file));
      setText(""); // 上傳新圖時清空舊文字
      setProgress(0);
    } else {
      alert("請上傳有效的圖片檔案！");
    }
  };

  // 拖曳事件處理
  const onDragOver = (e: any) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const onDrop = (e: any) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  // 執行 OCR 辨識
  const handleClick = async () => {
    if (!imagePath) {
      return alert("請先上傳圖片！");
    }

    setIsLoading(true);
    try {
      const result = await recognize(imagePath, "chi_sim", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });
      setText(result.data.text);
    } catch (err) {
      console.error(err);
      alert("辨識失敗，請稍後再試");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10 font-sans text-gray-800">
      <div className="mx-auto max-w-3xl rounded-xl bg-white p-8 shadow-lg">
        <h1 className="mb-8 text-center text-3xl font-bold text-blue-600">
          Tesseract OCR 掃描器
        </h1>

        {/* 拖曳上傳區域 */}
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative cursor-pointer rounded-lg border-2 border-dashed p-10 text-center transition-all ${isDragging ? "scale-[1.02] border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400"} ${imagePath ? "py-6" : "py-20"} `}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFile(e.target.files?.[0])}
            accept="image/*"
            className="hidden"
          />

          {!imagePath ? (
            <div>
              <p className="text-lg text-gray-600">
                將圖片拖曳至此，或點擊上傳
              </p>
              <p className="mt-2 text-sm text-gray-400">支援 JPG, PNG, WebP</p>
            </div>
          ) : (
            <div className="space-y-4">
              <img
                src={imagePath}
                alt="preview"
                className="mx-auto max-h-64 rounded shadow-sm"
              />
              <p className="text-sm font-medium text-blue-500">
                點擊或拖曳以更換圖片
              </p>
            </div>
          )}
        </div>

        {/* 控制按鈕與進度 */}
        <div className="mt-8 flex flex-col items-center gap-4">
          <button
            onClick={handleClick}
            disabled={isLoading || !imagePath}
            className={`w-full rounded-lg px-6 py-3 font-semibold text-white transition-all ${
              isLoading || !imagePath
                ? "cursor-not-allowed bg-gray-400"
                : "bg-blue-600 shadow-md hover:bg-blue-700 active:scale-95"
            } `}
          >
            {isLoading ? `辨識中 (${progress}%)` : "開始辨識文字"}
          </button>

          {/* 進度條容器 */}
          {isLoading && (
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-2.5 bg-blue-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}
        </div>

        {/* 結果顯示區 */}
        <div className="mt-10">
          <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold">
            <span className="h-6 w-1 rounded-full bg-blue-500"></span>
            辨識結果
          </h3>
          <div className="min-h-37.5 w-full rounded-lg border border-gray-200 bg-gray-50 p-4 leading-relaxed whitespace-pre-wrap text-gray-700 shadow-inner">
            {text || (
              <span className="text-gray-400 italic">
                {isLoading ? "正在讀取圖片內容..." : "尚未辨識任何內容"}
              </span>
            )}
          </div>

          {text && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(text);
                alert("已複製！");
              }}
              className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              複製文字內容
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
