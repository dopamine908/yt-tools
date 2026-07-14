# yt-tools — YouTube 影片標題產生器

產生 rhythm game 影片標題的小工具。純靜態 HTML + CDN,無需安裝或打包。
頂部 nav 以分頁切換遊戲、用 hash 路由(`#iidx`、`#ddr`…),進站預設 **beatmania IIDX**。
目前 IIDX 已實作;DDR / GITADORA / CHUNITHM 為預留空頁。整體 config 驅動,方便擴充。

## 使用

直接用瀏覽器開啟 `index.html`（雙擊即可，資料以 JS 檔載入，不需本機伺服器）。

流程：
1. 選 **模式**（SP / DP）
2. 選 **難度**（BEGINNER / NORMAL / HYPER / ANOTHER / LEGGENDARIA）
3. 選 **Clear**（NORMAL CLEAR / HARD CLEAR / FULL COMBO）
4. **搜尋歌曲**（模糊搜尋，只列出有該模式＋難度譜面的歌，並顯示 ☆ 等級）
5. 點選歌曲 → 出現標題 → 按 **複製標題**

標題格式：`Beatmania IIDX 33 {歌名} {模式}{難度代碼} {Clear}`
例如：`Beatmania IIDX 33 冥 DPA HARD CLEAR`

## 更新歌曲清單

歌曲資料來自 [textage.cc](https://textage.cc/score/)。執行：

```bash
node scripts/build-songs.mjs
```

會抓取 textage 的 `titletbl.js` / `actbl.js`（Shift_JIS），解析後覆寫 `data/iidx-songs.js`。
需要 Node 18+（使用內建 `fetch`）。

## 檔案結構

```
index.html            主頁面（CDN 載入 Tailwind / Alpine.js / Fuse.js）
js/games.js           遊戲設定登錄表（多遊戲擴充核心）
js/app.js             Alpine 元件：狀態、過濾、模糊搜尋、標題、複製
data/iidx-songs.js    歌曲資料（由更新腳本產生，勿手改）
scripts/build-songs.mjs  更新腳本
```

## 資料格式（`data/iidx-songs.js`）

```js
window.IIDX_SONGS = [
  { key, title, artist, genre, version,
    charts: { SPN: 5, SPH: 10, SPA: 12, DPN: 5, DPH: 11, DPA: 12 } }
];
```

`charts` 的 key = 模式＋難度代碼（`SP`/`DP` × `B`/`N`/`H`/`A`/`L`），value = ☆等級；
標題本身不印 ☆，等級僅用於搜尋過濾與顯示。

## 新增其他遊戲

遊戲已列在 `js/games.js` 的 `GAMES` 物件並顯示於 nav。要讓某遊戲從空頁變成可用:
補齊其設定（`modes` / `difficulties` / `clears` / `searchKeys` / `chartKey` /
`buildTitle` / `defaults` / `songs`）並把 `implemented` 設為 `true` 即可，UI 不需改動。
