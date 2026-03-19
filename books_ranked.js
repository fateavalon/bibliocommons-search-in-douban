(function() {
  var $ = function(id) { return document.getElementById(id); };

  var allBooks = BOOKS;
  var total = allBooks.length;
  var filtered = allBooks.slice();
  var curPage = 1;

  allBooks.forEach(function(b, i) { b._i = i; });

  var searchInput  = $('search');
  var tbody         = $('tbody');
  var statsEl       = $('stats');
  var sizeEl        = $('pageSize');
  var pagTop        = $('paginationTop');
  var pagBot        = $('paginationBottom');
  var advToggle     = $('advToggle');
  var advPanel      = $('advPanel');
  var advBadge      = $('advBadge');
  var ratingMinEl   = $('ratingMin');
  var ratingMaxEl   = $('ratingMax');
  var countMinEl    = $('countMin');
  var yearMinEl     = $('yearMin');
  var yearMaxEl     = $('yearMax');
  var tagSel        = $('tagFilter');
  var honorOnlyEl   = $('honorOnly');
  var libLinkplusEl = $('libLinkplus');
  var libScclEl     = $('libSccl');
  var libSmclEl     = $('libSmcl');
  var advClearBtn   = $('advClear');
  var modalOverlay  = $('modalOverlay');
  var modalCloseBtn = $('modalClose');

  /* --- HTML escape helper --- */
  var _escEl = document.createElement('div');
  function esc(s) { _escEl.textContent = s || ''; return _escEl.innerHTML; }

  var IMG_PROXY = window.IMG_PROXY_BASE || '/douban-img/';
  function coverUrl(url) {
    if (!url) return '';
    if (url.indexOf('doubanio.com') !== -1) return IMG_PROXY + encodeURIComponent(url);
    return url;
  }

  /* --- Tag frequency --- */
  var tagCount = {};
  allBooks.forEach(function(b) {
    if (!b.tags) return;
    b.tags.split(' / ').forEach(function(t) {
      t = t.trim();
      if (t) tagCount[t] = (tagCount[t] || 0) + 1;
    });
  });
  Object.keys(tagCount)
    .sort(function(a, b) { return tagCount[b] - tagCount[a]; })
    .forEach(function(t) {
      var opt = document.createElement('option');
      opt.value = t;
      opt.textContent = t + ' (' + tagCount[t] + ')';
      tagSel.appendChild(opt);
    });

  /* --- Badge class --- */
  function badgeCls(r) {
    return r >= 9 ? 'badge-excellent' : r >= 8 ? 'badge-great' :
           r >= 7 ? 'badge-good' : r >= 6 ? 'badge-ok' : 'badge-low';
  }

  /* --- Stars string --- */
  function stars(r) {
    var full = Math.round(r / 2);
    return '\u2605'.repeat(full) + '\u2606'.repeat(5 - full);
  }

  /* --- Build one table row --- */
  function buildRow(b) {
    var r = parseFloat(b.r) || 0;
    var rc = parseInt(b.rc) || 0;
    var title = esc(b.t || b.ot || '');
    var author = esc(b.a || b.oa || '');
    var year = esc(b.y || '');
    var isbn = esc(b.isbn || '');

    var honorHtml = '';
    if (b.h) {
      b.h.split(' | ').forEach(function(p) {
        p = p.trim();
        if (p) honorHtml += ' <span class="honor-tag">' + esc(p) + '</span>';
      });
    }

    var tagsHtml = '';
    if (b.tags) {
      b.tags.split(' / ').forEach(function(t) {
        t = t.trim();
        if (t) tagsHtml += '<span class="tag-chip" data-tag="' + esc(t) + '">' + esc(t) + '</span> ';
      });
    }

    var lnk = '';
    if (b.di) lnk += '<a href="https://book.douban.com/subject/' + esc(b.di) + '/" target="_blank" title="\u8c46\u74e3">\u8c46</a>';
    if (b.srid) lnk += '<a href="https://sccl.bibliocommons.com/v2/record/' + esc(b.srid) + '" target="_blank" title="SCCL">SC</a>';
    if (b.smrid) lnk += '<a href="https://smcl.bibliocommons.com/v2/record/' + esc(b.smrid) + '" target="_blank" title="SMCL">SM</a>';
    if (b.rid) lnk += '<a href="https://csul.iii.com/record=' + esc(b.rid) + '" target="_blank" title="LINK+">L+</a>';

    var authorCell = author;
    if (b.a) {
      authorCell = '<a href="https://search.douban.com/book/subject_search?search_text=' +
        encodeURIComponent(b.a) + '" target="_blank" rel="noopener">' + author + '</a>';
    }

    return '<tr data-bi="' + b._i + '">' +
      '<td class="col-rank">' + (b._i + 1) + '</td>' +
      '<td class="col-title"><a href="#">' + title + '</a>' + honorHtml + '</td>' +
      '<td class="col-author">' + authorCell + '</td>' +
      '<td class="col-year">' + year + '</td>' +
      '<td class="col-rating"><span class="badge ' + badgeCls(r) + '">' + r.toFixed(1) + '</span></td>' +
      '<td class="col-count">' + rc.toLocaleString() + '</td>' +
      '<td class="col-tags">' + tagsHtml + '</td>' +
      '<td class="col-isbn">' + isbn + '</td>' +
      '<td class="col-links">' + lnk + '</td>' +
      '</tr>';
  }

  /* =========== Filtering =========== */

  function countActive() {
    var n = 0;
    if (ratingMinEl.value) n++;
    if (ratingMaxEl.value) n++;
    if (countMinEl.value) n++;
    if (yearMinEl.value) n++;
    if (yearMaxEl.value) n++;
    if (tagSel.value) n++;
    if (honorOnlyEl.checked) n++;
    if (!libLinkplusEl.checked || !libScclEl.checked || !libSmclEl.checked) n++;
    return n;
  }

  function updateBadge() {
    var n = countActive();
    advBadge.textContent = n;
    advBadge.style.display = n > 0 ? 'inline-block' : 'none';
  }

  function applyFilters() {
    var q    = searchInput.value.toLowerCase().trim();
    var rMin = ratingMinEl.value ? parseFloat(ratingMinEl.value) : null;
    var rMax = ratingMaxEl.value ? parseFloat(ratingMaxEl.value) : null;
    var cMin = countMinEl.value  ? parseInt(countMinEl.value)    : null;
    var yMin = yearMinEl.value   ? parseInt(yearMinEl.value)     : null;
    var yMax = yearMaxEl.value   ? parseInt(yearMaxEl.value)     : null;
    var tag  = tagSel.value;
    var hon  = honorOnlyEl.checked;
    var wantL = libLinkplusEl.checked;
    var wantS = libScclEl.checked;
    var wantM = libSmclEl.checked;
    var libAll = wantL && wantS && wantM;

    filtered = allBooks.filter(function(b) {
      if (q) {
        var text = ((b.t||b.ot||'') + ' ' + (b.a||b.oa||'') + ' ' + (b.pub||'')).toLowerCase();
        if (text.indexOf(q) === -1) return false;
      }
      var r = parseFloat(b.r) || 0;
      if (rMin !== null && r < rMin) return false;
      if (rMax !== null && r > rMax) return false;
      if (cMin !== null && (parseInt(b.rc)||0) < cMin) return false;
      var yr = parseInt(b.y);
      if (yMin !== null && (isNaN(yr) || yr < yMin)) return false;
      if (yMax !== null && (isNaN(yr) || yr > yMax)) return false;
      if (tag && (!b.tags || b.tags.split(' / ').indexOf(tag) === -1)) return false;
      if (hon && !b.h) return false;
      if (!libAll) {
        var lib = b.lib || '';
        if (!wantL && !wantS && !wantM) return false;
        var match = (wantL && lib.indexOf('L') !== -1) ||
                    (wantS && lib.indexOf('S') !== -1) ||
                    (wantM && lib.indexOf('M') !== -1);
        if (!match) return false;
      }
      return true;
    });
    curPage = 1;
    updateBadge();
    render();
  }

  /* =========== Rendering =========== */

  function getPageSize() {
    var v = parseInt(sizeEl.value);
    return v === 0 ? (filtered.length || 1) : v;
  }

  function render() {
    var size  = getPageSize();
    var pages = Math.max(1, Math.ceil(filtered.length / size));
    if (curPage > pages) curPage = pages;
    var start = (curPage - 1) * size;
    var end   = Math.min(start + size, filtered.length);

    var parts = [];
    for (var i = start; i < end; i++) parts.push(buildRow(filtered[i]));
    tbody.innerHTML = parts.join('');

    statsEl.textContent = '\u663e\u793a ' + end + ' / ' + filtered.length +
      (filtered.length < total ? ' (\u7b5b\u9009\u81ea ' + total + ')' : '');
    renderPagination(pages);
  }

  function renderPagination(pages) {
    [pagTop, pagBot].forEach(function(c) {
      c.innerHTML = '';
      if (pages <= 1) return;

      var prev = document.createElement('button');
      prev.textContent = '\u2039 \u4e0a\u4e00\u9875';
      prev.disabled = curPage <= 1;
      prev.onclick = function() { curPage--; render(); window.scrollTo(0,0); };
      c.appendChild(prev);

      var maxB = 7;
      var sp = Math.max(1, curPage - Math.floor(maxB/2));
      var ep = Math.min(pages, sp + maxB - 1);
      if (ep - sp < maxB - 1) sp = Math.max(1, ep - maxB + 1);

      if (sp > 1) {
        c.appendChild(makePageBtn(1));
        if (sp > 2) { var d=document.createElement('span'); d.className='page-info'; d.textContent='\u2026'; c.appendChild(d); }
      }
      for (var p = sp; p <= ep; p++) c.appendChild(makePageBtn(p));
      if (ep < pages) {
        if (ep < pages-1) { var d2=document.createElement('span'); d2.className='page-info'; d2.textContent='\u2026'; c.appendChild(d2); }
        c.appendChild(makePageBtn(pages));
      }

      var next = document.createElement('button');
      next.textContent = '\u4e0b\u4e00\u9875 \u203a';
      next.disabled = curPage >= pages;
      next.onclick = function() { curPage++; render(); window.scrollTo(0,0); };
      c.appendChild(next);
    });
  }

  function makePageBtn(p) {
    var btn = document.createElement('button');
    btn.textContent = p;
    if (p === curPage) btn.className = 'active';
    btn.onclick = function() { curPage = p; render(); window.scrollTo(0,0); };
    return btn;
  }

  /* =========== Sorting =========== */

  var sortDir = 1;
  document.querySelectorAll('th[data-col]').forEach(function(th) {
    th.addEventListener('click', function() {
      var col = this.dataset.col;
      var wasAsc = this.classList.contains('sorted-asc');
      document.querySelectorAll('th').forEach(function(h) {
        h.classList.remove('sorted-asc','sorted-desc');
      });
      this.classList.add(wasAsc ? 'sorted-desc' : 'sorted-asc');
      var dir = wasAsc ? -1 : 1;

      filtered.sort(function(a, b) {
        var va, vb;
        switch(col) {
          case 'rank':   va = a._i; vb = b._i; break;
          case 'title':  va = a.t||a.ot||''; vb = b.t||b.ot||''; break;
          case 'author': va = a.a||a.oa||''; vb = b.a||b.oa||''; break;
          case 'year':   va = parseInt(a.y)||0; vb = parseInt(b.y)||0; break;
          case 'rating': va = parseFloat(a.r)||0; vb = parseFloat(b.r)||0; break;
          case 'count':  va = parseInt(a.rc)||0; vb = parseInt(b.rc)||0; break;
          case 'isbn':   va = a.isbn||''; vb = b.isbn||''; break;
          default:       va = ''; vb = '';
        }
        if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
        return String(va).localeCompare(String(vb), 'zh') * dir;
      });
      curPage = 1;
      render();
    });
  });

  /* =========== Modal =========== */

  function openModal(idx) {
    var b = allBooks[idx];
    if (!b) return;
    var r = parseFloat(b.r) || 0;
    var rc = parseInt(b.rc) || 0;

    $('modalTitle').textContent = b.t || b.ot || '';

    var subEl = $('modalSubtitle');
    subEl.textContent = b.sub || '';
    subEl.style.display = b.sub ? '' : 'none';

    var coverEl = $('modalCover');
    if (b.cv) { coverEl.src = coverUrl(b.cv); coverEl.classList.remove('hide'); }
    else { coverEl.src = ''; coverEl.classList.add('hide'); }

    /* Meta lines */
    var meta = '';
    var author = b.a || b.oa || '';
    if (author) meta += '<span class="ml"><span class="mk">\u4f5c\u8005</span>' + esc(author) + '</span>';
    if (b.tr) meta += '<span class="ml"><span class="mk">\u8bd1\u8005</span>' + esc(b.tr) + '</span>';
    var press = b.press || b.pub || '';
    if (press) meta += '<span class="ml"><span class="mk">\u51fa\u7248\u793e</span>' + esc(press) + '</span>';
    if (b.pd) meta += '<span class="ml"><span class="mk">\u51fa\u7248\u65e5\u671f</span>' + esc(b.pd) + '</span>';
    if (b.pg) meta += '<span class="ml"><span class="mk">\u9875\u6570</span>' + esc(b.pg) + '</span>';
    if (b.pr) meta += '<span class="ml"><span class="mk">\u5b9a\u4ef7</span>' + esc(b.pr) + '</span>';
    if (b.bs) meta += '<span class="ml"><span class="mk">\u4e1b\u4e66</span>' + esc(b.bs) + '</span>';
    if (b.isbn) meta += '<span class="ml"><span class="mk">ISBN</span>' + esc(b.isbn) + '</span>';
    $('modalMeta').innerHTML = meta;

    /* Rating */
    var ratingHtml = '';
    if (r > 0) {
      ratingHtml = '<span class="modal-rating-val" style="color:' + ratingColor(r) + '">' + r.toFixed(1) + '</span>' +
        '<span class="modal-rating-stars">' + stars(r) + '</span>' +
        '<span class="modal-rating-count">' + rc.toLocaleString() + '\u4eba\u8bc4\u4ef7</span>';
    }
    $('modalRating').innerHTML = ratingHtml;

    /* Honors */
    var honHtml = '';
    if (b.h) {
      b.h.split(' | ').forEach(function(p) {
        p = p.trim();
        if (p) honHtml += '<span class="honor-tag">' + esc(p) + '</span> ';
      });
    }
    $('modalHonors').innerHTML = honHtml;

    /* Intro */
    var introSec = $('modalIntroSection');
    if (b.intro) {
      $('modalIntro').textContent = b.intro;
      introSec.classList.remove('hide');
    } else {
      introSec.classList.add('hide');
    }

    /* Tags */
    var tagsSec = $('modalTagsSection');
    var tagsContainer = $('modalTags');
    tagsContainer.innerHTML = '';
    if (b.tags) {
      b.tags.split(' / ').forEach(function(t) {
        t = t.trim();
        if (t) tagsContainer.innerHTML += '<span class="tag-chip">' + esc(t) + '</span>';
      });
      tagsSec.classList.remove('hide');
    } else {
      tagsSec.classList.add('hide');
    }

    /* Links */
    var linksHtml = '';
    if (b.di) linksHtml += '<a class="modal-link-btn douban" href="https://book.douban.com/subject/' + esc(b.di) + '/" target="_blank">\u8c46\u74e3\u9875\u9762</a>';
    if (b.srid) linksHtml += '<a class="modal-link-btn sccl" href="https://sccl.bibliocommons.com/v2/record/' + esc(b.srid) + '" target="_blank">SCCL \u9986\u85cf</a>';
    if (b.smrid) linksHtml += '<a class="modal-link-btn smcl" href="https://smcl.bibliocommons.com/v2/record/' + esc(b.smrid) + '" target="_blank">SMCL \u9986\u85cf</a>';
    if (b.rid) linksHtml += '<a class="modal-link-btn linkplus" href="https://csul.iii.com/record=' + esc(b.rid) + '" target="_blank">LINK+ \u9986\u85cf</a>';
    $('modalLinks').innerHTML = linksHtml;

    modalOverlay.classList.add('open');
    document.body.classList.add('modal-open');
  }

  function ratingColor(r) {
    if (r >= 9) return '#166534';
    if (r >= 8) return '#1e40af';
    if (r >= 7) return '#92400e';
    if (r >= 6) return '#9a3412';
    return '#991b1b';
  }

  function closeModal() {
    modalOverlay.classList.remove('open');
    document.body.classList.remove('modal-open');
  }

  modalCloseBtn.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', function(e) {
    if (e.target === modalOverlay) closeModal();
  });
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modalOverlay.classList.contains('open')) closeModal();
  });

  /* =========== Event listeners =========== */

  advToggle.addEventListener('click', function() {
    advToggle.classList.toggle('open');
    advPanel.classList.toggle('open');
  });

  searchInput.addEventListener('input', applyFilters);
  [ratingMinEl, ratingMaxEl, countMinEl, yearMinEl, yearMaxEl].forEach(function(el) {
    el.addEventListener('input', applyFilters);
  });
  tagSel.addEventListener('change', applyFilters);
  honorOnlyEl.addEventListener('change', applyFilters);
  [libLinkplusEl, libScclEl, libSmclEl].forEach(function(el) {
    el.addEventListener('change', applyFilters);
  });

  advClearBtn.addEventListener('click', function() {
    ratingMinEl.value=''; ratingMaxEl.value='';
    countMinEl.value='';
    yearMinEl.value=''; yearMaxEl.value='';
    tagSel.value=''; honorOnlyEl.checked=false;
    libLinkplusEl.checked=true; libScclEl.checked=true; libSmclEl.checked=true;
    searchInput.value='';
    applyFilters();
  });

  sizeEl.addEventListener('change', function() { curPage=1; render(); });

  /* Delegated clicks on tbody: title links + tag chips */
  tbody.addEventListener('click', function(e) {
    var titleLink = e.target.closest('.col-title a');
    if (titleLink) {
      e.preventDefault();
      var tr = titleLink.closest('tr');
      if (tr) openModal(parseInt(tr.dataset.bi));
      return;
    }
    var chip = e.target.closest('.tag-chip');
    if (chip) {
      var tag = chip.dataset.tag;
      tagSel.value = (tagSel.value === tag) ? '' : tag;
      if (!advPanel.classList.contains('open')) {
        advToggle.classList.add('open');
        advPanel.classList.add('open');
      }
      applyFilters();
    }
  });

  /* --- Init --- */
  render();
})();
