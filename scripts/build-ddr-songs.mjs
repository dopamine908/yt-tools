#!/usr/bin/env node
// 由 arcade-songs 產生 data/ddr-songs.js。
//
// 用法:  node scripts/build-ddr-songs.mjs
//
// 做法:
//   1. 先抓 arcade-songs 原始碼的 data/sites.json,讀出 ddr 的 dataSourceUrl
//      (較穩健:來源若換 CDN,只要 sites.json 更新即可自動跟上)。
//   2. 抓 `${dataSourceUrl}/data.json`(標準 JSON)。
//   3. 攤平 songs/sheets,依 type(std=SP、dbl=DP)× difficulty 組 charts,輸出 data/ddr-songs.js。
//
// 來源:arcade-songs(https://arcade-songs.zetaraku.dev/,開源 zetaraku/arcade-songs,MIT)。
// 需要 Node 18+(使用內建 fetch)。

import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITES_URL = 'https://raw.githubusercontent.com/zetaraku/arcade-songs/master/data/sites.json';
const GAME_CODE = 'ddr';

// arcade-songs 的 type / difficulty → 我們的代碼
const TYPE_MODE = { std: 'SP', dbl: 'DP' };
const DIFF_CODE = { basic: 'B', difficult: 'D', expert: 'E', challenge: 'C' }; // beginner 不收

const OUT_PATH = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'ddr-songs.js');

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`抓取失敗 ${url} → HTTP ${res.status}`);
  return res.json();
}

async function resolveDataUrl() {
  const sites = await fetchJSON(SITES_URL);
  const site = sites.find((s) => s.gameCode === GAME_CODE);
  if (!site || !site.dataSourceUrl) throw new Error(`sites.json 找不到 gameCode=${GAME_CODE}`);
  return `${site.dataSourceUrl}/data.json`;
}

function buildCharts(sheets) {
  const charts = {};
  for (const sh of sheets || []) {
    const mode = TYPE_MODE[sh.type];
    const code = DIFF_CODE[sh.difficulty];
    if (!mode || !code) continue; // 略過 beginner / 未知類型
    const lvl = typeof sh.levelValue === 'number' ? sh.levelValue : Number(sh.level);
    if (!lvl) continue;
    const key = `${code}${mode}`; // BSP / DDP / ESP …(= 標題的難度縮寫+模式)
    charts[key] = Math.max(charts[key] || 0, lvl); // 同格重複譜面取較高等級
  }
  return charts;
}

function buildSongs(data) {
  const songs = [];
  for (const song of data.songs || []) {
    const title = (song.title || '').trim();
    if (!title) continue;
    const charts = buildCharts(song.sheets);
    if (Object.keys(charts).length === 0) continue;
    songs.push({
      key: song.songId || title,
      title,
      artist: (song.artist || '').trim(),
      version: song.version || null,
      charts,
    });
  }
  songs.sort((a, b) => a.title.localeCompare(b.title, 'ja'));
  return songs;
}

async function main() {
  console.log('讀取 sites.json 取得 DDR 資料來源…');
  const dataUrl = await resolveDataUrl();
  console.log('抓取', dataUrl);
  const data = await fetchJSON(dataUrl);

  const songs = buildSongs(data);
  if (songs.length === 0) throw new Error('產出 0 首歌,疑似來源格式改變,已中止(未覆蓋現有檔案)');

  const header =
    '// ⚠ 本檔由 scripts/build-ddr-songs.mjs 從 arcade-songs 產生,請勿手動編輯。\n' +
    `// 產生曲數:${songs.length}\n` +
    '// charts 的 key = 難度縮寫+模式(B/D/E/C × SP/DP),value = 等級。\n';
  writeFileSync(OUT_PATH, header + 'window.DDR_SONGS = ' + JSON.stringify(songs) + ';\n', 'utf-8');

  console.log(`完成:寫入 ${songs.length} 首歌 → ${OUT_PATH}`);
  const s = songs.find((x) => x.title === 'The Ashes of Boreas');
  if (s) console.log('抽查 The Ashes of Boreas:', JSON.stringify(s.charts));
}

main().catch((err) => {
  console.error('錯誤:', err.message);
  process.exit(1);
});
