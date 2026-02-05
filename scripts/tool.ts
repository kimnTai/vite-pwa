export function getBuildVersion() {
  // 版本號db欄位是int長度不足，只能9位
  // 年-24 從0開始，讓他從0開始不補0，2034年時會有問題
  // 分/6取一位

  // rn app 要用8 改版本號前的規則是 月.日.時分，最後玩家的版本大多落在 6.xx.xx 7.xx.xx，為了讓舊用戶都能觸發更新彈窗，需從8開頭設置在後台
  const firstVersion = "1";
  const now = new Date();
  const year = (parseInt(`${now.getFullYear()}`.slice(-2)) - 24).toString(); // 取西元年的末兩位-24
  const month = `0${now.getMonth() + 1}`.slice(-2); // 月份，補零
  const day = `0${now.getDate()}`.slice(-2); // 日期，補零
  const hours = `0${now.getHours()}`.slice(-2); // 時，補零
  const minutes = (now.getMinutes() / 6).toString().slice(0, 1); // 分/6取一位

  const version = `${firstVersion}.${year}${month}${day}.${hours}${minutes}`;

  return version;
}
