// 遊戲設定登錄表 —— 多遊戲擴充的核心。
// 新增一款遊戲只要在 GAMES 加一個設定物件即可,UI 邏輯(js/app.js)不需改動。
window.GAMES = {
  iidx: {
    id: 'iidx',
    label: 'beatmania IIDX',
    implemented: true,
    // 回傳歌曲陣列(由 data/iidx-songs.js 提供)
    songs: () => window.IIDX_SONGS || [],
    // 步驟一:模式
    modes: ['SP', 'DP'],
    // 步驟二:難度(name = 顯示用,code = 標題代碼)
    difficulties: [
      { name: 'NORMAL',      code: 'N', color: 'normal' },      // 藍
      { name: 'HYPER',       code: 'H', color: 'hyper' },       // 黃/橘
      { name: 'ANOTHER',     code: 'A', color: 'another' },     // 紅
      { name: 'LEGGENDARIA', code: 'L', color: 'leggendaria' }, // 紫
    ],
    // 步驟三:Clear 類型
    clears: ['NORMAL CLEAR', 'HARD CLEAR', 'FULL COMBO'],
    // 初始預選組合
    defaults: { mode: 'DP', diffCode: 'A', clear: 'HARD CLEAR' },
    // 模糊搜尋要比對的欄位
    searchKeys: ['title', 'artist', 'genre', 'key'],
    // 由 (模式, 難度) 組出 charts 的 key,例如 SP + A => 'SPA'
    chartKey: (mode, diff) => `${mode}${diff.code}`,
    // 產生最終標題
    buildTitle: ({ song, mode, diff, clear }) =>
      `Beatmania IIDX 33 ${song.title} ${mode}${diff.code} ${clear}`,
  },
  // 以下為預留的空頁(尚未實作)。之後補齊設定並把 implemented 設為 true 即可。
  ddr: {
    id: 'ddr',
    label: 'DDR',
    implemented: false,
  },
  gitadora: {
    id: 'gitadora',
    label: 'GITADORA',
    implemented: false,
  },
  chunithm: {
    id: 'chunithm',
    label: 'CHUNITHM',
    implemented: false,
  },
};
