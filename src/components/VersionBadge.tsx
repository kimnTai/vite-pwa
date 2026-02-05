export function VersionBadge() {
  const versionNumber = Number(VERSION.split(".").join(""));

  // hash function: 產生穩定數字
  const hashNumber = (num: number) => {
    let hash = 0;
    const str = String(num);
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  };

  // 將數字轉為 HSL 顏色
  const numberToColor = (num: number) => {
    const hue = hashNumber(num) % 360; // 色相 0~359
    return `hsl(${hue}, 70%, 50%)`;
  };

  const color = numberToColor(versionNumber);

  return (
    <h3 className="text-sm font-semibold" style={{ color }}>
      {VERSION}
    </h3>
  );
}
