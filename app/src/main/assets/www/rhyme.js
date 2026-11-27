// מנוע חרוזים וניתוח שיר — עובד בלי אינטרנט
(function (global) {
  const NIQQUD = /[֑-ׇ]/g;
  const FINAL = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };

  // ניקוי מילה: הסרת ניקוד, פיסוק ואותיות לא עבריות
  function clean(w) {
    return (w || '').replace(NIQQUD, '').replace(/[^א-ת]/g, '');
  }

  // אותיות סופיות -> רגילות
  function plain(w) {
    return clean(w).replace(/[ךםןףץ]/g, c => FINAL[c]);
  }

  // מיפוי לפי צליל, כדי שטית ותו, קוף וכף וכו' ייחשבו זהים
  function sound(w) {
    const c = clean(w);
    let out = '';
    for (let i = 0; i < c.length; i++) {
      let ch = c[i];
      const last = i === c.length - 1;
      if (ch === 'ך') ch = 'ח';            // ך סופית נשמעת כמו ח
      else if (FINAL[ch]) ch = FINAL[ch];
      if (ch === 'ט') ch = 'ת';
      else if (ch === 'ק') ch = 'כ';
      else if (ch === 'ע') ch = 'א';
      else if (ch === 'ה' && last) ch = 'א'; // ה סופית = תנועת a
      out += ch;
    }
    return out;
  }

  function commonSuffix(a, b) {
    let n = 0;
    while (n < a.length && n < b.length && a[a.length - 1 - n] === b[b.length - 1 - n]) n++;
    return n;
  }

  // סיומות "זולות" — חרוז של שתי אותיות בהן חלש
  const CHEAP = new Set(['ימ', 'ות', 'ית', 'ינ', 'תי', 'נו', 'תמ', 'תנ', 'יח', 'כמ', 'כנ', 'יו', 'יא', 'הא']);

  // חוזק חרוז בין שתי מילים: 0 = אין, 1 = חלש, 2 = טוב, 3+ = מלא
  function rhymeStrength(a, b) {
    const sa = sound(a), sb = sound(b);
    if (!sa || !sb) return 0;
    const L = commonSuffix(sa, sb);
    if (L >= 3) return Math.min(L, 5);
    if (L === 2) return CHEAP.has(sa.slice(-2)) ? 1 : 2;
    // אות סופית עיצורית זהה (לב/כואב, דרך/לך) — חרוז חלש אבל חרוז
    if (L === 1 && !'אוי'.includes(sa[sa.length - 1])) return 1;
    return 0;
  }

  let WORDS = null;     // מילים לפי שכיחות
  let SOUNDS = null;
  let loading = null;

  function load() {
    if (WORDS) return Promise.resolve();
    if (loading) return loading;
    loading = fetch('words.txt').then(r => r.text()).then(t => {
      WORDS = t.split('\n').map(s => s.trim()).filter(Boolean);
      SOUNDS = WORDS.map(sound);
    });
    return loading;
  }

  function setWords(list) { WORDS = list; SOUNDS = list.map(sound); }

  const PREFIXES = ['ו', 'ה', 'ב', 'ל', 'מ', 'ש', 'כ', 'וה', 'וב', 'ול', 'ומ', 'וש', 'שה', 'שב', 'של', 'כש', 'מה', 'לכ', 'וכ'];
  function isSameWithPrefix(q, c) {
    if (c.length > q.length && c.endsWith(q)) return PREFIXES.includes(c.slice(0, c.length - q.length));
    if (q.length > c.length && q.endsWith(c)) return PREFIXES.includes(q.slice(0, q.length - c.length));
    return false;
  }

  // חיפוש חרוזים למילה. מחזיר קבוצות לפי חוזק
  function findRhymes(word, limit) {
    limit = limit || 80;
    const q = clean(word);
    const qs = sound(q);
    const res = { full: [], good: [], weak: [] };
    if (qs.length < 2 || !WORDS) return res;
    const qp = plain(q);
    const cheap = CHEAP.has(qs.slice(-2));
    for (let i = 0; i < WORDS.length; i++) {
      const s = SOUNDS[i];
      if (s[s.length - 1] !== qs[qs.length - 1]) continue;
      const L = commonSuffix(qs, s);
      if (L < 2) continue;
      const w = WORDS[i];
      const wp = plain(w);
      if (wp === qp || isSameWithPrefix(qp, wp)) continue;
      // מילה שכל כולה היא הסיומת (למשל "ים") — מדלגים כשהיא קצרה מדי
      if (L >= 3 || (L === qs.length && qs.length <= 3)) {
        if (res.full.length < limit) res.full.push({ w, L });
      } else if (!cheap) {
        if (res.good.length < limit) res.good.push({ w, L });
      } else {
        if (res.weak.length < limit) res.weak.push({ w, L });
      }
    }
    // חרוזים ארוכים יותר קודם, בתוך כל רמה לפי שכיחות (הסדר המקורי)
    res.full.sort((a, b) => b.L - a.L);
    return {
      full: res.full.map(x => x.w),
      good: res.good.map(x => x.w),
      weak: res.weak.map(x => x.w)
    };
  }

  function lastWord(line) {
    const words = (line || '').split(/\s+/).map(clean).filter(Boolean);
    return words.length ? words[words.length - 1] : '';
  }

  const STOP = new Set(('של את על לא אני זה זו כי גם עם אם מה כל הוא היא הם הן אבל רק עוד יש אין אז לי לך לו לה לנו ' +
    'שלי שלך שלו שלה אתה את אנחנו אתם כמו עד אל מן אחד אחת היה הייתה היו או כן בו בה בי בך אותי אותך אותו אותה ' +
    'כבר עכשיו פה שם כך ככה מי איך למה כאן רוצה יכול שוב אותם להם מאוד הכל').split(' '));

  // ניתוח מלא של השיר
  function analyze(text) {
    const lines = (text || '').split('\n');
    const out = { lines: [], stanzas: 0, words: 0, chars: 0, repeats: [], scheme: [] };
    let stanza = [];
    let stanzaIdx = -1;
    let inStanza = false;
    const counts = {};

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      const info = { idx, text: line, empty: !trimmed, end: '', letter: '', group: -1, wc: 0 };
      if (!trimmed) {
        inStanza = false;
        out.lines.push(info);
        return;
      }
      if (!inStanza) {
        inStanza = true; stanzaIdx++; stanza = [];
        out.scheme.push('');
      }
      const ws = trimmed.split(/\s+/).map(clean).filter(Boolean);
      info.wc = ws.length;
      out.words += ws.length;
      out.chars += trimmed.length;
      ws.forEach(w => {
        const p = plain(w);
        if (p.length < 2 || STOP.has(w)) return;
        counts[p] = (counts[p] || 0) + 1;
      });
      info.end = ws.length ? ws[ws.length - 1] : '';
      info.stanza = stanzaIdx;
      // חיפוש שורה קודמת בבית שמתחרזת
      let match = null, best = 0;
      for (const prev of stanza) {
        if (!prev.end || !info.end) continue;
        const s = plain(prev.end) === plain(info.end) ? 3 : rhymeStrength(prev.end, info.end);
        if (s > best) { best = s; match = prev; }
      }
      if (match && best >= 1) {
        info.letter = match.letter;
        info.strength = best;
        if (!match.strength) match.strength = best;
      } else {
        const used = new Set(stanza.map(s => s.letter));
        let code = 0;
        while (used.has(String.fromCharCode(65 + code))) code++;
        info.letter = String.fromCharCode(65 + code);
      }
      stanza.push(info);
      out.scheme[stanzaIdx] += info.letter;
      out.lines.push(info);
    });
    out.stanzas = stanzaIdx + 1;
    // שורה שאף אחת לא מתחרזת איתה — מסומנת "X"
    const byStanza = {};
    out.lines.forEach(l => {
      if (l.empty) return;
      const k = l.stanza + ':' + l.letter;
      byStanza[k] = (byStanza[k] || 0) + 1;
    });
    out.lines.forEach(l => { if (!l.empty) l.alone = byStanza[l.stanza + ':' + l.letter] === 1; });
    out.repeats = Object.entries(counts).filter(([w, c]) => c >= 3 || (c >= 2 && w.length >= 4))
      .sort((a, b) => b[1] - a[1]).slice(0, 12).map(([w, c]) => ({ w, c }));
    return out;
  }

  global.Rhyme = { load, setWords, findRhymes, analyze, lastWord, clean, plain, sound, rhymeStrength };
})(typeof window !== 'undefined' ? window : globalThis);
