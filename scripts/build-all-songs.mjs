#!/usr/bin/env node
// 更新全部遊戲的歌曲清單:依序執行各 build-<game>-songs.mjs。
//
// 用法:  node scripts/build-all-songs.mjs
//
// 新增遊戲時,只要在下方 SCRIPTS 陣列加一筆即可。
// 每支腳本各自獨立執行(以子行程),其中一支失敗不會中斷其他;
// 最後彙整結果,只要有任一失敗即以非 0 結束。

import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptsDir = dirname(fileURLToPath(import.meta.url));

const SCRIPTS = [
  { name: 'IIDX', file: 'build-iidx-songs.mjs' },
  { name: 'DDR', file: 'build-ddr-songs.mjs' },
];

const results = [];
for (const s of SCRIPTS) {
  console.log(`\n===== 更新 ${s.name}(${s.file})=====`);
  const r = spawnSync(process.execPath, [join(scriptsDir, s.file)], { stdio: 'inherit' });
  results.push({ ...s, ok: r.status === 0 });
}

console.log('\n===== 總結 =====');
for (const r of results) console.log(`${r.ok ? '✅' : '❌'} ${r.name}`);

const failed = results.filter((r) => !r.ok);
if (failed.length) {
  console.error(`\n有 ${failed.length} 個更新失敗:${failed.map((r) => r.name).join('、')}`);
  process.exit(1);
}
console.log('\n全部更新完成。');
