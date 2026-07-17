// 遊戲設定登錄表 —— 多遊戲擴充的核心。
// 每款遊戲用 config 描述:模式 / 難度 / 額外選擇器(selectors) / 搜尋鍵 / 標題組法。
// UI 邏輯(js/app.js)完全依這份設定渲染,新增遊戲通常不需改動 UI。
//
// selectors:難度之後、搜尋之前的額外步驟(下拉/按鈕群)。
//   { key, label, options, optional?, prefix? }
//   - optional:true 時該步驟可用開關關閉,關閉時標題不含此欄。
//   - prefix:顯示與標題會在選項前加上此字串(例如 FLARE)。
// buildTitle({ song, mode, diff, v }):v 是各 selector 組好的字串(關閉的 optional 為空字串)。
// chartKey(mode, diff):組出歌曲 charts 的 key,也是標題用的「難度 token」。
window.GAMES = {
  iidx: {
    id: 'iidx',
    label: 'beatmania IIDX',
    implemented: true,
    songs: () => window.IIDX_SONGS || [],
    modes: ['SP', 'DP'],
    difficulties: [
      { name: 'NORMAL',      code: 'N', color: 'normal' },      // 藍
      { name: 'HYPER',       code: 'H', color: 'hyper' },       // 黃/橘
      { name: 'ANOTHER',     code: 'A', color: 'another' },     // 紅
      { name: 'LEGGENDARIA', code: 'L', color: 'leggendaria' }, // 紫
    ],
    selectors: [
      { key: 'clear', label: 'Clear 類型', options: ['NORMAL CLEAR', 'HARD CLEAR', 'FULL COMBO'] },
    ],
    searchKeys: ['title', 'artist', 'genre', 'key'],
    levelPrefix: '☆', // 搜尋結果等級的前綴顯示
    chartKey: (mode, diff) => `${mode}${diff.code}`, // 例:DPA
    defaults: { mode: 'DP', diffCode: 'A', values: { clear: 'HARD CLEAR' } },
    buildTitle: ({ song, mode, diff, v }) =>
      `Beatmania IIDX 33 ${song.title} ${mode}${diff.code} ${v.clear}`,
  },

  ddr: {
    id: 'ddr',
    label: 'DDR',
    implemented: true,
    songs: () => window.DDR_SONGS || [],
    modes: ['SP', 'DP'],
    difficulties: [
      { name: 'BASIC',     code: 'B', color: 'basic' },     // 黃/金
      { name: 'DIFFICULT', code: 'D', color: 'difficult' }, // 紅
      { name: 'EXPERT',    code: 'E', color: 'expert' },    // 綠
      { name: 'CHALLENGE', code: 'C', color: 'challenge' }, // 紫紅
    ],
    selectors: [
      {
        key: 'grade',
        label: '過關評級',
        options: ['CLEAR', 'LIFE4', 'FULL COMBO', 'GREAT FULL COMBO', 'PERFECT FULL COMBO', 'MARVELOUS FULL COMBO'],
      },
      {
        key: 'flare',
        label: 'FLARE 等級',
        optional: true,
        prefix: 'FLARE ',
        options: ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'EX'],
      },
    ],
    searchKeys: ['title', 'artist', 'key'],
    levelPrefix: 'Lv.', // DDR 用數字等級,非 ☆
    chartKey: (mode, diff) => `${diff.code}${mode}`, // 例:DDP、BSP
    defaults: { mode: 'DP', diffCode: 'D', values: { grade: 'FULL COMBO', flare: 'I' }, optionalOn: { flare: false } },
    buildTitle: ({ song, mode, diff, v }) => {
      const base = `DDR World ${song.title} ${diff.code}${mode} ${v.grade}`;
      return v.flare ? `${base} ${v.flare}` : base;
    },
  },

  // 以下為預留的空頁(尚未實作)。之後補齊設定並把 implemented 設為 true 即可。
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
