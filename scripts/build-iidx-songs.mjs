#!/usr/bin/env node
// 由 textage.cc 產生 data/iidx-songs.js。
//
// 用法:  node scripts/build-iidx-songs.mjs
//
// 做法(非爬 HTML):
//   1. 抓 textage 兩個資料檔(內容是 Shift_JIS 編碼的 JS 賦值)。
//   2. 用 node:vm 在 sandbox 直接執行,取出 titletbl / actbl 物件
//      (actbl.js 內含 A=10..F=15,執行後 ☆等級已是數字)。
//   3. 以共同 key join,解出每首歌的 charts,輸出成前端用的 data/iidx-songs.js。
//
// actbl 欄位對應(已用已知歌曲校正:冥 SPN5/SPH10/SPA12、Verflucht 有 LEGGENDARIA):
//   SP → BEGINNER=3, NORMAL=5, HYPER=7, ANOTHER=9, LEGGENDARIA=11
//   DP → NORMAL=15, HYPER=17, ANOTHER=19, LEGGENDARIA=21  (DP 無 BEGINNER)
//   值為 0 代表無此譜面。
//
// titletbl 欄位:[0]=首次收錄版本, [3]=曲風, [4]=artist, [5]=曲名, [6]=副標題(選填)

import vm from 'node:vm';
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const TITLE_URL = 'https://textage.cc/score/titletbl.js';
const ACT_URL = 'https://textage.cc/score/actbl.js';

// actbl 欄位索引 → 譜面代碼
const CHART_COLUMNS = {
  SPB: 3, SPN: 5, SPH: 7, SPA: 9, SPL: 11,
  DPN: 15, DPH: 17, DPA: 19, DPL: 21,
};

const OUT_PATH = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'iidx-songs.js');

async function fetchShiftJIS(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`抓取失敗 ${url} → HTTP ${res.status}`);
  const buf = await res.arrayBuffer();
  return new TextDecoder('shift_jis').decode(buf);
}

function evalTables(titleSrc, actSrc) {
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(titleSrc, ctx); // 定義 titletbl
  vm.runInContext(actSrc, ctx);   // 定義 A..F 與 actbl
  if (!ctx.titletbl || !ctx.actbl) throw new Error('解析失敗:找不到 titletbl / actbl');
  return { titletbl: ctx.titletbl, actbl: ctx.actbl };
}

// textage 的曲名/artist 可能夾帶 HTML(如 <font color=...>、<div class=ltmodel>）與 HTML entity,
// 這些只用於它自家網站上色,對我們是雜訊 → 去標籤 + 還原常見 entity。
function cleanText(s) {
  if (typeof s !== 'string') return '';
  return s
    .replace(/<[^>]*>/g, '')                 // 去掉所有 HTML 標籤
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeCharts(actRow) {
  const charts = {};
  for (const [code, idx] of Object.entries(CHART_COLUMNS)) {
    const v = actRow[idx];
    if (typeof v === 'number' && v > 0) charts[code] = v;
  }
  return charts;
}

function buildSongs(titletbl, actbl) {
  const songs = [];
  for (const [key, t] of Object.entries(titletbl)) {
    const title = cleanText(t[5]);
    const actRow = actbl[key];
    if (!title || !Array.isArray(actRow)) continue;
    const charts = decodeCharts(actRow);
    if (Object.keys(charts).length === 0) continue; // 沒有任何譜面 → 略過(課題/非歌曲等)

    const song = {
      key,
      title,
      artist: cleanText(t[4]),
      genre: cleanText(t[3]),
      version: typeof t[0] === 'number' ? t[0] : null,
      charts,
    };
    const subtitle = cleanText(t[6]);
    if (subtitle) song.subtitle = subtitle;
    songs.push(song);
  }
  songs.sort((a, b) => a.title.localeCompare(b.title, 'ja'));
  return songs;
}

async function main() {
  console.log('抓取 textage 資料…');
  const [titleSrc, actSrc] = await Promise.all([
    fetchShiftJIS(TITLE_URL),
    fetchShiftJIS(ACT_URL),
  ]);

  console.log('解析中…');
  const { titletbl, actbl } = evalTables(titleSrc, actSrc);

  const songs = buildSongs(titletbl, actbl);
  if (songs.length === 0) throw new Error('產出 0 首歌,疑似來源格式改變,已中止(未覆蓋現有檔案)');

  const header =
    '// ⚠ 本檔由 scripts/build-iidx-songs.mjs 從 textage.cc 產生,請勿手動編輯。\n' +
    `// 產生曲數:${songs.length}\n` +
    '// charts 的 key = 模式+難度代碼(SP/DP × B/N/H/A/L),value = ☆等級。\n';
  const body = 'window.IIDX_SONGS = ' + JSON.stringify(songs) + ';\n';
  writeFileSync(OUT_PATH, header + body, 'utf-8');

  console.log(`完成:寫入 ${songs.length} 首歌 → ${OUT_PATH}`);
  // 抽查
  const mei = songs.find((s) => s.title === '冥');
  if (mei) console.log('抽查 冥:', JSON.stringify(mei.charts));
}

main().catch((err) => {
  console.error('錯誤:', err.message);
  process.exit(1);
});
