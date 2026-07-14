// 遊戲設定登錄表 —— 多遊戲擴充的核心。
// 新增一款遊戲只要在 GAMES 加一個設定物件即可,UI 邏輯(js/app.js)不需改動。
window.GAMES = {
  iidx: {
    id: 'iidx',
    label: 'beatmania IIDX',
    // 回傳歌曲陣列(由 data/iidx-songs.js 提供)
    songs: () => window.IIDX_SONGS || [],
    // 步驟一:模式
    modes: ['SP', 'DP'],
    // 步驟二:難度(name = 顯示用,code = 標題代碼)
    difficulties: [
      { name: 'BEGINNER',    code: 'B' },
      { name: 'NORMAL',      code: 'N' },
      { name: 'HYPER',       code: 'H' },
      { name: 'ANOTHER',     code: 'A' },
      { name: 'LEGGENDARIA', code: 'L' },
    ],
    // 步驟三:Clear 類型
    clears: ['NORMAL CLEAR', 'HARD CLEAR', 'FULL COMBO'],
    // 模糊搜尋要比對的欄位
    searchKeys: ['title', 'artist', 'genre', 'key'],
    // 由 (模式, 難度) 組出 charts 的 key,例如 SP + A => 'SPA'
    chartKey: (mode, diff) => `${mode}${diff.code}`,
    // 產生最終標題
    buildTitle: ({ song, mode, diff, clear }) =>
      `Beatmania IIDX 33 ${song.title} ${mode}${diff.code} ${clear}`,
  },
  // 未來的其他遊戲寫在這裡……
};
