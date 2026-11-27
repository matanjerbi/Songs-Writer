// שורה — מחברת שירים חכמה
(function () {
  'use strict';

  // ---------- helpers ----------
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const hasAndroid = () => typeof window.Android !== 'undefined';

  const I = {
    back: '<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>',
    gear: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
    bulb: '<svg viewBox="0 0 24 24"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V17h6v-.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
    search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
    dots: '<svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="12" cy="19" r="1.2"/></svg>',
    focus: '<svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
    undo: '<svg viewBox="0 0 24 24"><path d="M15 14l5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/></svg>',
    redo: '<svg viewBox="0 0 24 24"><path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg>',
    rhyme: '<svg viewBox="0 0 24 24"><path d="M4 6h10M4 12h7M4 18h10"/><circle cx="18" cy="6" r="2"/><circle cx="18" cy="18" r="2"/><path d="M18 8v8"/></svg>',
    spark: '<svg viewBox="0 0 24 24"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/></svg>',
    eye: '<svg viewBox="0 0 24 24"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    dice: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8.5" cy="8.5" r="1"/><circle cx="15.5" cy="15.5" r="1"/><circle cx="12" cy="12" r="1"/></svg>'
  };

  // ---------- storage ----------
  const KEY_POEMS = 'shura.poems', KEY_SET = 'shura.settings';
  function read(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { toast('השמירה נכשלה — אין מקום'); } }

  let poems = read(KEY_POEMS, []);
  let settings = Object.assign({ apiKey: '', model: 'claude-sonnet-5-5', font: 'Frank', size: 21, theme: 'paper', style: '' }, read(KEY_SET, {}));
  const savePoems = () => write(KEY_POEMS, poems);
  const saveSettings = () => { write(KEY_SET, settings); applySettings(); };

  function applySettings() {
    document.body.dataset.theme = settings.theme;
    document.documentElement.style.setProperty('--poem-font', "'" + settings.font + "'");
    document.documentElement.style.setProperty('--poem-size', settings.size + 'px');
  }

  const getPoem = id => poems.find(p => p.id === id);

  function newPoem(fields) {
    const p = Object.assign({ id: uid(), title: '', text: '', tags: [], fav: false, prompt: '', created: Date.now(), updated: Date.now(), versions: [] }, fields || {});
    poems.unshift(p);
    savePoems();
    return p;
  }

  function snapshot(p, force) {
    if (!p || !p.text.trim()) return false;
    const last = p.versions[p.versions.length - 1];
    if (!force && last && last.text === p.text && last.title === p.title) return false;
    p.versions.push({ t: Date.now(), title: p.title, text: p.text });
    if (p.versions.length > 60) p.versions.splice(0, p.versions.length - 60);
    savePoems();
    return true;
  }

  // ---------- state ----------
  const state = { view: 'library', poemId: null, filter: 'all', query: '', analysis: false, focus: false, insp: null, locks: {} };
  const app = $('#app');

  function go(view, extra) {
    if (state.view === 'editor' && view !== 'editor') leaveEditor();
    Object.assign(state, { view }, extra || {});
    render();
  }

  function render() {
    closeSheet();
    if (state.view === 'library') renderLibrary();
    else if (state.view === 'editor') renderEditor();
    else if (state.view === 'inspire') renderInspire();
    else if (state.view === 'settings') renderSettings();
  }

  // ---------- toast ----------
  let toastT;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg; t.classList.remove('hidden');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.add('hidden'), 2200);
  }

  // ---------- sheet ----------
  const sheet = $('#sheet'), backdrop = $('#sheet-backdrop');
  function openSheet(title, html, onMount) {
    sheet.innerHTML = '<div class="sheet-grip"></div><div class="sheet-head"><h2>' + esc(title) + '</h2>' +
      '<button class="icon-btn" data-close>' + I.close + '</button></div><div class="sheet-body">' + html + '</div>';
    sheet.classList.remove('hidden'); backdrop.classList.remove('hidden');
    $('[data-close]', sheet).onclick = closeSheet;
    if (onMount) onMount($('.sheet-body', sheet));
  }
  function closeSheet() { sheet.classList.add('hidden'); backdrop.classList.add('hidden'); sheet.innerHTML = ''; }
  const sheetOpen = () => !sheet.classList.contains('hidden');
  backdrop.onclick = closeSheet;

  function fmtDate(t) {
    const d = new Date(t), now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    const hm = d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    if (sameDay) return 'היום ' + hm;
    const y = new Date(now); y.setDate(now.getDate() - 1);
    if (d.toDateString() === y.toDateString()) return 'אתמול ' + hm;
    return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: d.getFullYear() === now.getFullYear() ? undefined : 'numeric' });
  }

  // =====================================================
  // LIBRARY
  // =====================================================
  function renderLibrary() {
    const tags = Array.from(new Set(poems.flatMap(p => p.tags || []))).sort();
    const daily = Inspire.daily();
    app.innerHTML =
      '<div class="topbar"><h1>שורה<small>מחברת שירים</small></h1>' +
      '<button class="icon-btn" id="b-insp" aria-label="השראה">' + I.bulb + '</button>' +
      '<button class="icon-btn" id="b-set" aria-label="הגדרות">' + I.gear + '</button></div>' +
      '<div class="scroll">' +
      '<div class="search">' + I.search + '<input id="q" placeholder="חיפוש בשירים..." value="' + esc(state.query) + '"></div>' +
      '<div class="chips"><button class="chip' + (state.filter === 'all' ? ' on' : '') + '" data-f="all">הכל</button>' +
      '<button class="chip' + (state.filter === 'fav' ? ' on' : '') + '" data-f="fav">★ מועדפים</button>' +
      tags.map(t => '<button class="chip' + (state.filter === 'tag:' + t ? ' on' : '') + '" data-f="tag:' + esc(t) + '">' + esc(t) + '</button>').join('') +
      '</div>' +
      (state.query || state.filter !== 'all' ? '' :
        '<div class="daily"><div class="label">השראה להיום</div><div class="theme">' + esc(daily.theme) + '</div>' +
        '<div class="sub">מילה לשלב: <b>' + esc(daily.word) + '</b> · ' + esc(daily.constraint) + '</div>' +
        '<div class="row"><button class="btn small" id="b-daily">כתוב על זה</button><button class="btn small ghost" id="b-more">עוד השראה</button></div></div>') +
      '<div id="list"></div></div>' +
      '<button class="fab" id="b-new">' + I.plus + 'שיר חדש</button>';

    $('#b-insp').onclick = () => go('inspire');
    $('#b-set').onclick = () => go('settings');
    $('#b-new').onclick = () => openPoem(newPoem().id);
    const bd = $('#b-daily');
    if (bd) {
      bd.onclick = () => openPoem(newPoem({ prompt: 'נושא: ' + daily.theme + ' · מילה: ' + daily.word + ' · ' + daily.constraint }).id);
      $('#b-more').onclick = () => go('inspire');
    }
    $$('.chip').forEach(c => c.onclick = () => { state.filter = c.dataset.f; renderLibrary(); });
    const q = $('#q');
    q.oninput = () => { state.query = q.value; renderList(); };
    renderList();
  }

  function renderList() {
    const q = state.query.trim();
    let list = poems.slice().sort((a, b) => b.updated - a.updated);
    if (state.filter === 'fav') list = list.filter(p => p.fav);
    else if (state.filter.startsWith('tag:')) { const t = state.filter.slice(4); list = list.filter(p => (p.tags || []).includes(t)); }
    if (q) list = list.filter(p => (p.title + '\n' + p.text + '\n' + (p.tags || []).join(' ')).includes(q));
    const el = $('#list');
    if (!list.length) {
      el.innerHTML = poems.length
        ? '<div class="empty">לא נמצאו שירים</div>'
        : '<div class="empty"><div class="big">הדף ריק, וזה בסדר.</div>כל שיר מתחיל בשורה אחת.<br>לחץ על "שיר חדש" — או על הנורה למעלה כדי לקבל השראה.</div>';
      return;
    }
    el.innerHTML = list.map(p => {
      const lines = p.text.split('\n').filter(l => l.trim());
      const title = p.title || lines[0] || 'שיר ללא שם';
      const prev = (p.title ? lines.slice(0, 2) : lines.slice(1, 3)).join('\n');
      return '<div class="poem-card" data-id="' + p.id + '">' + (p.fav ? '<span class="fav">★</span>' : '') +
        '<h3>' + esc(title) + '</h3>' + (prev ? '<div class="preview">' + esc(prev) + '</div>' : '') +
        '<div class="meta"><span>' + fmtDate(p.updated) + '</span><span>' + lines.length + ' שורות</span>' +
        (p.tags || []).slice(0, 3).map(t => '<span class="tag">' + esc(t) + '</span>').join('') + '</div></div>';
    }).join('');
    $$('.poem-card', el).forEach(c => c.onclick = () => openPoem(c.dataset.id));
  }

  // =====================================================
  // EDITOR
  // =====================================================
  let hist = [], hi = 0, histT, saveT, lastSel = { s: 0, e: 0 };

  function openPoem(id) {
    const p = getPoem(id);
    if (!p) return;
    hist = [p.text]; hi = 0;
    lastSel = { s: p.text.length, e: p.text.length };
    go('editor', { poemId: id, analysis: false, focus: false });
  }

  function cur() { return getPoem(state.poemId); }

  function renderEditor() {
    const p = cur();
    if (!p) return go('library');
    app.innerHTML =
      '<div class="editor' + (state.focus ? ' focus' : '') + '">' +
      '<div class="topbar"><button class="icon-btn" id="e-back">' + I.back + '</button>' +
      '<div class="status" id="status">' + (p.text ? 'נשמר' : '') + '</div>' +
      '<button class="icon-btn" id="e-focus" aria-label="מצב פוקוס">' + I.focus + '</button>' +
      '<button class="icon-btn" id="e-more">' + I.dots + '</button></div>' +
      '<input class="title-input" id="e-title" placeholder="כותרת" value="' + esc(p.title) + '">' +
      (p.prompt ? '<div class="prompt-chip"><span>💡 ' + esc(p.prompt) + '</span><button id="e-prompt-x">' + '✕' + '</button></div>' : '') +
      '<div class="editor-body" id="e-body"></div>' +
      '<div class="toolbar">' +
      '<button class="tool" id="t-undo">' + I.undo + 'בטל</button>' +
      '<button class="tool" id="t-redo">' + I.redo + 'חזור</button>' +
      '<button class="tool" id="t-rhyme">' + I.rhyme + 'חרוזים</button>' +
      '<button class="tool ai" id="t-ai">' + I.spark + 'עוזר</button>' +
      '<button class="tool' + (state.analysis ? ' on' : '') + '" id="t-an">' + I.eye + 'ניתוח</button>' +
      '</div>' +
      (state.focus ? '<button class="icon-btn focus-exit" id="e-unfocus">' + I.close + '</button>' : '') +
      '</div>';

    $('#e-back').onclick = () => go('library');
    $('#e-focus').onclick = () => { state.focus = true; renderEditor(); };
    const uf = $('#e-unfocus'); if (uf) uf.onclick = () => { state.focus = false; renderEditor(); };
    $('#e-more').onclick = moreMenu;
    const px = $('#e-prompt-x'); if (px) px.onclick = () => { p.prompt = ''; savePoems(); renderEditor(); };
    const ti = $('#e-title');
    ti.oninput = () => { p.title = ti.value; queueSave(); };
    ti.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); const ta = $('#e-text'); if (ta) ta.focus(); } };
    $('#t-undo').onclick = undo;
    $('#t-redo').onclick = redo;
    $('#t-rhyme').onclick = () => rhymeSheet();
    $('#t-ai').onclick = aiSheet;
    $('#t-an').onclick = () => { state.analysis = !state.analysis; renderEditor(); };
    renderBody();
  }

  function renderBody() {
    const p = cur(), body = $('#e-body');
    if (state.analysis) { renderAnalysis(p, body); return; }
    body.innerHTML = '<textarea class="poem-text" id="e-text" placeholder="השורה הראשונה..." spellcheck="false" dir="rtl"></textarea>';
    const ta = $('#e-text');
    ta.value = p.text;
    autoGrow(ta);
    const remember = () => { lastSel = { s: ta.selectionStart, e: ta.selectionEnd }; };
    ta.oninput = () => {
      p.text = ta.value; autoGrow(ta); remember(); queueSave();
      clearTimeout(histT); histT = setTimeout(pushHist, 450);
    };
    ['keyup', 'click', 'select', 'blur', 'touchend'].forEach(ev => ta.addEventListener(ev, remember));
    if (!p.text && !p.title) setTimeout(() => ta.focus(), 120);
    else {
      try { ta.setSelectionRange(lastSel.s, lastSel.e); } catch (e) {}
    }
  }

  function autoGrow(ta) {
    ta.style.height = 'auto';
    ta.style.height = (ta.scrollHeight + 2) + 'px';
  }

  function pushHist() {
    const p = cur(); if (!p) return;
    if (hist[hi] === p.text) return;
    hist = hist.slice(0, hi + 1); hist.push(p.text); hi = hist.length - 1;
    if (hist.length > 200) { hist.shift(); hi--; }
  }
  function applyText(text, caret) {
    const p = cur();
    p.text = text; queueSave();
    if (state.analysis) { renderBody(); return; }
    const ta = $('#e-text');
    if (ta) {
      ta.value = text; autoGrow(ta);
      const c = caret == null ? text.length : caret;
      lastSel = { s: c, e: c };
      try { ta.focus(); ta.setSelectionRange(c, c); } catch (e) {}
    }
  }
  function setText(text, caret) { pushHist(); applyText(text, caret); pushHist(); }
  function undo() { pushHist(); if (hi > 0) { hi--; applyText(hist[hi]); } else toast('אין מה לבטל'); }
  function redo() { if (hi < hist.length - 1) { hi++; applyText(hist[hi]); } else toast('אין מה לשחזר'); }

  function queueSave() {
    const st = $('#status'); if (st) st.textContent = '...';
    clearTimeout(saveT);
    saveT = setTimeout(doSave, 500);
  }
  function doSave() {
    const p = cur(); if (!p) return;
    p.updated = Date.now();
    savePoems();
    const st = $('#status'); if (st) st.textContent = 'נשמר';
  }
  window.flushSave = function () {
    if (state.view !== 'editor') return;
    clearTimeout(saveT); doSave();
    const p = cur(); if (p) snapshot(p);
  };

  function leaveEditor() {
    clearTimeout(saveT);
    const p = cur(); if (!p) return;
    if (!p.text.trim() && !p.title.trim()) { poems = poems.filter(x => x.id !== p.id); savePoems(); return; }
    p.updated = Date.now(); savePoems(); snapshot(p);
  }

  // --- cursor helpers ---
  function lineInfo() {
    const text = cur().text;
    const pos = Math.min(lastSel.s, text.length);
    const start = text.lastIndexOf('\n', pos - 1) + 1;
    let end = text.indexOf('\n', pos); if (end < 0) end = text.length;
    return { text, pos, start, end, line: text.slice(start, end) };
  }
  function selectedText() {
    const t = cur().text;
    return lastSel.e > lastSel.s ? t.slice(lastSel.s, lastSel.e) : '';
  }
  function targetWord() {
    const sel = selectedText().trim();
    if (sel && !/\s/.test(sel)) return Rhyme.clean(sel);
    const li = lineInfo();
    if (li.line.trim()) {
      // המילה שהסמן עליה, ואם הוא בסוף שורה — המילה האחרונה
      const rel = li.pos - li.start;
      const left = li.line.slice(0, rel).match(/[^\s]*$/)[0];
      const right = li.line.slice(rel).match(/^[^\s]*/)[0];
      const w = Rhyme.clean(left + right);
      if (w) return w;
      return Rhyme.lastWord(li.line);
    }
    // שורה ריקה — לחרוז עם השורה הקודמת
    const before = li.text.slice(0, li.start).split('\n').filter(l => l.trim());
    return before.length ? Rhyme.lastWord(before[before.length - 1]) : '';
  }
  function insertWord(w) {
    const text = cur().text;
    const s = lastSel.s, e = lastSel.e;
    let ins = w;
    const prev = text[s - 1];
    if (s > 0 && prev && !/\s/.test(prev)) ins = ' ' + ins;
    const next = text[e];
    if (next && !/\s/.test(next)) ins = ins + ' ';
    setText(text.slice(0, s) + ins + text.slice(e), s + ins.length);
  }
  function insertLinesAfterCurrent(lines) {
    const li = lineInfo();
    const t = li.text;
    if (!t.trim()) { setText(lines, lines.length); return; }
    // אם השורה הנוכחית ריקה — כותבים בתוכה
    if (!li.line.trim()) {
      const nt = t.slice(0, li.start) + lines + t.slice(li.end);
      setText(nt, li.start + lines.length); return;
    }
    const nt = t.slice(0, li.end) + '\n' + lines + t.slice(li.end);
    setText(nt, li.end + 1 + lines.length);
  }
  function replaceTarget(newStr) {
    const t = cur().text;
    if (lastSel.e > lastSel.s) {
      setText(t.slice(0, lastSel.s) + newStr + t.slice(lastSel.e), lastSel.s + newStr.length);
    } else {
      const li = lineInfo();
      setText(t.slice(0, li.start) + newStr + t.slice(li.end), li.start + newStr.length);
    }
  }

  // --- analysis view ---
  function renderAnalysis(p, body) {
    const a = Rhyme.analyze(p.text);
    if (!a.words) { body.innerHTML = '<div class="analysis"><div class="empty">אין עדיין מה לנתח — תכתוב כמה שורות.</div></div>'; return; }
    const reps = new Set(a.repeats.map(r => r.w));
    const color = L => 'var(--r' + ((L.charCodeAt(0) - 65) % 6 + 1) + ')';
    const schemes = a.scheme.map((s, i) => '<span class="scheme">' + s + '</span>').join(' · ');
    let html = '<div class="analysis"><div class="a-summary">' +
      '<b>' + a.stanzas + '</b> בתים · <b>' + a.lines.filter(l => !l.empty).length + '</b> שורות · <b>' + a.words + '</b> מילים<br>' +
      'תבנית חריזה: ' + schemes +
      (a.repeats.length ? '<br>מילים שחוזרות: ' + a.repeats.map(r => '<span class="rep">' + esc(r.w) + '</span>×' + r.c).join(' ') : '') +
      '</div>';
    a.lines.forEach((l, n) => {
      if (l.empty) { html += '<div class="a-gap"></div>'; return; }
      const words = l.text.trim().split(/(\s+)/);
      // סימון מילת הסיום ומילים שחוזרות
      let lastIdx = -1;
      for (let i = words.length - 1; i >= 0; i--) if (Rhyme.clean(words[i])) { lastIdx = i; break; }
      const txt = words.map((w, i) => {
        if (/^\s+$/.test(w)) return w;
        let h = esc(w);
        if (reps.has(Rhyme.plain(w))) h = '<span class="rep">' + h + '</span>';
        if (i === lastIdx && !l.alone) h = '<span class="end" style="color:' + color(l.letter) + '">' + h + '</span>';
        return h;
      }).join('');
      html += '<div class="a-line" data-i="' + l.idx + '"><span class="num">' + (n + 1) + '</span>' +
        '<span class="badge' + (l.alone ? ' alone' : '') + '" style="background:' + color(l.letter) + '">' + l.letter + '</span>' +
        '<span class="txt">' + txt + '</span><span class="wc">' + l.wc + '</span></div>';
    });
    html += '<p style="font-family:Heebo;font-size:12px;color:var(--muted);margin-top:18px">שורות עם אותה אות ואותו צבע מתחרזות. מסגרת מקווקוות = שורה בלי חרוז בבית. המספר משמאל = מספר מילים בשורה. לחיצה על שורה תחזיר לעריכה שלה.</p></div>';
    body.innerHTML = html;
    $$('.a-line', body).forEach(el => el.onclick = () => {
      const idx = +el.dataset.i;
      const lines = p.text.split('\n');
      let pos = 0; for (let i = 0; i < idx; i++) pos += lines[i].length + 1;
      pos += lines[idx].length;
      lastSel = { s: pos, e: pos };
      state.analysis = false; renderEditor();
      const ta = $('#e-text'); if (ta) { ta.focus(); ta.setSelectionRange(pos, pos); }
    });
  }

  // --- rhyme sheet ---
  function rhymeSheet(word) {
    word = word || targetWord();
    openSheet('חרוזים', '<div class="field"><input id="r-q" placeholder="מילה לחרוז..." value="' + esc(word) + '">' +
      '<button class="btn ghost" id="r-ai">✨ חכם</button></div><div id="r-res"><div class="loading"><div class="spinner"></div>טוען מילון...</div></div>', b => {
      const q = $('#r-q', b), res = $('#r-res', b);
      const show = () => {
        const w = q.value.trim();
        if (Rhyme.clean(w).length < 2) { res.innerHTML = '<div class="empty">כתוב מילה (לפחות 2 אותיות)</div>'; return; }
        const r = Rhyme.findRhymes(w, 70);
        const grp = (title, arr, strong) => arr.length ? '<div class="group-title">' + title + '</div><div class="words">' +
          arr.map(x => '<button class="word' + (strong ? ' strong' : '') + '">' + esc(x) + '</button>').join('') + '</div>' : '';
        const html = grp('חרוז מלא', r.full, true) + grp('חרוז טוב', r.good) + grp('חרוז חלש (סיומת נפוצה)', r.weak.slice(0, 30));
        res.innerHTML = html || '<div class="empty">לא מצאתי חרוזים במילון.<br>נסה את ✨ חכם — הוא מכיר צירופים ומילים נדירות.</div>';
        bindWords(res);
      };
      const bindWords = el => $$('.word', el).forEach(btn => btn.onclick = () => { closeSheet(); insertWord(btn.textContent); toast('נוסף: ' + btn.textContent); });
      Rhyme.load().then(show).catch(() => { res.innerHTML = '<div class="err">טעינת המילון נכשלה</div>'; });
      let t; q.oninput = () => { clearTimeout(t); t = setTimeout(show, 200); };
      $('#r-ai', b).onclick = async () => {
        const w = q.value.trim(); if (!w) return;
        if (!settings.apiKey) return needKey(res);
        res.innerHTML = loadingHtml('מחפש חרוזים שמתאימים לשיר...');
        try {
          const arr = await AI.Actions.rhymes(cur(), w);
          res.innerHTML = '<div class="group-title">✨ חרוזים בהקשר של השיר</div><div class="words">' +
            arr.map(x => '<button class="word strong">' + esc(String(x)) + '</button>').join('') + '</div>' +
            '<div style="margin-top:12px"><button class="btn small ghost" id="r-back">חזרה למילון</button></div>';
          bindWords(res);
          $('#r-back', res).onclick = show;
        } catch (e) { res.innerHTML = errHtml(e); }
      };
    });
  }

  const loadingHtml = msg => '<div class="loading"><div class="spinner"></div>' + esc(msg) + '</div>';
  function errHtml(e) {
    return '<div class="err">' + esc(e.message === 'NO_KEY' ? 'צריך מפתח API בהגדרות' : e.message) + '</div>';
  }
  function needKey(el) {
    el.innerHTML = '<div class="err">כדי להשתמש בעוזר החכם צריך להכניס מפתח API של Claude בהגדרות.<br>' +
      'מקבלים אותו ב-console.anthropic.com ← API Keys.</div><div style="margin-top:12px"><button class="btn" id="go-set">להגדרות</button></div>';
    $('#go-set', el).onclick = () => go('settings');
  }
  function prose(t) { return esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/^#+\s*/gm, ''); }

  // --- AI sheet ---
  const AI_ITEMS = [
    { k: 'cont', e: '➡️', t: 'תמשיך לי', d: 'הצעות לשורות הבאות' },
    { k: 'reph', e: '🔁', t: 'ניסוח אחר', d: 'לשורה הנוכחית / לקטע מסומן' },
    { k: 'crit', e: '🧐', t: 'ביקורת כנה', d: 'מה עובד, מה חלש, קצב וחריזה' },
    { k: 'img', e: '🌙', t: 'דימויים', d: 'מטפורות ותמונות לשלב' },
    { k: 'stuck', e: '🧭', t: 'תקוע לי', d: 'שאלות שיפתחו כיוון' },
    { k: 'title', e: '🏷️', t: 'כותרת', d: 'הצעות לשם לשיר' },
    { k: 'free', e: '💬', t: 'בקשה חופשית', d: 'כל דבר שתרצה לשאול' },
    { k: 'rhyme', e: '🎯', t: 'חרוז חכם', d: 'למילה שהסמן עליה' }
  ];

  function aiSheet() {
    const p = cur();
    openSheet('✨ עוזר כתיבה', '<div id="ai-main"></div>', b => {
      const main = $('#ai-main', b);
      if (!settings.apiKey) return needKey(main);
      main.innerHTML = '<div class="ai-grid">' + AI_ITEMS.map(x =>
        '<button class="ai-card" data-k="' + x.k + '"><span class="e">' + x.e + '</span><span class="t">' + x.t + '</span><span class="d">' + x.d + '</span></button>').join('') + '</div>';
      $$('.ai-card', main).forEach(c => c.onclick = () => runAI(c.dataset.k, main));
    });
  }

  async function runAI(k, el) {
    const p = cur();
    if (k === 'rhyme') { closeSheet(); return rhymeSheet(); }
    const needText = ['cont', 'reph', 'crit', 'img', 'stuck', 'title'];
    if (needText.includes(k) && !p.text.trim() && k !== 'stuck' && k !== 'img') { el.innerHTML = '<div class="err">צריך לכתוב לפחות שורה אחת קודם.</div>'; return; }
    if (k === 'free') {
      el.innerHTML = '<div class="field"><textarea id="f-q" placeholder="למשל: תהפוך את הבית השני לפחות מתוק / תכתוב גרסה בחריזה ABAB / מה הנושא האמיתי פה?"></textarea></div>' +
        '<button class="btn" id="f-go">שלח</button><div id="f-res" style="margin-top:12px"></div>';
      $('#f-q', el).focus();
      $('#f-go', el).onclick = async () => {
        const q = $('#f-q', el).value.trim(); if (!q) return;
        const r = $('#f-res', el); r.innerHTML = loadingHtml('חושב...');
        try { const t = await AI.Actions.free(p, q); r.innerHTML = '<div class="prose">' + prose(t) + '</div>' + copyBtn(t); bindCopy(r, t); }
        catch (e) { r.innerHTML = errHtml(e); }
      };
      return;
    }
    let target = '';
    if (k === 'reph') {
      target = selectedText().trim() || lineInfo().line.trim();
      if (!target) { el.innerHTML = '<div class="err">שים את הסמן על שורה (או סמן קטע) ואז נסה שוב.</div>'; return; }
    }
    const msgs = { cont: 'כותב המשך...', reph: 'מנסח מחדש...', crit: 'קורא את השיר בעיון...', img: 'מחפש דימויים...', stuck: 'חושב על כיוונים...', title: 'מחפש כותרת...' };
    el.innerHTML = loadingHtml(msgs[k]);
    try {
      if (k === 'crit') {
        const t = await AI.Actions.critique(p);
        el.innerHTML = '<div class="prose">' + prose(t) + '</div>' + copyBtn(t);
        bindCopy(el, t);
        return;
      }
      const fn = { cont: () => AI.Actions.continueLines(p), reph: () => AI.Actions.rephrase(p, target), img: () => AI.Actions.images(p), stuck: () => AI.Actions.unblock(p), title: () => AI.Actions.titles(p) }[k];
      const arr = (await fn()).map(String).filter(Boolean);
      const label = { cont: 'הוסף', reph: 'החלף', img: 'הוסף', stuck: '', title: 'בחר' }[k];
      el.innerHTML = (k === 'reph' ? '<div class="group-title">במקום: "' + esc(target) + '"</div>' : '') +
        arr.map((x, i) => '<div class="option"><div class="otext">' + esc(x) + '</div>' +
          (label ? '<div class="oactions"><button class="btn small" data-i="' + i + '">' + label + '</button></div>' : '') + '</div>').join('') +
        '<button class="btn ghost small" id="ai-again">🎲 עוד הצעות</button>';
      $$('.oactions .btn', el).forEach(btn => btn.onclick = () => {
        const v = arr[+btn.dataset.i];
        closeSheet();
        if (k === 'cont' || k === 'img') insertLinesAfterCurrent(v);
        else if (k === 'reph') replaceTarget(v);
        else if (k === 'title') { p.title = v; savePoems(); const ti = $('#e-title'); if (ti) ti.value = v; }
        toast('✓');
      });
      $('#ai-again', el).onclick = () => runAI(k, el);
    } catch (e) { el.innerHTML = errHtml(e); }
  }

  const copyBtn = () => '<div style="margin-top:12px"><button class="btn small ghost" data-copy>העתק</button></div>';
  function bindCopy(el, t) { const b = $('[data-copy]', el); if (b) b.onclick = () => copy(t); }
  function copy(t) {
    if (navigator.clipboard) navigator.clipboard.writeText(t).then(() => toast('הועתק'), () => fallbackCopy(t));
    else fallbackCopy(t);
  }
  function fallbackCopy(t) {
    const ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); toast('הועתק'); } catch (e) {} ta.remove();
  }

  // --- more menu ---
  function moreMenu() {
    const p = cur();
    const items = [
      ['fav', p.fav ? '★' : '☆', p.fav ? 'הסר ממועדפים' : 'הוסף למועדפים'],
      ['tags', '🏷️', 'תגיות' + (p.tags.length ? ' (' + p.tags.join(', ') + ')' : '')],
      ['ver', '🕰️', 'גרסאות קודמות (' + p.versions.length + ')'],
      ['snap', '📌', 'שמור גרסה עכשיו'],
      ['share', '📤', 'שתף'],
      ['copy', '📋', 'העתק את השיר'],
      ['del', '🗑️', 'מחק שיר']
    ];
    openSheet(p.title || 'שיר', items.map(i => '<button class="menu-item" data-a="' + i[0] + '"><span class="ic">' + i[1] + '</span>' + esc(i[2]) + '</button>').join(''), b => {
      $$('.menu-item', b).forEach(m => m.onclick = () => {
        const a = m.dataset.a;
        if (a === 'fav') { p.fav = !p.fav; savePoems(); closeSheet(); toast(p.fav ? 'נוסף למועדפים' : 'הוסר'); }
        else if (a === 'tags') tagsSheet();
        else if (a === 'ver') versionsSheet();
        else if (a === 'snap') { closeSheet(); toast(snapshot(p, true) ? 'הגרסה נשמרה' : 'אין מה לשמור'); }
        else if (a === 'share') { closeSheet(); share(p); }
        else if (a === 'copy') { closeSheet(); copy(fullText(p)); }
        else if (a === 'del') confirmDelete();
      });
    });
  }
  const fullText = p => (p.title ? p.title + '\n\n' : '') + p.text;
  function share(p) {
    if (hasAndroid()) Android.shareText(p.title || 'שיר', fullText(p));
    else if (navigator.share) navigator.share({ title: p.title, text: fullText(p) }).catch(() => {});
    else copy(fullText(p));
  }
  function confirmDelete() {
    const p = cur();
    openSheet('למחוק את השיר?', '<p>אי אפשר לשחזר אחרי מחיקה (אלא אם יש לך גיבוי).</p><div style="display:flex;gap:8px"><button class="btn danger" id="d-yes">מחק</button><button class="btn ghost" id="d-no">ביטול</button></div>', b => {
      $('#d-no', b).onclick = closeSheet;
      $('#d-yes', b).onclick = () => { poems = poems.filter(x => x.id !== p.id); savePoems(); state.poemId = null; state.view = 'library'; render(); toast('נמחק'); };
    });
  }
  function tagsSheet() {
    const p = cur();
    const all = Array.from(new Set(poems.flatMap(x => x.tags || []).concat(['אהבה', 'געגוע', 'משפחה', 'טיוטה', 'גמור', 'שיר לחן']))).sort();
    const draw = b => {
      b.innerHTML = '<div class="field"><input id="tg" placeholder="תגית חדשה"><button class="btn" id="tg-add">הוסף</button></div>' +
        '<div class="chips" style="flex-wrap:wrap">' + all.map(t => '<button class="chip' + (p.tags.includes(t) ? ' on' : '') + '" data-t="' + esc(t) + '">' + esc(t) + '</button>').join('') + '</div>';
      $$('.chip', b).forEach(c => c.onclick = () => {
        const t = c.dataset.t;
        p.tags = p.tags.includes(t) ? p.tags.filter(x => x !== t) : p.tags.concat(t);
        savePoems(); draw(b);
      });
      $('#tg-add', b).onclick = () => {
        const v = $('#tg', b).value.trim(); if (!v) return;
        if (!all.includes(v)) all.push(v);
        if (!p.tags.includes(v)) p.tags.push(v);
        savePoems(); draw(b);
      };
    };
    openSheet('תגיות', '', draw);
  }
  function versionsSheet() {
    const p = cur();
    const vs = p.versions.slice().reverse();
    openSheet('גרסאות קודמות', vs.length ? vs.map((v, i) =>
      '<div class="list-item"><div class="grow"><div class="sub">' + fmtDate(v.t) + ' · ' + v.text.split('\n').filter(l => l.trim()).length + ' שורות</div>' +
      '<div class="prev">' + esc(v.text.split('\n').find(l => l.trim()) || '') + '</div></div>' +
      '<button class="btn small ghost" data-v="' + i + '">הצג</button></div>').join('')
      : '<div class="empty">אין עדיין גרסאות. גרסה נשמרת אוטומטית בכל פעם שיוצאים מהשיר, או ידנית מהתפריט.</div>', b => {
      $$('[data-v]', b).forEach(btn => btn.onclick = () => {
        const v = vs[+btn.dataset.v];
        openSheet('גרסה מ-' + fmtDate(v.t), '<div class="option"><div class="otext">' + esc((v.title ? v.title + '\n\n' : '') + v.text) + '</div></div>' +
          '<div style="display:flex;gap:8px"><button class="btn" id="v-restore">שחזר גרסה זו</button><button class="btn ghost" id="v-back">חזרה</button></div>', b2 => {
          $('#v-back', b2).onclick = versionsSheet;
          $('#v-restore', b2).onclick = () => {
            snapshot(p, false); // שומרים את הנוכחי לפני השחזור
            p.title = v.title; closeSheet();
            const ti = $('#e-title'); if (ti) ti.value = v.title;
            setText(v.text); toast('שוחזר — הגרסה הקודמת נשמרה');
          };
        });
      });
    });
  }

  // =====================================================
  // INSPIRE
  // =====================================================
  const INSP_KEYS = [['theme', 'נושא'], ['word', 'מילה לשלב'], ['opening', 'פתיחה'], ['constraint', 'אילוץ'], ['image', 'תמונה']];
  function rollInsp(all) {
    if (!state.insp) state.insp = {};
    INSP_KEYS.forEach(([k]) => { if (all || !state.insp[k]) { if (!state.locks[k]) state.insp[k] = Inspire.random(k); } });
  }
  function renderInspire() {
    if (!state.insp) rollInsp(true);
    app.innerHTML = '<div class="topbar"><button class="icon-btn" id="i-back">' + I.back + '</button><h1 style="font-size:24px">השראה</h1></div>' +
      '<div class="scroll"><p style="color:var(--muted);font-size:14px;margin:0 0 12px">לחץ על כרטיס כדי לנעול אותו, 🎲 כדי להחליף רק אותו.</p>' +
      INSP_KEYS.map(([k, n]) => '<div class="insp-card' + (state.locks[k] ? ' locked' : '') + '" data-k="' + k + '"><div class="grow"><div class="k">' + n + (state.locks[k] ? ' 🔒' : '') + '</div>' +
        '<div class="v">' + esc(state.insp[k]) + '</div></div><button class="icon-btn" data-r="' + k + '">' + I.dice + '</button></div>').join('') +
      '<div style="display:flex;gap:8px;margin-top:6px;flex-wrap:wrap"><button class="btn" id="i-start">התחל שיר מזה</button><button class="btn ghost" id="i-all">🎲 ערבב הכל</button>' +
      '<button class="btn ghost" id="i-ai">✨ פתיחות מ-AI</button></div><div id="i-res" style="margin-top:14px"></div></div>';
    $('#i-back').onclick = () => go('library');
    $$('.insp-card').forEach(c => c.onclick = e => {
      if (e.target.closest('[data-r]')) return;
      state.locks[c.dataset.k] = !state.locks[c.dataset.k]; renderInspire();
    });
    $$('[data-r]').forEach(b => b.onclick = () => { state.insp[b.dataset.r] = Inspire.random(b.dataset.r); renderInspire(); });
    $('#i-all').onclick = () => { rollInsp(true); renderInspire(); };
    const promptStr = () => 'נושא: ' + state.insp.theme + ' · מילה: ' + state.insp.word + ' · ' + state.insp.constraint + ' · תמונה: ' + state.insp.image;
    $('#i-start').onclick = () => {
      const opening = state.insp.opening.replace(/\.\.\.$/, '');
      openPoem(newPoem({ prompt: promptStr(), text: opening }).id);
    };
    $('#i-ai').onclick = async () => {
      const r = $('#i-res');
      if (!settings.apiKey) return needKey(r);
      r.innerHTML = loadingHtml('כותב פתיחות...');
      try {
        const arr = (await AI.Actions.fromPrompt(promptStr())).map(String);
        r.innerHTML = arr.map((x, i) => '<div class="option"><div class="otext">' + esc(x) + '</div><div class="oactions"><button class="btn small" data-o="' + i + '">התחל מזה</button></div></div>').join('');
        $$('[data-o]', r).forEach(b => b.onclick = () => openPoem(newPoem({ prompt: promptStr(), text: arr[+b.dataset.o] }).id));
      } catch (e) { r.innerHTML = errHtml(e); }
    };
  }

  // =====================================================
  // SETTINGS
  // =====================================================
  function renderSettings() {
    const seg = (key, opts) => '<div class="seg" data-key="' + key + '">' + opts.map(([v, n]) =>
      '<button class="' + (settings[key] === v ? 'on' : '') + '" data-v="' + v + '">' + n + '</button>').join('') + '</div>';
    app.innerHTML = '<div class="topbar"><button class="icon-btn" id="s-back">' + I.back + '</button><h1 style="font-size:24px">הגדרות</h1></div>' +
      '<div class="scroll">' +
      '<div class="section"><h3>✨ עוזר AI (Claude)</h3><p>מפתח API אישי מ-console.anthropic.com. המפתח נשמר רק בטלפון שלך, והשיר נשלח ל-Claude רק כשאתה לוחץ על פעולה בעוזר.</p>' +
      '<div class="field"><input type="password" id="s-key" placeholder="sk-ant-..." value="' + esc(settings.apiKey) + '" autocomplete="off"></div>' +
      '<select class="text-input" id="s-model">' + [['claude-sonnet-5-5', 'Sonnet 5.5 — מאוזן (מומלץ)'], ['claude-opus-5-5', 'Opus 5.5 — הכי איכותי'], ['claude-haiku-5-5', 'Haiku 5.5 — מהיר וזול']]
        .map(([v, n]) => '<option value="' + v + '"' + (settings.model === v ? ' selected' : '') + '>' + n + '</option>').join('') + '</select>' +
      '<div style="margin-top:10px;display:flex;gap:8px;align-items:center"><button class="btn small" id="s-test">בדוק חיבור</button><span id="s-test-r" style="font-size:13px"></span></div>' +
      '<div class="group-title">ספר לעוזר על הסגנון שלך (לא חובה)</div>' +
      '<div class="field"><textarea id="s-style" placeholder="למשל: אני כותב שירה עברית קצרה, קצת תנ״כית, אוהב חריזה עדינה ולא מתוק מדי">' + esc(settings.style) + '</textarea></div></div>' +
      '<div class="section"><h3>מראה</h3>' + seg('theme', [['paper', 'נייר'], ['white', 'לבן'], ['night', 'לילה']]) +
      '<div class="group-title">גופן לשירים</div>' + seg('font', [['Frank', 'פרנק רוהל'], ['David', 'דוד'], ['Heebo', 'היבו']]) +
      '<div class="group-title">גודל אות: <span id="s-size-v">' + settings.size + '</span></div><input type="range" min="15" max="30" id="s-size" value="' + settings.size + '">' +
      '<div style="font-family:var(--poem-font);font-size:var(--poem-size);margin-top:8px;line-height:1.6">אָנָּה פָּנָה הַדֶּרֶךְ<br>ולאן הולך הלב</div></div>' +
      '<div class="section"><h3>גיבוי</h3><p>כל השירים נשמרים רק בטלפון. מומלץ לייצא גיבוי מדי פעם.</p>' +
      '<div style="display:flex;gap:8px"><button class="btn small" id="s-exp">ייצא גיבוי</button><button class="btn small ghost" id="s-imp">ייבא גיבוי</button></div></div>' +
      '<div class="section"><h3>אודות</h3><p>שורה · ' + poems.length + ' שירים · מילון חרוזים של כ-23,000 מילים, עובד בלי אינטרנט.</p></div>' +
      '</div>';
    $('#s-back').onclick = () => go('library');
    $('#s-key').oninput = e => { settings.apiKey = e.target.value.trim(); saveSettings(); };
    $('#s-model').onchange = e => { settings.model = e.target.value; saveSettings(); };
    $('#s-style').oninput = e => { settings.style = e.target.value; saveSettings(); };
    $$('.seg').forEach(s => $$('button', s).forEach(b => b.onclick = () => { settings[s.dataset.key] = b.dataset.v; saveSettings(); renderSettings(); }));
    $('#s-size').oninput = e => { settings.size = +e.target.value; $('#s-size-v').textContent = settings.size; saveSettings(); };
    $('#s-test').onclick = async () => {
      const r = $('#s-test-r'); r.textContent = 'בודק...';
      try { await AI.call('ענה במילה אחת: שלום', { maxTokens: 10 }); r.textContent = '✓ מחובר'; r.style.color = 'var(--r4)'; }
      catch (e) { r.textContent = e.message === 'NO_KEY' ? 'אין מפתח' : e.message; r.style.color = '#B3261E'; }
    };
    $('#s-exp').onclick = exportBackup;
    $('#s-imp').onclick = () => $('#import-file').click();
  }

  function exportBackup() {
    const json = JSON.stringify({ app: 'shura', v: 1, exported: Date.now(), poems }, null, 1);
    const name = 'shura-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    if (hasAndroid()) Android.saveBackup(name, json);
    else {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
      a.download = name; a.click();
    }
  }
  $('#import-file').onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const data = JSON.parse(r.result);
        const list = Array.isArray(data) ? data : data.poems;
        if (!Array.isArray(list)) throw new Error();
        let added = 0, updated = 0;
        list.forEach(p => {
          if (!p || !p.id || typeof p.text !== 'string') return;
          const ex = getPoem(p.id);
          const norm = Object.assign({ title: '', tags: [], fav: false, prompt: '', versions: [], created: Date.now(), updated: Date.now() }, p);
          if (!ex) { poems.push(norm); added++; }
          else if ((p.updated || 0) > ex.updated) { Object.assign(ex, norm); updated++; }
        });
        savePoems();
        toast('יובאו ' + added + ' שירים חדשים' + (updated ? ', ' + updated + ' עודכנו' : ''));
        renderSettings();
      } catch (err) { toast('הקובץ לא תקין'); }
      e.target.value = '';
    };
    r.readAsText(f);
  };

  // ---------- Android hooks ----------
  window.handleBack = function () {
    if (sheetOpen()) { closeSheet(); return true; }
    if (state.view === 'editor' && state.focus) { state.focus = false; renderEditor(); return true; }
    if (state.view === 'editor' && state.analysis) { state.analysis = false; renderEditor(); return true; }
    if (state.view !== 'library') { go('library'); return true; }
    return false;
  };
  window.receiveShared = function (text) {
    if (!text) return;
    openPoem(newPoem({ text: String(text) }).id);
    toast('נפתח שיר חדש מהטקסט ששותף');
  };

  window.App = { settings: () => settings };

  applySettings();
  render();
  Rhyme.load();
})();
