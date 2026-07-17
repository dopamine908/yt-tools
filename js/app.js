// Alpine 元件:標題產生器邏輯(依 js/games.js 的設定驅動,支援多遊戲)。
// 流程:模式 → 難度 → 各 selector(如 Clear / 過關評級 / FLARE)→ 搜尋 → 產生標題 → 複製。
document.addEventListener('alpine:init', () => {
  Alpine.data('titleGen', () => ({
    gameId: 'iidx',
    mode: '',          // 'SP' | 'DP'
    diffCode: '',      // 難度代碼
    values: {},        // selectorKey -> 選中的選項
    optionalOn: {},    // selectorKey -> 是否開啟(僅 optional selector)
    query: '',
    selectedSong: null,
    copied: false,
    _fuse: null,
    _fuseGameId: null,

    // ── 初始化 + hash 路由 ──
    init() {
      const fromHash = location.hash.slice(1);
      this.switchGame(window.GAMES[fromHash] ? fromHash : 'iidx');
      window.addEventListener('hashchange', () => {
        const id = location.hash.slice(1);
        if (window.GAMES[id] && id !== this.gameId) this.switchGame(id);
      });
    },
    // 切換遊戲:更新 hash,並以該遊戲的 defaults 重置狀態
    switchGame(id) {
      if (!window.GAMES[id]) return;
      this.gameId = id;
      const d = window.GAMES[id].defaults || {};
      this.mode = d.mode || '';
      this.diffCode = d.diffCode || '';
      this.values = Object.assign({}, d.values);
      this.optionalOn = Object.assign({}, d.optionalOn);
      this.query = '';
      this.selectedSong = null;
      this.copied = false;
      this._fuse = null;
      this._fuseGameId = null;
      if (location.hash.slice(1) !== id) location.hash = id;
    },

    // ── 讀取目前遊戲設定 ──
    get game() {
      return window.GAMES[this.gameId];
    },
    get selectors() {
      return this.game.selectors || [];
    },
    get diff() {
      return (this.game.difficulties || []).find((d) => d.code === this.diffCode) || null;
    },
    // 目前選定的譜面 key,例如 'DPA' / 'EDP';模式或難度未選則為 null
    get chartKey() {
      if (!this.mode || !this.diff || !this.game.chartKey) return null;
      return this.game.chartKey(this.mode, this.diff);
    },

    // ── 選單操作 ──
    setMode(m) {
      this.mode = m;
      this.copied = false;
      this._pruneSelection();
    },
    setDiff(code) {
      this.diffCode = code;
      this.copied = false;
      this._pruneSelection();
    },
    selectOption(key, opt) {
      this.values[key] = opt;
      this.copied = false;
    },
    toggleOptional(key) {
      this.optionalOn[key] = !this.optionalOn[key];
      this.copied = false;
    },
    // 若已選歌曲在新的模式/難度下沒有該譜面,清掉選取
    _pruneSelection() {
      if (this.selectedSong && this.chartKey && !this.selectedSong.charts[this.chartKey]) {
        this.selectedSong = null;
      }
    },

    // ── 搜尋 ──
    _ensureFuse() {
      if (this._fuse && this._fuseGameId === this.gameId) return;
      this._fuse = new Fuse(this.game.songs(), {
        keys: this.game.searchKeys,
        threshold: 0.4,
        ignoreLocation: true,
      });
      this._fuseGameId = this.gameId;
    },
    // 搜尋結果:先依 chartKey 過濾出「有該譜面」的歌,再套用模糊搜尋
    get results() {
      if (!this.chartKey) return [];
      const has = (s) => !!s.charts[this.chartKey];
      let list;
      if (this.query.trim()) {
        this._ensureFuse();
        list = this._fuse.search(this.query.trim()).map((r) => r.item).filter(has);
      } else {
        list = this.game.songs().filter(has);
      }
      return list.slice(0, 50);
    },
    levelOf(song) {
      return this.chartKey ? song.charts[this.chartKey] : null;
    },
    selectSong(song) {
      this.selectedSong = song;
      this.copied = false;
    },

    // ── 標題 ──
    // 各 selector 組好的字串:關閉的 optional 為 ''、否則為 (prefix + 選項)
    get v() {
      const out = {};
      for (const s of this.selectors) {
        if (s.optional && !this.optionalOn[s.key]) { out[s.key] = ''; continue; }
        const val = this.values[s.key];
        out[s.key] = val ? (s.prefix || '') + val : '';
      }
      return out;
    },
    get ready() {
      if (!this.mode || !this.diff || !this.selectedSong) return false;
      for (const s of this.selectors) {
        if (!s.optional && !this.values[s.key]) return false;
      }
      return true;
    },
    get title() {
      if (!this.ready) return '';
      return this.game.buildTitle({
        song: this.selectedSong,
        mode: this.mode,
        diff: this.diff,
        v: this.v,
      });
    },

    // ── 複製 ──
    async copy() {
      if (!this.title) return;
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(this.title);
        } else {
          this._fallbackCopy(this.title);
        }
      } catch (e) {
        this._fallbackCopy(this.title);
      }
      this.copied = true;
      setTimeout(() => (this.copied = false), 1500);
    },
    _fallbackCopy(text) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta);
    },
  }));
});
