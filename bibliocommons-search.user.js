// ==UserScript==
// @name         BiblioCommons Search in Douban
// @name:zh-CN   豆瓣图书馆馆藏搜索
// @namespace    https://github.com/seanzhang/bibliocommons-search-in-douban
// @version      2.0.0
// @description  Search library catalogs (BiblioCommons + LINK+) from Douban book pages
// @description:zh-CN  在豆瓣读书页面搜索图书馆馆藏（BiblioCommons + LINK+）
// @author       seanzhang
// @license      MIT
// @match        *://book.douban.com/subject/*
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @connect      bibliocommons.com
// @connect      csul.iii.com
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  // ── Built-in library groups ──

  const LINKPLUS_LIB = { name: 'LINK+ (All Members)', id: 'linkplus', type: 'linkplus' };

  const BUILTIN_GROUPS = [
    {
      id: 'linkplus',
      name: 'LINK+',
      libraries: [LINKPLUS_LIB],
    },
    {
      id: 'bay_area',
      name: 'Bay Area (BiblioCommons)',
      libraries: [
        { name: 'San Francisco Public Library', subdomain: 'sfpl' },
        { name: 'San Jos\u00e9 Public Library', subdomain: 'sjpl' },
        { name: 'Oakland Public Library', subdomain: 'oaklandlibrary' },
        { name: 'MARINet (Marin County)', subdomain: 'marinet' },
        { name: 'Santa Clara County Library', subdomain: 'sccl' },
        { name: 'Santa Clara City Library', subdomain: 'sclibrary' },
        { name: 'San Mateo County Libraries', subdomain: 'smcl' },
        { name: 'San Mateo City Library', subdomain: 'smplibrary' },
        { name: 'Alameda County Library', subdomain: 'aclibrary' },
        { name: 'Contra Costa County Library', subdomain: 'ccclib' },
        { name: 'Palo Alto City Library', subdomain: 'paloalto' },
        { name: 'Sunnyvale Public Library', subdomain: 'sunnyvale' },
        { name: 'Menlo Park Library', subdomain: 'menlopark' },
        { name: 'Hayward Public Library', subdomain: 'hayward' },
        { name: 'Livermore Public Library', subdomain: 'livermorelibrary' },
        { name: 'Richmond Public Library', subdomain: 'richmondlibrary' },
        { name: 'Sonoma County Library', subdomain: 'sonoma' },
      ],
    },
    {
      id: 'san_diego',
      name: 'San Diego (BiblioCommons)',
      libraries: [
        { name: 'San Diego Public Library', subdomain: 'sandiego' },
        { name: 'San Diego County Library', subdomain: 'sdcl' },
      ],
    },
  ];

  const ALL_BUILTIN = BUILTIN_GROUPS.flatMap(g => g.libraries);
  const BUILTIN_IDS = new Set(ALL_BUILTIN.map(l => l.subdomain || l.id));

  function libKey(lib) { return lib.subdomain || lib.id; }

  const CONFIG = {
    CACHE_TTL_MS: 24 * 60 * 60 * 1000,
    PANEL_ID: 'bc-search-panel',
    SETTINGS_ID: 'bc-settings-panel',
    DEFAULT_ENABLED: ['sfpl', 'linkplus'],
    DEFAULT_DETAIL_LEVEL: 'medium',
    FORMAT_LABELS: {
      BK: 'Book', EBOOK: 'eBook', AB: 'Audiobook',
      LPRINT: 'Large Print', DVD: 'DVD', BLURAY: 'Blu-ray',
      MUSIC_CD: 'Music CD', MUSIC_DOWNLOAD: 'Music',
      BOOK_CD: 'Book + CD', VIDEO_DOWNLOAD: 'Video',
      MAG_ONLINE: 'Magazine', MN: 'Music Score',
      GRAPHIC_NOVEL: 'Graphic Novel',
    },
  };

  // ── Storage helpers ──

  function migrateOldStorage() {
    if (GM_getValue('bc_migrated_v2')) return;
    try {
      const old = GM_getValue('bc_libraries');
      if (old) {
        const libs = JSON.parse(old);
        const subs = libs.map(l => l.subdomain);
        GM_setValue('bc_enabled', JSON.stringify(subs));
        const custom = libs.filter(l => !BUILTIN_IDS.has(l.subdomain));
        if (custom.length) GM_setValue('bc_custom', JSON.stringify(custom));
      }
    } catch (e) { /* ignore */ }
    GM_setValue('bc_migrated_v2', '1');
  }

  function getEnabled() {
    try {
      const raw = GM_getValue('bc_enabled');
      if (raw) return JSON.parse(raw);
    } catch (e) { /* default */ }
    return [...CONFIG.DEFAULT_ENABLED];
  }

  function setEnabled(subs) {
    GM_setValue('bc_enabled', JSON.stringify(subs));
  }

  function getCustomLibraries() {
    try {
      const raw = GM_getValue('bc_custom');
      if (raw) return JSON.parse(raw);
    } catch (e) { /* default */ }
    return [];
  }

  function setCustomLibraries(libs) {
    GM_setValue('bc_custom', JSON.stringify(libs));
  }

  function getLibraries() {
    const enabled = new Set(getEnabled());
    const result = [];
    for (const lib of ALL_BUILTIN) {
      if (enabled.has(libKey(lib))) result.push(lib);
    }
    for (const lib of getCustomLibraries()) {
      if (enabled.has(lib.subdomain)) result.push(lib);
    }
    return result;
  }

  function getDetailLevel() {
    return GM_getValue('bc_detail_level') || CONFIG.DEFAULT_DETAIL_LEVEL;
  }

  function setDetailLevel(level) {
    GM_setValue('bc_detail_level', level);
  }

  // ── Cache helpers ──

  function cacheGet(key) {
    try {
      const raw = GM_getValue('bc_c_' + key);
      if (!raw) return null;
      const entry = JSON.parse(raw);
      if (Date.now() - entry.ts > CONFIG.CACHE_TTL_MS) return null;
      if (entry.items?.length > 0 && !('status' in entry.items[0])) return null;
      return entry;
    } catch (e) { return null; }
  }

  function cacheSet(key, data) {
    GM_setValue('bc_c_' + key, JSON.stringify({ ...data, ts: Date.now() }));
  }

  // ── Douban page extraction ──

  function extractISBN() {
    const infoEl = document.getElementById('info');
    if (!infoEl) return null;
    const spans = infoEl.querySelectorAll('span.pl');
    for (const span of spans) {
      if (/ISBN/i.test(span.textContent)) {
        let node = span.nextSibling;
        while (node) {
          if (node.nodeType === Node.TEXT_NODE) {
            const m = node.textContent.match(/(\d[\d-]{8,}[\dXx])/);
            if (m) return m[1].replace(/-/g, '');
          }
          if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'BR') break;
          node = node.nextSibling;
        }
      }
    }
    const text = infoEl.textContent;
    const m = text.match(/ISBN[:\s：]*(\d[\d-]{8,}[\dXx])/i);
    return m ? m[1].replace(/-/g, '') : null;
  }

  function extractTitle() {
    const el = document.querySelector('#wrapper h1 span[property="v:itemreviewed"]')
            || document.querySelector('#wrapper h1 span');
    return el?.textContent?.trim() || '';
  }

  // ── BiblioCommons search ──

  function gmFetchHTML(url) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: 'GET',
        url,
        timeout: 15000,
        onload(resp) {
          if (resp.status >= 200 && resp.status < 300) {
            resolve(resp.responseText);
          } else {
            reject(new Error('HTTP ' + resp.status));
          }
        },
        onerror(err) { reject(err); },
        ontimeout() { reject(new Error('timeout')); },
      });
    });
  }

  function parseBiblioState(html) {
    const m = html.match(/<script[^>]*data-iso-key="_0"[^>]*?>([\s\S]*?)<\/script>/);
    if (!m || !m[1].trim()) return null;
    try { return JSON.parse(m[1]); }
    catch (e) { return null; }
  }

  function extractBiblioResults(state) {
    const bibs = state?.entities?.bibs;
    if (!bibs) return { totalCount: 0, items: [] };

    const pagination = state?.search?.catalogSearch?.pagination;
    const totalCount = pagination?.count || Object.keys(bibs).length;

    const items = Object.entries(bibs).map(([id, bib]) => {
      const info = bib?.briefInfo || {};
      const avail = bib?.availability || {};
      const fmt = typeof info.format === 'object'
        ? (info.format?.label || info.format?.id || '')
        : (info.format || '');
      return {
        id,
        title: info.multiscriptTitle || info.title || '',
        authors: Array.isArray(info.authors) ? info.authors : [],
        format: fmt,
        callNumber: info.callNumber || '',
        status: avail.status || '',
        totalCopies: avail.totalCopies || 0,
        availableCopies: avail.availableCopies || 0,
        bibType: avail.bibType || '',
      };
    });

    return { totalCount, items };
  }

  function buildSearchUrl(subdomain, query) {
    return `https://${subdomain}.bibliocommons.com/v2/search?query=${encodeURIComponent(query)}&searchType=smart`;
  }

  async function searchLibrary(subdomain, query) {
    const url = buildSearchUrl(subdomain, query);
    const html = await gmFetchHTML(url);
    const state = parseBiblioState(html);
    if (!state) return { count: 0, totalCount: 0, items: [], searchUrl: url };
    const { totalCount, items } = extractBiblioResults(state);
    return { count: items.length, totalCount, items, searchUrl: url };
  }

  // ── LINK+ search (csul.iii.com — covers all LINK+ member libraries) ──

  function buildLinkPlusUrl(query, isIsbn) {
    if (isIsbn) {
      return `https://csul.iii.com/search~S0?/i?${encodeURIComponent(query)}`;
    }
    return `https://csul.iii.com/search/?searchtype=X&SORT=D&searcharg=${encodeURIComponent(query)}`;
  }

  function parseLinkPlusResults(html, searchUrl) {
    if (/No matches found/i.test(html) || /no entries found/i.test(html)) {
      return { count: 0, totalCount: 0, items: [], searchUrl };
    }

    const countMatch = html.match(/(\d+)\s+results?\s+found/i);
    let totalCount = countMatch ? parseInt(countMatch[1], 10) : 0;

    const entries = [];
    const re = /class="briefcitTitle"[\s\S]*?<a[^>]*>([^<]+)<[\s\S]*?briefcitClear/gi;
    let m;
    while ((m = re.exec(html)) !== null) {
      entries.push({ title: m[1].trim() });
    }

    if (!totalCount && entries.length) totalCount = entries.length;

    if (!totalCount && /bibDisplayTitle/i.test(html)) {
      const titleM = html.match(/bibInfoData[\s\S]*?<strong>([\s\S]*?)<\/strong>/);
      totalCount = 1;
      if (titleM) {
        entries.push({ title: titleM[1].replace(/<[^>]+>/g, '').trim() });
      }
    }

    return {
      count: entries.length,
      totalCount,
      items: entries.map(e => ({
        title: e.title, authors: [], format: '', status: '', totalCopies: 0, availableCopies: 0, bibType: '',
      })),
      searchUrl,
    };
  }

  async function searchLinkPlus(query, isIsbn) {
    const url = buildLinkPlusUrl(query, isIsbn);
    const html = await gmFetchHTML(url);
    return parseLinkPlusResults(html, url);
  }

  // ── Unified search dispatcher ──

  async function searchAnyLibrary(lib, query, isIsbn) {
    if (lib.type === 'linkplus') {
      return searchLinkPlus(query, isIsbn);
    }
    return searchLibrary(lib.subdomain, query);
  }

  function buildAnySearchUrl(lib, query, isIsbn) {
    if (lib.type === 'linkplus') return buildLinkPlusUrl(query, isIsbn);
    return buildSearchUrl(lib.subdomain, query);
  }

  // ── Styles ──

  function injectStyles() {
    if (document.getElementById('bc-injected-styles')) return;
    const style = document.createElement('style');
    style.id = 'bc-injected-styles';
    style.textContent = `
      #${CONFIG.PANEL_ID} {
        background: #fff;
        border: 1px solid #e8e8e8;
        border-radius: 8px;
        margin-bottom: 16px;
        font-size: 13px;
        line-height: 1.5;
        overflow: hidden;
      }
      #${CONFIG.PANEL_ID} .bc-hd {
        display: flex; align-items: center; justify-content: space-between;
        padding: 10px 14px;
        border-bottom: 1px solid #f0f0f0;
        background: #fafafa;
      }
      #${CONFIG.PANEL_ID} .bc-hd-title {
        font-weight: 600; font-size: 14px; color: #111;
      }
      #${CONFIG.PANEL_ID} .bc-hd-actions { display: flex; gap: 4px; }
      #${CONFIG.PANEL_ID} .bc-hd-actions button {
        background: none; border: none; cursor: pointer;
        padding: 2px 5px; font-size: 14px; color: #666;
        border-radius: 4px; transition: background .15s, color .15s;
      }
      #${CONFIG.PANEL_ID} .bc-hd-actions button:hover {
        background: #e8e8e8; color: #111;
      }
      #${CONFIG.PANEL_ID} .bc-bd { padding: 0; }
      .bc-row {
        padding: 10px 14px;
        border-bottom: 1px solid #f5f5f5;
      }
      .bc-row:last-child { border-bottom: none; }
      .bc-row[data-sub="linkplus"] {
        background: #f8f9fa;
        border-bottom: 2px solid #e0e0e0;
      }
      .bc-row-hd {
        display: flex; align-items: center; justify-content: space-between;
      }
      .bc-lib-name { font-weight: 500; color: #111; }
      .bc-status { font-size: 12px; }
      .bc-found { color: #1a7f37; }
      .bc-none { color: #9b9b9b; }
      .bc-err { color: #cf222e; }
      .bc-loading { color: #999; }
      .bc-detail { font-size: 11px; color: #666; margin-top: 3px; }
      .bc-detail-avail { color: #1a7f37; }
      .bc-detail-unavail { color: #cf222e; }
      .bc-link {
        color: #37a; text-decoration: none; font-size: 12px;
      }
      .bc-link:hover { text-decoration: underline; }
      .bc-title-btn {
        display: inline-block; margin-top: 4px;
        padding: 2px 10px; font-size: 12px;
        color: #37a; background: #f0f7ff;
        border: 1px solid #d0e3f7; border-radius: 4px;
        cursor: pointer; transition: background .15s;
      }
      .bc-title-btn:hover { background: #dceeff; }
      .bc-title-btn:disabled { opacity: .5; cursor: default; }
      .bc-title-all {
        display: block; width: 100%; margin-top: 8px;
        padding: 6px 0; font-size: 12px; font-weight: 500;
        color: #fff; background: #37a;
        border: none; border-radius: 4px;
        cursor: pointer; transition: background .15s;
        text-align: center;
      }
      .bc-title-all:hover { background: #2a6090; }
      .bc-title-all:disabled { opacity: .5; cursor: default; }
      .bc-nf-toggle {
        display: flex; align-items: center; gap: 6px;
        padding: 8px 14px; cursor: pointer; user-select: none;
        font-size: 12px; color: #999; border-bottom: 1px solid #f5f5f5;
      }
      .bc-nf-toggle:hover { color: #666; }
      .bc-nf-arrow {
        display: inline-block; font-size: 10px;
        transition: transform .15s;
      }
      .bc-nf-arrow.bc-open { transform: rotate(90deg); }
      .bc-nf-body { display: none; }
      .bc-nf-body.bc-open { display: block; }
      .bc-nf-body .bc-row { padding: 6px 14px; }
      .bc-nf-body .bc-lib-name { font-weight: 400; color: #999; font-size: 12px; }
      /* settings */
      #${CONFIG.SETTINGS_ID} {
        display: none; padding: 12px 14px;
        border-top: 1px solid #e8e8e8; background: #fafafa;
      }
      #${CONFIG.SETTINGS_ID}.bc-show { display: block; }
      .bc-st-title { font-weight: 600; font-size: 13px; color: #111; margin-bottom: 8px; }
      /* collapsible groups */
      .bc-grp { margin-bottom: 6px; }
      .bc-grp-hd {
        display: flex; align-items: center; gap: 6px;
        cursor: pointer; padding: 4px 0; font-size: 12px;
        user-select: none;
      }
      .bc-grp-hd:hover .bc-grp-name { color: #37a; }
      .bc-grp-arrow {
        display: inline-block; width: 12px; text-align: center;
        font-size: 10px; color: #999; transition: transform .15s;
        flex-shrink: 0;
      }
      .bc-grp-arrow.bc-open { transform: rotate(90deg); }
      .bc-grp-cb { margin: 0; cursor: pointer; flex-shrink: 0; }
      .bc-grp-name { font-weight: 600; color: #111; }
      .bc-grp-count { color: #999; margin-left: auto; font-size: 11px; }
      .bc-grp-bd {
        display: none; padding-left: 4px;
      }
      .bc-grp-bd.bc-open { display: block; }
      .bc-chk {
        display: flex; align-items: center; gap: 6px;
        padding: 3px 0; font-size: 12px; color: #333;
      }
      .bc-chk input { margin: 0; cursor: pointer; }
      .bc-chk-sub { color: #999; font-size: 11px; }
      /* custom + detail */
      .bc-st-sep {
        margin-top: 10px; padding-top: 8px;
        border-top: 1px solid #eee;
      }
      .bc-st-sub { font-weight: 600; font-size: 12px; color: #111; margin-bottom: 6px; }
      .bc-st-custom-item {
        display: flex; align-items: center; justify-content: space-between;
        padding: 3px 0; font-size: 12px;
      }
      .bc-st-rm {
        background: none; border: none; cursor: pointer;
        color: #cf222e; font-size: 15px; padding: 0 4px; line-height: 1;
      }
      .bc-st-rm:hover { color: #a31515; }
      .bc-st-add {
        display: grid; grid-template-columns: 1fr 1fr; gap: 6px;
        margin-top: 6px;
      }
      .bc-st-add input {
        padding: 4px 8px; font-size: 12px;
        border: 1px solid #ddd; border-radius: 4px;
        outline: none; min-width: 0;
      }
      .bc-st-add input:focus { border-color: #37a; }
      .bc-st-add button {
        grid-column: 1 / -1;
        padding: 5px 10px; font-size: 12px;
        background: #37a; color: #fff; border: none;
        border-radius: 4px; cursor: pointer;
      }
      .bc-st-add button:hover { background: #2a6496; }
      .bc-st-detail {
        margin-top: 10px; padding-top: 8px;
        border-top: 1px solid #eee;
        display: flex; align-items: center;
        gap: 8px; font-size: 12px; color: #333;
      }
      .bc-st-detail select {
        padding: 2px 6px; font-size: 12px;
        border: 1px solid #ddd; border-radius: 4px;
        flex: 1; min-width: 0;
      }
      @keyframes bc-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: .4; }
      }
      .bc-anim { animation: bc-pulse 1.2s ease-in-out infinite; }
    `;
    document.head.appendChild(style);
  }

  // ── UI: Panel skeleton ──

  function ensurePanel() {
    let panel = document.getElementById(CONFIG.PANEL_ID);
    if (panel) return panel;

    panel = document.createElement('div');
    panel.id = CONFIG.PANEL_ID;
    panel.innerHTML = `
      <div class="bc-hd">
        <span class="bc-hd-title">\u{1F4DA} Library Search</span>
        <div class="bc-hd-actions">
          <button class="bc-btn-refresh" title="Refresh">\u21BB</button>
          <button class="bc-btn-settings" title="Settings">\u2699</button>
        </div>
      </div>
      <div class="bc-bd"></div>
      <div id="${CONFIG.SETTINGS_ID}"></div>
    `;

    const aside = document.querySelector('.aside');
    if (aside) {
      aside.insertBefore(panel, aside.firstChild);
    }
    return panel;
  }

  // ── UI: Render a single library row ──

  function formatLabel(code) {
    return CONFIG.FORMAT_LABELS[code] || code;
  }

  function summarizeAvailability(items) {
    const physical = items.filter(i => i.bibType === 'PHYSICAL' || i.totalCopies > 0);
    const totalCopies = physical.reduce((s, i) => s + i.totalCopies, 0);
    const availCopies = physical.reduce((s, i) => s + i.availableCopies, 0);
    const anyAvailable = items.some(i => i.status === 'AVAILABLE');
    return { totalCopies, availCopies, anyAvailable };
  }

  function renderRow(lib, result, bookTitle) {
    const level = getDetailLevel();
    const row = document.createElement('div');
    row.className = 'bc-row';
    row.dataset.sub = libKey(lib);

    if (!result) {
      row.innerHTML = `<div class="bc-row-hd">
        <span class="bc-lib-name">${esc(lib.name)}</span>
        <span class="bc-status bc-loading bc-anim">searching\u2026</span>
      </div>`;
      return row;
    }

    if (result.error) {
      row.innerHTML = `<div class="bc-row-hd">
        <span class="bc-lib-name">${esc(lib.name)}</span>
        <span class="bc-status bc-err">Error</span>
      </div>`;
      return row;
    }

    const displayCount = result.totalCount || result.count;

    if (displayCount > 0) {
      const { totalCopies, availCopies, anyAvailable } = summarizeAvailability(result.items);

      let statusHTML = '';
      if (level === 'simple') {
        if (anyAvailable) {
          statusHTML = '<span class="bc-status bc-found">\u2713 Available</span>';
        } else {
          statusHTML = '<span class="bc-status" style="color:#e09b24">\u2013 Unavailable</span>';
        }
      } else {
        statusHTML = `<span class="bc-status bc-found">${displayCount} found</span>`;
      }

      let detailHTML = '';
      if (level === 'medium') {
        if (totalCopies > 0) {
          const cls = availCopies > 0 ? 'bc-detail-avail' : 'bc-detail-unavail';
          detailHTML = `<div class="bc-detail"><span class="${cls}">${availCopies}/${totalCopies} copies available</span></div>`;
        }
      } else if (level === 'detailed') {
        const parts = [];
        if (totalCopies > 0) {
          const cls = availCopies > 0 ? 'bc-detail-avail' : 'bc-detail-unavail';
          parts.push(`<span class="${cls}">${availCopies}/${totalCopies} copies available</span>`);
        }
        const fmts = [...new Set(result.items.map(i => formatLabel(i.format)).filter(Boolean))];
        if (fmts.length) {
          parts.push(esc(fmts.join(', ')));
        }
        if (parts.length) {
          detailHTML = `<div class="bc-detail">${parts.join(' \u00B7 ')}</div>`;
        }
      }

      row.innerHTML = `<div class="bc-row-hd">
        <span class="bc-lib-name">${esc(lib.name)}</span>
        ${statusHTML}
      </div>
      ${detailHTML}
      <a class="bc-link" href="${esc(result.searchUrl)}" target="_blank" rel="noopener noreferrer">View in catalog \u2192</a>`;
      return row;
    }

    // No results
    const tag = result.searchType === 'title' ? ' (title)' : '';
    row.innerHTML = `<div class="bc-row-hd">
      <span class="bc-lib-name">${esc(lib.name)}</span>
      <span class="bc-status bc-none">Not found${tag}</span>
    </div>`;

    if (result.searchType !== 'title' && bookTitle) {
      const btn = document.createElement('button');
      btn.className = 'bc-title-btn';
      btn.textContent = 'Search by title';
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        btn.textContent = 'Searching\u2026';
        try {
          const res = await searchAnyLibrary(lib, bookTitle, false);
          res.searchType = 'title';
          cacheSet(`${libKey(lib)}_t_${norm(bookTitle)}`, res);
          row.replaceWith(renderRow(lib, res, bookTitle));
        } catch (e) {
          btn.textContent = 'Error \u2013 retry';
          btn.disabled = false;
        }
      });
      row.appendChild(btn);
    } else {
      const a = document.createElement('a');
      a.className = 'bc-link';
      a.href = buildAnySearchUrl(lib, bookTitle, false);
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = 'Search in catalog \u2192';
      row.appendChild(a);
    }
    return row;
  }

  // ── UI: Settings ──

  function renderSettings(onChanged) {
    const el = document.getElementById(CONFIG.SETTINGS_ID);
    if (!el) return;

    const enabled = new Set(getEnabled());
    const custom = getCustomLibraries();
    const level = getDetailLevel();

    el.innerHTML = `<div class="bc-st-title">Library Settings</div>
      <div class="bc-grp-list"></div>
      <div class="bc-st-sep">
        <div class="bc-st-sub">Custom Libraries</div>
        <div class="bc-custom-list"></div>
        <div class="bc-st-add">
          <input type="text" class="bc-inp-sub" placeholder="subdomain" />
          <input type="text" class="bc-inp-name" placeholder="Display name" />
          <button class="bc-btn-add">+ Add</button>
        </div>
      </div>
      <div class="bc-st-detail">
        <label>Detail level:</label>
        <select class="bc-sel-level">
          <option value="simple"${level === 'simple' ? ' selected' : ''}>Simple</option>
          <option value="medium"${level === 'medium' ? ' selected' : ''}>Medium</option>
          <option value="detailed"${level === 'detailed' ? ' selected' : ''}>Detailed</option>
        </select>
      </div>`;

    // Built-in groups
    const grpList = el.querySelector('.bc-grp-list');
    for (const group of BUILTIN_GROUPS) {
      const allKeys = group.libraries.map(l => libKey(l));
      const enabledInGroup = allKeys.filter(s => enabled.has(s)).length;
      const isFirstGroup = group === BUILTIN_GROUPS[0];

      const grp = document.createElement('div');
      grp.className = 'bc-grp';

      const hd = document.createElement('div');
      hd.className = 'bc-grp-hd';

      const arrow = document.createElement('span');
      arrow.className = 'bc-grp-arrow' + (isFirstGroup ? ' bc-open' : '');
      arrow.textContent = '\u25B6';

      const grpCb = document.createElement('input');
      grpCb.type = 'checkbox';
      grpCb.className = 'bc-grp-cb';
      grpCb.checked = enabledInGroup === allKeys.length;
      grpCb.indeterminate = enabledInGroup > 0 && enabledInGroup < allKeys.length;

      const nameSpan = document.createElement('span');
      nameSpan.className = 'bc-grp-name';
      nameSpan.textContent = group.name;

      const countSpan = document.createElement('span');
      countSpan.className = 'bc-grp-count';
      countSpan.textContent = `${enabledInGroup}/${allKeys.length}`;

      hd.appendChild(arrow);
      hd.appendChild(grpCb);
      hd.appendChild(nameSpan);
      hd.appendChild(countSpan);

      const bd = document.createElement('div');
      bd.className = 'bc-grp-bd' + (isFirstGroup ? ' bc-open' : '');

      function syncGroupState() {
        const cur = new Set(getEnabled());
        const n = allKeys.filter(s => cur.has(s)).length;
        grpCb.checked = n === allKeys.length;
        grpCb.indeterminate = n > 0 && n < allKeys.length;
        countSpan.textContent = `${n}/${allKeys.length}`;
      }

      // Click arrow or name to expand/collapse; click checkbox to toggle group
      hd.addEventListener('click', (e) => {
        if (e.target === grpCb) return;
        arrow.classList.toggle('bc-open');
        bd.classList.toggle('bc-open');
      });

      grpCb.addEventListener('change', () => {
        const cur = new Set(getEnabled());
        const turnOn = grpCb.checked;
        for (const s of allKeys) {
          if (turnOn) cur.add(s); else cur.delete(s);
        }
        setEnabled([...cur]);
        bd.querySelectorAll('input[type="checkbox"]').forEach(cb => { cb.checked = turnOn; });
        syncGroupState();
        onChanged();
      });

      for (const lib of group.libraries) {
        const key = libKey(lib);
        const lbl = document.createElement('label');
        lbl.className = 'bc-chk';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = enabled.has(key);
        cb.addEventListener('change', () => {
          const cur = new Set(getEnabled());
          if (cb.checked) cur.add(key); else cur.delete(key);
          setEnabled([...cur]);
          syncGroupState();
          onChanged();
        });
        lbl.appendChild(cb);
        const span = document.createElement('span');
        span.textContent = lib.name;
        lbl.appendChild(span);
        bd.appendChild(lbl);
      }

      grp.appendChild(hd);
      grp.appendChild(bd);
      grpList.appendChild(grp);
    }

    // Custom libraries
    const customList = el.querySelector('.bc-custom-list');
    custom.forEach((lib, idx) => {
      const item = document.createElement('div');
      item.className = 'bc-st-custom-item';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = enabled.has(lib.subdomain);
      cb.addEventListener('change', () => {
        const cur = new Set(getEnabled());
        if (cb.checked) cur.add(lib.subdomain); else cur.delete(lib.subdomain);
        setEnabled([...cur]);
        onChanged();
      });
      const span = document.createElement('span');
      span.innerHTML = `${esc(lib.name)} <span class="bc-chk-sub">(${esc(lib.subdomain)})</span>`;
      const rm = document.createElement('button');
      rm.className = 'bc-st-rm';
      rm.textContent = '\u00D7';
      rm.addEventListener('click', () => {
        const cur = getCustomLibraries();
        cur.splice(idx, 1);
        setCustomLibraries(cur);
        const en = new Set(getEnabled());
        en.delete(lib.subdomain);
        setEnabled([...en]);
        renderSettings(onChanged);
        onChanged();
      });
      item.appendChild(cb);
      item.appendChild(span);
      item.appendChild(rm);
      customList.appendChild(item);
    });

    // Add custom
    el.querySelector('.bc-btn-add').addEventListener('click', () => {
      const subVal = el.querySelector('.bc-inp-sub').value.trim().toLowerCase().replace(/\.bibliocommons\.com.*/, '');
      const nameVal = el.querySelector('.bc-inp-name').value.trim();
      if (!subVal) return;
      if (BUILTIN_IDS.has(subVal)) return;
      const cur = getCustomLibraries();
      if (cur.some(l => l.subdomain === subVal)) return;
      cur.push({ name: nameVal || subVal.toUpperCase(), subdomain: subVal });
      setCustomLibraries(cur);
      const en = new Set(getEnabled());
      en.add(subVal);
      setEnabled([...en]);
      renderSettings(onChanged);
      onChanged();
    });

    // Detail level
    el.querySelector('.bc-sel-level').addEventListener('change', (e) => {
      setDetailLevel(e.target.value);
      onChanged();
    });
  }

  // ── Utilities ──

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function norm(s) {
    return s.toLowerCase().replace(/\s+/g, '');
  }

  // ── Main search orchestration ──

  function hasResults(res) {
    if (!res || res.error) return false;
    return (res.totalCount || res.count) > 0;
  }

  async function searchAllLibraries(isbn, title, forceRefresh) {
    const panel = ensurePanel();
    const body = panel.querySelector('.bc-bd');
    const libraries = getLibraries();

    if (libraries.length === 0) {
      body.innerHTML = '<div class="bc-row" style="color:#999;text-align:center">No libraries enabled. Click \u2699 to configure.</div>';
      return;
    }

    const resMap = new Map();
    let pending = libraries.length;

    // Show a single loading state
    body.innerHTML = '<div class="bc-row bc-loading bc-anim" style="text-align:center;color:#999">Searching ' + libraries.length + ' libraries\u2026</div>';

    // Resolve cached results first
    const uncached = [];
    for (const lib of libraries) {
      const lk = libKey(lib);
      if (!forceRefresh) {
        const key = isbn ? `${lk}_i_${isbn}` : `${lk}_t_${norm(title)}`;
        const cached = cacheGet(key);
        if (cached) { resMap.set(lk, cached); pending--; continue; }
      }
      uncached.push(lib);
    }

    function rebuild() {
      const found = [];
      const notFound = [];
      const searching = [];

      for (const lib of libraries) {
        const lk = libKey(lib);
        const res = resMap.get(lk);
        if (!res) { searching.push(lib); continue; }
        if (hasResults(res)) { found.push({ lib, res }); }
        else { notFound.push({ lib, res }); }
      }

      // Sort found: LINK+ first, then available, then unavailable
      found.sort((a, b) => {
        const aKey = a.lib.type === 'linkplus' ? -1 : (a.res.items?.some(i => i.status === 'AVAILABLE') ? 0 : 1);
        const bKey = b.lib.type === 'linkplus' ? -1 : (b.res.items?.some(i => i.status === 'AVAILABLE') ? 0 : 1);
        return aKey - bKey;
      });

      body.innerHTML = '';

      // Render found rows
      for (const { lib, res } of found) {
        body.appendChild(renderRow(lib, res, title));
      }

      // Searching indicator
      if (searching.length > 0) {
        const el = document.createElement('div');
        el.className = 'bc-row bc-loading bc-anim';
        el.style.cssText = 'text-align:center;color:#999';
        el.textContent = `Searching ${searching.length} more\u2026`;
        body.appendChild(el);
      }

      // Not-found collapsed group
      if (notFound.length > 0) {
        const wrapper = document.createElement('div');
        const toggle = document.createElement('div');
        toggle.className = 'bc-nf-toggle';
        toggle.innerHTML = `<span class="bc-nf-arrow">\u25B6</span> ${notFound.length} not found`;
        const nfBody = document.createElement('div');
        nfBody.className = 'bc-nf-body';
        toggle.addEventListener('click', () => {
          toggle.querySelector('.bc-nf-arrow').classList.toggle('bc-open');
          nfBody.classList.toggle('bc-open');
        });
        for (const { lib, res } of notFound) {
          nfBody.appendChild(renderRow(lib, res, title));
        }
        wrapper.appendChild(toggle);
        wrapper.appendChild(nfBody);
        body.appendChild(wrapper);
      }

      // "Search all by title" button once done
      if (isbn && title && searching.length === 0) {
        const btn = document.createElement('button');
        btn.className = 'bc-title-all';
        btn.textContent = 'Search all by title';
        btn.addEventListener('click', () => {
          btn.disabled = true;
          btn.textContent = 'Searching\u2026';
          searchAllLibraries(null, title, true).then(() => btn.remove());
        });
        body.appendChild(btn);
      }
    }

    // If we had cached results, render them immediately
    if (resMap.size > 0) rebuild();

    // Fire ALL uncached requests in parallel
    let rebuildTimer = 0;
    function scheduleRebuild() {
      if (rebuildTimer) return;
      rebuildTimer = requestAnimationFrame(() => { rebuildTimer = 0; rebuild(); });
    }

    await Promise.all(uncached.map(async (lib) => {
      const lk = libKey(lib);
      try {
        const query = isbn || title;
        const res = await searchAnyLibrary(lib, query, !!isbn);
        res.searchType = isbn ? 'isbn' : 'title';
        cacheSet(isbn ? `${lk}_i_${isbn}` : `${lk}_t_${norm(title)}`, res);
        resMap.set(lk, res);
      } catch (e) {
        resMap.set(lk, { error: true, count: 0, items: [], searchUrl: buildAnySearchUrl(lib, isbn || title, !!isbn) });
      }
      scheduleRebuild();
    }));

    rebuild();
  }

  // ── Init ──

  function init() {
    migrateOldStorage();

    const isbn = extractISBN();
    const title = extractTitle();
    if (!isbn && !title) return;

    injectStyles();
    const panel = ensurePanel();

    const doSearch = (force) => searchAllLibraries(isbn, title, force);

    panel.querySelector('.bc-btn-settings').addEventListener('click', () => {
      const s = document.getElementById(CONFIG.SETTINGS_ID);
      s.classList.toggle('bc-show');
      if (s.classList.contains('bc-show')) {
        renderSettings(() => doSearch(false));
      }
    });

    panel.querySelector('.bc-btn-refresh').addEventListener('click', () => doSearch(true));

    GM_registerMenuCommand('Manage Libraries', () => {
      const s = document.getElementById(CONFIG.SETTINGS_ID);
      if (s) {
        s.classList.add('bc-show');
        renderSettings(() => doSearch(false));
        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });

    doSearch(false);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
