// Alpine 元件:標題產生器邏輯。
// 於 alpine:init 註冊 titleGen()。狀態流程:模式 → 難度 → Clear → 搜尋 → 產生標題 → 複製。
document.addEventListener('alpine:init', () => {
  Alpine.data('titleGen', () => {
   const gameId = 'iidx';
   const defaults = (window.GAMES[gameId] && window.GAMES[gameId].defaults) || {};
   return {
    gameId,
    mode: defaults.mode || '',      // 'SP' | 'DP'
    diffCode: defaults.diffCode || '', // 'N' | 'H' | 'A' | 'L'
    clear: defaults.clear || '',    // Clear 類型字串
    query: '',         // 搜尋字串
    selectedSong: null,
    copied: false,
    _fuse: null,
    _fuseGameId: null,

    // ── 讀取目前遊戲設定 ──
    get game() {
      return window.GAMES[this.gameId];
    },
    get diff() {
      return this.game.difficulties.find((d) => d.code === this.diffCode) || null;
    },
    // 目前選定的譜面 key,例如 'DPA';模式或難度未選則為 null
    get chartKey() {
      if (!this.mode || !this.diff) return null;
      return this.game.chartKey(this.mode, this.diff);
    },

    // ── 選單操作 ──
    setMode(m) {
      this.mode = m;
      this._pruneSelection();
    },
    setDiff(code) {
      this.diffCode = code;
      this._pruneSelection();
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
    // 某首歌在目前 chartKey 下的 ☆等級
    levelOf(song) {
      return this.chartKey ? song.charts[this.chartKey] : null;
    },
    selectSong(song) {
      this.selectedSong = song;
      this.copied = false;
    },

    // ── 標題 ──
    get ready() {
      return !!(this.mode && this.diff && this.clear && this.selectedSong);
    },
    get title() {
      if (!this.ready) return '';
      return this.game.buildTitle({
        song: this.selectedSong,
        mode: this.mode,
        diff: this.diff,
        clear: this.clear,
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
   };
  });
});
